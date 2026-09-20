import React, { useState } from 'react';
import { RefreshCw, Play } from 'lucide-react';
import type { DashboardRow } from '../../types';
import { formatFrequency, formatRelativeTime } from '../../utils/formatters';
import { triggerScheduler } from '../../api/monitoring';

interface TrackingPanelProps {
  trackedInfo?: DashboardRow | null;
  onRefresh?: () => void;
}

export const TrackingPanel: React.FC<TrackingPanelProps> = ({ trackedInfo, onRefresh }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [runMessage, setRunMessage] = useState<string | null>(null);

  const handleRunScheduler = async () => {
    try {
      setIsRunning(true);
      setRunMessage(null);
      const res = await triggerScheduler();
      setRunMessage(`Scraped ${res.claimed} product(s) (${res.succeeded} succeeded)`);
      if (onRefresh) {
        setTimeout(onRefresh, 1000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to run scrape cycle';
      setRunMessage(`Scrape failed: ${msg}`);
    } finally {
      setIsRunning(false);
    }
  };

  const isActive = trackedInfo?.is_active ?? true;
  const frequencyText = formatFrequency(trackedInfo?.scrape_frequency_minutes ?? 120);
  const lastScrapedText = formatRelativeTime(trackedInfo?.last_scraped_at);
  const nextScrapeText = formatRelativeTime(trackedInfo?.next_scrape_at);

  return (
    <div className="bg-[#181816] border border-[#353530] rounded-[4px] p-4 text-xs font-mono">
      <div className="flex items-center justify-between pb-3 border-b border-[#353530] mb-3">
        <span className="font-bold text-[#A1A19A] tracking-wider uppercase">
          Tracking Configuration
        </span>
        <button
          type="button"
          disabled={isRunning}
          onClick={handleRunScheduler}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#20201D] hover:bg-[#353530] border border-[#353530] text-[#F5F5F0] rounded-[4px] transition-colors disabled:opacity-50"
        >
          {isRunning ? (
            <RefreshCw className="w-3 h-3 animate-spin text-[#F59E0B]" />
          ) : (
            <Play className="w-3 h-3 text-[#F59E0B]" />
          )}
          <span>{isRunning ? 'Scraping...' : 'Run Scrape Cycle'}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <span className="text-[#73736C] block mb-1">Status</span>
          <span
            className={`inline-flex items-center gap-1 font-semibold ${
              isActive ? 'text-[#22C55E]' : 'text-[#EF4444]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div>
          <span className="text-[#73736C] block mb-1">Scrape Frequency</span>
          <span className="text-[#F5F5F0] font-medium">{frequencyText}</span>
        </div>

        <div>
          <span className="text-[#73736C] block mb-1">Last Scraped</span>
          <span className="text-[#F5F5F0]">{lastScrapedText}</span>
        </div>

        <div>
          <span className="text-[#73736C] block mb-1">Next Scrape</span>
          <span className="text-[#F59E0B] font-medium">{nextScrapeText}</span>
        </div>
      </div>

      {runMessage && (
        <div className="mt-3 pt-2 border-t border-[#353530] text-[11px] text-[#A1A19A]">
          {runMessage}
        </div>
      )}
    </div>
  );
};

export default TrackingPanel;
