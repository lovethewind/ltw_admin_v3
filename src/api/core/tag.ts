import type { SnowflakeId } from './types';

import { requestClient } from '#/api/request';

export interface AdminTag {
  children?: AdminTag[];
  description?: null | string;
  id: SnowflakeId;
  index: number;
  isActive: boolean;
  level: number;
  name: string;
  parentId: SnowflakeId;
}

export type AdminTagPayload = Omit<AdminTag, 'children' | 'id'>;

export async function getAdminTagTreeApi(activeOnly = false) {
  return requestClient.get<AdminTag[]>('/tag/tree', {
    params: { activeOnly },
  });
}

export async function createAdminTagApi(data: AdminTagPayload) {
  return requestClient.post<AdminTag>('/tag/create', data);
}

export async function updateAdminTagApi(
  tagId: number | string,
  data: Partial<AdminTagPayload>,
) {
  return requestClient.put<AdminTag>(`/tag/${tagId}`, data);
}

export async function deleteAdminTagApi(tagId: number | string) {
  return requestClient.delete(`/tag/${tagId}`);
}
