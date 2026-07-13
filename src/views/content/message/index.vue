<script setup lang="ts">
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui';

import type { VNodeChild } from 'vue';

import type { AdminMessage, AdminMessagePayload, SnowflakeId } from '#/api';

import { h, onMounted, reactive, ref } from 'vue';

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
  NSpace,
  useMessage,
} from 'naive-ui';

import {
  deleteAdminMessageApi,
  getAdminMessageApi,
  getAdminMessagePageApi,
  updateAdminMessageApi,
} from '#/api';

import { hasActionPermission } from '../../system/permission-actions';

type MessageForm = Required<
  Pick<
    AdminMessagePayload,
    'address' | 'avatar' | 'content' | 'email' | 'nickname'
  >
>;

const message = useMessage();
const accessStore = useAccessStore();
const loading = ref(false);
const modalVisible = ref(false);
const editingId = ref<AdminMessage['id']>();
const formRef = ref<FormInst | null>(null);
const messages = ref<AdminMessage[]>([]);
const total = ref(0);

const query = reactive({
  current: 1,
  keyword: '',
  parentId: null as null | SnowflakeId,
  size: 10,
  userId: null as null | SnowflakeId,
});

const defaultForm: MessageForm = {
  address: '',
  avatar: '',
  content: '',
  email: '',
  nickname: '',
};

const form = reactive<MessageForm>({ ...defaultForm });

const rules: FormRules = {
  content: { message: '请输入留言内容', required: true, trigger: 'blur' },
};

function canAccess(code: string) {
  return hasActionPermission(accessStore.accessCodes, code);
}

const columns: DataTableColumns<AdminMessage> = [
  {
    ellipsis: { tooltip: true },
    key: 'content',
    title: '留言内容',
    width: 260,
  },
  {
    key: 'nickname',
    render: (row) => row.nickname || '-',
    title: '昵称',
    width: 140,
  },
  {
    key: 'email',
    render: (row) => row.email || '-',
    title: '邮箱',
    width: 180,
  },
  { key: 'userId', title: '用户 ID', width: 170 },
  { key: 'parentId', title: '父留言 ID', width: 170 },
  {
    ellipsis: { tooltip: true },
    key: 'address',
    render: (row) => row.address || '-',
    title: '地址',
    width: 160,
  },
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
      if (canAccess('message:update')) {
        actions.push(
          h(
            NButton,
            { size: 'small', onClick: () => openEdit(row) },
            { default: () => '编辑' },
          ),
        );
      }
      if (canAccess('message:delete')) {
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
];

function resetForm() {
  Object.assign(form, { ...defaultForm });
  editingId.value = undefined;
}

async function loadMessages() {
  loading.value = true;
  try {
    const page = await getAdminMessagePageApi({
      current: query.current,
      keyword: query.keyword || undefined,
      parentId: query.parentId,
      size: query.size,
      userId: query.userId,
    });
    messages.value = page.records;
    total.value = page.total;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.current = 1;
  void loadMessages();
}

async function openEdit(row: AdminMessage) {
  resetForm();
  const detail = await getAdminMessageApi(row.id);
  Object.assign(form, {
    address: detail.address ?? '',
    avatar: detail.avatar ?? '',
    content: detail.content,
    email: detail.email ?? '',
    nickname: detail.nickname ?? '',
  });
  editingId.value = detail.id;
  modalVisible.value = true;
}

async function handleSubmit() {
  await formRef.value?.validate();
  if (!editingId.value) {
    return;
  }
  await updateAdminMessageApi(editingId.value, form);
  message.success('留言已更新');
  modalVisible.value = false;
  await loadMessages();
}

async function handleDelete(row: AdminMessage) {
  if (!window.confirm('确认删除这条留言？')) {
    return;
  }
  await deleteAdminMessageApi(row.id);
  message.success('留言已删除');
  await loadMessages();
}

function handlePageChange(page: number) {
  query.current = page;
  void loadMessages();
}

function handlePageSizeChange(size: number) {
  query.size = size;
  query.current = 1;
  void loadMessages();
}

onMounted(loadMessages);
</script>

<template>
  <Page title="留言管理">
    <NCard :bordered="false">
      <NSpace align="center" class="mb-4" wrap>
        <NInput
          v-model:value="query.keyword"
          clearable
          placeholder="内容 / 昵称 / 邮箱"
          class="w-[240px]"
          @keyup.enter="handleSearch"
        />
        <NInput
          v-model:value="query.userId"
          clearable
          placeholder="用户 ID"
          class="w-[170px]"
        />
        <NInput
          v-model:value="query.parentId"
          clearable
          placeholder="父留言 ID"
          class="w-[170px]"
        />
        <NButton
          v-if="canAccess('message:query')"
          type="primary"
          @click="handleSearch"
        >
          查询
        </NButton>
      </NSpace>

      <NDataTable
        :columns="columns"
        :data="messages"
        :loading="loading"
        :row-key="(row) => row.id"
        :scroll-x="1260"
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
      title="编辑留言"
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
        <NFormItem label="昵称" path="nickname">
          <NInput v-model:value="form.nickname" />
        </NFormItem>
        <NFormItem label="邮箱" path="email">
          <NInput v-model:value="form.email" />
        </NFormItem>
        <NFormItem label="头像" path="avatar">
          <NInput v-model:value="form.avatar" />
        </NFormItem>
        <NFormItem label="地址" path="address">
          <NInput v-model:value="form.address" />
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
            v-if="canAccess('message:update')"
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
