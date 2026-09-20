import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Plus, Check, RefreshCw } from 'lucide-react';
import Header from '../components/layout/Header';
import ProductSpecs from '../components/products/ProductSpecs';
import StockBadge from '../components/monitoring/StockBadge';
import { Skeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/EmptyState';
import { getProduct, trackProduct } from '../api/products';
import { getDashboard } from '../api/dashboard';
import type { Product, DashboardRow } from '../types';
import { formatINR } from '../utils/formatters';
import { getCategoryIcon } from '../utils/categoryIcons';

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isFromDashboard = location.state?.from === 'dashboard';
  const productId = Number(id);

  const [product, setProduct] = useState<Product | null>(null);
  const [trackedRow, setTrackedRow] = useState<DashboardRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!productId || isNaN(productId)) {
      setError('Invalid product ID');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const [productData, dashboardRows] = await Promise.all([
        getProduct(productId),
        getDashboard().catch(() => [] as DashboardRow[]),
      ]);

      setProduct(productData);
      const matchingTracked = dashboardRows.find((r) => r.product_id === productId);
      setTrackedRow(matchingTracked || null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Product not found.');
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTrack = async () => {
    if (!product) return;
    try {
      setIsTracking(true);
      setTrackError(null);
      await trackProduct(product.id);
      // Redirect immediately to /products/:id/monitor
      navigate(`/products/${product.id}/monitor`);
    } catch (err: unknown) {
      setTrackError(err instanceof Error ? err.message : 'Failed to track product');
      setIsTracking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] text-[#171717] flex flex-col font-sans">
        <Header theme="light" />
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-4 w-32 mb-8" theme="light" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <Skeleton className="h-80 w-full rounded-[4px]" theme="light" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-24" theme="light" />
              <Skeleton className="h-8 w-3/4" theme="light" />
              <Skeleton className="h-4 w-1/2" theme="light" />
              <Skeleton className="h-8 w-1/3" theme="light" />
              <Skeleton className="h-10 w-44 mt-6" theme="light" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] text-[#171717] flex flex-col font-sans">
        <Header theme="light" />
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            to={isFromDashboard ? "/dashboard" : "/products"}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#666660] hover:text-[#171717] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {isFromDashboard ? 'Back to dashboard' : 'Back to products'}
          </Link>
          <ErrorState message={error || 'Product not found.'} onRetry={loadData} theme="light" />
        </main>
      </div>
    );
  }

  const isTracked = Boolean(trackedRow);
  const currentPrice = trackedRow?.price;
  const mrp = trackedRow?.mrp;
  const stock = trackedRow?.stock;
  const discountPct =
    mrp && currentPrice && mrp > currentPrice
      ? Math.round(((mrp - currentPrice) / mrp) * 100)
      : null;

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#171717] flex flex-col font-sans">
      <Header theme="light" />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            to={isFromDashboard ? "/dashboard" : "/products"}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#666660] hover:text-[#171717] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {isFromDashboard ? 'Back to dashboard' : 'Back to products'}
          </Link>
        </div>

        {/* Main Product Card */}
        <div className="bg-white border border-[#E2E0DA] rounded-[4px] p-6 sm:p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
            {/* Visual Area */}
            <div className="md:col-span-5 flex items-center justify-center bg-[#F2F1ED] rounded-[4px] min-h-[300px] text-[#8A8982]">
              {getCategoryIcon(product.category, 'w-24 h-24 stroke-[1.2]')}
            </div>

            {/* Information Area */}
            <div className="md:col-span-7 flex flex-col justify-between">
              <div>
                <span className="text-[11px] uppercase font-bold tracking-[0.14em] text-[#8A8982] block mb-1">
                  {product.category || 'General'}
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold font-['Inter'] text-[#171717] tracking-tight mb-2">
                  {product.name}
                </h1>
                <div className="text-sm text-[#666660] mb-2 flex items-center gap-2">
                  <span>{product.brand || '—'}</span>
                  <span>·</span>
                  <span>{product.category || 'Catalog item'}</span>
                </div>
                <div className="text-xs font-mono text-[#8A8982] mb-6">
                  SKU {product.sku || product.slug || `PRD-${product.id}`}
                </div>

                {/* Price & Stock Section */}
                <div className="mb-6 pb-6 border-b border-[#E2E0DA]">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-2xl sm:text-3xl font-bold font-['Inter'] text-[#171717]">
                      {formatINR(currentPrice)}
                    </span>
                    {mrp && currentPrice && mrp > currentPrice && (
                      <>
                        <span className="text-sm text-[#8A8982] line-through font-mono">
                          MRP {formatINR(mrp)}
                        </span>
                        {discountPct && (
                          <span className="text-xs font-bold text-[#D97706] bg-[#D97706]/10 px-1.5 py-0.5 rounded-[2px] font-mono">
                            -{discountPct}%
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  <div className="mt-2">
                    <StockBadge stock={stock} theme="light" />
                  </div>
                </div>
              </div>

              {/* Action Area */}
              <div>
                {trackError && (
                  <div className="mb-3 text-xs text-[#DC2626] font-medium">
                    {trackError}
                  </div>
                )}

                {isTracked ? (
                  <div className="flex items-center gap-4">
                    <Link
                      to={`/products/${product.id}/monitor`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F2F1ED] hover:bg-[#E2E0DA] border border-[#E2E0DA] text-[#171717] text-xs font-semibold rounded-[4px] transition-colors"
                    >
                      <span>VIEW MONITOR</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#D97706]" />
                    </Link>
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#15803D] font-medium">
                      <Check className="w-3.5 h-3.5" />
                      Tracking Active
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isTracking}
                    onClick={handleTrack}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-semibold rounded-[4px] transition-colors disabled:opacity-50"
                  >
                    {isTracking ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span>{isTracking ? 'Tracking Product...' : '+ Track Product'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Specifications Section */}
        <div className="bg-white border border-[#E2E0DA] rounded-[4px] p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-bold font-['Inter'] text-[#171717] mb-2 pb-2 border-b border-[#E2E0DA]">
            Specifications
          </h2>
          <ProductSpecs specs={product.specs} />
        </div>

        {/* About this item Section */}
        <div className="bg-white border border-[#E2E0DA] rounded-[4px] p-6 sm:p-8">
          <h2 className="text-xl font-bold font-['Inter'] text-[#171717] mb-3 pb-2 border-b border-[#E2E0DA]">
            About this item
          </h2>
          <p className="text-sm text-[#666660] leading-relaxed max-w-3xl">
            {product.description || 'No detailed description provided for this product.'}
          </p>
        </div>
      </main>
    </div>
  );
};

export default ProductDetails;
