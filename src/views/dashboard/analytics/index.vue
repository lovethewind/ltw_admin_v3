<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui';

import type { AnalysisOverviewItem } from '@vben/common-ui';

import type { AnalyticsData, AnalyticsHotArticle } from '#/api';

import { computed, onMounted, ref } from 'vue';

import { AnalysisChartCard, AnalysisOverview } from '@vben/common-ui';
import {
  SvgBellIcon,
  SvgCakeIcon,
  SvgCardIcon,
  SvgDownloadIcon,
} from '@vben/icons';

import { NDataTable, NSpin } from 'naive-ui';

import { getAnalyticsApi } from '#/api';

import AnalyticsCategoryDistribution from './analytics-category-distribution.vue';
import AnalyticsContentStatus from './analytics-content-status.vue';
import AnalyticsTrends from './analytics-trends.vue';

const loading = ref(false);
const analytics = ref<AnalyticsData>();

const overviewItems = computed<AnalysisOverviewItem[]>(() => {
  const overview = analytics.value?.overview;
  return [
    {
      icon: SvgCardIcon,
      title: '今日新增用户',
      totalTitle: '用户总数',
      totalValue: overview?.totalUsers ?? 0,
      value: overview?.todayUsers ?? 0,
    },
    {
      icon: SvgCakeIcon,
      title: '待审核文章',
      totalTitle: '已发布文章',
      totalValue: overview?.publishedArticles ?? 0,
      value: overview?.pendingArticles ?? 0,
    },
    {
      icon: SvgBellIcon,
      title: '待审核评论',
      totalTitle: '评论总数',
      totalValue: overview?.totalComments ?? 0,
      value: overview?.pendingComments ?? 0,
    },
    {
      icon: SvgDownloadIcon,
      title: '累计访问量',
      totalTitle: '累计互动量',
      totalValue: overview?.totalInteractions ?? 0,
      value: overview?.totalViews ?? 0,
    },
  ];
});

const hotArticleColumns: DataTableColumns<AnalyticsHotArticle> = [
  {
    ellipsis: { tooltip: true },
    key: 'title',
    minWidth: 220,
    title: '文章标题',
  },
  { key: 'author', minWidth: 120, title: '作者' },
  { key: 'views', width: 90, title: '访问' },
  { key: 'likes', width: 90, title: '点赞' },
  { key: 'collects', width: 90, title: '收藏' },
  { key: 'comments', width: 90, title: '评论' },
];

const pendingItems = computed(() => {
  const pending = analytics.value?.pending;
  return [
    { label: '待审核文章', value: pending?.articles ?? 0 },
    { label: '待审核评论', value: pending?.comments ?? 0 },
    { label: '待审核图片', value: pending?.pictures ?? 0 },
    { label: '待审核友链', value: pending?.links ?? 0 },
    { label: '封禁用户', value: pending?.bannedUsers ?? 0 },
    { label: '禁言用户', value: pending?.mutedUsers ?? 0 },
  ];
});

/** 加载后台运营分析数据。 */
async function loadAnalytics(): Promise<void> {
  loading.value = true;
  try {
    analytics.value = await getAnalyticsApi();
  } finally {
    loading.value = false;
  }
}

onMounted(loadAnalytics);
</script>

<template>
  <NSpin :show="loading">
    <div class="p-5">
      <AnalysisOverview :items="overviewItems" />

      <AnalysisChartCard class="mt-5" title="近 30 天增长趋势">
        <AnalyticsTrends :data="analytics?.trends ?? []" />
      </AnalysisChartCard>

      <div class="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <AnalysisChartCard title="文章状态分布">
          <AnalyticsContentStatus :data="analytics?.articleStatuses ?? []" />
        </AnalysisChartCard>
        <AnalysisChartCard title="文章分类分布">
          <AnalyticsCategoryDistribution :data="analytics?.categories ?? []" />
        </AnalysisChartCard>
      </div>

      <div class="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <AnalysisChartCard class="xl:col-span-2" title="热门文章排行">
          <NDataTable
            :columns="hotArticleColumns"
            :data="analytics?.hotArticles ?? []"
            :pagination="false"
            :scroll-x="700"
          />
        </AnalysisChartCard>

        <AnalysisChartCard title="待处理事项">
          <div class="grid grid-cols-2 gap-4">
            <div
              v-for="item in pendingItems"
              :key="item.label"
              class="rounded-lg border p-4"
            >
              <div class="text-sm text-muted-foreground">
                {{ item.label }}
              </div>
              <div class="mt-2 text-2xl font-semibold">
                {{ item.value.toLocaleString() }}
              </div>
            </div>
          </div>
        </AnalysisChartCard>
      </div>
    </div>
  </NSpin>
</template>
