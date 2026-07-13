import type { SnowflakeId } from './types';

import { requestClient } from '#/api/request';

export interface AdminMenu {
  alwaysShow: boolean;
  children?: AdminMenu[];
  code?: null | string;
  component?: null | string;
  hidden: boolean;
  icon?: null | string;
  id: SnowflakeId;
  index: number;
  isActive: boolean;
  isOutLink: boolean;
  menuType: number;
  name: string;
  parentId: SnowflakeId;
  path?: null | string;
  routeName?: null | string;
}

export type AdminMenuPayload = Omit<AdminMenu, 'children' | 'id'>;

export async function getAdminMenuTreeApi(activeOnly = false) {
  return requestClient.get<AdminMenu[]>('/menu/tree', {
    params: { activeOnly },
  });
}

export async function createAdminMenuApi(data: AdminMenuPayload) {
  return requestClient.post<AdminMenu>('/menu/', data);
}

export async function updateAdminMenuApi(
  menuId: number | string,
  data: Partial<AdminMenuPayload>,
) {
  return requestClient.put<AdminMenu>(`/menu/${menuId}`, data);
}

export async function deleteAdminMenuApi(menuId: number | string) {
  return requestClient.delete(`/menu/${menuId}`);
}
