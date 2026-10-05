import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
mapboxgl.accessToken = MAPBOX_TOKEN;

// Route colour palette
const ROUTE_COLORS = ["#8b5cf6", "#3b82f6", "#10b981"];
const ROUTE_LABELS = ["Fastest", "Alternative", "Scenic"];

// Disaster type config for map markers
const DISASTER_MAP = {
  flood:          { emoji: '🌊', color: '#3b82f6' },
  fire:           { emoji: '🔥', color: '#ef4444' },
  earthquake:     { emoji: '🌍', color: '#f59e0b' },
  accident:       { emoji: '🚨', color: '#f97316' },
  landslide:      { emoji: '⛰️',  color: '#a16207' },
  power:          { emoji: '⚡', color: '#fbbf24' },
  medical:        { emoji: '🏥', color: '#ec4899' },
  infrastructure: { emoji: '🏗️', color: '#6366f1' },
  other:          { emoji: '⚠️', color: '#94a3b8' },
};

const SEVERITY_COLORS = {
  low:      '#22c55e',
  medium:   '#f59e0b',
  high:     '#f97316',
  critical: '#ef4444',
};

// Debounce helper
function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// Geocode a query → [lng, lat]
async function geocode(query) {
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/` +
    `${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=1`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.features && data.features.length > 0) {
    return data.features[0].center; // [lng, lat]
  }
  return null;
}

// Autocomplete suggestions for a query
async function getSuggestions(query) {
  if (!query || query.length < 2) return [];
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/` +
    `${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=5`;
  const res = await fetch(url);
  const data = await res.json();
  return data.features || [];
}

// Fetch routes from Mapbox Directions
async function fetchRoutes(origin, destination) {
  const coords = `${origin[0]},${origin[1]};${destination[0]},${destination[1]}`;
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving/` +
    `${coords}?alternatives=true&geometries=geojson&overview=full&steps=false` +
    `&access_token=${MAPBOX_TOKEN}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.routes || [];
}

function formatDuration(seconds) {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

// Autocomplete input component
function AutocompleteInput({ id, label, placeholder, value, onChange, onSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const debouncedValue = useDebouncedValue(value);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!debouncedValue) { setSuggestions([]); return; }
    getSuggestions(debouncedValue).then((feats) => {
      setSuggestions(feats);
      setOpen(feats.length > 0);
    });
  }, [debouncedValue]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="route-input-group" ref={wrapRef}>
      <label className="route-input-label" htmlFor={id}>{label}</label>
      <div className="route-input-wrap">
        <input
          id={id}
          className="route-input"
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          autoComplete="off"
        />
        {open && suggestions.length > 0 && (
          <ul className="route-suggestions">
            {suggestions.map((feat) => (
              <li
                key={feat.id}
                className="route-suggestion-item"
                onMouseDown={() => {
                  onSelect(feat.place_name, feat.center);
                  setSuggestions([]);
                  setOpen(false);
                }}
              >
                <span className="suggestion-icon">📍</span>
                <div>
                  <div className="suggestion-name">{feat.text}</div>
                  <div className="suggestion-full">{feat.place_name}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function MapView({ reports = [], onReportClick }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const reportMarkersRef = useRef([]);

  const [originText, setOriginText] = useState("");
  const [destText, setDestText] = useState("");
  const [originCoords, setOriginCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);

  const [routes, setRoutes] = useState([]);
  const [activeRoute, setActiveRoute] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Initialise map once
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [85.3096, 23.3441], // Ranchi
      zoom: 11,
    });
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.current.addControl(new mapboxgl.FullscreenControl(), "top-right");
    // Force repaint after style loads so the map fills its container
    map.current.once("load", () => map.current && map.current.resize());

    return () => {
      if (map.current) { map.current.remove(); map.current = null; }
    };
  }, []);

  // Render report markers whenever the reports list changes
  useEffect(() => {
    if (!map.current) return;

    const renderMarkers = () => {
      // Remove old report markers
      reportMarkersRef.current.forEach((m) => m.remove());
      reportMarkersRef.current = [];

      reports.forEach((report) => {
        if (!report.coords) return;
        const cfg = DISASTER_MAP[report.type] || DISASTER_MAP.other;
        const sevColor = SEVERITY_COLORS[report.severity] || '#94a3b8';

        // Marker element
        const el = document.createElement('div');
        el.style.cssText =
          `width:40px;height:40px;border-radius:50%;display:flex;align-items:center;` +
          `justify-content:center;font-size:20px;background:rgba(7,7,14,0.92);` +
          `border:2.5px solid ${sevColor};box-shadow:0 0 12px ${sevColor}88;` +
          `cursor:pointer;transition:transform 0.15s ease;position:relative;`;
        el.textContent = cfg.emoji;
        el.title = report.title;

        // Pulse ring
        const pulse = document.createElement('div');
        pulse.style.cssText =
          `position:absolute;inset:-6px;border-radius:50%;border:2px solid ${sevColor};` +
          `animation:reportPulse 2s ease-out infinite;opacity:0.6;`;
        el.appendChild(pulse);

        el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.2)'; });
        el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)'; });

        // Popup
        const popupNode = document.createElement('div');
        popupNode.className = 'report-map-popup';
        popupNode.innerHTML = `
          <div class="rmp-header" style="border-left:3px solid ${sevColor}">
            <span style="font-size:1.4rem">${cfg.emoji}</span>
            <div>
              <div class="rmp-title">${report.title}</div>
              <div class="rmp-meta" style="color:${sevColor}">● ${report.severity.toUpperCase()}</div>
            </div>
          </div>
          ${report.description ? `<p class="rmp-desc">${report.description}</p>` : ''}
          <div class="rmp-location">📍 ${report.location || 'Unknown location'}</div>
          <div class="rmp-time">🕐 ${new Date(report.timestamp).toLocaleString()}</div>
        `;

        const popup = new mapboxgl.Popup({
          offset: 20,
          closeButton: true,
          maxWidth: '280px',
        }).setDOMContent(popupNode);

        el.addEventListener('click', () => {
          if (onReportClick) onReportClick(report);
        });

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat(report.coords)
          .setPopup(popup)
          .addTo(map.current);

        reportMarkersRef.current.push(marker);
      });
    };

    if (map.current.isStyleLoaded()) {
      renderMarkers();
    } else {
      map.current.once('load', renderMarkers);
    }
  }, [reports, onReportClick]);

  // Clear map layers + markers
  const clearRoutes = useCallback(() => {
    if (!map.current) return;
    // Remove route layers/sources
    for (let i = 0; i < 3; i++) {
      const id = `route-${i}`;
      if (map.current.getLayer(id)) map.current.removeLayer(id);
      if (map.current.getLayer(`${id}-border`)) map.current.removeLayer(`${id}-border`);
      if (map.current.getSource(id)) map.current.removeSource(id);
    }
    // Remove markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
  }, []);

  // Draw routes on map
  const drawRoutes = useCallback((routeList, active) => {
    if (!map.current) return;
    clearRoutes();

    routeList.forEach((route, i) => {
      const id = `route-${i}`;
      const color = ROUTE_COLORS[i] || "#8b5cf6";
      const isActive = i === active;

      map.current.addSource(id, {
        type: "geojson",
        data: { type: "Feature", geometry: route.geometry },
      });

      // Border/outline for active route
      map.current.addLayer({
        id: `${id}-border`,
        type: "line",
        source: id,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": isActive ? "#ffffff" : "transparent",
          "line-width": isActive ? 8 : 0,
          "line-opacity": 0.25,
        },
      });

      map.current.addLayer({
        id,
        type: "line",
        source: id,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": color,
          "line-width": isActive ? 5 : 3,
          "line-opacity": isActive ? 1 : 0.45,
        },
      });
    });
  }, [clearRoutes]);

  // Add origin/destination markers
  const addMarkers = useCallback((origin, dest) => {
    if (!map.current) return;
    const makeEl = (emoji) => {
      const el = document.createElement("div");
      el.style.cssText =
        "width:36px;height:36px;border-radius:50%;display:flex;align-items:center;" +
        "justify-content:center;font-size:20px;background:rgba(15,15,35,0.9);" +
        "border:2px solid #8b5cf6;box-shadow:0 4px 16px rgba(139,92,246,0.5);cursor:pointer;";
      el.textContent = emoji;
      return el;
    };
    const m1 = new mapboxgl.Marker({ element: makeEl("🟢") }).setLngLat(origin).addTo(map.current);
    const m2 = new mapboxgl.Marker({ element: makeEl("🔴") }).setLngLat(dest).addTo(map.current);
    markersRef.current = [m1, m2];
  }, []);

  // Fit map to route bounds
  const fitBounds = useCallback((routeList) => {
    if (!map.current || routeList.length === 0) return;
    const coords = routeList[0].geometry.coordinates;
    const bounds = coords.reduce(
      (b, c) => b.extend(c),
      new mapboxgl.LngLatBounds(coords[0], coords[0])
    );
    map.current.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 1200 });
  }, []);

  // Handle route search
  const handleSearch = useCallback(async () => {
    setError("");
    let oCoords = originCoords;
    let dCoords = destCoords;

    // Geocode if we have text but no coords (user typed without picking suggestion)
    if (!oCoords && originText) {
      oCoords = await geocode(originText);
      if (oCoords) setOriginCoords(oCoords);
    }
    if (!dCoords && destText) {
      dCoords = await geocode(destText);
      if (dCoords) setDestCoords(dCoords);
    }

    if (!oCoords || !dCoords) {
      setError("Please enter both a starting point and a destination.");
      return;
    }

    setLoading(true);
    try {
      const found = await fetchRoutes(oCoords, dCoords);
      if (!found || found.length === 0) {
        setError("No routes found between these locations.");
        setLoading(false);
        return;
      }

      const capped = found.slice(0, 3);
      setRoutes(capped);
      setActiveRoute(0);

      // Wait for map to be ready before drawing
      const doDraw = () => {
        clearRoutes();
        drawRoutes(capped, 0);
        addMarkers(oCoords, dCoords);
        fitBounds(capped);
      };

      if (map.current.isStyleLoaded()) {
        doDraw();
      } else {
        map.current.once("styledata", doDraw);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch routes. Please try again.");
    }
    setLoading(false);
  }, [originCoords, destCoords, originText, destText, clearRoutes, drawRoutes, addMarkers, fitBounds]);

  // Re-draw when active route changes
  useEffect(() => {
    if (routes.length > 0 && map.current && map.current.isStyleLoaded()) {
      drawRoutes(routes, activeRoute);
    }
  }, [activeRoute, routes, drawRoutes]);

  const handleClear = () => {
    setOriginText(""); setDestText("");
    setOriginCoords(null); setDestCoords(null);
    setRoutes([]); setActiveRoute(0); setError("");
    clearRoutes();
    if (map.current) map.current.flyTo({ center: [85.3096, 23.3441], zoom: 11 });
  };

  return (
    <div className="mapview-root">
      {/* Search Panel */}
      <div className="route-panel">
        <div className="route-panel-title">
          <span>🧭</span> Plan Your Route
        </div>

        <AutocompleteInput
          id="route-origin"
          label="Starting Point"
          placeholder="Enter starting location…"
          value={originText}
          onChange={(v) => { setOriginText(v); setOriginCoords(null); }}
          onSelect={(name, coords) => { setOriginText(name); setOriginCoords(coords); }}
        />

        <div className="route-swap-row">
          <div className="route-connector-line" />
          <button
            className="route-swap-btn"
            title="Swap origin and destination"
            onClick={() => {
              setOriginText(destText); setDestText(originText);
              setOriginCoords(destCoords); setDestCoords(originCoords);
            }}
          >
            ⇅
          </button>
          <div className="route-connector-line" />
        </div>

        <AutocompleteInput
          id="route-dest"
          label="Destination"
          placeholder="Enter destination…"
          value={destText}
          onChange={(v) => { setDestText(v); setDestCoords(null); }}
          onSelect={(name, coords) => { setDestText(name); setDestCoords(coords); }}
        />

        {error && <div className="route-error">{error}</div>}

        <div className="route-actions">
          <button
            className="btn btn-primary btn-full"
            onClick={handleSearch}
            disabled={loading || (!originText && !originCoords) || (!destText && !destCoords)}
            id="find-routes-btn"
          >
            {loading ? <><span className="spinner" /> Finding routes…</> : "🔍 Find Routes"}
          </button>
          {routes.length > 0 && (
            <button className="btn btn-outline btn-full" onClick={handleClear} id="clear-routes-btn">
              ✕ Clear
            </button>
          )}
        </div>

        {/* Route Cards */}
        {routes.length > 0 && (
          <div className="route-cards">
            {routes.map((route, i) => (
              <button
                key={i}
                className={`route-card${activeRoute === i ? " active" : ""}`}
                style={{ "--route-color": ROUTE_COLORS[i] || "#8b5cf6" }}
                onClick={() => setActiveRoute(i)}
              >
                <div className="route-card-header">
                  <span className="route-badge" style={{ background: ROUTE_COLORS[i] || "#8b5cf6" }}>
                    {ROUTE_LABELS[i] || `Route ${i + 1}`}
                  </span>
                  {activeRoute === i && <span className="route-selected-dot">●</span>}
                </div>
                <div className="route-card-stats">
                  <div className="route-stat">
                    <span className="route-stat-icon">⏱</span>
                    <div>
                      <div className="route-stat-value">{formatDuration(route.duration)}</div>
                      <div className="route-stat-label">Duration</div>
                    </div>
                  </div>
                  <div className="route-stat-divider" />
                  <div className="route-stat">
                    <span className="route-stat-icon">📏</span>
                    <div>
                      <div className="route-stat-value">{formatDistance(route.distance)}</div>
                      <div className="route-stat-label">Distance</div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="mapview-map-wrap">
        <div
          ref={mapContainer}
          className="mapview-canvas"
          style={{ width: '100%', height: '600px' }}
        />
        {loading && (
          <div className="map-loading-overlay">
            <div className="map-loader" />
            <p>Calculating routes…</p>
          </div>
        )}
      </div>
    </div>
  );
}