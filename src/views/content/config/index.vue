<script setup lang="ts">
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui';

import type { VNodeChild } from 'vue';

import type {
  AdminConfig,
  AdminConfigPayload,
  SearchAnalysisState,
} from '#/api';

import { computed, h, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NDivider,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NPagination,
  NSelect,
  NSpace,
  NSwitch,
  NTabPane,
  NTag,
  NTabs,
  useMessage,
} from 'naive-ui';

import {
  createAdminConfigApi,
  deleteAdminConfigApi,
  getAdminConfigApi,
  getAdminConfigPageApi,
  getSearchAnalysisApi,
  previewSearchAnalysisApi,
  publishSearchAnalysisApi,
  rebuildArticleSearchIndexApi,
  saveSearchAnalysisDraftApi,
  updateAdminConfigApi,
} from '#/api';
import { showConfirm, showDeleteConfirm } from '#/utils/confirm';

import { hasActionPermission } from '../../system/permission-actions';

const activeOptions = [
  { label: '启用', value: 1 },
  { label: '停用', value: 0 },
];

const message = useMessage();
const accessStore = useAccessStore();
const loading = ref(false);
const modalVisible = ref(false);
const editingId = ref<AdminConfig['id']>();
const formRef = ref<FormInst | null>(null);
const configs = ref<AdminConfig[]>([]);
const total = ref(0);
const searchLoading = ref(false);
const searchSaving = ref(false);
const searchState = ref<SearchAnalysisState>();
const previewText = ref('人工智能和大模型的关系');
const previewTokens = ref<string[]>([]);
const filteredPreviewTokens = ref<string[]>([]);

const searchForm = reactive({
  customWords: '',
  hotSearchStopWords: '',
  stopWords: '',
});

const query = reactive({
  current: 1,
  isActive: null as null | number,
  keyword: '',
  size: 10,
});

const defaultForm: AdminConfigPayload = {
  description: '',
  isActive: false,
  name: '',
  value: '',
};

const form = reactive<AdminConfigPayload>({ ...defaultForm });

const rules: FormRules = {
  name: { message: '请输入配置 key', required: true, trigger: 'blur' },
  value: { message: '请输入配置 value', required: true, trigger: 'blur' },
};

function canAccess(code: string) {
  return hasActionPermission(accessStore.accessCodes, code);
}

const columns = computed<DataTableColumns<AdminConfig>>(() => [
  { key: 'name', title: '配置 key', width: 180 },
  {
    key: 'value',
    title: '配置 value',
    width: 260,
    ellipsis: { tooltip: { maxWidth: 480 } },
  },
  {
    key: 'description',
    render: (row) => row.description || '-',
    title: '配置说明',
    width: 240,
    ellipsis: { tooltip: true },
  },
  {
    key: 'isActive',
    render: (row) =>
      h(
        NTag,
        {
          bordered: false,
          size: 'small',
          type: row.isActive ? 'success' : 'default',
        },
        { default: () => (row.isActive ? '启用' : '停用') },
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
      if (canAccess('config:update')) {
        actions.push(
          h(
            NButton,
            { size: 'small', onClick: () => openEdit(row) },
            { default: () => '编辑' },
          ),
        );
      }
      if (canAccess('config:delete')) {
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
]);

function resetForm() {
  Object.assign(form, { ...defaultForm });
  editingId.value = undefined;
}

async function loadConfigs() {
  loading.value = true;
  try {
    const page = await getAdminConfigPageApi({
      current: query.current,
      isActive: query.isActive === null ? null : Boolean(query.isActive),
      keyword: query.keyword || undefined,
      size: query.size,
    });
    configs.value = page.records;
    total.value = page.total;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.current = 1;
  void loadConfigs();
}

function openCreate() {
  resetForm();
  modalVisible.value = true;
}

async function openEdit(row: AdminConfig) {
  resetForm();
  const detail = await getAdminConfigApi(row.id);
  Object.assign(form, {
    description: detail.description ?? '',
    isActive: detail.isActive,
    name: detail.name,
    value: detail.value,
  });
  editingId.value = detail.id;
  modalVisible.value = true;
}

async function handleSubmit() {
  await formRef.value?.validate();
  if (editingId.value) {
    await updateAdminConfigApi(editingId.value, form);
    message.success('配置已更新');
  } else {
    await createAdminConfigApi(form);
    message.success('配置已创建');
  }
  modalVisible.value = false;
  await loadConfigs();
}

/**
 * 确认并删除配置。
 *
 * :param row: 配置数据。
 * :return: 无返回值。
 */
function handleDelete(row: AdminConfig): void {
  showDeleteConfirm(`确认删除“${row.name}”？`, async () => {
    await deleteAdminConfigApi(row.id);
    message.success('配置已删除');
    await loadConfigs();
  });
}

function handlePageChange(page: number) {
  query.current = page;
  void loadConfigs();
}

function handlePageSizeChange(size: number) {
  query.size = size;
  query.current = 1;
  void loadConfigs();
}

/**
 * 把多行文本转换为去重后的词表。
 *
 * :param value: 多行词表文本。
 * :return: 词表数组。
 */
function parseWordLines(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/\r?\n/)
        .map((word) => word.trim())
        .filter(Boolean),
    ),
  ];
}

/**
 * 加载搜索分词配置。
 *
 * :return: 无返回值。
 */
async function loadSearchAnalysis(): Promise<void> {
  searchLoading.value = true;
  try {
    const state = await getSearchAnalysisApi();
    searchState.value = state;
    searchForm.customWords = state.draft.customWords.join('\n');
    searchForm.stopWords = state.draft.stopWords.join('\n');
    searchForm.hotSearchStopWords = state.draft.hotSearchStopWords.join('\n');
  } finally {
    searchLoading.value = false;
  }
}

/**
 * 保存搜索分词草稿。
 *
 * :return: 无返回值。
 */
async function saveSearchDraft(): Promise<void> {
  searchSaving.value = true;
  try {
    searchState.value = await saveSearchAnalysisDraftApi({
      customWords: parseWordLines(searchForm.customWords),
      hotSearchStopWords: parseWordLines(searchForm.hotSearchStopWords),
      stopWords: parseWordLines(searchForm.stopWords),
    });
    message.success('搜索配置草稿已保存');
  } finally {
    searchSaving.value = false;
  }
}

/**
 * 使用当前 ES 分析器预览分词。
 *
 * :return: 无返回值。
 */
async function previewSearchAnalysis(): Promise<void> {
  if (!previewText.value.trim()) {
    message.warning('请输入测试文本');
    return;
  }
  const result = await previewSearchAnalysisApi({
    stopWords: parseWordLines(searchForm.stopWords),
    text: previewText.value.trim(),
  });
  previewTokens.value = result.tokens;
  filteredPreviewTokens.value = result.filteredTokens;
}

/**
 * 确认并发布搜索分词配置。
 *
 * :return: 无返回值。
 */
function publishSearchAnalysis(): void {
  showConfirm(
    '将先保存当前编辑内容并发布；发布后，IK 节点会在下一次轮询时加载新词库，历史文章需要另行重建索引。',
    async () => {
      await saveSearchAnalysisDraftApi({
        customWords: parseWordLines(searchForm.customWords),
        hotSearchStopWords: parseWordLines(searchForm.hotSearchStopWords),
        stopWords: parseWordLines(searchForm.stopWords),
      });
      searchState.value = await publishSearchAnalysisApi();
      message.success(
        `搜索配置 v${searchState.value.published.version} 已发布`,
      );
    },
    { positiveText: '发布', title: '确认发布搜索配置' },
  );
}

/**
 * 确认并重建文章搜索索引。
 *
 * :return: 无返回值。
 */
function rebuildArticleSearchIndex(): void {
  showConfirm(
    '系统会创建新索引并在写入完成后切换别名。文章较多时请求耗时会较长，请勿重复操作。',
    async () => {
      const result = await rebuildArticleSearchIndexApi();
      message.success(
        `已写入 ${result.documentCount} 篇文章，当前索引：${result.indexName}`,
      );
    },
    { positiveText: '开始重建', title: '确认重建文章索引' },
  );
}

onMounted(() => {
  void loadConfigs();
  void loadSearchAnalysis();
});
</script>

<template>
  <Page title="配置管理">
    <NTabs type="line" animated>
      <NTabPane name="general" tab="通用配置">
        <NCard :bordered="false">
          <div class="admin-filter-toolbar mb-4">
            <NSpace align="center" class="admin-filter-fields" wrap>
              <NInput
                v-model:value="query.keyword"
                clearable
                placeholder="配置关键词"
                class="w-[220px]"
                @keyup.enter="handleSearch"
              />
              <NSelect
                v-model:value="query.isActive"
                :options="activeOptions"
                clearable
                placeholder="状态"
                class="w-[130px]"
              />
              <NButton
                v-if="canAccess('config:query')"
                type="primary"
                @click="handleSearch"
              >
                查询
              </NButton>
            </NSpace>
            <div class="admin-filter-actions">
              <NButton
                v-if="canAccess('config:create')"
                type="primary"
                @click="openCreate"
              >
                新增配置
              </NButton>
            </div>
          </div>

          <NDataTable
            :columns="columns"
            :data="configs"
            :loading="loading"
            :row-key="(row) => row.id"
            :scroll-x="1090"
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
      </NTabPane>

      <NTabPane name="search" tab="搜索配置">
        <NCard :bordered="false" :loading="searchLoading">
          <NAlert type="info" :bordered="false" class="mb-5">
            自定义词和 ES 停用词发布后由 IK
            远程词库轮询加载；热搜停用词发布后直接影响新的热搜统计。发布不会自动重建历史文章索引。
          </NAlert>

          <NDescriptions :column="3" bordered label-placement="left">
            <NDescriptionsItem label="已发布版本">
              v{{ searchState?.published.version ?? 0 }}
            </NDescriptionsItem>
            <NDescriptionsItem label="发布时间">
              {{ searchState?.published.publishedAt || '尚未发布' }}
            </NDescriptionsItem>
            <NDescriptionsItem label="历史版本">
              {{ searchState?.history.length ?? 0 }} 个
            </NDescriptionsItem>
          </NDescriptions>

          <NForm label-placement="top" class="mt-5">
            <NFormItem label="IK 自定义词">
              <NInput
                v-model:value="searchForm.customWords"
                type="textarea"
                :autosize="{ minRows: 7, maxRows: 14 }"
                placeholder="一行一个词，例如：&#10;人工智能&#10;大语言模型"
              />
            </NFormItem>
            <NFormItem label="ES 停用词">
              <NInput
                v-model:value="searchForm.stopWords"
                type="textarea"
                :autosize="{ minRows: 6, maxRows: 12 }"
                placeholder="一行一个词；这些词会从 ES 分词结果中过滤"
              />
            </NFormItem>
            <NFormItem label="热搜停用词">
              <NInput
                v-model:value="searchForm.hotSearchStopWords"
                type="textarea"
                :autosize="{ minRows: 5, maxRows: 10 }"
                placeholder="一行一个完整搜索短语；只影响每日热搜统计"
              />
            </NFormItem>
          </NForm>

          <NSpace>
            <NButton
              v-if="canAccess('config:update')"
              type="primary"
              :loading="searchSaving"
              @click="saveSearchDraft"
            >
              保存草稿
            </NButton>
            <NButton
              v-if="canAccess('config:update')"
              type="success"
              @click="publishSearchAnalysis"
            >
              发布词库
            </NButton>
            <NButton
              v-if="canAccess('config:update')"
              type="warning"
              @click="rebuildArticleSearchIndex"
            >
              重建文章索引
            </NButton>
          </NSpace>

          <NDivider title-placement="left">分词测试</NDivider>
          <NSpace vertical>
            <NSpace align="center">
              <NInput
                v-model:value="previewText"
                class="w-[520px] max-w-[70vw]"
                placeholder="输入需要测试的文本"
                @keyup.enter="previewSearchAnalysis"
              />
              <NButton
                v-if="canAccess('config:query')"
                @click="previewSearchAnalysis"
              >
                测试分词
              </NButton>
            </NSpace>
            <div v-if="previewTokens.length" class="space-y-3">
              <NSpace align="center">
                <span class="text-muted-foreground">当前 ES token：</span>
                <NTag v-for="token in previewTokens" :key="`raw-${token}`">
                  {{ token }}
                </NTag>
              </NSpace>
              <NSpace align="center">
                <span class="text-muted-foreground">套用草稿停用词：</span>
                <NTag
                  v-for="token in filteredPreviewTokens"
                  :key="`filtered-${token}`"
                  type="success"
                >
                  {{ token }}
                </NTag>
              </NSpace>
            </div>
          </NSpace>

          <NAlert type="warning" :bordered="false" class="mt-5">
            ES 节点需一次性配置 remote_ext_dict 和 remote_ext_stopwords 指向 Web
            服务的 /api/config/common/search-analysis/dictionary/custom 与 /stop
            地址。
          </NAlert>
        </NCard>
      </NTabPane>
    </NTabs>

    <NModal
      v-model:show="modalVisible"
      :title="editingId ? '编辑配置' : '新增配置'"
      preset="card"
      class="w-[680px] max-w-[92vw]"
    >
      <NForm
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="left"
        label-width="96"
      >
        <NFormItem label="配置 key" path="name">
          <NInput v-model:value="form.name" />
        </NFormItem>
        <NFormItem label="配置 value" path="value">
          <NInput
            v-model:value="form.value"
            type="textarea"
            :autosize="{ minRows: 4 }"
          />
        </NFormItem>
        <NFormItem label="配置说明" path="description">
          <NInput v-model:value="form.description" type="textarea" />
        </NFormItem>
        <NFormItem label="启用" path="isActive">
          <NSwitch v-model:value="form.isActive" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="modalVisible = false">取消</NButton>
          <NButton
            v-if="
              editingId
                ? canAccess('config:update')
                : canAccess('config:create')
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
