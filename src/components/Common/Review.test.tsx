import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Review } from './Review';

describe('Review', () => {
  const mockSubmit = jest.fn();

  beforeEach(() => {
    mockSubmit.mockClear();
  });

  it('renders with default props', () => {
    render(<Review onSubmit={mockSubmit} />);
    
    expect(screen.getByPlaceholderText('Write your review...')).toBeInTheDocument();
    expect(screen.getByText('Select rating')).toBeInTheDocument();
    expect(screen.getByText('Submit Review')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(<Review onSubmit={mockSubmit} placeholder="Custom placeholder" />);
    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  it('shows character count', () => {
    render(<Review onSubmit={mockSubmit} />);
    const textarea = screen.getByRole('textbox');
    
    fireEvent.change(textarea, { target: { value: 'Test review' } });
    expect(screen.getByText('11/1000')).toBeInTheDocument();
  });

  it('shows error when content is too short', async () => {
    render(<Review onSubmit={mockSubmit} minLength={10} />);
    const textarea = screen.getByRole('textbox');
    
    fireEvent.change(textarea, { target: { value: 'Short' } });
    fireEvent.submit(screen.getByRole('form'));
    
    expect(await screen.findByText('Review must be at least 10 characters')).toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('shows error when content exceeds maxLength', () => {
    render(<Review onSubmit={mockSubmit} maxLength={10} />);
    const textarea = screen.getByRole('textbox');
    
    fireEvent.change(textarea, { target: { value: 'This is a very long review' } });
    
    expect(screen.getByText('Review cannot exceed 10 characters')).toBeInTheDocument();
  });

  it('shows error when no rating is provided', () => {
    render(<Review onSubmit={mockSubmit} />);
    const textarea = screen.getByRole('textbox');
    
    fireEvent.change(textarea, { target: { value: 'This is a valid review length' } });
    fireEvent.submit(screen.getByRole('form'));
    
    expect(screen.getByText('Please provide a rating')).toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with valid review data', async () => {
    render(<Review onSubmit={mockSubmit} />);
    
    // Set rating
    const stars = screen.getAllByRole('button').slice(0, 5);
    fireEvent.click(stars[4]); // 5-star rating
    
    // Set content
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'This is a valid review with sufficient length.' } });
    
    // Submit form
    fireEvent.submit(screen.getByRole('form'));
    
    expect(mockSubmit).toHaveBeenCalledWith({
      rating: 5,
      content: 'This is a valid review with sufficient length.'
    });
  });

  it('disables submit button when isSubmitting is true', () => {
    render(<Review onSubmit={mockSubmit} isSubmitting />);
    
    expect(screen.getByText('Submitting...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submitting...' })).toBeDisabled();
  });

  it('renders cancel button when onCancel is provided', () => {
    const handleCancel = jest.fn();
    render(<Review onSubmit={mockSubmit} onCancel={handleCancel} />);
    
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    expect(cancelButton).toBeInTheDocument();
    
    fireEvent.click(cancelButton);
    expect(handleCancel).toHaveBeenCalled();
  });

  it('initializes with provided rating and content', () => {
    render(
      <Review
        onSubmit={mockSubmit}
        initialRating={4}
        initialContent="Initial review content"
      />
    );
    
    expect(screen.getByText('4 stars')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('Initial review content');
  });

  it('disables textarea when isSubmitting is true', () => {
    render(<Review onSubmit={mockSubmit} isSubmitting />);
    
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('applies error styles to textarea when there is an error', async () => {
    render(<Review onSubmit={mockSubmit} minLength={10} />);
    const textarea = screen.getByRole('textbox');
    
    fireEvent.change(textarea, { target: { value: 'Short' } });
    fireEvent.submit(screen.getByRole('form'));
    
    await waitFor(() => {
      expect(textarea).toHaveClass('border-red-500');
    });
  });
}); 