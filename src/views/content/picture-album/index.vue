<script setup lang="ts">
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui';

import type { VNodeChild } from 'vue';

import type {
  AdminPictureAlbum,
  AdminPictureAlbumPayload,
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
  NModal,
  NPagination,
  NSelect,
  NSpace,
  NTag,
  useMessage,
} from 'naive-ui';

import {
  createAdminPictureAlbumApi,
  deleteAdminPictureAlbumApi,
  getAdminPictureAlbumApi,
  getAdminPictureAlbumPageApi,
  getAdminUserPageApi,
  updateAdminPictureAlbumApi,
  updateAdminPictureAlbumStatusApi,
} from '#/api';
import { showDeleteConfirm } from '#/utils/confirm';

import { hasActionPermission } from '../../system/permission-actions';
import AdminUserDisplay from '../../system/user/user-display.vue';
import AdminUserSelect from '../../system/user/user-select.vue';
import { renderImageCell } from '../image-cell';
import ImageUploadField from '../image-upload-field.vue';
import {
  albumTypeOptions,
  checkStatusOptions,
  getAlbumTypeLabel,
  getCheckStatusLabel,
  getCheckStatusType,
} from '../resource/resource-options';

type PictureAlbumForm = Required<
  Pick<
    AdminPictureAlbumPayload,
    'albumType' | 'cover' | 'description' | 'name' | 'status' | 'userId'
  >
>;

const message = useMessage();
const accessStore = useAccessStore();
const loading = ref(false);
const modalVisible = ref(false);
const editingId = ref<AdminPictureAlbum['id']>();
const formRef = ref<FormInst | null>(null);
const albums = ref<AdminPictureAlbum[]>([]);
const users = ref<AdminUser[]>([]);
const total = ref(0);

const query = reactive({
  albumType: null as null | number,
  current: 1,
  keyword: '',
  size: 10,
  status: null as null | number,
  userId: null as null | SnowflakeId,
});

const defaultForm: PictureAlbumForm = {
  albumType: 2,
  cover: '',
  description: '',
  name: '',
  status: 1,
  userId: '',
};

const form = reactive<PictureAlbumForm>({ ...defaultForm });

const rules: FormRules = {
  cover: { message: '请输入图册封面', required: true, trigger: 'blur' },
  name: { message: '请输入图册名称', required: true, trigger: 'blur' },
  userId: { message: '请选择用户', required: true, trigger: 'change' },
};

/**
 * 渲染图册列表中的用户信息。
 *
 * :param userId: 用户 ID。
 * :return: 用户昵称和 UID 标签。
 */
function renderUserCell(userId: SnowflakeId): VNodeChild {
  const user = users.value.find((item) => item.id === userId);
  return h(AdminUserDisplay, { fallback: userId, user });
}

function canAccess(code: string) {
  return hasActionPermission(accessStore.accessCodes, code);
}

const columns = computed<DataTableColumns<AdminPictureAlbum>>(() => [
  { key: 'name', title: '图册名称', width: 160 },
  {
    key: 'cover',
    render: (row) => renderImageCell(row.cover, row.name),
    title: '封面',
    width: 100,
  },
  {
    key: 'userId',
    render: (row) => renderUserCell(row.userId),
    title: '用户',
    width: 220,
  },
  {
    key: 'albumType',
    render: (row) => getAlbumTypeLabel(row.albumType),
    title: '类型',
    width: 90,
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
  {
    key: 'description',
    render: (row) => row.description || '-',
    title: '描述',
    width: 220,
    ellipsis: { tooltip: true },
  },
  { key: 'createTime', title: '创建时间', width: 200 },
  {
    fixed: 'right',
    key: 'actions',
    render: (row) => {
      const actions: VNodeChild[] = [];
      if (canAccess('pictureAlbum:update')) {
        actions.push(
          h(
            NButton,
            { size: 'small', onClick: () => openEdit(row) },
            { default: () => '编辑' },
          ),
        );
      }
      if (canAccess('pictureAlbum:status') && row.status !== 1) {
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
      if (canAccess('pictureAlbum:status') && row.status !== 3) {
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
      if (canAccess('pictureAlbum:delete')) {
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
 * 加载图册用户选择项。
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

async function loadAlbums() {
  loading.value = true;
  try {
    const page = await getAdminPictureAlbumPageApi({
      albumType: query.albumType,
      current: query.current,
      keyword: query.keyword || undefined,
      size: query.size,
      status: query.status,
      userId: query.userId,
    });
    albums.value = page.records;
    total.value = page.total;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.current = 1;
  void loadAlbums();
}

function openCreate() {
  resetForm();
  modalVisible.value = true;
}

async function openEdit(row: AdminPictureAlbum) {
  resetForm();
  const detail = await getAdminPictureAlbumApi(row.id);
  Object.assign(form, {
    albumType: detail.albumType,
    cover: detail.cover,
    description: detail.description ?? '',
    name: detail.name,
    status: detail.status,
    userId: detail.userId,
  });
  editingId.value = detail.id;
  modalVisible.value = true;
}

async function handleSubmit() {
  await formRef.value?.validate();
  if (editingId.value) {
    await updateAdminPictureAlbumApi(editingId.value, form);
    message.success('图册已更新');
  } else {
    await createAdminPictureAlbumApi(form);
    message.success('图册已创建');
  }
  modalVisible.value = false;
  await loadAlbums();
}

async function handleStatus(row: AdminPictureAlbum, status: number) {
  await updateAdminPictureAlbumStatusApi(row.id, status);
  message.success('图册状态已更新');
  await loadAlbums();
}

/**
 * 确认并删除图册。
 *
 * :param row: 图册数据。
 * :return: 无返回值。
 */
function handleDelete(row: AdminPictureAlbum): void {
  showDeleteConfirm(`确认删除“${row.name}”？`, async () => {
    await deleteAdminPictureAlbumApi(row.id);
    message.success('图册已删除');
    await loadAlbums();
  });
}

function handlePageChange(page: number) {
  query.current = page;
  void loadAlbums();
}

function handlePageSizeChange(size: number) {
  query.size = size;
  query.current = 1;
  void loadAlbums();
}

/**
 * 初始化图册管理页面数据。
 *
 * :return: 无返回值。
 */
async function initializePage(): Promise<void> {
  await Promise.all([loadUsers(), loadAlbums()]);
}

onMounted(initializePage);
</script>

<template>
  <Page title="图册管理">
    <NCard :bordered="false">
      <div class="admin-filter-toolbar mb-4">
        <NSpace align="center" class="admin-filter-fields" wrap>
          <NInput
            v-model:value="query.keyword"
            clearable
            placeholder="图册关键词"
            class="w-[220px]"
            @keyup.enter="handleSearch"
          />
          <AdminUserSelect
            v-model:value="query.userId"
            :users="users"
            class="w-[220px]"
          />
          <NSelect
            v-model:value="query.albumType"
            :options="albumTypeOptions"
            clearable
            placeholder="类型"
            class="w-[120px]"
          />
          <NSelect
            v-model:value="query.status"
            :options="checkStatusOptions"
            clearable
            placeholder="状态"
            class="w-[130px]"
          />
          <NButton
            v-if="canAccess('pictureAlbum:query')"
            type="primary"
            @click="handleSearch"
          >
            查询
          </NButton>
        </NSpace>
        <div class="admin-filter-actions">
          <NButton
            v-if="canAccess('pictureAlbum:create')"
            type="primary"
            @click="openCreate"
          >
            新增图册
          </NButton>
        </div>
      </div>

      <NDataTable
        :columns="columns"
        :data="albums"
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
      :title="editingId ? '编辑图册' : '新增图册'"
      preset="card"
      class="w-[720px] max-w-[92vw]"
    >
      <NForm
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="left"
        label-width="88"
      >
        <div class="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <NFormItem label="图册名称" path="name">
            <NInput v-model:value="form.name" />
          </NFormItem>
          <NFormItem label="用户" path="userId">
            <AdminUserSelect v-model:value="form.userId" :users="users" />
          </NFormItem>
          <NFormItem label="类型" path="albumType">
            <NSelect
              v-model:value="form.albumType"
              :options="albumTypeOptions"
            />
          </NFormItem>
          <NFormItem label="状态" path="status">
            <NSelect
              v-model:value="form.status"
              :options="checkStatusOptions"
            />
          </NFormItem>
          <NFormItem label="封面" path="cover" class="md:col-span-2">
            <ImageUploadField
              v-model="form.cover"
              aspect-ratio="16:9"
              dir-type="cover"
            />
          </NFormItem>
          <NFormItem label="描述" path="description" class="md:col-span-2">
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
                ? canAccess('pictureAlbum:update')
                : canAccess('pictureAlbum:create')
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
