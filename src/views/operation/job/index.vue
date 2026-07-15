<script setup lang="ts">
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui';

import type { VNodeChild } from 'vue';

import type { JobCronIntervalUnit, JobCronMode } from './job-cron';

import type {
  AdminJob,
  AdminJobPayload,
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
  NInputNumber,
  NModal,
  NPagination,
  NSelect,
  NSpace,
  NSwitch,
  NTag,
  NTimePicker,
  useMessage,
} from 'naive-ui';

import {
  createAdminJobApi,
  deleteAdminJobApi,
  executeAdminJobApi,
  getAdminJobApi,
  getAdminJobPageApi,
  getAdminUserApi,
  getAdminUserPageApi,
  updateAdminJobApi,
  updateAdminJobStatusApi,
} from '#/api';
import { showConfirm, showDeleteConfirm } from '#/utils/confirm';

import { hasActionPermission } from '../../system/permission-actions';
import AdminUserDisplay from '../../system/user/user-display.vue';
import AdminUserSelect from '../../system/user/user-select.vue';
import {
  getJobStatusType,
  getOptionLabel,
  jobStatusOptions,
  misfirePolicyOptions,
} from '../operation-options';
import {
  buildJobCronExpression,
  getJobCronDescription,
  parseJobCronExpression,
} from './job-cron';
const message = useMessage();
const accessStore = useAccessStore();
const loading = ref(false);
const modalVisible = ref(false);
const editingId = ref<AdminJob['id']>();
const executingId = ref<AdminJob['id']>();
const formRef = ref<FormInst | null>(null);
const records = ref<AdminJob[]>([]);
const users = ref<AdminUser[]>([]);
const total = ref(0);
const query = reactive({
  createUserId: null as null | SnowflakeId,
  current: 1,
  group: '',
  keyword: '',
  size: 10,
  status: null as null | number,
});
const defaultForm: AdminJobPayload = {
  concurrent: false,
  createUserId: '',
  cronExpression: '',
  description: '',
  group: 'DEFAULT',
  invokeTarget: '',
  misfirePolicy: 3,
  name: '',
  status: 2,
  updateUserId: null,
};
const form = reactive<AdminJobPayload>({ ...defaultForm });
const scheduleMode = ref<JobCronMode>('daily');
const scheduleTime = ref<null | number>(createScheduleTimeValue(0));
const scheduleWeekday = ref(0);
const scheduleMonthDay = ref(1);
const scheduleIntervalUnit = ref<JobCronIntervalUnit>('minute');
const scheduleIntervalValue = ref(5);
const scheduleModeOptions = [
  { label: '间隔执行', value: 'interval' as const },
  { label: '每天', value: 'daily' as const },
  { label: '每周', value: 'weekly' as const },
  { label: '每月', value: 'monthly' as const },
];
const scheduleIntervalUnitOptions = [
  { label: '秒', value: 'second' as const },
  { label: '分钟', value: 'minute' as const },
  { label: '小时', value: 'hour' as const },
];
const weekdayOptions = [
  { label: '周一', value: 0 },
  { label: '周二', value: 1 },
  { label: '周三', value: 2 },
  { label: '周四', value: 3 },
  { label: '周五', value: 4 },
  { label: '周六', value: 5 },
  { label: '周日', value: 6 },
];
const rules: FormRules = {
  createUserId: { message: '请选择创建者', required: true, trigger: 'change' },
  cronExpression: {
    message: '请输入 cron 表达式',
    required: true,
    trigger: 'blur',
  },
  invokeTarget: { message: '请输入调用目标', required: true, trigger: 'blur' },
  name: { message: '请输入任务名称', required: true, trigger: 'blur' },
};
function canAccess(code: string) {
  return hasActionPermission(accessStore.accessCodes, code);
}

/**
 * 渲染任务列表中的用户信息。
 *
 * :param userId: 用户 ID。
 * :return: 用户昵称和 UID 标签。
 */
function renderUserCell(userId: SnowflakeId): VNodeChild {
  const user = users.value.find((item) => item.id === userId);
  if (!user) {
    return userId || '-';
  }
  return h(AdminUserDisplay, { fallback: userId, user });
}
const columns = computed<DataTableColumns<AdminJob>>(() => [
  { key: 'name', title: '任务名称', width: 160 },
  { key: 'group', title: '任务组', width: 110 },
  {
    key: 'invokeTarget',
    title: '调用目标',
    width: 240,
    ellipsis: { tooltip: true },
  },
  { key: 'cronExpression', title: 'Cron', width: 160 },
  {
    ellipsis: { tooltip: true },
    key: 'cronDescription',
    render: (row) => getJobCronDescription(row.cronExpression),
    title: '执行计划',
    width: 200,
  },
  {
    key: 'status',
    title: '状态',
    width: 90,
    render: (row) =>
      h(
        NTag,
        { bordered: false, size: 'small', type: getJobStatusType(row.status) },
        { default: () => getOptionLabel(jobStatusOptions, row.status) },
      ),
  },
  {
    key: 'createUserId',
    render: (row) => renderUserCell(row.createUserId),
    title: '创建者',
    width: 190,
  },
  { key: 'createTime', title: '创建时间', width: 200 },
  {
    fixed: 'right',
    key: 'actions',
    title: '操作',
    width: 300,
    render: (row) => {
      const actions: VNodeChild[] = [];
      if (canAccess('job:update'))
        actions.push(
          h(
            NButton,
            { size: 'small', onClick: () => openEdit(row) },
            { default: () => '编辑' },
          ),
        );
      if (canAccess('job:update'))
        actions.push(
          h(
            NButton,
            {
              loading: executingId.value === row.id,
              size: 'small',
              type: 'primary',
              onClick: () => handleExecute(row),
            },
            { default: () => '执行' },
          ),
        );
      if (canAccess('job:status'))
        actions.push(
          h(
            NButton,
            {
              size: 'small',
              type: row.status === 1 ? 'warning' : 'primary',
              onClick: () => handleStatus(row, row.status === 1 ? 2 : 1),
            },
            { default: () => (row.status === 1 ? '暂停' : '启用') },
          ),
        );
      if (canAccess('job:delete'))
        actions.push(
          h(
            NButton,
            { size: 'small', type: 'error', onClick: () => handleDelete(row) },
            { default: () => '删除' },
          ),
        );
      return actions.length > 0
        ? h(NSpace, { size: 8 }, { default: () => actions })
        : '-';
    },
  },
]);
function resetForm() {
  Object.assign(form, { ...defaultForm });
  scheduleMode.value = 'daily';
  scheduleTime.value = createScheduleTimeValue(0);
  scheduleWeekday.value = 0;
  scheduleMonthDay.value = 1;
  scheduleIntervalUnit.value = 'minute';
  scheduleIntervalValue.value = 5;
  editingId.value = undefined;
}

async function loadUsers(): Promise<void> {
  /** 加载定时任务创建者选择项。 */
  const size = 200;
  const loadedUsers: AdminUser[] = [];
  try {
    const firstPage = await getAdminUserPageApi({ current: 1, size });
    loadedUsers.push(...firstPage.records);
    const totalPages = Math.ceil(firstPage.total / size);
    for (let current = 2; current <= totalPages; current += 1) {
      const page = await getAdminUserPageApi({ current, size });
      loadedUsers.push(...page.records);
    }
    users.value = loadedUsers;
  } catch {
    users.value = [];
  }
}

async function ensureUserLoaded(userId: SnowflakeId): Promise<void> {
  /** 确保编辑中的创建者已存在于下拉选项中。 */
  if (!userId || users.value.some((user) => user.id === userId)) {
    return;
  }
  try {
    const user = await getAdminUserApi(userId);
    users.value = [...users.value.filter((item) => item.id !== user.id), user];
  } catch {
    // 用户不存在时保留原始 ID，避免编辑表单无法回显。
  }
}

/** 根据简单配置自动填充 Cron 表达式。 */
function syncCronExpression(): void {
  if (scheduleMode.value === 'interval') {
    const max = scheduleIntervalUnit.value === 'hour' ? 23 : 59;
    scheduleIntervalValue.value = Math.min(
      Math.max(scheduleIntervalValue.value, 1),
      max,
    );
  }
  form.cronExpression = buildJobCronExpression({
    mode: scheduleMode.value,
    intervalUnit: scheduleIntervalUnit.value,
    intervalValue: scheduleIntervalValue.value,
    monthDay: scheduleMonthDay.value,
    time: getScheduleMinutes(scheduleTime.value),
    weekday: scheduleWeekday.value,
  });
}

/** 将已有 Cron 表达式转换为简单配置并回显。 */
function applyCronExpression(expression: string): void {
  const config = parseJobCronExpression(expression);
  if (!config) {
    scheduleTime.value = null;
    return;
  }
  scheduleMode.value = config.mode;
  if (config.intervalUnit !== undefined) {
    scheduleIntervalUnit.value = config.intervalUnit;
  }
  if (config.intervalValue !== undefined) {
    scheduleIntervalValue.value = config.intervalValue;
  }
  if (config.time === null) {
    scheduleTime.value = null;
    return;
  }
  scheduleTime.value = createScheduleTimeValue(config.time);
  if (config.weekday !== undefined) scheduleWeekday.value = config.weekday;
  if (config.monthDay !== undefined) scheduleMonthDay.value = config.monthDay;
}

/** 将分钟数转换为时间选择器使用的时间戳。 */
function createScheduleTimeValue(minutes: number): number {
  const date = new Date();
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return date.getTime();
}

/** 将时间选择器返回的时间戳转换为当天分钟数。 */
function getScheduleMinutes(value: null | number): null | number {
  if (value === null) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.getHours() * 60 + date.getMinutes();
}
async function loadData() {
  loading.value = true;
  try {
    const page = await getAdminJobPageApi({
      createUserId: query.createUserId,
      current: query.current,
      group: query.group || undefined,
      keyword: query.keyword || undefined,
      size: query.size,
      status: query.status,
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
function openCreate() {
  resetForm();
  syncCronExpression();
  modalVisible.value = true;
}
async function openEdit(row: AdminJob) {
  resetForm();
  const detail = await getAdminJobApi(row.id);
  Object.assign(form, detail);
  await ensureUserLoaded(detail.createUserId);
  applyCronExpression(detail.cronExpression);
  editingId.value = detail.id;
  modalVisible.value = true;
}
async function handleSubmit() {
  await formRef.value?.validate();
  if (editingId.value) {
    await updateAdminJobApi(editingId.value, form);
    message.success('定时任务已更新');
  } else {
    await createAdminJobApi(form);
    message.success('定时任务已创建');
  }
  modalVisible.value = false;
  await loadData();
}
async function handleStatus(row: AdminJob, status: number) {
  await updateAdminJobStatusApi(row.id, status);
  message.success('任务状态已更新');
  await loadData();
}

/**
 * 确认并立即执行一次定时任务。
 *
 * :param row: 定时任务数据。
 * :return: 无返回值。
 */
function handleExecute(row: AdminJob): void {
  showConfirm(
    `确认立即执行“${row.name}”？`,
    async () => {
      executingId.value = row.id;
      try {
        await executeAdminJobApi(row.id);
        message.success('定时任务已提交执行');
      } finally {
        executingId.value = undefined;
      }
    },
    { positiveText: '执行', title: '立即执行任务' },
  );
}
/**
 * 确认并删除定时任务。
 *
 * :param row: 定时任务数据。
 * :return: 无返回值。
 */
function handleDelete(row: AdminJob): void {
  showDeleteConfirm(`确认删除“${row.name}”？`, async () => {
    await deleteAdminJobApi(row.id);
    message.success('定时任务已删除');
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
onMounted(async () => {
  await loadUsers();
  await loadData();
});
</script>
<template>
  <Page title="定时任务">
    <NCard :bordered="false">
      <div class="admin-filter-toolbar mb-4">
        <NSpace align="center" class="admin-filter-fields" wrap>
          <NInput
            v-model:value="query.keyword"
            clearable
            placeholder="任务关键词"
            class="w-[200px]"
            @keyup.enter="handleSearch"
          /><NInput
            v-model:value="query.group"
            clearable
            placeholder="任务组"
            class="w-[160px]"
            @keyup.enter="handleSearch"
          /><AdminUserSelect
            v-model:value="query.createUserId"
            :users="users"
            class="w-[220px]"
            placeholder="创建者"
          /><NSelect
            v-model:value="query.status"
            :options="jobStatusOptions"
            clearable
            placeholder="状态"
            class="w-[130px]"
          /><NButton
            v-if="canAccess('job:query')"
            type="primary"
            @click="handleSearch"
          >
            查询
          </NButton>
        </NSpace>
        <div class="admin-filter-actions">
          <NButton
            v-if="canAccess('job:create')"
            type="primary"
            @click="openCreate"
          >
            新增任务
          </NButton>
        </div>
      </div>
      <NDataTable
        :columns="columns"
        :data="records"
        :loading="loading"
        :row-key="(row) => row.id"
        :scroll-x="1580"
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
</NCard><NModal
      v-model:show="modalVisible"
      preset="card"
      :title="editingId ? '编辑任务' : '新增任务'"
      class="max-w-[720px]"
    >
      <NForm
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="left"
        label-width="120"
      >
        <NFormItem label="任务名称" path="name">
          <NInput v-model:value="form.name" />
</NFormItem><NFormItem label="任务组">
          <NInput v-model:value="form.group" />
</NFormItem><NFormItem label="调用目标" path="invokeTarget">
          <NInput v-model:value="form.invokeTarget" />
        </NFormItem>
        <NFormItem label="执行方式">
          <NSelect
            v-model:value="scheduleMode"
            :options="scheduleModeOptions"
            @update:value="syncCronExpression"
          />
        </NFormItem>
        <NFormItem v-if="scheduleMode !== 'interval'" label="执行时间">
          <NTimePicker
            v-model:value="scheduleTime"
            format="HH:mm"
            placeholder="请选择时间"
            @update:value="syncCronExpression"
          />
        </NFormItem>
        <NFormItem v-if="scheduleMode === 'interval'" label="执行间隔">
          <NSpace>
            <NInputNumber
              v-model:value="scheduleIntervalValue"
              :max="scheduleIntervalUnit === 'second' ? 59 : scheduleIntervalUnit === 'minute' ? 59 : 23"
              :min="1"
              @update:value="syncCronExpression"
            />
            <NSelect
              v-model:value="scheduleIntervalUnit"
              :options="scheduleIntervalUnitOptions"
              class="w-[120px]"
              @update:value="syncCronExpression"
            />
          </NSpace>
        </NFormItem>
        <NFormItem v-if="scheduleMode === 'weekly'" label="星期">
          <NSelect
            v-model:value="scheduleWeekday"
            :options="weekdayOptions"
            @update:value="syncCronExpression"
          />
        </NFormItem>
        <NFormItem v-if="scheduleMode === 'monthly'" label="日期">
          <NInputNumber
            v-model:value="scheduleMonthDay"
            :max="31"
            :min="1"
            @update:value="syncCronExpression"
          />
        </NFormItem>
        <NFormItem label="Cron" path="cronExpression">
          <NInput
            v-model:value="form.cronExpression"
            placeholder="可手动输入高级 Cron 表达式"
          />
        </NFormItem>
        <NFormItem label="错过策略">
          <NSelect
            v-model:value="form.misfirePolicy"
            :options="misfirePolicyOptions"
          />
</NFormItem><NFormItem label="允许并发">
          <NSwitch v-model:value="form.concurrent" />
</NFormItem><NFormItem label="状态">
          <NSelect
            v-model:value="form.status"
            :options="jobStatusOptions"
          />
</NFormItem><NFormItem label="创建者" path="createUserId">
          <AdminUserSelect v-model:value="form.createUserId" :users="users" />
</NFormItem><NFormItem label="说明">
          <NInput v-model:value="form.description" type="textarea" />
        </NFormItem>
</NForm><template #footer>
        <NSpace justify="end">
          <NButton @click="modalVisible = false">取消</NButton><NButton type="primary" @click="handleSubmit">保存</NButton>
        </NSpace>
      </template>
    </NModal>
  </Page>
</template>
