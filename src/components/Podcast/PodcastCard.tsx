import Image from 'next/image';
import Link from 'next/link';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { Rating } from '../Common/Rating';

interface PodcastCardProps {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  publisher: string;
  averageRating: number;
  totalRatings: number;
  isLiked: boolean;
  onRate?: (rating: number) => void;
  onLike?: () => void;
  userRating?: number;
}

export const PodcastCard = ({ 
  id, 
  title, 
  description, 
  imageUrl, 
  publisher,
  averageRating,
  totalRatings,
  isLiked,
  onRate,
  onLike,
  userRating
}: PodcastCardProps) => {
  const HeartIcon = isLiked ? HeartSolid : HeartOutline;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/podcast/${id}`} className="block">
        <div className="relative h-48 w-full">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
          />
        </div>
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <Link href={`/podcast/${id}`} className="block flex-1">
            <h3 className="text-lg font-semibold truncate">{title}</h3>
            <p className="text-sm text-gray-600 mb-2">{publisher}</p>
          </Link>
          <button 
            onClick={onLike}
            className="ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label={isLiked ? 'Unlike podcast' : 'Like podcast'}
          >
            <HeartIcon className={`w-6 h-6 ${isLiked ? 'text-red-500' : 'text-gray-400'}`} />
          </button>
        </div>
        
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{description}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rating 
              value={userRating ?? averageRating}
              onChange={onRate}
              readonly={!onRate}
              size="sm"
            />
            <span className="text-sm text-gray-500">
              ({totalRatings})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}; 