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

/** 渲染文章状态分布图。 */
function renderChart(): void {
  renderEcharts({
    legend: {
      bottom: 0,
      left: 'center',
    },
    series: [
      {
        data: props.data,
        label: {
          formatter: '{b}: {c}',
        },
        radius: ['42%', '68%'],
        type: 'pie',
      },
    ],
    tooltip: {
      trigger: 'item',
    },
  });
}

onMounted(renderChart);
watch(() => props.data, renderChart, { deep: true });
</script>

<template>
  <EchartsUI ref="chartRef" class="h-[320px]" />
</template>
