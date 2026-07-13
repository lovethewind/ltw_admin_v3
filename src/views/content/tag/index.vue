<script setup lang="ts">
import type { FormInst, TreeOption } from 'naive-ui';

import type { TagTreeOption } from './tag-tree';

import type { AdminTag, AdminTagPayload, SnowflakeId } from '#/api';

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
  useDialog,
  useMessage,
} from 'naive-ui';

import {
  createAdminTagApi,
  deleteAdminTagApi,
  getAdminTagTreeApi,
  updateAdminTagApi,
} from '#/api';

import { hasActionPermission } from '../../system/permission-actions';
import {
  collectTagKeys,
  findTagByKey,
  flattenTagTree,
  toTagTreeOptions,
} from './tag-tree';

type AdminTagForm = Omit<AdminTagPayload, 'parentId'> & {
  parentId: string;
};

const message = useMessage();
const dialog = useDialog();
const accessStore = useAccessStore();
const loading = ref(false);
const modalVisible = ref(false);
const editingId = ref<AdminTag['id']>();
const formRef = ref<FormInst | null>(null);
const tags = ref<AdminTag[]>([]);
const expandedKeys = ref<SnowflakeId[]>([]);
const selectedKeys = ref<SnowflakeId[]>([]);
const selectedTag = ref<AdminTag | null>(null);

const defaultForm: AdminTagForm = {
  description: '',
  index: 100_000,
  isActive: true,
  level: 1,
  name: '',
  parentId: '0',
};

const form = reactive<AdminTagForm>({ ...defaultForm });

const tagLevelOptions = [
  { label: '分类层', value: 1 },
  { label: '展示层', value: 2 },
];
const parentTagOptions = computed(() => [
  { label: '自定义', value: '0' },
  ...flattenTagTree(tags.value).map((item) => ({
    label: item.name,
    value: item.id,
  })),
]);

const rules = {
  level: { message: '请选择层级', required: true, trigger: 'change' },
  name: { message: '请输入标签名称', required: true, trigger: 'blur' },
};

const treeOptions = computed(() => toTagTreeOptions(tags.value));
const hasSelectedTagActions = computed(
  () =>
    selectedTag.value &&
    ['tag:create', 'tag:update', 'tag:delete'].some(
      (code) => canAccess(code),
    ),
);

function canAccess(code: string) {
  return hasActionPermission(accessStore.accessCodes, code);
}

function getTagLevelLabel(level: number) {
  return tagLevelOptions.find((item) => item.value === level)?.label ?? '未知';
}

function getTagLevelType(level: number) {
  return level === 1 ? 'info' : 'success';
}

/**
 * 获取标签详情中的上级标签展示名称。
 *
 * :param parentId: 上级标签 ID。
 * :return: 上级标签名称、 自定义或未知。
 */
function getTagParentLabel(parentId: SnowflakeId): string {
  if (!parentId || parentId === '0') {
    return '自定义';
  }
  return findTagByKey(tags.value, parentId)?.name ?? '未知';
}

function renderTreeLabel({ option }: { option: TreeOption }) {
  const tag = (option as TagTreeOption).tag;
  if (!tag) {
    return '';
  }

  return h('div', { class: 'flex min-w-0 items-center gap-2 py-1' }, [
    h('span', { class: 'truncate' }, tag.name),
    h(
      NTag,
      { bordered: false, size: 'small', type: getTagLevelType(tag.level) },
      { default: () => getTagLevelLabel(tag.level) },
    ),
    tag.isActive
      ? null
      : h(
          NTag,
          { bordered: false, size: 'small', type: 'default' },
          { default: () => '停用' },
        ),
  ]);
}

function resetForm(parentId: AdminTag['parentId'] = '0') {
  Object.assign(form, { ...defaultForm, parentId: parentId || '0' });
  editingId.value = undefined;
}

function syncSelectedTag() {
  const currentKey = selectedKeys.value[0];
  selectedTag.value =
    currentKey === undefined ? null : findTagByKey(tags.value, currentKey);
}

async function loadTags() {
  loading.value = true;
  try {
    tags.value = await getAdminTagTreeApi(false);
    expandedKeys.value = collectTagKeys(tags.value);

    const currentKey = selectedKeys.value[0];
    if (currentKey && findTagByKey(tags.value, currentKey)) {
      syncSelectedTag();
      return;
    }

    const firstTag = tags.value[0] ?? null;
    selectedTag.value = firstTag;
    selectedKeys.value = firstTag ? [firstTag.id] : [];
  } finally {
    loading.value = false;
  }
}

function handleUpdateSelectedKeys(keys: Array<number | string>) {
  selectedKeys.value = keys as SnowflakeId[];
  syncSelectedTag();
}

function openCreate(parentId: AdminTag['parentId'] = '0') {
  resetForm(parentId);
  modalVisible.value = true;
}

function openCreateChild() {
  openCreate(selectedTag.value?.id ?? '0');
}

function openEdit(row: AdminTag | null = selectedTag.value) {
  if (!row) {
    return;
  }
  Object.assign(form, {
    description: row.description ?? '',
    index: row.index,
    isActive: row.isActive,
    level: row.level,
    name: row.name,
    parentId: row.parentId || '0',
  });
  editingId.value = row.id;
  modalVisible.value = true;
}

async function handleSubmit() {
  await formRef.value?.validate();
  const payload = { ...form };
  if (editingId.value) {
    await updateAdminTagApi(editingId.value, payload);
    message.success('标签已更新');
  } else {
    await createAdminTagApi(payload);
    message.success('标签已创建');
  }
  modalVisible.value = false;
  await loadTags();
}

/**
 * 使用统一样式确认并删除标签。
 *
 * :param row: 待删除标签
 * :return: 删除处理结果
 */
function handleDelete(row: AdminTag | null = selectedTag.value): void {
  if (!row) {
    return;
  }
  dialog.warning({
    title: '删除标签',
    content: `确认删除“${row.name}”？`,
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await deleteAdminTagApi(row.id);
      message.success('标签已删除');
      selectedKeys.value = [];
      selectedTag.value = null;
      await loadTags();
    },
  });
}

onMounted(loadTags);
</script>

<template>
  <Page title="标签管理">
    <div class="grid gap-4 lg:grid-cols-[minmax(320px,420px)_1fr]">
      <NCard :bordered="false" title="标签树">
        <template #header-extra>
          <NButton
            v-if="canAccess('tag:create')"
            type="primary"
            @click="openCreate()"
          >
            新增根标签
          </NButton>
        </template>
        <NSpin :show="loading">
          <div
            v-if="treeOptions.length > 0"
            class="lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto"
          >
            <NTree
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
          </div>
          <NEmpty v-else description="暂无标签数据" class="py-16" />
        </NSpin>
      </NCard>

      <div class="lg:sticky lg:top-4 lg:self-start">
        <NCard :bordered="false" title="标签详情">
          <template v-if="selectedTag" #header-extra>
            <NSpace v-if="hasSelectedTagActions">
              <NButton
                v-if="canAccess('tag:create')"
                @click="openCreateChild"
              >
                新增子级
              </NButton>
              <NButton
                v-if="canAccess('tag:update')"
                @click="openEdit()"
              >
                编辑
              </NButton>
              <NButton
                v-if="canAccess('tag:delete')"
                type="error"
                @click="handleDelete()"
              >
                删除
              </NButton>
            </NSpace>
          </template>

          <div v-if="selectedTag" class="grid gap-4 md:grid-cols-2">
            <div class="space-y-1">
              <div class="text-sm text-gray-500">标签名称</div>
              <div class="font-medium">{{ selectedTag.name }}</div>
            </div>
            <div class="space-y-1">
              <div class="text-sm text-gray-500">层级</div>
              <NTag :type="getTagLevelType(selectedTag.level)" size="small">
                {{ getTagLevelLabel(selectedTag.level) }}
              </NTag>
            </div>
            <div class="space-y-1">
              <div class="text-sm text-gray-500">上级</div>
              <div>{{ getTagParentLabel(selectedTag.parentId) }}</div>
            </div>
            <div class="space-y-1">
              <div class="text-sm text-gray-500">排序</div>
              <div>{{ selectedTag.index }}</div>
            </div>
            <div class="space-y-1">
              <div class="text-sm text-gray-500">状态</div>
              <NTag
                :type="selectedTag.isActive ? 'success' : 'default'"
                size="small"
              >
                {{ selectedTag.isActive ? '启用' : '停用' }}
              </NTag>
            </div>
            <div class="space-y-1 md:col-span-2">
              <div class="text-sm text-gray-500">描述</div>
              <div class="break-all">{{ selectedTag.description || '-' }}</div>
            </div>
          </div>
          <NEmpty v-else description="请选择左侧标签" class="py-16" />
        </NCard>
      </div>
    </div>

    <NModal
      v-model:show="modalVisible"
      :title="editingId ? '编辑标签' : '新增标签'"
      preset="card"
      class="w-[640px] max-w-[92vw]"
    >
      <NForm
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="left"
        label-width="88"
      >
        <div class="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <NFormItem label="上级" path="parentId">
            <NSelect
              v-model:value="form.parentId"
              :options="parentTagOptions"
            />
          </NFormItem>
          <NFormItem label="层级" path="level">
            <NSelect v-model:value="form.level" :options="tagLevelOptions" />
          </NFormItem>
          <NFormItem label="标签名称" path="name">
            <NInput v-model:value="form.name" />
          </NFormItem>
          <NFormItem label="排序" path="index">
            <NInputNumber v-model:value="form.index" class="w-full" />
          </NFormItem>
          <NFormItem label="状态" path="isActive">
            <NSwitch v-model:value="form.isActive" />
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
                ? canAccess('tag:update')
                : canAccess('tag:create')
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
