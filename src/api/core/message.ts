import type { SnowflakeId } from './types';

import { requestClient } from '#/api/request';

export interface AdminMessage {
  address: string;
  avatar?: null | string;
  content: string;
  createTime: string;
  email?: null | string;
  firstLevelId: SnowflakeId;
  id: SnowflakeId;
  nickname?: null | string;
  parentId: SnowflakeId;
  replyUserId: SnowflakeId;
  updateTime: string;
  userId: SnowflakeId;
}

export interface AdminMessagePage {
  current: number;
  pages: number;
  records: AdminMessage[];
  size: number;
  total: number;
}

export type AdminMessagePayload = Partial<
  Pick<AdminMessage, 'address' | 'avatar' | 'content' | 'email' | 'nickname'>
>;

export async function getAdminMessagePageApi(params: {
  current: number;
  keyword?: string;
  parentId?: null | number | string;
  size: number;
  userId?: null | number | string;
}) {
  return requestClient.get<AdminMessagePage>('/message/list', {
    params,
  });
}

export async function getAdminMessageApi(messageId: number | string) {
  return requestClient.get<AdminMessage>(`/message/${messageId}`);
}

export async function updateAdminMessageApi(
  messageId: number | string,
  data: AdminMessagePayload,
) {
  return requestClient.put<AdminMessage>(`/message/${messageId}`, data);
}

export async function deleteAdminMessageApi(messageId: number | string) {
  return requestClient.delete(`/message/${messageId}`);
}
