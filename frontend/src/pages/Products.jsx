// FILE: client/src/pages/Products.jsx
// ============================================
import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import Table from '../components/Table';
import Modal from '../components/Modal';

const Products = () => {
  const [products] = useState([
    { id: 1, name: 'iPhone 15 Pro', category: 'Phones', price: 999, stock: 45 },
    { id: 2, name: 'Samsung Galaxy S24', category: 'Phones', price: 899, stock: 32 },
    { id: 3, name: 'MacBook Pro', category: 'Computers', price: 2499, stock: 15 },
    { id: 4, name: 'iPad Air', category: 'Tablets', price: 599, stock: 28 },
  ]);

  const [showModal, setShowModal] = useState(false);

  const columns = [
    { header: 'Product Name', accessor: 'name' },
    { header: 'Category', accessor: 'category' },
    { 
      header: 'Price', 
      accessor: 'price',
      render: (value) => `$${value}`
    },
    { 
      header: 'Stock', 
      accessor: 'stock',
      render: (value) => (
        <span className={value < 20 ? 'stock-low' : 'stock-good'}>
          {value}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (value, row) => (
        <div className="table-actions">
          <button className="icon-btn"><Edit2 size={16} /></button>
          <button className="icon-btn delete"><Trash2 size={16} /></button>
        </div>
      )
    },
  ];

  return (
    <div className="products-page">
      <div className="page-header">
        <h2>Product Management</h2>
        <button className="add-btn" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          Add Product
        </button>
      </div>

      <div className="page-content">
        <Table columns={columns} data={products} />
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add New Product"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button className="btn-primary">Save Product</button>
          </>
        }
      >
        <form>
          <div className="form-group">
            <label className="form-label">Product Name</label>
            <input type="text" className="form-input" placeholder="Enter product name" />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-input">
              <option>Phones</option>
              <option>Computers</option>
              <option>Tablets</option>
              <option>Accessories</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Price</label>
            <input type="number" className="form-input" placeholder="0.00" />
          </div>
          <div className="form-group">
            <label className="form-label">Stock</label>
            <input type="number" className="form-input" placeholder="0" />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Products;