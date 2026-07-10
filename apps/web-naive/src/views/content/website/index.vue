<script setup lang="ts">
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui';

import type { VNodeChild } from 'vue';

import type {
  AdminWebsite,
  AdminWebsiteCategory,
  AdminWebsitePayload,
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
  NInputNumber,
  NModal,
  NPagination,
  NSelect,
  NSpace,
  NTag,
  useMessage,
} from 'naive-ui';

import {
  createAdminWebsiteApi,
  deleteAdminWebsiteApi,
  getAdminWebsiteApi,
  getAdminWebsiteCategoryListApi,
  getAdminWebsitePageApi,
  updateAdminWebsiteApi,
  updateAdminWebsiteStatusApi,
} from '#/api';

import { hasActionPermission } from '../../system/permission-actions';
import { renderImageCell } from '../image-cell';
import ImageUploadField from '../image-upload-field.vue';
import {
  checkStatusOptions,
  getCheckStatusLabel,
  getCheckStatusType,
} from '../resource/resource-options';

type WebsiteForm = Required<
  Pick<
    AdminWebsitePayload,
    | 'categoryId'
    | 'cover'
    | 'index'
    | 'introduce'
    | 'name'
    | 'status'
    | 'url'
    | 'userId'
  >
>;

const message = useMessage();
const accessStore = useAccessStore();
const loading = ref(false);
const modalVisible = ref(false);
const editingId = ref<AdminWebsite['id']>();
const formRef = ref<FormInst | null>(null);
const websites = ref<AdminWebsite[]>([]);
const categories = ref<AdminWebsiteCategory[]>([]);
const total = ref(0);

const query = reactive({
  categoryId: null as null | SnowflakeId,
  current: 1,
  keyword: '',
  size: 10,
  status: null as null | number,
  userId: null as null | SnowflakeId,
});

const defaultForm: WebsiteForm = {
  categoryId: '',
  cover: '',
  index: 100_000,
  introduce: '',
  name: '',
  status: 1,
  url: '',
  userId: '',
};

const form = reactive<WebsiteForm>({ ...defaultForm });

const categoryOptions = computed(() =>
  categories.value.map((item) => ({
    label: item.name,
    value: item.id,
  })),
);

const rules: FormRules = {
  categoryId: { message: '请选择分类', required: true, trigger: 'change' },
  name: { message: '请输入网站名', required: true, trigger: 'blur' },
  url: { message: '请输入链接地址', required: true, trigger: 'blur' },
  userId: { message: '请输入用户 ID', required: true, trigger: 'blur' },
};

function canAccess(code: string) {
  return hasActionPermission(accessStore.accessCodes, code);
}

function getCategoryName(categoryId: SnowflakeId) {
  return categories.value.find((item) => item.id === categoryId)?.name ?? '-';
}

const columns = computed<DataTableColumns<AdminWebsite>>(() => [
  { key: 'name', title: '网站名', width: 160 },
  {
    key: 'cover',
    render: (row) => renderImageCell(row.cover, row.name),
    title: '封面',
    width: 100,
  },
  {
    key: 'categoryId',
    render: (row) => getCategoryName(row.categoryId),
    title: '分类',
    width: 120,
  },
  { key: 'url', title: '链接地址', width: 220, ellipsis: { tooltip: true } },
  { key: 'userId', title: '用户 ID', width: 170 },
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
  { key: 'createTime', title: '创建时间', width: 170 },
  {
    fixed: 'right',
    key: 'actions',
    render: (row) => {
      const actions: VNodeChild[] = [];
      if (canAccess('content:website:update')) {
        actions.push(
          h(
            NButton,
            { size: 'small', onClick: () => openEdit(row) },
            { default: () => '编辑' },
          ),
        );
      }
      if (canAccess('content:website:status') && row.status !== 1) {
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
      if (canAccess('content:website:status') && row.status !== 3) {
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
      if (canAccess('content:website:delete')) {
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

async function loadCategories() {
  categories.value = await getAdminWebsiteCategoryListApi();
}

async function loadWebsites() {
  loading.value = true;
  try {
    const page = await getAdminWebsitePageApi({
      categoryId: query.categoryId,
      current: query.current,
      keyword: query.keyword || undefined,
      size: query.size,
      status: query.status,
      userId: query.userId,
    });
    websites.value = page.records;
    total.value = page.total;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.current = 1;
  void loadWebsites();
}

function openCreate() {
  resetForm();
  modalVisible.value = true;
}

async function openEdit(row: AdminWebsite) {
  resetForm();
  const detail = await getAdminWebsiteApi(row.id);
  Object.assign(form, {
    categoryId: detail.categoryId,
    cover: detail.cover,
    index: detail.index,
    introduce: detail.introduce,
    name: detail.name,
    status: detail.status,
    url: detail.url,
    userId: detail.userId,
  });
  editingId.value = detail.id;
  modalVisible.value = true;
}

async function handleSubmit() {
  await formRef.value?.validate();
  if (editingId.value) {
    await updateAdminWebsiteApi(editingId.value, form);
    message.success('网站导航已更新');
  } else {
    await createAdminWebsiteApi(form);
    message.success('网站导航已创建');
  }
  modalVisible.value = false;
  await loadWebsites();
}

async function handleStatus(row: AdminWebsite, status: number) {
  await updateAdminWebsiteStatusApi(row.id, status);
  message.success('网站导航状态已更新');
  await loadWebsites();
}

async function handleDelete(row: AdminWebsite) {
  if (!window.confirm(`确认删除“${row.name}”？`)) {
    return;
  }
  await deleteAdminWebsiteApi(row.id);
  message.success('网站导航已删除');
  await loadWebsites();
}

function handlePageChange(page: number) {
  query.current = page;
  void loadWebsites();
}

function handlePageSizeChange(size: number) {
  query.size = size;
  query.current = 1;
  void loadWebsites();
}

onMounted(async () => {
  await loadCategories();
  await loadWebsites();
});
</script>

<template>
  <Page title="网站导航">
    <NCard :bordered="false">
      <div class="admin-filter-toolbar mb-4">
        <NSpace align="center" class="admin-filter-fields" wrap>
          <NInput
            v-model:value="query.keyword"
            clearable
            placeholder="网站关键词"
            class="w-[220px]"
            @keyup.enter="handleSearch"
          />
          <NSelect
            v-model:value="query.categoryId"
            :options="categoryOptions"
            clearable
            placeholder="分类"
            class="w-[150px]"
          />
          <NInput
            v-model:value="query.userId"
            clearable
            placeholder="用户 ID"
            class="w-[170px]"
          />
          <NSelect
            v-model:value="query.status"
            :options="checkStatusOptions"
            clearable
            placeholder="状态"
            class="w-[130px]"
          />
          <NButton
            v-if="canAccess('content:website:query')"
            type="primary"
            @click="handleSearch"
          >
            查询
          </NButton>
        </NSpace>
        <div class="admin-filter-actions">
          <NButton
            v-if="canAccess('content:website:create')"
            type="primary"
            @click="openCreate"
          >
            新增网站
          </NButton>
        </div>
      </div>

      <NDataTable
        :columns="columns"
        :data="websites"
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
      :title="editingId ? '编辑网站导航' : '新增网站导航'"
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
          <NFormItem label="用户 ID" path="userId">
            <NInput v-model:value="form.userId" />
          </NFormItem>
          <NFormItem label="分类" path="categoryId">
            <NSelect
              v-model:value="form.categoryId"
              :options="categoryOptions"
            />
          </NFormItem>
          <NFormItem label="状态" path="status">
            <NSelect
              v-model:value="form.status"
              :options="checkStatusOptions"
            />
          </NFormItem>
          <NFormItem label="排序" path="index">
            <NInputNumber v-model:value="form.index" class="w-full" />
          </NFormItem>
          <NFormItem label="链接地址" path="url" class="md:col-span-2">
            <NInput v-model:value="form.url" />
          </NFormItem>
          <NFormItem label="封面" path="cover" class="md:col-span-2">
            <ImageUploadField
              v-model="form.cover"
              aspect-ratio="16:9"
              dir-type="cover"
            />
          </NFormItem>
          <NFormItem label="简介" path="introduce" class="md:col-span-2">
            <NInput v-model:value="form.introduce" type="textarea" />
          </NFormItem>
        </div>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="modalVisible = false">取消</NButton>
          <NButton
            v-if="
              editingId
                ? canAccess('content:website:update')
                : canAccess('content:website:create')
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
