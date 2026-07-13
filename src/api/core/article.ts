import type { SnowflakeId } from './types';

import { requestClient } from '#/api/request';

export interface AdminArticle {
  author?: AdminArticleAuthor | null;
  attachList: Array<Record<string, unknown>>;
  categoryId: SnowflakeId;
  content: string;
  cover: string;
  coverThumb: string;
  createTime: string;
  editTime?: null | string;
  id: SnowflakeId;
  isDeleted: boolean;
  isMarkdown: boolean;
  isOriginal: boolean;
  originalUrl: string;
  status: number;
  tagList: SnowflakeId[];
  title: string;
  updateTime: string;
  userId: SnowflakeId;
}

export interface AdminArticleAuthor {
  address?: null | string;
  avatar?: null | string;
  email?: null | string;
  gender: number;
  id: SnowflakeId;
  lastLoginTime?: null | string;
  mobile?: null | string;
  nickname: string;
  registerTime: string;
  summary?: null | string;
  uid: SnowflakeId;
  username: string;
}

export interface AdminArticlePage {
  current: number;
  pages: number;
  records: AdminArticle[];
  size: number;
  total: number;
}

export type AdminArticlePayload = Partial<
  Omit<
    AdminArticle,
    'createTime' | 'editTime' | 'id' | 'isDeleted' | 'updateTime'
  >
>;

export async function getAdminArticlePageApi(params: {
  categoryId?: null | number | string;
  current: number;
  isOriginal?: boolean | null;
  keyword?: string;
  size: number;
  status?: null | number;
  userId?: null | number | string;
}) {
  return requestClient.get<AdminArticlePage>('/article/list', {
    params,
  });
}

export async function getAdminArticleApi(articleId: number | string) {
  return requestClient.get<AdminArticle>(`/article/${articleId}`);
}

export async function createAdminArticleApi(data: AdminArticlePayload) {
  return requestClient.post<AdminArticle>('/article/create', data);
}

export async function updateAdminArticleApi(
  articleId: number | string,
  data: AdminArticlePayload,
) {
  return requestClient.put<AdminArticle>(`/article/${articleId}`, data);
}

export async function updateAdminArticleStatusApi(
  articleId: number | string,
  status: number,
) {
  return requestClient.put<AdminArticle>(`/article/${articleId}/status`, {
    status,
  });
}

export async function deleteAdminArticleApi(articleId: number | string) {
  return requestClient.delete(`/article/${articleId}`);
}
