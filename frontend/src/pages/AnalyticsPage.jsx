import { useState, useMemo } from 'react';

const DISASTER_TYPES = [
  { type: 'flood', label: 'Flooding & Flash Rises', icon: '🌊', color: '#3b82f6', count: 6 },
  { type: 'fire', label: 'Wildfires & Structural Fires', icon: '🔥', color: '#ef4444', count: 4 },
  { type: 'earthquake', label: 'Seismic & Structural Damage', icon: '🌍', color: '#f59e0b', count: 2 },
  { type: 'accident', label: 'Major Road Accidents', icon: '🚨', color: '#f97316', count: 3 },
  { type: 'medical', label: 'Mass Medical Emergencies', icon: '🏥', color: '#ec4899', count: 5 },
  { type: 'power', label: 'Grid Power Outages', icon: '⚡', color: '#fbbf24', count: 3 },
  { type: 'landslide', label: 'Landslides & Rockfall', icon: '⛰️', color: '#a16207', count: 1 },
];

export default function AnalyticsPage({ reports = [], onNavigate }) {
  const [timeRange, setTimeRange] = useState('24h');

  // Compute metrics from reports or fallback
  const metrics = useMemo(() => {
    const total = reports.length || 24;
    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;

    if (reports.length > 0) {
      reports.forEach((r) => {
        if (r.severity === 'critical') critical++;
        else if (r.severity === 'high') high++;
        else if (r.severity === 'medium') medium++;
        else low++;
      });
    } else {
      critical = 5;
      high = 9;
      medium = 7;
      low = 3;
    }

    return { total, critical, high, medium, low };
  }, [reports]);

  return (
    <div className="analytics-page">
      {/* Hero Header */}
      <div className="page-hero-header">
        <div className="page-hero-title-group">
          <span className="page-hero-icon">📊</span>
          <div>
            <h1 className="page-hero-title">Crisis Analytics &amp; Threat Intelligence</h1>
            <p className="page-hero-subtitle">
              Live operational telemetry, disaster distribution matrices, risk indices, and resource capacity.
            </p>
          </div>
        </div>

        <div className="analytics-time-picker">
          {['6h', '24h', '7d', 'All Time'].map((t) => (
            <button
              key={t}
              className={`time-btn ${timeRange === t ? 'active' : ''}`}
              onClick={() => setTimeRange(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="kpi-grid">
        <div className="kpi-card danger">
          <div className="kpi-icon-wrap">🚨</div>
          <div className="kpi-info">
            <span className="kpi-title">Active Incidents</span>
            <span className="kpi-value">{metrics.total}</span>
            <span className="kpi-subtext">+{metrics.critical} critical life threats</span>
          </div>
        </div>

        <div className="kpi-card warning">
          <div className="kpi-icon-wrap">⏱️</div>
          <div className="kpi-info">
            <span className="kpi-title">Avg Response Time</span>
            <span className="kpi-value">8.4 min</span>
            <span className="kpi-subtext">14% faster than baseline</span>
          </div>
        </div>

        <div className="kpi-card success">
          <div className="kpi-icon-wrap">🏕️</div>
          <div className="kpi-info">
            <span className="kpi-title">Shelter Capacity</span>
            <span className="kpi-value">74%</span>
            <span className="kpi-subtext">1,420 beds available</span>
          </div>
        </div>

        <div className="kpi-card primary">
          <div className="kpi-icon-wrap">🛡️</div>
          <div className="kpi-info">
            <span className="kpi-title">Active Responders</span>
            <span className="kpi-value">62</span>
            <span className="kpi-subtext">12 medical units deployed</span>
          </div>
        </div>
      </div>

      {/* Main Analytics Layout */}
      <div className="analytics-main-grid">
        {/* Severity Distribution */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <h3>Severity Breakdown</h3>
            <span className="badge badge-danger">Live Telemetry</span>
          </div>

          <div className="severity-progress-stack">
            <div className="severity-item">
              <div className="severity-meta">
                <span className="severity-dot" style={{ background: '#ef4444' }} />
                <span className="severity-name">Critical (Immediate Hazard)</span>
                <span className="severity-count">{metrics.critical}</span>
              </div>
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${Math.max(10, (metrics.critical / metrics.total) * 100)}%`,
                    background: '#ef4444',
                  }}
                />
              </div>
            </div>

            <div className="severity-item">
              <div className="severity-meta">
                <span className="severity-dot" style={{ background: '#f97316' }} />
                <span className="severity-name">High (Urgent Response)</span>
                <span className="severity-count">{metrics.high}</span>
              </div>
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${Math.max(10, (metrics.high / metrics.total) * 100)}%`,
                    background: '#f97316',
                  }}
                />
              </div>
            </div>

            <div className="severity-item">
              <div className="severity-meta">
                <span className="severity-dot" style={{ background: '#f59e0b' }} />
                <span className="severity-name">Medium (Contained)</span>
                <span className="severity-count">{metrics.medium}</span>
              </div>
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${Math.max(10, (metrics.medium / metrics.total) * 100)}%`,
                    background: '#f59e0b',
                  }}
                />
              </div>
            </div>

            <div className="severity-item">
              <div className="severity-meta">
                <span className="severity-dot" style={{ background: '#22c55e' }} />
                <span className="severity-name">Low (Minor Advisory)</span>
                <span className="severity-count">{metrics.low}</span>
              </div>
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${Math.max(10, (metrics.low / metrics.total) * 100)}%`,
                    background: '#22c55e',
                  }}
                />
              </div>
            </div>
          </div>

          <div className="card-callout">
            <span>⚠️ <strong>Threat Advisory:</strong> Flood &amp; flash rain incidents show +35% surge in river basin zones. Maintain elevated readiness.</span>
          </div>
        </div>

        {/* Disaster Type Distribution */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <h3>Disaster Type Distribution</h3>
            <span className="text-muted">Categorized Incidents</span>
          </div>

          <div className="disaster-types-list">
            {DISASTER_TYPES.map((dt) => (
              <div key={dt.type} className="disaster-type-row">
                <div className="dt-info">
                  <span className="dt-icon">{dt.icon}</span>
                  <span className="dt-name">{dt.label}</span>
                </div>
                <div className="dt-bar-wrap">
                  <div
                    className="dt-bar-fill"
                    style={{
                      width: `${(dt.count / 15) * 100}%`,
                      background: dt.color,
                    }}
                  />
                </div>
                <span className="dt-count">{dt.count} reports</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Operational Readiness Radar */}
      <div className="readiness-section">
        <div className="analytics-card">
          <div className="analytics-card-header">
            <h3>Regional Readiness &amp; Critical Logistics Matrix</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('map')}>
              🗺️ Cross-Reference Map
            </button>
          </div>

          <div className="readiness-grid">
            <div className="readiness-card">
              <div className="readiness-header">
                <span className="readiness-icon">📡</span>
                <h4>Mesh Telemetry Network</h4>
              </div>
              <div className="readiness-val text-success">99.8% Online</div>
              <p className="readiness-desc">IndexedDB offline mesh synchronization operating normally.</p>
            </div>

            <div className="readiness-card">
              <div className="readiness-header">
                <span className="readiness-icon">🚁</span>
                <h4>Aerial Drone Recon</h4>
              </div>
              <div className="readiness-val text-warning">4 Units Airborne</div>
              <p className="readiness-desc">Active thermal mapping of river basin and landslide slopes.</p>
            </div>

            <div className="readiness-card">
              <div className="readiness-header">
                <span className="readiness-icon">🏥</span>
                <h4>Trauma &amp; Blood Units</h4>
              </div>
              <div className="readiness-val text-primary">820 Units Stored</div>
              <p className="readiness-desc">Universal O-Negative supply above critical baseline.</p>
            </div>

            <div className="readiness-card">
              <div className="readiness-header">
                <span className="readiness-icon">⛽</span>
                <h4>Emergency Generator Reserves</h4>
              </div>
              <div className="readiness-val text-success">48h Fuel Autonomy</div>
              <p className="readiness-desc">All primary shelter diesel generators fueled and tested.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
