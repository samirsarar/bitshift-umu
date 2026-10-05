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

// Calculate distance in meters between two lat/lng coordinates (Haversine formula)
function getDistanceMeters(lng1, lat1, lng2, lat2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Distance from point P to line segment AB in meters
function distanceToSegment(px, py, ax, ay, bx, by) {
  const cosLat = Math.cos((py * Math.PI) / 180);
  const dx = (bx - ax) * cosLat;
  const dy = by - ay;
  if (dx === 0 && dy === 0) {
    return getDistanceMeters(px, py, ax, ay);
  }
  const pdx = (px - ax) * cosLat;
  const pdy = py - ay;
  const t = (pdx * dx + pdy * dy) / (dx * dx + dy * dy);
  const clampedT = Math.max(0, Math.min(1, t));
  const projX = ax + clampedT * (bx - ax);
  const projY = ay + clampedT * (by - ay);
  return getDistanceMeters(px, py, projX, projY);
}

// Check minimum distance from report [lng, lat] to a route's coordinates
function getMinDistanceToRoute(reportCoords, routeCoords) {
  if (!reportCoords || !routeCoords || routeCoords.length < 2) return Infinity;
  let minDistance = Infinity;
  const [rLng, rLat] = reportCoords;
  const step = Math.max(1, Math.floor(routeCoords.length / 250));

  for (let i = 0; i < routeCoords.length - 1; i += step) {
    const nextIdx = Math.min(i + step, routeCoords.length - 1);
    const [aLng, aLat] = routeCoords[i];
    const [bLng, bLat] = routeCoords[nextIdx];
    const d = distanceToSegment(rLng, rLat, aLng, aLat, bLng, bLat);
    if (d < minDistance) minDistance = d;
    if (minDistance < 80) break;
  }
  return minDistance;
}

// Evaluate safety of a route against active incident reports
function evaluateRouteSafety(route, reportsList = []) {
  const routeCoords = route.geometry?.coordinates || [];
  const activeReports = (reportsList || []).filter(
    (r) => (!r.status || r.status === 'active') && Array.isArray(r.coords) && r.coords.length === 2
  );

  const hazards = [];
  for (const rep of activeReports) {
    const dist = getMinDistanceToRoute(rep.coords, routeCoords);
    if (dist <= 650) {
      hazards.push({ ...rep, distanceMeters: Math.round(dist) });
    }
  }

  let safetyLevel = 'safe';
  if (hazards.length > 0) {
    const isCritical = hazards.some(
      (h) => h.severity === 'critical' || h.severity === 'high' || ['flood', 'fire', 'landslide', 'accident'].includes(h.type)
    );
    safetyLevel = isCritical ? 'danger' : 'caution';
  }

  return {
    ...route,
    hazards,
    safetyLevel,
    isSafe: safetyLevel === 'safe',
  };
}

// Fetch alternative detour route via an intermediate waypoint
async function fetchDetourRoute(origin, destination, waypoint) {
  try {
    const coords = `${origin[0]},${origin[1]};${waypoint[0]},${waypoint[1]};${destination[0]},${destination[1]}`;
    const url =
      `https://api.mapbox.com/directions/v5/mapbox/driving/` +
      `${coords}?geometries=geojson&overview=full&steps=false&access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.routes ? data.routes[0] : null;
  } catch (_) {
    return null;
  }
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

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
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
  const reportMarkersMap = useRef({});

  const [selectedReportId, setSelectedReportId] = useState(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

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
    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [85.3096, 23.3441], // Ranchi
      zoom: 11,
    });
    map.current = mapInstance;
    mapInstance.addControl(new mapboxgl.NavigationControl(), "bottom-right");
    mapInstance.addControl(new mapboxgl.FullscreenControl(), "bottom-right");

    const resizeTimer1 = setTimeout(() => {
      if (map.current) map.current.resize();
    }, 150);

    const resizeTimer2 = setTimeout(() => {
      if (map.current) map.current.resize();
    }, 600);

    mapInstance.once("load", () => {
      if (map.current) map.current.resize();
    });

    let resizeObserver = null;
    if (window.ResizeObserver && mapContainer.current) {
      resizeObserver = new ResizeObserver(() => {
        if (map.current) map.current.resize();
      });
      resizeObserver.observe(mapContainer.current);
    }

    return () => {
      clearTimeout(resizeTimer1);
      clearTimeout(resizeTimer2);
      if (resizeObserver) resizeObserver.disconnect();
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Render report markers whenever the reports list changes
  useEffect(() => {
    if (!map.current) return;

    const renderMarkers = () => {
      // Remove old report markers
      reportMarkersRef.current.forEach((m) => m.remove());
      reportMarkersRef.current = [];
      reportMarkersMap.current = {};

      reports.forEach((report) => {
        if (!report.coords) return;
        const repId = report.id || report._id;
        const cfg = DISASTER_MAP[report.type] || DISASTER_MAP.other;
        const sevColor = SEVERITY_COLORS[report.severity] || '#94a3b8';

        // Marker element
        const el = document.createElement('div');
        el.style.cssText =
          `width:38px;height:38px;border-radius:50%;display:flex;align-items:center;` +
          `justify-content:center;font-size:19px;background:#FFFFFF;` +
          `border:2.5px solid ${sevColor};box-shadow:0 3px 12px rgba(9,21,64,0.18);` +
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
          <div class="rmp-time">🕐 ${new Date(report.timestamp || report.createdAt || Date.now()).toLocaleString()}</div>
        `;

        const popup = new mapboxgl.Popup({
          offset: 20,
          closeButton: true,
          maxWidth: '280px',
        }).setDOMContent(popupNode);

        el.addEventListener('click', () => {
          setSelectedReportId(repId);
          if (onReportClick) onReportClick(report);
        });

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat(report.coords)
          .setPopup(popup)
          .addTo(map.current);

        reportMarkersRef.current.push(marker);
        reportMarkersMap.current[repId] = { marker, popup, coords: report.coords };
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
    // Remove route layers/sources up to 6 routes
    for (let i = 0; i < 6; i++) {
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
      const isActive = i === active;

      // Color based on safety and selection
      let color = ROUTE_COLORS[i] || "#8b5cf6";
      if (route.cardColor) {
        color = route.cardColor;
      } else if (route.safetyLevel === "danger") {
        color = "#ef4444";
      } else if (route.safetyLevel === "safe" && route.isAlternativeSuggestion) {
        color = "#10b981";
      }

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
          "line-color": isActive ? (route.safetyLevel === "danger" ? "#ef4444" : "#ffffff") : "transparent",
          "line-width": isActive ? 8 : 0,
          "line-opacity": isActive ? 0.35 : 0,
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
    const makeEl = (emoji, borderColor = "#1B2CC1") => {
      const el = document.createElement("div");
      el.style.cssText =
        "width:36px;height:36px;border-radius:50%;display:flex;align-items:center;" +
        "justify-content:center;font-size:18px;background:#FFFFFF;" +
        `border:2.5px solid ${borderColor};box-shadow:0 3px 12px rgba(9,21,64,0.18);cursor:pointer;`;
      el.textContent = emoji;
      return el;
    };
    const m1 = new mapboxgl.Marker({ element: makeEl("🟢", "#059669") }).setLngLat(origin).addTo(map.current);
    const m2 = new mapboxgl.Marker({ element: makeEl("🔴", "#DC2626") }).setLngLat(dest).addTo(map.current);
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

      // Evaluate safety for all found routes
      let evaluated = found.slice(0, 3).map((r) => evaluateRouteSafety(r, reports));

      // If Route 0 is unsafe and none of the other routes are safe,
      // generate a smart detour route bypassing the hazard!
      const hasSafeRoute = evaluated.some((r) => r.safetyLevel === 'safe');
      if (!hasSafeRoute && evaluated[0].hazards?.length > 0) {
        const hazard = evaluated[0].hazards[0];
        const [hLng, hLat] = hazard.coords;
        const dx = dCoords[0] - oCoords[0];
        const dy = dCoords[1] - oCoords[1];
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;

        // Try detour waypoint offset
        const wp1 = [hLng + nx * 0.035, hLat + ny * 0.035];
        const wp2 = [hLng - nx * 0.035, hLat - ny * 0.035];

        let detour = await fetchDetourRoute(oCoords, dCoords, wp1);
        let evalDetour = detour ? evaluateRouteSafety(detour, reports) : null;

        if (!evalDetour || evalDetour.safetyLevel !== 'safe') {
          const detour2 = await fetchDetourRoute(oCoords, dCoords, wp2);
          const evalDetour2 = detour2 ? evaluateRouteSafety(detour2, reports) : null;
          if (evalDetour2 && evalDetour2.safetyLevel === 'safe') {
            evalDetour = evalDetour2;
          }
        }

        if (evalDetour) {
          evalDetour.customLabel = 'Safe Detour';
          evalDetour.isAlternativeSuggestion = true;
          evalDetour.cardColor = '#10b981';
          evaluated.push(evalDetour);
        }
      }

      // Mark the first safe alternative as recommended if Route 0 is unsafe
      if (evaluated[0].safetyLevel !== 'safe') {
        const safeIdx = evaluated.findIndex((r) => r.safetyLevel === 'safe');
        if (safeIdx !== -1) {
          evaluated[safeIdx].isAlternativeSuggestion = true;
          if (!evaluated[safeIdx].customLabel) {
            evaluated[safeIdx].customLabel = 'Safe Alternative';
          }
          evaluated[safeIdx].cardColor = '#10b981';
        }
      }

      setRoutes(evaluated);
      setActiveRoute(0);

      // Wait for map to be ready before drawing
      const doDraw = () => {
        clearRoutes();
        drawRoutes(evaluated, 0);
        addMarkers(oCoords, dCoords);
        fitBounds(evaluated);
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
  }, [originCoords, destCoords, originText, destText, reports, clearRoutes, drawRoutes, addMarkers, fitBounds]);

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

        {/* Hazard Alert & Safe Alternative Suggestion Box */}
        {routes.length > 0 && routes[activeRoute] && (
          <>
            {routes[activeRoute].safetyLevel === 'danger' && (
              <div className="route-alert-box hazard">
                <div className="route-alert-header">
                  <span>⚠️ Hazard on Current Route</span>
                  <span>{routes[activeRoute].hazards?.length} incident{routes[activeRoute].hazards?.length === 1 ? '' : 's'}</span>
                </div>
                <div style={{ fontSize: '11px', lineHeight: 1.4 }}>
                  {routes[activeRoute].hazards?.[0]
                    ? `"${routes[activeRoute].hazards[0].title}" (${routes[activeRoute].hazards[0].type}) is located along this path.`
                    : 'Active incident reported along this path.'}
                </div>
                {routes.findIndex((r) => r.safetyLevel === 'safe') !== -1 && (
                  <button
                    className="btn-switch-safe"
                    onClick={() => {
                      const sIdx = routes.findIndex((r) => r.safetyLevel === 'safe');
                      if (sIdx !== -1) setActiveRoute(sIdx);
                    }}
                  >
                    🛡️ Switch to Safe Route ({routes.find((r) => r.safetyLevel === 'safe')?.customLabel || 'Alternative'}) →
                  </button>
                )}
              </div>
            )}

            {routes[activeRoute].safetyLevel === 'safe' && (
              <div className="route-alert-box safe">
                <span style={{ fontSize: '1.2rem' }}>🛡️</span>
                <span><strong>Safe Route:</strong> No active hazard reports detected along this path.</span>
              </div>
            )}
          </>
        )}

        {/* Route Cards */}
        {routes.length > 0 && (
          <div className="route-cards">
            {routes.map((route, i) => {
              const cardColor = route.cardColor || (route.safetyLevel === 'danger' ? '#ef4444' : (ROUTE_COLORS[i] || '#8b5cf6'));
              return (
                <button
                  key={i}
                  className={`route-card${activeRoute === i ? " active" : ""}`}
                  style={{ "--route-color": cardColor }}
                  onClick={() => setActiveRoute(i)}
                >
                  <div className="route-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="route-badge" style={{ background: cardColor }}>
                        {route.customLabel || ROUTE_LABELS[i] || `Route ${i + 1}`}
                      </span>
                      {route.isAlternativeSuggestion && (
                        <span className="route-suggestion-tag">Suggested</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {route.safetyLevel === 'safe' && (
                        <span className="route-safety-chip safe">✓ Safe</span>
                      )}
                      {route.safetyLevel === 'danger' && (
                        <span className="route-safety-chip danger">⚠️ Hazard</span>
                      )}
                      {route.safetyLevel === 'caution' && (
                        <span className="route-safety-chip caution">! Caution</span>
                      )}
                      {activeRoute === i && <span className="route-selected-dot">●</span>}
                    </div>
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

                  {route.hazards && route.hazards.length > 0 && (
                    <div className="route-hazard-summary">
                      <span>⚠️</span>
                      <span>
                        {route.hazards[0].type?.toUpperCase()}: {route.hazards[0].title}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
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

        {/* Top-Right Disaster Incident Panel (Medium Sized) */}
        <div className={`map-disaster-panel ${isPanelCollapsed ? 'collapsed' : ''}`} id="map-disaster-panel">
          <div
            className="map-disaster-header"
            onClick={() => setIsPanelCollapsed((prev) => !prev)}
            title="Click to minimize or expand disaster alerts"
          >
            <div className="map-disaster-title-row">
              <span className="map-disaster-icon">🚨</span>
              <span className="map-disaster-title">Disaster Alerts</span>
              <span className="map-disaster-count-badge">
                {(reports || []).filter((r) => (!r.status || r.status === 'active') && r.coords).length}
              </span>
            </div>
            <button
              className="map-disaster-toggle-btn"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsPanelCollapsed((prev) => !prev);
              }}
              title={isPanelCollapsed ? "Expand panel" : "Minimize panel"}
            >
              {isPanelCollapsed ? '▲ Expand' : '▼'}
            </button>
          </div>

          {!isPanelCollapsed && (
            <div className="map-disaster-body">
              {(reports || []).filter((r) => (!r.status || r.status === 'active') && r.coords).length === 0 ? (
                <div className="map-disaster-empty">
                  <span style={{ fontSize: '1.4rem' }}>✅</span>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--success)' }}>All Clear</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No active disaster reports in area</div>
                  </div>
                </div>
              ) : (
                <div className="map-disaster-list">
                  {(reports || [])
                    .filter((r) => (!r.status || r.status === 'active') && r.coords)
                    .map((report) => {
                      const repId = report.id || report._id;
                      const cfg = DISASTER_MAP[report.type] || DISASTER_MAP.other;
                      const sevColor = SEVERITY_COLORS[report.severity] || '#94a3b8';
                      const isSelected = selectedReportId === repId;

                      return (
                        <div
                          key={repId}
                          className={`map-disaster-card ${isSelected ? 'selected' : ''}`}
                          style={{ '--disaster-color': cfg.color || sevColor }}
                          onClick={() => {
                            if (!map.current || !report.coords) return;
                            setSelectedReportId(repId);

                            // Smoothly zoom in to disaster location
                            map.current.flyTo({
                              center: report.coords,
                              zoom: 14.5,
                              essential: true,
                              duration: 1200,
                            });

                            // Open marker popup
                            const target = reportMarkersMap.current[repId];
                            if (target && target.marker) {
                              Object.values(reportMarkersMap.current).forEach((item) => {
                                if (item.popup && item.popup.isOpen()) item.popup.remove();
                              });
                              if (target.marker.getPopup()) {
                                target.marker.togglePopup();
                              }
                            }

                            if (onReportClick) onReportClick(report);
                          }}
                        >
                          <div className="map-disaster-card-header">
                            <div className="map-disaster-card-meta">
                              <span style={{ fontSize: '1.1rem' }}>{cfg.emoji}</span>
                              <span className="map-disaster-type-pill" style={{ background: `${cfg.color}22`, color: cfg.color }}>
                                {report.type?.toUpperCase()}
                              </span>
                              <span className="map-disaster-sev-pill" style={{ background: `${sevColor}22`, color: sevColor }}>
                                ● {report.severity}
                              </span>
                            </div>
                            <span className="map-disaster-time">{timeAgo(report.timestamp || report.createdAt)}</span>
                          </div>

                          <div className="map-disaster-card-title">{report.title}</div>

                          {report.description && (
                            <div className="map-disaster-card-desc">{report.description}</div>
                          )}

                          <div className="map-disaster-card-footer">
                            <span className="map-disaster-loc">📍 {report.location || 'Location marked'}</span>
                            <span className="map-disaster-action-hint">View on Map ➔</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Quick action to zoom full route if active */}
              {routes.length > 0 && (
                <div className="map-disaster-footer">
                  <button
                    className="btn-zoom-route"
                    type="button"
                    onClick={() => fitBounds(routes)}
                  >
                    🗺️ Zoom to Full Route
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

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