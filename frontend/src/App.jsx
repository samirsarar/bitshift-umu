import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import SecurityPage from './pages/SecurityPage';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('login');

  const navigate = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
          }}
        >
          <div className="spinner" style={{ width: 32, height: 32 }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect logic
  const effectivePage = isAuthenticated
    ? ['profile', 'security'].includes(currentPage)
      ? currentPage
      : 'profile'
    : ['login', 'register'].includes(currentPage)
      ? currentPage
      : 'login';

  const renderPage = () => {
    switch (effectivePage) {
      case 'login':
        return <LoginPage onNavigate={navigate} />;
      case 'register':
        return <RegisterPage onNavigate={navigate} />;
      case 'profile':
        return <ProfilePage />;
      case 'security':
        return <SecurityPage />;
      default:
        return <LoginPage onNavigate={navigate} />;
    }
  };

  return (
    <div className="app-layout">
      <Navbar currentPage={effectivePage} onNavigate={navigate} />
      <main className="app-content">{renderPage()}</main>
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
