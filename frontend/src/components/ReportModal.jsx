import { useState, useEffect, useRef } from 'react';

const DISASTER_TYPES = [
  { id: 'flood',       emoji: '🌊', label: 'Flood',          color: '#3b82f6' },
  { id: 'fire',        emoji: '🔥', label: 'Fire',           color: '#ef4444' },
  { id: 'earthquake',  emoji: '🌍', label: 'Earthquake',     color: '#f59e0b' },
  { id: 'accident',    emoji: '🚨', label: 'Road Accident',  color: '#f97316' },
  { id: 'landslide',   emoji: '⛰️',  label: 'Landslide',     color: '#a16207' },
  { id: 'power',       emoji: '⚡', label: 'Power Outage',  color: '#fbbf24' },
  { id: 'medical',     emoji: '🏥', label: 'Medical Emergency', color: '#ec4899' },
  { id: 'infrastructure', emoji: '🏗️', label: 'Infrastructure', color: '#6366f1' },
  { id: 'other',       emoji: '⚠️', label: 'Other',          color: '#94a3b8' },
];

const SEVERITY_LEVELS = [
  { id: 'low',      label: 'Low',      color: '#22c55e', desc: 'Minor issue, no immediate danger' },
  { id: 'medium',   label: 'Medium',   color: '#f59e0b', desc: 'Significant but manageable' },
  { id: 'high',     label: 'High',     color: '#f97316', desc: 'Serious — needs prompt response' },
  { id: 'critical', label: 'Critical', color: '#ef4444', desc: 'Life-threatening emergency' },
];

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

async function reverseGeocode(lng, lat) {
  try {
    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
      `?access_token=${MAPBOX_TOKEN}&limit=1`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      return data.features[0].place_name;
    }
  } catch (_) {}
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

async function forwardGeocode(query) {
  try {
    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
      `?access_token=${MAPBOX_TOKEN}&limit=1`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      return data.features[0].center;
    }
  } catch (_) {}
  return null;
}

export default function ReportModal({ onClose, onSubmit, mapCenter }) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState(null);
  const [severity, setSeverity] = useState('medium');
  const [locationText, setLocationText] = useState('');
  const [locationCoords, setLocationCoords] = useState(null);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const suggRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (suggRef.current && !suggRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLocationInput = (val) => {
    setLocationText(val);
    setLocationCoords(null);
    clearTimeout(debounceRef.current);
    if (!val || val.length < 2) { setLocationSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const url =
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(val)}.json` +
          `?access_token=${MAPBOX_TOKEN}&limit=5`;
        const res = await fetch(url);
        const data = await res.json();
        setLocationSuggestions(data.features || []);
        setShowSuggestions(true);
      } catch (_) {}
    }, 350);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { longitude: lng, latitude: lat } = pos.coords;
        const address = await reverseGeocode(lng, lat);
        setLocationText(address);
        setLocationCoords([lng, lat]);
        setGeoLoading(false);
      },
      () => setGeoLoading(false)
    );
  };

  const validateStep = () => {
    const errs = {};
    if (step === 1 && !type) errs.type = 'Please select a disaster type';
    if (step === 2 && !locationCoords && !locationText) errs.location = 'Please enter a location';
    if (step === 3) {
      if (!title.trim()) errs.title = 'Title is required';
      else if (title.trim().length < 5) errs.title = 'Title must be at least 5 characters';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = async () => {
    if (!validateStep()) return;
    if (step === 2 && locationText && !locationCoords) {
      const coords = await forwardGeocode(locationText);
      if (coords) setLocationCoords(coords);
    }
    setStep((s) => Math.min(s + 1, 4));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    let coords = locationCoords;
    if (!coords && locationText) coords = await forwardGeocode(locationText);
    const report = {
      id: `report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      severity,
      title: title.trim(),
      description: description.trim(),
      location: locationText,
      coords: coords || mapCenter || [85.3096, 23.3441],
      timestamp: new Date().toISOString(),
      status: 'active',
    };
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    onSubmit(report);
  };

  const selectedType = DISASTER_TYPES.find((t) => t.id === type);
  const selectedSeverity = SEVERITY_LEVELS.find((s) => s.id === severity);

  return (
    <div className="report-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="report-modal">
        <div className="report-modal-header">
          <div className="report-modal-title-row">
            <span className="report-modal-icon">🚨</span>
            <div>
              <h2 className="report-modal-title">Report an Incident</h2>
              <p className="report-modal-subtitle">Help others by reporting disasters &amp; problems</p>
            </div>
          </div>
          <button className="report-modal-close" onClick={onClose} id="report-modal-close-btn">✕</button>
        </div>

        <div className="report-steps">
          {['Type', 'Location', 'Details', 'Confirm'].map((label, i) => (
            <div key={label} className={`report-step ${step > i + 1 ? 'done' : ''} ${step === i + 1 ? 'active' : ''}`}>
              <div className="report-step-circle">{step > i + 1 ? '✓' : i + 1}</div>
              <span className="report-step-label">{label}</span>
              {i < 3 && <div className={`report-step-line ${step > i + 1 ? 'done' : ''}`} />}
            </div>
          ))}
        </div>

        <div className="report-modal-body">
          {step === 1 && (
            <div className="report-step-content">
              <h3 className="report-step-heading">What kind of incident are you reporting?</h3>
              <div className="report-type-grid">
                {DISASTER_TYPES.map((t) => (
                  <button
                    key={t.id}
                    id={`report-type-${t.id}`}
                    className={`report-type-card ${type === t.id ? 'selected' : ''}`}
                    style={{ '--type-color': t.color }}
                    onClick={() => { setType(t.id); setErrors({}); }}
                  >
                    <span className="report-type-emoji">{t.emoji}</span>
                    <span className="report-type-label">{t.label}</span>
                    {type === t.id && <span className="report-type-check">✓</span>}
                  </button>
                ))}
              </div>
              {errors.type && <div className="report-field-error">{errors.type}</div>}
            </div>
          )}

          {step === 2 && (
            <div className="report-step-content">
              <h3 className="report-step-heading">Where is this happening?</h3>
              <div ref={suggRef} className="report-location-wrap">
                <div className="report-input-group">
                  <label className="report-label" htmlFor="report-location-input">Location</label>
                  <input
                    id="report-location-input"
                    className={`report-input ${errors.location ? 'error' : ''}`}
                    type="text"
                    placeholder="Search for a location…"
                    value={locationText}
                    onChange={(e) => handleLocationInput(e.target.value)}
                    onFocus={() => locationSuggestions.length > 0 && setShowSuggestions(true)}
                    autoComplete="off"
                  />
                  {showSuggestions && locationSuggestions.length > 0 && (
                    <ul className="report-suggestions">
                      {locationSuggestions.map((feat) => (
                        <li
                          key={feat.id}
                          className="report-suggestion-item"
                          onMouseDown={() => {
                            setLocationText(feat.place_name);
                            setLocationCoords(feat.center);
                            setLocationSuggestions([]);
                            setShowSuggestions(false);
                            setErrors({});
                          }}
                        >
                          <span className="report-suggestion-icon">📍</span>
                          <div>
                            <div className="report-suggestion-name">{feat.text}</div>
                            <div className="report-suggestion-full">{feat.place_name}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  className="report-geo-btn"
                  onClick={handleGetCurrentLocation}
                  disabled={geoLoading}
                  id="report-geo-btn"
                >
                  {geoLoading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '📡'}
                  {geoLoading ? 'Detecting…' : 'Use My Location'}
                </button>
                {locationCoords && (
                  <div className="report-location-confirmed">
                    <span>✅</span>
                    <span>Location confirmed: <strong>{locationText.split(',').slice(0, 2).join(',')}</strong></span>
                  </div>
                )}
              </div>
              {errors.location && <div className="report-field-error">{errors.location}</div>}
            </div>
          )}

          {step === 3 && (
            <div className="report-step-content">
              <h3 className="report-step-heading">Tell us more about the incident</h3>
              <div className="report-input-group">
                <label className="report-label" htmlFor="report-title-input">
                  Title <span className="report-required">*</span>
                </label>
                <input
                  id="report-title-input"
                  className={`report-input ${errors.title ? 'error' : ''}`}
                  type="text"
                  placeholder="Brief title of the incident…"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setErrors({}); }}
                  maxLength={80}
                />
                <div className="report-char-count">{title.length}/80</div>
                {errors.title && <div className="report-field-error">{errors.title}</div>}
              </div>
              <div className="report-input-group">
                <label className="report-label" htmlFor="report-desc-input">Description</label>
                <textarea
                  id="report-desc-input"
                  className="report-textarea"
                  placeholder="Describe the situation — what happened, who is affected, any hazards…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  maxLength={500}
                />
                <div className="report-char-count">{description.length}/500</div>
              </div>
              <div className="report-input-group">
                <label className="report-label">Severity Level</label>
                <div className="report-severity-grid">
                  {SEVERITY_LEVELS.map((s) => (
                    <button
                      key={s.id}
                      id={`report-severity-${s.id}`}
                      className={`report-severity-btn ${severity === s.id ? 'selected' : ''}`}
                      style={{ '--sev-color': s.color }}
                      onClick={() => setSeverity(s.id)}
                    >
                      <span className="report-sev-label">{s.label}</span>
                      <span className="report-sev-desc">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="report-step-content">
              <h3 className="report-step-heading">Review your report</h3>
              <div className="report-review-card">
                <div className="report-review-type" style={{ '--type-color': selectedType?.color }}>
                  <span className="report-review-emoji">{selectedType?.emoji}</span>
                  <div>
                    <div className="report-review-type-label">{selectedType?.label}</div>
                    <div className="report-review-severity" style={{ color: selectedSeverity?.color }}>
                      ● {selectedSeverity?.label} severity
                    </div>
                  </div>
                </div>
                <div className="report-review-row">
                  <span className="report-review-icon">📝</span>
                  <div>
                    <div className="report-review-field-label">Title</div>
                    <div className="report-review-field-value">{title}</div>
                  </div>
                </div>
                {description && (
                  <div className="report-review-row">
                    <span className="report-review-icon">💬</span>
                    <div>
                      <div className="report-review-field-label">Description</div>
                      <div className="report-review-field-value report-review-desc">{description}</div>
                    </div>
                  </div>
                )}
                <div className="report-review-row">
                  <span className="report-review-icon">📍</span>
                  <div>
                    <div className="report-review-field-label">Location</div>
                    <div className="report-review-field-value">{locationText || 'Not specified'}</div>
                  </div>
                </div>
                <div className="report-review-disclaimer">
                  <span>ℹ️</span>
                  Your report will be visible to all users on the map. Please ensure the information is accurate.
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="report-modal-footer">
          {step > 1 && (
            <button
              className="btn btn-outline"
              onClick={() => setStep((s) => s - 1)}
              disabled={submitting}
              id="report-back-btn"
            >
              ← Back
            </button>
          )}
          <div style={{ flex: 1 }} />
          {step < 4 ? (
            <button className="btn btn-primary" onClick={nextStep} id="report-next-btn">
              Next →
            </button>
          ) : (
            <button
              className="btn btn-danger"
              onClick={handleSubmit}
              disabled={submitting}
              id="report-submit-btn"
            >
              {submitting
                ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Submitting…</>
                : '🚨 Submit Report'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
