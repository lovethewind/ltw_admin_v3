import type { SnowflakeId } from './types';

import { requestClient } from '#/api/request';

export interface AdminConfig {
  createTime: string;
  description?: null | string;
  id: SnowflakeId;
  isActive: boolean;
  name: string;
  updateTime: string;
  value: string;
}

export interface AdminConfigPage {
  current: number;
  pages: number;
  records: AdminConfig[];
  size: number;
  total: number;
}

export type AdminConfigPayload = Omit<
  AdminConfig,
  'createTime' | 'id' | 'updateTime'
>;

export async function getAdminConfigPageApi(params: {
  current: number;
  isActive?: boolean | null;
  keyword?: string;
  size: number;
}) {
  return requestClient.get<AdminConfigPage>('/config/list', {
    params,
  });
}

export async function getAdminConfigApi(configId: SnowflakeId) {
  return requestClient.get<AdminConfig>(`/config/${configId}`);
}

export async function createAdminConfigApi(data: AdminConfigPayload) {
  return requestClient.post<AdminConfig>('/config/create', data);
}

export async function updateAdminConfigApi(
  configId: SnowflakeId,
  data: Partial<AdminConfigPayload>,
) {
  return requestClient.put<AdminConfig>(`/config/${configId}`, data);
}

export async function deleteAdminConfigApi(configId: SnowflakeId) {
  return requestClient.delete(`/config/${configId}`);
}
