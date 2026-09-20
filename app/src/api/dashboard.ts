import { apiClient } from './client';
import type { DashboardRow } from '../types';

export async function getDashboard(): Promise<DashboardRow[]> {
  const { data } = await apiClient.get<DashboardRow[]>('/dashboard');
  return data ?? [];
}
