import React from 'react';
import { Activity, TrendingDown, ShieldCheck } from 'lucide-react';
import type { DashboardRow } from '../../types';

interface DashboardStatsProps {
  rows: DashboardRow[];
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ rows }) => {
  const totalTracked = rows.length;
  const priceDrops = rows.filter((r) => r.mrp && r.price && r.price < r.mrp).length;

  const scrapedRows = rows.filter((r) => r.last_scrape_status !== null);
  const healthyCount = rows.filter((r) => r.last_scrape_status === 'success').length;
  const healthRate =
    scrapedRows.length > 0 ? Math.round((healthyCount / scrapedRows.length) * 100) : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {/* Metric 1: Tracked Products */}
      <div className="bg-[#181816] border border-[#353530] rounded-[4px] p-4 flex items-center gap-3">
        <div className="p-2.5 bg-[#20201D] border border-[#353530] text-[#F59E0B] rounded-[4px]">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[11px] font-mono text-[#73736C] uppercase tracking-wider block">
            Tracked Products
          </span>
          <span className="text-xl font-bold font-mono text-[#F5F5F0]">
            {totalTracked}
          </span>
        </div>
      </div>

      {/* Metric 2: Active Price Drops */}
      <div className="bg-[#181816] border border-[#353530] rounded-[4px] p-4 flex items-center gap-3">
        <div className="p-2.5 bg-[#20201D] border border-[#353530] text-[#22C55E] rounded-[4px]">
          <TrendingDown className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[11px] font-mono text-[#73736C] uppercase tracking-wider block">
            Discounted / Below MRP
          </span>
          <span className="text-xl font-bold font-mono text-[#F5F5F0]">
            {priceDrops}
          </span>
        </div>
      </div>

      {/* Metric 3: Scrape Health */}
      <div className="bg-[#181816] border border-[#353530] rounded-[4px] p-4 flex items-center gap-3">
        <div className="p-2.5 bg-[#20201D] border border-[#353530] text-[#22C55E] rounded-[4px]">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[11px] font-mono text-[#73736C] uppercase tracking-wider block">
            Scrape Health
          </span>
          <span className="text-xl font-bold font-mono text-[#F5F5F0]">
            {healthRate !== null ? `${healthRate}%` : 'Pending'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
