import { useState } from 'react';

const DISASTER_TYPES = {
  flood:          { emoji: '🌊', label: 'Flood',              color: '#3b82f6' },
  fire:           { emoji: '🔥', label: 'Fire',               color: '#ef4444' },
  earthquake:     { emoji: '🌍', label: 'Earthquake',         color: '#f59e0b' },
  accident:       { emoji: '🚨', label: 'Road Accident',      color: '#f97316' },
  landslide:      { emoji: '⛰️',  label: 'Landslide',         color: '#a16207' },
  power:          { emoji: '⚡', label: 'Power Outage',      color: '#fbbf24' },
  medical:        { emoji: '🏥', label: 'Medical Emergency',  color: '#ec4899' },
  infrastructure: { emoji: '🏗️', label: 'Infrastructure',    color: '#6366f1' },
  other:          { emoji: '⚠️', label: 'Other',              color: '#94a3b8' },
};

const SEVERITY_COLORS = {
  low:      '#22c55e',
  medium:   '#f59e0b',
  high:     '#f97316',
  critical: '#ef4444',
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ReportsPage({ reports, onNavigate }) {
  const [filter, setFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  const filtered = reports.filter((r) => {
    if (filter !== 'all' && r.type !== filter) return false;
    if (severityFilter !== 'all' && r.severity !== severityFilter) return false;
    const matchesSearch =
      !search ||
      (r.title && r.title.toLowerCase().includes(search.toLowerCase())) ||
      (r.location && r.location.toLowerCase().includes(search.toLowerCase()));
    if (!matchesSearch) return false;
    return true;
  });

  const counts = {};
  reports.forEach((r) => { counts[r.type] = (counts[r.type] || 0) + 1; });

  return (
    <div className="reports-page">
      {/* Header */}
      <div className="reports-page-header">
        <div className="reports-page-title-wrap">
          <span className="reports-page-icon">🚨</span>
          <div>
            <h1 className="reports-page-title">Incident Reports</h1>
            <p className="reports-page-subtitle">
              {reports.length} {reports.length === 1 ? 'report' : 'reports'} submitted by the community
            </p>
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => onNavigate('map')}
          id="reports-view-map-btn"
        >
          🗺️ View on Map
        </button>
      </div>

      {/* Stats bar */}
      {reports.length > 0 && (
        <div className="reports-stats-bar">
          {Object.entries(counts).map(([type, count]) => {
            const t = DISASTER_TYPES[type];
            return (
              <div
                key={type}
                className={`reports-stat-chip ${filter === type ? 'active' : ''}`}
                style={{ '--chip-color': t?.color }}
                onClick={() => setFilter(filter === type ? 'all' : type)}
              >
                <span>{t?.emoji}</span>
                <span>{t?.label}</span>
                <span className="reports-stat-count">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="reports-filter-row">
        <input
          className="report-input"
          type="text"
          placeholder="🔍 Search reports…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="reports-search-input"
          style={{ maxWidth: 280 }}
        />
        <div className="reports-severity-filter">
          {['all', 'low', 'medium', 'high', 'critical'].map((s) => (
            <button
              key={s}
              className={`reports-sev-chip ${severityFilter === s ? 'active' : ''}`}
              style={s !== 'all' ? { '--chip-color': SEVERITY_COLORS[s] } : {}}
              onClick={() => setSeverityFilter(s)}
              id={`reports-filter-${s}`}
            >
              {s === 'all' ? 'All severities' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {reports.length === 0 && (
        <div className="reports-empty">
          <div className="reports-empty-icon">📭</div>
          <h3>No reports yet</h3>
          <p>Be the first to report an incident. Go to the Map and click "🚨 Report Incident".</p>
          <button className="btn btn-primary" onClick={() => onNavigate('map')} id="reports-go-map-btn">
            Go to Map
          </button>
        </div>
      )}

      {/* Report cards */}
      {filtered.length === 0 && reports.length > 0 && (
        <div className="reports-empty">
          <div className="reports-empty-icon">🔍</div>
          <h3>No matching reports</h3>
          <p>Try adjusting the filters or search term.</p>
        </div>
      )}

      <div className="reports-list">
        {filtered.map((report) => {
          const reportId = report.id || report._id;
          const reportTime = report.timestamp || report.createdAt || new Date().toISOString();
          const t = DISASTER_TYPES[report.type] || DISASTER_TYPES.other;
          const isOpen = expanded === reportId;
          return (
            <div
              key={reportId}
              className={`report-card-item ${isOpen ? 'expanded' : ''}`}
              style={{ '--card-color': t.color }}
            >
              <div className="report-card-main" onClick={() => setExpanded(isOpen ? null : reportId)}>
                <div className="report-card-left">
                  <div className="report-card-emoji-wrap" style={{ background: `${t.color}22`, borderColor: `${t.color}44` }}>
                    <span>{t.emoji}</span>
                  </div>
                  <div>
                    <div className="report-card-title">{report.title}</div>
                    <div className="report-card-meta">
                      <span className="report-card-type-badge" style={{ background: `${t.color}22`, color: t.color }}>
                        {t.label}
                      </span>
                      <span
                        className="report-card-sev-badge"
                        style={{ background: `${SEVERITY_COLORS[report.severity]}22`, color: SEVERITY_COLORS[report.severity] }}
                      >
                        ● {report.severity}
                      </span>
                    </div>
                    <div className="report-card-location">📍 {report.location || 'Location not specified'}</div>
                  </div>
                </div>
                <div className="report-card-right">
                  <span className="report-card-time">{timeAgo(reportTime)}</span>
                  <span className="report-card-chevron">{isOpen ? '▲' : '▼'}</span>
                </div>
              </div>
              {isOpen && (
                <div className="report-card-details">
                  {report.description && (
                    <p className="report-card-desc">{report.description}</p>
                  )}
                  <div className="report-card-detail-row">
                    <span>🕐 Reported: {new Date(reportTime).toLocaleString()}</span>
                  </div>
                  <div className="report-card-detail-row">
                    <span>🆔 ID: {reportId}</span>
                  </div>
                  {report.reportedBy && (
                    <div className="report-card-detail-row">
                      <span>👤 By: {report.reportedBy}</span>
                    </div>
                  )}
                  <button
                    className="btn btn-outline"
                    style={{ marginTop: 8, fontSize: '0.8rem', padding: '6px 14px' }}
                    onClick={() => onNavigate('map')}
                    id={`report-view-map-${reportId}`}
                  >
                    📍 View on Map
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
