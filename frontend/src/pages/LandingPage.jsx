import { useState } from 'react';
import MapView from '../components/MapView';
import { useAuth } from '../context/AuthContext';

export default function LandingPage({ onNavigate, reports = [] }) {
  const { isAuthenticated, user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAccessAction = (target) => {
    if (!isAuthenticated) {
      onNavigate('login');
    } else {
      onNavigate(target || 'dashboard');
    }
  };

  return (
    <div className="alertroutes-viewport-app">
      {/* 1. TOP MINIMALIST NAVBAR */}
      <header className="ar-top-nav">
        <div className="ar-nav-container">
          {/* Top Left: name alertroutes */}
          <div className="ar-brand-group" onClick={() => onNavigate('landing')}>
            <div className="ar-brand-icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ABD2FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <span className="ar-brand-text">alertroutes</span>
          </div>

          {/* Top Right: User Icon */}
          <div className="ar-user-slot">
            <button
              className="ar-user-icon-btn"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-label="User account"
              id="landing-user-toggle"
            >
              {isAuthenticated && user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="ar-avatar-img" />
              ) : isAuthenticated ? (
                <span className="ar-avatar-initials">{getInitials(user?.name)}</span>
              ) : (
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ABD2FA"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
              <span className={`ar-status-dot ${isAuthenticated ? 'online' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <div className="ar-user-dropdown" onClick={() => setUserMenuOpen(false)}>
                {isAuthenticated ? (
                  <>
                    <div className="ar-dropdown-profile">
                      <p className="ar-dropdown-username">{user?.name || 'Verified Responder'}</p>
                      <p className="ar-dropdown-useremail">{user?.email}</p>
                    </div>
                    <div className="ar-dropdown-divider" />
                    <button className="ar-dropdown-link" onClick={() => onNavigate('dashboard')}>
                      📊 Operations Dashboard
                    </button>
                    <button className="ar-dropdown-link" onClick={() => onNavigate('profile')}>
                      👤 Profile &amp; Medical ID
                    </button>
                    <button className="ar-dropdown-link" onClick={() => onNavigate('security')}>
                      🔒 Security Settings
                    </button>
                    <div className="ar-dropdown-divider" />
                    <button className="ar-dropdown-link text-danger" onClick={logout}>
                      ↩ Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <div className="ar-dropdown-profile">
                      <p className="ar-dropdown-username">alertroutes Portal</p>
                      <p className="ar-dropdown-useremail">Sign in to unlock full operations</p>
                    </div>
                    <div className="ar-dropdown-divider" />
                    <button className="ar-dropdown-link" onClick={() => onNavigate('login')}>
                      🔑 Sign In
                    </button>
                    <button className="ar-dropdown-link text-accent" onClick={() => onNavigate('register')}>
                      ✨ Create Account
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. LAPTOP-OPTIMIZED HERO SECTION */}
      <section className="ar-hero-section">
        <div className="ar-hero-glow-back" />
        <div className="ar-hero-inner">
          <div className="ar-hero-badge">
            <span className="ar-badge-ping" />
            <span>Decentralized Crisis Network Active</span>
          </div>

          <h1 className="ar-hero-title">
            Your safety in your hands
          </h1>

          <p className="ar-hero-subtitle">
            Decentralized emergency routing, offline mesh synchronization, and real-time hazard avoidance built to keep you connected when infrastructure fails.
          </p>

          <div className="ar-hero-cta-box">
            <button
              className="ar-hero-primary-button"
              onClick={() => handleAccessAction('dashboard')}
              id="hero-main-action-btn"
            >
              <span>{isAuthenticated ? 'Enter Operations Dashboard' : 'Access Crisis Network'}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>

          <div className="ar-hero-metrics-pill-row">
            <div className="ar-metric-pill">
              <span className="ar-metric-dot green" />
              <span>Store &amp; Forward Active</span>
            </div>
            <div className="ar-metric-pill">
              <span className="ar-metric-dot blue" />
              <span>Peer-to-Peer Mesh Ready</span>
            </div>
            <div className="ar-metric-pill">
              <span className="ar-metric-dot purple" />
              <span>Real-Time GIS Obstacle Avoidance</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECTION 1: STORE & FORWARD AND MESH NODE SYSTEM (Text on LEFT, Image/Visual on RIGHT) */}
      <section className="ar-content-section ar-bg-midnight">
        <div className="ar-section-container">
          {/* Left Column: Text */}
          <div className="ar-text-column">
            <div className="ar-section-tag">Decentralized Mesh Architecture</div>
            <h2 className="ar-section-heading">
              Store &amp; Forward and Mesh Node System
            </h2>
            <p className="ar-section-paragraph">
              During major crises, telecommunications infrastructure and cellular towers frequently suffer outages. Alertroutes uses an autonomous <strong>Store-and-Forward mechanism</strong> and local <strong>peer-to-peer mesh relays</strong> so life-saving data never gets lost.
            </p>

            <div className="ar-feature-cards-stack">
              <div className="ar-feat-item">
                <div className="ar-feat-icon">💾</div>
                <div className="ar-feat-text">
                  <h3>Local Encrypted Queue</h3>
                  <p>Distress alerts, hazard pins, and corridor updates are cached instantly in local IndexedDB storage, even with zero network bars.</p>
                </div>
              </div>

              <div className="ar-feat-item">
                <div className="ar-feat-icon">📡</div>
                <div className="ar-feat-text">
                  <h3>Ad-Hoc Peer Relay Hops</h3>
                  <p>Emergency packets jump device-to-device across local Wi-Fi direct and Bluetooth mesh channels without central internet access.</p>
                </div>
              </div>

              <div className="ar-feat-item">
                <div className="ar-feat-icon">⚡</div>
                <div className="ar-feat-text">
                  <h3>Bidirectional Gateway Sync</h3>
                  <p>As soon as any single peer node connects to a satellite uplink or cellular network, the entire packet backlog syncs to central emergency dispatch.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Mesh Graphic */}
          <div className="ar-visual-column">
            <div className="ar-visual-card">
              <div className="ar-card-topbar">
                <span className="ar-card-label">Mesh Network Telemetry</span>
                <span className="ar-card-live-indicator">● 14 Nodes Connected</span>
              </div>

              <div className="ar-mesh-svg-wrapper">
                <svg className="ar-svg-stage" viewBox="0 0 420 300">
                  <defs>
                    <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#7692FF" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#091540" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="linkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1B2CC1" />
                      <stop offset="50%" stopColor="#7692FF" />
                      <stop offset="100%" stopColor="#ABD2FA" />
                    </linearGradient>
                  </defs>

                  {/* Mesh Connecting Links */}
                  <line x1="80" y1="80" x2="210" y2="150" stroke="#7692FF" strokeWidth="2" strokeDasharray="5 5" opacity="0.6" />
                  <line x1="210" y1="150" x2="340" y2="90" stroke="url(#linkGradient)" strokeWidth="3" opacity="0.9" />
                  <line x1="80" y1="80" x2="130" y2="230" stroke="#1B2CC1" strokeWidth="2" opacity="0.5" />
                  <line x1="130" y1="230" x2="280" y2="240" stroke="#7692FF" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
                  <line x1="280" y1="240" x2="340" y2="90" stroke="#ABD2FA" strokeWidth="2" opacity="0.7" />
                  <line x1="210" y1="150" x2="280" y2="240" stroke="url(#linkGradient)" strokeWidth="2.5" />

                  {/* Nodes */}
                  <g transform="translate(80, 80)">
                    <circle r="22" fill="url(#nodeGlow)" />
                    <circle r="14" fill="#091540" stroke="#7692FF" strokeWidth="2" />
                    <circle r="5" fill="#ABD2FA" />
                    <text x="0" y="32" fill="#ABD2FA" fontSize="10" textAnchor="middle" fontWeight="600">Offline Node A</text>
                  </g>

                  <g transform="translate(210, 150)">
                    <circle r="28" fill="url(#nodeGlow)" />
                    <circle r="18" fill="#1B2CC1" stroke="#ABD2FA" strokeWidth="2.5" />
                    <circle r="7" fill="#FFFFFF" />
                    <text x="0" y="36" fill="#FFFFFF" fontSize="11" textAnchor="middle" fontWeight="bold">Store &amp; Forward Relay</text>
                  </g>

                  <g transform="translate(340, 90)">
                    <circle r="22" fill="url(#nodeGlow)" />
                    <circle r="14" fill="#091540" stroke="#10b981" strokeWidth="2" />
                    <circle r="5" fill="#10b981" />
                    <text x="0" y="32" fill="#ABD2FA" fontSize="10" textAnchor="middle" fontWeight="600">Satellite Gateway</text>
                  </g>

                  <g transform="translate(130, 230)">
                    <circle r="18" fill="url(#nodeGlow)" />
                    <circle r="12" fill="#091540" stroke="#7692FF" strokeWidth="2" />
                    <circle r="4" fill="#7692FF" />
                    <text x="0" y="28" fill="#ABD2FA" fontSize="10" textAnchor="middle">Citizen Node</text>
                  </g>

                  <g transform="translate(280, 240)">
                    <circle r="18" fill="url(#nodeGlow)" />
                    <circle r="12" fill="#091540" stroke="#ABD2FA" strokeWidth="2" />
                    <circle r="4" fill="#ABD2FA" />
                    <text x="0" y="28" fill="#ABD2FA" fontSize="10" textAnchor="middle">Medic Unit</text>
                  </g>
                </svg>
              </div>

              <div className="ar-card-footer-stats">
                <div className="ar-footer-stat">
                  <span className="stat-lbl">Buffered Queue:</span>
                  <span className="stat-val">28 Packets</span>
                </div>
                <div className="ar-footer-stat">
                  <span className="stat-lbl">Mesh Latency:</span>
                  <span className="stat-val text-green">14 ms</span>
                </div>
                <div className="ar-footer-stat">
                  <span className="stat-lbl">Sync Fidelity:</span>
                  <span className="stat-val">100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION 2: INCIDENT REPORTING SYSTEM (Image/Visual on LEFT, Text on RIGHT) */}
      <section className="ar-content-section ar-bg-cobalt-subtle">
        <div className="ar-section-container reverse-mobile">
          {/* Left Column: Visual Mockup */}
          <div className="ar-visual-column">
            <div className="ar-visual-card incident-card-accent">
              <div className="ar-card-topbar">
                <span className="ar-card-label danger">Live Hazard Dispatch Stack</span>
                <span className="ar-card-live-indicator">● Verified by Dispatch</span>
              </div>

              <div className="ar-incident-items-list">
                <div className="ar-inc-item crit">
                  <div className="inc-icon-wrap">🌊</div>
                  <div className="inc-details">
                    <h4>Flash Flood Crest — Lower River Rd</h4>
                    <p>Water depth 1.4m | Current moving East | Road blocked</p>
                  </div>
                  <span className="inc-badge danger">CRITICAL</span>
                </div>

                <div className="ar-inc-item warn">
                  <div className="inc-icon-wrap">🔥</div>
                  <div className="inc-details">
                    <h4>Structural Fire Alert — Industrial Park</h4>
                    <p>Perimeter cordoned | Heavy smoke on West bypass</p>
                  </div>
                  <span className="inc-badge warn">HIGH</span>
                </div>

                <div className="ar-inc-item safe">
                  <div className="inc-icon-wrap">🟢</div>
                  <div className="inc-details">
                    <h4>North Expressway Evacuation Corridor</h4>
                    <p>Fully cleared and patrolled for civilian transit</p>
                  </div>
                  <span className="inc-badge safe">CLEAR</span>
                </div>
              </div>

              <div className="ar-card-footer-stats">
                <div className="ar-footer-stat">
                  <span className="stat-lbl">Verification Confidence:</span>
                  <span className="stat-val text-green">99.4% AI + Human</span>
                </div>
                <button
                  className="ar-mini-action-btn"
                  onClick={() => handleAccessAction('reports')}
                >
                  View Incident Feed →
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Text */}
          <div className="ar-text-column">
            <div className="ar-section-tag">Real-Time Hazard Intelligence</div>
            <h2 className="ar-section-heading">
              Incident Reporting &amp; Dispatch System
            </h2>
            <p className="ar-section-paragraph">
              Transform chaotic crisis scenarios into clear, actionable escape routes. Citizens and first responders report emerging hazards in real time, automatically notifying local dispatchers and recalculating evacuation routes to steer people away from danger.
            </p>

            <div className="ar-feature-cards-stack">
              <div className="ar-feat-item">
                <div className="ar-feat-icon">📍</div>
                <div className="ar-feat-text">
                  <h3>One-Tap Geolocation Pinning</h3>
                  <p>Pin incident type (floods, structural fires, landslides, roadblocks) with high-precision GPS telemetry and photo verification.</p>
                </div>
              </div>

              <div className="ar-feat-item">
                <div className="ar-feat-icon">🧭</div>
                <div className="ar-feat-text">
                  <h3>Dynamic Hazard Avoidance</h3>
                  <p>When a roadblock or danger zone is verified, Alertroutes automatically calculates safe alternative corridors to bypass bottlenecks.</p>
                </div>
              </div>

              <div className="ar-feat-item">
                <div className="ar-feat-icon">🛡️</div>
                <div className="ar-feat-text">
                  <h3>Unified Responder Command</h3>
                  <p>Authoritative dispatch feeds enable rescue squads, NGOs, and medical units to acknowledge distress signals and deploy aid rapidly.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECTION 3: QUITE BIG LIVE MAP */}
      <section className="ar-big-map-section" id="live-map">
        <div className="ar-big-map-header">
          <div className="ar-section-tag">Geospatial Radar</div>
          <h2 className="ar-big-map-title">Live Crisis &amp; Hazard Radar Map</h2>
          <p className="ar-big-map-sub">
            Pan, zoom, and inspect active incident locations, safe shelters, evacuation routes, and threat buffers.
          </p>
        </div>

        <div className="ar-map-display-frame">
          <MapView reports={reports} />
        </div>
      </section>

      {/* 6. SECTION 4: GATEWAY TO FULL OPERATIONS */}
      <section className="ar-portal-gateway-section">
        <div className="ar-portal-gateway-card">
          <h2 className="ar-gateway-headline">Access Full Emergency Operations</h2>
          <p className="ar-gateway-desc">
            To report live incidents, broadcast one-click SOS distress beacons, register emergency shelters, 
            update evacuation corridors, or manage your personal Medical ID, sign in to your verified account.
          </p>
          <div className="ar-gateway-buttons">
            {isAuthenticated ? (
              <button
                className="ar-hero-primary-button"
                onClick={() => onNavigate('dashboard')}
              >
                <span>Launch Operations Dashboard</span>
                <span>→</span>
              </button>
            ) : (
              <>
                <button
                  className="ar-hero-primary-button"
                  onClick={() => onNavigate('register')}
                >
                  <span>Register Free Account</span>
                  <span>→</span>
                </button>
                <button
                  className="ar-hero-secondary-button"
                  onClick={() => onNavigate('login')}
                >
                  Sign In to Portal
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 7. MINIMALIST CLEAN FOOTER */}
      <footer className="ar-minimal-footer">
        <div className="ar-footer-container">
          <div className="ar-footer-brand">
            <span className="ar-brand-symbol">⚡</span>
            <span className="ar-footer-name">alertroutes</span>
            <span className="ar-footer-tagline">Real-Time Crisis Intelligence</span>
          </div>

          <div className="ar-footer-nav-items">
            <button onClick={() => handleAccessAction('dashboard')}>Dashboard</button>
            <button onClick={() => handleAccessAction('map')}>Live Map</button>
            <button onClick={() => handleAccessAction('reports')}>Incident Feed</button>
            <button onClick={() => handleAccessAction('sos')}>SOS Hub</button>
            <button onClick={() => handleAccessAction('shelters')}>Shelters</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
