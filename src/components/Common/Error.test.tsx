import { render, screen, fireEvent } from '@testing-library/react';
import { Error, ErrorBoundaryFallback } from './Error';

describe('Error', () => {
  it('renders error message', () => {
    render(<Error message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<Error title="Error Title" message="Error message" />);
    expect(screen.getByText('Error Title')).toBeInTheDocument();
  });

  it('renders retry button when onRetry is provided', () => {
    const handleRetry = jest.fn();
    render(<Error message="Error message" onRetry={handleRetry} />);
    
    const retryButton = screen.getByRole('button', { name: 'Try again' });
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(handleRetry).toHaveBeenCalled();
  });

  it('renders with error severity by default', () => {
    render(<Error message="Error message" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-red-50', 'border-red-400');
  });

  it('renders with warning severity', () => {
    render(<Error message="Warning message" severity="warning" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-yellow-50', 'border-yellow-400');
  });

  it('renders in fullscreen mode', () => {
    render(<Error message="Error message" fullScreen />);
    expect(screen.getByRole('alert').parentElement?.parentElement).toHaveClass('fixed inset-0');
  });

  it('applies custom className', () => {
    render(<Error message="Error message" className="custom-class" />);
    expect(screen.getByRole('alert')).toHaveClass('custom-class');
  });
});

describe('ErrorBoundaryFallback', () => {
  const testError = {
    name: 'TestError',
    message: 'Test error',
    stack: 'Test stack trace'
  } as Error;
  
  const resetErrorBoundary = jest.fn();

  it('renders error boundary fallback with error message', () => {
    render(
      <ErrorBoundaryFallback
        error={testError}
        resetErrorBoundary={resetErrorBoundary}
      />
    );
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('calls resetErrorBoundary when retry button is clicked', () => {
    render(
      <ErrorBoundaryFallback
        error={testError}
        resetErrorBoundary={resetErrorBoundary}
      />
    );
    
    const retryButton = screen.getByRole('button', { name: 'Try again' });
    fireEvent.click(retryButton);
    
    expect(resetErrorBoundary).toHaveBeenCalled();
  });

  it('renders in fullscreen mode', () => {
    render(
      <ErrorBoundaryFallback
        error={testError}
        resetErrorBoundary={resetErrorBoundary}
      />
    );
    expect(screen.getByRole('alert').parentElement?.parentElement).toHaveClass('fixed inset-0');
  });
}); 