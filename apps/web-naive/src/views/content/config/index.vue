<script setup lang="ts">
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui';

import type { VNodeChild } from 'vue';

import type { AdminConfig, AdminConfigPayload } from '#/api';

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
  createAdminConfigApi,
  deleteAdminConfigApi,
  getAdminConfigApi,
  getAdminConfigPageApi,
  updateAdminConfigApi,
} from '#/api';

import { hasActionPermission } from '../../system/permission-actions';

const activeOptions = [
  { label: '启用', value: 1 },
  { label: '停用', value: 0 },
];

const message = useMessage();
const accessStore = useAccessStore();
const loading = ref(false);
const modalVisible = ref(false);
const editingId = ref<AdminConfig['id']>();
const formRef = ref<FormInst | null>(null);
const configs = ref<AdminConfig[]>([]);
const total = ref(0);

const query = reactive({
  current: 1,
  isActive: null as null | number,
  keyword: '',
  size: 10,
});

const defaultForm: AdminConfigPayload = {
  description: '',
  isActive: false,
  name: '',
  value: '',
};

const form = reactive<AdminConfigPayload>({ ...defaultForm });

const rules: FormRules = {
  name: { message: '请输入配置 key', required: true, trigger: 'blur' },
  value: { message: '请输入配置 value', required: true, trigger: 'blur' },
};

function canAccess(code: string) {
  return hasActionPermission(accessStore.accessCodes, code);
}

const columns = computed<DataTableColumns<AdminConfig>>(() => [
  { key: 'name', title: '配置 key', width: 180 },
  {
    key: 'value',
    title: '配置 value',
    width: 260,
    ellipsis: { tooltip: true },
  },
  {
    key: 'description',
    render: (row) => row.description || '-',
    title: '配置说明',
    width: 240,
    ellipsis: { tooltip: true },
  },
  {
    key: 'isActive',
    render: (row) =>
      h(
        NTag,
        {
          bordered: false,
          size: 'small',
          type: row.isActive ? 'success' : 'default',
        },
        { default: () => (row.isActive ? '启用' : '停用') },
      ),
    title: '状态',
    width: 100,
  },
  { key: 'createTime', title: '创建时间', width: 170 },
  {
    fixed: 'right',
    key: 'actions',
    render: (row) => {
      const actions: VNodeChild[] = [];
      if (canAccess('content:config:update')) {
        actions.push(
          h(
            NButton,
            { size: 'small', onClick: () => openEdit(row) },
            { default: () => '编辑' },
          ),
        );
      }
      if (canAccess('content:config:delete')) {
        actions.push(
          h(
            NButton,
            { size: 'small', type: 'error', onClick: () => handleDelete(row) },
            { default: () => '删除' },
          ),
        );
      }
      return actions.length > 0
        ? h(NSpace, { size: 8 }, { default: () => actions })
        : '-';
    },
    title: '操作',
    width: 140,
  },
]);

function resetForm() {
  Object.assign(form, { ...defaultForm });
  editingId.value = undefined;
}

async function loadConfigs() {
  loading.value = true;
  try {
    const page = await getAdminConfigPageApi({
      current: query.current,
      isActive: query.isActive === null ? null : Boolean(query.isActive),
      keyword: query.keyword || undefined,
      size: query.size,
    });
    configs.value = page.records;
    total.value = page.total;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.current = 1;
  void loadConfigs();
}

function openCreate() {
  resetForm();
  modalVisible.value = true;
}

async function openEdit(row: AdminConfig) {
  resetForm();
  const detail = await getAdminConfigApi(row.id);
  Object.assign(form, {
    description: detail.description ?? '',
    isActive: detail.isActive,
    name: detail.name,
    value: detail.value,
  });
  editingId.value = detail.id;
  modalVisible.value = true;
}

async function handleSubmit() {
  await formRef.value?.validate();
  if (editingId.value) {
    await updateAdminConfigApi(editingId.value, form);
    message.success('配置已更新');
  } else {
    await createAdminConfigApi(form);
    message.success('配置已创建');
  }
  modalVisible.value = false;
  await loadConfigs();
}

async function handleDelete(row: AdminConfig) {
  if (!window.confirm(`确认删除“${row.name}”？`)) {
    return;
  }
  await deleteAdminConfigApi(row.id);
  message.success('配置已删除');
  await loadConfigs();
}

function handlePageChange(page: number) {
  query.current = page;
  void loadConfigs();
}

function handlePageSizeChange(size: number) {
  query.size = size;
  query.current = 1;
  void loadConfigs();
}

onMounted(loadConfigs);
</script>

<template>
  <Page title="配置管理">
    <NCard :bordered="false">
      <div class="admin-filter-toolbar mb-4">
        <NSpace align="center" class="admin-filter-fields" wrap>
          <NInput
            v-model:value="query.keyword"
            clearable
            placeholder="配置关键词"
            class="w-[220px]"
            @keyup.enter="handleSearch"
          />
          <NSelect
            v-model:value="query.isActive"
            :options="activeOptions"
            clearable
            placeholder="状态"
            class="w-[130px]"
          />
          <NButton
            v-if="canAccess('content:config:query')"
            type="primary"
            @click="handleSearch"
          >
            查询
          </NButton>
        </NSpace>
        <div class="admin-filter-actions">
          <NButton
            v-if="canAccess('content:config:create')"
            type="primary"
            @click="openCreate"
          >
            新增配置
          </NButton>
        </div>
      </div>

      <NDataTable
        :columns="columns"
        :data="configs"
        :loading="loading"
        :row-key="(row) => row.id"
        :scroll-x="1090"
      />

      <NSpace justify="end" class="mt-4">
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

    <NModal
      v-model:show="modalVisible"
      :title="editingId ? '编辑配置' : '新增配置'"
      preset="card"
      class="w-[680px] max-w-[92vw]"
    >
      <NForm
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="left"
        label-width="96"
      >
        <NFormItem label="配置 key" path="name">
          <NInput v-model:value="form.name" />
        </NFormItem>
        <NFormItem label="配置 value" path="value">
          <NInput
            v-model:value="form.value"
            type="textarea"
            :autosize="{ minRows: 4 }"
          />
        </NFormItem>
        <NFormItem label="配置说明" path="description">
          <NInput v-model:value="form.description" type="textarea" />
        </NFormItem>
        <NFormItem label="启用" path="isActive">
          <NSwitch v-model:value="form.isActive" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="modalVisible = false">取消</NButton>
          <NButton
            v-if="
              editingId
                ? canAccess('content:config:update')
                : canAccess('content:config:create')
            "
            type="primary"
            @click="handleSubmit"
          >
            保存
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </Page>
</template>
