import { render, screen, fireEvent, act } from '@testing-library/react';
import { SearchBar, SearchType, SearchSuggestion } from './SearchBar';

const mockSuggestions: SearchSuggestion[] = [
  {
    id: '1',
    title: 'Test Podcast',
    type: 'podcast',
    imageUrl: '/test-podcast.jpg'
  },
  {
    id: '2',
    title: 'Test Episode',
    type: 'episode',
    imageUrl: '/test-episode.jpg'
  }
];

describe('SearchBar', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('renders with default placeholder', () => {
    render(<SearchBar onSearch={() => {}} />);
    expect(screen.getByPlaceholderText('Search podcasts and episodes...')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(<SearchBar onSearch={() => {}} placeholder="Custom placeholder" />);
    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  it('calls onSearch with query and type when form is submitted', () => {
    const handleSearch = jest.fn();
    render(<SearchBar onSearch={handleSearch} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test query' } });
    
    const form = input.closest('form');
    fireEvent.submit(form!);
    
    expect(handleSearch).toHaveBeenCalledWith('test query', 'all');
  });

  it('updates search type when select value changes', () => {
    const handleSearch = jest.fn();
    render(<SearchBar onSearch={handleSearch} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'podcast' } });
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });
    
    const form = input.closest('form');
    fireEvent.submit(form!);
    
    expect(handleSearch).toHaveBeenCalledWith('test', 'podcast');
  });

  it('shows suggestions when input is focused and suggestions are provided', () => {
    render(
      <SearchBar
        onSearch={() => {}}
        suggestions={mockSuggestions}
      />
    );
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.focus(input);
    
    expect(screen.getByText('Test Podcast')).toBeInTheDocument();
    expect(screen.getByText('Test Episode')).toBeInTheDocument();
  });

  it('calls onSuggestionSelect when a suggestion is clicked', () => {
    const handleSuggestionSelect = jest.fn();
    render(
      <SearchBar
        onSearch={() => {}}
        suggestions={mockSuggestions}
        onSuggestionSelect={handleSuggestionSelect}
      />
    );
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.focus(input);
    
    fireEvent.click(screen.getByText('Test Podcast'));
    
    expect(handleSuggestionSelect).toHaveBeenCalledWith(mockSuggestions[0]);
  });

  it('shows loading state when isLoading is true', () => {
    render(
      <SearchBar
        onSearch={() => {}}
        isLoading={true}
      />
    );
    
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'test' } });
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('maintains search history in localStorage', () => {
    const handleSearch = jest.fn();
    const { rerender } = render(<SearchBar onSearch={handleSearch} />);
    
    const input = screen.getByRole('textbox');
    const form = input.closest('form')!;
    
    // Perform searches
    fireEvent.change(input, { target: { value: 'first search' } });
    fireEvent.submit(form);
    
    fireEvent.change(input, { target: { value: 'second search' } });
    fireEvent.submit(form);
    
    // Check localStorage
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    expect(history).toEqual(['second search', 'first search']);
    
    // Rerender component and check if history is loaded
    rerender(<SearchBar onSearch={handleSearch} />);
    fireEvent.focus(input);
    
    expect(screen.getByText('first search')).toBeInTheDocument();
    expect(screen.getByText('second search')).toBeInTheDocument();
  });

  it('clears input when clear button is clicked', () => {
    render(<SearchBar onSearch={() => {}} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test query' } });
    
    const clearButton = screen.getByLabelText('Clear search');
    fireEvent.click(clearButton);
    
    expect(input).toHaveValue('');
  });

  it('closes suggestions dropdown when clicking outside', () => {
    render(
      <SearchBar
        onSearch={() => {}}
        suggestions={mockSuggestions}
      />
    );
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.focus(input);
    
    expect(screen.getByText('Test Podcast')).toBeInTheDocument();
    
    // Click outside
    fireEvent.mouseDown(document.body);
    
    expect(screen.queryByText('Test Podcast')).not.toBeInTheDocument();
  });

  it('closes suggestions dropdown when Escape key is pressed', () => {
    render(
      <SearchBar
        onSearch={() => {}}
        suggestions={mockSuggestions}
      />
    );
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.focus(input);
    
    expect(screen.getByText('Test Podcast')).toBeInTheDocument();
    
    fireEvent.keyDown(input, { key: 'Escape' });
    
    expect(screen.queryByText('Test Podcast')).not.toBeInTheDocument();
  });
}); 