<script setup lang="ts">
import type { DataTableColumns, FormInst, TreeOption } from 'naive-ui';

import type { VNodeChild } from 'vue';

import type { AdminRole, AdminRolePayload } from '#/api';

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
  NSpace,
  NSwitch,
  NTag,
  NTree,
  useMessage,
} from 'naive-ui';

import {
  createAdminRoleApi,
  deleteAdminRoleApi,
  getAdminMenuTreeApi,
  getAdminRoleListApi,
  getAdminRoleMenuIdsApi,
  updateAdminRoleApi,
  updateAdminRoleMenusApi,
} from '#/api';

import { hasActionPermission } from '../permission-actions';
import {
  collectTreeKeys,
  normalizeCheckedTreeKeys,
  toRoleMenuTreeOptions,
} from './role-auth';

const message = useMessage();
const accessStore = useAccessStore();
const loading = ref(false);
const modalVisible = ref(false);
const authModalVisible = ref(false);
const editingId = ref<AdminRole['id']>();
const currentRoleId = ref<AdminRole['id']>();
const formRef = ref<FormInst | null>(null);
const roles = ref<AdminRole[]>([]);
const menuTree = ref<TreeOption[]>([]);
const checkedMenuIds = ref<string[]>([]);

const defaultForm: AdminRolePayload = {
  code: '',
  description: '',
  isActive: true,
  name: '',
};

const form = reactive<AdminRolePayload>({ ...defaultForm });

const rules = {
  code: { message: '请输入角色标识', required: true, trigger: 'blur' },
  name: { message: '请输入角色名称', required: true, trigger: 'blur' },
};

function canAccess(code: string) {
  return hasActionPermission(accessStore.accessCodes, code);
}

const columns = computed<DataTableColumns<AdminRole>>(() => [
  {
    key: 'name',
    title: '角色名称',
  },
  {
    key: 'code',
    title: '角色标识',
  },
  {
    key: 'description',
    title: '说明',
  },
  {
    key: 'isActive',
    render: (row) =>
      h(
        NTag,
        { size: 'small', type: row.isActive ? 'success' : 'default' },
        {
          default: () => (row.isActive ? '启用' : '停用'),
        },
      ),
    title: '状态',
    width: 100,
  },
  {
    fixed: 'right',
    key: 'actions',
    render: (row) => {
      const actions: VNodeChild[] = [];
      if (canAccess('system:role:auth')) {
        actions.push(
          h(
            NButton,
            { size: 'small', onClick: () => openAuth(row) },
            { default: () => '授权' },
          ),
        );
      }
      if (canAccess('system:role:update')) {
        actions.push(
          h(
            NButton,
            { size: 'small', onClick: () => openEdit(row) },
            { default: () => '编辑' },
          ),
        );
      }
      if (canAccess('system:role:delete')) {
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
    width: 240,
  },
]);

function resetForm() {
  Object.assign(form, { ...defaultForm });
  editingId.value = undefined;
}

async function loadRoles() {
  loading.value = true;
  try {
    roles.value = await getAdminRoleListApi();
  } finally {
    loading.value = false;
  }
}

async function loadMenuTree() {
  const menus = await getAdminMenuTreeApi(false);
  menuTree.value = toRoleMenuTreeOptions(menus);
}

function openCreate() {
  resetForm();
  modalVisible.value = true;
}

function openEdit(row: AdminRole) {
  Object.assign(form, {
    code: row.code,
    description: row.description ?? '',
    isActive: row.isActive,
    name: row.name,
  });
  editingId.value = row.id;
  modalVisible.value = true;
}

async function openAuth(row: AdminRole) {
  currentRoleId.value = row.id;
  await loadMenuTree();
  checkedMenuIds.value = await getAdminRoleMenuIdsApi(row.id);
  authModalVisible.value = true;
}

async function handleSubmit() {
  await formRef.value?.validate();
  const payload = { ...form };
  if (editingId.value) {
    await updateAdminRoleApi(editingId.value, payload);
    message.success('角色已更新');
  } else {
    await createAdminRoleApi(payload);
    message.success('角色已创建');
  }
  modalVisible.value = false;
  await loadRoles();
}

async function handleDelete(row: AdminRole) {
  if (!window.confirm(`确认删除“${row.name}”？`)) {
    return;
  }
  await deleteAdminRoleApi(row.id);
  message.success('角色已删除');
  await loadRoles();
}

async function handleSaveAuth() {
  if (!currentRoleId.value) {
    return;
  }
  await updateAdminRoleMenusApi(
    currentRoleId.value,
    normalizeCheckedTreeKeys(checkedMenuIds.value, menuTree.value),
  );
  authModalVisible.value = false;
  message.success('角色授权已更新');
}

function handleCheckAllMenus() {
  checkedMenuIds.value = collectTreeKeys(menuTree.value);
}

function handleClearMenus() {
  checkedMenuIds.value = [];
}

onMounted(loadRoles);
</script>

<template>
  <Page title="角色管理">
    <NCard :bordered="false">
      <div class="admin-filter-toolbar mb-4">
        <div class="admin-filter-fields"></div>
        <div class="admin-filter-actions">
          <NButton
            v-if="canAccess('system:role:create')"
            type="primary"
            @click="openCreate"
          >
            新增角色
          </NButton>
        </div>
      </div>
      <NDataTable
        :columns="columns"
        :data="roles"
        :loading="loading"
        :row-key="(row) => row.id"
      />
    </NCard>

    <NModal
      v-model:show="modalVisible"
      :title="editingId ? '编辑角色' : '新增角色'"
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
        <NFormItem label="角色名称" path="name">
          <NInput v-model:value="form.name" />
        </NFormItem>
        <NFormItem label="角色标识" path="code">
          <NInput v-model:value="form.code" />
        </NFormItem>
        <NFormItem label="说明" path="description">
          <NInput v-model:value="form.description" type="textarea" />
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
                ? canAccess('system:role:update')
                : canAccess('system:role:create')
            "
            type="primary"
            @click="handleSubmit"
          >
            保存
          </NButton>
        </NSpace>
      </template>
    </NModal>

    <NModal
      v-model:show="authModalVisible"
      title="角色授权"
      preset="card"
      class="w-[560px] max-w-[92vw]"
    >
      <NSpace class="mb-3">
        <NButton size="small" @click="handleCheckAllMenus">全选</NButton>
        <NButton size="small" @click="handleClearMenus">清空</NButton>
      </NSpace>
      <NTree
        v-model:checked-keys="checkedMenuIds"
        :data="menuTree"
        block-line
        cascade
        checkable
        default-expand-all
      />
      <template #footer>
        <NSpace justify="end">
          <NButton @click="authModalVisible = false">取消</NButton>
          <NButton
            v-if="canAccess('system:role:auth')"
            type="primary"
            @click="handleSaveAuth"
          >
            保存
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </Page>
</template>
