import { render, screen } from '@testing-library/react';
import { EpisodeNavigation } from './EpisodeNavigation';

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('EpisodeNavigation', () => {
  const mockPreviousEpisode = {
    id: 'prev-1',
    title: 'Previous Episode',
    seasonNumber: 1,
    episodeNumber: 1
  };

  const mockNextEpisode = {
    id: 'next-1',
    title: 'Next Episode',
    seasonNumber: 1,
    episodeNumber: 3
  };

  it('renders previous and next episode links when both are provided', () => {
    render(
      <EpisodeNavigation
        previousEpisode={mockPreviousEpisode}
        nextEpisode={mockNextEpisode}
      />
    );

    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText(/Previous Episode/)).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText(/Next Episode/)).toBeInTheDocument();
  });

  it('renders episode numbers when available', () => {
    render(
      <EpisodeNavigation
        previousEpisode={mockPreviousEpisode}
        nextEpisode={mockNextEpisode}
      />
    );

    expect(screen.getByText(/S1:E1/)).toBeInTheDocument();
    expect(screen.getByText(/S1:E3/)).toBeInTheDocument();
  });

  it('renders only next episode when previous is not provided', () => {
    render(<EpisodeNavigation nextEpisode={mockNextEpisode} />);

    expect(screen.queryByText('Previous')).not.toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('renders only previous episode when next is not provided', () => {
    render(<EpisodeNavigation previousEpisode={mockPreviousEpisode} />);

    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <EpisodeNavigation
        previousEpisode={mockPreviousEpisode}
        nextEpisode={mockNextEpisode}
        className="custom-class"
      />
    );

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('custom-class');
  });
}); 