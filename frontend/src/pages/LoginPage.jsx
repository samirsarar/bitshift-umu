import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ onNavigate }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      onNavigate('map');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Glow ambient */}
        <div className="auth-card-glow" />

        <div className="auth-header">
          <div className="auth-icon-wrap">
            <span className="auth-icon">🛡️</span>
          </div>
          <h1>Responder &amp; Citizen Sign In</h1>
          <p>Access live crisis telemetry, reports, and emergency dispatch</p>
        </div>

        {error && (
          <div className="alert alert-error" id="login-error">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Email Address
            </label>
            <div className="input-with-icon">
              <span className="input-icon">✉</span>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="citizen@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <div className="label-with-action">
              <label className="form-label" htmlFor="login-password">
                Password
              </label>
              <button
                type="button"
                className="text-btn text-xs"
                onClick={() => alert('Password reset link sent to your registered email.')}
              >
                Forgot password?
              </button>
            </div>
            <div className="input-with-icon">
              <span className="input-icon">🔒</span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
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
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            id="login-submit"
          >
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Authenticating...' : 'Sign In to Portal →'}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="demo-credentials-box">
          <span className="demo-title">⚡ Quick Fill Demo Accounts:</span>
          <div className="demo-buttons-grid">
            <button
              type="button"
              className="demo-btn"
              onClick={() => handleQuickDemo('officer@alertroutes.com', 'responder123')}
            >
              <div className="demo-btn-content">
                <span className="demo-role-icon">🧑‍🚒</span>
                <div className="demo-text">
                  <strong>First Responder</strong>
                  <small>officer@alertroutes.com</small>
                </div>
              </div>
            </button>
            <button
              type="button"
              className="demo-btn"
              onClick={() => handleQuickDemo('citizen@alertroutes.com', 'citizen123')}
            >
              <div className="demo-btn-content">
                <span className="demo-role-icon">👤</span>
                <div className="demo-text">
                  <strong>Resident Citizen</strong>
                  <small>citizen@alertroutes.com</small>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="auth-footer">
          Don&apos;t have an account?{' '}
          <button className="link-button" onClick={() => onNavigate('register')}>
            Register as New Responder
          </button>
        </div>
      </div>
    </div>
  );
}
