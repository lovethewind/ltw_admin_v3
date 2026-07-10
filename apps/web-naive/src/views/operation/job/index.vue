<script setup lang="ts">
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui';

import type { VNodeChild } from 'vue';

import type { AdminJob, AdminJobPayload } from '#/api';

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
  createAdminJobApi,
  deleteAdminJobApi,
  getAdminJobApi,
  getAdminJobPageApi,
  updateAdminJobApi,
  updateAdminJobStatusApi,
} from '#/api';

import { hasActionPermission } from '../../system/permission-actions';
import {
  getJobStatusType,
  getOptionLabel,
  jobStatusOptions,
  misfirePolicyOptions,
} from '../operation-options';
const message = useMessage();
const accessStore = useAccessStore();
const loading = ref(false);
const modalVisible = ref(false);
const editingId = ref<AdminJob['id']>();
const formRef = ref<FormInst | null>(null);
const records = ref<AdminJob[]>([]);
const total = ref(0);
const query = reactive({
  current: 1,
  group: '',
  keyword: '',
  size: 10,
  status: null as null | number,
});
const defaultForm: AdminJobPayload = {
  concurrent: false,
  createUserId: '',
  cronExpression: '',
  description: '',
  group: 'DEFAULT',
  invokeTarget: '',
  misfirePolicy: 3,
  name: '',
  status: 2,
  updateUserId: null,
};
const form = reactive<AdminJobPayload>({ ...defaultForm });
const rules: FormRules = {
  createUserId: { message: '请输入创建者 ID', required: true, trigger: 'blur' },
  cronExpression: {
    message: '请输入 cron 表达式',
    required: true,
    trigger: 'blur',
  },
  invokeTarget: { message: '请输入调用目标', required: true, trigger: 'blur' },
  name: { message: '请输入任务名称', required: true, trigger: 'blur' },
};
function canAccess(code: string) {
  return hasActionPermission(accessStore.accessCodes, code);
}
const columns = computed<DataTableColumns<AdminJob>>(() => [
  { key: 'name', title: '任务名称', width: 160 },
  { key: 'group', title: '任务组', width: 110 },
  {
    key: 'invokeTarget',
    title: '调用目标',
    width: 240,
    ellipsis: { tooltip: true },
  },
  { key: 'cronExpression', title: 'Cron', width: 160 },
  {
    key: 'status',
    title: '状态',
    width: 90,
    render: (row) =>
      h(
        NTag,
        { bordered: false, size: 'small', type: getJobStatusType(row.status) },
        { default: () => getOptionLabel(jobStatusOptions, row.status) },
      ),
  },
  { key: 'createUserId', title: '创建者 ID', width: 170 },
  { key: 'createTime', title: '创建时间', width: 170 },
  {
    fixed: 'right',
    key: 'actions',
    title: '操作',
    width: 230,
    render: (row) => {
      const actions: VNodeChild[] = [];
      if (canAccess('operation:job:update'))
        actions.push(
          h(
            NButton,
            { size: 'small', onClick: () => openEdit(row) },
            { default: () => '编辑' },
          ),
        );
      if (canAccess('operation:job:status'))
        actions.push(
          h(
            NButton,
            {
              size: 'small',
              type: row.status === 1 ? 'warning' : 'primary',
              onClick: () => handleStatus(row, row.status === 1 ? 2 : 1),
            },
            { default: () => (row.status === 1 ? '暂停' : '启用') },
          ),
        );
      if (canAccess('operation:job:delete'))
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
function resetForm() {
  Object.assign(form, { ...defaultForm });
  editingId.value = undefined;
}
async function loadData() {
  loading.value = true;
  try {
    const page = await getAdminJobPageApi({
      current: query.current,
      group: query.group || undefined,
      keyword: query.keyword || undefined,
      size: query.size,
      status: query.status,
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
function openCreate() {
  resetForm();
  modalVisible.value = true;
}
async function openEdit(row: AdminJob) {
  resetForm();
  const detail = await getAdminJobApi(row.id);
  Object.assign(form, detail);
  editingId.value = detail.id;
  modalVisible.value = true;
}
async function handleSubmit() {
  await formRef.value?.validate();
  if (editingId.value) {
    await updateAdminJobApi(editingId.value, form);
    message.success('定时任务已更新');
  } else {
    await createAdminJobApi(form);
    message.success('定时任务已创建');
  }
  modalVisible.value = false;
  await loadData();
}
async function handleStatus(row: AdminJob, status: number) {
  await updateAdminJobStatusApi(row.id, status);
  message.success('任务状态已更新');
  await loadData();
}
async function handleDelete(row: AdminJob) {
  if (!window.confirm(`确认删除“${row.name}”？`)) return;
  await deleteAdminJobApi(row.id);
  message.success('定时任务已删除');
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
  <Page title="定时任务">
    <NCard :bordered="false">
      <div class="admin-filter-toolbar mb-4">
        <NSpace align="center" class="admin-filter-fields" wrap>
          <NInput
            v-model:value="query.keyword"
            clearable
            placeholder="任务关键词"
            class="w-[200px]"
            @keyup.enter="handleSearch"
          /><NInput
            v-model:value="query.group"
            clearable
            placeholder="任务组"
            class="w-[160px]"
            @keyup.enter="handleSearch"
          /><NSelect
            v-model:value="query.status"
            :options="jobStatusOptions"
            clearable
            placeholder="状态"
            class="w-[130px]"
          /><NButton
            v-if="canAccess('operation:job:query')"
            type="primary"
            @click="handleSearch"
          >
            查询
          </NButton>
        </NSpace>
        <div class="admin-filter-actions">
          <NButton
            v-if="canAccess('operation:job:create')"
            type="primary"
            @click="openCreate"
          >
            新增任务
          </NButton>
        </div>
      </div>
      <NDataTable
        :columns="columns"
        :data="records"
        :loading="loading"
        :row-key="(row) => row.id"
        :scroll-x="1280"
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
      :title="editingId ? '编辑任务' : '新增任务'"
      class="max-w-[720px]"
    >
      <NForm
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="left"
        label-width="120"
      >
        <NFormItem label="任务名称" path="name">
          <NInput v-model:value="form.name" />
</NFormItem><NFormItem label="任务组">
          <NInput v-model:value="form.group" />
</NFormItem><NFormItem label="调用目标" path="invokeTarget">
          <NInput v-model:value="form.invokeTarget" />
</NFormItem><NFormItem label="Cron" path="cronExpression">
          <NInput v-model:value="form.cronExpression" />
</NFormItem><NFormItem label="错过策略">
          <NSelect
            v-model:value="form.misfirePolicy"
            :options="misfirePolicyOptions"
          />
</NFormItem><NFormItem label="允许并发">
          <NSwitch v-model:value="form.concurrent" />
</NFormItem><NFormItem label="状态">
          <NSelect
            v-model:value="form.status"
            :options="jobStatusOptions"
          />
</NFormItem><NFormItem label="创建者 ID" path="createUserId">
          <NInput v-model:value="form.createUserId" />
</NFormItem><NFormItem label="说明">
          <NInput v-model:value="form.description" type="textarea" />
        </NFormItem>
</NForm><template #footer>
        <NSpace justify="end">
          <NButton @click="modalVisible = false">取消</NButton><NButton type="primary" @click="handleSubmit">保存</NButton>
        </NSpace>
      </template>
    </NModal>
  </Page>
</template>
