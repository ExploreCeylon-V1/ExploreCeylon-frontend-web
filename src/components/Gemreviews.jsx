import { useState, useEffect } from 'react';
import reviewsService from '../services/Reviewsservice';
import { getToken } from '../utils/authStorage';

const StarPicker = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onChange(star)}
        className={`text-2xl leading-none transition-colors duration-150 ${
          star <= value ? 'text-yellow-400' : 'text-gray-300'
        }`}
        aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
      >
        ★
      </button>
    ))}
  </div>
);

const ReviewItem = ({ review }) => {
  const date = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <div className="border-b border-gray-100 last:border-0 py-4">
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-gray-800 text-sm">
          {review.travelerName}
        </span>
        <span className="text-xs text-gray-400">{date}</span>
      </div>
      <div className="text-yellow-400 text-sm mb-1">
        {'★'.repeat(review.rating)}
        <span className="text-gray-300">{'★'.repeat(5 - review.rating)}</span>
      </div>
      {review.comment && (
        <p className="text-sm text-gray-600 leading-snug">{review.comment}</p>
      )}
    </div>
  );
};

/**
 * GemReviews
 * Displays reviews for a gem and lets logged-in travelers submit a new one.
 * Pass the gem object and a callback to refresh gem data (rating/reviewCount)
 * after a successful submission.
 */
const GemReviews = ({ gemId, onReviewAdded }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [travelerName, setTravelerName] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const isLoggedIn = Boolean(getToken());

  useEffect(() => {
    fetchReviews();
  }, [gemId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reviewsService.getReviewsForGem(gemId);
      setReviews(data || []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
      setError('Could not load reviews.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!rating) {
      setSubmitError('Please select a star rating.');
      return;
    }
    if (!travelerName.trim()) {
      setSubmitError('Please enter your name.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      await reviewsService.addReview(gemId, {
        travelerName: travelerName.trim(),
        rating,
        comment: comment.trim(),
      });

      setTravelerName('');
      setRating(0);
      setComment('');

      await fetchReviews();
      onReviewAdded?.();
    } catch (err) {
      console.error('Failed to submit review:', err);
      setSubmitError(
        err.response?.data?.message || 'Could not submit your review. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 sm:p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        Traveler Reviews {reviews.length > 0 && `(${reviews.length})`}
      </h3>

      {/* Submission form */}
      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="mb-6 border border-gray-100 rounded-lg p-4">
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your name
            </label>
            <input
              type="text"
              value={travelerName}
              onChange={(e) => setTravelerName(e.target.value)}
              placeholder="e.g. Nadeesha P."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-2 focus:outline-[#2D6A4F] focus:outline-offset-1"
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your rating
            </label>
            <StarPicker value={rating} onChange={setRating} />
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your review (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share tips for other travelers..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-2 focus:outline-[#2D6A4F] focus:outline-offset-1"
            />
          </div>

          {submitError && (
            <p className="text-sm text-red-600 mb-3">{submitError}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-60 text-white font-semibold text-sm rounded-lg px-5 py-2.5 transition-colors duration-150"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      ) : (
        <div className="mb-6 border border-gray-100 rounded-lg p-4 text-sm text-gray-600">
          Please{' '}
          <a href="/login" className="text-[#2D6A4F] font-semibold underline">
            log in
          </a>{' '}
          to leave a review.
        </div>
      )}

      {/* Review list */}
      {loading && (
        <p className="text-sm text-gray-500 text-center py-6">
          Loading reviews...
        </p>
      )}

      {!loading && error && (
        <p className="text-sm text-red-600 text-center py-6">{error}</p>
      )}

      {!loading && !error && reviews.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-6">
          No reviews yet. Be the first to share your experience!
        </p>
      )}

      {!loading && !error && reviews.length > 0 && (
        <div>
          {reviews.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
};

export default GemReviews;