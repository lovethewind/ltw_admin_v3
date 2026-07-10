<script setup lang="ts">
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui';

import type { VNodeChild } from 'vue';

import type { AdminComment, AdminCommentPayload, SnowflakeId } from '#/api';

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
  updateAdminCommentApi,
  updateAdminCommentStatusApi,
} from '#/api';

import { hasActionPermission } from '../../system/permission-actions';
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
  status: { message: '请选择状态', required: true, trigger: 'change' },
};

const statusActionOptions = computed(() =>
  commentStatusOptions.filter((item) => item.value !== 3),
);

function canAccess(code: string) {
  return hasActionPermission(accessStore.accessCodes, code);
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
  { key: 'objId', title: '对象 ID', width: 170 },
  { key: 'userId', title: '用户 ID', width: 170 },
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
  { key: 'parentId', title: '父评论 ID', width: 170 },
  {
    key: 'createTime',
    render: (row) => row.createTime || '-',
    title: '创建时间',
    width: 170,
  },
  {
    fixed: 'right',
    key: 'actions',
    render: (row) => {
      const actions: VNodeChild[] = [];
      if (canAccess('content:comment:update')) {
        actions.push(
          h(
            NButton,
            { size: 'small', onClick: () => openEdit(row) },
            { default: () => '编辑' },
          ),
        );
      }
      if (canAccess('content:comment:status') && row.status !== 1) {
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
      if (canAccess('content:comment:status') && row.status !== 2) {
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
      if (canAccess('content:comment:delete')) {
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

async function handleDelete(row: AdminComment) {
  if (!window.confirm('确认删除这条评论？')) {
    return;
  }
  await deleteAdminCommentApi(row.id);
  message.success('评论已删除');
  await loadComments();
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

onMounted(loadComments);
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
        <NInput
          v-model:value="query.userId"
          clearable
          placeholder="用户 ID"
          class="w-[170px]"
        />
        <NSelect
          v-model:value="query.status"
          :options="commentStatusOptions"
          clearable
          placeholder="状态"
          class="w-[130px]"
        />
        <NButton
          v-if="canAccess('content:comment:query')"
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
        :scroll-x="1400"
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
            v-if="canAccess('content:comment:update')"
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
