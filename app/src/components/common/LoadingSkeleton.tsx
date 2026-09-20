import React from 'react';

interface SkeletonProps {
  className?: string;
  theme?: 'light' | 'dark';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', theme = 'light' }) => {
  const bgClass = theme === 'light' ? 'bg-[#E2E0DA]/60' : 'bg-[#353530]/60';
  return (
    <div
      className={`animate-pulse rounded ${bgClass} ${className}`}
      aria-hidden="true"
    />
  );
};

export const ProductCardSkeleton: React.FC<{ theme?: 'light' | 'dark' }> = ({ theme = 'light' }) => (
  <div className="bg-white border border-[#E2E0DA] rounded-[4px] p-4 flex flex-col justify-between">
    <div>
      <div className="w-full h-44 bg-[#F2F1ED] rounded-[2px] flex items-center justify-center mb-4 animate-pulse" />
      <Skeleton className="h-3 w-16 mb-2" theme={theme} />
      <Skeleton className="h-5 w-4/5 mb-2" theme={theme} />
      <Skeleton className="h-3 w-1/3 mb-2" theme={theme} />
      <Skeleton className="h-3 w-24 mb-4" theme={theme} />
    </div>
    <div className="pt-3 border-t border-[#E2E0DA]/50 flex items-center justify-between">
      <Skeleton className="h-5 w-20" theme={theme} />
      <Skeleton className="h-4 w-24" theme={theme} />
    </div>
  </div>
);

export const TableRowSkeleton: React.FC = () => (
  <tr className="border-b border-[#353530]/60 animate-pulse">
    <td className="py-3 px-4">
      <div className="h-4 w-48 bg-[#353530] rounded mb-1" />
      <div className="h-3 w-20 bg-[#20201D] rounded" />
    </td>
    <td className="py-3 px-4"><div className="h-4 w-16 bg-[#353530] rounded" /></td>
    <td className="py-3 px-4"><div className="h-4 w-12 bg-[#353530] rounded" /></td>
    <td className="py-3 px-4"><div className="h-4 w-20 bg-[#353530] rounded" /></td>
    <td className="py-3 px-4"><div className="h-4 w-16 bg-[#353530] rounded" /></td>
  </tr>
);
