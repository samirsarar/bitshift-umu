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

  // Emergency Medical ID state
  const [medicalId, setMedicalId] = useState({
    bloodGroup: 'O+',
    allergies: 'Penicillin, Peanuts',
    conditions: 'Mild Asthma',
    emergencyContactName: 'David Jenkins (Spouse)',
    emergencyContactPhone: '+91 98765 00112',
    address: 'Flat 402, Green Valley Apts, Sector 4',
    organDonor: true,
  });
  const [editingMedical, setEditingMedical] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
      });
    }
    // Load local medical ID
    const savedMed = localStorage.getItem(`med_id_${user?.email || 'default'}`);
    if (savedMed) {
      try {
        setMedicalId(JSON.parse(savedMed));
      } catch (e) {}
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
    if (!dateStr) return 'Recently';
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
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMedical = (e) => {
    e.preventDefault();
    localStorage.setItem(`med_id_${user?.email || 'default'}`, JSON.stringify(medicalId));
    setEditingMedical(false);
    setSuccess('Emergency Medical ID saved!');
    setTimeout(() => setSuccess(''), 3000);
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
          <div className="profile-badges-row">
            <span className="badge badge-primary">
              🛡️ {user.role === 'admin' ? 'System Commander' : 'Verified Responder / Citizen'}
            </span>
            <span className="member-since">Joined {formatDate(user.createdAt)}</span>
          </div>
        </div>
      </div>

      {success && <div className="alert alert-success">✅ {success}</div>}
      {error && <div className="alert alert-error">⚠️ {error}</div>}

      <div className="profile-grid-2">
        {/* Personal Information */}
        <div className="profile-section">
          <div className="profile-section-header">
            <h3>👤 Personal Account Information</h3>
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
                  Responder Bio / Notes
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
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="profile-avatar">
                  Avatar Image URL
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
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-fields-stack">
              <div className="profile-field">
                <span className="profile-field-label">Full Name</span>
                <span className="profile-field-value">{user.name}</span>
              </div>
              <div className="profile-field">
                <span className="profile-field-label">Email Address</span>
                <span className="profile-field-value">{user.email}</span>
              </div>
              <div className="profile-field">
                <span className="profile-field-label">Phone Contact</span>
                <span className="profile-field-value">{user.phone || 'Not provided'}</span>
              </div>
              <div className="profile-field">
                <span className="profile-field-label">Role</span>
                <span className="profile-field-value text-accent">{user.role || 'Citizen'}</span>
              </div>
              <div className="profile-field">
                <span className="profile-field-label">Bio</span>
                <span className="profile-field-value">{user.bio || 'Community participant.'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Emergency Medical ID Card */}
        <div className="profile-section medical-id-section">
          <div className="profile-section-header">
            <h3>🏥 Emergency Medical ID (Paramedic Access)</h3>
            {!editingMedical ? (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setEditingMedical(true)}
              >
                ✏️ Edit Medical ID
              </button>
            ) : null}
          </div>

          {editingMedical ? (
            <form onSubmit={handleSaveMedical}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Blood Group:</label>
                  <select
                    className="form-input"
                    value={medicalId.bloodGroup}
                    onChange={(e) => setMedicalId({ ...medicalId, bloodGroup: e.target.value })}
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Organ Donor:</label>
                  <select
                    className="form-input"
                    value={medicalId.organDonor ? 'yes' : 'no'}
                    onChange={(e) =>
                      setMedicalId({ ...medicalId, organDonor: e.target.value === 'yes' })
                    }
                  >
                    <option value="yes">Yes (Registered Donor)</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Known Allergies:</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Penicillin, Latex, Bee stings"
                  value={medicalId.allergies}
                  onChange={(e) => setMedicalId({ ...medicalId, allergies: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Chronic Conditions / Prescriptions:</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Type 1 Diabetes, Hypertension"
                  value={medicalId.conditions}
                  onChange={(e) => setMedicalId({ ...medicalId, conditions: e.target.value })}
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Emergency Contact Name:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={medicalId.emergencyContactName}
                    onChange={(e) =>
                      setMedicalId({ ...medicalId, emergencyContactName: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Emergency Contact Phone:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={medicalId.emergencyContactPhone}
                    onChange={(e) =>
                      setMedicalId({ ...medicalId, emergencyContactPhone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Home / Shelter Address:</label>
                <input
                  type="text"
                  className="form-input"
                  value={medicalId.address}
                  onChange={(e) => setMedicalId({ ...medicalId, address: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                <button type="submit" className="btn btn-primary">
                  Save Medical ID
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingMedical(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="medical-card-preview">
              <div className="med-card-top">
                <div className="blood-badge">
                  <span className="blood-icon">🩸</span>
                  <span className="blood-type">{medicalId.bloodGroup}</span>
                </div>
                <div className="med-donor-tag">
                  {medicalId.organDonor ? '❤️ ORGAN DONOR' : 'STANDARD'}
                </div>
              </div>

              <div className="med-field-row">
                <span className="med-label">⚠️ Allergies:</span>
                <span className="med-val danger">{medicalId.allergies || 'None recorded'}</span>
              </div>

              <div className="med-field-row">
                <span className="med-label">💊 Medical Conditions:</span>
                <span className="med-val">{medicalId.conditions || 'None'}</span>
              </div>

              <div className="med-field-row">
                <span className="med-label">🚨 Emergency Contact:</span>
                <span className="med-val highlight">
                  {medicalId.emergencyContactName} ({medicalId.emergencyContactPhone})
                </span>
              </div>

              <div className="med-field-row">
                <span className="med-label">🏠 Residential Address:</span>
                <span className="med-val">{medicalId.address}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
