<script setup lang="ts">
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui';

import type { VNodeChild } from 'vue';

import type { AdminNotice, AdminNoticePayload, SnowflakeId } from '#/api';

import { computed, h, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  NButton,
  NCard,
  NDataTable,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NPagination,
  NSelect,
  NSpace,
  NSwitch,
  NTag,
  useMessage,
} from 'naive-ui';

import {
  deleteAdminNoticeApi,
  getAdminNoticeApi,
  getAdminNoticePageApi,
  updateAdminNoticeApi,
} from '#/api';

import { hasActionPermission } from '../../system/permission-actions';
import {
  booleanNumberOptions,
  getBooleanLabel,
  getOptionLabel,
  noticeTypeOptions,
} from '../operation-options';
const message = useMessage();
const accessStore = useAccessStore();
const loading = ref(false);
const modalVisible = ref(false);
const editingId = ref<AdminNotice['id']>();
const formRef = ref<FormInst | null>(null);
const records = ref<AdminNotice[]>([]);
const total = ref(0);
const query = reactive({
  current: 1,
  isRead: null as null | number,
  keyword: '',
  noticeType: null as null | number,
  size: 10,
  userId: null as null | SnowflakeId,
});
const form = reactive<AdminNoticePayload>({
  content: '',
  isRead: false,
  title: '',
});
const rules: FormRules = {
  title: { message: '请输入标题', required: true, trigger: 'blur' },
};
function canAccess(code: string) {
  return hasActionPermission(accessStore.accessCodes, code);
}
const columns = computed<DataTableColumns<AdminNotice>>(() => [
  { key: 'title', title: '标题', width: 180 },
  { key: 'content', title: '内容', width: 260, ellipsis: { tooltip: true } },
  {
    key: 'noticeType',
    title: '类型',
    width: 100,
    render: (row) => getOptionLabel(noticeTypeOptions, row.noticeType),
  },
  { key: 'userId', title: '用户 ID', width: 170 },
  {
    key: 'isRead',
    title: '已读',
    width: 90,
    render: (row) =>
      h(
        NTag,
        {
          bordered: false,
          size: 'small',
          type: row.isRead ? 'success' : 'warning',
        },
        { default: () => getBooleanLabel(row.isRead) },
      ),
  },
  { key: 'createTime', title: '创建时间', width: 170 },
  {
    fixed: 'right',
    key: 'actions',
    title: '操作',
    width: 170,
    render: (row) => {
      const actions: VNodeChild[] = [];
      if (canAccess('operation:notice:update'))
        actions.push(
          h(
            NButton,
            { size: 'small', onClick: () => openEdit(row) },
            { default: () => '编辑' },
          ),
        );
      if (canAccess('operation:notice:delete'))
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
    const page = await getAdminNoticePageApi({
      current: query.current,
      isRead: query.isRead === null ? null : Boolean(query.isRead),
      keyword: query.keyword || undefined,
      noticeType: query.noticeType,
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
async function openEdit(row: AdminNotice) {
  const detail = await getAdminNoticeApi(row.id);
  Object.assign(form, {
    content: detail.content,
    isRead: detail.isRead,
    title: detail.title,
  });
  editingId.value = detail.id;
  modalVisible.value = true;
}
async function handleSubmit() {
  await formRef.value?.validate();
  if (!editingId.value) return;
  await updateAdminNoticeApi(editingId.value, form);
  message.success('通知已更新');
  modalVisible.value = false;
  await loadData();
}
async function handleDelete(row: AdminNotice) {
  if (!window.confirm('确认删除该通知？')) return;
  await deleteAdminNoticeApi(row.id);
  message.success('通知已删除');
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
  <Page title="通知管理">
    <NCard :bordered="false">
      <NSpace align="center" class="mb-4" wrap>
        <NInput
          v-model:value="query.keyword"
          clearable
          placeholder="通知关键词"
          class="w-[220px]"
          @keyup.enter="handleSearch"
        /><NInput
          v-model:value="query.userId"
          clearable
          placeholder="用户 ID"
          class="w-[180px]"
          @keyup.enter="handleSearch"
        /><NSelect
          v-model:value="query.noticeType"
          :options="noticeTypeOptions"
          clearable
          placeholder="类型"
          class="w-[130px]"
        /><NSelect
          v-model:value="query.isRead"
          :options="booleanNumberOptions"
          clearable
          placeholder="已读"
          class="w-[120px]"
        /><NButton
          v-if="canAccess('operation:notice:query')"
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
        :scroll-x="1140"
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
</NCard><NModal
      v-model:show="modalVisible"
      preset="card"
      title="编辑通知"
      class="max-w-[620px]"
    >
      <NForm
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="left"
        label-width="90"
      >
        <NFormItem label="标题" path="title">
          <NInput v-model:value="form.title" />
</NFormItem><NFormItem label="内容">
          <NInput v-model:value="form.content" type="textarea" />
</NFormItem><NFormItem label="已读">
          <NSwitch v-model:value="form.isRead" />
        </NFormItem>
</NForm><template #footer>
        <NSpace justify="end">
          <NButton @click="modalVisible = false">取消</NButton><NButton type="primary" @click="handleSubmit">保存</NButton>
        </NSpace>
      </template>
    </NModal>
  </Page>
</template>
