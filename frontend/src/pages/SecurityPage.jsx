import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function SecurityPage() {
  const { updateToken } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);

    try {
      const data = await api.changePassword(currentPassword, newPassword);
      // Update token since old one is now invalidated
      updateToken(data.token);
      setSuccess('Password changed successfully! A confirmation email has been sent.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-section">
        <div className="profile-section-header">
          <h3>🔒 Change Password</h3>
        </div>

        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: 'var(--font-size-sm)',
            marginBottom: 'var(--space-lg)',
          }}
        >
          Update your password to keep your account secure. You'll receive an
          email confirmation when your password is changed.
        </p>

        {error && (
          <div className="alert alert-error">⚠️ {error}</div>
        )}
        {success && (
          <div className="alert alert-success">✅ {success}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="current-password">
              Current Password
            </label>
            <div className="input-with-icon">
              <span className="input-icon">🔑</span>
              <input
                id="current-password"
                type={showPasswords ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="new-password">
              New Password
            </label>
            <div className="input-with-icon">
              <span className="input-icon">🔒</span>
              <input
                id="new-password"
                type={showPasswords ? 'text' : 'password'}
                className="form-input"
                placeholder="Min. 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPasswords(!showPasswords)}
                tabIndex={-1}
              >
                {showPasswords ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirm-new-password">
              Confirm New Password
            </label>
            <div className="input-with-icon">
              <span className="input-icon">🔒</span>
              <input
                id="confirm-new-password"
                type={showPasswords ? 'text' : 'password'}
                className={`form-input ${
                  confirmNewPassword && newPassword !== confirmNewPassword
                    ? 'error'
                    : ''
                }`}
                placeholder="Re-enter new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          {/* Password strength indicator */}
          {newPassword && (
            <div
              style={{
                marginBottom: 'var(--space-lg)',
                padding: 'var(--space-md)',
                background: 'rgba(15, 15, 35, 0.5)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--text-muted)',
                  marginBottom: 'var(--space-sm)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontWeight: 600,
                }}
              >
                Password Requirements
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: newPassword.length >= 6 ? 'var(--success)' : 'var(--text-muted)',
                  }}
                >
                  {newPassword.length >= 6 ? '✅' : '○'} At least 6 characters
                </span>
                <span
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: /[A-Z]/.test(newPassword) ? 'var(--success)' : 'var(--text-muted)',
                  }}
                >
                  {/[A-Z]/.test(newPassword) ? '✅' : '○'} Contains uppercase letter
                </span>
                <span
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: /[0-9]/.test(newPassword) ? 'var(--success)' : 'var(--text-muted)',
                  }}
                >
                  {/[0-9]/.test(newPassword) ? '✅' : '○'} Contains number
                </span>
                <span
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: /[^A-Za-z0-9]/.test(newPassword) ? 'var(--success)' : 'var(--text-muted)',
                  }}
                >
                  {/[^A-Za-z0-9]/.test(newPassword) ? '✅' : '○'} Contains special character
                </span>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            id="change-password-submit"
          >
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Security Tips */}
      <div className="profile-section">
        <div className="profile-section-header">
          <h3>🛡️ Security Tips</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="profile-field">
            <span className="profile-field-label">Strong Passwords</span>
            <span className="profile-field-value" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              Use a mix of uppercase, lowercase, numbers, and special characters. Avoid using personal information.
            </span>
          </div>
          <div className="profile-field">
            <span className="profile-field-label">Unique Passwords</span>
            <span className="profile-field-value" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              Don't reuse passwords across different services. Consider using a password manager.
            </span>
          </div>
          <div className="profile-field">
            <span className="profile-field-label">Regular Updates</span>
            <span className="profile-field-value" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              Change your password periodically, especially if you suspect unauthorized access.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
