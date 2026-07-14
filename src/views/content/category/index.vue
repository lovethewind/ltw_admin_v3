<script setup lang="ts">
import type { DataTableColumns, FormInst } from 'naive-ui';

import type { VNodeChild } from 'vue';

import type { AdminCategory, AdminCategoryPayload } from '#/api';

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
  NSwitch,
  NTag,
  useMessage,
} from 'naive-ui';

import {
  createAdminCategoryApi,
  deleteAdminCategoryApi,
  getAdminCategoryListApi,
  updateAdminCategoryApi,
} from '#/api';
import { showDeleteConfirm } from '#/utils/confirm';

import { hasActionPermission } from '../../system/permission-actions';

const message = useMessage();
const accessStore = useAccessStore();
const loading = ref(false);
const modalVisible = ref(false);
const editingId = ref<AdminCategory['id']>();
const formRef = ref<FormInst | null>(null);
const categories = ref<AdminCategory[]>([]);

const defaultForm: AdminCategoryPayload = {
  description: '',
  index: 100_000,
  isActive: true,
  name: '',
};

const form = reactive<AdminCategoryPayload>({ ...defaultForm });

const rules = {
  name: { message: '请输入分类名称', required: true, trigger: 'blur' },
};

function canAccess(code: string) {
  return hasActionPermission(accessStore.accessCodes, code);
}

const columns = computed<DataTableColumns<AdminCategory>>(() => [
  { key: 'name', title: '分类名称', width: 160 },
  {
    key: 'description',
    render: (row) => row.description || '-',
    title: '描述',
  },
  { key: 'index', title: '排序', width: 100 },
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
  {
    fixed: 'right',
    key: 'actions',
    render: (row) => {
      const actions: VNodeChild[] = [];
      if (canAccess('category:update')) {
        actions.push(
          h(
            NButton,
            { size: 'small', onClick: () => openEdit(row) },
            { default: () => '编辑' },
          ),
        );
      }
      if (canAccess('category:delete')) {
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
    categories.value = await getAdminCategoryListApi();
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  resetForm();
  modalVisible.value = true;
}

function openEdit(row: AdminCategory) {
  Object.assign(form, {
    description: row.description ?? '',
    index: row.index,
    isActive: row.isActive,
    name: row.name,
  });
  editingId.value = row.id;
  modalVisible.value = true;
}

async function handleSubmit() {
  await formRef.value?.validate();
  if (editingId.value) {
    await updateAdminCategoryApi(editingId.value, form);
    message.success('分类已更新');
  } else {
    await createAdminCategoryApi(form);
    message.success('分类已创建');
  }
  modalVisible.value = false;
  await loadCategories();
}

/**
 * 确认并删除分类。
 *
 * :param row: 分类数据。
 * :return: 无返回值。
 */
function handleDelete(row: AdminCategory): void {
  showDeleteConfirm(`确认删除“${row.name}”？`, async () => {
    await deleteAdminCategoryApi(row.id);
    message.success('分类已删除');
    await loadCategories();
  });
}

onMounted(loadCategories);
</script>

<template>
  <Page title="分类管理">
    <NCard :bordered="false">
      <template #header-extra>
        <NButton
          v-if="canAccess('category:create')"
          type="primary"
          @click="openCreate"
        >
          新增分类
        </NButton>
      </template>
      <NDataTable
        :columns="columns"
        :data="categories"
        :loading="loading"
        :row-key="(row) => row.id"
      />
    </NCard>

    <NModal
      v-model:show="modalVisible"
      :title="editingId ? '编辑分类' : '新增分类'"
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
        <NFormItem label="分类名称" path="name">
          <NInput v-model:value="form.name" />
        </NFormItem>
        <NFormItem label="描述" path="description">
          <NInput v-model:value="form.description" type="textarea" />
        </NFormItem>
        <NFormItem label="排序" path="index">
          <NInputNumber v-model:value="form.index" class="w-full" />
        </NFormItem>
        <NFormItem label="状态" path="isActive">
          <NSwitch v-model:value="form.isActive" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="modalVisible = false">取消</NButton>
          <NButton
            v-if="
              editingId
                ? canAccess('category:update')
                : canAccess('category:create')
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
