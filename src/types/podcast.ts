export interface PodcastDetails {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  publisher: string;
  website?: string;
  language: string;
  categories: string[];
  averageRating: number;
  totalRatings: number;
  isFollowing: boolean;
  isLiked: boolean;
}

export interface Episode {
  id: string;
  title: string;
  description: string;
  duration: number;
  publishDate: string;
  imageUrl?: string;
  status: 'not_started' | 'listened' | 'listen_later';
}

export interface ApiError {
  message: string;
} 