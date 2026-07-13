<script setup lang="ts">
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui';

import type { VNodeChild } from 'vue';

import type { AdminPicture, AdminPicturePayload, SnowflakeId } from '#/api';

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
  createAdminPictureApi,
  deleteAdminPictureApi,
  getAdminPictureApi,
  getAdminPicturePageApi,
  updateAdminPictureApi,
  updateAdminPictureStatusApi,
} from '#/api';

import { hasActionPermission } from '../../system/permission-actions';
import { renderImageCell } from '../image-cell';
import ImageUploadField from '../image-upload-field.vue';
import {
  checkStatusOptions,
  getCheckStatusLabel,
  getCheckStatusType,
} from '../resource/resource-options';

type PictureForm = Required<
  Pick<
    AdminPicturePayload,
    | 'albumId'
    | 'description'
    | 'height'
    | 'size'
    | 'status'
    | 'url'
    | 'userId'
    | 'width'
  >
>;

const message = useMessage();
const accessStore = useAccessStore();
const loading = ref(false);
const modalVisible = ref(false);
const editingId = ref<AdminPicture['id']>();
const formRef = ref<FormInst | null>(null);
const pictures = ref<AdminPicture[]>([]);
const total = ref(0);

const query = reactive({
  albumId: null as null | SnowflakeId,
  current: 1,
  keyword: '',
  size: 10,
  status: null as null | number,
  userId: null as null | SnowflakeId,
});

const defaultForm: PictureForm = {
  albumId: '',
  description: '',
  height: 0,
  size: 0,
  status: 1,
  url: '',
  userId: '',
  width: 0,
};

const form = reactive<PictureForm>({ ...defaultForm });

const rules: FormRules = {
  albumId: { message: '请输入图册 ID', required: true, trigger: 'blur' },
  url: { message: '请选择图片', required: true, trigger: 'blur' },
  userId: { message: '请输入用户 ID', required: true, trigger: 'blur' },
};

function canAccess(code: string) {
  return hasActionPermission(accessStore.accessCodes, code);
}

const columns = computed<DataTableColumns<AdminPicture>>(() => [
  {
    key: 'url',
    render: (row) => renderImageCell(row.thumbUrl || row.url, '图片', row.url),
    title: '图片',
    width: 100,
  },
  { key: 'albumId', title: '图册 ID', width: 170 },
  { key: 'userId', title: '用户 ID', width: 170 },
  {
    key: 'size',
    render: (row) => `${row.size}`,
    title: '大小',
    width: 90,
  },
  {
    key: 'width',
    render: (row) => `${row.width} × ${row.height}`,
    title: '尺寸',
    width: 120,
  },
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
      if (canAccess('picture:update')) {
        actions.push(
          h(
            NButton,
            { size: 'small', onClick: () => openEdit(row) },
            { default: () => '编辑' },
          ),
        );
      }
      if (canAccess('picture:status') && row.status !== 1) {
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
      if (canAccess('picture:status') && row.status !== 3) {
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
      if (canAccess('picture:delete')) {
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

async function loadPictures() {
  loading.value = true;
  try {
    const page = await getAdminPicturePageApi({
      albumId: query.albumId,
      current: query.current,
      keyword: query.keyword || undefined,
      size: query.size,
      status: query.status,
      userId: query.userId,
    });
    pictures.value = page.records;
    total.value = page.total;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.current = 1;
  void loadPictures();
}

function openCreate() {
  resetForm();
  modalVisible.value = true;
}

async function openEdit(row: AdminPicture) {
  resetForm();
  const detail = await getAdminPictureApi(row.id);
  Object.assign(form, {
    albumId: detail.albumId,
    description: detail.description ?? '',
    height: detail.height,
    size: detail.size,
    status: detail.status,
    url: detail.url,
    userId: detail.userId,
    width: detail.width,
  });
  editingId.value = detail.id;
  modalVisible.value = true;
}

async function handleSubmit() {
  await formRef.value?.validate();
  if (editingId.value) {
    await updateAdminPictureApi(editingId.value, form);
    message.success('图片已更新');
  } else {
    await createAdminPictureApi(form);
    message.success('图片已创建');
  }
  modalVisible.value = false;
  await loadPictures();
}

async function handleStatus(row: AdminPicture, status: number) {
  await updateAdminPictureStatusApi(row.id, status);
  message.success('图片状态已更新');
  await loadPictures();
}

async function handleDelete(row: AdminPicture) {
  if (!window.confirm('确认删除这张图片？')) {
    return;
  }
  await deleteAdminPictureApi(row.id);
  message.success('图片已删除');
  await loadPictures();
}

function handlePageChange(page: number) {
  query.current = page;
  void loadPictures();
}

function handlePageSizeChange(size: number) {
  query.size = size;
  query.current = 1;
  void loadPictures();
}

onMounted(loadPictures);
</script>

<template>
  <Page title="图片管理">
    <NCard :bordered="false">
      <div class="admin-filter-toolbar mb-4">
        <NSpace align="center" class="admin-filter-fields" wrap>
          <NInput
            v-model:value="query.keyword"
            clearable
            placeholder="图片关键词"
            class="w-[220px]"
            @keyup.enter="handleSearch"
          />
          <NInput
            v-model:value="query.albumId"
            clearable
            placeholder="图册 ID"
            class="w-[170px]"
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
            v-if="canAccess('picture:query')"
            type="primary"
            @click="handleSearch"
          >
            查询
          </NButton>
        </NSpace>
        <div class="admin-filter-actions">
          <NButton
            v-if="canAccess('picture:create')"
            type="primary"
            @click="openCreate"
          >
            新增图片
          </NButton>
        </div>
      </div>

      <NDataTable
        :columns="columns"
        :data="pictures"
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
      :title="editingId ? '编辑图片' : '新增图片'"
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
          <NFormItem label="用户 ID" path="userId">
            <NInput v-model:value="form.userId" />
          </NFormItem>
          <NFormItem label="图册 ID" path="albumId">
            <NInput v-model:value="form.albumId" />
          </NFormItem>
          <NFormItem label="大小" path="size">
            <NInputNumber v-model:value="form.size" class="w-full" :min="0" />
          </NFormItem>
          <NFormItem label="状态" path="status">
            <NSelect
              v-model:value="form.status"
              :options="checkStatusOptions"
            />
          </NFormItem>
          <NFormItem label="宽度" path="width">
            <NInputNumber v-model:value="form.width" class="w-full" :min="0" />
          </NFormItem>
          <NFormItem label="高度" path="height">
            <NInputNumber v-model:value="form.height" class="w-full" :min="0" />
          </NFormItem>
          <NFormItem label="图片" path="url" class="md:col-span-2">
            <ImageUploadField v-model="form.url" dir-type="picture" />
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
                ? canAccess('picture:update')
                : canAccess('picture:create')
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
