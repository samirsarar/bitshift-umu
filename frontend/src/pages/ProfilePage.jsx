import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bio: '',
    avatar: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
      });
    }
  }, [user]);

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const data = await api.updateProfile(formData);
      updateUser(data.user);
      setSuccess('Profile updated successfully!');
      setEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setError('');
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      avatar: user?.avatar || '',
    });
  };

  if (!user) return null;

  return (
    <div className="profile-page">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} />
          ) : (
            getInitials(user.name)
          )}
        </div>
        <div className="profile-info">
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <p className="member-since">
            Member since {formatDate(user.createdAt)}
          </p>
        </div>
      </div>

      {success && (
        <div className="alert alert-success">✅ {success}</div>
      )}
      {error && (
        <div className="alert alert-error">⚠️ {error}</div>
      )}

      {/* Profile Details / Edit Form */}
      <div className="profile-section">
        <div className="profile-section-header">
          <h3>👤 Personal Information</h3>
          {!editing && (
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setEditing(true)}
              id="edit-profile-btn"
            >
              ✏️ Edit
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="profile-name">
                Full Name
              </label>
              <input
                id="profile-name"
                name="name"
                type="text"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="profile-phone">
                Phone Number
              </label>
              <input
                id="profile-phone"
                name="phone"
                type="tel"
                className="form-input"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="profile-bio">
                Bio
              </label>
              <textarea
                id="profile-bio"
                name="bio"
                className="form-input"
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChange={handleChange}
                maxLength={500}
              />
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--text-muted)',
                  marginTop: '4px',
                  display: 'block',
                }}
              >
                {formData.bio.length}/500
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="profile-avatar">
                Avatar URL
              </label>
              <input
                id="profile-avatar"
                name="avatar"
                type="url"
                className="form-input"
                placeholder="https://example.com/avatar.jpg"
                value={formData.avatar}
                onChange={handleChange}
              />
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                id="save-profile-btn"
              >
                {loading ? <span className="spinner" /> : null}
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="profile-field">
              <span className="profile-field-label">Full Name</span>
              <span className="profile-field-value">{user.name}</span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Email</span>
              <span className="profile-field-value">{user.email}</span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Phone</span>
              <span
                className={`profile-field-value ${!user.phone ? 'empty' : ''}`}
              >
                {user.phone || 'Not provided'}
              </span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Bio</span>
              <span
                className={`profile-field-value ${!user.bio ? 'empty' : ''}`}
              >
                {user.bio || 'No bio added yet'}
              </span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Avatar</span>
              <span
                className={`profile-field-value ${!user.avatar ? 'empty' : ''}`}
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt="avatar preview"
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 'var(--radius-full)',
                      objectFit: 'cover',
                      marginTop: 'var(--space-xs)',
                    }}
                  />
                ) : (
                  'No avatar set'
                )}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
