import { formatDistanceToNow, format, parseISO } from 'date-fns';

export function formatINR(price: number | null | undefined): string {
  if (price === null || price === undefined) {
    return 'Price unavailable';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatRelativeTime(isoString: string | null | undefined): string {
  if (!isoString) {
    return 'Never scraped';
  }
  try {
    const date = parseISO(isoString);
    return `${formatDistanceToNow(date, { addSuffix: true })}`;
  } catch {
    return isoString;
  }
}

export function formatExactTime(isoString: string | null | undefined): string {
  if (!isoString) {
    return '—';
  }
  try {
    const date = parseISO(isoString);
    return format(date, 'MMM dd, HH:mm');
  } catch {
    return isoString;
  }
}

export function formatFrequency(minutes: number | null | undefined): string {
  if (!minutes) return 'Not configured';
  if (minutes === 60) return 'Every hour';
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `Every ${hours} hours`;
  }
  return `Every ${minutes}m`;
}

export function formatStock(stock: number | null | undefined): {
  label: string;
  isAvailable: boolean;
  count: number | null;
} {
  if (stock === null || stock === undefined) {
    return { label: 'Stock unavailable', isAvailable: false, count: null };
  }
  if (stock === 0) {
    return { label: 'Out of stock', isAvailable: false, count: 0 };
  }
  return { label: `In stock · ${stock} available`, isAvailable: true, count: stock };
}
