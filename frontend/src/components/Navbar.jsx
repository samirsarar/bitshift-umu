import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ currentPage, onNavigate, reports = [] }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleNav = (page) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  return (
    <nav className="pro-app-navbar">
      {/* Brand */}
      <div className="pro-nav-brand" onClick={() => handleNav(isAuthenticated ? 'dashboard' : 'landing')}>
        <span className="pro-brand-symbol">⚡</span>
        <span className="pro-brand-title">alertroutes</span>
      </div>

      {/* Center Nav Links */}
      <div className="pro-nav-center desktop-nav">
        <button
          className={`pro-nav-link ${currentPage === 'landing' ? 'active' : ''}`}
          onClick={() => handleNav('landing')}
          id="nav-landing"
        >
          Landing
        </button>

        {isAuthenticated && (
          <button
            className={`pro-nav-link ${currentPage === 'dashboard' || currentPage === 'home' ? 'active' : ''}`}
            onClick={() => handleNav('dashboard')}
            id="nav-dashboard"
          >
            Dashboard
          </button>
        )}

        <button
          className={`pro-nav-link ${currentPage === 'map' ? 'active' : ''}`}
          onClick={() => handleNav('map')}
          id="nav-map"
        >
          Live Map
        </button>

        <button
          className={`pro-nav-link ${currentPage === 'reports' ? 'active' : ''}`}
          onClick={() => handleNav('reports')}
          id="nav-reports"
        >
          Incidents
          {reports.length > 0 && (
            <span className="pro-reports-badge">{reports.length}</span>
          )}
        </button>

        <button
          className={`pro-nav-link text-danger ${currentPage === 'sos' ? 'active' : ''}`}
          onClick={() => handleNav('sos')}
          id="nav-sos"
        >
          <span className="sos-indicator-dot" />
          SOS Hub
        </button>

        <button
          className={`pro-nav-link ${currentPage === 'shelters' ? 'active' : ''}`}
          onClick={() => handleNav('shelters')}
          id="nav-shelters"
        >
          Shelters
        </button>

        <button
          className={`pro-nav-link ${currentPage === 'analytics' ? 'active' : ''}`}
          onClick={() => handleNav('analytics')}
          id="nav-analytics"
        >
          Analytics
        </button>
      </div>

      {/* Right User Actions */}
      <div className="pro-nav-right">
        {isAuthenticated ? (
          <div className="pro-nav-auth-group">
            <button
              className={`pro-nav-link ${currentPage === 'profile' ? 'active' : ''}`}
              onClick={() => handleNav('profile')}
              id="nav-profile"
              title="Profile & Medical ID"
            >
              👤 Profile
            </button>

            <button
              className={`pro-nav-link ${currentPage === 'security' ? 'active' : ''}`}
              onClick={() => handleNav('security')}
              id="nav-security"
              title="Security Settings"
            >
              🔒 Security
            </button>

            <button
              className="pro-nav-link text-muted"
              onClick={logout}
              id="nav-logout"
              title="Sign Out"
            >
              ↩ Logout
            </button>

            <div
              className="pro-nav-avatar"
              title={user?.name}
              onClick={() => handleNav('profile')}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                getInitials(user?.name)
              )}
            </div>
          </div>
        ) : (
          <div className="pro-nav-guest-group">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleNav('login')}
              id="nav-login"
            >
              Sign In
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleNav('register')}
              id="nav-register"
            >
              Register
            </button>
          </div>
        )}

        {/* Mobile menu toggle */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle Menu"
          id="mobile-menu-btn"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Drawer & Backdrop */}
      {mobileOpen && (
        <>
          <div className="mobile-drawer-backdrop" onClick={() => setMobileOpen(false)} />
          <div className="mobile-nav-drawer">
            <div className="mobile-drawer-header">
              <div className="pro-nav-brand" onClick={() => handleNav('landing')}>
                <span className="pro-brand-symbol">⚡</span>
                <span className="pro-brand-title">alertroutes</span>
              </div>
              <button
                className="mobile-drawer-close"
                onClick={() => setMobileOpen(false)}
                aria-label="Close Menu"
              >
                ✕
              </button>
            </div>

            {isAuthenticated && (
              <div className="mobile-drawer-user-card" onClick={() => handleNav('profile')}>
                <div className="pro-nav-avatar">
                  {user?.avatar ? <img src={user.avatar} alt={user.name} /> : getInitials(user?.name)}
                </div>
                <div className="mobile-user-details">
                  <span className="mobile-user-name">{user?.name || 'Verified Responder'}</span>
                  <span className="mobile-user-email">{user?.email}</span>
                </div>
              </div>
            )}

            <div className="mobile-drawer-links">
              <button
                className={`mobile-nav-link ${currentPage === 'landing' ? 'active' : ''}`}
                onClick={() => handleNav('landing')}
              >
                <span className="drawer-link-icon">🏠</span>
                <span>Landing Page</span>
              </button>

              {isAuthenticated && (
                <button
                  className={`mobile-nav-link ${currentPage === 'dashboard' || currentPage === 'home' ? 'active' : ''}`}
                  onClick={() => handleNav('dashboard')}
                >
                  <span className="drawer-link-icon">📊</span>
                  <span>Operations Dashboard</span>
                </button>
              )}

              <button
                className={`mobile-nav-link ${currentPage === 'map' ? 'active' : ''}`}
                onClick={() => handleNav('map')}
              >
                <span className="drawer-link-icon">🗺️</span>
                <span>Live Hazard Map</span>
              </button>

              <button
                className={`mobile-nav-link ${currentPage === 'reports' ? 'active' : ''}`}
                onClick={() => handleNav('reports')}
              >
                <span className="drawer-link-icon">🚨</span>
                <span>Incident Reports</span>
                {reports.length > 0 && <span className="pro-reports-badge">{reports.length}</span>}
              </button>

              <button
                className={`mobile-nav-link danger ${currentPage === 'sos' ? 'active' : ''}`}
                onClick={() => handleNav('sos')}
              >
                <span className="drawer-link-icon">🆘</span>
                <span>Emergency SOS Hub</span>
              </button>

              <button
                className={`mobile-nav-link ${currentPage === 'shelters' ? 'active' : ''}`}
                onClick={() => handleNav('shelters')}
              >
                <span className="drawer-link-icon">🏕️</span>
                <span>Safe Shelters</span>
              </button>

              <button
                className={`mobile-nav-link ${currentPage === 'analytics' ? 'active' : ''}`}
                onClick={() => handleNav('analytics')}
              >
                <span className="drawer-link-icon">📈</span>
                <span>Crisis Analytics</span>
              </button>
            </div>

            <div className="mobile-drawer-footer">
              {isAuthenticated ? (
                <>
                  <button
                    className={`mobile-nav-link ${currentPage === 'profile' ? 'active' : ''}`}
                    onClick={() => handleNav('profile')}
                  >
                    <span className="drawer-link-icon">👤</span>
                    <span>Profile &amp; Medical ID</span>
                  </button>
                  <button
                    className={`mobile-nav-link ${currentPage === 'security' ? 'active' : ''}`}
                    onClick={() => handleNav('security')}
                  >
                    <span className="drawer-link-icon">🔒</span>
                    <span>Security Settings</span>
                  </button>
                  <button className="mobile-nav-link text-danger" onClick={logout}>
                    <span className="drawer-link-icon">↩</span>
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <div className="mobile-auth-actions">
                  <button
                    className="btn btn-secondary btn-full"
                    onClick={() => handleNav('login')}
                  >
                    Sign In
                  </button>
                  <button
                    className="btn btn-primary btn-full"
                    onClick={() => handleNav('register')}
                  >
                    Create Account
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
