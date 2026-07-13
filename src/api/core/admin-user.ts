import type { SnowflakeId } from './types';

import { requestClient } from '#/api/request';

export interface AdminUser {
  address?: null | string;
  avatar?: null | string;
  email?: null | string;
  gender: number;
  id: SnowflakeId;
  isOfficial: boolean;
  lastLoginIp?: null | string;
  lastLoginTime?: null | string;
  mobile?: null | string;
  nickname: string;
  registerTime: string;
  roleIds: SnowflakeId[];
  summary?: null | string;
  uid: SnowflakeId;
  username: string;
  wechat?: null | string;
}

export interface AdminUserPage {
  current: number;
  pages: number;
  records: AdminUser[];
  size: number;
  total: number;
}

export type AdminUserPayload = Partial<
  Omit<
    AdminUser,
    'id' | 'lastLoginIp' | 'lastLoginTime' | 'registerTime' | 'uid'
  >
> & {
  password?: string;
};

export async function getAdminUserPageApi(params: {
  current: number;
  keyword?: string;
  size: number;
}) {
  return requestClient.get<AdminUserPage>('/user/list', { params });
}

export async function getAdminUserApi(userId: number | string) {
  return requestClient.get<AdminUser>(`/user/${userId}`);
}

export async function createAdminUserApi(data: AdminUserPayload) {
  return requestClient.post<AdminUser>('/user/', data);
}

export async function updateAdminUserApi(
  userId: number | string,
  data: AdminUserPayload,
) {
  return requestClient.put<AdminUser>(`/user/${userId}`, data);
}

export async function deleteAdminUserApi(userId: number | string) {
  return requestClient.delete(`/user/${userId}`);
}

export async function getAdminUserRoleIdsApi(userId: number | string) {
  return requestClient.get<SnowflakeId[]>(`/user/${userId}/roles`);
}

export async function updateAdminUserRolesApi(
  userId: number | string,
  roleIds: SnowflakeId[],
) {
  return requestClient.put(
    `/user/${userId}/roles`,
    toAdminUserRolePayload(roleIds),
  );
}

export function toAdminUserRolePayload(roleIds: SnowflakeId[]) {
  return {
    roleIds: [...new Set(roleIds)],
  };
}
