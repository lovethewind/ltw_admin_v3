<script setup lang="ts">
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui';

import type { VNodeChild } from 'vue';

import type {
  AdminUserRestriction,
  AdminUserRestrictionPayload,
  SnowflakeId,
} from '#/api';

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
  cancelAdminUserRestrictionApi,
  createAdminUserRestrictionApi,
  deleteAdminUserRestrictionApi,
  getAdminUserRestrictionPageApi,
  updateAdminUserRestrictionApi,
} from '#/api';

import { hasActionPermission } from '../../system/permission-actions';
import {
  booleanNumberOptions,
  getBooleanLabel,
  getOptionLabel,
  restrictTypeOptions,
} from '../operation-options';
const message = useMessage();
const accessStore = useAccessStore();
const loading = ref(false);
const modalVisible = ref(false);
const editingId = ref<AdminUserRestriction['id']>();
const formRef = ref<FormInst | null>(null);
const records = ref<AdminUserRestriction[]>([]);
const total = ref(0);
const query = reactive({
  current: 1,
  isCancel: null as null | number,
  restrictType: null as null | number,
  size: 10,
  userId: null as null | SnowflakeId,
});
const form = reactive<AdminUserRestrictionPayload>({
  endTime: null,
  isForever: false,
  reason: '',
  restrictType: 1,
  startTime: null,
  userId: '',
});
const rules: FormRules = {
  restrictType: {
    message: '请选择限制类型',
    required: true,
    trigger: 'change',
  },
  userId: { message: '请输入用户 ID', required: true, trigger: 'blur' },
};
function canAccess(code: string) {
  return hasActionPermission(accessStore.accessCodes, code);
}
const columns = computed<DataTableColumns<AdminUserRestriction>>(() => [
  { key: 'userId', title: '用户 ID', width: 170 },
  {
    key: 'restrictType',
    title: '限制类型',
    width: 100,
    render: (row) => getOptionLabel(restrictTypeOptions, row.restrictType),
  },
  {
    key: 'isForever',
    title: '永久',
    width: 80,
    render: (row) => getBooleanLabel(row.isForever),
  },
  {
    key: 'isCancel',
    title: '已解除',
    width: 90,
    render: (row) =>
      h(
        NTag,
        {
          bordered: false,
          size: 'small',
          type: row.isCancel ? 'success' : 'warning',
        },
        { default: () => getBooleanLabel(row.isCancel) },
      ),
  },
  { key: 'reason', title: '原因', width: 220, ellipsis: { tooltip: true } },
  { key: 'createTime', title: '创建时间', width: 170 },
  {
    fixed: 'right',
    key: 'actions',
    title: '操作',
    width: 240,
    render: (row) => {
      const actions: VNodeChild[] = [];
      if (canAccess('restriction:update'))
        actions.push(
          h(
            NButton,
            { size: 'small', onClick: () => openEdit(row) },
            { default: () => '编辑' },
          ),
        );
      if (canAccess('restriction:cancel') && !row.isCancel)
        actions.push(
          h(
            NButton,
            {
              size: 'small',
              type: 'primary',
              onClick: () => handleCancel(row),
            },
            { default: () => '解除' },
          ),
        );
      if (canAccess('restriction:delete'))
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
  Object.assign(form, {
    endTime: null,
    isForever: false,
    reason: '',
    restrictType: 1,
    startTime: null,
    userId: '',
  });
  editingId.value = undefined;
}
async function loadData() {
  loading.value = true;
  try {
    const page = await getAdminUserRestrictionPageApi({
      current: query.current,
      isCancel: query.isCancel === null ? null : Boolean(query.isCancel),
      restrictType: query.restrictType,
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
function openCreate() {
  resetForm();
  modalVisible.value = true;
}
function openEdit(row: AdminUserRestriction) {
  resetForm();
  Object.assign(form, {
    endTime: row.endTime,
    isForever: row.isForever,
    reason: row.reason ?? '',
    restrictType: row.restrictType,
    startTime: row.startTime,
    userId: row.userId,
  });
  editingId.value = row.id;
  modalVisible.value = true;
}
async function handleSubmit() {
  await formRef.value?.validate();
  if (editingId.value) {
    await updateAdminUserRestrictionApi(editingId.value, form);
    message.success('用户限制已更新');
  } else {
    await createAdminUserRestrictionApi(form);
    message.success('用户限制已创建');
  }
  modalVisible.value = false;
  await loadData();
}
async function handleCancel(row: AdminUserRestriction) {
  const cancelReason = window.prompt('请输入解除原因') ?? '';
  await cancelAdminUserRestrictionApi(row.id, cancelReason);
  message.success('用户限制已解除');
  await loadData();
}
async function handleDelete(row: AdminUserRestriction) {
  if (!window.confirm('确认删除该用户限制？')) return;
  await deleteAdminUserRestrictionApi(row.id);
  message.success('用户限制已删除');
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
  <Page title="用户限制">
    <NCard :bordered="false">
      <div class="admin-filter-toolbar mb-4">
        <NSpace align="center" class="admin-filter-fields" wrap>
          <NInput
            v-model:value="query.userId"
            clearable
            placeholder="用户 ID"
            class="w-[180px]"
            @keyup.enter="handleSearch"
          /><NSelect
            v-model:value="query.restrictType"
            :options="restrictTypeOptions"
            clearable
            placeholder="限制类型"
            class="w-[130px]"
          /><NSelect
            v-model:value="query.isCancel"
            :options="booleanNumberOptions"
            clearable
            placeholder="已解除"
            class="w-[120px]"
          /><NButton
            v-if="canAccess('restriction:query')"
            type="primary"
            @click="handleSearch"
          >
            查询
          </NButton>
        </NSpace>
        <div class="admin-filter-actions">
          <NButton
            v-if="canAccess('restriction:create')"
            type="primary"
            @click="openCreate"
          >
            新增限制
          </NButton>
        </div>
      </div>
      <NDataTable
        :columns="columns"
        :data="records"
        :loading="loading"
        :row-key="(row) => row.id"
        :scroll-x="1160"
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
      :title="editingId ? '编辑限制' : '新增限制'"
      class="max-w-[620px]"
    >
      <NForm
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="left"
        label-width="100"
      >
        <NFormItem label="用户 ID" path="userId">
          <NInput
            v-model:value="form.userId"
            :disabled="Boolean(editingId)"
          />
</NFormItem><NFormItem label="限制类型" path="restrictType">
          <NSelect
            v-model:value="form.restrictType"
            :options="restrictTypeOptions"
          />
</NFormItem><NFormItem label="永久限制">
          <NSwitch v-model:value="form.isForever" />
</NFormItem><NFormItem label="开始时间">
          <NInput
            v-model:value="form.startTime"
            placeholder="YYYY-MM-DD HH:mm:ss"
          />
</NFormItem><NFormItem label="结束时间">
          <NInput
            v-model:value="form.endTime"
            placeholder="YYYY-MM-DD HH:mm:ss"
          />
</NFormItem><NFormItem label="原因">
          <NInput v-model:value="form.reason" type="textarea" />
        </NFormItem>
</NForm><template #footer>
        <NSpace justify="end">
          <NButton @click="modalVisible = false">取消</NButton><NButton type="primary" @click="handleSubmit">保存</NButton>
        </NSpace>
      </template>
    </NModal>
  </Page>
</template>
