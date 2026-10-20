import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { XIcon } from './Icons.jsx';
import { getOptimizedProductImage } from '../utils/productImages.js';
import './ProductImageViewer.css';

const clampZoom = value => Math.max(1, Math.min(3, value));

export default function ProductImageViewer({ product, images, initialIndex = 0, onClose }) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const touchStartX = useRef(null);

  const changeImage = (nextIndex) => {
    const normalizedIndex = (nextIndex + images.length) % images.length;
    setActiveIndex(normalizedIndex);
    setZoom(1);
  };

  useEffect(() => {
    setActiveIndex(initialIndex);
    setZoom(1);
  }, [initialIndex, product?.id]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = event => {
      if (event.key === 'Escape') onClose();
      if (images.length > 1 && event.key === 'ArrowLeft') changeImage(activeIndex - 1);
      if (images.length > 1 && event.key === 'ArrowRight') changeImage(activeIndex + 1);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeIndex, images.length, onClose]);

  const handleWheel = event => {
    event.preventDefault();
    setZoom(currentZoom => clampZoom(currentZoom + (event.deltaY < 0 ? 0.25 : -0.25)));
  };

  const handleTouchStart = event => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = event => {
    const endX = event.changedTouches[0]?.clientX;
    if (touchStartX.current === null || endX === undefined || images.length < 2) return;
    const distance = endX - touchStartX.current;
    if (Math.abs(distance) > 45) changeImage(activeIndex + (distance < 0 ? 1 : -1));
    touchStartX.current = null;
  };

  if (!images.length) return null;

  return createPortal(
    <div className="product-viewer-overlay" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section className="product-viewer" role="dialog" aria-modal="true" aria-label={`${product.name} image viewer`}>
        <header className="product-viewer-header">
          <div>
            <p className="product-viewer-eyebrow">NEFER JEWELRY</p>
            <h2>{product.name}</h2>
          </div>
          <button className="product-viewer-close" type="button" onClick={onClose} aria-label="Close image viewer">
            <XIcon size={22} />
          </button>
        </header>

        <div className="product-viewer-stage" onWheel={handleWheel} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          {images.length > 1 && (
            <button className="product-viewer-arrow previous" type="button" onClick={() => changeImage(activeIndex - 1)} aria-label="Previous image">‹</button>
          )}
          <div className="product-viewer-image-frame">
            <img
              key={activeIndex}
              src={getOptimizedProductImage(images[activeIndex], 1600, 'limit')}
              alt={`${product.name} image ${activeIndex + 1}`}
              className="product-viewer-image"
              draggable="false"
              style={{ transform: `scale(${zoom})` }}
              onClick={() => setZoom(currentZoom => currentZoom > 1 ? 1 : 1.6)}
            />
          </div>
          {images.length > 1 && (
            <button className="product-viewer-arrow next" type="button" onClick={() => changeImage(activeIndex + 1)} aria-label="Next image">›</button>
          )}
          <button className="product-viewer-zoom" type="button" onClick={() => setZoom(currentZoom => currentZoom > 1 ? 1 : 1.6)} aria-label="Zoom image">
            {zoom > 1 ? 'Reset zoom' : 'Zoom image'}
          </button>
        </div>

        <div className="product-viewer-footer">
          <span className="product-viewer-counter">{activeIndex + 1} / {images.length}</span>
          {images.length > 1 && (
            <div className="product-viewer-thumbnails" aria-label="Product images">
              {images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  className={`product-viewer-thumbnail ${activeIndex === index ? 'active' : ''}`}
                  onClick={() => changeImage(index)}
                  aria-label={`Show image ${index + 1}`}
                  aria-pressed={activeIndex === index}
                >
                  <img src={getOptimizedProductImage(image, 160, 'fill')} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>,
    document.body
  );
}