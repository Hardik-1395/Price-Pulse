import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, X, SlidersHorizontal } from 'lucide-react';

interface ProductSearchProps {
  value: string;
  onChange: (query: string) => void;
  onCategoryChange?: (category: string) => void;
  selectedCategory?: string;
  categories?: string[];
  isSearching?: boolean;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({
  value,
  onChange,
  onCategoryChange,
  selectedCategory = 'All Categories',
  categories = [],
  isSearching = false,
}) => {
  const [internalValue, setInternalValue] = useState(value);

  // Debounce input changes
  useEffect(() => {
    const handler = setTimeout(() => {
      onChange(internalValue);
    }, 350);

    return () => clearTimeout(handler);
  }, [internalValue, onChange]);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  return (
    <div className="w-full space-y-3 mb-8">
      {/* Search Input Bar */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A8982]">
          <SearchIcon className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={internalValue}
          onChange={(e) => setInternalValue(e.target.value)}
          placeholder="Search products by name or keyword..."
          className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#E2E0DA] focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] rounded-[4px] text-sm text-[#171717] placeholder-[#8A8982] transition-colors outline-none"
        />
        {internalValue && (
          <button
            type="button"
            onClick={() => {
              setInternalValue('');
              onChange('');
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8A8982] hover:text-[#171717]"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Area (Section 15) */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-[#666660]">
        <div className="flex items-center gap-1 text-[#8A8982]">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        {/* Categories */}
        {categories.length > 0 && onCategoryChange ? (
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-[#E2E0DA] rounded-[4px] text-xs text-[#171717] hover:border-[#CFCBC3] focus:outline-none focus:ring-1 focus:ring-[#D97706] cursor-pointer"
          >
            <option value="All Categories">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        ) : (
          <span className="px-2.5 py-1 bg-[#F2F1ED] border border-[#E2E0DA] rounded-[4px] text-[11px] text-[#8A8982]">
            All Categories
          </span>
        )}

        {/* Future Ready Indicators without fake backend claims */}
        <span
          title="Brand filter coming in future release"
          className="px-2.5 py-1 bg-[#F2F1ED]/70 border border-[#E2E0DA] rounded-[4px] text-[11px] text-[#8A8982] cursor-not-allowed opacity-75"
        >
          Brand (All)
        </span>
        <span
          title="Sort filter coming in future release"
          className="px-2.5 py-1 bg-[#F2F1ED]/70 border border-[#E2E0DA] rounded-[4px] text-[11px] text-[#8A8982] cursor-not-allowed opacity-75"
        >
          Sort: Default
        </span>

        {isSearching && (
          <span className="ml-auto text-xs text-[#D97706] font-mono animate-pulse">
            Searching...
          </span>
        )}
      </div>
    </div>
  );
};

export default ProductSearch;
