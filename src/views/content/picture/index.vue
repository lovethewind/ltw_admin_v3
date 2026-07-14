<script setup lang="ts">
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui';

import type { VNodeChild } from 'vue';

import type { ImageFileMetadata } from '../image-upload';

import type {
  AdminPicture,
  AdminPictureAlbum,
  AdminPicturePayload,
  AdminUser,
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
  createAdminPictureApi,
  deleteAdminPictureApi,
  getAdminPictureAlbumPageApi,
  getAdminPictureApi,
  getAdminPicturePageApi,
  getAdminUserPageApi,
  updateAdminPictureApi,
  updateAdminPictureStatusApi,
} from '#/api';
import { showDeleteConfirm } from '#/utils/confirm';
import { transformSize } from '#/utils/file';

import { hasActionPermission } from '../../system/permission-actions';
import AdminUserDisplay from '../../system/user/user-display.vue';
import AdminUserSelect from '../../system/user/user-select.vue';
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
const albums = ref<AdminPictureAlbum[]>([]);
const users = ref<AdminUser[]>([]);
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

const albumOptions = computed(() =>
  albums.value.map((album) => ({
    label: album.name,
    value: album.id,
  })),
);

const rules: FormRules = {
  albumId: { message: '请选择图册', required: true, trigger: 'change' },
  url: { message: '请选择图片', required: true, trigger: 'blur' },
  userId: { message: '请选择用户', required: true, trigger: 'change' },
};

/**
 * 获取图册名称。
 *
 * :param albumId: 图册 ID。
 * :return: 图册名称，未匹配时返回原始 ID。
 */
function getAlbumName(albumId: SnowflakeId): string {
  return albums.value.find((album) => album.id === albumId)?.name ?? albumId;
}

/**
 * 渲染图片列表中的用户信息。
 *
 * :param userId: 用户 ID。
 * :return: 用户昵称和 UID 标签。
 */
function renderUserCell(userId: SnowflakeId): VNodeChild {
  const user = users.value.find((item) => item.id === userId);
  return h(AdminUserDisplay, { fallback: userId, user });
}

/**
 * 使用上传图片的元数据填充表单。
 *
 * :param metadata: 图片文件元数据。
 * :return: 无返回值。
 */
function handleImageUploaded(metadata: ImageFileMetadata): void {
  form.height = metadata.height;
  form.size = metadata.size;
  form.width = metadata.width;
}

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
  {
    key: 'albumId',
    render: (row) => getAlbumName(row.albumId),
    title: '图册',
    width: 180,
  },
  {
    key: 'userId',
    render: (row) => renderUserCell(row.userId),
    title: '用户',
    width: 220,
  },
  {
    key: 'size',
    render: (row) => transformSize(row.size),
    title: '大小',
    width: 110,
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
  { key: 'createTime', title: '创建时间', width: 200 },
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

/**
 * 加载图册选择项。
 *
 * :return: 无返回值。
 */
async function loadAlbums(): Promise<void> {
  const size = 200;
  const records: AdminPictureAlbum[] = [];
  let current = 1;
  let totalAlbums: number;
  try {
    do {
      const page = await getAdminPictureAlbumPageApi({ current, size });
      records.push(...page.records);
      totalAlbums = page.total;
      current += 1;
    } while (records.length < totalAlbums);
    albums.value = records;
  } catch {
    albums.value = [];
  }
}

/**
 * 加载用户选择项。
 *
 * :return: 无返回值。
 */
async function loadUsers(): Promise<void> {
  const size = 200;
  const records: AdminUser[] = [];
  let current = 1;
  let totalUsers: number;
  try {
    do {
      const page = await getAdminUserPageApi({ current, size });
      records.push(...page.records);
      totalUsers = page.total;
      current += 1;
    } while (records.length < totalUsers);
    users.value = records;
  } catch {
    users.value = [];
  }
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

/**
 * 确认并删除图片。
 *
 * :param row: 图片数据。
 * :return: 无返回值。
 */
function handleDelete(row: AdminPicture): void {
  showDeleteConfirm('确认删除这张图片？', async () => {
    await deleteAdminPictureApi(row.id);
    message.success('图片已删除');
    await loadPictures();
  });
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

/**
 * 初始化图片管理页面数据。
 *
 * :return: 无返回值。
 */
async function initializePage(): Promise<void> {
  await Promise.all([loadAlbums(), loadUsers(), loadPictures()]);
}

onMounted(initializePage);
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
          <NSelect
            v-model:value="query.albumId"
            :options="albumOptions"
            clearable
            filterable
            placeholder="图册"
            class="w-[200px]"
          />
          <AdminUserSelect
            v-model:value="query.userId"
            :users="users"
            class="w-[220px]"
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
          <NFormItem label="用户" path="userId">
            <AdminUserSelect v-model:value="form.userId" :users="users" />
          </NFormItem>
          <NFormItem label="图册" path="albumId">
            <NSelect
              v-model:value="form.albumId"
              :options="albumOptions"
              filterable
            />
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
            <ImageUploadField
              v-model="form.url"
              dir-type="image"
              @uploaded="handleImageUploaded"
            />
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
