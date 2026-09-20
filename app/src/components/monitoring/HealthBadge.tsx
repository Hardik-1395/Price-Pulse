import React from 'react';

interface HealthBadgeProps {
  status: 'success' | 'failed' | 'structure_error' | null | undefined;
  className?: string;
}

export const HealthBadge: React.FC<HealthBadgeProps> = ({ status, className = '' }) => {
  if (status === 'success') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-medium text-[#22C55E] ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" aria-hidden="true" />
        Healthy
      </span>
    );
  }

  if (status === 'failed') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-medium text-[#EF4444] ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" aria-hidden="true" />
        Failed
      </span>
    );
  }

  if (status === 'structure_error') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-medium text-[#EAB308] ${className}`}>
        <span aria-hidden="true">⚠</span>
        Structure Changed
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-medium text-[#73736C] ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full border border-[#73736C]" aria-hidden="true" />
      Never Scraped
    </span>
  );
};

export default HealthBadge;
