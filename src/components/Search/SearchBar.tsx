import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { ClockIcon } from '@heroicons/react/24/outline';

export type SearchType = 'all' | 'podcast' | 'episode';

export interface SearchSuggestion {
  id: string;
  title: string;
  type: 'podcast' | 'episode';
  imageUrl?: string;
}

interface SearchBarProps {
  onSearch: (query: string, type: SearchType) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  suggestions?: SearchSuggestion[];
  isLoading?: boolean;
  placeholder?: string;
  initialSearchType?: SearchType;
}

export const SearchBar = ({
  onSearch,
  onSuggestionSelect,
  suggestions = [],
  isLoading = false,
  placeholder = 'Search podcasts and episodes...',
  initialSearchType = 'all'
}: SearchBarProps) => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>(initialSearchType);
  const [isFocused, setIsFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('searchHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    onSearch(query.trim(), searchType);
    addToSearchHistory(query.trim());
    setIsFocused(false);
  };

  const addToSearchHistory = (term: string) => {
    const newHistory = [term, ...searchHistory.filter(item => item !== term)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const clearSearch = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsFocused(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto relative">
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full pl-10 pr-24 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Search input"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-20 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
              aria-label="Clear search"
            >
              <XMarkIcon className="w-5 h-5 text-gray-400" />
            </button>
          )}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as SearchType)}
              className="text-sm border rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Search type"
            >
              <option value="all">All</option>
              <option value="podcast">Podcasts</option>
              <option value="episode">Episodes</option>
            </select>
          </div>
        </div>
      </form>

      {/* Suggestions and History Dropdown */}
      {isFocused && (query || searchHistory.length > 0) && (
        <div
          ref={suggestionsRef}
          className="absolute w-full mt-1 bg-white rounded-lg shadow-lg border max-h-96 overflow-y-auto z-50"
        >
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : (
            <>
              {/* Search Suggestions */}
              {query && suggestions.length > 0 && (
                <div className="py-2">
                  <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase">
                    Suggestions
                  </div>
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => {
                        onSuggestionSelect?.(suggestion);
                        setIsFocused(false);
                      }}
                      className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-left"
                    >
                      {suggestion.imageUrl && (
                        <img
                          src={suggestion.imageUrl}
                          alt=""
                          className="w-8 h-8 rounded"
                        />
                      )}
                      <div>
                        <div className="font-medium">{suggestion.title}</div>
                        <div className="text-sm text-gray-500 capitalize">
                          {suggestion.type}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Search History */}
              {searchHistory.length > 0 && (
                <div className="py-2 border-t first:border-t-0">
                  <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase">
                    Recent Searches
                  </div>
                  {searchHistory.map((term, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setQuery(term);
                        onSearch(term, searchType);
                        setIsFocused(false);
                      }}
                      className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-left"
                    >
                      <ClockIcon className="w-4 h-4 text-gray-400" />
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}; 