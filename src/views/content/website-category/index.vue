<script setup lang="ts">
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui';

import type { VNodeChild } from 'vue';

import type { AdminWebsiteCategory, AdminWebsiteCategoryPayload } from '#/api';

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
  NInputNumber,
  NModal,
  NSpace,
  useMessage,
} from 'naive-ui';

import {
  createAdminWebsiteCategoryApi,
  deleteAdminWebsiteCategoryApi,
  getAdminWebsiteCategoryListApi,
  updateAdminWebsiteCategoryApi,
} from '#/api';

import { hasActionPermission } from '../../system/permission-actions';

const message = useMessage();
const accessStore = useAccessStore();
const loading = ref(false);
const modalVisible = ref(false);
const editingId = ref<AdminWebsiteCategory['id']>();
const formRef = ref<FormInst | null>(null);
const categories = ref<AdminWebsiteCategory[]>([]);

const defaultForm: AdminWebsiteCategoryPayload = {
  index: 100_000,
  name: '',
};

const form = reactive<AdminWebsiteCategoryPayload>({ ...defaultForm });

const rules: FormRules = {
  name: { message: '请输入分类名', required: true, trigger: 'blur' },
};

function canAccess(code: string) {
  return hasActionPermission(accessStore.accessCodes, code);
}

const columns = computed<DataTableColumns<AdminWebsiteCategory>>(() => [
  { key: 'name', title: '分类名', width: 180 },
  { key: 'index', title: '排序', width: 100 },
  { key: 'createTime', title: '创建时间', width: 170 },
  { key: 'updateTime', title: '更新时间', width: 170 },
  {
    fixed: 'right',
    key: 'actions',
    render: (row) => {
      const actions: VNodeChild[] = [];
      if (canAccess('websiteCategory:update')) {
        actions.push(
          h(
            NButton,
            { size: 'small', onClick: () => openEdit(row) },
            { default: () => '编辑' },
          ),
        );
      }
      if (canAccess('websiteCategory:delete')) {
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

async function loadCategories() {
  loading.value = true;
  try {
    categories.value = await getAdminWebsiteCategoryListApi();
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  resetForm();
  modalVisible.value = true;
}

function openEdit(row: AdminWebsiteCategory) {
  Object.assign(form, {
    index: row.index,
    name: row.name,
  });
  editingId.value = row.id;
  modalVisible.value = true;
}

async function handleSubmit() {
  await formRef.value?.validate();
  if (editingId.value) {
    await updateAdminWebsiteCategoryApi(editingId.value, form);
    message.success('导航分类已更新');
  } else {
    await createAdminWebsiteCategoryApi(form);
    message.success('导航分类已创建');
  }
  modalVisible.value = false;
  await loadCategories();
}

async function handleDelete(row: AdminWebsiteCategory) {
  if (!window.confirm(`确认删除“${row.name}”？`)) {
    return;
  }
  await deleteAdminWebsiteCategoryApi(row.id);
  message.success('导航分类已删除');
  await loadCategories();
}

onMounted(loadCategories);
</script>

<template>
  <Page title="导航分类">
    <NCard :bordered="false">
      <NSpace justify="space-between" class="mb-4">
        <span></span>
        <NButton
          v-if="canAccess('websiteCategory:create')"
          type="primary"
          @click="openCreate"
        >
          新增分类
        </NButton>
      </NSpace>

      <NDataTable
        :columns="columns"
        :data="categories"
        :loading="loading"
        :row-key="(row) => row.id"
        :scroll-x="760"
      />
    </NCard>

    <NModal
      v-model:show="modalVisible"
      :title="editingId ? '编辑导航分类' : '新增导航分类'"
      preset="card"
      class="w-[560px] max-w-[92vw]"
    >
      <NForm
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="left"
        label-width="88"
      >
        <NFormItem label="分类名" path="name">
          <NInput v-model:value="form.name" />
        </NFormItem>
        <NFormItem label="排序" path="index">
          <NInputNumber v-model:value="form.index" class="w-full" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="modalVisible = false">取消</NButton>
          <NButton
            v-if="
              editingId
                ? canAccess('websiteCategory:update')
                : canAccess('websiteCategory:create')
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
