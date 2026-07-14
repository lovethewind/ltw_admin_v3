<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import type { AnalyticsNameValue } from '#/api';

import { onMounted, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

const props = defineProps<{
  data: AnalyticsNameValue[];
}>();

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

/** 渲染文章分类分布图。 */
function renderChart(): void {
  renderEcharts({
    grid: {
      bottom: 8,
      containLabel: true,
      left: 8,
      right: 20,
      top: 8,
    },
    series: [
      {
        barMaxWidth: 28,
        data: props.data.map((item) => item.value),
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: '#5ab1ef',
        },
        type: 'bar',
      },
    ],
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      minInterval: 1,
      type: 'value',
    },
    yAxis: {
      axisTick: {
        show: false,
      },
      data: props.data.map((item) => item.name),
      type: 'category',
    },
  });
}

onMounted(renderChart);
watch(() => props.data, renderChart, { deep: true });
</script>

<template>
  <EchartsUI ref="chartRef" class="h-[320px]" />
</template>
