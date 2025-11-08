import React, { useState, useMemo } from 'react';
import { Eye, EyeOff, User, Lock, Zap, ShoppingCart, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/global.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const matrixColumns = useMemo(() => {
    const characters = '01ΞΨЖÆØ$#@∆╳╱╲';
    const rows = 60;
    const columns = 18;
    return Array.from({ length: columns }, () =>
      Array.from({ length: rows }, () => characters[Math.floor(Math.random() * characters.length)]).join('\n')
    );
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login({ username, password });
    
    if (!result.success) {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      {/* Matrix Rain Background */}
      <div className="login-bg-decoration">
        <div className="matrix-grid">
          {matrixColumns.map((column, index) => (
            <div
              key={index}
              className="matrix-column"
              data-symbols={column}
              style={{ '--delay': `${index * 0.35}s`, '--duration': `${12 + (index % 5) * 1.8}s` }}
            ></div>
          ))}
        </div>
        <div className="matrix-overlay"></div>
        <div className="decoration-circle circle-1"></div>
        <div className="decoration-circle circle-2"></div>
      </div>

      <div className="login-card">
        {/* Logo Section */}
        <div className="login-logo-container">
          <div className="login-logo-icon">
            <ShoppingCart size={40} />
          </div>
          <div className="login-logo-pulse"></div>
        </div>

        {/* Header */}
        <div className="login-header">
          <h1 className="login-logo">Electronics POS</h1>
          <p className="login-subtitle">Welcome back! Please sign in to continue</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠</span>
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">
              <User size={16} />
              <span>Username</span>
            </label>
            <div className="input-wrapper">
              <input
                type="text"
                className="form-input login-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
              <div className="input-border"></div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={16} />
              <span>Password</span>
            </label>
            <div className="input-wrapper">
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input login-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="input-border"></div>
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={20} className="spinner" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <Zap size={20} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

      </div>

      {/* Footer */}
      <div className="login-footer">
        <p>© 2025 Electronics POS. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Login;