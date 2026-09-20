import React, { useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import type { ScrapeLogRow } from '../../types';
import { formatExactTime } from '../../utils/formatters';
import { ScrapeLogModal } from './ScrapeLogModal';

interface ScrapeActivityProps {
  logs: ScrapeLogRow[];
  productName?: string;
}

export const ScrapeActivity: React.FC<ScrapeActivityProps> = ({ logs, productName }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Take the most recent 5 logs for the compact view
  const recentLogs = logs.slice(0, 5);

  return (
    <div className="bg-[#181816] border border-[#353530] rounded-[4px] p-4 text-xs font-mono">
      <div className="flex items-center justify-between pb-3 border-b border-[#353530] mb-3">
        <span className="font-bold text-[#A1A19A] tracking-wider uppercase">
          Recent Scrape Activity
        </span>
        {logs.length > 0 && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1 text-[#F59E0B] hover:text-[#D97706] transition-colors"
          >
            <span>View complete scrape log</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

      {recentLogs.length === 0 ? (
        <div className="py-6 text-[#73736C] text-center italic">
          No scrape activity recorded yet for this product.
        </div>
      ) : (
        <div className="space-y-2">
          {recentLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between py-2 px-3 bg-[#20201D] border border-[#353530]/70 rounded-[2px]"
            >
              <div className="flex items-center gap-4">
                <span className="text-[#A1A19A] min-w-28">
                  {formatExactTime(log.attempted_at)}
                </span>

                {log.status === 'success' && (
                  <span className="inline-flex items-center gap-1.5 text-[#22C55E] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Success
                  </span>
                )}
                {log.status === 'failed' && (
                  <span className="inline-flex items-center gap-1.5 text-[#EF4444] font-medium">
                    <XCircle className="w-3.5 h-3.5" />
                    Failed {log.error_message ? `· ${log.error_message}` : ''}
                  </span>
                )}
                {log.status === 'structure_error' && (
                  <span className="inline-flex items-center gap-1.5 text-[#EAB308] font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Structure Changed
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-[#73736C]">
                {log.retry_count > 0 && (
                  <span className="text-[#EAB308]">{log.retry_count} retr{log.retry_count > 1 ? 'ies' : 'y'}</span>
                )}
                <span className="text-[#F5F5F0]">
                  {log.duration_ms !== null ? `${log.duration_ms}ms` : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audit Modal */}
      <ScrapeLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        logs={logs}
        productName={productName}
      />
    </div>
  );
};

export default ScrapeActivity;
