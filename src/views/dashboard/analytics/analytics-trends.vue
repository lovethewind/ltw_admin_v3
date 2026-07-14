<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import type { AnalyticsTrend } from '#/api';

import { onMounted, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

const props = defineProps<{
  data: AnalyticsTrend[];
}>();
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

/** 渲染近三十天增长趋势图。 */
function renderChart(): void {
  renderEcharts({
    grid: {
      bottom: 24,
      containLabel: true,
      left: 8,
      right: 20,
      top: 56,
    },
    legend: {
      data: ['新增用户', '新增文章', '新增评论'],
      left: 'center',
      top: 0,
    },
    series: [
      {
        areaStyle: { opacity: 0.12 },
        data: props.data.map((item) => item.users),
        itemStyle: {
          color: '#5ab1ef',
        },
        name: '新增用户',
        smooth: true,
        type: 'line',
      },
      {
        areaStyle: { opacity: 0.1 },
        data: props.data.map((item) => item.articles),
        itemStyle: {
          color: '#019680',
        },
        name: '新增文章',
        smooth: true,
        type: 'line',
      },
      {
        data: props.data.map((item) => item.comments),
        itemStyle: {
          color: '#f59e0b',
        },
        name: '新增评论',
        smooth: true,
        type: 'line',
      },
    ],
    tooltip: {
      axisPointer: {
        lineStyle: {
          color: '#019680',
          width: 1,
        },
      },
      trigger: 'axis',
    },
    xAxis: {
      axisTick: {
        show: false,
      },
      boundaryGap: false,
      data: props.data.map((item) => item.date.slice(5)),
      type: 'category',
    },
    yAxis: {
      axisTick: {
        show: false,
      },
      minInterval: 1,
      type: 'value',
    },
  });
}

onMounted(renderChart);
watch(() => props.data, renderChart, { deep: true });
</script>

<template>
  <EchartsUI ref="chartRef" class="h-[360px]" />
</template>
