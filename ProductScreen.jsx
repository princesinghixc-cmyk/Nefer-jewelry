import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useProductReviews } from '../hooks/useProductReviews.js';
import { hasReceivedProduct } from '../services/reviewService.js';
import ProductGallery from './ProductGallery.jsx';
import { ArrowLeft } from './Icons.jsx';
import { getProductImages } from '../utils/productImages.js';
import { formatPrice } from '../utils/format.js';
import ExpandableDescription from './ExpandableDescription.jsx';
import './ProductScreen.css';

const parseHighlights = (product) => {
  if (Array.isArray(product?.highlights) && product.highlights.length) return product.highlights.filter(Boolean);
  if (Array.isArray(product?.productHighlights) && product.productHighlights.length) return product.productHighlights.filter(Boolean);
  const text = String(product?.highlights || product?.productHighlights || '').trim();
  if (!text) return [];
  return text.split(/\n|•|;/).map(item => item.trim()).filter(Boolean).slice(0, 6);
};

const parseSpecs = (product) => {
  const entries = [
    ['Material', product?.material],
    ['Color', product?.color],
    ['Size', product?.size],
    ['Weight', product?.weight],
    ['Dimension', product?.dimensions],
    ['Gender', product?.gender],
    ['Occasion', product?.occasion],
    ['SKU', product?.sku],
    ['Brand', product?.brand],
    ['Availability', product?.availability || (Number(product?.stock) > 0 ? 'In stock' : 'Out of stock')],
    ['Care', product?.careInstructions],
    ['Delivery', product?.deliveryInformation],
    ['Return', product?.returnInformation],
    ['Warranty', product?.warrantyInformation],
  ];
  return entries.filter(([, value]) => value && String(value).trim());
};

const productSummary = (product) => {
  const text = String(product?.shortDescription || product?.description || '').trim();
  return text || 'Crafted with premium materials and NEFER craftsmanship for everyday elegance.';
};

export default function ProductScreen() {
  const { state, actions } = useApp();
  const product = state.products.find(item => item.id === state.selectedProductId) || null;
  const currentUser = state.user;
  const favourite = product ? state.favorites.includes(product.id) : false;
  const images = product ? getProductImages(product) : [];
  const originalPrice = Number(product?.originalPrice ?? product?.compareAtPrice ?? 0) || 0;
  const salePrice = Number(product?.price || 0);
  const discount = originalPrice > salePrice ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : 0;
  const verifiedPurchase = Boolean(product && currentUser && hasReceivedProduct(state.orders, product.id));

  const { reviews, stats, userReview, loading, loadError, submitting, submitError, submitReview, editReview, removeReview, moderateReview } = useProductReviews(product?.id, {
    includeHidden: state.isAdmin,
    currentUserId: currentUser?.uid,
  });

  if (!product) {
    return (
      <div className="page-wrapper product-screen-empty">
        <div className="product-empty-card">
          <p className="product-empty-label">NEFER JEWELRY</p>
          <h2>Product not found</h2>
          <p>The product you opened is no longer available.</p>
          <button type="button" className="btn btn-gold" onClick={() => actions.closeProduct()}>
            Back to shopping
          </button>
        </div>
      </div>
    );
  }

  const handleBuyNow = () => {
    actions.buyNow(product);
  };

  const handleAddToCart = () => {
    actions.addToCart(product);
  };

  const handleToggleFavorite = () => {
    if (!currentUser) return;
    actions.toggleFavorite(product.id);
  };

  const handleSubmitReview = async (payload) => {
    await submitReview({
      user: currentUser,
      productName: product.name,
      rating: payload.rating,
      text: payload.text,
      images: payload.images,
      verifiedPurchase,
    });
  };

  const handleEditReview = async (payload) => {
    if (!currentUser) return;
    await editReview({
      userId: currentUser.uid,
      rating: payload.rating,
      text: payload.text,
      images: payload.images,
    });
  };

  const handleDeleteReview = async (reviewId) => {
    await removeReview(reviewId);
  };

  const handleBack = () => {
    actions.back('/categories');
  };

  return (
    <div className="page-wrapper product-detail-page">
      <header className="screen-header product-detail-header">
        <button className="back-btn" type="button" onClick={handleBack} aria-label="Go back to previous screen">
          <ArrowLeft size={20} />
        </button>
        <h2 className="screen-title">Product</h2>
        <button
          type="button"
          className="product-detail-fav"
          onClick={handleToggleFavorite}
          aria-label={favourite ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {favourite ? '♥' : '♡'}
        </button>
      </header>

      <main className="product-detail-shell">
        <section className="product-detail-layout">
          <div className="product-detail-gallery-block">
            <ProductGallery images={images} productName={product.name} productId={product.id} />
          </div>

          <aside className="product-detail-info card">
            <div className="product-detail-badge-row">
              <span className="product-detail-category">{product.category || 'Jewelry'}</span>
              {discount > 0 && <span className="product-detail-discount">{discount}% OFF</span>}
            </div>

            <h1 className="product-detail-name">{product.name}</h1>

            <div className="product-detail-rating-row">
              <span className="product-detail-stars">{stats.average ? '★'.repeat(Math.round(stats.average)) : '★'}</span>
              <span className="product-detail-rating-value">{stats.count ? stats.roundedAverage.toFixed(1) : 'New'}</span>
              <span className="product-detail-review-count">{stats.count || 0} reviews</span>
            </div>

            <div className="product-price-row">
              <span className="product-price-current">{formatPrice(salePrice)}</span>
              {originalPrice > salePrice && (
                <>
                  <span className="product-price-original">{formatPrice(originalPrice)}</span>
                  <span className="product-price-save">Save {formatPrice(originalPrice - salePrice)}</span>
                </>
              )}
            </div>

            <ExpandableDescription
              text={productSummary(product)}
              className="product-detail-summary"
              containerClassName="product-detail-summary-wrap"
              buttonClassName="product-description-toggle"
            />

            <div className="product-detail-status-row">
              <span className={`product-stock-pill ${Number(product.stock || 0) > 0 ? 'in-stock' : 'out-stock'}`}>
                {Number(product.stock || 0) > 0 ? `In Stock · ${product.stock} available` : 'Out of Stock'}
              </span>
              {product?.brand && <span className="product-brand-pill">{product.brand}</span>}
            </div>

            <div className="product-detail-highlights">
              <h3>Highlights</h3>
              <ul>
                {parseHighlights(product).length ? parseHighlights(product).map(item => <li key={item}>{item}</li>) : <li>Crafted for a refined everyday look.</li>}
              </ul>
            </div>

            <div className="product-detail-offers">
              <h3>Available offers</h3>
              <p>{product?.offers || 'Free shipping on orders above ₹2,999 • Secure checkout • Easy returns within 7 days.'}</p>
            </div>

            <div className="product-detail-actions">
              <button type="button" className="btn btn-gold product-primary-btn" onClick={handleBuyNow} disabled={Number(product.stock || 0) <= 0}>
                Buy Now
              </button>
              <button type="button" className="btn btn-outline" onClick={handleAddToCart} disabled={Number(product.stock || 0) <= 0}>
                Add to Cart
              </button>
            </div>
          </aside>
        </section>

        <section className="product-detail-specs card">
          <div className="detail-heading-row">
            <h3>Product description</h3>
          </div>
          <ExpandableDescription
            text={product.description || productSummary(product)}
            className="product-description-full"
            containerClassName="product-description-full-wrap"
            buttonClassName="product-description-toggle"
          />
          <div className="spec-grid">
            <div className="spec-item">
              <span className="spec-label">Availability</span>
              <span className="spec-value">{Number(product.stock || 0) > 0 ? 'In stock' : 'Out of stock'}</span>
            </div>
          </div>
        </section>

        <section className="product-detail-info-grid card">
          <div className="detail-panel">
            <h3>Product highlights</h3>
            <ul>
              {parseHighlights(product).length
                ? parseHighlights(product).map(item => <li key={item}>{item}</li>)
                : <li>Premium design, easy styling and limited edition craftsmanship.</li>}
            </ul>
          </div>
          <div className="detail-panel">
            <h3>Care instructions</h3>
            <p>{product.careInstructions || 'Store in a dry pouch away from moisture and perfume. Clean gently with a soft dry cloth.'}</p>
          </div>
          <div className="detail-panel">
            <h3>Delivery information</h3>
            <p>{product.deliveryInformation || 'Fast delivery across India. Signature required for premium pieces.'}</p>
          </div>
          <div className="detail-panel">
            <h3>Return policy</h3>
            <p>{product.returnInformation || 'Easy 7-day returns for unused, undamaged products in original packaging.'}</p>
          </div>
        </section>

      </main>
    </div>
  );
}
