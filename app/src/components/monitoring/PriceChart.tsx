import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { PricePoint } from '../../types';
import { formatINR } from '../../utils/formatters';

interface PriceChartProps {
  data: PricePoint[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: PricePoint;
  }>;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    let formattedDate = item.quoted_at;
    try {
      formattedDate = format(parseISO(item.quoted_at), 'MMM dd, yyyy HH:mm');
    } catch {
      // fallback
    }

    return (
      <div className="bg-[#181816] border border-[#353530] p-3 rounded-[4px] shadow-lg text-xs font-mono">
        <div className="text-[#A1A19A] mb-2">{formattedDate}</div>
        <div className="flex items-center justify-between gap-4 text-[#F5F5F0] mb-1">
          <span>Price:</span>
          <span className="font-bold text-[#F59E0B]">{formatINR(item.price)}</span>
        </div>
        {item.mrp && (
          <div className="flex items-center justify-between gap-4 text-[#A1A19A] mb-1">
            <span>MRP:</span>
            <span>{formatINR(item.mrp)}</span>
          </div>
        )}
        <div className="flex items-center justify-between gap-4 text-[#A1A19A]">
          <span>Stock:</span>
          <span>{item.stock !== null ? item.stock : 'Unavailable'}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const PriceChart: React.FC<PriceChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center bg-[#181816] border border-[#353530] rounded-[4px] text-[#73736C] text-sm font-mono">
        <p>No price history yet.</p>
        <p className="text-xs text-[#52524E] mt-1">Price points will populate as scrape cycles run.</p>
      </div>
    );
  }

  // Ensure items are sorted chronologically by quoted_at
  const sortedData = [...data].sort(
    (a, b) => new Date(a.quoted_at).getTime() - new Date(b.quoted_at).getTime()
  );

  return (
    <div className="w-full h-72 bg-[#181816] border border-[#353530] rounded-[4px] p-4">
      <div className="text-xs font-mono text-[#A1A19A] uppercase tracking-wider mb-2 flex items-center justify-between">
        <span>Price Over Time</span>
        <span className="text-[#F59E0B] font-medium">{sortedData.length} data point{sortedData.length > 1 ? 's' : ''}</span>
      </div>

      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sortedData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#353530" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="quoted_at"
              tickFormatter={(str) => {
                try {
                  return format(parseISO(str), 'MMM dd');
                } catch {
                  return str;
                }
              }}
              stroke="#73736C"
              fontSize={11}
              fontFamily="JetBrains Mono"
              tickLine={false}
              axisLine={{ stroke: '#353530' }}
            />
            <YAxis
              domain={['auto', 'auto']}
              tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              stroke="#73736C"
              fontSize={11}
              fontFamily="JetBrains Mono"
              tickLine={false}
              axisLine={{ stroke: '#353530' }}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={{ r: 3, fill: '#F59E0B', stroke: '#181816', strokeWidth: 1 }}
              activeDot={{ r: 5, fill: '#F59E0B', stroke: '#F5F5F0', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PriceChart;
