import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, ShoppingCart, X, Plus, Minus, Trash2, 
  CreditCard, DollarSign, Percent, Printer, 
  Package, AlertCircle, Check, Loader2
} from 'lucide-react';
import { productAPI, orderAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import '../styles/pos.css';

const POS = () => {
  const { user } = useAuth();
  const searchInputRef = useRef(null);
  const barcodeInputRef = useRef(null);

  // State Management
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeSearch, setBarcodeSearch] = useState('');
  
  // Payment & Checkout State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' or 'fixed'
  const [discountValue, setDiscountValue] = useState(0);
  const [taxRate] = useState(0); // 11% VAT for Lebanon
  const [amountReceived, setAmountReceived] = useState('');
  const [splitPayment, setSplitPayment] = useState({
    enabled: false,
    cash: 0,
    card: 0
  });
  
  // Receipt State
  const [lastOrder, setLastOrder] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Messages
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load products on mount
  useEffect(() => {
    fetchProducts();
    // Focus on barcode input for scanner
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  // Fetch products from backend
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productAPI.getAll();
      const activeProducts = response.data.products.filter(p => p.isActive && p.stock > 0);
      setProducts(activeProducts);
      setFilteredProducts(activeProducts);
    } catch (err) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Search products
  useEffect(() => {
    if (!searchTerm) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(product => {
      const search = searchTerm.toLowerCase();
      return (
        (product.name?.toLowerCase() || '').includes(search) ||
        (product.sku?.toLowerCase() || '').includes(search) ||
        (product.brand?.toLowerCase() || '').includes(search) ||
        (product.barcode?.toLowerCase() || '').includes(search)
      );
    });
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  // Barcode scanner handler
  const handleBarcodeInput = (e) => {
    if (e.key === 'Enter') {
      const barcode = barcodeSearch.trim();
      if (!barcode) return;

      const product = products.find(p => p.barcode === barcode);
      if (product) {
        addToCart(product);
        setBarcodeSearch('');
        setSuccess(`Added ${product.name} to cart`);
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError('Product not found');
        setTimeout(() => setError(''), 2000);
      }
    }
  };

  // Add product to cart
  const addToCart = (product) => {
    if (product.stock <= 0) {
      setError('Product out of stock');
      return;
    }

    const existingItem = cart.find(item => item._id === product._id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        setError(`Only ${product.stock} items available`);
        return;
      }
      updateQuantity(product._id, 1);
    } else {
      setCart([...cart, { 
        ...product, 
        quantity: 1,
        itemTotal: product.price
      }]);
    }
  };

  // Update item quantity
  const updateQuantity = (productId, change) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item._id === productId) {
          const newQuantity = item.quantity + change;
          
          if (newQuantity <= 0) {
            return null;
          }
          
          if (newQuantity > item.stock) {
            setError(`Only ${item.stock} items available`);
            return item;
          }
          
          return {
            ...item,
            quantity: newQuantity,
            itemTotal: newQuantity * item.price
          };
        }
        return item;
      }).filter(Boolean);
    });
  };

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item._id !== productId));
  };

  // Clear cart
  const clearCart = () => {
    if (window.confirm('Clear all items from cart?')) {
      setCart([]);
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    let discountAmount = 0;
    if (discountValue > 0) {
      if (discountType === 'percentage') {
        discountAmount = (subtotal * discountValue) / 100;
      } else {
        discountAmount = Math.min(discountValue, subtotal);
      }
    }
    
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = (afterDiscount * taxRate) / 100;
    const total = afterDiscount + taxAmount;
    
    return {
      subtotal,
      discountAmount,
      taxAmount,
      total,
      itemCount: cart.reduce((sum, item) => sum + item.quantity, 0)
    };
  };

  // Quick cash amounts for payment
  const quickCashAmounts = [10, 20, 50, 100, 200, 500];

  // Handle checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    const totals = calculateTotals();
    
    // Validate payment amount
    if (paymentMethod === 'cash') {
      const received = parseFloat(amountReceived) || 0;
      if (received < totals.total) {
        setError('Insufficient payment amount');
        return;
      }
    } else if (splitPayment.enabled) {
      const totalReceived = splitPayment.cash + splitPayment.card;
      if (totalReceived < totals.total) {
        setError('Insufficient split payment amount');
        return;
      }
    }
    
    setLoading(true);
    try {
      // Prepare order data
      const orderData = {
        items: cart.map(item => ({
          product: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity
        })),
        subtotal: totals.subtotal,
        discount: {
          type: discountType,
          value: discountValue,
          amount: totals.discountAmount
        },
        tax: {
          rate: taxRate,
          amount: totals.taxAmount
        },
        total: totals.total,
        paymentMethod: splitPayment.enabled ? 'split' : paymentMethod,
        paymentDetails: splitPayment.enabled ? {
          cash: splitPayment.cash,
          card: splitPayment.card
        } : {
          amountReceived: parseFloat(amountReceived) || totals.total,
          change: paymentMethod === 'cash' ? 
            (parseFloat(amountReceived) || 0) - totals.total : 0
        },
        cashier: user._id,
        status: 'completed'
      };
      
      // Create order
      const response = await orderAPI.create(orderData);
      
      if (response.data.success) {
        setLastOrder(response.data.order);
        setShowReceipt(true);
        setSuccess('Sale completed successfully');
        
        // Reset POS
        setCart([]);
        setDiscountValue(0);
        setAmountReceived('');
        setSplitPayment({ enabled: false, cash: 0, card: 0 });
        setIsCheckoutOpen(false);
        
        // Refresh products to update stock
        fetchProducts();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process sale');
    } finally {
      setLoading(false);
    }
  };

  // Print receipt
  const printReceipt = () => {
    window.print();
  };

  // Generate receipt content
  const Receipt = ({ order }) => {
    if (!order) return null;
    
    return (
      <div className="receipt">
        <div className="receipt-header">
          <h2>RECEIPT</h2>
          <p>Order #{order._id?.slice(-8).toUpperCase()}</p>
          <p>{new Date(order.createdAt).toLocaleString()}</p>
          <p>Cashier: {user.fullName || user.username}</p>
        </div>
        
        <div className="receipt-items">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>${item.price.toFixed(2)}</td>
                  <td>${item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="receipt-totals">
          <div className="receipt-line">
            <span>Subtotal:</span>
            <span>${order.subtotal.toFixed(2)}</span>
          </div>
          {order.discount.amount > 0 && (
            <div className="receipt-line">
              <span>Discount:</span>
              <span>-${order.discount.amount.toFixed(2)}</span>
            </div>
          )}
          <div className="receipt-line">
            <span>Tax ({order.tax.rate}%):</span>
            <span>${order.tax.amount.toFixed(2)}</span>
          </div>
          <div className="receipt-line total">
            <span>Total:</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
          {order.paymentMethod === 'cash' && (
            <>
              <div className="receipt-line">
                <span>Received:</span>
                <span>${order.paymentDetails.amountReceived.toFixed(2)}</span>
              </div>
              <div className="receipt-line">
                <span>Change:</span>
                <span>${order.paymentDetails.change.toFixed(2)}</span>
              </div>
            </>
          )}
          {order.paymentMethod === 'split' && (
            <>
              <div className="receipt-line">
                <span>Cash:</span>
                <span>${order.paymentDetails.cash.toFixed(2)}</span>
              </div>
              <div className="receipt-line">
                <span>Card:</span>
                <span>${order.paymentDetails.card.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
        
        <div className="receipt-footer">
          <p>Thank you for your purchase!</p>
        </div>
      </div>
    );
  };

  const totals = calculateTotals();

  return (
    <div className="pos-container">
      {/* Products Section */}
      <div className="pos-products">
        <div className="pos-header">
          <h2>Products</h2>
          
          {/* Search Bar */}
          <div className="search-bar">
            <Search size={20} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Barcode Scanner Input */}
          <div className="barcode-input">
            <Package size={20} />
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Scan barcode..."
              value={barcodeSearch}
              onChange={(e) => setBarcodeSearch(e.target.value)}
              onKeyDown={handleBarcodeInput}
            />
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success">
            <Check size={16} />
            {success}
          </div>
        )}

        {/* Products Grid */}
        <div className="products-grid">
          {loading ? (
            <div className="loading-state">
              <Loader2 className="spinner" />
              <p>Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state">
              <Package size={48} />
              <p>No products found</p>
            </div>
          ) : (
            filteredProducts.map(product => (
              <div 
                key={product._id} 
                className={`product-card ${product.stock <= product.minStock ? 'low-stock' : ''}`}
                onClick={() => addToCart(product)}
              >
                {product.images && product.images[0] ? (
                  <img 
                    src={`http://localhost:5001${product.images[0]}`} 
                    alt={product.name}
                    className="product-image"
                  />
                ) : (
                  <div className="product-placeholder">
                    <Package size={32} />
                  </div>
                )}
                <div className="product-info">
                  <div className="product-name">{product.name}</div>
                  <div className="product-sku">SKU: {product.sku}</div>
                  <div className="product-stock">Stock: {product.stock}</div>
                  <div className="product-price">${product.price.toFixed(2)}</div>
                </div>
                {product.stock <= product.minStock && (
                  <div className="low-stock-badge">Low Stock</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Cart Section */}
      <div className="pos-cart">
        <div className="cart-header">
          <h2>
            <ShoppingCart size={24} />
            Current Sale ({totals.itemCount} items)
          </h2>
          {cart.length > 0 && (
            <button className="clear-cart-btn" onClick={clearCart}>
              Clear Cart
            </button>
          )}
        </div>

        {/* Cart Items */}
        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <ShoppingCart size={48} />
              <p>Cart is empty</p>
              <span>Add products to start a sale</span>
            </div>
          ) : (
            cart.map(item => (
              <div key={item._id} className="cart-item">
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-details">
                    ${item.price.toFixed(2)} × {item.quantity} = ${item.itemTotal.toFixed(2)}
                  </div>
                </div>
                <div className="cart-item-actions">
                  <button 
                    className="qty-btn"
                    onClick={() => updateQuantity(item._id, -1)}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="qty-display">{item.quantity}</span>
                  <button 
                    className="qty-btn"
                    onClick={() => updateQuantity(item._id, 1)}
                  >
                    <Plus size={16} />
                  </button>
                  <button 
                    className="remove-btn"
                    onClick={() => removeFromCart(item._id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals Section */}
        {cart.length > 0 && (
          <div className="cart-totals">
            <div className="totals-row">
              <span>Subtotal:</span>
              <span>${totals.subtotal.toFixed(2)}</span>
            </div>
            
            {/* Discount */}
            <div className="discount-section">
              <div className="discount-controls">
                <select 
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="discount-type"
                >
                  <option value="percentage">%</option>
                  <option value="fixed">$</option>
                </select>
                <input
                  type="number"
                  placeholder="Discount"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  className="discount-input"
                  min="0"
                  max={discountType === 'percentage' ? 100 : totals.subtotal}
                />
              </div>
              {discountValue > 0 && (
                <div className="totals-row discount">
                  <span>Discount:</span>
                  <span>-${totals.discountAmount.toFixed(2)}</span>
                </div>
              )}
            </div>
            
            <div className="totals-row">
              <span>Tax ({taxRate}%):</span>
              <span>${totals.taxAmount.toFixed(2)}</span>
            </div>
            
            <div className="totals-row total">
              <span>Total:</span>
              <span>${totals.total.toFixed(2)}</span>
            </div>

            <button 
              className="checkout-btn" 
              onClick={() => setIsCheckoutOpen(true)}
            >
              Proceed to Payment
            </button>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="modal-overlay" onClick={() => setIsCheckoutOpen(false)}>
          <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Complete Payment</h2>
              <button onClick={() => setIsCheckoutOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="payment-total">
                <h3>Total Amount Due</h3>
                <div className="amount-due">${totals.total.toFixed(2)}</div>
              </div>

              {/* Payment Method Selection */}
              <div className="payment-methods">
                <label className="payment-method">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={paymentMethod === 'cash' && !splitPayment.enabled}
                    onChange={(e) => {
                      setPaymentMethod(e.target.value);
                      setSplitPayment({ enabled: false, cash: 0, card: 0 });
                    }}
                  />
                  <DollarSign size={20} />
                  Cash
                </label>
                
                <label className="payment-method">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card' && !splitPayment.enabled}
                    onChange={(e) => {
                      setPaymentMethod(e.target.value);
                      setSplitPayment({ enabled: false, cash: 0, card: 0 });
                      setAmountReceived(totals.total.toString());
                    }}
                  />
                  <CreditCard size={20} />
                  Card
                </label>
                
                <label className="payment-method">
                  <input
                    type="checkbox"
                    checked={splitPayment.enabled}
                    onChange={(e) => {
                      setSplitPayment({
                        enabled: e.target.checked,
                        cash: 0,
                        card: 0
                      });
                    }}
                  />
                  Split Payment
                </label>
              </div>

              {/* Payment Input */}
              {splitPayment.enabled ? (
                <div className="split-payment-inputs">
                  <div className="payment-input-group">
                    <label>Cash Amount</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={splitPayment.cash}
                      onChange={(e) => {
                        const cash = parseFloat(e.target.value) || 0;
                        setSplitPayment({
                          ...splitPayment,
                          cash,
                          card: Math.max(0, totals.total - cash)
                        });
                      }}
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div className="payment-input-group">
                    <label>Card Amount</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={splitPayment.card}
                      onChange={(e) => {
                        const card = parseFloat(e.target.value) || 0;
                        setSplitPayment({
                          ...splitPayment,
                          card,
                          cash: Math.max(0, totals.total - card)
                        });
                      }}
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div className="split-total">
                    Total: ${(splitPayment.cash + splitPayment.card).toFixed(2)}
                  </div>
                </div>
              ) : paymentMethod === 'cash' ? (
                <div className="cash-payment">
                  <div className="payment-input-group">
                    <label>Amount Received</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      step="0.01"
                      min="0"
                      autoFocus
                    />
                  </div>
                  
                  {/* Quick Cash Buttons */}
                  <div className="quick-cash-buttons">
                    {quickCashAmounts.map(amount => (
                      <button
                        key={amount}
                        className="quick-cash-btn"
                        onClick={() => setAmountReceived(amount.toString())}
                      >
                        ${amount}
                      </button>
                    ))}
                    <button
                      className="quick-cash-btn exact"
                      onClick={() => setAmountReceived(totals.total.toFixed(2))}
                    >
                      Exact
                    </button>
                  </div>
                  
                  {/* Change Display */}
                  {amountReceived && parseFloat(amountReceived) >= totals.total && (
                    <div className="change-display">
                      <span>Change:</span>
                      <span className="change-amount">
                        ${(parseFloat(amountReceived) - totals.total).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setIsCheckoutOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="spinner" />
                    Processing...
                  </>
                ) : (
                  'Complete Sale'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastOrder && (
        <div className="modal-overlay" onClick={() => setShowReceipt(false)}>
          <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sale Complete</h2>
              <button onClick={() => setShowReceipt(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              <Receipt order={lastOrder} />
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowReceipt(false)}
              >
                Close
              </button>
              <button 
                className="btn-primary"
                onClick={printReceipt}
              >
                <Printer size={20} />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;