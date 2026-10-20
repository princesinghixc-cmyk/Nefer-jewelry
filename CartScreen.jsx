/* ============================================================
   CartScreen.jsx — Shopping Cart for NEFER Jewelry
   Features: Item list, quantity controls, price summary
   ============================================================ */
import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import { ArrowLeft, PlusIcon, MinusIcon, TrashIcon } from './Icons.jsx';
import './CartScreen.css';

export default function CartScreen() {
  const { state, actions } = useApp();
  const { cart } = state;

  /* Price calculations */
  const totalUnits = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = subtotal;
  const formatPrice = (p) => '₹' + p.toLocaleString('en-IN');

  return (
    <div className="page-wrapper cart-screen">
      {/* Header */}
      <header className="screen-header">
        <button className="back-btn" onClick={() => actions.back('home')} id="cart-back-btn" aria-label="Go back">
          <ArrowLeft size={20} />
        </button>
        <h2 className="screen-title">My Cart</h2>
        <span className="cart-item-count">{totalUnits} items</span>
      </header>

      {cart.length === 0 ? (
        /* Empty Cart */
        <div className="empty-cart animate-fade">
          <div className="empty-cart-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Explore our collection and add stunning pieces to your cart.</p>
          <button className="btn btn-gold" onClick={() => actions.navigate('home')}>
            Browse Collection
          </button>
        </div>
      ) : (
        <>
          {/* Cart Items */}
          <div className="cart-items">
            {cart.map((item, idx) => (
              <div className="cart-item card animate-fade" key={item.id} style={{ animationDelay: `${idx * 0.08}s` }}>
                <img src={item.image} alt={item.name} className="cart-item-img" />
                <div className="cart-item-details">
                  <span className="cart-item-category">{item.category}</span>
                  <h4 className="cart-item-name">{item.name}</h4>
                  <span className="cart-item-price">{formatPrice(item.price)}</span>
                  <div className="qty-controls">
                    <button className="qty-btn" onClick={() => actions.updateQty(item.id, item.qty - 1)} id={`qty-minus-${item.id}`}>
                      <MinusIcon size={14} />
                    </button>
                    <span className="qty-value">{item.qty}</span>
                    <button className="qty-btn" onClick={() => actions.updateQty(item.id, item.qty + 1)} disabled={item.qty >= item.stock} title={item.qty >= item.stock ? 'All available stock is in your cart' : 'Increase quantity'} id={`qty-plus-${item.id}`}>
                      <PlusIcon size={14} />
                    </button>
                  </div>
                </div>
                <div className="cart-item-right">
                  <span className="cart-item-total">{formatPrice(item.price * item.qty)}</span>
                  <button className="remove-btn" onClick={() => actions.removeFromCart(item.id)} id={`remove-${item.id}`}>
                    <TrashIcon size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Price Summary */}
          <div className="cart-summary card">
            <h4 className="summary-title">Price Details</h4>
            <div className="summary-row">
              <span>Subtotal ({cart.reduce((s, i) => s + i.qty, 0)} items)</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row summary-total">
              <span>Total Amount</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          {/* Checkout Button */}
          <div className="cart-checkout-bar">
            <div className="checkout-total">
              <span className="checkout-label">Total</span>
              <span className="checkout-amount">{formatPrice(total)}</span>
            </div>
            <button className="btn btn-gold checkout-btn" onClick={() => actions.navigate('checkout')} id="proceed-checkout-btn">
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
