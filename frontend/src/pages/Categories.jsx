// ============================================
// FILE: client/src/pages/Categories.jsx (SIMPLIFIED)
// ============================================
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Upload, X } from 'lucide-react';
import { categoryAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Table from '../components/Table';

const Categories = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isAdmin = user?.role === 'main_admin';

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data.categories);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch categories');
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);

      if (imageFile) {
        submitData.append('image', imageFile);
      }

      if (editingCategory) {
        await categoryAPI.update(editingCategory._id, submitData);
        setSuccess('Category updated successfully');
      } else {
        await categoryAPI.create(submitData);
        setSuccess('Category created successfully');
      }
      fetchCategories();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      await categoryAPI.delete(id);
      setSuccess('Category deleted successfully');
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
      });
      setImagePreview(category.image ? `http://localhost:5001${category.image}` : null);
    } else {
      setEditingCategory(null);
      setFormData({ name: '', description: '' });
      setImagePreview(null);
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setImageFile(null);
    setImagePreview(null);
    setError('');
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      header: 'Image',
      accessor: 'image',
      render: (val) => (
        val ? (
          <img
            src={`http://localhost:5001${val}`}
            alt="Category"
            style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }}
          />
        ) : (
          <div style={{ width: '50px', height: '50px', background: '#f0f0f0', borderRadius: '8px' }} />
        )
      ),
    },
    {
      header: 'Name',
      accessor: 'name',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: '600' }}>{val}</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            {row.productCount || 0} products
          </div>
        </div>
      ),
    },
    { 
      header: 'Description', 
      accessor: 'description',
      render: (val) => val || 'N/A'
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (val) => (
        <span className={`badge ${val ? 'badge-success' : 'badge-danger'}`}>
          {val ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Created',
      accessor: 'createdAt',
      render: (val) => new Date(val).toLocaleDateString(),
    },
    ...(isAdmin
      ? [
          {
            header: 'Actions',
            accessor: '_id',
            render: (val, row) => (
              <div className="action-buttons">
                <button className="btn-icon edit" onClick={() => openModal(row)}>
                  <Edit2 size={16} />
                </button>
                <button className="btn-icon delete" onClick={() => handleDelete(val)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  if (loading) return <div className="loading">Loading categories...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Categories</h1>
        {isAdmin && (
          <button className="btn-primary" onClick={() => openModal()}>
            <Plus size={20} />
            Add Category
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="search-bar">
        <Search size={20} />
        <input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Table columns={columns} data={filteredCategories} />

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
        footer={
          <>
            <button className="btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSubmit}>
              {editingCategory ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Category Name *</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category Image</label>
            <div className="image-upload-area">
              {imagePreview ? (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button type="button" className="remove-image-btn" onClick={removeImage}>
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="upload-label">
                  <Upload size={32} />
                  <span>Click to upload image</span>
                  <span className="upload-hint">PNG, JPG, WEBP (max 5MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    hidden
                  />
                </label>
              )}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Categories;