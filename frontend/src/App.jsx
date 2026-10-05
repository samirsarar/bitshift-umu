import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './services/api';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import SecurityPage from './pages/SecurityPage';
import MapPage from './pages/MapPage';
import ReportsPage from './pages/ReportsPage';
import SOSPage from './pages/SOSPage';
import SheltersPage from './pages/SheltersPage';
import AnalyticsPage from './pages/AnalyticsPage';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('landing');
  const [reports, setReports] = useState([]);

  // Load existing reports from backend
  const fetchReports = async () => {
    try {
      const res = await api.getReports();
      if (res && res.reports) {
        setReports(res.reports);
      }
    } catch (err) {
      console.error('Failed to load incident reports from backend:', err);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const navigate = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addReport = (report) => {
    setReports((prev) => [
      report,
      ...prev.filter((r) => (r.id || r._id) !== (report.id || report._id)),
    ]);
  };

  const updateReport = (reportId, patch) => {
    setReports((prev) =>
      prev.map((r) => ((r.id || r._id) === reportId ? { ...r, ...patch } : r))
    );
  };

  const deleteReport = (reportId) => {
    setReports((prev) => prev.filter((r) => (r.id || r._id) !== reportId));
  };

  // Show loading screen while checking auth
  if (loading) {
    return (
      <div className="app-layout">
        <div
          className="app-content"
          style={{
            flexDirection: 'column',
            gap: 'var(--space-md)',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
          }}
        >
          <div className="spinner" style={{ width: 40, height: 40 }} />
          <p style={{ color: 'var(--text-muted)' }}>Initializing alertroutes telemetry...</p>
        </div>
      </div>
    );
  }

  // Access Control Logic:
  // Public pages: 'landing', 'login', 'register'
  // Protected home/dashboard and command center features require authentication:
  // If unauthenticated and attempts to access 'home', 'dashboard', 'profile', 'security', 'sos', redirect to 'login'
  const protectedPages = ['home', 'dashboard', 'profile', 'security', 'sos'];
  let effectivePage = currentPage;

  if (!isAuthenticated && protectedPages.includes(currentPage)) {
    effectivePage = 'login';
  }

  const renderPage = () => {
    switch (effectivePage) {
      case 'landing':
        return <LandingPage onNavigate={navigate} reports={reports} />;
      case 'home':
      case 'dashboard':
        return <HomePage onNavigate={navigate} reports={reports} />;
      case 'login':
        return <LoginPage onNavigate={navigate} />;
      case 'register':
        return <RegisterPage onNavigate={navigate} />;
      case 'map':
        return <MapPage reports={reports} onAddReport={addReport} />;
      case 'reports':
        return (
          <ReportsPage
            reports={reports}
            onNavigate={navigate}
            onAddReport={addReport}
            onUpdateReport={updateReport}
            onDeleteReport={deleteReport}
          />
        );
      case 'sos':
        return <SOSPage onNavigate={navigate} />;
      case 'shelters':
        return <SheltersPage onNavigate={navigate} />;
      case 'analytics':
        return <AnalyticsPage reports={reports} onNavigate={navigate} />;
      case 'profile':
        return <ProfilePage />;
      case 'security':
        return <SecurityPage />;
      default:
        return <LandingPage onNavigate={navigate} reports={reports} />;
    }
  };

  const isLanding = effectivePage === 'landing';

  return (
    <div className="app-layout">
      {/* Show full navbar on all app pages except landing (landing has its own minimalistic top bar) */}
      {!isLanding && (
        <Navbar currentPage={effectivePage} onNavigate={navigate} reports={reports} />
      )}
      <main className={`app-content ${isLanding ? 'landing-main' : ''}`}>{renderPage()}</main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
