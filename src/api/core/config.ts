import type { SnowflakeId } from './types';

import { requestClient } from '#/api/request';

export interface AdminConfig {
  createTime: string;
  description?: null | string;
  id: SnowflakeId;
  isActive: boolean;
  name: string;
  updateTime: string;
  value: string;
}

export interface AdminConfigPage {
  current: number;
  pages: number;
  records: AdminConfig[];
  size: number;
  total: number;
}

export type AdminConfigPayload = Omit<
  AdminConfig,
  'createTime' | 'id' | 'updateTime'
>;

export interface SearchAnalysisConfig {
  customWords: string[];
  hotSearchStopWords: string[];
  publishedAt?: null | string;
  stopWords: string[];
  version: number;
}

export interface SearchAnalysisState {
  draft: SearchAnalysisConfig;
  history: SearchAnalysisConfig[];
  published: SearchAnalysisConfig;
}

export interface SearchAnalysisPreview {
  filteredTokens: string[];
  tokens: string[];
}

export interface SearchIndexRebuildResult {
  documentCount: number;
  indexName: string;
}

export async function getAdminConfigPageApi(params: {
  current: number;
  isActive?: boolean | null;
  keyword?: string;
  size: number;
}) {
  return requestClient.get<AdminConfigPage>('/config/list', {
    params,
  });
}

export async function getAdminConfigApi(configId: SnowflakeId) {
  return requestClient.get<AdminConfig>(`/config/${configId}`);
}

export async function createAdminConfigApi(data: AdminConfigPayload) {
  return requestClient.post<AdminConfig>('/config/create', data);
}

export async function updateAdminConfigApi(
  configId: SnowflakeId,
  data: Partial<AdminConfigPayload>,
) {
  return requestClient.put<AdminConfig>(`/config/${configId}`, data);
}

export async function deleteAdminConfigApi(configId: SnowflakeId) {
  return requestClient.delete(`/config/${configId}`);
}

export async function getSearchAnalysisApi() {
  return requestClient.get<SearchAnalysisState>('/config/search-analysis');
}

export async function saveSearchAnalysisDraftApi(
  data: Pick<
    SearchAnalysisConfig,
    'customWords' | 'hotSearchStopWords' | 'stopWords'
  >,
) {
  return requestClient.put<SearchAnalysisState>(
    '/config/search-analysis/draft',
    data,
  );
}

export async function previewSearchAnalysisApi(data: {
  stopWords: string[];
  text: string;
}) {
  return requestClient.post<SearchAnalysisPreview>(
    '/config/search-analysis/preview',
    data,
  );
}

export async function publishSearchAnalysisApi() {
  return requestClient.post<SearchAnalysisState>(
    '/config/search-analysis/publish',
  );
}

export async function rebuildArticleSearchIndexApi() {
  return requestClient.post<SearchIndexRebuildResult>(
    '/config/search-analysis/rebuild-index',
  );
}
