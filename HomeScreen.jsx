import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import ProductImageViewer from './ProductImageViewer.jsx';
import ExpandableDescription from './ExpandableDescription.jsx';
import { ArrowLeft, HomeIcon } from './Icons.jsx';
import { getOptimizedProductImage, getProductImages } from '../utils/productImages.js';
import { formatPrice } from '../utils/format.js';
import './HomeScreen.css';

const CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'Rings', name: 'Rings' },
  { id: 'Bracelets', name: 'Bracelets' },
  { id: 'Sets', name: 'Sets' },
  { id: 'Pendants', name: 'Pendants' },
  { id: 'Hair Pins', name: 'Hair Pins' },
];
const MIN_PRICE = 1;
const MAX_PRICE = 10000;
const DEFAULT_PROMOTIONS = [
  { title: 'Discover Your Royal Spark', subtitle: 'Rings · Bracelets · Pendants · Sets' },
  { title: 'Elegance for Every Moment', subtitle: 'Find a little luxury in every detail.' },
  { title: 'Make Every Look Unforgettable', subtitle: 'Choose the piece that feels like you.' },
  { title: 'Exclusive Sale Offer', subtitle: 'Save on selected NEFER jewellery.' },
  { title: 'Celebrate With NEFER', subtitle: 'Discover special event collections.' },
];

export default function HomeScreen() {
  const { state, actions } = useApp();
  const location = useLocation();
  const [minPrice, setMinPrice] = useState(MIN_PRICE);
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
  const [appliedMinPrice, setAppliedMinPrice] = useState(MIN_PRICE);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState(MAX_PRICE);
  const [priceFilterOpen, setPriceFilterOpen] = useState(false);
  const [addedItems, setAddedItems] = useState({});
  const [brandMessageIndex, setBrandMessageIndex] = useState(0);
  const [viewer, setViewer] = useState(null);
  const isCategoriesScreen = state.screen === 'categories';
  const activePromotions = useMemo(() => {
    const now = Date.now();
    const promotions = (state.promotions || [])
      .filter(item => item.active !== false)
      .filter(item => !item.startAt || new Date(item.startAt).getTime() <= now)
      .filter(item => !item.endAt || new Date(item.endAt).getTime() > now)
      .sort((a, b) => (Number(a.displayOrder) || 1) - (Number(b.displayOrder) || 1));
    return promotions.length ? promotions : DEFAULT_PROMOTIONS;
  }, [state.promotions]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state.screen]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setBrandMessageIndex(index => (index + 1) % activePromotions.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [activePromotions.length]);
  useEffect(() => {
    if (brandMessageIndex >= activePromotions.length) setBrandMessageIndex(0);
  }, [activePromotions.length, brandMessageIndex]);
  useEffect(() => {
    state.products.forEach(product => {
      const secondaryImage = getProductImages(product)[1];
      if (!secondaryImage) return;
      const preloadedImage = new Image();
      preloadedImage.src = getOptimizedProductImage(secondaryImage, 700, 'fill');
    });
  }, [state.products]);

  const categoryOptions = useMemo(() => {
    const options = new Map([['all', { id: 'all', name: 'All' }]]);
    [...(state.categories || []), ...state.products.map(product => product.category)]
      .filter(category => typeof category === 'string' && category.trim())
      .forEach(name => {
        const normalizedName = name.trim();
        const key = normalizedName.toLowerCase();
        if (!options.has(key)) options.set(key, { id: normalizedName, name: normalizedName });
      });
    return [...options.values()];
  }, [state.categories, state.products]);

  const activeCategory = useMemo(() => {
    const searchCategory = new URLSearchParams(location.search).get('category');
    const routeCategory = location.pathname.startsWith('/category/')
      ? decodeURIComponent(location.pathname.slice('/category/'.length))
      : '';
    const requestedCategory = String(searchCategory || routeCategory || '').trim();
    if (!requestedCategory) return 'all';

    const normalized = requestedCategory.toLowerCase().replace(/-/g, ' ');
    const matchedCategory = categoryOptions.find(category => {
      const categoryName = String(category.name || category.id).trim().toLowerCase();
      const categorySlug = categoryName.replace(/\s+/g, '-');
      return categoryName === normalized || categorySlug === requestedCategory.toLowerCase();
    });
    return matchedCategory?.id || 'all';
  }, [categoryOptions, location.pathname, location.search]);

  const cartQuantities = new Map(state.cart.map(item => [item.id, item.qty]));
  const activePromotion = activePromotions[brandMessageIndex];
  const heroImage = activePromotion.imageUrl || getProductImages(state.products[0] || {})[0];
  const categoryCards = categoryOptions
    .filter(category => category.id !== 'all')
    .slice(0, 7)
    .map(category => ({
      ...category,
      product: state.products.find(product => product.category?.toLowerCase() === category.id.toLowerCase()),
    }));
  const newArrivals = state.products.filter(product => product.newArrival || product.isNew || product.featured).slice(0, 4);
  const bestSellers = state.products.filter(product => product.bestSeller || product.isBestSeller).slice(0, 4);
  const featuredProducts = newArrivals.length ? newArrivals : state.products.slice(0, 4);
  const handleCategoryClick = categoryId => {
    actions.navigate(categoryId === 'all'
      ? '/categories'
      : `/categories?category=${encodeURIComponent(categoryId)}`);
  };
  const filteredProducts = useMemo(() => {
    let products = state.products;

    if (isCategoriesScreen && activeCategory !== 'all') {
      products = products.filter(product => product.category?.toLowerCase() === activeCategory.toLowerCase());
    }

    if (isCategoriesScreen) {
      products = products.filter(product => Number(product.price) >= appliedMinPrice && Number(product.price) <= appliedMaxPrice);
    }

    return products;
  }, [state.products, isCategoriesScreen, activeCategory, appliedMinPrice, appliedMaxPrice]);

  const applyPriceFilter = () => {
    setAppliedMinPrice(minPrice);
    setAppliedMaxPrice(maxPrice);
    setPriceFilterOpen(false);
  };
  const resetPriceFilter = () => {
    setMinPrice(MIN_PRICE);
    setMaxPrice(MAX_PRICE);
    setAppliedMinPrice(MIN_PRICE);
    setAppliedMaxPrice(MAX_PRICE);
  };
  const handleAddToCart = product => {
    actions.addToCart(product);
    setAddedItems(previous => ({ ...previous, [product.id]: true }));
    setTimeout(() => setAddedItems(previous => ({ ...previous, [product.id]: false })), 1500);
  };
  const handlePromotionClick = linkValue => {
    const link = String(linkValue || '').trim();
    if (!link) return;

    const productReference = link.replace(/^\/+/, '').replace(/^product\//i, '');
    const referencedProduct = state.products.find(product =>
      String(product.id) === productReference || String(product.slug || '') === productReference
    );
    if (referencedProduct) {
      actions.openProduct(referencedProduct.id, state.screen);
      return;
    }

    const internalScreens = {
      '/': 'home',
      '/home': 'home',
      '/categories': 'categories',
      '/cart': 'cart',
      '/orders': 'orders',
      '/profile': 'profile',
    };
    if (internalScreens[link]) {
      actions.navigate(internalScreens[link]);
      return;
    }

    window.location.href = link;
  };

  const handleCategoryBack = () => {
    actions.back('/');
  };
  return (
    <div className="page-wrapper home-page">
      <main className="main-content-container catalog-content">
        <section className={`catalog-heading ${isCategoriesScreen ? 'catalog-heading--categories' : ''}`}>
          {isCategoriesScreen && (
            <nav className="category-page-navigation" aria-label="Category page navigation">
              <button type="button" className="category-page-back" onClick={handleCategoryBack} aria-label="Go back to previous page">
                <ArrowLeft size={19} />
                <span>Back</span>
              </button>
              <button type="button" className="category-page-home" onClick={() => actions.navigate('home')}>
                <HomeIcon size={17} />
                <span>Home</span>
              </button>
            </nav>
          )}
          <h1 className="catalog-title">{isCategoriesScreen ? 'Categories' : 'All Products'}</h1>
        </section>

        {isCategoriesScreen && (
          <>
            <section className="categories-section" aria-label="Product categories">
              <div className="categories-scroll">
                {categoryOptions.map(category => (
                  <button
                    key={category.id}
                    className={`category-chip ${activeCategory === category.id ? 'active' : ''}`}
                    onClick={() => handleCategoryClick(category.id)}
                    aria-pressed={activeCategory === category.id}
                  >
                    <span className="cat-name">{category.name}</span>
                  </button>
                ))}
              </div>
            </section>
            <div className="catalog-toolbar">
              <span className="product-count">{filteredProducts.length} products</span>
              <button
                className={`price-filter-button ${priceFilterOpen ? 'active' : ''}`}
                type="button"
                aria-expanded={priceFilterOpen}
                aria-controls="price-filter-panel"
                onClick={() => setPriceFilterOpen(open => !open)}
              >
                Price: {formatPrice(appliedMinPrice)} – {formatPrice(appliedMaxPrice)}
              </button>
            </div>
            {priceFilterOpen && (
              <section className="price-filter-panel" id="price-filter-panel" aria-label="Set price range">
                <div className="price-slider-control">
                  <label htmlFor="minimum-price-input">Minimum price</label>
                  <div className="price-range-input">
                    <span aria-hidden="true">₹</span>
                    <input
                      id="minimum-price-input"
                      type="number"
                      min={MIN_PRICE}
                      max={maxPrice - 1}
                      value={minPrice}
                      onChange={event => setMinPrice(Math.max(MIN_PRICE, Math.min(Number(event.target.value), maxPrice - 1)))}
                    />
                  </div>
                  <input
                    id="minimum-price-slider"
                    type="range"
                    min={MIN_PRICE}
                    max={maxPrice - 1}
                    value={minPrice}
                    aria-label="Minimum price slider"
                    onChange={event => setMinPrice(Math.min(Number(event.target.value), maxPrice - 1))}
                  />
                </div>
                <div className="price-slider-control">
                  <label htmlFor="maximum-price-input">Maximum price</label>
                  <div className="price-range-input">
                    <span aria-hidden="true">₹</span>
                    <input
                      id="maximum-price-input"
                      type="number"
                      min={minPrice + 1}
                      max={MAX_PRICE}
                      value={maxPrice}
                      onChange={event => setMaxPrice(Math.max(minPrice + 1, Math.min(Number(event.target.value), MAX_PRICE)))}
                    />
                  </div>
                  <input
                    id="maximum-price-slider"
                    type="range"
                    min={minPrice + 1}
                    max={MAX_PRICE}
                    value={maxPrice}
                    aria-label="Maximum price slider"
                    onChange={event => setMaxPrice(Math.max(Number(event.target.value), minPrice + 1))}
                  />
                </div>
                <div className="price-filter-actions">
                  <button
                    className="price-filter-reset"
                    type="button"
                    onClick={resetPriceFilter}
                  >
                    Reset range
                  </button>
                  <button
                    className="price-filter-apply"
                    type="button"
                    onClick={applyPriceFilter}
                  >
                    Apply Filter
                  </button>
                </div>
              </section>
            )}
          </>
        )}

        <section className="catalog-brand-banner" aria-label="NEFER Jewelry">
          <div className="catalog-brand-content">
            <img src="/logo-mark-transparent.png" alt="NEFER logo" className="catalog-brand-logo" />
            <div className="catalog-brand-copy">
              <span className="catalog-brand-name">NEFER JEWELRY</span>
            </div>
          </div>
          <div
            className="catalog-brand-promo"
            key={`${activePromotion.id || 'default'}-${brandMessageIndex}`}
            aria-live="polite"
          >
            <div className="catalog-brand-message">
              <span className="catalog-brand-promo-title">{activePromotion.title}</span>
              <span className="catalog-brand-promo-detail">{activePromotion.subtitle || activePromotion.description}</span>
              <button
                type="button"
                className="catalog-brand-promo-button"
                onClick={() => handlePromotionClick(activePromotion.buttonLink || '/categories')}
              >
                {activePromotion.buttonText || 'Shop Now'}
              </button>
            </div>
            <div className="catalog-brand-indicators" aria-label="Brand messages">
              {activePromotions.map((message, index) => (
                <button
                  key={message.id || message.title}
                  type="button"
                  className={`catalog-brand-indicator ${brandMessageIndex === index ? 'active' : ''}`}
                  aria-label={`Show message ${index + 1}`}
                  aria-pressed={brandMessageIndex === index}
                  onClick={() => setBrandMessageIndex(index)}
                />
              ))}
            </div>
          </div>
          {heroImage && (
            <img
              src={heroImage}
              alt=""
              className="catalog-brand-hero-image"
            />
          )}
        </section>

        {!isCategoriesScreen && (
          <>
            <section className="storefront-section" aria-labelledby="shop-by-category-title">
              <div className="storefront-section-heading">
                <div>
                  <span className="section-eyebrow">Curated for you</span>
                  <h2 id="shop-by-category-title">Shop by category</h2>
                </div>
                <button type="button" className="section-link" onClick={() => actions.navigate('categories')}>View all</button>
              </div>
              <div className="category-card-grid">
                {categoryCards.map(category => {
                  const image = getProductImages(category.product || {})[0];
                  return (
                    <button type="button" className="category-card" key={category.id} onClick={() => handleCategoryClick(category.id)}>
                      {image ? <img src={getOptimizedProductImage(image, 500, 'fill')} alt="" loading="lazy" /> : <span className="category-card-placeholder">NEFER</span>}
                      <span>{category.name}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="storefront-section featured-section" aria-labelledby="new-arrivals-title">
              <div className="storefront-section-heading">
                <div>
                  <span className="section-eyebrow">Just arrived</span>
                  <h2 id="new-arrivals-title">New arrivals</h2>
                </div>
                <button type="button" className="section-link" onClick={() => actions.navigate('categories')}>Explore pieces</button>
              </div>
              <div className="mini-product-grid">
                {featuredProducts.map(product => {
                  const image = getProductImages(product)[0];
                  return (
                    <button type="button" className="mini-product-card" key={product.id} onClick={() => actions.openProduct(product.id, state.screen)}>
                      {image ? <img src={getOptimizedProductImage(image, 600, 'fill')} alt={product.name} loading="lazy" /> : <span className="category-card-placeholder">NEFER</span>}
                      <span className="mini-product-category">{product.category || 'Jewelry'}</span>
                      <strong>{product.name}</strong>
                      <span>{formatPrice(product.price)}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="storefront-editorial" aria-label="NEFER signature collection">
              <div>
                <span className="section-eyebrow">The NEFER edit</span>
                <h2>Jewellery that defines your every moment.</h2>
                <p>Discover refined pieces designed to become part of your signature style.</p>
                <button type="button" className="btn btn-gold" onClick={() => actions.navigate('categories')}>Explore collection</button>
              </div>
              {getProductImages(state.products[0] || {})[0] && (
                <img src={getOptimizedProductImage(getProductImages(state.products[0])[0], 900, 'fill')} alt="" loading="lazy" />
              )}
            </section>

            {bestSellers.length > 0 && (
              <section className="storefront-section" aria-labelledby="best-sellers-title">
                <div className="storefront-section-heading">
                  <div>
                    <span className="section-eyebrow">Loved by many</span>
                    <h2 id="best-sellers-title">Best sellers</h2>
                  </div>
                </div>
                <div className="mini-product-grid">
                  {bestSellers.map(product => {
                    const image = getProductImages(product)[0];
                    return (
                      <button type="button" className="mini-product-card" key={product.id} onClick={() => actions.openProduct(product.id, state.screen)}>
                        {image ? <img src={getOptimizedProductImage(image, 600, 'fill')} alt={product.name} loading="lazy" /> : <span className="category-card-placeholder">NEFER</span>}
                        <span className="mini-product-category">{product.category || 'Jewelry'}</span>
                        <strong>{product.name}</strong>
                        <span>{formatPrice(product.price)}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="storefront-benefits" aria-label="Why choose NEFER">
              {[
                ['✦', 'Premium craftsmanship', 'Thoughtful details in every piece.'],
                ['◇', 'Secure payments', 'Simple and protected checkout.'],
                ['↺', 'Easy returns', 'Shop with complete confidence.'],
                ['⌁', 'Fast delivery', 'Carefully packed to reach you safely.'],
              ].map(([icon, title, detail]) => (
                <div className="storefront-benefit" key={title}>
                  <span>{icon}</span>
                  <strong>{title}</strong>
                  <p>{detail}</p>
                </div>
              ))}
            </section>
          </>
        )}


        {!isCategoriesScreen && (
          <div className="catalog-toolbar">
            <span className="product-count">{filteredProducts.length} products</span>
          </div>
        )}


        <section className="products-section">
          <div className="product-grid">
            {filteredProducts.map((product, index) => {
              const productImages = getProductImages(product);
              return (
              <article
                className="product-card card"
                key={product.id}
                style={{ animationDelay: `${index * 0.05}s`, cursor: 'pointer' }}
                onClick={() => actions.openProduct(product.id, state.screen)}
                onKeyDown={event => {
                  if ((event.key === 'Enter' || event.key === ' ') && !event.defaultPrevented) {
                    event.preventDefault();
                    actions.openProduct(product.id, state.screen);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Open details for ${product.name}`}
              >
                <div className="product-image-wrap">
                  <button
                    className={`product-image-button ${productImages.length > 1 ? 'has-secondary' : ''}`}
                    type="button"
                    onClick={event => {
                      event.stopPropagation();
                      if (productImages.length) setViewer({ product, images: productImages, index: 0 });
                    }}
                    aria-label={`View images for ${product.name}`}
                  >
                    {productImages.length > 0 ? (
                      <>
                        <img src={getOptimizedProductImage(productImages[0], 700, 'fill')} alt={product.name} className="product-image product-image--primary" loading="lazy" />
                        {productImages[1] && <img src={getOptimizedProductImage(productImages[1], 700, 'fill')} alt="" className="product-image product-image--secondary" loading="lazy" />}
                      </>
                    ) : (
                      <span className="product-image-missing">Image unavailable</span>
                    )}
                  </button>
                  {productImages.length > 1 && <span className="product-image-count">1 / {productImages.length}</span>}
                  {product.stock <= 5 && product.stock > 0 && (
                    <span className="stock-badge">Only {product.stock} left</span>
                  )}
                  {product.stock === 0 && <span className="stock-badge out">Out of Stock</span>}
                  <button
                    className="favorite-btn"
                    style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, border: 0, background: 'rgba(255,255,255,.9)', borderRadius: '50%', width: 34, height: 34, color: 'var(--clr-danger)', fontSize: 22, cursor: 'pointer' }}
                    onClick={event => { event.stopPropagation(); actions.toggleFavorite(product.id); }}
                    aria-label={state.favorites.includes(product.id) ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {state.favorites.includes(product.id) ? '♥' : '♡'}
                  </button>
                </div>
                <div className="product-info">
                  <span className="product-category">{product.category}</span>
                  <h3 className="product-name">{product.name}</h3>
                  <ExpandableDescription
                    text={product.description}
                    className="product-desc"
                    containerClassName="product-description-control"
                    onToggleClick={event => event.stopPropagation()}
                  />
                  <div className="product-bottom">
                    <span className="product-price">{formatPrice(product.price)}</span>
                    <button
                      className={`btn-add-cart ${addedItems[product.id] ? 'added' : ''}`}
                      onClick={event => {
                        event.stopPropagation();
                        handleAddToCart(product);
                      }}
                      disabled={product.stock === 0 || (cartQuantities.get(product.id) || 0) >= product.stock}
                      title={(cartQuantities.get(product.id) || 0) >= product.stock ? 'You have added all available stock to your cart' : 'Add to cart'}
                      id={`add-cart-${product.id}`}
                    >
                      {addedItems[product.id] ? '✓ Added' : '+ Add'}
                    </button>
                  </div>
                </div>
              </article>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="empty-state">
              <p>{!isCategoriesScreen
                ? 'No products yet. Products uploaded by the admin will appear here.'
                : 'Product is not found in this price range.'}</p>
            </div>
          )}
        </section>
        {viewer && (
          <ProductImageViewer
            product={viewer.product}
            images={viewer.images}
            initialIndex={viewer.index}
            onClose={() => setViewer(null)}
          />
        )}
      </main>
    </div>
  );
}
