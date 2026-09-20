import { apiClient } from './client';
import type { PricePoint, Alert, ScrapeLogRow } from '../types';

export async function getPriceHistory(productId: number): Promise<PricePoint[]> {
  const { data } = await apiClient.get<PricePoint[]>(`/products/${productId}/price-history`);
  return data ?? [];
}

export async function getAlerts(productId: number): Promise<Alert[]> {
  const { data } = await apiClient.get<Alert[]>(`/alerts?productId=${productId}`);
  return data ?? [];
}

export async function getScrapeLogs(productId?: number, limit = 100): Promise<ScrapeLogRow[]> {
  const params = new URLSearchParams();
  if (productId !== undefined) {
    params.append('productId', productId.toString());
  }
  if (limit !== undefined) {
    params.append('limit', limit.toString());
  }
  const { data } = await apiClient.get<ScrapeLogRow[]>(`/api/proxy/scrape-logs?${params.toString()}`);
  return data ?? [];
}

export async function triggerScheduler(): Promise<{
  claimed: number;
  succeeded: number;
  failed: number;
  structureError: number;
  alertsFired: number;
  details: unknown[];
}> {
  const { data } = await apiClient.post('/api/proxy/scheduler/run');
  return data;
}
