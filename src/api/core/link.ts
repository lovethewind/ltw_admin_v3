import type { SnowflakeId } from './types';

import { requestClient } from '#/api/request';

export interface AdminLink {
  cover: string;
  createTime: string;
  description?: null | string;
  email?: null | string;
  id: SnowflakeId;
  index: number;
  introduce: string;
  name: string;
  status: number;
  updateTime: string;
  url: string;
}

export interface AdminLinkPage {
  current: number;
  pages: number;
  records: AdminLink[];
  size: number;
  total: number;
}

export type AdminLinkPayload = Partial<
  Omit<AdminLink, 'createTime' | 'id' | 'updateTime'>
>;

export async function getAdminLinkPageApi(params: {
  current: number;
  keyword?: string;
  size: number;
  status?: null | number;
}) {
  return requestClient.get<AdminLinkPage>('/link/list', {
    params,
  });
}

export async function getAdminLinkApi(linkId: SnowflakeId) {
  return requestClient.get<AdminLink>(`/link/${linkId}`);
}

export async function createAdminLinkApi(data: AdminLinkPayload) {
  return requestClient.post<AdminLink>('/link/create', data);
}

export async function updateAdminLinkApi(
  linkId: SnowflakeId,
  data: AdminLinkPayload,
) {
  return requestClient.put<AdminLink>(`/link/${linkId}`, data);
}

export async function updateAdminLinkStatusApi(
  linkId: SnowflakeId,
  status: number,
) {
  return requestClient.put<AdminLink>(`/link/${linkId}/status`, {
    status,
  });
}

export async function deleteAdminLinkApi(linkId: SnowflakeId) {
  return requestClient.delete(`/link/${linkId}`);
}
