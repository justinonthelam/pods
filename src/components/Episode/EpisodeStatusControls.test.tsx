import { render, screen, fireEvent } from '@testing-library/react';
import { EpisodeStatusControls, EpisodeStatus } from './EpisodeStatusControls';

describe('EpisodeStatusControls', () => {
  const mockOnStatusChange = jest.fn();

  beforeEach(() => {
    mockOnStatusChange.mockClear();
  });

  it('renders both buttons with labels by default', () => {
    render(
      <EpisodeStatusControls
        status="not_started"
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText('Mark as Listened')).toBeInTheDocument();
    expect(screen.getByText('Listen Later')).toBeInTheDocument();
  });

  it('renders without labels when showLabels is false', () => {
    render(
      <EpisodeStatusControls
        status="not_started"
        onStatusChange={mockOnStatusChange}
        showLabels={false}
      />
    );

    expect(screen.queryByText('Mark as Listened')).not.toBeInTheDocument();
    expect(screen.queryByText('Listen Later')).not.toBeInTheDocument();
  });

  it('shows correct state for listened status', () => {
    render(
      <EpisodeStatusControls
        status="listened"
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText('Listened')).toBeInTheDocument();
    expect(screen.getByText('Listen Later')).toBeInTheDocument();
  });

  it('shows correct state for listen_later status', () => {
    render(
      <EpisodeStatusControls
        status="listen_later"
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText('Mark as Listened')).toBeInTheDocument();
    expect(screen.getByText('In Listen Later')).toBeInTheDocument();
  });

  it('calls onStatusChange with correct status when listened button is clicked', () => {
    render(
      <EpisodeStatusControls
        status="not_started"
        onStatusChange={mockOnStatusChange}
      />
    );

    fireEvent.click(screen.getByText('Mark as Listened'));
    expect(mockOnStatusChange).toHaveBeenCalledWith('listened');
  });

  it('calls onStatusChange with correct status when listen later button is clicked', () => {
    render(
      <EpisodeStatusControls
        status="not_started"
        onStatusChange={mockOnStatusChange}
      />
    );

    fireEvent.click(screen.getByText('Listen Later'));
    expect(mockOnStatusChange).toHaveBeenCalledWith('listen_later');
  });

  it('disables buttons when isUpdating is true', () => {
    render(
      <EpisodeStatusControls
        status="not_started"
        onStatusChange={mockOnStatusChange}
        isUpdating={true}
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('applies different sizes correctly', () => {
    const { rerender } = render(
      <EpisodeStatusControls
        status="not_started"
        onStatusChange={mockOnStatusChange}
        size="sm"
      />
    );

    const getIcons = () => screen.getAllByRole('img', { hidden: true });
    
    expect(getIcons()[0]).toHaveClass('w-4', 'h-4');

    rerender(
      <EpisodeStatusControls
        status="not_started"
        onStatusChange={mockOnStatusChange}
        size="lg"
      />
    );

    expect(getIcons()[0]).toHaveClass('w-8', 'h-8');
  });

  it('applies custom className', () => {
    render(
      <EpisodeStatusControls
        status="not_started"
        onStatusChange={mockOnStatusChange}
        className="custom-class"
      />
    );

    const container = screen.getByRole('group');
    expect(container).toHaveClass('custom-class');
  });
}); 