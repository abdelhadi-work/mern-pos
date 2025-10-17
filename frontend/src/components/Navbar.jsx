// ============================================
// FILE: client/src/components/Navbar.jsx (UPDATED)
// ============================================
import React from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ user, sidebarOpen, setSidebarOpen, currentPage }) => {
  const { logout } = useAuth();

  const getPageTitle = () => {
    const titles = {
      dashboard: 'Dashboard',
      users: 'Manage Users',
      pos: 'Point of Sale',
      products: 'Products',
      orders: 'Orders',
      reports: 'Reports',
      finance: 'Finance',
      accounting: 'Accounting',
      settings: 'Settings',
    };
    return titles[currentPage] || 'Dashboard';
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button 
          className="menu-toggle" 
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h1 className="navbar-title">{getPageTitle()}</h1>
      </div>
      
      <div className="navbar-right">
        <div className="user-info">
          <div className="user-name">{user?.fullName}</div>
          <div className="user-role">{user?.role?.replace('_', ' ')}</div>
        </div>
        <button className="logout-btn" onClick={logout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;