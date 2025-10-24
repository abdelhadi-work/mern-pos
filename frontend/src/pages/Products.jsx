// ============================================
// FILE: client/src/pages/Products.jsx (

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, AlertTriangle, Filter, Upload, X, Package } from 'lucide-react';
import { productAPI, categoryAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const Products = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: '',
    description: '',
    brand: '',
    price: '',
    costPrice: '',
    stock: '',
    minStock: 5,
    unit: 'piece',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isAdmin = user?.role === 'main_admin';

  useEffect(() => {
    fetchData();
  }, [selectedCategory]);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        productAPI.getAll({ category: selectedCategory }),
        categoryAPI.getAll(),
      ]);
      setProducts(productsRes.data.products);
      setCategories(categoriesRes.data.categories);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch data');
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + imagePreviews.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    setImageFiles([...imageFiles, ...validFiles]);
    
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const removeImage = (index) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const submitData = new FormData();
      submitData.append('data', JSON.stringify(formData));

      imageFiles.forEach(file => {
        submitData.append('images', file);
      });

      if (editingProduct) {
        await productAPI.update(editingProduct._id, submitData);
        setSuccess('Product updated successfully');
      } else {
        await productAPI.create(submitData);
        setSuccess('Product created successfully');
      }
      fetchData();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await productAPI.delete(id);
      setSuccess('Product deleted successfully');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode || '',
        category: product.category._id,
        description: product.description || '',
        brand: product.brand || '',
        price: product.price,
        costPrice: product.costPrice || '',
        stock: product.stock,
        minStock: product.minStock,
        unit: product.unit,
      });
      setImagePreviews(product.images?.map(img => `http://localhost:5001${img}`) || []);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        sku: '',
        barcode: '',
        category: '',
        description: '',
        brand: '',
        price: '',
        costPrice: '',
        stock: '',
        minStock: 5,
        unit: 'piece',
      });
      setImagePreviews([]);
    }
    setImageFiles([]);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setImageFiles([]);
    setImagePreviews([]);
    setError('');
  };

 const filteredProducts = products.filter((product) => {
  const search = (searchTerm || '').toLowerCase();
  return (
    (product.name || '').toLowerCase().includes(search) ||
    (product.sku || '').toLowerCase().includes(search) ||
    (product.brand || '').toLowerCase().includes(search) ||
    (product.barcode || '').toLowerCase().includes(search)
  );
});

  if (loading) return <div className="loading">Loading products...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Products</h1>
        {isAdmin && (
          <button className="btn-primary" onClick={() => openModal()}>
            <Plus size={20} />
            Add Product
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="filters-row">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={20} />
          <select
            className="form-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="products-grid">
        {filteredProducts.map((product) => (
          <div key={product._id} className="product-card">
            <div className="product-image-container">
              {product.images && product.images.length > 0 ? (
                <img
                  src={`http://localhost:5001${product.images[0]}`}
                  alt={product.name}
                  className="product-image"
                />
              ) : (
                <div className="product-no-image">
                  <Package size={48} />
                </div>
              )}
              {product.stock <= product.minStock && (
                <div className="product-alert-badge">
                  <AlertTriangle size={16} />
                  Low Stock
                </div>
              )}
            </div>

            <div className="product-details">
              <div className="product-category">
                {product.category?.name}
              </div>
              <h3 className="product-name">{product.name}</h3>
              <div className="product-sku">SKU: {product.sku}</div>
              {product.brand && <div className="product-brand">{product.brand}</div>}
              
              <div className="product-price-section">
                <span className="product-price">${product.price.toFixed(2)}</span>
              </div>

              <div className="product-stock-info">
                <span className={product.stock <= product.minStock ? 'stock-low' : 'stock-good'}>
                  Stock: {product.stock} {product.unit}
                </span>
              </div>

              {isAdmin && (
                <div className="product-actions">
                  <button className="btn-icon edit" onClick={() => openModal(product)}>
                    <Edit2 size={16} />
                  </button>
                  <button className="btn-icon delete" onClick={() => handleDelete(product._id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="modal-close" onClick={closeModal}>
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-section">
                  <h3 className="section-title">Basic Information</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Product Name *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">SKU *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Barcode</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.barcode}
                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Category *</label>
                      <select
                        className="form-input"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Brand</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
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
                </div>

                <div className="form-section">
                  <h3 className="section-title">Pricing</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Price *</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Cost Price</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        value={formData.costPrice}
                        onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="section-title">Inventory</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Stock *</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Min Stock</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.minStock}
                        onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Unit</label>
                      <select
                        className="form-input"
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      >
                        <option value="piece">Piece</option>
                        <option value="box">Box</option>
                        <option value="kg">Kilogram</option>
                        <option value="liter">Liter</option>
                        <option value="meter">Meter</option>
                        <option value="pair">Pair</option>
                        <option value="set">Set</option>
                        <option value="pack">Pack</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="section-title">Product Images</h3>
                  
                  <div className="images-upload-grid">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="image-preview-item">
                        <img src={preview} alt={`Preview ${index + 1}`} />
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={() => removeImage(index)}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    
                    {imagePreviews.length < 5 && (
                      <label className="image-upload-box">
                        <Upload size={32} />
                        <span>Add Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageChange}
                          hidden
                        />
                      </label>
                    )}
                  </div>
                  <div className="upload-hint">Upload up to 5 images (max 5MB each)</div>
                </div>
              </form>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSubmit}>
                {editingProduct ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;