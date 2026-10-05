import { useState } from 'react';
import { api } from '../services/api';
import ReportModal from '../components/ReportModal';

const DISASTER_TYPES = {
  flood: { emoji: '🌊', label: 'Flood', color: '#3b82f6' },
  fire: { emoji: '🔥', label: 'Fire', color: '#ef4444' },
  earthquake: { emoji: '🌍', label: 'Earthquake', color: '#f59e0b' },
  accident: { emoji: '🚨', label: 'Road Accident', color: '#f97316' },
  landslide: { emoji: '⛰️', label: 'Landslide', color: '#a16207' },
  power: { emoji: '⚡', label: 'Power Outage', color: '#fbbf24' },
  medical: { emoji: '🏥', label: 'Medical Emergency', color: '#ec4899' },
  infrastructure: { emoji: '🏗️', label: 'Infrastructure', color: '#6366f1' },
  other: { emoji: '⚠️', label: 'Other', color: '#94a3b8' },
};

const SEVERITY_COLORS = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

function timeAgo(iso) {
  if (!iso) return 'Just now';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ReportsPage({ reports = [], onNavigate, onAddReport, onUpdateReport, onDeleteReport }) {
  const [filter, setFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [actionToast, setActionToast] = useState(null);

  const filtered = reports.filter((r) => {
    if (filter !== 'all' && r.type !== filter) return false;
    if (severityFilter !== 'all' && r.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && (r.status || 'active') !== statusFilter) return false;
    const matchesSearch =
      !search ||
      (r.title && r.title.toLowerCase().includes(search.toLowerCase())) ||
      (r.location && r.location.toLowerCase().includes(search.toLowerCase())) ||
      (r.description && r.description.toLowerCase().includes(search.toLowerCase()));
    if (!matchesSearch) return false;
    return true;
  });

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      await api.updateReportStatus(reportId, newStatus);
      if (onUpdateReport) {
        onUpdateReport(reportId, { status: newStatus });
      }
      setActionToast(`✅ Status updated to ${newStatus.toUpperCase()}`);
    } catch (err) {
      if (onUpdateReport) {
        onUpdateReport(reportId, { status: newStatus });
      }
      setActionToast(`✅ Status updated (Local)`);
    }
    setTimeout(() => setActionToast(null), 3000);
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('Are you sure you want to dismiss and delete this incident report?')) return;
    try {
      await api.deleteReport(reportId);
      if (onDeleteReport) {
        onDeleteReport(reportId);
      }
      setActionToast(`🗑️ Incident report removed`);
    } catch (err) {
      if (onDeleteReport) {
        onDeleteReport(reportId);
      }
      setActionToast(`🗑️ Incident report removed (Local)`);
    }
    setTimeout(() => setActionToast(null), 3000);
  };

  const handleReportCreated = (newReport) => {
    if (onAddReport) onAddReport(newReport);
    setShowReportModal(false);
    setActionToast(`✅ Incident "${newReport.title}" submitted successfully!`);
    setTimeout(() => setActionToast(null), 4000);
  };

  const exportCSV = () => {
    const headers = ['Title', 'Type', 'Severity', 'Status', 'Location', 'Reporter', 'Date'];
    const rows = filtered.map((r) => [
      `"${(r.title || '').replace(/"/g, '""')}"`,
      r.type,
      r.severity,
      r.status || 'active',
      `"${(r.location || '').replace(/"/g, '""')}"`,
      `"${(r.reportedBy || 'Anonymous').replace(/"/g, '""')}"`,
      r.createdAt || new Date().toISOString(),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `incident_reports_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="reports-page">
      {actionToast && <div className="reports-toast-banner">{actionToast}</div>}

      {/* Header */}
      <div className="reports-page-header">
        <div className="reports-page-title-wrap">
          <span className="reports-page-icon">🚨</span>
          <div>
            <h1 className="reports-page-title">Incident Reports &amp; Dispatch Feed</h1>
            <p className="reports-page-subtitle">
              Live crowdsourced &amp; authority verified emergency reports across all sectors.
            </p>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="btn btn-danger report-incident-btn"
            onClick={() => setShowReportModal(true)}
            id="report-incident-btn"
          >
            <span className="report-btn-pulse" />
            🚨 Report New Incident
          </button>
          <button className="btn btn-secondary" onClick={exportCSV}>
            📥 Export CSV
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate('map')}>
            🗺️ View on Map
          </button>
        </div>
      </div>

      {/* Category Pills & Filters */}
      <div className="reports-filters-bar">
        <div className="type-pill-strip">
          <button
            className={`filter-pill ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({reports.length})
          </button>
          {Object.entries(DISASTER_TYPES).map(([type, cfg]) => {
            const count = reports.filter((r) => r.type === type).length;
            return (
              <button
                key={type}
                className={`filter-pill ${filter === type ? 'active' : ''}`}
                onClick={() => setFilter(type)}
              >
                <span>{cfg.emoji}</span>
                <span>{cfg.label}</span>
                {count > 0 && <span className="pill-count">({count})</span>}
              </button>
            );
          })}
        </div>

        <div className="reports-subfilters">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="form-input search-input"
              placeholder="Search reports by title, location, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="clear-search-btn" onClick={() => setSearch('')}>
                ✕
              </button>
            )}
          </div>

          <div className="dropdowns-wrap">
            <select
              className="form-input form-select-sm"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="all">All Severities</option>
              <option value="critical">🔴 Critical</option>
              <option value="high">🟠 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>

            <select
              className="form-input form-select-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Feed List */}
      {filtered.length === 0 ? (
        <div className="empty-state-card">
          <span className="empty-icon">🛡️</span>
          <h3>No Incident Reports Match Your Filters</h3>
          <p className="text-muted">Adjust your filter selections or submit a new report if an incident occurred.</p>
        </div>
      ) : (
        <div className="reports-list">
          {filtered.map((r, idx) => {
            const typeConfig = DISASTER_TYPES[r.type] || DISASTER_TYPES.other;
            const sevColor = SEVERITY_COLORS[r.severity] || '#94a3b8';
            const isExpanded = expanded === (r.id || r._id || idx);

            return (
              <div
                key={r.id || r._id || idx}
                className={`report-card severity-${r.severity || 'medium'} ${isExpanded ? 'expanded' : ''}`}
                style={{ borderLeftColor: typeConfig.color }}
              >
                <div
                  className="report-card-main"
                  onClick={() => setExpanded(isExpanded ? null : (r.id || r._id || idx))}
                >
                  <div className="report-card-icon" style={{ background: `${typeConfig.color}22` }}>
                    {typeConfig.emoji}
                  </div>

                  <div className="report-card-body">
                    <div className="report-card-header-row">
                      <h3 className="report-title">{r.title}</h3>
                      <div className="report-badges">
                        <span
                          className="report-severity-badge"
                          style={{
                            backgroundColor: `${sevColor}22`,
                            color: sevColor,
                            borderColor: `${sevColor}55`,
                          }}
                        >
                          {(r.severity || 'medium').toUpperCase()}
                        </span>
                        <span className={`report-status-badge status-${r.status || 'active'}`}>
                          {r.status || 'active'}
                        </span>
                      </div>
                    </div>

                    <div className="report-card-meta">
                      {r.location && <span className="meta-item">📍 {r.location}</span>}
                      <span className="meta-item">👤 {r.reportedBy || 'Community Member'}</span>
                      <span className="meta-item">🕒 {timeAgo(r.createdAt || r.timestamp)}</span>
                    </div>

                    {r.description && (
                      <p className="report-description">
                        {isExpanded
                          ? r.description
                          : r.description.length > 140
                          ? `${r.description.slice(0, 140)}...`
                          : r.description}
                      </p>
                    )}
                  </div>

                  <button className="expand-btn" aria-label="Toggle details">
                    {isExpanded ? '▲' : '▼'}
                  </button>
                </div>

                {/* Expanded Details & Actions Drawer */}
                {isExpanded && (
                  <div className="report-card-drawer">
                    <div className="drawer-details-grid">
                      <div className="drawer-detail">
                        <span className="detail-label">Disaster Type:</span>
                        <span className="detail-value">{typeConfig.label}</span>
                      </div>
                      <div className="drawer-detail">
                        <span className="detail-label">GPS Coordinates:</span>
                        <span className="detail-value">
                          {r.coords ? `${r.coords[1]?.toFixed(5)}° N, ${r.coords[0]?.toFixed(5)}° E` : 'Not recorded'}
                        </span>
                      </div>
                      <div className="drawer-detail">
                        <span className="detail-label">Report ID:</span>
                        <span className="detail-value text-muted">{r.id || r._id}</span>
                      </div>
                    </div>

                    <div className="drawer-actions">
                      <div className="status-change-group">
                        <span className="text-muted text-xs">Update Status:</span>
                        <div className="status-buttons">
                          {['active', 'investigating', 'resolved', 'dismissed'].map((st) => (
                            <button
                              key={st}
                              className={`btn btn-xs ${
                                (r.status || 'active') === st ? 'btn-primary' : 'btn-secondary'
                              }`}
                              onClick={() => handleStatusChange(r.id || r._id, st)}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="drawer-btn-row">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onNavigate('map')}
                        >
                          🗺️ View on Map
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(r.id || r._id)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          onClose={() => setShowReportModal(false)}
          onSubmit={handleReportCreated}
          mapCenter={[85.3096, 23.3441]}
        />
      )}
    </div>
  );
}
