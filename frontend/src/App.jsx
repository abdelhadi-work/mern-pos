// ============================================
// FILE: client/src/App.jsx (FIXED ROUTES)
// ============================================
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import Reports from "./pages/Reports";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Orders from "./pages/Orders";
import ManageUsers from "./pages/ManageUsers";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Shop from "./pages/Shop";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "#f5f7fa",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            className="spinner"
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid #e2e8f0",
              borderTop: "4px solid #667eea",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }}
          ></div>
          <p style={{ color: "#64748b" }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    const defaultPages = {
      cashier: "/pos",
      main_admin: "/dashboard",
      finance_admin: "/dashboard",
      accounting_admin: "/dashboard",
    };
    return <Navigate to={defaultPages[user?.role] || "/dashboard"} replace />;
  }

  return children;
};

// Layout Component
const DashboardLayout = ({ children }) => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  return (
    <div className="app-container">
      <Sidebar user={user} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className={`main-content ${!sidebarOpen ? "expanded" : ""}`}>
        <Navbar
          user={user}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <div className="content-area">{children}</div>
      </div>
    </div>
  );
};

// Placeholder Page
const PlaceholderPage = ({ page }) => (
  <div className="placeholder-container">
    <div className="placeholder-icon">⚙️</div>
    <h2 className="placeholder-title">{page.replace("_", " ")}</h2>
    <p className="placeholder-text">
      This section is under development. Feature will be available soon.
    </p>
  </div>
);

// Root Redirect Component
const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === "cashier") return <Navigate to="/pos" replace />;
  return <Navigate to="/dashboard" replace />;
};

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <RootRedirect /> : <Login />}
        />
        <Route path="/shop" element={<Shop />} />

        {/* Root */}
        <Route path="/" element={<RootRedirect />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              allowedRoles={["main_admin", "finance_admin", "accounting_admin"]}
            >
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={["main_admin"]}>
              <DashboardLayout>
                <ManageUsers />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/categories"
          element={
            <ProtectedRoute allowedRoles={["main_admin"]}>
              <DashboardLayout>
                <Categories />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/pos"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <POS />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/products"
          element={
            <ProtectedRoute allowedRoles={["main_admin", "cashier"]}>
              <DashboardLayout>
                <Products />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute allowedRoles={["main_admin"]}>
              <DashboardLayout>
                <Orders />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute
              allowedRoles={["main_admin", "finance_admin", "accounting_admin"]}
            >
              <DashboardLayout>
                <Reports />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/finance"
          element={
            <ProtectedRoute allowedRoles={["finance_admin"]}>
              <DashboardLayout>
                <PlaceholderPage page="finance" />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/accounting"
          element={
            <ProtectedRoute allowedRoles={["accounting_admin"]}>
              <DashboardLayout>
                <PlaceholderPage page="accounting" />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <PlaceholderPage page="settings" />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;