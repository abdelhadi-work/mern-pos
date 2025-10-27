// ============================================
// FILE: client/src/components/Sidebar.jsx (FIXED)
// ============================================
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  ShoppingCart, 
  Package, 
  FileText, 
  DollarSign, 
  Users, 
  Settings,
  Layers
} from 'lucide-react';

const menuConfig = {
  main_admin: [
    { name: 'Dashboard', icon: BarChart3, path: '/dashboard' },
    { name: 'Manage Users', icon: Users, path: '/users' },
    { name: 'Categories', icon: Layers, path: '/categories' },
    { name: 'Products', icon: Package, path: '/products' },
    { name: 'Orders', icon: FileText, path: '/orders' },
    { name: 'Reports', icon: BarChart3, path: '/reports' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ],
  finance_admin: [
    { name: 'Dashboard', icon: BarChart3, path: '/dashboard' },
    { name: 'Finance', icon: DollarSign, path: '/finance' },
    { name: 'Reports', icon: BarChart3, path: '/reports' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ],
  accounting_admin: [
    { name: 'Dashboard', icon: BarChart3, path: '/dashboard' },
    { name: 'Accounting', icon: DollarSign, path: '/accounting' },
    { name: 'Reports', icon: BarChart3, path: '/reports' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ],
  cashier: [
    { name: 'POS', icon: ShoppingCart, path: '/pos' },
    { name: 'Products', icon: Package, path: '/products' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ],
};

const Sidebar = ({ user, isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const menuItems = menuConfig[user?.role] || [];

  return (
    <aside className={`sidebar ${!isOpen ? 'closed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-title">Electronics POS</div>
        <div className="sidebar-subtitle">Management System</div>
      </div>
      
      <nav className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <div
              key={item.path}
              className={`menu-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;