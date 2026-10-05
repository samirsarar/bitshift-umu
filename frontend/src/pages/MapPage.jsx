import { useState } from 'react';
import MapView from '../components/MapView';
import ReportModal from '../components/ReportModal';

export default function MapPage({ reports = [], onAddReport }) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [successToast, setSuccessToast] = useState(null);

  const handleSubmit = (report) => {
    if (onAddReport) onAddReport(report);
    setShowReportModal(false);
    setSuccessToast(`✅ Report "${report.title}" submitted!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <div className="map-page" style={{ maxWidth: '1400px' }}>
      <div className="map-page-header">
        <div className="map-page-title-wrap">
          <span className="map-page-icon">🗺️</span>
          <div>
            <h1 className="map-page-title">Route Planner</h1>
            <p className="map-page-subtitle">
              Enter a start &amp; destination — get 2–3 routes with live directions
            </p>
          </div>
        </div>

        {/* 🚨 Report button */}
        <button
          className="btn btn-danger report-incident-btn"
          onClick={() => setShowReportModal(true)}
          id="open-report-modal-btn"
        >
          <span className="report-btn-pulse" />
          🚨 Report Incident
        </button>
      </div>

      {/* Active reports count badge */}
      {reports.length > 0 && (
        <div className="reports-active-banner">
          <span>⚠️</span>
          <span>
            <strong>{reports.length}</strong>{' '}
            {reports.length === 1 ? 'active report' : 'active reports'} in this area — click markers on the map for details.
          </span>
        </div>
      )}

      <div className="map-container-wrapper" style={{ padding: 'var(--space-lg)' }}>
        <MapView reports={reports} />
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          onClose={() => setShowReportModal(false)}
          onSubmit={handleSubmit}
          mapCenter={[85.3096, 23.3441]}
        />
      )}

      {/* Success Toast */}
      {successToast && (
        <div className="report-success-toast">
          {successToast}
        </div>
      )}
    </div>
  );
}
