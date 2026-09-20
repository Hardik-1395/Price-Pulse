import React from 'react';
import { PackageOpen, AlertCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  actionTo?: string;
  onActionClick?: () => void;
  theme?: 'light' | 'dark';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  actionTo,
  onActionClick,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  return (
    <div
      className={`text-center py-16 px-4 rounded-[4px] border ${
        isDark
          ? 'bg-[#181816] border-[#353530] text-[#F5F5F0]'
          : 'bg-white border-[#E2E0DA] text-[#171717]'
      }`}
    >
      <div
        className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
          isDark ? 'bg-[#20201D] text-[#73736C]' : 'bg-[#F2F1ED] text-[#8A8982]'
        }`}
      >
        <PackageOpen className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      <p
        className={`text-sm max-w-md mx-auto mb-6 ${
          isDark ? 'text-[#A1A19A]' : 'text-[#666660]'
        }`}
      >
        {description}
      </p>

      {actionText && actionTo && (
        <Link
          to={actionTo}
          className={`inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-[4px] transition-colors ${
            isDark
              ? 'bg-[#F59E0B] text-black hover:bg-[#D97706]'
              : 'bg-[#D97706] text-white hover:bg-[#B45309]'
          }`}
        >
          {actionText}
        </Link>
      )}

      {actionText && onActionClick && !actionTo && (
        <button
          type="button"
          onClick={onActionClick}
          className={`inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-[4px] transition-colors ${
            isDark
              ? 'bg-[#F59E0B] text-black hover:bg-[#D97706]'
              : 'bg-[#D97706] text-white hover:bg-[#B45309]'
          }`}
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  theme?: 'light' | 'dark';
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  onRetry,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  return (
    <div
      className={`p-6 rounded-[4px] border ${
        isDark
          ? 'bg-[#181816] border-[#EF4444]/30 text-[#F5F5F0]'
          : 'bg-red-50/50 border-red-200 text-[#171717]'
      }`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-[#EF4444]">An error occurred</h4>
          <p
            className={`text-xs mt-1 ${
              isDark ? 'text-[#A1A19A]' : 'text-[#666660]'
            }`}
          >
            {message}
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-[4px] border border-current text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
