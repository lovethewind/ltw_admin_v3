import type { SnowflakeId } from './types';

import { requestClient } from '#/api/request';

export interface AdminPictureAlbum {
  albumType: number;
  cover: string;
  createTime: string;
  description?: null | string;
  id: SnowflakeId;
  name: string;
  status: number;
  updateTime: string;
  userId: SnowflakeId;
}

export interface AdminPictureAlbumPage {
  current: number;
  pages: number;
  records: AdminPictureAlbum[];
  size: number;
  total: number;
}

export type AdminPictureAlbumPayload = Partial<
  Omit<AdminPictureAlbum, 'createTime' | 'id' | 'updateTime'>
>;

export async function getAdminPictureAlbumPageApi(params: {
  albumType?: null | number;
  current: number;
  keyword?: string;
  size: number;
  status?: null | number;
  userId?: null | SnowflakeId;
}) {
  return requestClient.get<AdminPictureAlbumPage>('/picture/album/list', {
    params,
  });
}

export async function getAdminPictureAlbumApi(albumId: SnowflakeId) {
  return requestClient.get<AdminPictureAlbum>(`/picture/album/${albumId}`);
}

export async function createAdminPictureAlbumApi(
  data: AdminPictureAlbumPayload,
) {
  return requestClient.post<AdminPictureAlbum>('/picture/album/create', data);
}

export async function updateAdminPictureAlbumApi(
  albumId: SnowflakeId,
  data: AdminPictureAlbumPayload,
) {
  return requestClient.put<AdminPictureAlbum>(
    `/picture/album/${albumId}`,
    data,
  );
}

export async function updateAdminPictureAlbumStatusApi(
  albumId: SnowflakeId,
  status: number,
) {
  return requestClient.put<AdminPictureAlbum>(
    `/picture/album/${albumId}/status`,
    { status },
  );
}

export async function deleteAdminPictureAlbumApi(albumId: SnowflakeId) {
  return requestClient.delete(`/picture/album/${albumId}`);
}
