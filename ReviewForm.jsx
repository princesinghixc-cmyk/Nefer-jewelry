/* ============================================================
   ReviewForm.jsx — Write / edit a product review
   ============================================================ */
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { StarRatingInput } from './StarRating.jsx';
import { ImageIcon, TrashIcon, XIcon } from './Icons.jsx';
import { MAX_REVIEW_IMAGES, MAX_REVIEW_TEXT_LENGTH, RATING_LABELS, validateReviewDraft } from '../utils/reviews.js';
import { getOptimizedProductImage } from '../utils/productImages.js';
import './ReviewForm.css';

export default function ReviewForm({
  product,
  initialReview = null,
  onClose,
  onSubmit,
  onDelete,
  submitting = false,
  submitError = '',
  uploadImage,
  verifiedPurchase = false,
}) {
  const isEditing = Boolean(initialReview);
  const [rating, setRating] = useState(initialReview?.rating || 0);
  const [text, setText] = useState(initialReview?.text || '');
  const [images, setImages] = useState(
    Array.isArray(initialReview?.images) ? initialReview.images.filter(Boolean) : []
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [formError, setFormError] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !submitting) onClose?.();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, submitting]);

  const handleFiles = async (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    if (!selected.length) return;

    const remaining = MAX_REVIEW_IMAGES - images.length;
    if (remaining <= 0) {
      setUploadError(`You can attach up to ${MAX_REVIEW_IMAGES} photos.`);
      return;
    }

    setUploading(true);
    setUploadError('');
    const queued = selected.slice(0, remaining);
    if (selected.length > remaining) {
      setUploadError(`Only ${remaining} more photo${remaining === 1 ? '' : 's'} could be attached (maximum ${MAX_REVIEW_IMAGES}).`);
    }

    try {
      const uploaded = await Promise.all(queued.map(file => uploadImage(file)));
      setImages(current => [...current, ...uploaded].slice(0, MAX_REVIEW_IMAGES));
    } catch (error) {
      console.error('Unable to upload review photo:', error);
      setUploadError(error?.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setImages(current => current.filter((_, imageIndex) => imageIndex !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateReviewDraft({ rating, text, images });
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError('');
    try {
      await onSubmit({ rating, text, images, verifiedPurchase });
    } catch {
      /* The hook already surfaced submitError; keep the form open. */
    }
  };

  const errorMessage = formError || submitError;
  const remainingSlots = MAX_REVIEW_IMAGES - images.length;

  return createPortal(
    <div className="review-form-overlay" onMouseDown={event => event.target === event.currentTarget && !submitting && onClose?.()}>
      <section className="review-form" role="dialog" aria-modal="true" aria-labelledby="review-form-title">
        <header className="review-form-header">
          <div>
            <p className="review-form-eyebrow">NEFER JEWELRY</p>
            <h3 id="review-form-title">{isEditing ? 'Edit your review' : 'Write a review'}</h3>
            <p className="review-form-product">{product?.name}</p>
          </div>
          <button
            type="button"
            className="review-form-close"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close review form"
          >
            <XIcon size={20} />
          </button>
        </header>

        <form className="review-form-body" onSubmit={handleSubmit}>
          <div className="review-form-field">
            <span className="review-form-label">Your rating *</span>
            <div className="review-form-rating-row">
              <StarRatingInput value={rating} onChange={setRating} disabled={submitting} />
              {rating > 0 && <span className="review-form-rating-label">{RATING_LABELS[rating]}</span>}
            </div>
          </div>

          <div className="review-form-field">
            <label className="review-form-label" htmlFor="review-text">Your review *</label>
            <textarea
              id="review-text"
              className="input-field review-form-textarea"
              value={text}
              onChange={event => { setText(event.target.value); setFormError(''); }}
              placeholder="Share how the piece looks, feels and wears…"
              rows={5}
              maxLength={MAX_REVIEW_TEXT_LENGTH}
              disabled={submitting}
            />
            <span className="review-form-counter">
              {text.trim().length} / {MAX_REVIEW_TEXT_LENGTH}
            </span>
          </div>

          <div className="review-form-field">
            <span className="review-form-label">
              Add photos <span className="review-form-optional">(optional, up to {MAX_REVIEW_IMAGES})</span>
            </span>
            <label className={`review-form-upload ${remainingSlots <= 0 ? 'is-disabled' : ''}`}>
              <ImageIcon size={18} />
              <span>{uploading ? 'Uploading…' : remainingSlots > 0 ? 'Choose photos' : 'Photo limit reached'}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFiles}
                disabled={uploading || submitting || remainingSlots <= 0}
                hidden
              />
            </label>
            {uploadError && <p className="review-form-error" role="alert">{uploadError}</p>}
            {images.length > 0 && (
              <div className="review-form-thumbnails">
                {images.map((image, index) => (
                  <div className="review-form-thumb" key={image}>
                    <img src={getOptimizedProductImage(image, 200, 'fill')} alt={`Review photo ${index + 1}`} />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      disabled={submitting}
                      aria-label={`Remove photo ${index + 1}`}
                    >
                      <XIcon size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {errorMessage && <p className="review-form-error" role="alert">{errorMessage}</p>}

          <div className="review-form-actions">
            {isEditing && onDelete && (
              <button
                type="button"
                className="review-form-delete"
                onClick={() => (confirmingDelete ? onDelete() : setConfirmingDelete(true))}
                disabled={submitting}
              >
                <TrashIcon size={15} />
                {confirmingDelete ? 'Tap again to confirm' : 'Delete review'}
              </button>
            )}
            <button type="submit" className="btn btn-gold review-form-submit" disabled={submitting || uploading}>
              {submitting ? 'Submitting…' : isEditing ? 'Update review' : 'Submit review'}
            </button>
          </div>
        </form>
      </section>
    </div>,
    document.body
  );
}
