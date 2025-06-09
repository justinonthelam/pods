import { render, screen } from '@testing-library/react';
import { PodcastBreadcrumbs } from './PodcastBreadcrumbs';

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('PodcastBreadcrumbs', () => {
  const mockItems = [
    { label: 'Podcasts', href: '/podcasts' },
    { label: 'Tech Talk', href: '/podcast/tech-talk' },
    { label: 'Episode 1' }
  ];

  it('renders all breadcrumb items', () => {
    render(<PodcastBreadcrumbs items={mockItems} />);
    
    expect(screen.getByLabelText('Home')).toBeInTheDocument();
    expect(screen.getByText('Podcasts')).toBeInTheDocument();
    expect(screen.getByText('Tech Talk')).toBeInTheDocument();
    expect(screen.getByText('Episode 1')).toBeInTheDocument();
  });

  it('renders the correct number of links', () => {
    render(<PodcastBreadcrumbs items={mockItems} />);
    
    const links = screen.getAllByRole('link');
    // Home + 2 linked items (last item is not a link)
    expect(links).toHaveLength(3);
  });

  it('marks the last item as current page', () => {
    render(<PodcastBreadcrumbs items={mockItems} />);
    
    const lastItem = screen.getByText('Episode 1');
    expect(lastItem).toHaveAttribute('aria-current', 'page');
  });

  it('applies custom className', () => {
    render(<PodcastBreadcrumbs items={mockItems} className="custom-class" />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('custom-class');
  });
}); 