<script setup lang="ts">
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui';

import type { VNodeChild } from 'vue';

import type {
  AdminComment,
  AdminCommentPayload,
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
  deleteAdminCommentApi,
  getAdminCommentApi,
  getAdminCommentPageApi,
  getAdminUserPageApi,
  updateAdminCommentApi,
  updateAdminCommentStatusApi,
} from '#/api';
import { showDeleteConfirm } from '#/utils/confirm';

import { hasActionPermission } from '../../system/permission-actions';
import AdminUserDisplay from '../../system/user/user-display.vue';
import AdminUserSelect from '../../system/user/user-select.vue';
import {
  commentObjectTypeOptions,
  commentStatusOptions,
  getCommentObjectTypeLabel,
  getCommentStatusLabel,
  getCommentStatusType,
} from './comment-options';

type CommentForm = Required<Pick<AdminCommentPayload, 'content' | 'status'>>;

const message = useMessage();
const accessStore = useAccessStore();
const loading = ref(false);
const modalVisible = ref(false);
const editingId = ref<AdminComment['id']>();
const formRef = ref<FormInst | null>(null);
const comments = ref<AdminComment[]>([]);
const users = ref<AdminUser[]>([]);
const total = ref(0);

const query = reactive({
  current: 1,
  keyword: '',
  objId: null as null | SnowflakeId,
  objType: null as null | number,
  size: 10,
  status: null as null | number,
  userId: null as null | SnowflakeId,
});

const defaultForm: CommentForm = {
  content: '',
  status: 1,
};

const form = reactive<CommentForm>({ ...defaultForm });

const rules: FormRules = {
  content: { message: '请输入评论内容', required: true, trigger: 'blur' },
  status: {
    message: '请选择状态',
    required: true,
    trigger: 'change',
    type: 'number',
  },
};

const statusActionOptions = commentStatusOptions.map((item) =>
  item.value === 3 ? { ...item, label: '删除' } : item,
);

function canAccess(code: string) {
  return hasActionPermission(accessStore.accessCodes, code);
}

/**
 * 获取评论对象的展示内容。
 *
 * :param comment: 评论数据。
 * :return: 对象内容；对象不存在时返回对象 ID。
 */
function getCommentObjectContent(comment: AdminComment): string {
  return comment.objContent || String(comment.objId);
}

/**
 * 获取父级评论的展示内容。
 *
 * :param comment: 评论数据。
 * :return: 父级评论内容；顶级评论返回空字符串。
 */
function getParentCommentContent(comment: AdminComment): string {
  if (!comment.parentId || String(comment.parentId) === '0') {
    return '';
  }
  return comment.parentContent || String(comment.parentId);
}

const columns = computed<DataTableColumns<AdminComment>>(() => [
  {
    ellipsis: { tooltip: true },
    key: 'content',
    title: '评论内容',
    width: 260,
  },
  {
    key: 'objType',
    render: (row) => getCommentObjectTypeLabel(row.objType),
    title: '对象类型',
    width: 110,
  },
  {
    ellipsis: { tooltip: true },
    key: 'objContent',
    render: (row) => getCommentObjectContent(row),
    title: '对象',
    width: 260,
  },
  {
    ellipsis: { tooltip: true },
    key: 'user',
    render: (row) =>
      h(AdminUserDisplay, { fallback: row.userId, user: row.user }),
    title: '用户',
    width: 220,
  },
  {
    key: 'status',
    render: (row) =>
      h(
        NTag,
        {
          bordered: false,
          size: 'small',
          type: getCommentStatusType(row.status),
        },
        { default: () => getCommentStatusLabel(row.status) },
      ),
    title: '状态',
    width: 100,
  },
  {
    ellipsis: { tooltip: true },
    key: 'parentContent',
    render: (row) => getParentCommentContent(row),
    title: '父级评论',
    width: 260,
  },
  {
    key: 'createTime',
    render: (row) =>
      h('span', { class: 'whitespace-nowrap' }, row.createTime || '-'),
    title: '创建时间',
    width: 200,
  },
  {
    fixed: 'right',
    key: 'actions',
    render: (row) => {
      const actions: VNodeChild[] = [];
      if (canAccess('comment:update')) {
        actions.push(
          h(
            NButton,
            { size: 'small', onClick: () => openEdit(row) },
            { default: () => '编辑' },
          ),
        );
      }
      if (canAccess('comment:status') && row.status !== 1) {
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
      if (canAccess('comment:status') && row.status !== 2) {
        actions.push(
          h(
            NButton,
            {
              size: 'small',
              type: 'warning',
              onClick: () => handleStatus(row, 2),
            },
            { default: () => '审核' },
          ),
        );
      }
      if (canAccess('comment:delete')) {
        actions.push(
          h(
            NButton,
            { size: 'small', type: 'error', onClick: () => handleDelete(row) },
            { default: () => '永久删除' },
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
 * 加载用户筛选选项。
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

async function loadComments() {
  loading.value = true;
  try {
    const page = await getAdminCommentPageApi({
      current: query.current,
      keyword: query.keyword || undefined,
      objId: query.objId,
      objType: query.objType,
      size: query.size,
      status: query.status,
      userId: query.userId,
    });
    comments.value = page.records;
    total.value = page.total;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.current = 1;
  void loadComments();
}

async function openEdit(row: AdminComment) {
  resetForm();
  const detail = await getAdminCommentApi(row.id);
  Object.assign(form, {
    content: detail.content,
    status: detail.status,
  });
  editingId.value = detail.id;
  modalVisible.value = true;
}

async function handleSubmit() {
  await formRef.value?.validate();
  if (!editingId.value) {
    return;
  }
  await updateAdminCommentApi(editingId.value, form);
  message.success('评论已更新');
  modalVisible.value = false;
  await loadComments();
}

async function handleStatus(row: AdminComment, status: number) {
  await updateAdminCommentStatusApi(row.id, status);
  message.success('评论状态已更新');
  await loadComments();
}

/**
 * 确认并删除评论。
 *
 * :param row: 评论数据。
 * :return: 无返回值。
 */
function handleDelete(row: AdminComment): void {
  showDeleteConfirm(
    '永久删除后无法恢复，确认永久删除这条评论？',
    async () => {
      await deleteAdminCommentApi(row.id);
      message.success('评论已永久删除');
      await loadComments();
    },
    { positiveText: '永久删除', title: '永久删除' },
  );
}

function handlePageChange(page: number) {
  query.current = page;
  void loadComments();
}

function handlePageSizeChange(size: number) {
  query.size = size;
  query.current = 1;
  void loadComments();
}

/**
 * 初始化评论管理页面。
 *
 * :return: 无返回值。
 */
async function initializePage(): Promise<void> {
  await Promise.all([loadUsers(), loadComments()]);
}

onMounted(initializePage);
</script>

<template>
  <Page title="评论管理">
    <NCard :bordered="false">
      <NSpace align="center" class="mb-4" wrap>
        <NInput
          v-model:value="query.keyword"
          clearable
          placeholder="评论关键词"
          class="w-[220px]"
          @keyup.enter="handleSearch"
        />
        <NSelect
          v-model:value="query.objType"
          :options="commentObjectTypeOptions"
          clearable
          placeholder="对象类型"
          class="w-[130px]"
        />
        <NInput
          v-model:value="query.objId"
          clearable
          placeholder="对象 ID"
          class="w-[170px]"
        />
        <AdminUserSelect
          v-model:value="query.userId"
          :users="users"
          placeholder="用户"
          class="w-[220px]"
        />
        <NSelect
          v-model:value="query.status"
          :options="commentStatusOptions"
          clearable
          placeholder="状态"
          class="w-[130px]"
        />
        <NButton
          v-if="canAccess('comment:query')"
          type="primary"
          @click="handleSearch"
        >
          查询
        </NButton>
      </NSpace>

      <NDataTable
        :columns="columns"
        :data="comments"
        :loading="loading"
        :row-key="(row) => row.id"
        :scroll-x="1660"
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
      title="编辑评论"
      preset="card"
      class="w-[620px] max-w-[92vw]"
    >
      <NForm
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="left"
        label-width="88"
      >
        <NFormItem label="状态" path="status">
          <NSelect v-model:value="form.status" :options="statusActionOptions" />
        </NFormItem>
        <NFormItem label="内容" path="content">
          <NInput
            v-model:value="form.content"
            type="textarea"
            :autosize="{ minRows: 5 }"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="modalVisible = false">取消</NButton>
          <NButton
            v-if="canAccess('comment:update')"
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
