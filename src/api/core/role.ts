import type { SnowflakeId } from './types';

import { requestClient } from '#/api/request';

export interface AdminRole {
  code: string;
  description?: null | string;
  id: SnowflakeId;
  isActive: boolean;
  name: string;
}

export type AdminRolePayload = Omit<AdminRole, 'id'>;

export async function getAdminRoleListApi() {
  return requestClient.get<AdminRole[]>('/menu/role/list');
}

export async function createAdminRoleApi(data: AdminRolePayload) {
  return requestClient.post<AdminRole>('/menu/role', data);
}

export async function updateAdminRoleApi(
  roleId: number | string,
  data: Partial<AdminRolePayload>,
) {
  return requestClient.put<AdminRole>(`/menu/role/${roleId}`, data);
}

export async function deleteAdminRoleApi(roleId: number | string) {
  return requestClient.delete(`/menu/role/${roleId}`);
}

export async function getAdminRoleMenuIdsApi(roleId: number | string) {
  return requestClient.get<SnowflakeId[]>(`/menu/role/${roleId}/menus`);
}

export function toAdminRoleMenuPayload(menuIds: SnowflakeId[]) {
  return {
    menuIds: [...new Set(menuIds)],
  };
}

export async function updateAdminRoleMenusApi(
  roleId: number | string,
  menuIds: SnowflakeId[],
) {
  return requestClient.put(
    `/menu/role/${roleId}/menus`,
    toAdminRoleMenuPayload(menuIds),
  );
}
