// ============================================
// FILE: client/src/pages/Shop.jsx (WITH INLINE STYLES)
// ============================================
import React, { useState, useEffect } from 'react';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  // UPDATE THIS TO YOUR BACKEND URL
  const API_BASE_URL = 'http://localhost:5001/api';

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [selectedCategory, searchTerm]);

  useEffect(() => {
    const savedCart = localStorage.getItem('shopCart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('shopCart', JSON.stringify(cart));
  }, [cart]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/public/products?`;
      if (selectedCategory) url += `category=${selectedCategory}&`;
      if (searchTerm) url += `search=${searchTerm}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        const availableProducts = data.products.filter(p => p.isActive && p.stock > 0);
        setProducts(availableProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/public/categories`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item._id === product._id);
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCart(cart.map(item => 
          item._id === product._id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        alert('Cannot add more than available stock');
      }
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId, change) => {
    setCart(cart.map(item => {
      if (item._id === productId) {
        const newQuantity = item.quantity + change;
        if (newQuantity <= 0) return null;
        if (newQuantity > item.stock) {
          alert('Cannot exceed available stock');
          return item;
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item._id !== productId));
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleOrder = async () => {
    if (!customerInfo.name || !customerInfo.phone) {
      alert('Please fill in your name and phone number');
      return;
    }

    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    const orderData = {
      customer: customerInfo,
      items: cart.map(item => ({
        product: item._id,
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      })),
      totalAmount: getTotalPrice(),
      status: 'pending'
    };




//     const orderData = {
//   guestCustomer: {
//     name: customerInfo.name,
//     phone: customerInfo.phone,
//     email: customerInfo.email,
//     address: customerInfo.address,
//   },
//   items: cart.map(item => ({
//     product: item._id,
//     name: item.name,
//     quantity: item.quantity,
//     price: item.price,
//     total: item.price * item.quantity
//   })),
//   subtotal: getTotalPrice(),
//   tax: { rate: 0, amount: 0 },
//   discount: { type: "fixed", value: 0, amount: 0 },
//   total: getTotalPrice(),
//   status: "pending",
//   paymentMethod: "pending",
//   paymentDetails: {
//     isPaid: false
//   },
//   orderSource: "online",
//   delivery: {
//     assignedTo: null,
//     status: "pending"
//   },
//   notes: "Order placed via online shop"
// };


    try {
      const response = await fetch(`${API_BASE_URL}/public/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();
      
      if (data.success) {
        setOrderSuccess(true);
        setCart([]);
        setCustomerInfo({ name: '', phone: '', email: '', address: '' });
        localStorage.removeItem('shopCart');
        
        setTimeout(() => {
          setOrderSuccess(false);
          setShowCart(false);
        }, 3000);
      } else {
        alert('Order failed: ' + data.message);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.headerTitle}>🔌 Electronics Shop</h1>
          <button style={styles.cartBtn} onClick={() => setShowCart(!showCart)}>
            <span style={styles.cartIcon}>🛒</span>
            Cart
            {cart.length > 0 && (
              <span style={styles.cartBadge}>{cart.length}</span>
            )}
          </button>
        </div>
      </header>

      {/* Search Section */}
      <div style={styles.searchSection}>
        <div style={styles.searchContainer}>
          <div style={styles.searchInputWrapper}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          <div style={styles.filterWrapper}>
            <span style={styles.filterIcon}>📂</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={styles.categorySelect}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div style={styles.productsSection}>
        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p>Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div style={styles.noProducts}>
            <p>No products found</p>
          </div>
        ) : (
          <div style={styles.productsGrid}>
            {products.map(product => (
              <div key={product._id} style={styles.productCard}>
                <div style={styles.productImage}>
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={`${API_BASE_URL.replace('/api', '')}${product.images[0]}`}
                      alt={product.name}
                      style={styles.productImg}
                      onError={(e) => e.target.parentElement.innerHTML = '<div style="color: #9ca3af; font-size: 3rem;">📦</div>'}
                    />
                  ) : (
                    <div style={styles.noImage}>📦</div>
                  )}
                </div>
                <div style={styles.productInfo}>
                  <div style={styles.productCategory}>{product.category?.name}</div>
                  <h3 style={styles.productName}>{product.name}</h3>
                  {product.brand && (
                    <p style={styles.productBrand}>Brand: {product.brand}</p>
                  )}
                  <div style={styles.productFooter}>
                    <span style={styles.productPrice}>${product.price.toFixed(2)}</span>
                    <span style={styles.productStock}>Stock: {product.stock}</span>
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    style={styles.addToCartBtn}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      {showCart && (
        <>
          <div style={styles.cartOverlay} onClick={() => setShowCart(false)}></div>
          <div style={styles.cartSidebar}>
            <div style={styles.cartHeader}>
              <h2 style={styles.cartTitle}>Shopping Cart</h2>
              <button style={styles.closeBtn} onClick={() => setShowCart(false)}>✕</button>
            </div>

            {orderSuccess ? (
              <div style={styles.successMessage}>
                <div style={styles.successIcon}>✓</div>
                <h3 style={styles.successTitle}>Order Placed Successfully!</h3>
                <p>Thank you for your order. We'll contact you soon.</p>
              </div>
            ) : cart.length === 0 ? (
              <div style={styles.emptyCart}>
                <span style={styles.emptyCartIcon}>🛒</span>
                <p>Your cart is empty</p>
              </div>
            ) : (
              <>
                <div style={styles.cartItems}>
                  {cart.map(item => (
                    <div key={item._id} style={styles.cartItem}>
                      <div style={styles.cartItemImage}>
                        {item.images?.[0] ? (
                          <img
                            src={`${API_BASE_URL.replace('/api', '')}${item.images[0]}`}
                            alt={item.name}
                            style={styles.cartItemImg}
                          />
                        ) : (
                          <div style={styles.noImageSmall}>📦</div>
                        )}
                      </div>
                      <div style={styles.cartItemInfo}>
                        <h4 style={styles.cartItemName}>{item.name}</h4>
                        <p style={styles.cartItemPrice}>${item.price.toFixed(2)}</p>
                        <div style={styles.quantityControls}>
                          <button onClick={() => updateQuantity(item._id, -1)} style={styles.qtyBtn}>-</button>
                          <span style={styles.qtyValue}>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item._id, 1)} style={styles.qtyBtn}>+</button>
                          <button onClick={() => removeFromCart(item._id)} style={styles.removeBtn}>🗑️</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={styles.customerForm}>
                  <h3 style={styles.formTitle}>Customer Information</h3>
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                    style={styles.formInput}
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number *"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                    style={styles.formInput}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                    style={styles.formInput}
                  />
                  <textarea
                    placeholder="Delivery Address (optional)"
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                    style={{...styles.formInput, minHeight: '60px', fontFamily: 'inherit', resize: 'vertical'}}
                    rows="2"
                  />
                </div>

                <div style={styles.cartTotal}>
                  <div style={styles.totalRow}>
                    <span>Total:</span>
                    <span style={styles.totalAmount}>${getTotalPrice().toFixed(2)}</span>
                  </div>
                  <button onClick={handleOrder} style={styles.checkoutBtn}>
                    Place Order
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Inline Styles
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    color: 'white',
    padding: '1rem 0',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: '1.75rem',
    fontWeight: 'bold',
    margin: 0
  },
  cartBtn: {
    background: 'white',
    color: '#2563eb',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    position: 'relative',
    fontSize: '1rem'
  },
  cartIcon: {
    fontSize: '1.25rem'
  },
  cartBadge: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    background: '#ef4444',
    color: 'white',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: 'bold'
  },
  searchSection: {
    background: 'white',
    padding: '1.5rem 0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    position: 'sticky',
    top: '70px',
    zIndex: 90
  },
  searchContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap'
  },
  searchInputWrapper: {
    flex: 1,
    minWidth: '250px',
    position: 'relative'
  },
  searchIcon: {
    position: 'absolute',
    left: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '1.25rem',
    color: '#6b7280'
  },
  searchInput: {
    width: '100%',
    padding: '0.75rem 1rem 0.75rem 3rem',
    border: '2px solid #e5e7eb',
    borderRadius: '0.5rem',
    fontSize: '1rem'
  },
  filterWrapper: {
    position: 'relative',
    minWidth: '200px'
  },
  filterIcon: {
    position: 'absolute',
    left: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '1.25rem',
    color: '#6b7280',
    pointerEvents: 'none'
  },
  categorySelect: {
    width: '100%',
    padding: '0.75rem 1rem 0.75rem 3rem',
    border: '2px solid #e5e7eb',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    cursor: 'pointer',
    background: 'white'
  },
  productsSection: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem 1rem',
    minHeight: '400px'
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem'
  },
  productCard: {
    background: 'white',
    borderRadius: '0.75rem',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    transition: 'all 0.3s'
  },
  productImage: {
    width: '100%',
    height: '200px',
    background: '#e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  productImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  noImage: {
    fontSize: '3rem',
    color: '#9ca3af'
  },
  productInfo: {
    padding: '1rem'
  },
  productCategory: {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginBottom: '0.25rem',
    textTransform: 'uppercase'
  },
  productName: {
    fontSize: '1.125rem',
    fontWeight: 600,
    marginBottom: '0.5rem',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    minHeight: '2.8em'
  },
  productBrand: {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginBottom: '0.75rem'
  },
  productFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  productPrice: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#2563eb'
  },
  productStock: {
    fontSize: '0.875rem',
    color: '#6b7280'
  },
  addToCartBtn: {
    width: '100%',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    fontWeight: 600,
    fontSize: '1rem',
    cursor: 'pointer'
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '3rem'
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #e5e7eb',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 1rem'
  },
  noProducts: {
    textAlign: 'center',
    padding: '3rem',
    color: '#6b7280',
    fontSize: '1.25rem'
  },
  cartOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 200
  },
  cartSidebar: {
    position: 'fixed',
    right: 0,
    top: 0,
    width: '100%',
    maxWidth: '450px',
    height: '100%',
    background: 'white',
    boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
    zIndex: 201,
    overflowY: 'auto'
  },
  cartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: '2px solid #e5e7eb',
    background: 'white',
    position: 'sticky',
    top: 0,
    zIndex: 10
  },
  cartTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    margin: 0
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#6b7280',
    width: '32px',
    height: '32px'
  },
  cartItems: {
    padding: '1rem'
  },
  cartItem: {
    display: 'flex',
    gap: '1rem',
    padding: '1rem 0',
    borderBottom: '1px solid #e5e7eb'
  },
  cartItemImage: {
    width: '80px',
    height: '80px',
    background: '#e5e7eb',
    borderRadius: '0.5rem',
    flexShrink: 0,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cartItemImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  noImageSmall: {
    fontSize: '1.5rem'
  },
  cartItemInfo: {
    flex: 1
  },
  cartItemName: {
    fontWeight: 600,
    marginBottom: '0.25rem',
    fontSize: '1rem',
    margin: 0
  },
  cartItemPrice: {
    color: '#2563eb',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    margin: '0.25rem 0'
  },
  quantityControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  qtyBtn: {
    width: '28px',
    height: '28px',
    border: 'none',
    background: '#e5e7eb',
    borderRadius: '0.25rem',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  qtyValue: {
    fontWeight: 600,
    minWidth: '30px',
    textAlign: 'center'
  },
  removeBtn: {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    fontSize: '1.25rem'
  },
  customerForm: {
    padding: '1rem',
    borderTop: '2px solid #e5e7eb'
  },
  formTitle: {
    fontWeight: 'bold',
    marginBottom: '1rem',
    fontSize: '1.125rem'
  },
  formInput: {
    width: '100%',
    padding: '0.75rem',
    border: '2px solid #e5e7eb',
    borderRadius: '0.5rem',
    marginBottom: '0.75rem',
    fontSize: '1rem',
    boxSizing: 'border-box'
  },
  cartTotal: {
    padding: '1rem',
    borderTop: '2px solid #e5e7eb'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '1rem'
  },
  totalAmount: {
    color: '#2563eb'
  },
  checkoutBtn: {
    width: '100%',
    background: '#10b981',
    color: 'white',
    border: 'none',
    padding: '1rem',
    borderRadius: '0.5rem',
    fontSize: '1.125rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  emptyCart: {
    padding: '3rem 1rem',
    textAlign: 'center',
    color: '#6b7280'
  },
  emptyCartIcon: {
    fontSize: '4rem',
    display: 'block',
    marginBottom: '1rem'
  },
  successMessage: {
    padding: '3rem 2rem',
    textAlign: 'center'
  },
  successIcon: {
    width: '64px',
    height: '64px',
    background: '#d1fae5',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1rem',
    fontSize: '2rem',
    color: '#10b981',
    fontWeight: 'bold'
  },
  successTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: '0.5rem'
  }
};

export default Shop;