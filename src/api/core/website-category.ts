import type { SnowflakeId } from './types';

import { requestClient } from '#/api/request';

export interface AdminWebsiteCategory {
  createTime: string;
  id: SnowflakeId;
  index: number;
  name: string;
  updateTime: string;
}

export type AdminWebsiteCategoryPayload = Omit<
  AdminWebsiteCategory,
  'createTime' | 'id' | 'updateTime'
>;

export async function getAdminWebsiteCategoryListApi() {
  return requestClient.get<AdminWebsiteCategory[]>('/website/category/list');
}

export async function createAdminWebsiteCategoryApi(
  data: AdminWebsiteCategoryPayload,
) {
  return requestClient.post<AdminWebsiteCategory>(
    '/website/category/create',
    data,
  );
}

export async function updateAdminWebsiteCategoryApi(
  categoryId: SnowflakeId,
  data: Partial<AdminWebsiteCategoryPayload>,
) {
  return requestClient.put<AdminWebsiteCategory>(
    `/website/category/${categoryId}`,
    data,
  );
}

export async function deleteAdminWebsiteCategoryApi(categoryId: SnowflakeId) {
  return requestClient.delete(`/website/category/${categoryId}`);
}
