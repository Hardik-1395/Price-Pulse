import React from 'react';

interface ProductSpecsProps {
  specs: Record<string, string | number> | null | undefined;
}

export const ProductSpecs: React.FC<ProductSpecsProps> = ({ specs }) => {
  const entries = Object.entries(specs || {});

  if (entries.length === 0) {
    return (
      <div className="py-6 text-sm text-[#8A8982] italic">
        No specifications available yet.
      </div>
    );
  }

  // Format camelCase or snake_case key to clean title
  const formatKey = (key: string) => {
    return key
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 py-4">
      {entries.map(([key, val]) => (
        <div key={key} className="flex flex-col border-b border-[#E2E0DA]/70 pb-2">
          <span className="text-xs text-[#8A8982] font-mono capitalize">
            {formatKey(key)}
          </span>
          <span className="text-sm font-medium text-[#171717] mt-0.5">
            {val !== null && val !== undefined ? String(val) : '—'}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ProductSpecs;
