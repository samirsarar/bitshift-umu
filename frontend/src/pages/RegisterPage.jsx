import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { id: 'user', label: 'Citizen Reporter', icon: '👤', desc: 'Report incidents, request aid, locate shelters' },
  { id: 'responder', label: 'First Responder / Medic', icon: '🧑‍🚒', desc: 'Acknowledge SOS alerts, coordinate rescue, update routes' },
  { id: 'ngo', label: 'Relief NGO / Volunteer', icon: '🤝', desc: 'Manage shelter supplies, post mutual aid supplies' },
];

export default function RegisterPage({ onNavigate }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('user');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const calculatePasswordStrength = (pass) => {
    let score = 0;
    if (pass.length >= 6) score += 25;
    if (pass.length >= 10) score += 25;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;
    return score;
  };

  const strength = calculatePasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await register(name, email, password);
      onNavigate('profile');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (roleName) => {
    const randomId = Math.floor(Math.random() * 900) + 100;
    if (roleName === 'responder') {
      setName(`Officer John Doe ${randomId}`);
      setEmail(`officer.${randomId}@aegis.org`);
      setPassword('secure123');
      setConfirmPassword('secure123');
      setSelectedRole('responder');
    } else {
      setName(`Sarah Jenkins ${randomId}`);
      setEmail(`sarah.${randomId}@example.com`);
      setPassword('secure123');
      setConfirmPassword('secure123');
      setSelectedRole('user');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-glow" />

        <div className="auth-header">
          <div className="auth-icon-wrap">
            <span className="auth-icon">🚀</span>
          </div>
          <h1>Join Response Network</h1>
          <p>Create an account to report hazards, broadcast SOS, &amp; coordinate aid</p>
        </div>

        {error && (
          <div className="alert alert-error" id="register-error">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Role selector */}
          <div className="form-group">
            <label className="form-label">Select Your Network Role:</label>
            <div className="role-pills-stack">
              {ROLES.map((r) => (
                <div
                  key={r.id}
                  className={`role-card-select ${selectedRole === r.id ? 'active' : ''}`}
                  onClick={() => setSelectedRole(r.id)}
                >
                  <span className="role-icon">{r.icon}</span>
                  <div className="role-text">
                    <strong>{r.label}</strong>
                    <small>{r.desc}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-name">
              Full Name
            </label>
            <div className="input-with-icon">
              <span className="input-icon">👤</span>
              <input
                id="register-name"
                type="text"
                className="form-input"
                placeholder="e.g. Elena Rostova"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-email">
              Email Address
            </label>
            <div className="input-with-icon">
              <span className="input-icon">✉</span>
              <input
                id="register-email"
                type="email"
                className="form-input"
                placeholder="elena@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-password">
              Password
            </label>
            <div className="input-with-icon">
              <span className="input-icon">🔒</span>
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>

            {/* Password strength meter */}
            {password && (
              <div className="password-strength-bar">
                <div
                  className="strength-fill"
                  style={{
                    width: `${strength}%`,
                    backgroundColor:
                      strength <= 25 ? '#ef4444' : strength <= 75 ? '#f59e0b' : '#10b981',
                  }}
                />
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-confirm">
              Confirm Password
            </label>
            <div className="input-with-icon">
              <span className="input-icon">🔒</span>
              <input
                id="register-confirm"
                type={showPassword ? 'text' : 'password'}
                className={`form-input ${
                  confirmPassword && password !== confirmPassword ? 'error' : ''
                }`}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            id="register-submit"
          >
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Registering Account...' : 'Complete Registration →'}
          </button>
        </form>

        {/* Quick Fill Helper */}
        <div className="demo-credentials-box">
          <span className="demo-title">⚡ Auto-fill sample profile:</span>
          <div className="demo-buttons-grid">
            <button
              type="button"
              className="demo-btn"
              onClick={() => handleQuickFill('responder')}
            >
              <div className="demo-btn-content">
                <span className="demo-role-icon">🧑‍🚒</span>
                <div className="demo-text">
                  <strong>Fill First Responder Info</strong>
                  <small>officer@alertroutes.com</small>
                </div>
              </div>
            </button>
            <button
              type="button"
              className="demo-btn"
              onClick={() => handleQuickFill('citizen')}
            >
              <div className="demo-btn-content">
                <span className="demo-role-icon">👤</span>
                <div className="demo-text">
                  <strong>Fill Citizen Reporter Info</strong>
                  <small>citizen@alertroutes.com</small>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="auth-footer">
          Already have an account?{' '}
          <button className="link-button" onClick={() => onNavigate('login')}>
            Sign In Instead
          </button>
        </div>
      </div>
    </div>
  );
}
