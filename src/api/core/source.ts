import type { SnowflakeId } from './types';

import { requestClient } from '#/api/request';

export interface AdminSource {
  createTime: string;
  id: SnowflakeId;
  isDeleted: boolean;
  updateTime: string;
  url: string;
  userId: SnowflakeId;
}

export interface AdminSourcePage {
  current: number;
  pages: number;
  records: AdminSource[];
  size: number;
  total: number;
}

export type AdminSourcePayload = Partial<Pick<AdminSource, 'isDeleted'>>;

export async function getAdminSourcePageApi(params: {
  current: number;
  isDeleted?: boolean | null;
  keyword?: string;
  size: number;
  userId?: null | SnowflakeId;
}) {
  return requestClient.get<AdminSourcePage>('/source/list', {
    params,
  });
}

export async function updateAdminSourceApi(
  sourceId: SnowflakeId,
  data: AdminSourcePayload,
) {
  return requestClient.put<AdminSource>(`/source/${sourceId}`, data);
}

export async function deleteAdminSourceApi(sourceId: SnowflakeId) {
  return requestClient.delete(`/source/${sourceId}`);
}
