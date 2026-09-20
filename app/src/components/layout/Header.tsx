import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Activity } from 'lucide-react';
import { getDashboard } from '../../api/dashboard';

interface HeaderProps {
  theme?: 'light' | 'dark';
}

export const Header: React.FC<HeaderProps> = ({ theme }) => {
  const location = useLocation();
  const isCatalog = location.pathname.startsWith('/products') && !location.pathname.includes('/monitor');
  const activeTheme = theme || (isCatalog ? 'light' : 'dark');

  const [trackedCount, setTrackedCount] = useState<number>(0);
  const [showAlertMenu, setShowAlertMenu] = useState(false);
  const alertMenuRef = useRef<HTMLDivElement>(null);

  // Fetch count of tracked items for the alert indicator
  useEffect(() => {
    getDashboard()
      .then((rows) => {
        setTrackedCount(rows.length);
      })
      .catch(() => {});
  }, [location.pathname]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    if (!showAlertMenu) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (alertMenuRef.current && !alertMenuRef.current.contains(event.target as Node)) {
        setShowAlertMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showAlertMenu]);

  if (activeTheme === 'light') {
    return (
      <header className="w-full bg-[#F7F7F5] border-b border-[#E2E0DA] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-2 group">
              <span className="font-semibold text-xs tracking-wider uppercase text-[#8A8982]">
                INE Store /
              </span>
              <span className="font-['Playfair_Display'] font-bold text-lg text-[#171717] tracking-tight group-hover:text-[#D97706] transition-colors">
                PricePulse
              </span>
            </Link>
          </div>

          {/* Fixed navbar tab positions: Dashboard first, then Products */}
          <nav className="flex items-center gap-6">
            <Link
              to="/dashboard"
              className={`text-sm font-medium transition-colors ${
                location.pathname === '/dashboard'
                  ? 'text-[#D97706] font-semibold'
                  : 'text-[#666660] hover:text-[#171717]'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/products"
              className={`text-sm font-medium transition-colors ${
                isCatalog
                  ? 'text-[#D97706] font-semibold'
                  : 'text-[#666660] hover:text-[#171717]'
              }`}
            >
              Products
            </Link>

            <div className="relative" ref={alertMenuRef}>
              <button
                type="button"
                onClick={() => setShowAlertMenu((prev) => !prev)}
                className="p-2 text-[#666660] hover:text-[#171717] relative rounded transition-colors focus:outline-none focus:ring-1 focus:ring-[#D97706]"
                aria-label="Alerts"
                aria-expanded={showAlertMenu}
              >
                <Bell className="w-4 h-4" />
                {trackedCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#D97706] rounded-full" />
                )}
              </button>

              {showAlertMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E2E0DA] rounded-[4px] shadow-md p-3 z-50 text-xs text-[#171717]">
                  <div className="font-semibold text-[#171717] mb-1">Monitoring Status</div>
                  <div className="text-[#666660]">
                    {trackedCount > 0
                      ? `${trackedCount} product(s) currently being monitored for price drops and stock.`
                      : 'No products currently monitored.'}
                  </div>
                  <Link
                    to="/dashboard"
                    onClick={() => setShowAlertMenu(false)}
                    className="mt-2 block text-[#D97706] font-medium hover:underline"
                  >
                    Go to Dashboard →
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>
    );
  }

  // Dark monitoring header
  return (
    <header className="w-full bg-[#11110F] border-b border-[#353530] sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <Activity className="w-5 h-5 text-[#F59E0B]" />
            <div className="flex flex-col">
              <span className="font-['Inter'] font-bold text-base text-[#F5F5F0] tracking-wider uppercase">
                PRICEPULSE
              </span>
              <span className="text-[10px] text-[#73736C] uppercase tracking-widest font-mono">
                Price & Stock Monitoring
              </span>
            </div>
          </Link>
        </div>

        {/* Fixed navbar tab positions: Dashboard first, then Products */}
        <nav className="flex items-center gap-6">
          <Link
            to="/dashboard"
            className={`text-sm font-medium transition-colors ${
              location.pathname === '/dashboard'
                ? 'text-[#F59E0B] font-semibold'
                : 'text-[#A1A19A] hover:text-[#F5F5F0]'
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/products"
            className={`text-sm font-medium transition-colors ${
              isCatalog
                ? 'text-[#F59E0B] font-semibold'
                : 'text-[#A1A19A] hover:text-[#F5F5F0]'
            }`}
          >
            Products
          </Link>

          <div className="relative" ref={alertMenuRef}>
            <button
              type="button"
              onClick={() => setShowAlertMenu((prev) => !prev)}
              className="p-2 text-[#A1A19A] hover:text-[#F5F5F0] relative rounded transition-colors focus:outline-none focus:ring-1 focus:ring-[#F59E0B]"
              aria-label="Alerts"
              aria-expanded={showAlertMenu}
            >
              <Bell className="w-4 h-4" />
              {trackedCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#F59E0B] rounded-full" />
              )}
            </button>

            {showAlertMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-[#181816] border border-[#353530] rounded-[4px] shadow-md p-3 z-50 text-xs text-[#F5F5F0]">
                <div className="font-semibold mb-1 text-[#F5F5F0]">Active Monitoring</div>
                <div className="text-[#A1A19A]">
                  {trackedCount > 0
                    ? `${trackedCount} product(s) actively scheduled for scraping and price alerts.`
                    : 'No active monitors.'}
                </div>
                <Link
                  to="/dashboard"
                  onClick={() => setShowAlertMenu(false)}
                  className="mt-2 block text-[#F59E0B] font-medium hover:underline"
                >
                  View all in Dashboard →
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
