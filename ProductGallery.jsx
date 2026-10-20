/* ============================================================
   ProductGallery.jsx — Product image slider for NEFER Jewelry
   Features: slide track, thumbnails, prev/next, hover magnifier,
   touch swipe and a full-screen viewer. Every image stays mounted
   so switching images never re-downloads them.
   ============================================================ */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getOptimizedProductImage, getPreviewImage } from '../utils/productImages.js';
import ProductImageViewer from './ProductImageViewer.jsx';
import './ProductGallery.css';

const SWIPE_THRESHOLD_PX = 45;
const HOVER_ZOOM_SCALE = 2.2;

export default function ProductGallery({ images = [], productName = 'Product', productId }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState(null);
  const [canHoverZoom, setCanHoverZoom] = useState(false);
  const touchStartRef = useRef(null);

  const safeImages = useMemo(() => images.filter(Boolean), [images]);
  const imageCount = safeImages.length;

  /* Reset to the first image whenever a different product is opened. */
  useEffect(() => {
    setActiveIndex(0);
    setViewerOpen(false);
    setZoomOrigin(null);
  }, [productId]);

  /* Clamp the index if the admin removes an image while we are viewing it. */
  useEffect(() => {
    if (activeIndex > imageCount - 1) setActiveIndex(Math.max(0, imageCount - 1));
  }, [imageCount, activeIndex]);

  /* Hover magnification is desktop-only; touch devices get swipe instead. */
  useEffect(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine)');
    const applyPreference = () => setCanHoverZoom(query.matches);
    applyPreference();
    query.addEventListener?.('change', applyPreference);
    return () => query.removeEventListener?.('change', applyPreference);
  }, []);

  const goTo = useCallback((nextIndex) => {
    if (imageCount < 2) return;
    setActiveIndex(((nextIndex % imageCount) + imageCount) % imageCount);
    setZoomOrigin(null);
  }, [imageCount]);

  const handleTouchStart = (event) => {
    touchStartRef.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event) => {
    const startX = touchStartRef.current;
    const endX = event.changedTouches[0]?.clientX;
    touchStartRef.current = null;
    if (startX === null || endX === undefined || imageCount < 2) return;
    const distance = endX - startX;
    if (Math.abs(distance) < SWIPE_THRESHOLD_PX) return;
    goTo(activeIndex + (distance < 0 ? 1 : -1));
  };

  const handleZoomMove = (event) => {
    if (!canHoverZoom || imageCount === 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    setZoomOrigin({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  if (imageCount === 0) {
    return (
      <div className="product-gallery product-gallery--empty">
        <div className="gallery-empty-state">
          <span>Image unavailable</span>
        </div>
      </div>
    );
  }

  const activeImage = safeImages[activeIndex];
  const isZooming = canHoverZoom && Boolean(zoomOrigin);

  return (
    <div className="product-gallery">
      <div className="gallery-layout">
        {/* Thumbnails — vertical rail on desktop, horizontal strip on mobile */}
        {imageCount > 1 && (
          <div className="gallery-thumbnails" role="tablist" aria-label={`${productName} images`}>
            {safeImages.map((image, index) => (
              <button
                key={image}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`Show image ${index + 1} of ${imageCount}`}
                className={`gallery-thumbnail ${index === activeIndex ? 'is-active' : ''}`}
                onClick={() => goTo(index)}
              >
                <img src={getOptimizedProductImage(image, 140, 'fill')} alt="" loading="lazy" draggable="false" />
              </button>
            ))}
          </div>
        )}

        <div className="gallery-stage">
          <div
            className="gallery-frame"
            style={{ backgroundImage: `url(${getPreviewImage(activeImage, 24)})` }}
            onMouseEnter={handleZoomMove}
            onMouseMove={handleZoomMove}
            onMouseLeave={() => setZoomOrigin(null)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="gallery-track"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {safeImages.map((image, index) => {
                const isActiveSlide = index === activeIndex;
                const zoomStyle = isActiveSlide && isZooming
                  ? { transform: `scale(${HOVER_ZOOM_SCALE})`, transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%` }
                  : undefined;
                return (
                  <button
                    key={image}
                    type="button"
                    className="gallery-slide"
                    onClick={() => setViewerOpen(true)}
                    aria-label={`Open full-screen image viewer for ${productName}`}
                    tabIndex={isActiveSlide ? 0 : -1}
                  >
                    <img
                      src={getOptimizedProductImage(image, 1100, 'limit')}
                      alt={`${productName} — image ${index + 1}`}
                      className={`gallery-image ${isActiveSlide && isZooming ? 'is-zoomed' : ''}`}
                      style={zoomStyle}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      draggable="false"
                    />
                  </button>
                );
              })}
            </div>

            {imageCount > 1 && (
              <>
                <button
                  type="button"
                  className="gallery-arrow gallery-arrow--prev"
                  onClick={() => goTo(activeIndex - 1)}
                  aria-label="Previous image"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="gallery-arrow gallery-arrow--next"
                  onClick={() => goTo(activeIndex + 1)}
                  aria-label="Next image"
                >
                  ›
                </button>
              </>
            )}

            {canHoverZoom && !isZooming && (
              <span className="gallery-zoom-hint">Hover to zoom · Click for full screen</span>
            )}
          </div>

          {imageCount > 1 && (
            <span className="gallery-counter" aria-live="polite">
              {activeIndex + 1} / {imageCount}
            </span>
          )}
        </div>
      </div>

      {viewerOpen && (
        <ProductImageViewer
          product={{ id: productId, name: productName }}
          images={safeImages}
          initialIndex={activeIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  );
}
