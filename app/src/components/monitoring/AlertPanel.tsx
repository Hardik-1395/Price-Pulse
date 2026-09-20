import React from 'react';
import { TrendingDown, Package, Bell } from 'lucide-react';
import type { Alert } from '../../types';

interface AlertPanelProps {
  alerts: Alert[];
}

export const AlertPanel: React.FC<AlertPanelProps> = ({ alerts }) => {
  const priceDropAlert = alerts.find((a) => a.type === 'price_drop');
  const backInStockAlert = alerts.find((a) => a.type === 'back_in_stock');

  return (
    <div className="bg-[#181816] border border-[#353530] rounded-[4px] p-4 text-xs font-mono">
      <div className="flex items-center justify-between pb-3 border-b border-[#353530] mb-3">
        <span className="font-bold text-[#A1A19A] tracking-wider uppercase flex items-center gap-1.5">
          <Bell className="w-3.5 h-3.5 text-[#F59E0B]" />
          Alert Rules
        </span>
        <span className="text-[#73736C]">
          {alerts.filter((a) => a.is_active).length} Active Rule(s)
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="py-4 text-[#73736C] italic text-center">
          No active alerts configured for this product.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Price Drop Alert */}
          <div className="p-3 bg-[#20201D] border border-[#353530] rounded-[4px] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <TrendingDown className="w-4 h-4 text-[#F59E0B]" />
              <div>
                <div className="font-semibold text-[#F5F5F0]">Price Drop Alert</div>
                <div className="text-[11px] text-[#73736C]">Triggers when quote &lt; previous price</div>
              </div>
            </div>
            <div>
              {priceDropAlert && priceDropAlert.is_active ? (
                <span className="inline-flex items-center gap-1 text-[#22C55E] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                  Enabled
                </span>
              ) : (
                <span className="text-[#73736C]">Disabled</span>
              )}
            </div>
          </div>

          {/* Back In Stock Alert */}
          <div className="p-3 bg-[#20201D] border border-[#353530] rounded-[4px] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Package className="w-4 h-4 text-[#22C55E]" />
              <div>
                <div className="font-semibold text-[#F5F5F0]">Back in Stock Alert</div>
                <div className="text-[11px] text-[#73736C]">Triggers when stock changes from 0 to &gt;0</div>
              </div>
            </div>
            <div>
              {backInStockAlert && backInStockAlert.is_active ? (
                <span className="inline-flex items-center gap-1 text-[#22C55E] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                  Enabled
                </span>
              ) : (
                <span className="text-[#73736C]">Disabled</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertPanel;
