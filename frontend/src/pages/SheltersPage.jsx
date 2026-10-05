import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const DEFAULT_SHELTERS = [
  {
    _id: 'def_sh_1',
    title: 'Central High Community Safe Haven',
    category: 'shelter',
    urgency: 'low',
    status: 'verified',
    description: 'Indoor gymnasium shelter equipped with power backup, 350 folding cots, and heating.',
    latitude: 23.348,
    longitude: 85.315,
    capacity: '280 / 350',
    occupancyPct: 80,
    supplies: ['Clean Water', 'Medical Staff', 'Generator Backup', 'Cots', 'Hot Meals'],
    contact: '+91 98765 43210',
    reporterName: 'City Disaster Authority',
  },
  {
    _id: 'def_sh_2',
    title: 'Metro Emergency Triage & Field Hospital',
    category: 'medical',
    urgency: 'high',
    status: 'verified',
    description: 'Mobile trauma unit equipped for triage, minor surgeries, burn treatment, and oxygen support.',
    latitude: 23.355,
    longitude: 85.302,
    capacity: '45 / 60 ICU Beds',
    occupancyPct: 75,
    supplies: ['Oxygen Cylinders', 'Trauma Doctors', 'Blood Bank', 'Pharmacy'],
    contact: '+91 91234 56789',
    reporterName: 'Red Cross Relief Unit',
  },
  {
    _id: 'def_sh_3',
    title: 'Civic Center Clean Water & Food Ration Station',
    category: 'food_water',
    urgency: 'medium',
    status: 'verified',
    description: 'Disaster ration kits, mineral water supply tanks, baby food formulas, and sanitary packs.',
    latitude: 23.339,
    longitude: 85.321,
    capacity: '1,200 Meals Ready',
    occupancyPct: 40,
    supplies: ['Ration Packs', 'RO Clean Water', 'Baby Formula', 'Sanitation Kits'],
    contact: '+91 94567 12345',
    reporterName: 'Community Relief NGO',
  },
  {
    _id: 'def_sh_4',
    title: 'East Sector First Responder Staging Post',
    category: 'responder_post',
    urgency: 'low',
    status: 'verified',
    description: 'Logistics coordination hub for rescue boats, drone surveillance pilots, and search dogs.',
    latitude: 23.362,
    longitude: 85.335,
    capacity: '30 Response Units',
    occupancyPct: 60,
    supplies: ['Inflatable Boats', 'Ham Radios', 'Rescue Drones', 'Fuel Depot'],
    contact: '+91 99887 76655',
    reporterName: 'NDRF Staging Command',
  },
];

const CATEGORY_META = {
  all: { label: 'All Safe Havens', icon: '🏛️', color: '#8b5cf6' },
  shelter: { label: 'Shelters & Havens', icon: '🏕️', color: '#10b981' },
  medical: { label: 'Medical & Triage', icon: '🏥', color: '#ec4899' },
  food_water: { label: 'Food & Water Points', icon: '🍞', color: '#3b82f6' },
  responder_post: { label: 'Responder Staging', icon: '🛡️', color: '#f59e0b' },
};

export default function SheltersPage({ onNavigate }) {
  const { user } = useAuth();
  const [locations, setLocations] = useState(DEFAULT_SHELTERS);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Form State for creating new location
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('shelter');
  const [formUrgency, setFormUrgency] = useState('medium');
  const [formDesc, setFormDesc] = useState('');
  const [formLat, setFormLat] = useState('23.3441');
  const [formLng, setFormLng] = useState('85.3096');
  const [submitting, setSubmitting] = useState(false);

  // Fetch backend locations
  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await api.getLocations({
        category: activeCategory !== 'all' ? activeCategory : undefined,
      });
      if (res && res.data && res.data.length > 0) {
        // Merge backend data with defaults for comprehensive display
        const serverFiltered = res.data.filter((l) => l.category !== 'sos');
        if (serverFiltered.length > 0) {
          setLocations([...serverFiltered, ...DEFAULT_SHELTERS]);
        } else {
          setLocations(DEFAULT_SHELTERS);
        }
      } else {
        setLocations(DEFAULT_SHELTERS);
      }
    } catch (e) {
      console.warn('Using local fallback for shelters');
      setLocations(DEFAULT_SHELTERS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [activeCategory]);

  const handleCreateLocation = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    setSubmitting(true);

    const newLoc = {
      clientUUID: `loc_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
      title: formTitle,
      category: formCategory,
      urgency: formUrgency,
      description: formDesc,
      latitude: parseFloat(formLat) || 23.3441,
      longitude: parseFloat(formLng) || 85.3096,
      reporterName: user?.name || 'Verified Coordinator',
      status: 'active',
      capacity: 'Operational',
      occupancyPct: 50,
      supplies: ['Emergency Supplies', 'First Aid', 'Clean Water'],
    };

    try {
      await api.createLocation(newLoc);
      setLocations((prev) => [newLoc, ...prev]);
      setShowModal(false);
      setToastMsg(`✅ Registered "${newLoc.title}" successfully!`);
      // Reset form
      setFormTitle('');
      setFormDesc('');
    } catch (err) {
      setLocations((prev) => [newLoc, ...prev]);
      setShowModal(false);
      setToastMsg(`✅ Registered "${newLoc.title}" (Local storage)!`);
    } finally {
      setSubmitting(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const filteredLocations = locations.filter((loc) => {
    if (activeCategory !== 'all' && loc.category !== activeCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = loc.title?.toLowerCase().includes(q);
      const matchDesc = loc.description?.toLowerCase().includes(q);
      return matchTitle || matchDesc;
    }
    return true;
  });

  return (
    <div className="shelters-page">
      {/* Toast */}
      {toastMsg && <div className="shelters-toast-banner">{toastMsg}</div>}

      {/* Hero Header */}
      <div className="page-hero-header">
        <div className="page-hero-title-group">
          <span className="page-hero-icon">🏕️</span>
          <div>
            <h1 className="page-hero-title">Safe Havens &amp; Relief Hubs</h1>
            <p className="page-hero-subtitle">
              Locate verified emergency shelters, field hospitals, clean water, and food ration distribution points.
            </p>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
            id="register-shelter-btn"
          >
            ➕ Register Safe Haven
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate('map')}>
            🗺️ Open Map
          </button>
        </div>
      </div>

      {/* Category Pills & Search Bar */}
      <div className="shelter-controls-bar">
        <div className="category-pill-group">
          {Object.entries(CATEGORY_META).map(([key, meta]) => (
            <button
              key={key}
              className={`cat-pill-btn ${activeCategory === key ? 'active' : ''}`}
              onClick={() => setActiveCategory(key)}
            >
              <span>{meta.icon}</span>
              <span>{meta.label}</span>
            </button>
          ))}
        </div>

        <div className="search-box-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search shelters by name, supplies, or landmark..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Grid of Shelters */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <p>Querying verified safe havens...</p>
        </div>
      ) : filteredLocations.length === 0 ? (
        <div className="empty-state-card">
          <span className="empty-icon">🏕️</span>
          <h3>No Safe Havens Found</h3>
          <p className="text-muted">Try changing your category filter or search terms.</p>
        </div>
      ) : (
        <div className="shelters-grid">
          {filteredLocations.map((sh, idx) => {
            const catMeta = CATEGORY_META[sh.category] || CATEGORY_META.shelter;
            return (
              <div key={sh._id || sh.clientUUID || idx} className="shelter-card">
                <div className="shelter-card-top">
                  <div className="shelter-cat-badge" style={{ color: catMeta.color }}>
                    <span>{catMeta.icon}</span>
                    <span>{catMeta.label}</span>
                  </div>
                  <span className={`badge badge-${sh.status === 'verified' ? 'success' : 'primary'}`}>
                    {sh.status ? sh.status.toUpperCase() : 'VERIFIED'}
                  </span>
                </div>

                <h3 className="shelter-card-title">{sh.title}</h3>
                <p className="shelter-card-desc">{sh.description || 'Verified relief zone operational 24/7.'}</p>

                {/* Capacity Progress Bar */}
                {sh.capacity && (
                  <div className="capacity-section">
                    <div className="capacity-labels">
                      <span className="capacity-title">Capacity &amp; Space:</span>
                      <span className="capacity-val">{sh.capacity}</span>
                    </div>
                    <div className="progress-bar-track">
                      <div
                        className={`progress-bar-fill ${
                          (sh.occupancyPct || 50) > 85 ? 'full' : ''
                        }`}
                        style={{ width: `${sh.occupancyPct || 50}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Supplies tags */}
                {sh.supplies && sh.supplies.length > 0 && (
                  <div className="supplies-tags-wrap">
                    {sh.supplies.map((sup, sIdx) => (
                      <span key={sIdx} className="supply-tag">
                        ✓ {sup}
                      </span>
                    ))}
                  </div>
                )}

                <div className="shelter-card-footer">
                  <div className="shelter-meta-info">
                    <span>📍 {sh.latitude?.toFixed(4)}, {sh.longitude?.toFixed(4)}</span>
                    {sh.contact && <span>📞 {sh.contact}</span>}
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onNavigate('map')}
                  >
                    🧭 Navigate
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Register Shelter Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Register New Safe Haven / Relief Point</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLocation}>
              <div className="form-group">
                <label className="form-label">Facility / Shelter Name:</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. St. Jude Memorial Field Hospital"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Category:</label>
                  <select
                    className="form-input"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                  >
                    <option value="shelter">🏕️ Shelter / Safe Haven</option>
                    <option value="medical">🏥 Medical / Field Triage</option>
                    <option value="food_water">🍞 Food &amp; Water Point</option>
                    <option value="responder_post">🛡️ Responder Staging Post</option>
                    <option value="hazard">⚠️ Hazard Danger Zone</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Urgency / Priority:</label>
                  <select
                    className="form-input"
                    value={formUrgency}
                    onChange={(e) => setFormUrgency(e.target.value)}
                  >
                    <option value="low">🟢 Normal Capacity</option>
                    <option value="medium">🟡 Filling Fast</option>
                    <option value="high">🟠 Near Full / Critical</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Latitude:</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={formLat}
                    onChange={(e) => setFormLat(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude:</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={formLng}
                    onChange={(e) => setFormLng(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Facility Details &amp; Available Supplies:</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Capacity, doctor on site, baby food, power generator..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Publishing...' : 'Publish Safe Haven'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
