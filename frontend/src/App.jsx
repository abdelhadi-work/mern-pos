// ============================================
// FILE: client/src/App.jsx (FIXED)
// ============================================
import React, { useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Reports from './pages/Reports';
import Products from './pages/Products';
import Orders from './pages/Orders';
import ManageUsers from './pages/ManageUsers';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

function App() {
  const { user, isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = React.useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  // Reset to appropriate page based on user role when user changes (login/logout)
  useEffect(() => {
    if (isAuthenticated && user) {
      // Cashiers go to POS, everyone else goes to Dashboard
      if (user.role === 'cashier') {
        setCurrentPage('pos');
      } else {
        setCurrentPage('dashboard');
      }
    }
  }, [isAuthenticated, user?.id]);

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'users':
        return <ManageUsers />;
      case 'pos':
        return <POS />;
      case 'reports':
        return <Reports />;
      case 'products':
        return <Products />;
      case 'orders':
        return <Orders />;
      case 'finance':
      case 'accounting':
      case 'settings':
        return <PlaceholderPage page={currentPage} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        user={user} 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      <div className={`main-content ${!sidebarOpen ? 'expanded' : ''}`}>
        <Navbar 
          user={user} 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          currentPage={currentPage}
        />
        <div className="content-area">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}

// Placeholder component for pages under development
const PlaceholderPage = ({ page }) => {
  return (
    <div className="placeholder-container">
      <div className="placeholder-icon">⚙️</div>
      <h2 className="placeholder-title">{page.replace('_', ' ')}</h2>
      <p className="placeholder-text">
        This section is under development. Feature will be available soon.
      </p>
    </div>
  );
};

export default App;