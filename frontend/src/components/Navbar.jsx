import { useAuth } from '../context/AuthContext';

export default function Navbar({ currentPage, onNavigate }) {
  const { user, isAuthenticated, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="navbar">
      <div
        className="navbar-brand"
        onClick={() => onNavigate(isAuthenticated ? 'profile' : 'login')}
      >
        <span className="brand-icon">⚡</span>
        Web Arena
      </div>

      <div className="navbar-nav">
        {isAuthenticated ? (
          <>
            <button
              className={`nav-link ${currentPage === 'profile' ? 'active' : ''}`}
              onClick={() => onNavigate('profile')}
              id="nav-profile"
            >
              📋 Profile
            </button>
            <button
              className={`nav-link ${currentPage === 'security' ? 'active' : ''}`}
              onClick={() => onNavigate('security')}
              id="nav-security"
            >
              🔒 Security
            </button>
            <button className="nav-link logout" onClick={logout} id="nav-logout">
              ↩ Logout
            </button>
            <div className="nav-avatar" title={user?.name}>
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                getInitials(user?.name)
              )}
            </div>
          </>
        ) : (
          <>
            <button
              className={`nav-link ${currentPage === 'login' ? 'active' : ''}`}
              onClick={() => onNavigate('login')}
              id="nav-login"
            >
              Login
            </button>
            <button
              className={`nav-link ${currentPage === 'register' ? 'active' : ''}`}
              onClick={() => onNavigate('register')}
              id="nav-register"
            >
              Register
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
