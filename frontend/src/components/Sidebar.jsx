// ============================================
// FILE: client/src/components/Sidebar.jsx (FIXED)
// ============================================
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  ShoppingCart, 
  Package, 
  FileText, 
  DollarSign, 
  Users, 
  Settings,
  Layers,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  PieChart,
  Wallet
} from 'lucide-react';

const menuConfig = {
  main_admin: [
    { name: 'Dashboard', icon: BarChart3, path: '/dashboard' },
    { name: 'Manage Users', icon: Users, path: '/users' },
    { name: 'Categories', icon: Layers, path: '/categories' },
    { name: 'Products', icon: Package, path: '/products' },
    { name: 'Orders', icon: FileText, path: '/orders' },
    { 
      name: 'Finance', 
      icon: DollarSign, 
      submenu: [
        { name: 'Overview', icon: TrendingUp, path: '/finance' },
        { name: 'Reports', icon: PieChart, path: '/reports' },
      ]
    },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ],
  finance_admin: [
    { name: 'Dashboard', icon: BarChart3, path: '/dashboard' },
    { 
      name: 'Finance', 
      icon: DollarSign, 
      submenu: [
        { name: 'Overview', icon: TrendingUp, path: '/finance' },
        { name: 'Reports', icon: PieChart, path: '/reports' },
      ]
    },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ],
  accounting_admin: [
    { name: 'Dashboard', icon: BarChart3, path: '/dashboard' },
    { 
      name: 'Finance', 
      icon: DollarSign, 
      submenu: [
        { name: 'Overview', icon: TrendingUp, path: '/finance' },
        { name: 'Accounting', icon: Wallet, path: '/accounting' },
        { name: 'Reports', icon: PieChart, path: '/reports' },
      ]
    },
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
  
  // Track which submenus are open
  const [openSubmenus, setOpenSubmenus] = useState(() => {
    // Auto-open Finance submenu if on finance/reports/accounting page
    const financePaths = ['/finance', '/reports', '/accounting'];
    if (financePaths.includes(location.pathname)) {
      return { Finance: true };
    }
    return {};
  });

  const toggleSubmenu = (menuName) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  const isPathActive = (path) => location.pathname === path;
  
  const isSubmenuActive = (submenu) => {
    return submenu.some(item => location.pathname === item.path);
  };

  return (
    <aside className={`sidebar ${!isOpen ? 'closed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-title">Electronics POS</div>
        <div className="sidebar-subtitle">Management System</div>
      </div>
      
      <nav className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          
          // Handle items with submenu
          if (item.submenu) {
            const isOpen = openSubmenus[item.name];
            const hasActiveChild = isSubmenuActive(item.submenu);
            
            return (
              <div key={item.name}>
                <div
                  className={`menu-item ${hasActiveChild ? 'active' : ''}`}
                  onClick={() => toggleSubmenu(item.name)}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                  {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
                
                {isOpen && (
                  <div className="submenu">
                    {item.submenu.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const isActive = isPathActive(subItem.path);
                      
                      return (
                        <div
                          key={subItem.path}
                          className={`submenu-item ${isActive ? 'active' : ''}`}
                          onClick={() => navigate(subItem.path)}
                        >
                          <SubIcon size={18} />
                          <span>{subItem.name}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
          
          // Handle regular menu items
          const isActive = isPathActive(item.path);
          
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
