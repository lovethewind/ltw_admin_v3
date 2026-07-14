<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui';

import type { VNodeChild } from 'vue';

import type { AdminSource, AdminUser, SnowflakeId } from '#/api';

import { computed, h, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  NButton,
  NCard,
  NDataTable,
  NInput,
  NModal,
  NPagination,
  NSelect,
  NSpace,
  NTag,
  useMessage,
} from 'naive-ui';

import {
  deleteAdminSourceApi,
  getAdminSourcePageApi,
  getAdminUserPageApi,
  updateAdminSourceApi,
} from '#/api';
import { showDeleteConfirm } from '#/utils/confirm';

import { renderImageCell } from '../../content/image-cell';
import { hasActionPermission } from '../../system/permission-actions';
import AdminUserDisplay from '../../system/user/user-display.vue';
import AdminUserSelect from '../../system/user/user-select.vue';
import { booleanNumberOptions, getBooleanLabel } from '../operation-options';

type ResourceType = 'archive' | 'audio' | 'document' | 'image' | 'other' | 'video';

const imageExtensions = new Set([
  'avif',
  'bmp',
  'gif',
  'heic',
  'heif',
  'ico',
  'jpeg',
  'jpg',
  'png',
  'svg',
  'webp',
]);
const videoExtensions = new Set([
  'avi',
  'flv',
  'm4v',
  'mkv',
  'mov',
  'mp4',
  'mpeg',
  'mpg',
  'ogv',
  'webm',
  'wmv',
]);
const audioExtensions = new Set([
  'aac',
  'flac',
  'm4a',
  'mp3',
  'oga',
  'ogg',
  'opus',
  'wav',
]);
const documentExtensions = new Set([
  'csv',
  'doc',
  'docx',
  'json',
  'md',
  'pdf',
  'ppt',
  'pptx',
  'txt',
  'xls',
  'xlsx',
]);
const archiveExtensions = new Set([
  '7z',
  'bz2',
  'gz',
  'rar',
  'tar',
  'xz',
  'zip',
]);
const resourceTypeMeta = {
  archive: { label: '压缩包', tagType: 'warning' },
  audio: { label: '音频', tagType: 'info' },
  document: { label: '文档', tagType: 'default' },
  image: { label: '图片', tagType: 'success' },
  other: { label: '其他', tagType: 'default' },
  video: { label: '视频', tagType: 'primary' },
} as const;

const message = useMessage();
const accessStore = useAccessStore();
const loading = ref(false);
const records = ref<AdminSource[]>([]);
const users = ref<AdminUser[]>([]);
const total = ref(0);
const videoPreviewUrl = ref('');
const videoPreviewVisible = ref(false);
const query = reactive({
  current: 1,
  isDeleted: null as null | number,
  keyword: '',
  size: 10,
  userId: null as null | SnowflakeId,
});
function canAccess(code: string) {
  return hasActionPermission(accessStore.accessCodes, code);
}

/**
 * 渲染资源所属用户。
 *
 * :param userId: 用户 ID。
 * :return: 用户展示节点。
 */
function renderUserCell(userId: SnowflakeId): VNodeChild {
  const user = users.value.find((item) => item.id === userId);
  return h(AdminUserDisplay, { fallback: userId, user });
}

/**
 * 获取资源地址中的文件扩展名。
 *
 * :param url: 资源地址。
 * :return: 小写文件扩展名，不包含点号。
 */
function getResourceExtension(url: string): string {
  const pathname = url.split(/[?#]/)[0] ?? '';
  const filename = pathname.slice(pathname.lastIndexOf('/') + 1);
  const dotIndex = filename.lastIndexOf('.');
  return dotIndex > 0 ? filename.slice(dotIndex + 1).toLowerCase() : '';
}

/**
 * 根据资源地址后缀识别资源类型。
 *
 * :param url: 资源地址。
 * :return: 资源类型。
 */
function getResourceType(url: string): ResourceType {
  const extension = getResourceExtension(url);
  if (imageExtensions.has(extension)) return 'image';
  if (videoExtensions.has(extension)) return 'video';
  if (audioExtensions.has(extension)) return 'audio';
  if (documentExtensions.has(extension)) return 'document';
  if (archiveExtensions.has(extension)) return 'archive';
  return 'other';
}

/**
 * 渲染资源类型标签。
 *
 * :param url: 资源地址。
 * :return: 类型标签节点。
 */
function renderResourceType(url: string): VNodeChild {
  const extension = getResourceExtension(url);
  const meta = resourceTypeMeta[getResourceType(url)];
  const label = extension
    ? `${meta.label} · ${extension.toUpperCase()}`
    : meta.label;
  return h(
    NTag,
    { bordered: false, size: 'small', type: meta.tagType },
    { default: () => label },
  );
}

/**
 * 打开视频资源预览弹窗。
 *
 * :param url: 视频资源地址。
 * :return: 无返回值。
 */
function handleVideoPreview(url: string): void {
  videoPreviewUrl.value = url;
  videoPreviewVisible.value = true;
}

/**
 * 清理视频资源预览地址。
 *
 * :return: 无返回值。
 */
function handleVideoPreviewClosed(): void {
  videoPreviewUrl.value = '';
}

/**
 * 渲染图片或视频资源预览。
 *
 * :param row: 资源数据。
 * :return: 资源预览节点或空值占位符。
 */
function renderResourcePreview(row: AdminSource): VNodeChild {
  if (row.isDeleted) {
    return '-';
  }

  const resourceType = getResourceType(row.url);
  if (resourceType === 'image') {
    return renderImageCell(row.url, '资源预览');
  }
  if (resourceType === 'video') {
    return h(
      NButton,
      {
        size: 'small',
        type: 'primary',
        onClick: () => handleVideoPreview(row.url),
      },
      { default: () => '预览视频' },
    );
  }
  return '-';
}

const columns = computed<DataTableColumns<AdminSource>>(() => [
  { key: 'url', title: '资源地址', width: 340, ellipsis: { tooltip: true } },
  {
    key: 'type',
    render: (row) => renderResourceType(row.url),
    title: '类型',
    width: 150,
  },
  {
    key: 'preview',
    render: (row) => renderResourcePreview(row),
    title: '预览',
    width: 130,
  },
  {
    key: 'userId',
    render: (row) => renderUserCell(row.userId),
    title: '用户',
    width: 220,
  },
  {
    key: 'isDeleted',
    title: '已删除',
    width: 100,
    render: (row) =>
      h(
        NTag,
        {
          bordered: false,
          size: 'small',
          type: row.isDeleted ? 'error' : 'success',
        },
        { default: () => getBooleanLabel(row.isDeleted) },
      ),
  },
  { key: 'createTime', title: '创建时间', width: 200 },
  {
    fixed: 'right',
    key: 'actions',
    title: '操作',
    width: 180,
    render: (row) => {
      const actions: VNodeChild[] = [];
      if (canAccess('source:update'))
        actions.push(
          h(
            NButton,
            {
              size: 'small',
              type: row.isDeleted ? 'primary' : 'warning',
              onClick: () => handleStatus(row, !row.isDeleted),
            },
            { default: () => (row.isDeleted ? '恢复' : '标记删除') },
          ),
        );
      if (canAccess('source:delete') && row.isDeleted)
        actions.push(
          h(
            NButton,
            { size: 'small', type: 'error', onClick: () => handleDelete(row) },
            { default: () => '永久删除' },
          ),
        );
      return actions.length > 0
        ? h(NSpace, { size: 8 }, { default: () => actions })
        : '-';
    },
  },
]);

/**
 * 加载资源用户选择项。
 *
 * :return: 无返回值。
 */
async function loadUsers(): Promise<void> {
  const size = 200;
  const userRecords: AdminUser[] = [];
  let current = 1;
  let totalUsers: number;
  try {
    do {
      const page = await getAdminUserPageApi({ current, size });
      userRecords.push(...page.records);
      totalUsers = page.total;
      current += 1;
    } while (userRecords.length < totalUsers);
    users.value = userRecords;
  } catch {
    users.value = [];
  }
}

async function loadData() {
  loading.value = true;
  try {
    const page = await getAdminSourcePageApi({
      current: query.current,
      isDeleted: query.isDeleted === null ? null : Boolean(query.isDeleted),
      keyword: query.keyword || undefined,
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
async function handleStatus(row: AdminSource, isDeleted: boolean) {
  await updateAdminSourceApi(row.id, { isDeleted });
  message.success('资源状态已更新');
  await loadData();
}
/**
 * 确认并删除资源记录。
 *
 * :param row: 资源数据。
 * :return: 无返回值。
 */
function handleDelete(row: AdminSource): void {
  showDeleteConfirm('确认永久删除该资源及 OSS 文件？', async () => {
    await deleteAdminSourceApi(row.id);
    message.success('资源已删除');
    await loadData();
  });
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
onMounted(() => {
  void Promise.all([loadUsers(), loadData()]);
});
</script>
<template>
  <Page title="资源管理">
    <NCard :bordered="false">
      <NSpace align="center" class="mb-4" wrap>
        <NInput
          v-model:value="query.keyword"
          clearable
          placeholder="资源地址关键词"
          class="w-[240px]"
          @keyup.enter="handleSearch"
        /><AdminUserSelect
          v-model:value="query.userId"
          :users="users"
          placeholder="用户"
          class="w-[220px]"
        /><NSelect
          v-model:value="query.isDeleted"
          :options="booleanNumberOptions"
          clearable
          placeholder="是否删除"
          class="w-[130px]"
        /><NButton
          v-if="canAccess('source:query')"
          type="primary"
          @click="handleSearch"
        >
          查询
        </NButton>
</NSpace><NDataTable
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
    </NCard>
    <NModal
      v-model:show="videoPreviewVisible"
      class="w-[min(960px,90vw)]"
      preset="card"
      title="视频预览"
      @after-leave="handleVideoPreviewClosed"
    >
      <video
        v-if="videoPreviewVisible && videoPreviewUrl"
        :src="videoPreviewUrl"
        autoplay
        class="max-h-[75vh] w-full rounded bg-black"
        controls
      ></video>
    </NModal>
  </Page>
</template>
