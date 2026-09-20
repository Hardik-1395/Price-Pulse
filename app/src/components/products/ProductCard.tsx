import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import type { ProductSummary, DashboardRow } from '../../types';
import { formatINR } from '../../utils/formatters';
import { StockBadge } from '../monitoring/StockBadge';
import { getCategoryIcon } from '../../utils/categoryIcons';

interface ProductCardProps {
  product: ProductSummary;
  trackedRow?: DashboardRow;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, trackedRow }) => {
  const isTracked = Boolean(trackedRow);
  const price = trackedRow ? trackedRow.price : null;
  const stock = trackedRow ? trackedRow.stock : null;

  return (
    <div className="bg-white border border-[#E2E0DA] rounded-[4px] p-4 flex flex-col justify-between card-hover group h-full">
      <div>
        {/* Product Visual Area */}
        <div className="w-full h-44 bg-[#F2F1ED] rounded-[2px] flex items-center justify-center mb-4 text-[#8A8982] group-hover:text-[#666660] transition-colors relative overflow-hidden">
          {getCategoryIcon(product.category, 'w-12 h-12 stroke-[1.5] transition-transform duration-200 group-hover:scale-105')}

          {isTracked && (
            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm border border-[#E2E0DA] px-2 py-0.5 rounded-[2px] flex items-center gap-1 text-[10px] font-mono font-semibold text-[#15803D]">
              <Check className="w-3 h-3 text-[#15803D]" />
              <span>TRACKING ACTIVE</span>
            </div>
          )}
        </div>

        {/* Product Meta */}
        <div className="mb-4">
          <span className="text-[10px] uppercase font-bold tracking-[0.14em] text-[#8A8982] block mb-1">
            {product.category || 'General'}
          </span>
          <h3 className="text-[17px] font-semibold text-[#171717] leading-snug line-clamp-2 mb-1">
            {product.name}
          </h3>
          <p className="text-xs text-[#666660] mb-1">
            {product.brand || '—'}
          </p>
          <div className="text-[11px] font-mono text-[#8A8982]">
            SKU {product.slug ? product.slug.slice(0, 14).toUpperCase() : `PRD-${product.id}`}
          </div>
        </div>
      </div>

      {/* Pricing and Action Area */}
      <div className="pt-3 border-t border-[#E2E0DA] mt-auto">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <div className="text-[19px] font-bold text-[#171717] font-['Inter']">
              {formatINR(price)}
            </div>
            {trackedRow && trackedRow.mrp && trackedRow.price && trackedRow.mrp > trackedRow.price && (
              <div className="text-[11px] text-[#8A8982] line-through font-mono">
                MRP {formatINR(trackedRow.mrp)}
              </div>
            )}
          </div>
          <div>
            <StockBadge stock={stock} theme="light" />
          </div>
        </div>

        {isTracked ? (
          <Link
            to={`/products/${product.id}/monitor`}
            className="w-full flex items-center justify-between text-xs font-semibold py-2 px-2.5 bg-[#F2F1ED] text-[#171717] hover:bg-[#E2E0DA] rounded-[4px] transition-colors"
          >
            <span>VIEW MONITOR</span>
            <ArrowRight className="w-3.5 h-3.5 hover-arrow text-[#D97706]" />
          </Link>
        ) : (
          <Link
            to={`/products/${product.id}`}
            className="w-full flex items-center justify-between text-xs font-semibold py-2 px-2.5 border border-[#E2E0DA] hover:border-[#CFCBC3] text-[#171717] rounded-[4px] transition-colors"
          >
            <span>VIEW DETAILS</span>
            <ArrowRight className="w-3.5 h-3.5 hover-arrow text-[#666660]" />
          </Link>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
