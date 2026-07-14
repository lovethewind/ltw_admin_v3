import type { SnowflakeId } from './types';

import { requestClient } from '#/api/request';

export interface AdminComment {
  content: string;
  createTime: string;
  firstLevelId: SnowflakeId;
  id: SnowflakeId;
  objContent?: null | string;
  objId: SnowflakeId;
  objType: number;
  parentContent?: null | string;
  parentId: SnowflakeId;
  replyUserId: SnowflakeId;
  status: number;
  updateTime: string;
  user?: AdminCommentUser | null;
  userId: SnowflakeId;
}

export interface AdminCommentUser {
  avatar?: null | string;
  id: SnowflakeId;
  nickname: string;
  uid: SnowflakeId;
  username: string;
}

export interface AdminCommentPage {
  current: number;
  pages: number;
  records: AdminComment[];
  size: number;
  total: number;
}

export type AdminCommentPayload = Partial<
  Pick<AdminComment, 'content' | 'status'>
>;

export async function getAdminCommentPageApi(params: {
  current: number;
  keyword?: string;
  objId?: null | number | string;
  objType?: null | number;
  size: number;
  status?: null | number;
  userId?: null | number | string;
}) {
  return requestClient.get<AdminCommentPage>('/comment/list', {
    params,
  });
}

export async function getAdminCommentApi(commentId: number | string) {
  return requestClient.get<AdminComment>(`/comment/${commentId}`);
}

export async function updateAdminCommentApi(
  commentId: number | string,
  data: AdminCommentPayload,
) {
  return requestClient.put<AdminComment>(`/comment/${commentId}`, data);
}

export async function updateAdminCommentStatusApi(
  commentId: number | string,
  status: number,
) {
  return requestClient.put<AdminComment>(`/comment/${commentId}/status`, {
    status,
  });
}

export async function deleteAdminCommentApi(commentId: number | string) {
  return requestClient.delete(`/comment/${commentId}`);
}
