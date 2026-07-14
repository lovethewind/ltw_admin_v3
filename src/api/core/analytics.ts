import type { SnowflakeId } from './types';

import { requestClient } from '#/api/request';

export interface AnalyticsOverview {
  pendingArticles: number;
  pendingComments: number;
  publishedArticles: number;
  todayUsers: number;
  totalComments: number;
  totalInteractions: number;
  totalUsers: number;
  totalViews: number;
}

export interface AnalyticsTrend {
  articles: number;
  comments: number;
  date: string;
  users: number;
}

export interface AnalyticsNameValue {
  name: string;
  value: number;
}

export interface AnalyticsHotArticle {
  author: string;
  collects: number;
  comments: number;
  id: SnowflakeId;
  likes: number;
  title: string;
  views: number;
}

export interface AnalyticsPending {
  articles: number;
  bannedUsers: number;
  comments: number;
  links: number;
  mutedUsers: number;
  pictures: number;
}

export interface AnalyticsData {
  articleStatuses: AnalyticsNameValue[];
  categories: AnalyticsNameValue[];
  hotArticles: AnalyticsHotArticle[];
  overview: AnalyticsOverview;
  pending: AnalyticsPending;
  trends: AnalyticsTrend[];
}

/**
 * 获取后台运营分析数据。
 *
 * @returns 后台运营分析数据
 */
export async function getAnalyticsApi(): Promise<AnalyticsData> {
  return requestClient.get<AnalyticsData>('/analytics/overview');
}
