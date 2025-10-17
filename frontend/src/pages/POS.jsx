import React, { useState } from 'react';
import { Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import '../styles/pos.css';

const POS = () => {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);

  // Sample products
  const products = [
    { id: 1, name: 'iPhone 15 Pro', price: 999, image: '📱' },
    { id: 2, name: 'Samsung Galaxy S24', price: 899, image: '📱' },
    { id: 3, name: 'MacBook Pro', price: 2499, image: '💻' },
    { id: 4, name: 'iPad Air', price: 599, image: '📱' },
    { id: 5, name: 'AirPods Pro', price: 249, image: '🎧' },
    { id: 6, name: 'Apple Watch', price: 399, image: '⌚' },
  ];

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    setTotal(total + product.price);
  };

  const updateQuantity = (id, change) => {
    const item = cart.find(i => i.id === id);
    if (!item) return;

    if (item.quantity + change <= 0) {
      removeFromCart(id);
      return;
    }

    setCart(cart.map(i => 
      i.id === id ? { ...i, quantity: i.quantity + change } : i
    ));
    setTotal(total + (item.price * change));
  };

  const removeFromCart = (id) => {
    const item = cart.find(i => i.id === id);
    if (item) {
      setTotal(total - (item.price * item.quantity));
      setCart(cart.filter(i => i.id !== id));
    }
  };

  const checkout = () => {
    if (cart.length === 0) return;
    alert(`Checkout completed! Total: $${total.toFixed(2)}`);
    setCart([]);
    setTotal(0);
  };

  return (
    <div className="pos-container">
      <div className="pos-products">
        <h2 className="pos-section-title">Products</h2>
        <div className="products-grid">
          {products.map(product => (
            <div key={product.id} className="product-card" onClick={() => addToCart(product)}>
              <div className="product-image">{product.image}</div>
              <div className="product-name">{product.name}</div>
              <div className="product-price">${product.price}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="pos-cart">
        <h2 className="pos-section-title">
          <ShoppingCart size={24} />
          Current Sale
        </h2>
        
        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <ShoppingCart size={48} />
              <p>Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">${item.price}</div>
                </div>
                <div className="cart-item-actions">
                  <button 
                    className="qty-btn"
                    onClick={() => updateQuantity(item.id, -1)}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="qty-display">{item.quantity}</span>
                  <button 
                    className="qty-btn"
                    onClick={() => updateQuantity(item.id, 1)}
                  >
                    <Plus size={16} />
                  </button>
                  <button 
                    className="remove-btn"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-footer">
          <div className="cart-total">
            <span>Total:</span>
            <span className="total-amount">${total.toFixed(2)}</span>
          </div>
          <button 
            className="checkout-btn" 
            onClick={checkout}
            disabled={cart.length === 0}
          >
            Complete Sale
          </button>
        </div>
      </div>
    </div>
  );
};

export default POS;