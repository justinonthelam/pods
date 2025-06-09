import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { PodcastBreadcrumbs } from '@/components/Navigation/PodcastBreadcrumbs';
import { EpisodeCard } from '@/components/Episode/EpisodeCard';
import { Rating } from '@/components/Common/Rating';
import { Review } from '@/components/Common/Review';
import { Loading } from '@/components/Common/Loading';
import { Error } from '@/components/Common/Error';
import { PodcastDetails, Episode, ApiError } from '@/types/podcast';

export default function PodcastDetailsPage() {
  const router = useRouter();
  const { id } = router.query;

  const [podcast, setPodcast] = useState<PodcastDetails | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviews, setReviews] = useState<Array<{
    id: string;
    content: string;
    createdAt: string;
    user: {
      name: string | null;
      image: string | null;
    };
  }>>([]);

  useEffect(() => {
    if (!id) return;

    const fetchPodcastDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/podcasts/${id}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error((data as ApiError).message || 'Failed to fetch podcast details');
        }
        
        setPodcast(data.podcast);
        setEpisodes(data.episodes);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPodcastDetails();
  }, [id]);

  const handleFollowToggle = async () => {
    if (!podcast) return;
    
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/podcasts/${id}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ following: !podcast.isFollowing }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error((data as ApiError).message || 'Failed to update follow status');
      }

      setPodcast(prev => prev ? { ...prev, isFollowing: !prev.isFollowing } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update follow status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLikeToggle = async () => {
    if (!podcast) return;
    
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/podcasts/${id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ liked: !podcast.isLiked }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error((data as ApiError).message || 'Failed to update like status');
      }

      setPodcast(prev => prev ? { ...prev, isLiked: !prev.isLiked } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update like status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRatingChange = async (newRating: number) => {
    if (!podcast) return;
    
    try {
      setIsSubmittingRating(true);
      const response = await fetch(`/api/podcasts/${id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: newRating }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit rating');
      }

      setPodcast(prev => prev ? {
        ...prev,
        averageRating: data.averageRating,
        totalRatings: data.totalRatings,
      } : null);
      setUserRating(newRating);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit rating');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleReviewSubmit = async (content: string) => {
    if (!podcast) return;
    
    try {
      setIsSubmittingReview(true);
      const response = await fetch(`/api/podcasts/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit review');
      }

      setReviews(prev => [data.review, ...prev]);
      setPodcast(prev => prev ? {
        ...prev,
        totalReviews: data.totalReviews,
      } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Loading variant="skeleton" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Error message={error} severity="error" />
      </div>
    );
  }

  if (!podcast) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Error message="Podcast not found" severity="error" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PodcastBreadcrumbs
        items={[
          { label: 'Podcasts', href: '/podcasts' },
          { label: podcast.title }
        ]}
        className="mb-6"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Podcast Info */}
        <div className="md:col-span-1">
          <div className="sticky top-8">
            <div className="relative aspect-square w-full rounded-lg overflow-hidden shadow-lg">
              <Image
                src={podcast.imageUrl}
                alt={podcast.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
                priority
              />
            </div>

            <div className="mt-6 space-y-4">
              <button
                onClick={handleFollowToggle}
                disabled={isUpdating}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  podcast.isFollowing
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {podcast.isFollowing ? 'Following' : 'Follow'}
              </button>

              <button
                onClick={handleLikeToggle}
                disabled={isUpdating}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  podcast.isLiked
                    ? 'bg-red-100 hover:bg-red-200 text-red-600'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                {podcast.isLiked ? 'Liked' : 'Like'}
              </button>

              {podcast.website && (
                <a
                  href={podcast.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-2 px-4 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-800 text-center transition-colors"
                >
                  Visit Website
                </a>
              )}
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">About</h3>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-gray-500">Publisher</dt>
                  <dd>{podcast.publisher}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Language</dt>
                  <dd>{podcast.language}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Categories</dt>
                  <dd className="flex flex-wrap gap-2">
                    {podcast.categories.map(category => (
                      <span
                        key={category}
                        className="px-2 py-1 bg-gray-100 rounded-full text-xs"
                      >
                        {category}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2">
          <h1 className="text-3xl font-bold mb-4">{podcast.title}</h1>
          
          <div className="flex items-center gap-4 mb-6">
            <Rating
              value={userRating ?? podcast.averageRating}
              onChange={handleRatingChange}
              readonly={isSubmittingRating}
              size="lg"
            />
            <span className="text-gray-500">
              ({podcast.totalRatings} ratings)
            </span>
          </div>

          <p className="text-gray-700 mb-8">{podcast.description}</p>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-6">Episodes</h2>
            <div className="space-y-4">
              {episodes.map(episode => (
                <EpisodeCard
                  key={episode.id}
                  episodeData={episode}
                  podcastId={podcast.id}
                  podcastTitle={podcast.title}
                />
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-6">
              Reviews ({podcast.totalReviews})
            </h2>
            <div className="space-y-8">
              <Review
                onSubmit={handleReviewSubmit}
                isSubmitting={isSubmittingReview}
                placeholder="Share your thoughts about this podcast..."
              />
              
              {reviews.map(review => (
                <div key={review.id} className="border-t pt-6">
                  <div className="flex items-center gap-4 mb-3">
                    {review.user.image ? (
                      <Image
                        src={review.user.image}
                        alt={review.user.name || 'User'}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-500">
                          {(review.user.name || 'User')[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium">
                        {review.user.name || 'Anonymous User'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {review.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 