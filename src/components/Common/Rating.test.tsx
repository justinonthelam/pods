import { render, screen, fireEvent } from '@testing-library/react';
import { Rating } from './Rating';

describe('Rating', () => {
  it('renders with the correct number of stars', () => {
    render(<Rating value={3} />);
    const stars = screen.getAllByRole('button');
    expect(stars).toHaveLength(5);
  });

  it('displays the correct number of filled stars', () => {
    render(<Rating value={3} />);
    const stars = screen.getAllByRole('button');
    
    // First 3 stars should be filled (solid)
    stars.slice(0, 3).forEach(star => {
      expect(star.querySelector('svg')).toHaveClass('text-yellow-400');
    });
    
    // Last 2 stars should be outline
    stars.slice(3).forEach(star => {
      expect(star.querySelector('svg')).toHaveClass('text-yellow-400');
    });
  });

  it('calls onChange when clicking a star', () => {
    const handleChange = jest.fn();
    render(<Rating value={3} onChange={handleChange} />);
    
    const stars = screen.getAllByRole('button');
    fireEvent.click(stars[4]); // Click the 5th star
    
    expect(handleChange).toHaveBeenCalledWith(5);
  });

  it('shows numerical value when showValue is true', () => {
    render(<Rating value={3.5} showValue />);
    expect(screen.getByText('3.5')).toBeInTheDocument();
  });

  it('disables interaction when readonly is true', () => {
    const handleChange = jest.fn();
    render(<Rating value={3} onChange={handleChange} readonly />);
    
    const stars = screen.getAllByRole('button');
    fireEvent.click(stars[4]);
    
    expect(handleChange).not.toHaveBeenCalled();
    expect(stars[0]).toBeDisabled();
  });

  it('applies the correct size classes', () => {
    const { rerender } = render(<Rating value={3} size="sm" />);
    expect(screen.getAllByRole('button')[0].querySelector('svg')).toHaveClass('w-4', 'h-4');

    rerender(<Rating value={3} size="md" />);
    expect(screen.getAllByRole('button')[0].querySelector('svg')).toHaveClass('w-5', 'h-5');

    rerender(<Rating value={3} size="lg" />);
    expect(screen.getAllByRole('button')[0].querySelector('svg')).toHaveClass('w-6', 'h-6');
  });
}); 