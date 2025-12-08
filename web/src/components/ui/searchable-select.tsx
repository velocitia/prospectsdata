'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Search, X } from 'lucide-react';

export interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; synonyms?: string[] }[];
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  className,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Filter options based on search query (checks both label and synonyms)
  // Also track which synonym matched for display
  const filteredOptionsWithMatch = React.useMemo(() => {
    if (!searchQuery) {
      return options.map((option) => ({ ...option, matchedSynonym: null as string | null }));
    }

    const query = searchQuery.toLowerCase();
    return options
      .map((option) => {
        // Check label first
        if (option.label.toLowerCase().includes(query)) {
          return { ...option, matchedSynonym: null as string | null };
        }
        // Check synonyms and find the matching one
        const matchedSynonym = option.synonyms?.find((syn) =>
          syn.toLowerCase().includes(query)
        );
        if (matchedSynonym) {
          return { ...option, matchedSynonym };
        }
        return null;
      })
      .filter(Boolean) as (typeof options[0] & { matchedSynonym: string | null })[];
  }, [options, searchQuery]);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-gray-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500',
          !selectedOption?.value && 'text-gray-500'
        )}
      >
        <span className="truncate">
          {selectedOption?.label || placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <X
              className="h-4 w-4 text-gray-400 hover:text-gray-600"
              onClick={handleClear}
            />
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 text-gray-400 transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
          {/* Search Input */}
          <div className="border-b border-gray-200 p-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-md border border-gray-300 py-1.5 pl-8 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-auto py-1">
            {filteredOptionsWithMatch.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                No results found
              </div>
            ) : (
              filteredOptionsWithMatch.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    'flex w-full items-center px-3 py-2 text-left text-sm hover:bg-gray-100',
                    option.value === value && 'bg-primary-50 text-primary-700'
                  )}
                >
                  {option.label}
                  {option.matchedSynonym && (
                    <span className="ml-1 text-gray-400">({option.matchedSynonym})</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
