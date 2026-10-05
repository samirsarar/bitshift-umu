import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const SOS_TYPES = [
  { id: 'medical', label: 'Critical Medical', icon: '🚑', color: '#ec4899', desc: 'Severe injury, cardiac, unconscious, bleeding' },
  { id: 'trapped', label: 'Trapped / Structural Collapse', icon: '🏚️', color: '#ef4444', desc: 'Building collapse, landslide debris, flood isolation' },
  { id: 'fire', label: 'Fire Outbreak', icon: '🔥', color: '#f97316', desc: 'Rapid spread, trapped by flames, heavy smoke' },
  { id: 'water', label: 'Flood / Drowning', icon: '🌊', color: '#3b82f6', desc: 'Rising water level, sweeping current, rooftop stranded' },
  { id: 'security', label: 'Violence / Distress', icon: '🛡️', color: '#a855f7', desc: 'Threat to physical safety, looting, immediate escort needed' },
];

export default function SOSPage({ onNavigate }) {
  const { user, isAuthenticated } = useAuth();
  const [selectedType, setSelectedType] = useState('medical');
  const [urgency, setUrgency] = useState('critical');
  const [note, setNote] = useState('');
  const [peopleCount, setPeopleCount] = useState(1);
  const [coords, setCoords] = useState([85.3096, 23.3441]);
  const [locating, setLocating] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [activeSOSList, setActiveSOSList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [acknowledgedList, setAcknowledgedList] = useState([]);
  const [toastMsg, setToastMsg] = useState(null);

  // Auto-detect geolocation
  useEffect(() => {
    if ('geolocation' in navigator) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords([pos.coords.longitude, pos.coords.latitude]);
          setLocating(false);
        },
        (err) => {
          console.warn('Geolocation fallback used:', err.message);
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  // Fetch active SOS beacons from backend
  const fetchSOS = async () => {
    setLoadingList(true);
    try {
      const res = await api.getLocations({ category: 'sos' });
      if (res && res.data) {
        setActiveSOSList(res.data);
      }
    } catch (err) {
      console.warn('Using local fallback for SOS list:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchSOS();
  }, []);

  const triggerSOS = async () => {
    const selectedObj = SOS_TYPES.find((t) => t.id === selectedType);
    const title = `EMERGENCY SOS: ${selectedObj?.label || 'Distress Alert'} (${peopleCount} ${peopleCount === 1 ? 'person' : 'people'})`;
    const description = note ? `${note} | Responders needed immediately.` : `Immediate emergency rescue requested for ${peopleCount} individual(s).`;

    const sosPayload = {
      clientUUID: `sos_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
      title,
      category: 'sos',
      urgency,
      description,
      latitude: coords[1],
      longitude: coords[0],
      reporterName: user?.name || 'Distressed Citizen',
      status: 'active',
    };

    try {
      await api.createLocation(sosPayload);
      setSosActive(true);
      setToastMsg('🚨 SOS BEACON BROADCASTED! Dispatch & nearby responders notified.');
      fetchSOS();
    } catch (err) {
      // Local fallback
      setActiveSOSList((prev) => [sosPayload, ...prev]);
      setSosActive(true);
      setToastMsg('🚨 SOS Beacon Recorded (Local Network Active)');
    }

    setTimeout(() => setToastMsg(null), 6000);
  };

  const handleAcknowledge = (id) => {
    setAcknowledgedList((prev) => [...prev, id]);
    setToastMsg('✅ You have marked this SOS as responding!');
    setTimeout(() => setToastMsg(null), 3000);
  };

  const shareSOSWhatsApp = () => {
    const text = encodeURIComponent(
      `🚨 EMERGENCY DISTRESS ALERT 🚨\nType: ${selectedType.toUpperCase()}\nCoords: https://maps.google.com/?q=${coords[1]},${coords[0]}\nPeople: ${peopleCount}\nNote: ${note || 'Immediate help needed!'}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="sos-page">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="sos-alert-banner">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="page-hero-header danger-theme">
        <div className="page-hero-title-group">
          <span className="page-hero-icon pulse-glow">🆘</span>
          <div>
            <h1 className="page-hero-title">Emergency SOS &amp; Distress Hub</h1>
            <p className="page-hero-subtitle">
              Broadcast critical life-saving beacons with instant GPS telemetry to disaster responders.
            </p>
          </div>
        </div>

        <div className="sos-header-actions">
          <button className="btn btn-secondary" onClick={() => onNavigate('map')}>
            🗺️ View on Live Map
          </button>
          <button className="btn btn-secondary" onClick={fetchSOS}>
            🔄 Refresh Beacons
          </button>
        </div>
      </div>

      <div className="sos-grid-container">
        {/* Main Panic Beacon Trigger Panel */}
        <div className="sos-trigger-card">
          <div className="card-header">
            <span className="card-tag danger">🚨 High Priority Broadcast</span>
            <h2>Broadcast Distress Beacon</h2>
            <p className="text-muted">Select crisis classification and trigger instant distress telemetry.</p>
          </div>

          {/* Type Selector */}
          <div className="sos-type-selector">
            <label className="form-label">Select Crisis Emergency Type:</label>
            <div className="sos-types-grid">
              {SOS_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`sos-type-btn ${selectedType === t.id ? 'active' : ''}`}
                  onClick={() => setSelectedType(t.id)}
                  style={{ '--type-color': t.color }}
                >
                  <span className="sos-type-icon">{t.icon}</span>
                  <div className="sos-type-meta">
                    <span className="sos-type-label">{t.label}</span>
                    <span className="sos-type-desc">{t.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Configuration Inputs */}
          <div className="sos-form-grid">
            <div className="form-group">
              <label className="form-label">Urgency Level:</label>
              <select
                className="form-input"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
              >
                <option value="critical">🔴 Critical (Immediate Life Threat)</option>
                <option value="high">🟠 High (Urgent Intervention Needed)</option>
                <option value="medium">🟡 Medium (Assistance Required)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Number of People in Danger:</label>
              <div className="people-counter">
                <button
                  type="button"
                  className="counter-btn"
                  onClick={() => setPeopleCount((p) => Math.max(1, p - 1))}
                >
                  -
                </button>
                <span className="counter-val">{peopleCount}</span>
                <button
                  type="button"
                  className="counter-btn"
                  onClick={() => setPeopleCount((p) => p + 1)}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Situation Details &amp; Landmarks (Optional):</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="e.g. 2nd floor balcony, water up to 4ft, senior citizen with oxygen tank..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* GPS telemetry badge */}
          <div className="telemetry-box">
            <div className="telemetry-item">
              <span className="telemetry-label">🛰️ GPS Telemetry:</span>
              <span className="telemetry-val">
                {coords[1].toFixed(5)}° N, {coords[0].toFixed(5)}° E
              </span>
            </div>
            {locating && <span className="telemetry-status">Acquiring accurate satellite lock...</span>}
          </div>

          {/* BIG PANIC BUTTON */}
          <div className="panic-button-wrapper">
            <button
              className={`giant-sos-btn ${sosActive ? 'active-pulse' : ''}`}
              onClick={triggerSOS}
              id="giant-sos-trigger"
            >
              <div className="giant-sos-inner">
                <span className="giant-sos-icon">🆘</span>
                <span className="giant-sos-text">
                  {sosActive ? 'BROADCASTING SOS...' : 'TAP TO BROADCAST SOS'}
                </span>
                <span className="giant-sos-sub">Transmits live telemetry to emergency net</span>
              </div>
            </button>
          </div>

          {/* Share links */}
          <div className="sos-quick-shares">
            <button className="btn btn-secondary btn-full" onClick={shareSOSWhatsApp}>
              💬 Share Distress via WhatsApp
            </button>
          </div>
        </div>

        {/* Live Active SOS Distress Beacons Feed */}
        <div className="sos-feed-column">
          <div className="card-header flex-between">
            <div>
              <h3>Active Distress Beacons</h3>
              <p className="text-muted">Live incoming SOS signals in your operational radius.</p>
            </div>
            <span className="badge badge-danger">{activeSOSList.length} Active</span>
          </div>

          {loadingList ? (
            <div className="loading-container">
              <div className="spinner" />
              <p>Scanning distress frequencies...</p>
            </div>
          ) : activeSOSList.length === 0 ? (
            <div className="empty-state-card">
              <span className="empty-icon">🛡️</span>
              <h4>No Active SOS Distress Signals</h4>
              <p className="text-muted">All clear in this monitored emergency sector.</p>
            </div>
          ) : (
            <div className="sos-list-stack">
              {activeSOSList.map((item, idx) => {
                const isAck = acknowledgedList.includes(item._id || item.clientUUID || idx);
                return (
                  <div key={item._id || item.clientUUID || idx} className="sos-feed-card">
                    <div className="sos-feed-header">
                      <div className="sos-feed-badge-group">
                        <span className="beacon-pulse-icon">🚨</span>
                        <span className="sos-feed-title">{item.title}</span>
                      </div>
                      <span className={`badge badge-${item.urgency || 'critical'}`}>
                        {item.urgency ? item.urgency.toUpperCase() : 'CRITICAL'}
                      </span>
                    </div>

                    <p className="sos-feed-desc">{item.description || 'Immediate responder assistance needed.'}</p>

                    <div className="sos-feed-meta">
                      <span>👤 {item.reporterName || 'Citizen'}</span>
                      <span>📍 {item.latitude ? `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}` : 'Coordinates Attached'}</span>
                      <span>🕒 Just now</span>
                    </div>

                    <div className="sos-feed-actions">
                      <button
                        className={`btn btn-sm ${isAck ? 'btn-success' : 'btn-primary'}`}
                        onClick={() => handleAcknowledge(item._id || item.clientUUID || idx)}
                        disabled={isAck}
                      >
                        {isAck ? '✓ Responding' : '🚑 Acknowledge & Respond'}
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => onNavigate('map')}
                      >
                        🗺️ View on Map
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Direct Dispatch Calls */}
          <div className="emergency-dispatch-box">
            <h4>⚡ Emergency Rapid Dispatch</h4>
            <div className="rapid-call-buttons">
              <a href="tel:112" className="rapid-btn">
                <span>🚨 112</span>
                <small>National SOS</small>
              </a>
              <a href="tel:108" className="rapid-btn">
                <span>🚑 108</span>
                <small>Ambulance</small>
              </a>
              <a href="tel:101" className="rapid-btn">
                <span>🚒 101</span>
                <small>Fire Rescue</small>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
