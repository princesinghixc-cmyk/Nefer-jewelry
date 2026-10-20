/* ============================================================
   OrdersScreen.jsx — Orders & Tracking for NEFER Jewelry
   Features: Order history with Flipkart-style status tracker
   ============================================================ */
import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { ArrowLeft, PackageIcon, TruckIcon, CheckCircleIcon } from './Icons.jsx';
import './OrdersScreen.css';

/* Status steps for the tracker */
const STATUS_STEPS = ['Order Placed', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
const isPublicImageUrl = image => typeof image === 'string' && /^https?:\/\//i.test(image);
const getOrderImages = item => [item.image, item.imageUrl, ...(Array.isArray(item.images) ? item.images : [])]
  .filter(isPublicImageUrl)
  .filter((image, index, all) => all.indexOf(image) === index);

const getOrderDisplayStatus = order => {
  const status = order?.status || 'Order Placed';
  const paymentStatus = String(order?.paymentStatus || '').toUpperCase();
  if (status === 'Payment Pending' && paymentStatus === 'FAILED') return 'Payment Failed';
  if (status === 'Payment Pending' && paymentStatus === 'CANCELLED') return 'Cancelled';
  const paymentMethod = String(order?.paymentMethod || order?.payment || '').toLowerCase();
  if (status === 'Payment Pending' && paymentMethod === 'online' && order?.reservationActive === false && paymentStatus !== 'PAID') {
    return 'Payment Failed';
  }
  return status;
};
function OrderItemImage({ item }) {
  const [imageIndex, setImageIndex] = useState(0);
  const images = getOrderImages(item);
  const image = images[imageIndex];
  if (!image) {
    return <div className="order-item-img image-placeholder" aria-label="Product image unavailable" />;
  }
  return <img src={image} alt={item.name} className="order-item-img" onError={() => setImageIndex(index => index + 1)} />;
}

export default function OrdersScreen() {
  const { state, actions } = useApp();

  /* Get step index for tracker */
  const getStepIndex = (status) => {
    const idx = STATUS_STEPS.indexOf(status);
    return idx >= 0 ? idx : 0;
  };

  /* Format date */
  const formatDate = (dateStr) => {
    const d = dateStr?.toDate ? dateStr.toDate() : new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatPrice = (p) => '₹' + Number(p || 0).toLocaleString('en-IN');

  return (
    <div className="page-wrapper orders-screen">
      {/* Header */}
      <header className="screen-header">
        <button className="back-btn" onClick={() => actions.back('home')} id="orders-back-btn" aria-label="Go back">
          <ArrowLeft size={20} />
        </button>
        <h2 className="screen-title">My Orders</h2>
        <span className="cart-item-count">{state.orders.length} orders</span>
      </header>

      {state.orders.length === 0 ? (
        <div className="empty-cart animate-fade">
          <div className="empty-cart-icon">📦</div>
          <h3>No orders yet</h3>
          <p>Your order history will appear here after your first purchase.</p>
          <button className="btn btn-gold" onClick={() => actions.navigate('home')}>
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {state.orders.map((order, idx) => (
            <div className="order-card card animate-fade" key={order.orderId || idx} style={{ animationDelay: `${idx * 0.1}s` }}>
              {/* Order Header */}
              <div className="order-header">
                <div className="order-id-section">
                  <span className="order-id">#{order.orderId}</span>
                  <span className="order-date">{formatDate(order.createdAt)}</span>
                </div>
                <span className={`order-status-badge status-${getOrderDisplayStatus(order)?.replace(/\s/g, '-').toLowerCase()}`}>
                  {getOrderDisplayStatus(order)}
                </span>
              </div>

              {/* Order Items */}
              <div className="order-items">
                {order.items?.map((item, i) => (
                  <div className="order-item" key={i}>
                    <OrderItemImage item={item} />
                    <div className="order-item-info">
                      <span className="order-item-name">{item.name}</span>
                      <span className="order-item-qty">Qty: {item.qty} × {formatPrice(item.price)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Status Tracker */}
              <div className="status-tracker">
                {['Cancelled', 'Payment Failed', 'Payment Pending', 'Awaiting Payment'].includes(getOrderDisplayStatus(order)) ? (
                  <div className={`order-cancelled-message ${getOrderDisplayStatus(order) === 'Payment Pending' ? 'order-payment-pending-message' : ''} ${order.paymentStatus === 'REFUND_REQUIRED' ? 'order-refund-required-message' : ''}`}>
                    {order.paymentStatus === 'REFUND_REQUIRED'
                      ? 'Payment was received after this order was closed. Please contact NEFER support for refund assistance.'
                      : getOrderDisplayStatus(order) === 'Cancelled'
                        ? 'This order has been cancelled.'
                        : getOrderDisplayStatus(order) === 'Payment Failed'
                          ? 'Payment failed. This order was not confirmed.'
                          : 'Payment is pending. We will update this order after verification.'}
                  </div>
                ) : STATUS_STEPS.map((step, i) => {
                  const currentStep = getStepIndex(getOrderDisplayStatus(order));
                  const isCompleted = i <= currentStep;
                  const isCurrent = i === currentStep;
                  return (
                    <div className={`tracker-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`} key={step}>
                      <div className="tracker-dot">
                        {isCompleted ? (
                          i === STATUS_STEPS.length - 1 ? <CheckCircleIcon size={16} /> :
                          i >= 3 ? <TruckIcon size={14} /> :
                          <PackageIcon size={14} />
                        ) : (
                          <span className="dot-empty"></span>
                        )}
                      </div>
                      {i < STATUS_STEPS.length - 1 && <div className={`tracker-line ${i < currentStep ? 'filled' : ''}`}></div>}
                      <span className="tracker-label">{step}</span>
                    </div>
                  );
                })}
              </div>

              {/* Order Footer */}
              <div className="order-footer">
                <span className="order-payment">
                  {(() => {
                    const method = String(order.paymentMethod || order.payment || '').toLowerCase();
                    const utn = order.utnNumber || order.utrNumber || (order.shippingAddress?.match(/UTN(?:[\/\s]UTR)?[:\s]+([A-Za-z0-9]+)/i)?.[1]);
                    if (method === 'upi' || utn) {
                      return `📱 Direct UPI${utn ? ` · UTN: ${utn}` : ''}`;
                    }
                    return method === 'cod' ? '💵 Cash on Delivery' : '💳 Paid Online';
                  })()}
                  {order.paymentStatus ? ` · ${order.paymentStatus}` : ''}
                </span>
                <span className="order-total-amount">{formatPrice(order.totalAmount ?? order.total)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
