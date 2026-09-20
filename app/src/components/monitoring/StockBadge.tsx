import React from 'react';
import { formatStock } from '../../utils/formatters';

interface StockBadgeProps {
  stock: number | null | undefined;
  theme?: 'light' | 'dark';
  className?: string;
}

export const StockBadge: React.FC<StockBadgeProps> = ({
  stock,
  theme = 'light',
  className = '',
}) => {
  const { label, isAvailable, count } = formatStock(stock);

  if (count === 0) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-medium ${
          theme === 'dark' ? 'text-[#EF4444]' : 'text-[#DC2626]'
        } ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" aria-hidden="true" />
        {label}
      </span>
    );
  }

  if (!isAvailable) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-medium ${
          theme === 'dark' ? 'text-[#73736C]' : 'text-[#8A8982]'
        } ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full border border-current" aria-hidden="true" />
        {label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
        theme === 'dark' ? 'text-[#22C55E]' : 'text-[#15803D]'
      } ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" aria-hidden="true" />
      {label}
    </span>
  );
};

export default StockBadge;
