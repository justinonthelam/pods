import { render, screen } from '@testing-library/react';
import { Loading } from './Loading';

describe('Loading', () => {
  describe('Spinner variant', () => {
    it('renders spinner with default size', () => {
      render(<Loading />);
      const spinner = screen.getByRole('generic');
      expect(spinner).toHaveClass('w-8 h-8'); // md size
    });

    it('renders spinner with custom size', () => {
      render(<Loading spinnerSize="lg" />);
      const spinner = screen.getByRole('generic');
      expect(spinner).toHaveClass('w-12 h-12');
    });

    it('renders loading text when provided', () => {
      render(<Loading text="Loading content..." />);
      expect(screen.getByText('Loading content...')).toBeInTheDocument();
    });

    it('renders in fullscreen mode', () => {
      render(<Loading fullScreen />);
      expect(screen.getByRole('generic')).toHaveClass('fixed inset-0');
    });
  });

  describe('Skeleton variant', () => {
    it('renders skeleton with default variant', () => {
      render(<Loading variant="skeleton" />);
      const skeleton = screen.getByRole('generic');
      expect(skeleton).toHaveClass('rounded-lg'); // rectangular variant
    });

    it('renders text skeleton', () => {
      render(<Loading variant="skeleton" skeletonVariant="text" />);
      const skeleton = screen.getByRole('generic');
      expect(skeleton).toHaveClass('rounded');
    });

    it('renders circular skeleton', () => {
      render(<Loading variant="skeleton" skeletonVariant="circular" />);
      const skeleton = screen.getByRole('generic');
      expect(skeleton).toHaveClass('rounded-full');
    });

    it('applies custom width and height', () => {
      render(
        <Loading
          variant="skeleton"
          skeletonWidth={200}
          skeletonHeight={100}
        />
      );
      const skeleton = screen.getByRole('generic');
      expect(skeleton).toHaveStyle({ width: '200px', height: '100px' });
    });

    it('applies custom className', () => {
      render(<Loading variant="skeleton" className="custom-class" />);
      const skeleton = screen.getByRole('generic');
      expect(skeleton).toHaveClass('custom-class');
    });
  });
}); 