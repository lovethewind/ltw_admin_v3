import type { SnowflakeId } from './types';

import { requestClient } from '#/api/request';

export interface AdminPicture {
  albumId: SnowflakeId;
  createTime: string;
  description?: null | string;
  height: number;
  id: SnowflakeId;
  size: number;
  status: number;
  thumbUrl: string;
  updateTime: string;
  url: string;
  userId: SnowflakeId;
  width: number;
}

export interface AdminPicturePage {
  current: number;
  pages: number;
  records: AdminPicture[];
  size: number;
  total: number;
}

export type AdminPicturePayload = Partial<
  Omit<AdminPicture, 'createTime' | 'id' | 'updateTime'>
>;

export async function getAdminPicturePageApi(params: {
  albumId?: null | SnowflakeId;
  current: number;
  keyword?: string;
  size: number;
  status?: null | number;
  userId?: null | SnowflakeId;
}) {
  return requestClient.get<AdminPicturePage>('/picture/list', {
    params,
  });
}

export async function getAdminPictureApi(pictureId: SnowflakeId) {
  return requestClient.get<AdminPicture>(`/picture/${pictureId}`);
}

export async function createAdminPictureApi(data: AdminPicturePayload) {
  return requestClient.post<AdminPicture>('/picture/create', data);
}

export async function updateAdminPictureApi(
  pictureId: SnowflakeId,
  data: AdminPicturePayload,
) {
  return requestClient.put<AdminPicture>(`/picture/${pictureId}`, data);
}

export async function updateAdminPictureStatusApi(
  pictureId: SnowflakeId,
  status: number,
) {
  return requestClient.put<AdminPicture>(`/picture/${pictureId}/status`, {
    status,
  });
}

export async function deleteAdminPictureApi(pictureId: SnowflakeId) {
  return requestClient.delete(`/picture/${pictureId}`);
}
