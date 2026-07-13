import type { SnowflakeId } from './types';

import { requestClient } from '#/api/request';

export interface AdminCategory {
  description?: null | string;
  id: SnowflakeId;
  index: number;
  isActive: boolean;
  name: string;
}

export type AdminCategoryPayload = Omit<AdminCategory, 'id'>;

export async function getAdminCategoryListApi() {
  return requestClient.get<AdminCategory[]>('/category/list');
}

export async function createAdminCategoryApi(data: AdminCategoryPayload) {
  return requestClient.post<AdminCategory>('/category/create', data);
}

export async function updateAdminCategoryApi(
  categoryId: number | string,
  data: Partial<AdminCategoryPayload>,
) {
  return requestClient.put<AdminCategory>(`/category/${categoryId}`, data);
}

export async function deleteAdminCategoryApi(categoryId: number | string) {
  return requestClient.delete(`/category/${categoryId}`);
}
