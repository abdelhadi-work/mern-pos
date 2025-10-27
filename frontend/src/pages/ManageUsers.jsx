// ============================================
// FILE: client/src/pages/ManageUsers.jsx (NEW)
// ============================================
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const ManageUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: 'cashier',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if user has permission to access this page
  if (user?.role !== 'main_admin') {
    return (
      <div className="access-denied">
        <div className="access-denied-icon">
          <AlertTriangle size={64} />
        </div>
        <h2 className="access-denied-title">Access Denied</h2>
        <p className="access-denied-text">
          You don't have permission to access this page. Only Main Administrators can manage users.
        </p>
      </div>
    );
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await authAPI.getUsers();
      setUsers(response.data.users);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (editingUser) {
        await authAPI.updateUser(editingUser._id, formData);
      } else {
        await authAPI.register(formData);
      }
      
      fetchUsers();
      setShowModal(false);
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await authAPI.deleteUser(userId);
        fetchUsers();
      } catch (err) {
        alert(err.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      fullName: user.fullName,
      phone: user.phone || '',
      role: user.role,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      fullName: '',
      phone: '',
      role: 'cashier',
    });
    setEditingUser(null);
    setError('');
  };

  return (
    <div className="manage-users-page">
      <div className="page-header">
        <h2>User Management</h2>
        <button className="add-btn" onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus size={20} />
          Add New User
        </button>
      </div>

      <div className="users-grid">
        {users.map((user) => (
          <div key={user._id} className="user-card">
            <div className="user-card-header">
              <div className="user-avatar">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="user-actions">
                <button className="icon-btn" onClick={() => handleEdit(user)}>
                  <Edit2 size={18} />
                </button>
                <button className="icon-btn delete" onClick={() => handleDelete(user._id)}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div className="user-name">{user.fullName}</div>
            <div className="user-username">@{user.username}</div>
            <div className="user-details">
              <div className="user-detail">
                <span className={`role-badge role-${user.role}`}>
                  {user.role.replace('_', ' ')}
                </span>
              </div>
              <div className="user-detail">
                <span className={`status-badge ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="user-detail">📧 {user.email}</div>
              {user.phone && <div className="user-detail">📱 {user.phone}</div>}
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingUser ? 'Edit User' : 'Add New User'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
            </button>
          </>
        }
      >
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              disabled={!!editingUser}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          {!editingUser && (
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              type="tel"
              className="form-input"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <select
              className="form-input"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
            >
              <option value="cashier">Cashier</option>
              <option value="accounting_admin">Accounting Admin</option>
              <option value="finance_admin">Finance Admin</option>
              <option value="main_admin">Main Admin</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageUsers;