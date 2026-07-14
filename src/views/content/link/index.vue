<script setup lang="ts">
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui';

import type { VNodeChild } from 'vue';

import type { AdminLink, AdminLinkPayload } from '#/api';

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
  NPagination,
  NSelect,
  NSpace,
  NTag,
  useMessage,
} from 'naive-ui';

import {
  createAdminLinkApi,
  deleteAdminLinkApi,
  getAdminLinkApi,
  getAdminLinkPageApi,
  updateAdminLinkApi,
  updateAdminLinkStatusApi,
} from '#/api';
import { showDeleteConfirm } from '#/utils/confirm';

import { hasActionPermission } from '../../system/permission-actions';
import { renderImageCellWithInitialFallback } from '../image-cell';
import ImageUploadField from '../image-upload-field.vue';
import {
  checkStatusOptions,
  getCheckStatusLabel,
  getCheckStatusType,
} from '../resource/resource-options';

type LinkForm = Required<
  Pick<
    AdminLinkPayload,
    | 'cover'
    | 'description'
    | 'email'
    | 'index'
    | 'introduce'
    | 'name'
    | 'status'
    | 'url'
  >
>;

const message = useMessage();
const accessStore = useAccessStore();
const loading = ref(false);
const modalVisible = ref(false);
const editingId = ref<AdminLink['id']>();
const formRef = ref<FormInst | null>(null);
const links = ref<AdminLink[]>([]);
const total = ref(0);

const query = reactive({
  current: 1,
  keyword: '',
  size: 10,
  status: null as null | number,
});

const defaultForm: LinkForm = {
  cover: '',
  description: '',
  email: '',
  index: 100_000,
  introduce: '',
  name: '',
  status: 2,
  url: '',
};

const form = reactive<LinkForm>({ ...defaultForm });

const rules: FormRules = {
  name: { message: '请输入网站名', required: true, trigger: 'blur' },
  url: { message: '请输入链接地址', required: true, trigger: 'blur' },
};

function canAccess(code: string) {
  return hasActionPermission(accessStore.accessCodes, code);
}

const columns = computed<DataTableColumns<AdminLink>>(() => [
  { key: 'name', title: '网站名', width: 160 },
  {
    key: 'cover',
    render: (row) =>
      renderImageCellWithInitialFallback(row.cover, row.name),
    title: '封面',
    width: 100,
  },
  { key: 'url', title: '链接地址', width: 220, ellipsis: { tooltip: true } },
  {
    key: 'email',
    render: (row) => row.email || '-',
    title: '邮箱',
    width: 180,
  },
  { key: 'index', title: '排序', width: 90 },
  {
    key: 'status',
    render: (row) =>
      h(
        NTag,
        {
          bordered: false,
          size: 'small',
          type: getCheckStatusType(row.status),
        },
        { default: () => getCheckStatusLabel(row.status) },
      ),
    title: '状态',
    width: 100,
  },
  { key: 'introduce', title: '简介', width: 260, ellipsis: { tooltip: true } },
  { key: 'createTime', title: '创建时间', width: 200 },
  {
    fixed: 'right',
    key: 'actions',
    render: (row) => {
      const actions: VNodeChild[] = [];
      if (canAccess('link:update')) {
        actions.push(
          h(
            NButton,
            { size: 'small', onClick: () => openEdit(row) },
            { default: () => '编辑' },
          ),
        );
      }
      if (canAccess('link:status') && row.status !== 1) {
        actions.push(
          h(
            NButton,
            {
              size: 'small',
              type: 'primary',
              onClick: () => handleStatus(row, 1),
            },
            { default: () => '通过' },
          ),
        );
      }
      if (canAccess('link:status') && row.status !== 3) {
        actions.push(
          h(
            NButton,
            {
              size: 'small',
              type: 'warning',
              onClick: () => handleStatus(row, 3),
            },
            { default: () => '拒绝' },
          ),
        );
      }
      if (canAccess('link:delete')) {
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
    width: 250,
  },
]);

function resetForm() {
  Object.assign(form, { ...defaultForm });
  editingId.value = undefined;
}

async function loadLinks() {
  loading.value = true;
  try {
    const page = await getAdminLinkPageApi({
      current: query.current,
      keyword: query.keyword || undefined,
      size: query.size,
      status: query.status,
    });
    links.value = page.records;
    total.value = page.total;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.current = 1;
  void loadLinks();
}

function openCreate() {
  resetForm();
  modalVisible.value = true;
}

async function openEdit(row: AdminLink) {
  resetForm();
  const detail = await getAdminLinkApi(row.id);
  Object.assign(form, {
    cover: detail.cover,
    description: detail.description ?? '',
    email: detail.email ?? '',
    index: detail.index,
    introduce: detail.introduce,
    name: detail.name,
    status: detail.status,
    url: detail.url,
  });
  editingId.value = detail.id;
  modalVisible.value = true;
}

async function handleSubmit() {
  await formRef.value?.validate();
  if (editingId.value) {
    await updateAdminLinkApi(editingId.value, form);
    message.success('友链已更新');
  } else {
    await createAdminLinkApi(form);
    message.success('友链已创建');
  }
  modalVisible.value = false;
  await loadLinks();
}

async function handleStatus(row: AdminLink, status: number) {
  await updateAdminLinkStatusApi(row.id, status);
  message.success('友链状态已更新');
  await loadLinks();
}

/**
 * 确认并删除友链。
 *
 * :param row: 友链数据。
 * :return: 无返回值。
 */
function handleDelete(row: AdminLink): void {
  showDeleteConfirm(`确认删除“${row.name}”？`, async () => {
    await deleteAdminLinkApi(row.id);
    message.success('友链已删除');
    await loadLinks();
  });
}

function handlePageChange(page: number) {
  query.current = page;
  void loadLinks();
}

function handlePageSizeChange(size: number) {
  query.size = size;
  query.current = 1;
  void loadLinks();
}

onMounted(loadLinks);
</script>

<template>
  <Page title="友链管理">
    <NCard :bordered="false">
      <div class="admin-filter-toolbar mb-4">
        <NSpace align="center" class="admin-filter-fields" wrap>
          <NInput
            v-model:value="query.keyword"
            clearable
            placeholder="友链关键词"
            class="w-[220px]"
            @keyup.enter="handleSearch"
          />
          <NSelect
            v-model:value="query.status"
            :options="checkStatusOptions"
            clearable
            placeholder="状态"
            class="w-[130px]"
          />
          <NButton
            v-if="canAccess('link:query')"
            type="primary"
            @click="handleSearch"
          >
            查询
          </NButton>
        </NSpace>
        <div class="admin-filter-actions">
          <NButton
            v-if="canAccess('link:create')"
            type="primary"
            @click="openCreate"
          >
            新增友链
          </NButton>
        </div>
      </div>

      <NDataTable
        :columns="columns"
        :data="links"
        :loading="loading"
        :row-key="(row) => row.id"
        :scroll-x="1450"
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
      :title="editingId ? '编辑友链' : '新增友链'"
      preset="card"
      class="w-[760px] max-w-[92vw]"
    >
      <NForm
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="left"
        label-width="88"
      >
        <div class="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <NFormItem label="网站名" path="name">
            <NInput v-model:value="form.name" />
          </NFormItem>
          <NFormItem label="邮箱" path="email">
            <NInput v-model:value="form.email" />
          </NFormItem>
          <NFormItem label="排序" path="index">
            <NInputNumber v-model:value="form.index" class="w-full" />
          </NFormItem>
          <NFormItem label="状态" path="status">
            <NSelect
              v-model:value="form.status"
              :options="checkStatusOptions"
            />
          </NFormItem>
          <NFormItem label="链接地址" path="url" class="md:col-span-2">
            <NInput v-model:value="form.url" />
          </NFormItem>
          <NFormItem label="封面" path="cover" class="md:col-span-2">
            <ImageUploadField
              v-model="form.cover"
              allow-url-input
              aspect-ratio="16:9"
              dir-type="cover"
            />
          </NFormItem>
          <NFormItem label="简介" path="introduce" class="md:col-span-2">
            <NInput v-model:value="form.introduce" type="textarea" />
          </NFormItem>
          <NFormItem label="说明" path="description" class="md:col-span-2">
            <NInput v-model:value="form.description" type="textarea" />
          </NFormItem>
        </div>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="modalVisible = false">取消</NButton>
          <NButton
            v-if="
              editingId
                ? canAccess('link:update')
                : canAccess('link:create')
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
