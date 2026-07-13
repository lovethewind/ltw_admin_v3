import type { SnowflakeId } from './types';

import { requestClient } from '#/api/request';

export interface AdminNotice {
  content: string;
  createTime: string;
  detail: Record<string, unknown>;
  id: SnowflakeId;
  isRead: boolean;
  noticeType: number;
  title: string;
  updateTime: string;
  userId: SnowflakeId;
}

export interface AdminNoticePage {
  current: number;
  pages: number;
  records: AdminNotice[];
  size: number;
  total: number;
}

export type AdminNoticePayload = Partial<
  Pick<AdminNotice, 'content' | 'isRead' | 'title'>
>;

export async function getAdminNoticePageApi(params: {
  current: number;
  isRead?: boolean | null;
  keyword?: string;
  noticeType?: null | number;
  size: number;
  userId?: null | SnowflakeId;
}) {
  return requestClient.get<AdminNoticePage>('/notice/list', {
    params,
  });
}

export async function getAdminNoticeApi(noticeId: SnowflakeId) {
  return requestClient.get<AdminNotice>(`/notice/${noticeId}`);
}

export async function updateAdminNoticeApi(
  noticeId: SnowflakeId,
  data: AdminNoticePayload,
) {
  return requestClient.put<AdminNotice>(`/notice/${noticeId}`, data);
}

export async function deleteAdminNoticeApi(noticeId: SnowflakeId) {
  return requestClient.delete(`/notice/${noticeId}`);
}
