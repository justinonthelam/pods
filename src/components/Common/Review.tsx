import { useState, useEffect } from 'react';
import { Rating } from './Rating';

export interface ReviewProps {
  initialRating?: number;
  initialContent?: string;
  onSubmit: (review: { rating: number; content: string }) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  maxLength?: number;
  minLength?: number;
  placeholder?: string;
  autoFocus?: boolean;
}

export const Review = ({
  initialRating = 0,
  initialContent = '',
  onSubmit,
  onCancel,
  isSubmitting = false,
  maxLength = 1000,
  minLength = 10,
  placeholder = 'Write your review...',
  autoFocus = false
}: ReviewProps) => {
  const [rating, setRating] = useState(initialRating);
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (touched && content.length < minLength) {
      setError(`Review must be at least ${minLength} characters`);
    } else if (content.length > maxLength) {
      setError(`Review cannot exceed ${maxLength} characters`);
    } else {
      setError(null);
    }
  }, [content, minLength, maxLength, touched]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (!rating) {
      setError('Please provide a rating');
      return;
    }

    if (content.length < minLength) {
      setError(`Review must be at least ${minLength} characters`);
      return;
    }

    if (content.length > maxLength) {
      setError(`Review cannot exceed ${maxLength} characters`);
      return;
    }

    onSubmit({ rating, content });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2">
        <Rating
          value={rating}
          onChange={setRating}
          size="lg"
        />
        <span className="text-sm text-gray-500">
          {rating > 0 ? `${rating} stars` : 'Select rating'}
        </span>
      </div>

      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setTouched(true);
          }}
          placeholder={placeholder}
          rows={4}
          autoFocus={autoFocus}
          disabled={isSubmitting}
          className={`w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 ${
            error ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
          }`}
          aria-label="Review content"
        />
        <div className="absolute bottom-2 right-2 text-sm text-gray-500">
          {content.length}/{maxLength}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-500" role="alert">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || !!error}
          className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </form>
  );
}; 