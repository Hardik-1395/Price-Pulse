import { apiClient } from './client';
import type { Product, ProductSummary, TrackedProduct } from '../types';

export async function getProducts(): Promise<ProductSummary[]> {
  const { data } = await apiClient.get<ProductSummary[]>('/products');
  return data;
}

export async function searchProducts(q: string, limit = 50): Promise<ProductSummary[]> {
  const trimmed = q.trim();
  if (!trimmed) {
    return [];
  }
  const { data } = await apiClient.get<ProductSummary[]>(
    `/products/search?q=${encodeURIComponent(trimmed)}&limit=${limit}`
  );
  return data;
}

export async function getProduct(id: number): Promise<Product> {
  const { data } = await apiClient.get<Product>(`/products/${id}`);
  return data;
}

export interface TrackResponse {
  tracked: TrackedProduct;
  alertsCreated: unknown;
}

export async function trackProduct(
  productId: number,
  frequencyMinutes?: number
): Promise<TrackResponse> {
  const payload: { productId: number; frequencyMinutes?: number } = { productId };
  if (frequencyMinutes !== undefined) {
    payload.frequencyMinutes = frequencyMinutes;
  }
  const { data } = await apiClient.post<TrackResponse>('/api/proxy/track', payload);
  return data;
}
