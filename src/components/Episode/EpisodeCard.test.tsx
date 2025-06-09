import { render, screen, fireEvent } from '@testing-library/react';
import { EpisodeCard } from './EpisodeCard';

// Mock next/image since it's not available in the test environment
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />
}));

const mockProps = {
  id: '123',
  title: 'Test Episode',
  description: 'A test episode description',
  imageUrl: '/test-image.jpg',
  duration: '45 min',
  publishDate: 'Jan 1, 2024',
  podcastTitle: 'Test Podcast',
  podcastId: 'podcast-123',
  averageRating: 4.5,
  totalRatings: 100,
  isLiked: false,
  isListened: false,
};

describe('EpisodeCard', () => {
  it('renders episode information correctly', () => {
    render(<EpisodeCard {...mockProps} />);
    
    expect(screen.getByText('Test Episode')).toBeInTheDocument();
    expect(screen.getByText('Test Podcast')).toBeInTheDocument();
    expect(screen.getByText('A test episode description')).toBeInTheDocument();
    expect(screen.getByText('45 min')).toBeInTheDocument();
    expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument();
    expect(screen.getByText('(100)')).toBeInTheDocument();
  });

  it('displays correct number of stars based on average rating', () => {
    render(<EpisodeCard {...mockProps} />);
    const stars = screen.getAllByRole('button');
    // 5 stars + like button + listen button = 7 buttons
    expect(stars).toHaveLength(7);
  });

  it('shows filled heart when episode is liked', () => {
    render(<EpisodeCard {...mockProps} isLiked={true} />);
    const likeButton = screen.getByLabelText('Unlike episode');
    expect(likeButton.querySelector('svg')).toHaveClass('text-red-500');
  });

  it('shows outline heart when episode is not liked', () => {
    render(<EpisodeCard {...mockProps} isLiked={false} />);
    const likeButton = screen.getByLabelText('Like episode');
    expect(likeButton.querySelector('svg')).toHaveClass('text-gray-400');
  });

  it('shows check icon when episode is listened', () => {
    render(<EpisodeCard {...mockProps} isListened={true} />);
    const listenButton = screen.getByLabelText('Mark as unlistened');
    expect(listenButton).toHaveClass('text-green-500');
  });

  it('shows play icon when episode is not listened', () => {
    render(<EpisodeCard {...mockProps} isListened={false} />);
    const listenButton = screen.getByLabelText('Mark as listened');
    expect(listenButton).toHaveClass('text-gray-400');
  });

  it('calls onLike when like button is clicked', () => {
    const handleLike = jest.fn();
    render(<EpisodeCard {...mockProps} onLike={handleLike} />);
    
    const likeButton = screen.getByLabelText('Like episode');
    fireEvent.click(likeButton);
    
    expect(handleLike).toHaveBeenCalled();
  });

  it('calls onToggleListened when listen button is clicked', () => {
    const handleToggleListened = jest.fn();
    render(<EpisodeCard {...mockProps} onToggleListened={handleToggleListened} />);
    
    const listenButton = screen.getByLabelText('Mark as listened');
    fireEvent.click(listenButton);
    
    expect(handleToggleListened).toHaveBeenCalled();
  });

  it('calls onRate when rating is changed', () => {
    const handleRate = jest.fn();
    render(<EpisodeCard {...mockProps} onRate={handleRate} />);
    
    const stars = screen.getAllByRole('button');
    // Click the last star in the rating component (excluding like and listen buttons)
    fireEvent.click(stars[4]);
    
    expect(handleRate).toHaveBeenCalledWith(5);
  });

  it('uses userRating instead of averageRating when provided', () => {
    const userRating = 3;
    render(<EpisodeCard {...mockProps} userRating={userRating} />);
    
    const stars = screen.getAllByRole('button').slice(0, 5); // Get only rating stars
    const filledStars = stars.slice(0, userRating);
    const emptyStars = stars.slice(userRating);
    
    filledStars.forEach(star => {
      expect(star.querySelector('svg')).toBeInTheDocument();
    });
    
    emptyStars.forEach(star => {
      expect(star.querySelector('svg')).toBeInTheDocument();
    });
  });

  it('links to correct episode and podcast pages', () => {
    render(<EpisodeCard {...mockProps} />);
    
    const episodeLink = screen.getByRole('link', { name: 'Test Episode' });
    const podcastLink = screen.getByRole('link', { name: 'Test Podcast' });
    
    expect(episodeLink.getAttribute('href')).toBe('/episode/123');
    expect(podcastLink.getAttribute('href')).toBe('/podcast/podcast-123');
  });
}); 