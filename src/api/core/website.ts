import type { SnowflakeId } from './types';

import { requestClient } from '#/api/request';

export interface AdminWebsite {
  categoryId: SnowflakeId;
  cover: string;
  createTime: string;
  id: SnowflakeId;
  index: number;
  introduce: string;
  name: string;
  status: number;
  updateTime: string;
  url: string;
  userId: SnowflakeId;
}

export interface AdminWebsitePage {
  current: number;
  pages: number;
  records: AdminWebsite[];
  size: number;
  total: number;
}

export type AdminWebsitePayload = Partial<
  Omit<AdminWebsite, 'createTime' | 'id' | 'updateTime'>
>;

export async function getAdminWebsitePageApi(params: {
  categoryId?: null | SnowflakeId;
  current: number;
  keyword?: string;
  size: number;
  status?: null | number;
  userId?: null | SnowflakeId;
}) {
  return requestClient.get<AdminWebsitePage>('/website/list', {
    params,
  });
}

export async function getAdminWebsiteApi(websiteId: SnowflakeId) {
  return requestClient.get<AdminWebsite>(`/website/${websiteId}`);
}

export async function createAdminWebsiteApi(data: AdminWebsitePayload) {
  return requestClient.post<AdminWebsite>('/website/create', data);
}

export async function updateAdminWebsiteApi(
  websiteId: SnowflakeId,
  data: AdminWebsitePayload,
) {
  return requestClient.put<AdminWebsite>(`/website/${websiteId}`, data);
}

export async function updateAdminWebsiteStatusApi(
  websiteId: SnowflakeId,
  status: number,
) {
  return requestClient.put<AdminWebsite>(`/website/${websiteId}/status`, {
    status,
  });
}

export async function deleteAdminWebsiteApi(websiteId: SnowflakeId) {
  return requestClient.delete(`/website/${websiteId}`);
}
