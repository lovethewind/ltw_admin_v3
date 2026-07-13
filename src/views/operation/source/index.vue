<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui';

import type { VNodeChild } from 'vue';

import type { AdminSource, SnowflakeId } from '#/api';

import { computed, h, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  NButton,
  NCard,
  NDataTable,
  NInput,
  NPagination,
  NSelect,
  NSpace,
  NTag,
  useMessage,
} from 'naive-ui';

import {
  deleteAdminSourceApi,
  getAdminSourcePageApi,
  updateAdminSourceApi,
} from '#/api';

import { hasActionPermission } from '../../system/permission-actions';
import { booleanNumberOptions, getBooleanLabel } from '../operation-options';
const message = useMessage();
const accessStore = useAccessStore();
const loading = ref(false);
const records = ref<AdminSource[]>([]);
const total = ref(0);
const query = reactive({
  current: 1,
  isDeleted: null as null | number,
  keyword: '',
  size: 10,
  userId: null as null | SnowflakeId,
});
function canAccess(code: string) {
  return hasActionPermission(accessStore.accessCodes, code);
}
const columns = computed<DataTableColumns<AdminSource>>(() => [
  { key: 'url', title: '资源地址', width: 360, ellipsis: { tooltip: true } },
  { key: 'userId', title: '用户 ID', width: 170 },
  {
    key: 'isDeleted',
    title: '已删除',
    width: 100,
    render: (row) =>
      h(
        NTag,
        {
          bordered: false,
          size: 'small',
          type: row.isDeleted ? 'error' : 'success',
        },
        { default: () => getBooleanLabel(row.isDeleted) },
      ),
  },
  { key: 'createTime', title: '创建时间', width: 170 },
  {
    fixed: 'right',
    key: 'actions',
    title: '操作',
    width: 180,
    render: (row) => {
      const actions: VNodeChild[] = [];
      if (canAccess('source:update'))
        actions.push(
          h(
            NButton,
            {
              size: 'small',
              type: row.isDeleted ? 'primary' : 'warning',
              onClick: () => handleStatus(row, !row.isDeleted),
            },
            { default: () => (row.isDeleted ? '恢复' : '标记删除') },
          ),
        );
      if (canAccess('source:delete'))
        actions.push(
          h(
            NButton,
            { size: 'small', type: 'error', onClick: () => handleDelete(row) },
            { default: () => '删除' },
          ),
        );
      return actions.length > 0
        ? h(NSpace, { size: 8 }, { default: () => actions })
        : '-';
    },
  },
]);
async function loadData() {
  loading.value = true;
  try {
    const page = await getAdminSourcePageApi({
      current: query.current,
      isDeleted: query.isDeleted === null ? null : Boolean(query.isDeleted),
      keyword: query.keyword || undefined,
      size: query.size,
      userId: query.userId,
    });
    records.value = page.records;
    total.value = page.total;
  } finally {
    loading.value = false;
  }
}
function handleSearch() {
  query.current = 1;
  void loadData();
}
async function handleStatus(row: AdminSource, isDeleted: boolean) {
  await updateAdminSourceApi(row.id, { isDeleted });
  message.success('资源状态已更新');
  await loadData();
}
async function handleDelete(row: AdminSource) {
  if (!window.confirm('确认删除该资源记录？')) return;
  await deleteAdminSourceApi(row.id);
  message.success('资源已删除');
  await loadData();
}
function handlePageChange(page: number) {
  query.current = page;
  void loadData();
}
function handlePageSizeChange(size: number) {
  query.size = size;
  query.current = 1;
  void loadData();
}
onMounted(loadData);
</script>
<template>
  <Page title="资源管理">
    <NCard :bordered="false">
      <NSpace align="center" class="mb-4" wrap>
        <NInput
          v-model:value="query.keyword"
          clearable
          placeholder="资源地址关键词"
          class="w-[240px]"
          @keyup.enter="handleSearch"
        /><NInput
          v-model:value="query.userId"
          clearable
          placeholder="用户 ID"
          class="w-[180px]"
          @keyup.enter="handleSearch"
        /><NSelect
          v-model:value="query.isDeleted"
          :options="booleanNumberOptions"
          clearable
          placeholder="是否删除"
          class="w-[130px]"
        /><NButton
          v-if="canAccess('source:query')"
          type="primary"
          @click="handleSearch"
        >
          查询
        </NButton>
</NSpace><NDataTable
        :columns="columns"
        :data="records"
        :loading="loading"
        :row-key="(row) => row.id"
        :scroll-x="980"
      /><NSpace justify="end" class="mt-4">
        <NPagination
          :item-count="total"
          :page="query.current"
          :page-size="query.size"
          :page-sizes="[10, 20, 50]"
          show-size-picker
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </NSpace>
    </NCard>
  </Page>
</template>
