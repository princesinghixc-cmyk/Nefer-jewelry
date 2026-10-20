/* ============================================================
   StarRating.jsx — Star rating display + input for NEFER Jewelry
   ============================================================ */
import React, { useState } from 'react';
import { StarIcon } from './Icons.jsx';
import './StarRating.css';

const STARS = [1, 2, 3, 4, 5];

const clampRating = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(5, numeric));
};

/**
 * Read-only star display. Supports fractional averages (4.3 renders as a
 * partially filled row) so the rating is always the real computed value.
 */
export default function StarRating({ value = 0, size = 16, className = '', showValue = false }) {
  const rating = clampRating(value);
  const percent = (rating / 5) * 100;

  return (
    <span
      className={`star-rating ${className}`.trim()}
      role="img"
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
    >
      <span className="star-rating-track" style={{ '--star-size': `${size}px` }} aria-hidden="true">
        {STARS.map(star => (
          <StarIcon key={star} size={size} className="star-rating-star star-rating-star--empty" />
        ))}
      </span>
      <span className="star-rating-fill" style={{ width: `${percent}%` }} aria-hidden="true">
        {STARS.map(star => (
          <StarIcon key={star} size={size} filled className="star-rating-star star-rating-star--filled" />
        ))}
      </span>
      {showValue && <span className="star-rating-value">{rating.toFixed(1)}</span>}
    </span>
  );
}

/** Interactive 1–5 star picker used by the review form. */
export function StarRatingInput({ value = 0, onChange, size = 30, disabled = false }) {
  const [hovered, setHovered] = useState(0);
  const rating = clampRating(value);
  const active = hovered || rating;

  return (
    <div className={`star-rating-input ${disabled ? 'is-disabled' : ''}`} role="radiogroup" aria-label="Your rating">
      {STARS.map(star => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={rating === star}
          aria-label={`${star} star${star === 1 ? '' : 's'}`}
          className={`star-rating-input-btn ${star <= active ? 'is-active' : ''}`}
          disabled={disabled}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onFocus={() => setHovered(star)}
          onBlur={() => setHovered(0)}
        >
          <StarIcon size={size} filled={star <= active} />
        </button>
      ))}
    </div>
  );
}
