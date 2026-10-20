import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { formatPrice, calculateDiscountPercent } from '../utils/format.js';
import { getOptimizedProductImage, getProductImages } from '../utils/productImages.js';
import ProductGallery from './ProductGallery.jsx';
import ExpandableDescription from './ExpandableDescription.jsx';

export default function ProductCard({ product }) {
  const { state, actions } = useApp();
  const [quick, setQuick] = useState(false), [added, setAdded] = useState(false);
  const image = getProductImages(product)[0];
  const discount = calculateDiscountPercent(product.price, product.originalPrice);
  const stock = Number(product.stock || 0), inCart = state.cart.find(item => item.id === product.id)?.qty || 0;
  return <article className="n-product">
    <div className="n-product-photo">
      <Link to={`/product/${encodeURIComponent(product.id)}`} aria-label={`View ${product.name}`}>
        {image ? <img src={getOptimizedProductImage(image, 640, 'fill')} alt={product.name} loading="lazy" width="640" height="800" /> : <span className="n-image-empty">Photography coming soon</span>}
      </Link>
      {(product.newArrival || product.bestSeller || discount > 0) && <span className="n-badge">{product.newArrival ? 'NEW' : product.bestSeller ? 'BESTSELLER' : `${discount}% OFF`}</span>}
      <button className="n-heart" aria-label={state.favorites.includes(product.id) ? 'Remove from wishlist' : 'Save to wishlist'} onClick={() => actions.toggleFavorite(product.id)}>{state.favorites.includes(product.id) ? '♥' : '♡'}</button>
      <button className="n-quick" onClick={() => setQuick(true)}>Quick view</button>
    </div>
    <p className="n-eyebrow">{product.category}</p>
    <Link to={`/product/${encodeURIComponent(product.id)}`}><h3>{product.name}</h3></Link>
    <p className="n-product-price">
      <span className="n-product-price-current">{formatPrice(product.price)}</span>
      {discount > 0 && <del className="n-product-price-original">{formatPrice(product.originalPrice)}</del>}
    </p>
    <div className="n-card-bottom"><small>{stock ? stock <= 5 ? `Only ${stock} left` : 'In stock' : 'Currently unavailable'}</small><button disabled={!stock || inCart >= stock} onClick={() => { actions.addToCart(product); setAdded(true); }}>{added ? '✓ Added' : 'Add to bag +'}</button></div>
    {quick && <div className="n-modal" role="dialog" aria-modal="true" aria-label={product.name} onClick={() => setQuick(false)}><div className="n-quick-content" onClick={event => event.stopPropagation()}><button className="n-close" autoFocus onClick={() => setQuick(false)} aria-label="Close quick view">×</button><ProductGallery product={product} images={getProductImages(product)} /><div><p className="n-eyebrow">A closer look</p><h2>{product.name}</h2><p className="n-product-price n-quick-price"><span className="n-product-price-current">{formatPrice(product.price)}</span></p><ExpandableDescription text={product.description} containerClassName="n-quick-description" onToggleClick={event => event.stopPropagation()} /><Link className="n-button" to={`/product/${product.id}`}>Discover this piece</Link></div></div></div>}
  </article>;
}