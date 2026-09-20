import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, RefreshCw } from 'lucide-react';
import Header from '../components/layout/Header';
import DashboardStats from '../components/dashboard/DashboardStats';
import TrackedProductTable from '../components/dashboard/TrackedProductTable';
import { TableRowSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState, ErrorState } from '../components/common/EmptyState';
import { getDashboard } from '../api/dashboard';
import { triggerScheduler } from '../api/monitoring';
import type { DashboardRow } from '../types';

export const Dashboard: React.FC = () => {
  const [rows, setRows] = useState<DashboardRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getDashboard();
      setRows(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load tracked products.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleRunAllScrapes = async () => {
    try {
      setIsScraping(true);
      await triggerScheduler();
      await loadDashboard();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to run scrapes.');
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#11110F] text-[#F5F5F0] flex flex-col font-sans">
      <Header theme="dark" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-['Inter'] text-[#F5F5F0] tracking-tight">
              Dashboard
            </h1>
            <p className="text-xs font-mono text-[#73736C] mt-1">
              Active monitoring overview and health across all tracked catalog items.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isScraping || rows.length === 0}
              onClick={handleRunAllScrapes}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#181816] hover:bg-[#20201D] border border-[#353530] text-[#F5F5F0] text-xs font-mono rounded-[4px] transition-colors disabled:opacity-40"
              title="Run scrape scheduler for all due products"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? 'animate-spin text-[#F59E0B]' : 'text-[#A1A19A]'}`} />
              <span>{isScraping ? 'Scraping...' : 'Run Scraper'}</span>
            </button>

            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-black text-xs font-semibold rounded-[4px] transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </Link>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6">
            <ErrorState message={error} onRetry={loadDashboard} theme="dark" />
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="h-20 bg-[#181816] border border-[#353530] rounded animate-pulse" />
              <div className="h-20 bg-[#181816] border border-[#353530] rounded animate-pulse" />
              <div className="h-20 bg-[#181816] border border-[#353530] rounded animate-pulse" />
            </div>
            <div className="bg-[#181816] border border-[#353530] rounded-[4px] p-4">
              <table className="w-full">
                <tbody>
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                </tbody>
              </table>
            </div>
          </div>
        ) : rows.length === 0 ? (
          /* Empty State (Section 36) */
          <EmptyState
            title="No products tracked yet."
            description="Start by searching the catalog and choosing a product to monitor its price and stock over time."
            actionText="+ Add Product"
            actionTo="/products"
            theme="dark"
          />
        ) : (
          <div className="space-y-6">
            {/* Dashboard Summary Metrics */}
            <DashboardStats rows={rows} />

            {/* Tracked Product Table */}
            <div>
              <div className="text-xs font-mono text-[#A1A19A] uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Tracked Products ({rows.length})</span>
                <span className="text-[11px] text-[#73736C]">Click any item to view monitoring console</span>
              </div>
              <TrackedProductTable rows={rows} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
