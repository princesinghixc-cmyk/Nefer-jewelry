/* ============================================================
   ReviewsSection.jsx — Ratings, reviews and write-a-review flow
   ============================================================ */
import React, { useMemo, useState } from 'react';
import StarRating from './StarRating.jsx';
import ReviewForm from './ReviewForm.jsx';
import ProductImageViewer from './ProductImageViewer.jsx';
import { CheckCircleIcon, EditIcon, ImageIcon, ShieldIcon, TrashIcon } from './Icons.jsx';
import { RATING_LABELS, RATING_VALUES } from '../utils/reviews.js';
import { formatDate, getInitials } from '../utils/format.js';
import { getOptimizedProductImage } from '../utils/productImages.js';
import './ReviewsSection.css';

const INITIAL_VISIBLE_REVIEWS = 4;
const REVIEWS_PAGE_SIZE = 4;

function ReviewerAvatar({ name, photo }) {
  const [failed, setFailed] = useState(false);
  if (photo && !failed) {
    return (
      <img
        className="reviewer-avatar"
        src={photo}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }
  return <span className="reviewer-avatar reviewer-avatar--initials">{getInitials(name)}</span>;
}

function RatingBreakdown({ stats, activeStars, onSelectStars }) {
  return (
    <div className="rating-breakdown">
      <div className="rating-breakdown-head">
        <span>Rating breakdown</span>
        {activeStars ? (
          <button type="button" className="rating-breakdown-clear" onClick={() => onSelectStars(0)}>
            Clear filter
          </button>
        ) : null}
      </div>
      <ul className="rating-breakdown-list">
        {RATING_VALUES.map(stars => {
          const entry = stats.distribution.find(item => item.stars === stars);
          const count = entry?.count || 0;
          const percent = entry?.percent || 0;
          const isActive = activeStars === stars;
          return (
            <li key={stars}>
              <button
                type="button"
                className={`rating-breakdown-row ${isActive ? 'is-active' : ''}`}
                onClick={() => onSelectStars(isActive ? 0 : stars)}
                disabled={count === 0}
                aria-pressed={isActive}
                aria-label={`${stars} star reviews: ${count}`}
              >
                <span className="rating-breakdown-label">
                  {stars}
                  <span aria-hidden="true">★</span>
                </span>
                <span className="rating-breakdown-track">
                  <span className="rating-breakdown-fill" style={{ width: `${percent}%` }} />
                </span>
                <span className="rating-breakdown-count">{count}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ReviewCard({ review, isOwn, isAdmin, onEdit, onDelete, onToggleHidden, onOpenPhoto }) {
  const photos = Array.isArray(review.images) ? review.images.filter(Boolean) : [];
  const rating = Math.max(1, Math.min(5, Math.round(Number(review.rating) || 0)));

  return (
    <article className={`review-card ${review.hidden ? 'is-hidden' : ''} ${isOwn ? 'is-own' : ''}`}>
      <header className="review-card-head">
        <ReviewerAvatar name={review.userName} photo={review.userPhoto} />
        <div className="review-card-meta">
          <span className="review-card-name">
            {review.userName || 'NEFER Customer'}
            {isOwn && <span className="review-card-you">You</span>}
          </span>
          {review.verifiedPurchase && (
            <span className="review-card-verified">
              <CheckCircleIcon size={13} /> Verified purchase
            </span>
          )}
        </div>
        <span className="review-card-date">{formatDate(review.createdAt)}</span>
      </header>

      <div className="review-card-rating">
        <StarRating value={rating} size={15} />
        <span className="review-card-rating-label">{RATING_LABELS[rating]}</span>
        {review.hidden && <span className="review-card-hidden-badge">Hidden from shoppers</span>}
      </div>

      <p className="review-card-text">{review.text}</p>

      {photos.length > 0 && (
        <div className="review-card-photos">
          {photos.map((photo, index) => (
            <button
              key={photo}
              type="button"
              className="review-card-photo"
              onClick={() => onOpenPhoto(photos, index)}
              aria-label={`Open review photo ${index + 1}`}
            >
              <img src={getOptimizedProductImage(photo, 240, 'fill')} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {(isOwn || isAdmin) && (
        <footer className="review-card-actions">
          {isOwn && (
            <button type="button" className="review-card-action" onClick={() => onEdit(review)}>
              <EditIcon size={14} /> Edit
            </button>
          )}
          {isAdmin && (
            <button
              type="button"
              className="review-card-action"
              onClick={() => onToggleHidden(review, !review.hidden)}
            >
              <ShieldIcon size={14} /> {review.hidden ? 'Unhide' : 'Hide'}
            </button>
          )}
          <button type="button" className="review-card-action is-danger" onClick={() => onDelete(review)}>
            <TrashIcon size={14} /> Delete
          </button>
        </footer>
      )}
    </article>
  );
}
export default function ReviewsSection({
  product,
  reviews = [],
  stats,
  userReview = null,
  loading = false,
  loadError = '',
  submitting = false,
  submitError = '',
  onSubmitReview,
  onEditReview,
  onDeleteReview,
  onModerateReview,
  canReview = true,
  verifiedPurchase = false,
  currentUser = null,
  isAdmin = false,
  uploadImage,
  onRequireLogin,
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [activeStars, setActiveStars] = useState(0);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_REVIEWS);
  const [pendingDeleteId, setPendingDeleteId] = useState('');
  const [actionError, setActionError] = useState('');
  const [photoViewer, setPhotoViewer] = useState(null);

  const safeStats = stats || { count: 0, average: 0, roundedAverage: 0, distribution: [] };

  const filteredReviews = useMemo(
    () => (activeStars ? reviews.filter(review => Math.round(Number(review.rating)) === activeStars) : reviews),
    [reviews, activeStars]
  );

  const shownReviews = filteredReviews.slice(0, visibleCount);
  const hasMoreReviews = filteredReviews.length > shownReviews.length;

  const handleSelectStars = (stars) => {
    setActiveStars(stars);
    setVisibleCount(INITIAL_VISIBLE_REVIEWS);
    setPendingDeleteId('');
  };

  const openWriteForm = () => {
    if (!currentUser) {
      onRequireLogin?.();
      return;
    }
    setEditingReview(null);
    setActionError('');
    setFormOpen(true);
  };

  const openEditForm = (review) => {
    setEditingReview(review);
    setActionError('');
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingReview(null);
  };

  const handleFormSubmit = async (payload) => {
    if (editingReview) {
      await onEditReview({ userId: editingReview.userId || editingReview.id, ...payload });
    } else {
      await onSubmitReview(payload);
    }
    closeForm();
  };

  const handleDelete = async (review) => {
    const reviewId = review.userId || review.id;
    if (pendingDeleteId !== reviewId) {
      setPendingDeleteId(reviewId);
      return;
    }
    setPendingDeleteId('');
    setActionError('');
    try {
      await onDeleteReview(reviewId);
    } catch (error) {
      setActionError(error?.message || 'Failed to delete the review. Please try again.');
    }
  };

  const handleToggleHidden = async (review, hidden) => {
    setActionError('');
    try {
      await onModerateReview(review.userId || review.id, hidden);
    } catch (error) {
      setActionError(error?.message || 'Failed to update the review. Please try again.');
    }
  };

  const writeCta = () => {
    if (!currentUser) {
      return (
        <button type="button" className="btn btn-gold reviews-cta-btn" onClick={openWriteForm}>
          Sign in to review
        </button>
      );
    }
    if (userReview) {
      return (
        <div className="reviews-own-state">
          <p className="reviews-own-note">You have already reviewed this product.</p>
          <button type="button" className="btn btn-outline reviews-cta-btn" onClick={() => openEditForm(userReview)}>
            <EditIcon size={15} /> Edit your review
          </button>
        </div>
      );
    }
    if (!canReview) {
      return (
        <p className="reviews-locked-note">
          Only customers who have purchased this piece can write a review.
        </p>
      );
    }
    return (
      <button type="button" className="btn btn-gold reviews-cta-btn" onClick={openWriteForm}>
        Write a review
      </button>
    );
  };

  return (
    <section className="reviews-section" id="product-reviews" aria-label="Ratings and reviews">
      <header className="reviews-header">
        <h2 className="reviews-title">Ratings & Reviews</h2>
        {safeStats.count > 0 && (
          <span className="reviews-header-count">
            {safeStats.count} {safeStats.count === 1 ? 'review' : 'reviews'}
          </span>
        )}
      </header>

      <div className="reviews-summary">
        <div className="reviews-score">
          <div className="reviews-score-value">
            {safeStats.count === 0 ? '—' : safeStats.roundedAverage.toFixed(1)}
            <span className="reviews-score-outof">/5</span>
          </div>
          <StarRating value={safeStats.average} size={17} />
          <p className="reviews-score-caption">
            {safeStats.count === 0
              ? 'No reviews yet'
              : `${safeStats.count} verified ${safeStats.count === 1 ? 'rating' : 'ratings'}`}
          </p>
        </div>

        <div className="reviews-summary-right">
          <RatingBreakdown stats={safeStats} activeStars={activeStars} onSelectStars={handleSelectStars} />
          <div className="reviews-cta">{writeCta()}</div>
          {verifiedPurchase && canReview && !userReview && (
            <p className="reviews-verified-note">
              <CheckCircleIcon size={14} /> You purchased this piece — your review will be marked verified.
            </p>
          )}
        </div>
      </div>

      {actionError && <p className="reviews-error" role="alert">{actionError}</p>}
      {loadError && <p className="reviews-error" role="alert">{loadError}</p>}

      <div className="reviews-list">
        {loading && reviews.length === 0 && (
          <div className="reviews-loading" role="status">
            <span className="reviews-spinner" aria-hidden="true" />
            Loading reviews…
          </div>
        )}

        {!loading && filteredReviews.length === 0 && (
          <div className="reviews-empty">
            {activeStars
              ? `No ${activeStars}-star reviews yet for this product.`
              : 'No reviews yet. Be the first to share your experience.'}
          </div>
        )}

        {shownReviews.map(review => {
          const reviewId = review.userId || review.id;
          const isOwn = Boolean(currentUser?.uid) && currentUser.uid === reviewId;
          return (
            <ReviewCard
              key={reviewId}
              review={review}
              isOwn={isOwn}
              isAdmin={isAdmin}
              onEdit={openEditForm}
              onDelete={handleDelete}
              onToggleHidden={handleToggleHidden}
              onOpenPhoto={(photos, index) => setPhotoViewer({ photos, index })}
            />
          );
        })}

        {hasMoreReviews && (
          <button
            type="button"
            className="reviews-more-btn"
            onClick={() => setVisibleCount(count => count + REVIEWS_PAGE_SIZE)}
          >
            Show more reviews ({filteredReviews.length - shownReviews.length} remaining)
          </button>
        )}
      </div>

      {formOpen && (
        <ReviewForm
          product={product}
          initialReview={editingReview}
          onClose={closeForm}
          onSubmit={handleFormSubmit}
          onDelete={editingReview ? () => onDeleteReview(editingReview.userId || editingReview.id).then(closeForm) : undefined}
          submitting={submitting}
          submitError={submitError}
          uploadImage={uploadImage}
          verifiedPurchase={verifiedPurchase}
        />
      )}

      {photoViewer && (
        <ProductImageViewer
          product={{ id: `${product?.id}-review-photos`, name: `Review photos — ${product?.name || ''}`.trim() }}
          images={photoViewer.photos}
          initialIndex={photoViewer.index}
          onClose={() => setPhotoViewer(null)}
        />
      )}
    </section>
  );
}
