'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search, Building2, Briefcase, HardHat, MapPin, FolderKanban } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchSearchSuggestions, type SearchSuggestion } from '@/lib/queries';
import { cn } from '@/lib/utils';

interface SearchWithSuggestionsProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
  entityTypes?: ('company' | 'project' | 'area')[];
  entitySubtypes?: string[];
  className?: string;
  navigateOnSelect?: boolean;
}

const typeIcons: Record<string, React.ReactNode> = {
  developer: <Building2 className="h-4 w-4" />,
  contractor: <HardHat className="h-4 w-4" />,
  consultant: <Briefcase className="h-4 w-4" />,
  rera: <FolderKanban className="h-4 w-4" />,
  area: <MapPin className="h-4 w-4" />,
  synonym: <MapPin className="h-4 w-4" />,
};

const typeLabels: Record<string, string> = {
  developer: 'Developer',
  contractor: 'Contractor',
  consultant: 'Consultant',
  rera: 'Project',
  area: 'Area',
  synonym: 'Area',
};

export function SearchWithSuggestions({
  value,
  onChange,
  onSelect,
  placeholder = 'Search...',
  entityTypes,
  entitySubtypes,
  className,
  navigateOnSelect = true,
}: SearchWithSuggestionsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Debounce search query
  const [debouncedQuery, setDebouncedQuery] = React.useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(value);
    }, 200);
    return () => clearTimeout(timer);
  }, [value]);

  // Fetch suggestions
  const { data: suggestions = [] } = useQuery({
    queryKey: ['search-suggestions', debouncedQuery, entityTypes, entitySubtypes],
    queryFn: () => fetchSearchSuggestions(debouncedQuery, { entityTypes, entitySubtypes, limit: 8 }),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000,
  });

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setIsOpen(true);
        setHighlightedIndex(0);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      case 'Tab':
        // Autocomplete with first suggestion
        if (suggestions.length > 0 && highlightedIndex === -1) {
          e.preventDefault();
          onChange(suggestions[0].name);
        }
        break;
    }
  };

  const handleSelect = (suggestion: SearchSuggestion) => {
    onChange(suggestion.name);
    setIsOpen(false);
    setHighlightedIndex(-1);

    if (onSelect) {
      onSelect(suggestion);
    }

    if (navigateOnSelect) {
      router.push(suggestion.url);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleFocus = () => {
    if (value.length >= 2 && suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  const getIcon = (suggestion: SearchSuggestion) => {
    const key = suggestion.subtype || suggestion.type;
    return typeIcons[key] || <Search className="h-4 w-4" />;
  };

  const getLabel = (suggestion: SearchSuggestion) => {
    const key = suggestion.subtype || suggestion.type;
    return typeLabels[key] || suggestion.type;
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className="flex h-9 w-full rounded-md border border-gray-300 bg-transparent pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500"
        />
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
          <ul className="max-h-80 overflow-auto py-1">
            {suggestions.map((suggestion, index) => (
              <li key={suggestion.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(suggestion)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    'flex w-full items-start gap-3 px-3 py-2 text-left text-sm',
                    index === highlightedIndex
                      ? 'bg-primary-50 text-primary-900'
                      : 'hover:bg-gray-50'
                  )}
                >
                  <span className="mt-0.5 text-secondary-400">
                    {getIcon(suggestion)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-secondary-900 truncate">
                      {suggestion.name}
                    </p>
                    <p className="text-xs text-secondary-500 truncate">
                      {getLabel(suggestion)}
                      {suggestion.secondaryText && ` • ${suggestion.secondaryText}`}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-gray-100 px-3 py-2 text-xs text-secondary-400">
            Press Tab to autocomplete, Enter to select
          </div>
        </div>
      )}
    </div>
  );
}
