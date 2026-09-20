import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { DashboardRow } from '../../types';
import { formatINR, formatRelativeTime } from '../../utils/formatters';
import { HealthBadge } from '../monitoring/HealthBadge';
import { StockBadge } from '../monitoring/StockBadge';

interface TrackedProductTableProps {
  rows: DashboardRow[];
}

export const TrackedProductTable: React.FC<TrackedProductTableProps> = ({ rows }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#181816] border border-[#353530] rounded-[4px] overflow-hidden font-mono text-xs">
      {/* Table Header for Desktop */}
      <div className="hidden md:grid grid-cols-12 gap-4 py-3 px-4 bg-[#20201D] border-b border-[#353530] text-[#73736C] uppercase text-[11px] tracking-wider font-semibold">
        <div className="col-span-5">Product</div>
        <div className="col-span-2">Price</div>
        <div className="col-span-2">Stock</div>
        <div className="col-span-2">Health</div>
        <div className="col-span-1 text-right">Next Scrape</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-[#353530]/60">
        {rows.map((row) => (
          <div
            key={row.tracked_id || row.product_id}
            onClick={() => navigate(`/products/${row.product_id}/monitor`, { state: { from: 'dashboard' } })}
            className="p-4 hover:bg-[#20201D]/70 transition-colors cursor-pointer group flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 md:items-center"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                navigate(`/products/${row.product_id}/monitor`, { state: { from: 'dashboard' } });
              }
            }}
          >
            {/* Product Column */}
            <div className="col-span-5 flex items-center justify-between md:justify-start gap-3">
              <div>
                <span className="text-[10px] text-[#73736C] uppercase tracking-wider block font-sans">
                  {row.brand || '—'} · {row.category || 'Product'}
                </span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/products/${row.product_id}`, { state: { from: 'dashboard' } });
                  }}
                  className="text-sm font-semibold text-[#F5F5F0] font-sans group-hover:text-[#F59E0B] hover:underline transition-colors line-clamp-1 cursor-pointer"
                  title="View product details"
                >
                  {row.name}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#73736C] md:hidden group-hover:text-[#F59E0B] transition-colors" />
            </div>

            {/* Price Column */}
            <div className="col-span-2 flex items-baseline gap-2 md:block">
              <span className="text-[11px] text-[#73736C] md:hidden">Price:</span>
              <span className="text-sm font-bold text-[#F5F5F0]">
                {formatINR(row.price)}
              </span>
              {row.mrp && row.price && row.mrp > row.price && (
                <span className="text-[10px] text-[#73736C] line-through ml-1.5 hidden lg:inline">
                  {formatINR(row.mrp)}
                </span>
              )}
            </div>

            {/* Stock Column */}
            <div className="col-span-2 flex items-center gap-2 md:block">
              <span className="text-[11px] text-[#73736C] md:hidden">Stock:</span>
              <StockBadge stock={row.stock} theme="dark" />
            </div>

            {/* Health Column */}
            <div className="col-span-2 flex items-center gap-2 md:block">
              <span className="text-[11px] text-[#73736C] md:hidden">Health:</span>
              <HealthBadge status={row.last_scrape_status} />
            </div>

            {/* Next Scrape Column */}
            <div className="col-span-1 text-left md:text-right flex items-center justify-between md:block">
              <span className="text-[11px] text-[#73736C] md:hidden">Next scrape:</span>
              <span className="text-[#A1A19A] text-[11px]">
                {formatRelativeTime(row.next_scrape_at)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrackedProductTable;
