import React from 'react';
import { X, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import type { ScrapeLogRow } from '../../types';
import { formatExactTime } from '../../utils/formatters';

interface ScrapeLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ScrapeLogRow[];
  productName?: string;
}

export const ScrapeLogModal: React.FC<ScrapeLogModalProps> = ({
  isOpen,
  onClose,
  logs,
  productName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#181816] border border-[#353530] w-full max-w-3xl max-h-[85vh] rounded-[4px] shadow-2xl flex flex-col font-mono text-xs text-[#F5F5F0]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#353530]">
          <div>
            <h3 className="font-bold text-sm text-[#F5F5F0]">Complete Scrape Audit Trail</h3>
            {productName && (
              <div className="text-[11px] text-[#A1A19A] mt-0.5">{productName}</div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#73736C] hover:text-[#F5F5F0] rounded transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {logs.length === 0 ? (
            <div className="py-12 text-center text-[#73736C]">
              No scrape activity logs recorded yet.
            </div>
          ) : (
            <div className="border border-[#353530] rounded-[2px] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#20201D] border-b border-[#353530] text-[#73736C] text-[11px] uppercase">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Retries</th>
                    <th className="py-2.5 px-3">Error / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#353530]/50">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#20201D]/50 transition-colors">
                      <td className="py-2 px-3 text-[#A1A19A] whitespace-nowrap">
                        {formatExactTime(log.attempted_at)}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        {log.status === 'success' && (
                          <span className="inline-flex items-center gap-1.5 text-[#22C55E]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            SUCCESS
                          </span>
                        )}
                        {log.status === 'failed' && (
                          <span className="inline-flex items-center gap-1.5 text-[#EF4444]">
                            <XCircle className="w-3.5 h-3.5" />
                            FAILED
                          </span>
                        )}
                        {log.status === 'structure_error' && (
                          <span className="inline-flex items-center gap-1.5 text-[#EAB308]">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            STRUCTURE ERR
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-[#F5F5F0] whitespace-nowrap">
                        {log.duration_ms !== null ? `${log.duration_ms}ms` : '—'}
                      </td>
                      <td className="py-2 px-3 text-[#A1A19A] whitespace-nowrap">
                        {log.retry_count}
                      </td>
                      <td className="py-2 px-3 text-[#A1A19A] max-w-xs truncate" title={log.error_message || ''}>
                        {log.error_message || (log.price_history_id ? `Price snapshot ${log.price_history_id.slice(0, 8)}` : '—')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-[#353530] flex items-center justify-between text-[11px] text-[#73736C]">
          <span>Total {logs.length} logged scrape attempt(s)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-[#20201D] hover:bg-[#353530] text-[#F5F5F0] rounded-[4px] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScrapeLogModal;
