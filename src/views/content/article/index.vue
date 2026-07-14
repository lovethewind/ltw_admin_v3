<script setup lang="ts">
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui';

import type { VNodeChild } from 'vue';

import type {
  AdminArticle,
  AdminArticleAuthor,
  AdminArticlePayload,
  AdminCategory,
  AdminUser,
  SnowflakeId,
} from '#/api';

import { computed, h, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { VbenTiptap } from '@vben/plugins/tiptap';
import { useAccessStore } from '@vben/stores';

import { MdEditor } from 'md-editor-v3';
import {
  NAvatar,
  NButton,
  NCard,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NPagination,
  NSelect,
  NSpace,
  NSwitch,
  NTag,
  useMessage,
} from 'naive-ui';

import {
  createAdminArticleApi,
  deleteAdminArticleApi,
  getAdminArticleApi,
  getAdminArticlePageApi,
  getAdminCategoryListApi,
  getAdminUserApi,
  getAdminUserPageApi,
  updateAdminArticleApi,
  updateAdminArticleStatusApi,
} from '#/api';
import { showDeleteConfirm } from '#/utils/confirm';

import { hasActionPermission } from '../../system/permission-actions';
import { getGenderLabel } from '../../system/user/user-options';
import AdminUserSelect from '../../system/user/user-select.vue';
import { renderImageCell } from '../image-cell';
import ImageUploadField from '../image-upload-field.vue';
import { getArticleAuthorUidLabel } from './article-author';
import {
  getArticleEditorMode,
  getArticleEditorModeLabel,
} from './article-editor';
import {
  articleStatusOptions,
  getArticleStatusLabel,
  getArticleStatusType,
  getOriginalLabel,
  originalOptions,
} from './article-options';

import 'md-editor-v3/lib/style.css';

type ArticleForm = Required<
  Pick<
    AdminArticlePayload,
    | 'categoryId'
    | 'content'
    | 'cover'
    | 'isMarkdown'
    | 'isOriginal'
    | 'originalUrl'
    | 'status'
    | 'tagList'
    | 'title'
  >
> & {
  userId: SnowflakeId;
};

const message = useMessage();
const accessStore = useAccessStore();
const loading = ref(false);
const modalVisible = ref(false);
const currentArticleId = ref<AdminArticle['id']>();
const authorModalVisible = ref(false);
const currentAuthor = ref<AdminArticleAuthor | AdminUser | null>(null);
const formRef = ref<FormInst | null>(null);
const articles = ref<AdminArticle[]>([]);
const categories = ref<AdminCategory[]>([]);
const authors = ref<AdminUser[]>([]);
const total = ref(0);

const query = reactive({
  categoryId: null as null | SnowflakeId,
  current: 1,
  isOriginal: null as null | number,
  keyword: '',
  size: 10,
  status: null as null | number,
  userId: null as null | SnowflakeId,
});

const defaultForm: ArticleForm = {
  categoryId: '',
  content: '',
  cover: '',
  isMarkdown: false,
  isOriginal: true,
  originalUrl: '',
  status: 1,
  tagList: [],
  title: '',
  userId: '',
};

const form = reactive<ArticleForm>({ ...defaultForm });

const categoryOptions = computed(() =>
  categories.value.map((item) => ({
    label: item.name,
    value: item.id,
  })),
);
const editorMode = computed(() => getArticleEditorMode(form.isMarkdown));
const editorModeLabel = computed(() =>
  getArticleEditorModeLabel(editorMode.value),
);
const authorMap = computed(() => {
  return new Map(authors.value.map((item) => [item.id, item]));
});

const rules: FormRules = {
  categoryId: { message: '请选择分类', required: true, trigger: 'change' },
  content: { message: '请输入内容', required: true, trigger: 'blur' },
  title: { message: '请输入标题', required: true, trigger: 'blur' },
  userId: { message: '请选择作者', required: true, trigger: 'change' },
};

function canAccess(code: string) {
  return hasActionPermission(accessStore.accessCodes, code);
}

function getCategoryName(categoryId: SnowflakeId) {
  return categories.value.find((item) => item.id === categoryId)?.name ?? '-';
}

function getArticleAuthorName(article: AdminArticle) {
  const author = article.author ?? authorMap.value.get(article.userId);
  return author?.nickname || author?.username || article.userId;
}

const columns = computed<DataTableColumns<AdminArticle>>(() => [
  {
    key: 'title',
    render: (row) => h('span', { class: 'font-medium' }, row.title),
    title: '标题',
    width: 240,
  },
  {
    key: 'cover',
    render: (row) =>
      renderImageCell(row.coverThumb || row.cover, row.title, row.cover),
    title: '封面',
    width: 100,
  },
  {
    key: 'categoryId',
    render: (row) => getCategoryName(row.categoryId),
    title: '分类',
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
          type: getArticleStatusType(row.status),
        },
        { default: () => getArticleStatusLabel(row.status) },
      ),
    title: '状态',
    width: 100,
  },
  {
    key: 'isOriginal',
    render: (row) => getOriginalLabel(row.isOriginal),
    title: '类型',
    width: 90,
  },
  {
    key: 'userId',
    render: (row) =>
      h(
        NButton,
        {
          size: 'small',
          text: true,
          type: 'primary',
          onClick: () => {
            void openAuthorDetail(row);
          },
        },
        { default: () => getArticleAuthorName(row) },
      ),
    title: '作者',
    width: 140,
  },
  {
    key: 'createTime',
    render: (row) => row.createTime || '-',
    title: '创建时间',
    width: 200,
  },
  {
    fixed: 'right',
    key: 'actions',
    render: (row) => {
      const actions: VNodeChild[] = [];
      if (canAccess('article:update')) {
        actions.push(
          h(
            NButton,
            { size: 'small', onClick: () => openEdit(row) },
            { default: () => '编辑' },
          ),
        );
      }
      if (canAccess('article:publish') && row.status !== 2) {
        actions.push(
          h(
            NButton,
            {
              size: 'small',
              type: 'primary',
              onClick: () => handleStatus(row, 2),
            },
            { default: () => '发布' },
          ),
        );
      }
      if (canAccess('article:delete')) {
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
    width: 190,
  },
]);

function resetForm() {
  Object.assign(form, { ...defaultForm });
  currentArticleId.value = undefined;
}

async function loadCategories() {
  categories.value = await getAdminCategoryListApi();
}

async function loadAuthors() {
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
    authors.value = records;
  } catch {
    authors.value = [];
  }
}

async function ensureAuthorLoaded(userId: SnowflakeId) {
  if (!userId || authorMap.value.has(userId)) {
    return authorMap.value.get(userId) ?? null;
  }
  try {
    const author = await getAdminUserApi(userId);
    authors.value = [
      ...authors.value.filter((item) => item.id !== author.id),
      author,
    ];
    return author;
  } catch {
    return null;
  }
}

/**
 * 根据筛选条件加载文章列表。
 *
 * :return: 无返回值。
 */
async function loadArticles(): Promise<void> {
  loading.value = true;
  try {
    const page = await getAdminArticlePageApi({
      categoryId: query.categoryId,
      current: query.current,
      isOriginal: query.isOriginal === null ? null : Boolean(query.isOriginal),
      keyword: query.keyword || undefined,
      size: query.size,
      status: query.status,
      userId: query.userId,
    });
    articles.value = page.records;
    total.value = page.total;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.current = 1;
  void loadArticles();
}

function openCreate() {
  resetForm();
  modalVisible.value = true;
}

async function openEdit(row: AdminArticle) {
  resetForm();
  const detail = await getAdminArticleApi(row.id);
  await ensureAuthorLoaded(detail.userId);
  Object.assign(form, {
    categoryId: detail.categoryId,
    content: detail.content,
    cover: detail.cover,
    isMarkdown: detail.isMarkdown,
    isOriginal: detail.isOriginal,
    originalUrl: detail.originalUrl ?? '',
    status: detail.status,
    tagList: [...detail.tagList],
    title: detail.title,
    userId: detail.userId,
  });
  currentArticleId.value = detail.id;
  modalVisible.value = true;
}

async function openAuthorDetail(article: AdminArticle) {
  const author = article.author ?? (await ensureAuthorLoaded(article.userId));
  if (!author) {
    message.error('作者信息不存在');
    return;
  }
  currentAuthor.value = author;
  authorModalVisible.value = true;
}

/**
 * 提交文章表单，并在原创文章保存时清空原文链接。
 *
 * :return: 无返回值。
 */
async function handleSubmit(): Promise<void> {
  await formRef.value?.validate();
  if (!form.userId) {
    message.error('请选择作者');
    return;
  }
  const payload: AdminArticlePayload = {
    ...form,
    originalUrl: form.isOriginal ? '' : form.originalUrl,
    userId: form.userId,
  };
  if (currentArticleId.value) {
    await updateAdminArticleApi(currentArticleId.value, payload);
    message.success('文章已更新');
  } else {
    await createAdminArticleApi(payload);
    message.success('文章已创建');
  }
  modalVisible.value = false;
  await loadArticles();
}

async function handleStatus(row: AdminArticle, status: number) {
  await updateAdminArticleStatusApi(row.id, status);
  message.success('文章状态已更新');
  await loadArticles();
}

/**
 * 确认并删除文章。
 *
 * :param row: 文章数据。
 * :return: 无返回值。
 */
function handleDelete(row: AdminArticle): void {
  showDeleteConfirm(`确认删除“${row.title}”？`, async () => {
    await deleteAdminArticleApi(row.id);
    message.success('文章已删除');
    await loadArticles();
  });
}

function handlePageChange(page: number) {
  query.current = page;
  void loadArticles();
}

function handlePageSizeChange(size: number) {
  query.size = size;
  query.current = 1;
  void loadArticles();
}

onMounted(async () => {
  await Promise.all([loadCategories(), loadAuthors()]);
  await loadArticles();
});
</script>

<template>
  <Page title="文章管理">
    <NCard :bordered="false">
      <div class="admin-filter-toolbar mb-4">
        <NSpace align="center" class="admin-filter-fields" wrap>
          <NInput
            v-model:value="query.keyword"
            clearable
            placeholder="标题 / 内容关键词"
            class="w-[260px]"
            @keyup.enter="handleSearch"
          />
          <NSelect
            v-model:value="query.categoryId"
            :options="categoryOptions"
            clearable
            placeholder="分类"
            class="w-[150px]"
          />
          <AdminUserSelect
            v-model:value="query.userId"
            :users="authors"
            placeholder="作者"
            class="w-[220px]"
          />
          <NSelect
            v-model:value="query.status"
            :options="articleStatusOptions"
            clearable
            placeholder="状态"
            class="w-[130px]"
          />
          <NSelect
            v-model:value="query.isOriginal"
            :options="originalOptions"
            clearable
            placeholder="类型"
            class="w-[120px]"
          />
          <NButton type="primary" @click="handleSearch">查询</NButton>
        </NSpace>
        <div class="admin-filter-actions">
          <NButton
            v-if="canAccess('article:create')"
            type="primary"
            @click="openCreate"
          >
            新增文章
          </NButton>
        </div>
      </div>

      <NDataTable
        :columns="columns"
        :data="articles"
        :loading="loading"
        :row-key="(row) => row.id"
        :scroll-x="1280"
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
      :title="currentArticleId ? '编辑文章' : '新增文章'"
      preset="card"
      class="w-[1080px] max-w-[96vw]"
    >
      <NForm
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="left"
        label-width="88"
      >
        <div class="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <NFormItem label="标题" path="title" class="md:col-span-2">
            <NInput v-model:value="form.title" />
          </NFormItem>
          <NFormItem label="作者" path="userId">
            <AdminUserSelect
              v-model:value="form.userId"
              :users="authors"
              placeholder="请选择作者"
            />
          </NFormItem>
          <NFormItem label="分类" path="categoryId">
            <NSelect
              v-model:value="form.categoryId"
              :options="categoryOptions"
            />
          </NFormItem>
          <div class="grid gap-x-4 md:col-span-2 md:grid-cols-2">
            <div>
              <NFormItem label="状态" path="status">
                <NSelect
                  v-model:value="form.status"
                  :options="articleStatusOptions"
                />
              </NFormItem>
              <div class="grid grid-cols-2 gap-x-4">
                <NFormItem label="原创" path="isOriginal">
                  <NSwitch v-model:value="form.isOriginal" />
                </NFormItem>
                <NFormItem label="Markdown" path="isMarkdown">
                  <NSwitch
                    v-model:value="form.isMarkdown"
                    :disabled="currentArticleId !== undefined"
                  />
                </NFormItem>
              </div>
              <NFormItem
                v-if="!form.isOriginal"
                label="原文链接"
                path="originalUrl"
              >
                <NInput v-model:value="form.originalUrl" />
              </NFormItem>
            </div>
            <NFormItem label="封面" path="cover">
              <ImageUploadField
                v-model="form.cover"
                aspect-ratio="16:9"
                dir-type="cover"
              />
            </NFormItem>
          </div>
          <NFormItem label="内容" path="content" class="md:col-span-2">
            <div class="w-full">
              <div class="mb-2 text-sm text-muted-foreground">
                {{ editorModeLabel }}
              </div>
              <MdEditor
                v-if="editorMode === 'markdown'"
                v-model="form.content"
                language="zh-CN"
                :preview="true"
                style="height: 420px"
              />
              <VbenTiptap
                v-else
                v-model="form.content"
                :max-height="520"
                :min-height="320"
                placeholder="请输入文章内容"
              />
            </div>
          </NFormItem>
        </div>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="modalVisible = false">取消</NButton>
          <NButton
            v-if="
              currentArticleId
                ? canAccess('article:update')
                : canAccess('article:create')
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
      v-model:show="authorModalVisible"
      title="作者信息"
      preset="card"
      class="w-[560px] max-w-[92vw]"
    >
      <NSpace v-if="currentAuthor" vertical :size="16">
        <NSpace align="center" :size="12">
          <NAvatar
            :src="currentAuthor.avatar || undefined"
            :img-props="{
              alt: currentAuthor.nickname || currentAuthor.username,
            }"
            object-fit="cover"
            round
            :size="56"
          />
          <div>
            <div class="text-base font-medium">
              {{ currentAuthor.nickname || currentAuthor.username }}
            </div>
            <div class="text-sm text-muted-foreground">
              <NSpace align="center" :size="6">
                <span>{{ currentAuthor.username }}</span>
                <NTag bordered size="small" type="info">
                  {{ getArticleAuthorUidLabel(currentAuthor) }}
                </NTag>
              </NSpace>
            </div>
          </div>
        </NSpace>
        <NDescriptions :column="1" bordered label-placement="left">
          <NDescriptionsItem label="用户 ID">
            {{ currentAuthor.id }}
          </NDescriptionsItem>
          <NDescriptionsItem label="UID">
            <NTag bordered size="small" type="info">
              {{ getArticleAuthorUidLabel(currentAuthor) }}
            </NTag>
          </NDescriptionsItem>
          <NDescriptionsItem label="昵称">
            {{ currentAuthor.nickname || '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem label="用户名">
            {{ currentAuthor.username || '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem label="性别">
            {{ getGenderLabel(currentAuthor.gender) }}
          </NDescriptionsItem>
          <NDescriptionsItem label="手机号">
            {{ currentAuthor.mobile || '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem label="邮箱">
            {{ currentAuthor.email || '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem label="地址">
            {{ currentAuthor.address || '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem label="注册时间">
            {{ currentAuthor.registerTime || '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem label="最后登录">
            {{ currentAuthor.lastLoginTime || '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem label="简介">
            {{ currentAuthor.summary || '-' }}
          </NDescriptionsItem>
        </NDescriptions>
      </NSpace>
    </NModal>
  </Page>
</template>
