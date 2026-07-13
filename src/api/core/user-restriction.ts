import type { SnowflakeId } from './types';

import { requestClient } from '#/api/request';

export interface AdminUserRestriction {
  cancelReason?: null | string;
  cancelTime?: null | string;
  createTime: string;
  endTime?: null | string;
  id: SnowflakeId;
  isCancel: boolean;
  isForever: boolean;
  reason?: null | string;
  restrictType: number;
  startTime?: null | string;
  updateTime: string;
  userId: SnowflakeId;
}

export interface AdminUserRestrictionPage {
  current: number;
  pages: number;
  records: AdminUserRestriction[];
  size: number;
  total: number;
}

export type AdminUserRestrictionPayload = Partial<
  Omit<AdminUserRestriction, 'createTime' | 'id' | 'updateTime'>
>;

export async function getAdminUserRestrictionPageApi(params: {
  current: number;
  isCancel?: boolean | null;
  restrictType?: null | number;
  size: number;
  userId?: null | SnowflakeId;
}) {
  return requestClient.get<AdminUserRestrictionPage>('/restriction/list', {
    params,
  });
}

export async function createAdminUserRestrictionApi(
  data: AdminUserRestrictionPayload,
) {
  return requestClient.post<AdminUserRestriction>('/restriction/create', data);
}

export async function updateAdminUserRestrictionApi(
  restrictionId: SnowflakeId,
  data: AdminUserRestrictionPayload,
) {
  return requestClient.put<AdminUserRestriction>(
    `/restriction/${restrictionId}`,
    data,
  );
}

export async function cancelAdminUserRestrictionApi(
  restrictionId: SnowflakeId,
  cancelReason?: string,
) {
  return requestClient.put<AdminUserRestriction>(
    `/restriction/${restrictionId}/cancel`,
    { cancelReason },
  );
}

export async function deleteAdminUserRestrictionApi(
  restrictionId: SnowflakeId,
) {
  return requestClient.delete(`/restriction/${restrictionId}`);
}
