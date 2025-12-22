/**
 * SearchInterface Component
 * Advanced search form with text input, filters, and real-time search with debouncing
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { SearchFilters } from '@/services/search.service';
import { searchEngine } from '@/services/search.service';

export interface SearchInterfaceProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: SearchFilters) => void;
  onSortChange: (sort: string) => void;
  placeholder?: string;
  showAdvancedFilters?: boolean;
  directoryType: 'guides' | 'hotels';
}

export default function SearchInterface({
  onSearch,
  onFilterChange,
  onSortChange,
  placeholder = 'Search...',
  showAdvancedFilters = true,
  directoryType
}: SearchInterfaceProps) {
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Debounced search handler
  const handleSearchChange = useCallback((value: string) => {
    setSearchText(value);
    
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer for debounced search
    const timer = setTimeout(() => {
      onSearch(value);
      
      // Fetch suggestions if text is long enough
      if (value.trim().length >= 2) {
        fetchSuggestions(value);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // 300ms debounce delay

    setDebounceTimer(timer);
  }, [onSearch, debounceTimer]);

  // Fetch search suggestions
  const fetchSuggestions = async (query: string) => {
    try {
      const response = await searchEngine.getSuggestions(query);
      if (response.success && response.data) {
        setSuggestions(response.data);
        setShowSuggestions(response.data.length > 0);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: string) => {
    setSearchText(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchText('');
    onSearch('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return (
    <div className="relative">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={searchText}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            // Delay hiding suggestions to allow click events
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          className="pl-10 pr-10"
        />
        {searchText && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-2 text-left hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2">
                <Search className="h-3 w-3 text-muted-foreground" />
                <span>{suggestion}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
