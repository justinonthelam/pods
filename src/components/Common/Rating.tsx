import { useState } from 'react';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

export interface RatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

export const Rating = ({ 
  value, 
  onChange, 
  readonly = false,
  size = 'md',
  showValue = false 
}: RatingProps) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const starSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const displayRating = hoverRating ?? value;
  
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayRating;
          const StarComponent = isFilled ? StarSolid : StarOutline;
          
          return (
            <button
              key={star}
              type="button"
              disabled={readonly}
              className={`text-yellow-400 ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
              onClick={() => onChange?.(star)}
              onMouseEnter={() => !readonly && setHoverRating(star)}
              onMouseLeave={() => !readonly && setHoverRating(null)}
            >
              <StarComponent className={`${starSizes[size]} transition-colors`} />
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm text-gray-600 ml-1">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}; 