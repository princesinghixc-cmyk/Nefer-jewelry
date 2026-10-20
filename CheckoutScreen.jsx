/* ============================================================
   CheckoutScreen.jsx — Checkout & Payment for NEFER Jewelry
   Features: Delivery details, coupon, payment selection, order
   ============================================================ */
import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { ArrowLeft, TagIcon } from './Icons.jsx';
import './CheckoutScreen.css';

export default function CheckoutScreen() {
  const { state, actions } = useApp();
  const { cart, userProfile, coupons } = state;

  /* Form State */
  const savedAddress = userProfile?.savedAddress || {};
  const [name, setName] = useState(savedAddress.fullName || userProfile?.fullName || '');
  const [phone, setPhone] = useState(savedAddress.phone || userProfile?.phone || '');
  const [houseNo, setHouseNo] = useState(savedAddress.houseNo || '');
  const [street, setStreet] = useState(savedAddress.street || '');
  const [locality, setLocality] = useState(savedAddress.locality || '');
  const [city, setCity] = useState(savedAddress.city || '');
  const [stateName, setStateName] = useState(savedAddress.state || '');
  const [pinCode, setPinCode] = useState(savedAddress.pinCode || '');
  const [landmark, setLandmark] = useState(savedAddress.landmark || '');

  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponMsg, setCouponMsg] = useState('');
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [utnNumber, setUtnNumber] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [errors, setErrors] = useState({});
  const [placing, setPlacing] = useState(false);
  const [placeOrderError, setPlaceOrderError] = useState('');
  const checkoutRequestIdRef = useRef('');
  const paymentClosureStatusRef = useRef('');
  const storeUpiId = state.settings?.upiId || 'neferjewelers@okhdfcbank';

  /* Preload Razorpay script eagerly so it's ready when user clicks Place Order */
  useEffect(() => {
    if (window.Razorpay) return;
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  /* Calculations */
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  let discount = 0;
  if (couponApplied) {
    const requestedDiscount = couponApplied.type === 'percent'
      ? Math.round(subtotal * couponApplied.discount / 100)
      : couponApplied.discount;
    discount = Math.min(subtotal, Math.max(0, requestedDiscount));
  }
  const total = subtotal - discount;
  const formatPrice = (p) => '₹' + p.toLocaleString('en-IN');

  useEffect(() => {
    const nextAddress = state.userProfile?.savedAddress;
    if (!nextAddress) return;
    setName(nextAddress.fullName || '');
    setPhone(nextAddress.phone || '');
    setHouseNo(nextAddress.houseNo || '');
    setStreet(nextAddress.street || '');
    setLocality(nextAddress.locality || '');
    setCity(nextAddress.city || '');
    setStateName(nextAddress.state || '');
    setPinCode(nextAddress.pinCode || '');
    setLandmark(nextAddress.landmark || '');
  }, [state.userProfile?.savedAddress]);

  /* Apply Coupon */
  const applyCoupon = async (value = couponCode) => {
    const code = value.trim().toUpperCase();
    const found = coupons.find(c => String(c.code || '').toUpperCase() === code && c.active !== false);
    if (!found) {
      setCouponMsg('Invalid coupon code');
      setCouponApplied(null);
      return;
    }
    setCheckingCoupon(true);
    try {
      const verifiedCoupon = await actions.validateCoupon(found.id, code, subtotal);
      setCouponApplied(verifiedCoupon);
      setCouponMsg(`🎉 Coupon applied! You save ${verifiedCoupon.type === 'percent' ? verifiedCoupon.discount + '%' : '₹' + verifiedCoupon.discount}`);
    } catch (error) {
      setCouponMsg(error.message || 'Unable to validate this coupon.');
      setCouponApplied(null);
    } finally {
      setCheckingCoupon(false);
    }
  };

  const handleApplyCoupon = () => applyCoupon(couponCode);

  /* Build full address string */
  const getFullAddress = () => [
    houseNo.trim(),
    street.trim(),
    locality.trim(),
    landmark.trim() ? `Near ${landmark.trim()}` : '',
    city.trim(),
    stateName.trim(),
    pinCode.trim()
  ].filter(Boolean).join(', ');

  /* Validate */
  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (phone.replace(/\D/g, '').length !== 10) errs.phone = 'Enter 10-digit number';
    if (!houseNo.trim()) errs.houseNo = 'House/Flat No. required';
    if (!street.trim()) errs.street = 'Building/Street required';
    if (!locality.trim()) errs.locality = 'Area/Locality required';
    if (!city.trim()) errs.city = 'City required';
    if (!stateName.trim()) errs.state = 'State required';
    if (!pinCode.trim() || pinCode.replace(/\D/g, '').length < 6) errs.pinCode = 'Enter 6-digit PIN';
    if (paymentMethod === 'upi') {
      const cleanUtn = utnNumber.trim();
      if (!cleanUtn) {
        errs.utnNumber = 'Please enter your 12-digit UTN / UTR transaction number';
      } else if (cleanUtn.length < 6) {
        errs.utnNumber = 'Enter a valid UTN / UTR transaction reference (min. 6 characters)';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* Place Order */
  const handlePlaceOrder = async () => {
    if (!state.user) {
      actions.requireLogin('checkout');
      return;
    }
    if (!validate()) return;
    setPlaceOrderError('');
    paymentClosureStatusRef.current = '';
    setPlacing(true);
    try {
      const applicationOrderId = checkoutRequestIdRef.current || `NF${Date.now().toString(36).toUpperCase()}`;
      checkoutRequestIdRef.current = applicationOrderId;
      const cleanUtn = utnNumber.trim();
      const formattedAddress = getFullAddress() + (paymentMethod === 'upi' && cleanUtn ? ` [UTN: ${cleanUtn}]` : '');
      const checkoutData = {
        requestId: applicationOrderId,
        orderId: applicationOrderId,
        items: cart.map(item => ({ id: item.id, qty: item.qty })),
        delivery: {
          name: name.trim(),
          phone: phone.replace(/\D/g, ''),
          houseNo: houseNo.trim(),
          street: street.trim(),
          locality: locality.trim(),
          city: city.trim(),
          state: stateName.trim(),
          pinCode: pinCode.trim(),
          landmark: landmark.trim(),
          address: formattedAddress,
          utnNumber: paymentMethod === 'upi' ? cleanUtn : null,
          utrNumber: paymentMethod === 'upi' ? cleanUtn : null
        },
        couponId: couponApplied?.id || null,
        utnNumber: paymentMethod === 'upi' ? cleanUtn : null,
        utrNumber: paymentMethod === 'upi' ? cleanUtn : null,
        payment: paymentMethod,
        paymentMethod: paymentMethod
      };
      let paymentDetails = {};
      const isFree = total <= 0;
      if (paymentMethod === 'online' && !isFree) {
        if (!window.Razorpay) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Unable to load Razorpay checkout. Please try again.'));
            document.body.appendChild(script);
          });
        }
        const razorpayOrder = await actions.createRazorpayOrder(checkoutData);
        if (razorpayOrder.free) {
          // Free order on backend, no gateway needed
        } else {
          const razorpayKeyId = razorpayOrder.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
          if (!razorpayKeyId) throw new Error('Online payment is not configured. Please contact support.');
          paymentDetails = await new Promise((resolve, reject) => {
            let settled = false;
            let verificationStarted = false;
            const succeed = value => {
              if (settled) return;
              settled = true;
              resolve(value);
            };
            const fail = error => {
              if (settled) return;
              settled = true;
              reject(error);
            };
            const closePaymentAttempt = async (outcome, paymentId = '') => {
              try {
                await actions.closeUnpaidOrder({ applicationOrderId, outcome, paymentId });
                paymentClosureStatusRef.current = outcome;
                return null;
              } catch (error) {
                console.error('Unable to close the unpaid payment attempt:', error);
                return error;
              }
            };
            const checkout = new window.Razorpay({
              key: razorpayKeyId,
              amount: razorpayOrder.amount,
              currency: razorpayOrder.currency,
              name: 'NEFER Jewelry',
              description: 'NEFER Jewelry order',
              order_id: razorpayOrder.id,
              prefill: { name: name.trim(), contact: phone.replace(/\D/g, ''), email: state.user?.email || '' },
              theme: { color: '#d4af37' },
              handler: response => {
                verificationStarted = true;
                const payment = {
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature
                };
                actions.verifyRazorpayPayment({
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  applicationOrderId
                }).then(result => {
                  if (result?.refundRequired) {
                    throw new Error('Payment was captured after the order was closed. Please contact NEFER support for refund assistance.');
                  }
                  succeed(payment);
                }).catch(async error => {
                  const closeError = await closePaymentAttempt('failed', response.razorpay_payment_id);
                  fail(closeError || error);
                });
              },
              modal: {
                ondismiss: () => {
                  if (verificationStarted) return;
                  closePaymentAttempt('cancelled').then(closeError => {
                    fail(closeError || new Error('Payment was cancelled. Your order was not placed.'));
                  });
                }
              }
            });
            checkout.on('payment.failed', response => {
              const description = response?.error?.description;
              const paymentId = response?.error?.metadata?.payment_id || '';
              const failure = new Error(description
                ? `Payment failed: ${description}`
                : 'Payment failed. No money was deducted from your account.');
              closePaymentAttempt('failed', paymentId).then(closeError => {
                fail(closeError || failure);
              });
            });
            checkout.open();
          });
        }
      }
      await actions.placeOrder({
        ...checkoutData,
        payment: isFree ? 'cod' : paymentMethod,
        paymentMethod: isFree ? 'cod' : paymentMethod,
        isFree,
        total,
        utnNumber: paymentMethod === 'upi' ? cleanUtn : null,
        utrNumber: paymentMethod === 'upi' ? cleanUtn : null,
        ...paymentDetails,
      });
      actions.saveAddress({
        fullName: name,
        phone,
        houseNo,
        street,
        locality,
        city,
        state: stateName,
        pinCode,
        landmark,
        address: formattedAddress
      }).catch(error => {
        console.warn('Order placed, but saved address could not be updated:', error);
      });
    } catch (error) {
      checkoutRequestIdRef.current = '';
      console.error('Unable to place order:', error);
      if (paymentClosureStatusRef.current || /payment was cancelled/i.test(error?.message || '')) {
        const closedOutcome = paymentClosureStatusRef.current;
        if (closedOutcome) actions.navigate('orders');
        actions.showPaymentNotice({
          type: closedOutcome === 'failed' ? 'error' : 'cancel',
          message: closedOutcome === 'failed'
            ? 'Payment failed. This order was not confirmed.'
            : 'Payment cancelled. Your order was not placed.'
        });
        setPlaceOrderError('');
      } else {
        const message = error?.message || 'Unable to place order. Please review your cart and try again.';
        actions.showPaymentNotice({ type: 'error', message });
        setPlaceOrderError(message);
      }
      if (couponApplied && /coupon|discount/i.test(error?.message || '')) {
        setCouponApplied(null);
        setCouponMsg(error.message);
      }
    } finally {
      setPlacing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="page-wrapper checkout-screen">
        <header className="screen-header">
          <button className="back-btn" onClick={() => actions.back('cart')} aria-label="Go back"><ArrowLeft size={20} /></button>
          <h2 className="screen-title">Checkout</h2>
          <div></div>
        </header>
        <div className="empty-cart animate-fade">
          <div className="empty-cart-icon">📦</div>
          <h3>No items to checkout</h3>
          <p>Add items to your cart first.</p>
          <button className="btn btn-gold" onClick={() => actions.navigate('home')}>Shop Now</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper checkout-screen">
      {/* Header */}
      <header className="screen-header">
        <button className="back-btn" onClick={() => actions.back('cart')} id="checkout-back-btn" aria-label="Go back">
          <ArrowLeft size={20} />
        </button>
        <h2 className="screen-title">Checkout</h2>
        <div></div>
      </header>

      <div className="checkout-content">
        {/* Delivery Details */}
        <section className="checkout-section card animate-fade">
          <h3 className="checkout-section-title">📍 Delivery Details</h3>
          <div className="checkout-fields">
            <div className="input-group">
              <label>Full Name</label>
              <input className={`input-field ${errors.name ? 'error' : ''}`} value={name} onChange={e => setName(e.target.value)} placeholder="Enter full name" />
              {errors.name && <span className="field-error-text">{errors.name}</span>}
            </div>
            <div className="input-group">
              <label>Phone Number</label>
              <input className={`input-field ${errors.phone ? 'error' : ''}`} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile number" />
              {errors.phone && <span className="field-error-text">{errors.phone}</span>}
            </div>
            <div className="input-group">
              <label>House / Flat No.</label>
              <input className={`input-field ${errors.houseNo ? 'error' : ''}`} value={houseNo} onChange={e => setHouseNo(e.target.value)} placeholder="House/Flat No., Floor, Apartment" />
              {errors.houseNo && <span className="field-error-text">{errors.houseNo}</span>}
            </div>
            <div className="input-group">
              <label>Building / Street / Colony</label>
              <input className={`input-field ${errors.street ? 'error' : ''}`} value={street} onChange={e => setStreet(e.target.value)} placeholder="Building name, Street, Colony, Road" />
              {errors.street && <span className="field-error-text">{errors.street}</span>}
            </div>
            <div className="input-group">
              <label>Area / Locality</label>
              <input className={`input-field ${errors.locality ? 'error' : ''}`} value={locality} onChange={e => setLocality(e.target.value)} placeholder="Area, Sector, Locality" />
              {errors.locality && <span className="field-error-text">{errors.locality}</span>}
            </div>
            <div className="checkout-row">
              <div className="input-group" style={{ flex: 1 }}>
                <label>City</label>
                <input className={`input-field ${errors.city ? 'error' : ''}`} value={city} onChange={e => setCity(e.target.value)} placeholder="City" />
                {errors.city && <span className="field-error-text">{errors.city}</span>}
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label>State</label>
                <input className={`input-field ${errors.state ? 'error' : ''}`} value={stateName} onChange={e => setStateName(e.target.value)} placeholder="State" />
                {errors.state && <span className="field-error-text">{errors.state}</span>}
              </div>
            </div>
            <div className="checkout-row">
              <div className="input-group" style={{ flex: 1 }}>
                <label>PIN Code</label>
                <input className={`input-field ${errors.pinCode ? 'error' : ''}`} value={pinCode} maxLength={6} onChange={e => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit PIN" />
                {errors.pinCode && <span className="field-error-text">{errors.pinCode}</span>}
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Landmark (Optional)</label>
                <input className="input-field" value={landmark} onChange={e => setLandmark(e.target.value)} placeholder="Nearby landmark" />
              </div>
            </div>
          </div>
        </section>

        {/* Order Summary */}
        <section className="checkout-section card animate-fade" style={{ animationDelay: '0.1s' }}>
          <h3 className="checkout-section-title">📋 Order Summary</h3>
          <div className="order-items-preview">
            {cart.map(item => (
              <div className="order-preview-item" key={item.id}>
                {item.image ? <img src={item.image} alt={item.name} className="preview-img" /> : <div className="preview-img image-placeholder" aria-label="Product image unavailable" />}
                <div className="preview-info">
                  <span className="preview-name">{item.name}</span>
                  <span className="preview-qty">Qty: {item.qty}</span>
                </div>
                <span className="preview-price">{formatPrice(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
          <div className="summary-divider"></div>
          <div className="summary-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
          {discount > 0 && <div className="summary-row discount-row"><span>Coupon Discount</span><span>−{formatPrice(discount)}</span></div>}
          <div className="summary-divider"></div>
          <div className="summary-row summary-total"><span>Total</span><span>{formatPrice(total)}</span></div>
        </section>

        {/* Coupon Code */}
        <section className="checkout-section card animate-fade" style={{ animationDelay: '0.15s' }}>
          <h3 className="checkout-section-title">🏷️ Coupon Code</h3>
          <div className="coupon-input-wrap">
            <TagIcon size={18} className="coupon-icon" />
            <input
              className="input-field coupon-input"
              value={couponCode}
              onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponApplied(null); setCouponMsg(''); }}
              placeholder="Enter coupon code"
              id="coupon-input"
            />
            <button className="btn btn-forest coupon-apply-btn" onClick={handleApplyCoupon} disabled={checkingCoupon} id="apply-coupon-btn">
              {checkingCoupon ? 'Checking…' : 'Apply'}
            </button>
          </div>
          {couponMsg && <p className={`coupon-msg ${couponApplied ? 'success' : 'error'}`}>{couponMsg}</p>}
        </section>

        {/* Payment Method */}
        <section className="checkout-section card animate-fade" style={{ animationDelay: '0.2s' }}>
          <h3 className="checkout-section-title">💳 Payment Method</h3>
          <div className="payment-options">
            <label className={`payment-option ${paymentMethod === 'online' ? 'selected' : ''}`} id="pay-online-option">
              <input type="radio" name="payment" value="online" checked={paymentMethod === 'online'} onChange={e => setPaymentMethod(e.target.value)} />
              <div className="payment-radio"></div>
              <div className="payment-info">
                <span className="payment-label">Pay Online (Card / Netbanking / Wallet)</span>
                <span className="payment-desc">Fast and secure automated payment</span>
              </div>
            </label>

            <label className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`} id="pay-cod-option">
              <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={e => setPaymentMethod(e.target.value)} />
              <div className="payment-radio"></div>
              <div className="payment-info">
                <span className="payment-label">Cash on Delivery</span>
                <span className="payment-desc">Pay when you receive the order</span>
              </div>
            </label>
          </div>
        </section>
      </div>

      {/* Place Order Button */}
      <div className="checkout-bottom-bar">
        {placeOrderError && <p className="checkout-order-error" role="alert">{placeOrderError}</p>}
        <div className="checkout-total">
          <span className="checkout-label">Total Payable</span>
          <span className="checkout-amount">{formatPrice(total)}</span>
        </div>
        <button
          className="btn btn-gold checkout-btn"
          onClick={handlePlaceOrder}
          disabled={placing}
          id="place-order-btn"
        >
          {placing ? 'Placing Order...' : 'Place Order'}
        </button>
      </div>
    </div>
  );
}
