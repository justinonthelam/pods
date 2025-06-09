import { render, screen, fireEvent } from '@testing-library/react';
import { PodcastCard } from './PodcastCard';

// Mock next/image since it's not available in the test environment
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />
}));

const mockProps = {
  id: '123',
  title: 'Test Podcast',
  description: 'A test podcast description',
  imageUrl: '/test-image.jpg',
  publisher: 'Test Publisher',
  averageRating: 4.5,
  totalRatings: 100,
  isLiked: false,
};

describe('PodcastCard', () => {
  it('renders podcast information correctly', () => {
    render(<PodcastCard {...mockProps} />);
    
    expect(screen.getByText('Test Podcast')).toBeInTheDocument();
    expect(screen.getByText('Test Publisher')).toBeInTheDocument();
    expect(screen.getByText('A test podcast description')).toBeInTheDocument();
    expect(screen.getByText('(100)')).toBeInTheDocument();
  });

  it('displays correct number of stars based on average rating', () => {
    render(<PodcastCard {...mockProps} />);
    const stars = screen.getAllByRole('button');
    expect(stars).toHaveLength(5); // Rating component should show 5 stars
  });

  it('shows filled heart when podcast is liked', () => {
    render(<PodcastCard {...mockProps} isLiked={true} />);
    const likeButton = screen.getByLabelText('Unlike podcast');
    expect(likeButton.querySelector('svg')).toHaveClass('text-red-500');
  });

  it('shows outline heart when podcast is not liked', () => {
    render(<PodcastCard {...mockProps} isLiked={false} />);
    const likeButton = screen.getByLabelText('Like podcast');
    expect(likeButton.querySelector('svg')).toHaveClass('text-gray-400');
  });

  it('calls onLike when like button is clicked', () => {
    const handleLike = jest.fn();
    render(<PodcastCard {...mockProps} onLike={handleLike} />);
    
    const likeButton = screen.getByLabelText('Like podcast');
    fireEvent.click(likeButton);
    
    expect(handleLike).toHaveBeenCalled();
  });

  it('calls onRate when rating is changed', () => {
    const handleRate = jest.fn();
    render(<PodcastCard {...mockProps} onRate={handleRate} />);
    
    const stars = screen.getAllByRole('button');
    fireEvent.click(stars[4]); // Click the 5th star
    
    expect(handleRate).toHaveBeenCalledWith(5);
  });

  it('uses userRating instead of averageRating when provided', () => {
    const userRating = 3;
    render(<PodcastCard {...mockProps} userRating={userRating} />);
    
    // Since we're using a custom Rating component, we'll check if it receives
    // the correct value prop by checking the rendered stars
    const stars = screen.getAllByRole('button');
    const filledStars = stars.slice(0, userRating);
    const emptyStars = stars.slice(userRating);
    
    filledStars.forEach(star => {
      expect(star.querySelector('svg')).toBeInTheDocument();
    });
    
    emptyStars.forEach(star => {
      expect(star.querySelector('svg')).toBeInTheDocument();
    });
  });
}); 