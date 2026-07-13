import type { SnowflakeId } from './types';

import { requestClient } from '#/api/request';

export interface AdminJob {
  concurrent: boolean;
  createTime: string;
  createUserId: SnowflakeId;
  cronExpression: string;
  description?: null | string;
  group: string;
  id: SnowflakeId;
  invokeTarget: string;
  misfirePolicy: number;
  name: string;
  status: number;
  updateTime: string;
  updateUserId?: null | SnowflakeId;
}

export interface AdminJobPage {
  current: number;
  pages: number;
  records: AdminJob[];
  size: number;
  total: number;
}

export type AdminJobPayload = Partial<
  Omit<AdminJob, 'createTime' | 'id' | 'updateTime'>
>;

export async function getAdminJobPageApi(params: {
  current: number;
  group?: string;
  keyword?: string;
  size: number;
  status?: null | number;
}) {
  return requestClient.get<AdminJobPage>('/job/list', {
    params,
  });
}

export async function getAdminJobApi(jobId: SnowflakeId) {
  return requestClient.get<AdminJob>(`/job/${jobId}`);
}

export async function createAdminJobApi(data: AdminJobPayload) {
  return requestClient.post<AdminJob>('/job/create', data);
}

export async function updateAdminJobApi(
  jobId: SnowflakeId,
  data: AdminJobPayload,
) {
  return requestClient.put<AdminJob>(`/job/${jobId}`, data);
}

export async function updateAdminJobStatusApi(
  jobId: SnowflakeId,
  status: number,
) {
  return requestClient.put<AdminJob>(`/job/${jobId}/status`, {
    status,
  });
}

export async function deleteAdminJobApi(jobId: SnowflakeId) {
  return requestClient.delete(`/job/${jobId}`);
}
