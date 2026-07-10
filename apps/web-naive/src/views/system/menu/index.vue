<script setup lang="ts">
import type { FormInst, TreeOption } from 'naive-ui';

import type { AdminMenuFormPayload } from './menu-form';
import type { MenuTreeOption } from './tree-options';

import type { AdminMenu, SnowflakeId } from '#/api';

import { computed, h, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  NButton,
  NCard,
  NEmpty,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NModal,
  NSelect,
  NSpace,
  NSpin,
  NSwitch,
  NTag,
  NTree,
  useMessage,
} from 'naive-ui';

import {
  createAdminMenuApi,
  deleteAdminMenuApi,
  getAdminMenuTreeApi,
  updateAdminMenuApi,
} from '#/api';

import {
  getPermittedActions,
  hasActionPermission,
} from '../permission-actions';
import {
  getParentMenuLabel,
  normalizeAdminMenuPayload,
  validateMenuCode,
  validateMenuType,
} from './menu-form';
import {
  collectMenuKeys,
  findMenuByKey,
  toMenuTreeOptions,
} from './tree-options';

const message = useMessage();
const accessStore = useAccessStore();
const loading = ref(false);
const modalVisible = ref(false);
const editingId = ref<AdminMenu['id']>();
const formRef = ref<FormInst | null>(null);
const menus = ref<AdminMenu[]>([]);
const expandedKeys = ref<SnowflakeId[]>([]);
const selectedKeys = ref<SnowflakeId[]>([]);
const selectedMenu = ref<AdminMenu | null>(null);

type AdminMenuForm = AdminMenuFormPayload;

const defaultForm: AdminMenuForm = {
  alwaysShow: false,
  code: '',
  component: '',
  hidden: false,
  icon: '',
  index: 100_000,
  isActive: true,
  isOutLink: false,
  menuType: 1,
  name: '',
  parentId: '0',
  path: '',
  routeName: '',
};

const form = reactive<AdminMenuForm>({ ...defaultForm });

const menuTypeOptions = [
  { label: '目录', value: 0 },
  { label: '菜单', value: 1 },
  { label: '按钮', value: 2 },
];

const rules = {
  code: {
    message: '请输入权限标识',
    trigger: 'blur',
    validator: () => validateMenuCode(form.menuType, form.code),
  },
  name: { message: '请输入名称', required: true, trigger: 'blur' },
  menuType: {
    message: '请选择类型',
    trigger: 'change',
    validator: () => validateMenuType(form.menuType),
  },
};

const treeOptions = computed(() => toMenuTreeOptions(menus.value));
const parentMenuLabel = computed(() =>
  getParentMenuLabel(menus.value, form.parentId),
);
const hasSelectedMenuActions = computed(
  () =>
    selectedMenu.value &&
    getPermittedActions(accessStore.accessCodes, [
      { code: 'system:menu:create', key: 'create' },
      { code: 'system:menu:update', key: 'update' },
      { code: 'system:menu:delete', key: 'delete' },
    ]).length > 0,
);

function canAccess(code: string) {
  return hasActionPermission(accessStore.accessCodes, code);
}

function getMenuTypeLabel(type: number) {
  return menuTypeOptions.find((item) => item.value === type)?.label ?? '未知';
}

function getMenuTypeTag(type: number) {
  if (type === 0) {
    return 'info';
  }
  if (type === 2) {
    return 'warning';
  }
  return 'success';
}

function renderTreeLabel({ option }: { option: TreeOption }) {
  const menu = (option as MenuTreeOption).menu;
  if (!menu) {
    return '';
  }

  return h('div', { class: 'flex min-w-0 items-center gap-2 py-1' }, [
    h('span', { class: 'truncate' }, menu.name),
    h(
      NTag,
      { bordered: false, size: 'small', type: getMenuTypeTag(menu.menuType) },
      { default: () => getMenuTypeLabel(menu.menuType) },
    ),
    menu.isActive
      ? null
      : h(
          NTag,
          { bordered: false, size: 'small', type: 'default' },
          { default: () => '停用' },
        ),
  ]);
}

function resetForm(parentId: AdminMenu['parentId'] = '0') {
  Object.assign(form, { ...defaultForm, parentId: parentId || '0' });
  editingId.value = undefined;
}

function syncSelectedMenu() {
  const currentKey = selectedKeys.value[0];
  selectedMenu.value =
    currentKey === undefined ? null : findMenuByKey(menus.value, currentKey);
}

async function loadMenus() {
  loading.value = true;
  try {
    menus.value = await getAdminMenuTreeApi(false);
    expandedKeys.value = collectMenuKeys(menus.value);

    const currentKey = selectedKeys.value[0];
    if (currentKey && findMenuByKey(menus.value, currentKey)) {
      syncSelectedMenu();
      return;
    }

    const firstMenu = menus.value[0] ?? null;
    selectedMenu.value = firstMenu;
    selectedKeys.value = firstMenu ? [firstMenu.id] : [];
  } finally {
    loading.value = false;
  }
}

function handleUpdateSelectedKeys(keys: Array<number | string>) {
  selectedKeys.value = keys as SnowflakeId[];
  syncSelectedMenu();
}

function openCreate(parentId: AdminMenu['parentId'] = '0') {
  resetForm(parentId);
  modalVisible.value = true;
}

function openCreateChild() {
  openCreate(selectedMenu.value?.id ?? '0');
}

function openEdit(row: AdminMenu | null = selectedMenu.value) {
  if (!row) {
    return;
  }

  Object.assign(form, {
    alwaysShow: row.alwaysShow,
    code: row.code ?? '',
    component: row.component ?? '',
    hidden: row.hidden,
    icon: row.icon ?? '',
    index: row.index,
    isActive: row.isActive,
    isOutLink: row.isOutLink,
    menuType: row.menuType,
    name: row.name,
    parentId: row.parentId || '0',
    path: row.path ?? '',
    routeName: row.routeName ?? '',
  });
  editingId.value = row.id;
  modalVisible.value = true;
}

async function handleSubmit() {
  await formRef.value?.validate();
  const payload = normalizeAdminMenuPayload(form);
  if (editingId.value) {
    await updateAdminMenuApi(editingId.value, payload);
    message.success('菜单已更新');
  } else {
    await createAdminMenuApi(payload);
    message.success('菜单已创建');
  }
  modalVisible.value = false;
  await loadMenus();
}

async function handleDelete(row: AdminMenu | null = selectedMenu.value) {
  if (!row) {
    return;
  }

  if (!window.confirm(`确认删除“${row.name}”？`)) {
    return;
  }
  await deleteAdminMenuApi(row.id);
  message.success('菜单已删除');
  selectedKeys.value = [];
  selectedMenu.value = null;
  await loadMenus();
}

onMounted(loadMenus);
</script>

<template>
  <Page title="菜单管理">
    <div class="grid gap-4 lg:grid-cols-[minmax(320px,420px)_1fr]">
      <NCard :bordered="false" title="菜单树">
        <template #header-extra>
          <NButton
            v-if="canAccess('system:menu:create')"
            type="primary"
            @click="openCreate()"
          >
            新增根菜单
          </NButton>
        </template>
        <NSpin :show="loading">
          <NTree
            v-if="treeOptions.length > 0"
            :data="treeOptions"
            :expanded-keys="expandedKeys"
            :render-label="renderTreeLabel"
            :selected-keys="selectedKeys"
            block-line
            class="min-h-[420px]"
            expand-on-click
            @update:expanded-keys="expandedKeys = $event"
            @update:selected-keys="handleUpdateSelectedKeys"
          />
          <NEmpty v-else description="暂无菜单数据" class="py-16" />
        </NSpin>
      </NCard>

      <NCard :bordered="false" title="菜单详情">
        <template v-if="selectedMenu" #header-extra>
          <NSpace v-if="hasSelectedMenuActions">
            <NButton
              v-if="canAccess('system:menu:create')"
              @click="openCreateChild"
            >
              新增子级
            </NButton>
            <NButton v-if="canAccess('system:menu:update')" @click="openEdit()">
              编辑
            </NButton>
            <NButton
              v-if="canAccess('system:menu:delete')"
              type="error"
              @click="handleDelete()"
            >
              删除
            </NButton>
          </NSpace>
        </template>

        <div v-if="selectedMenu" class="grid gap-4 md:grid-cols-2">
          <div class="space-y-1">
            <div class="text-sm text-gray-500">名称</div>
            <div class="font-medium">{{ selectedMenu.name }}</div>
          </div>
          <div class="space-y-1">
            <div class="text-sm text-gray-500">类型</div>
            <NTag :type="getMenuTypeTag(selectedMenu.menuType)" size="small">
              {{ getMenuTypeLabel(selectedMenu.menuType) }}
            </NTag>
          </div>
          <div class="space-y-1">
            <div class="text-sm text-gray-500">权限标识</div>
            <div class="break-all">{{ selectedMenu.code || '-' }}</div>
          </div>
          <div class="space-y-1">
            <div class="text-sm text-gray-500">路由名称</div>
            <div class="break-all">{{ selectedMenu.routeName || '-' }}</div>
          </div>
          <div class="space-y-1">
            <div class="text-sm text-gray-500">路由地址</div>
            <div class="break-all">{{ selectedMenu.path || '-' }}</div>
          </div>
          <div class="space-y-1">
            <div class="text-sm text-gray-500">组件路径</div>
            <div class="break-all">{{ selectedMenu.component || '-' }}</div>
          </div>
          <div class="space-y-1">
            <div class="text-sm text-gray-500">上级菜单</div>
            <div>{{ getParentMenuLabel(menus, selectedMenu.parentId) }}</div>
          </div>
          <div class="space-y-1">
            <div class="text-sm text-gray-500">排序</div>
            <div>{{ selectedMenu.index }}</div>
          </div>
          <div class="space-y-1">
            <div class="text-sm text-gray-500">图标</div>
            <div class="break-all">{{ selectedMenu.icon || '-' }}</div>
          </div>
          <div class="space-y-1">
            <div class="text-sm text-gray-500">是否启用</div>
            <NTag
              :type="selectedMenu.isActive ? 'success' : 'default'"
              size="small"
            >
              {{ selectedMenu.isActive ? '启用' : '停用' }}
            </NTag>
          </div>
          <div class="space-y-1">
            <div class="text-sm text-gray-500">隐藏菜单</div>
            <div>{{ selectedMenu.hidden ? '是' : '否' }}</div>
          </div>
          <div class="space-y-1">
            <div class="text-sm text-gray-500">外链</div>
            <div>{{ selectedMenu.isOutLink ? '是' : '否' }}</div>
          </div>
        </div>
        <NEmpty v-else description="请选择左侧菜单" class="py-16" />
      </NCard>
    </div>

    <NModal
      v-model:show="modalVisible"
      :title="editingId ? '编辑菜单' : '新增菜单'"
      preset="card"
      class="w-[720px] max-w-[92vw]"
    >
      <NForm
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="left"
        label-width="92"
      >
        <div class="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <NFormItem label="上级菜单" path="parentId">
            <NInput :value="parentMenuLabel" disabled />
          </NFormItem>
          <NFormItem label="类型" path="menuType">
            <NSelect v-model:value="form.menuType" :options="menuTypeOptions" />
          </NFormItem>
          <NFormItem label="名称" path="name">
            <NInput v-model:value="form.name" />
          </NFormItem>
          <NFormItem label="权限标识" path="code">
            <NInput v-model:value="form.code" />
          </NFormItem>
          <NFormItem label="路由名称" path="routeName">
            <NInput v-model:value="form.routeName" />
          </NFormItem>
          <NFormItem label="路由地址" path="path">
            <NInput v-model:value="form.path" />
          </NFormItem>
          <NFormItem label="组件路径" path="component">
            <NInput v-model:value="form.component" />
          </NFormItem>
          <NFormItem label="图标" path="icon">
            <NInput v-model:value="form.icon" />
          </NFormItem>
          <NFormItem label="排序" path="index">
            <NInputNumber v-model:value="form.index" class="w-full" />
          </NFormItem>
          <NFormItem label="是否启用" path="isActive">
            <NSwitch v-model:value="form.isActive" />
          </NFormItem>
          <NFormItem label="隐藏菜单" path="hidden">
            <NSwitch v-model:value="form.hidden" />
          </NFormItem>
          <NFormItem label="固定展开" path="alwaysShow">
            <NSwitch v-model:value="form.alwaysShow" />
          </NFormItem>
          <NFormItem label="外链" path="isOutLink">
            <NSwitch v-model:value="form.isOutLink" />
          </NFormItem>
        </div>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="modalVisible = false">取消</NButton>
          <NButton
            v-if="
              editingId
                ? canAccess('system:menu:update')
                : canAccess('system:menu:create')
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
