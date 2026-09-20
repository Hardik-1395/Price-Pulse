import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import Header from '../components/layout/Header';
import PriceChart from '../components/monitoring/PriceChart';
import TrackingPanel from '../components/monitoring/TrackingPanel';
import AlertPanel from '../components/monitoring/AlertPanel';
import ScrapeActivity from '../components/monitoring/ScrapeActivity';
import StockBadge from '../components/monitoring/StockBadge';
import { Skeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/EmptyState';
import { getProduct } from '../api/products';
import { getDashboard } from '../api/dashboard';
import { getPriceHistory, getAlerts, getScrapeLogs } from '../api/monitoring';
import type { Product, DashboardRow, PricePoint, Alert, ScrapeLogRow } from '../types';
import { formatINR } from '../utils/formatters';
import { getCategoryIcon } from '../utils/categoryIcons';

export const ProductMonitor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isFromDashboard = location.state?.from === 'dashboard';
  const productId = Number(id);

  const [product, setProduct] = useState<Product | null>(null);
  const [trackedInfo, setTrackedInfo] = useState<DashboardRow | null>(null);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [scrapeLogs, setScrapeLogs] = useState<ScrapeLogRow[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMonitoringData = useCallback(async () => {
    if (!productId || isNaN(productId)) {
      setError('Invalid product ID');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Concurrent fetch for all monitoring data
      const [productRes, dashboardRows, historyRes, alertsRes, logsRes] = await Promise.all([
        getProduct(productId),
        getDashboard().catch(() => [] as DashboardRow[]),
        getPriceHistory(productId).catch(() => [] as PricePoint[]),
        getAlerts(productId).catch(() => [] as Alert[]),
        getScrapeLogs(productId).catch(() => [] as ScrapeLogRow[]),
      ]);

      setProduct(productRes);
      const match = dashboardRows.find((r) => r.product_id === productId);
      setTrackedInfo(match || null);
      setPriceHistory(historyRes);
      setAlerts(alertsRes);
      setScrapeLogs(logsRes);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load monitoring data.');
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadMonitoringData();
  }, [loadMonitoringData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#11110F] text-[#F5F5F0] flex flex-col font-mono">
        <Header theme="dark" />
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <Skeleton className="h-4 w-36 bg-[#353530]" theme="dark" />
          <Skeleton className="h-32 w-full bg-[#181816]" theme="dark" />
          <Skeleton className="h-72 w-full bg-[#181816]" theme="dark" />
          <Skeleton className="h-28 w-full bg-[#181816]" theme="dark" />
          <Skeleton className="h-32 w-full bg-[#181816]" theme="dark" />
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#11110F] text-[#F5F5F0] flex flex-col font-mono">
        <Header theme="dark" />
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            to={isFromDashboard ? "/dashboard" : "/products"}
            className="inline-flex items-center gap-1.5 text-xs text-[#A1A19A] hover:text-[#F5F5F0] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {isFromDashboard ? 'Back to dashboard' : 'Back to products'}
          </Link>
          <ErrorState message={error || 'Product not found.'} onRetry={loadMonitoringData} theme="dark" />
        </main>
      </div>
    );
  }

  const currentPrice = trackedInfo?.price;
  const mrp = trackedInfo?.mrp;
  const stock = trackedInfo?.stock;
  const discountPct =
    mrp && currentPrice && mrp > currentPrice
      ? Math.round(((mrp - currentPrice) / mrp) * 100)
      : null;

  return (
    <div className="min-h-screen bg-[#11110F] text-[#F5F5F0] flex flex-col font-sans">
      <Header theme="dark" />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <Link
            to={isFromDashboard ? "/dashboard" : `/products/${product.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#A1A19A] hover:text-[#F5F5F0] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {isFromDashboard ? 'Back to dashboard' : 'Back to product'}
          </Link>

          {isFromDashboard && (
            <Link
              to={`/products/${product.id}`}
              state={{ from: 'dashboard' }}
              className="inline-flex items-center gap-1 text-xs font-mono text-[#F59E0B] hover:underline transition-colors"
            >
              View product details →
            </Link>
          )}
        </div>

        {/* 1. Product Summary Panel */}
        <div className="bg-[#181816] border border-[#353530] rounded-[4px] p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#20201D] border border-[#353530] rounded-[4px] flex items-center justify-center text-[#A1A19A] shrink-0">
                {getCategoryIcon(product.category, 'w-8 h-8')}
              </div>
              <div>
                <div className="text-[11px] font-mono text-[#73736C] uppercase tracking-wider">
                  {product.brand || '—'} · {product.category || 'Product'}
                </div>
                <h1 className="text-xl font-bold text-[#F5F5F0] leading-tight">
                  {product.name}
                </h1>
                <div className="text-[11px] font-mono text-[#73736C]">
                  SKU {product.sku || product.slug || `PRD-${product.id}`}
                </div>
              </div>
            </div>

            {/* Price & Status pill */}
            <div className="flex sm:flex-col items-baseline sm:items-end justify-between w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-[#353530]">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-['Inter'] text-[#F5F5F0]">
                  {formatINR(currentPrice)}
                </span>
                {mrp && currentPrice && mrp > currentPrice && (
                  <span className="text-xs font-mono text-[#73736C] line-through">
                    {formatINR(mrp)}
                  </span>
                )}
                {discountPct && (
                  <span className="text-xs font-mono font-bold text-[#F59E0B]">
                    -{discountPct}%
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 mt-1.5 font-mono text-xs">
                <StockBadge stock={stock} theme="dark" />
                <span className="inline-flex items-center gap-1 text-[#22C55E]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Tracking active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Price History Chart */}
        <section aria-label="Price History">
          <PriceChart data={priceHistory} />
        </section>

        {/* 3. Tracking Configuration */}
        <section aria-label="Tracking Configuration">
          <TrackingPanel trackedInfo={trackedInfo} onRefresh={loadMonitoringData} />
        </section>

        {/* 4. Alert Rules */}
        <section aria-label="Alert Rules">
          <AlertPanel alerts={alerts} />
        </section>

        {/* 5. Recent Scrape Activity */}
        <section aria-label="Recent Scrape Activity">
          <ScrapeActivity logs={scrapeLogs} productName={product.name} />
        </section>
      </main>
    </div>
  );
};

export default ProductMonitor;
