<script setup lang="ts">
import type {
  DataTableColumns,
  FormInst,
  FormRules,
  UploadFileInfo,
} from 'naive-ui';

import type { VNodeChild } from 'vue';

import type {
  AdminRole,
  AdminUser,
  AdminUserPayload,
  SnowflakeId,
} from '#/api';

import { computed, h, onBeforeUnmount, onMounted, reactive, ref } from 'vue';

import { Page, VCropper } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  NAvatar,
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
  NSwitch,
  NTag,
  NUpload,
  useMessage,
} from 'naive-ui';

import {
  createAdminUserApi,
  deleteAdminUserApi,
  getAdminRoleListApi,
  getAdminUploadSignatureApi,
  getAdminUserPageApi,
  getAdminUserRoleIdsApi,
  updateAdminUserApi,
  updateAdminUserRolesApi,
} from '#/api';
import { showDeleteConfirm } from '#/utils/confirm';

import { hasActionPermission } from '../permission-actions';
import {
  createCancelledAvatarSelection,
  createCroppedAvatarFile,
  uploadAvatarFile,
  uploadAvatarToOss,
  validateAvatarUploadFile,
} from './user-avatar-upload';
import { genderOptions, getGenderLabel } from './user-options';

interface AvatarCropperRef {
  getCropImage: (
    format?: 'image/jpeg' | 'image/png',
    quality?: number,
    outputType?: 'base64' | 'blob',
    targetWidth?: number,
    targetHeight?: number,
  ) => Promise<Blob | string | undefined>;
}

type AdminUserForm = Required<
  Pick<
    AdminUserPayload,
    | 'avatar'
    | 'email'
    | 'gender'
    | 'isOfficial'
    | 'mobile'
    | 'nickname'
    | 'password'
    | 'roleIds'
    | 'summary'
    | 'username'
    | 'wechat'
  >
> & {
  address: string;
};

const message = useMessage();
const accessStore = useAccessStore();
const loading = ref(false);
const modalVisible = ref(false);
const roleModalVisible = ref(false);
const editingId = ref<AdminUser['id']>();
const currentUserId = ref<AdminUser['id']>();
const currentUid = ref<SnowflakeId>('');
const currentRegisterTime = ref('');
const currentLastLoginIp = ref('');
const currentLastLoginTime = ref('');
const formRef = ref<FormInst | null>(null);
const users = ref<AdminUser[]>([]);
const roles = ref<AdminRole[]>([]);
const checkedRoleIds = ref<SnowflakeId[]>([]);
const total = ref(0);
const avatarUploading = ref(false);
const originalAvatar = ref('');
const avatarChanged = ref(false);
const selectedAvatar = ref('');
const avatarUploadFileList = ref<UploadFileInfo[]>([]);
const avatarCropperVisible = ref(false);
const avatarCropperRef = ref<AvatarCropperRef | null>(null);
const avatarCropperImageUrl = ref('');
const pendingAvatarFile = ref<File | null>(null);

const query = reactive({
  current: 1,
  keyword: '',
  size: 10,
});

const defaultForm: AdminUserForm = {
  avatar: '',
  email: '',
  gender: 0,
  isOfficial: false,
  mobile: '',
  nickname: '',
  password: '',
  roleIds: [],
  summary: '',
  username: '',
  wechat: '',
  address: '',
};

const form = reactive<AdminUserForm>({ ...defaultForm });

function revokeAvatarCropperUrl() {
  if (avatarCropperImageUrl.value) {
    URL.revokeObjectURL(avatarCropperImageUrl.value);
  }
  avatarCropperImageUrl.value = '';
}

const roleOptions = computed(() =>
  roles.value.map((item) => ({
    label: item.name,
    value: item.id,
  })),
);

function getRoleName(roleId: SnowflakeId) {
  return roles.value.find((role) => role.id === roleId)?.name;
}

const rules: FormRules = {
  nickname: { message: '请输入昵称', required: true, trigger: 'blur' },
  password: {
    trigger: 'blur',
    validator() {
      if (!editingId.value && !form.password) {
        return new Error('请输入密码');
      }
      return true;
    },
  },
  username: { message: '请输入用户名', required: true, trigger: 'blur' },
};

function canAccess(code: string) {
  return hasActionPermission(accessStore.accessCodes, code);
}

function renderUidTag(uid: SnowflakeId) {
  return h(
    NTag,
    { bordered: false, size: 'small', type: 'info' },
    { default: () => uid },
  );
}

function renderBooleanTag(
  checked: boolean,
  checkedText: string,
  uncheckedText: string,
) {
  return h(
    NTag,
    {
      bordered: false,
      size: 'small',
      type: checked ? 'success' : 'default',
    },
    { default: () => (checked ? checkedText : uncheckedText) },
  );
}

const columns = computed<DataTableColumns<AdminUser>>(() => [
  {
    key: 'avatar',
    render: (row) => {
      const avatar = row.avatar?.trim();
      if (!avatar) {
        return '-';
      }
      return h(NAvatar, {
        imgProps: { alt: row.nickname || row.username },
        objectFit: 'cover',
        round: true,
        size: 40,
        src: avatar,
      });
    },
    title: '头像',
    width: 96,
  },
  {
    key: 'uid',
    render: (row) => renderUidTag(row.uid),
    title: 'UID',
    width: 110,
  },
  {
    key: 'username',
    title: '用户名',
    width: 140,
  },
  {
    key: 'nickname',
    title: '昵称',
    width: 140,
  },
  {
    key: 'roles',
    render: (row) => {
      const roleNames = row.roleIds.flatMap((roleId) => {
        const roleName = getRoleName(roleId);
        return roleName ? [roleName] : [];
      });
      return roleNames.length > 0 ? roleNames.join('、') : '-';
    },
    title: '角色',
    width: 180,
  },
  {
    key: 'isOfficial',
    render: (row) => renderBooleanTag(row.isOfficial, '官方', '普通'),
    title: '官方用户',
    width: 110,
  },
  {
    key: 'mobile',
    render: (row) => row.mobile || '-',
    title: '手机号',
    width: 140,
  },
  {
    key: 'email',
    render: (row) => row.email || '-',
    title: '邮箱',
    width: 180,
  },
  {
    key: 'gender',
    render: (row) => getGenderLabel(row.gender),
    title: '性别',
    width: 80,
  },
  {
    key: 'wechat',
    render: (row) => row.wechat || '-',
    title: '微信号',
    width: 260,
  },
  {
    ellipsis: { tooltip: true },
    key: 'address',
    render: (row) => row.address || '-',
    title: '地址',
    width: 180,
  },
  {
    ellipsis: { tooltip: true },
    key: 'summary',
    render: (row) => row.summary || '-',
    title: '简介',
    width: 220,
  },
  {
    key: 'registerTime',
    render: (row) => row.registerTime || '-',
    title: '注册时间',
    width: 200,
  },
  {
    key: 'lastLoginIp',
    render: (row) => row.lastLoginIp || '-',
    title: '最后登录 IP',
    width: 140,
  },
  {
    key: 'lastLoginTime',
    render: (row) => row.lastLoginTime || '-',
    title: '最后登录',
    width: 200,
  },
  {
    fixed: 'right',
    key: 'actions',
    render: (row) => {
      const actions: VNodeChild[] = [];
      if (canAccess('user:role')) {
        actions.push(
          h(
            NButton,
            { size: 'small', onClick: () => openRole(row) },
            { default: () => '角色' },
          ),
        );
      }
      if (canAccess('user:update')) {
        actions.push(
          h(
            NButton,
            { size: 'small', onClick: () => openEdit(row) },
            { default: () => '编辑' },
          ),
        );
      }
      if (canAccess('user:delete')) {
        actions.push(
          h(
            NButton,
            { size: 'small', type: 'error', onClick: () => handleDelete(row) },
            { default: () => '删除' },
          ),
        );
      }
      return actions.length > 0
        ? h(NSpace, { size: 8, wrap: false }, { default: () => actions })
        : '-';
    },
    title: '操作',
    width: 220,
  },
]);

function resetForm() {
  revokeAvatarCropperUrl();
  Object.assign(form, { ...defaultForm });
  editingId.value = undefined;
  currentUid.value = '';
  currentRegisterTime.value = '';
  currentLastLoginIp.value = '';
  currentLastLoginTime.value = '';
  originalAvatar.value = '';
  avatarChanged.value = false;
  selectedAvatar.value = '';
  avatarUploadFileList.value = [];
  pendingAvatarFile.value = null;
  avatarCropperVisible.value = false;
}

async function loadRoles() {
  roles.value = await getAdminRoleListApi();
}

async function loadUsers() {
  loading.value = true;
  try {
    const page = await getAdminUserPageApi({
      current: query.current,
      keyword: query.keyword || undefined,
      size: query.size,
    });
    users.value = page.records;
    total.value = page.total;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.current = 1;
  void loadUsers();
}

function openCreate() {
  resetForm();
  modalVisible.value = true;
}

function openEdit(row: AdminUser) {
  revokeAvatarCropperUrl();
  const avatar = row.avatar ?? '';
  Object.assign(form, {
    address: row.address ?? '',
    avatar,
    email: row.email ?? '',
    gender: row.gender,
    isOfficial: row.isOfficial,
    mobile: row.mobile ?? '',
    nickname: row.nickname,
    password: '',
    roleIds: [...row.roleIds],
    summary: row.summary ?? '',
    username: row.username,
    wechat: row.wechat ?? '',
  });
  editingId.value = row.id;
  currentUid.value = row.uid;
  currentRegisterTime.value = row.registerTime || '';
  currentLastLoginIp.value = row.lastLoginIp || '';
  currentLastLoginTime.value = row.lastLoginTime || '';
  originalAvatar.value = avatar;
  avatarChanged.value = false;
  selectedAvatar.value = '';
  avatarUploadFileList.value = [];
  pendingAvatarFile.value = null;
  avatarCropperVisible.value = false;
  modalVisible.value = true;
}

async function handleSubmit() {
  await formRef.value?.validate();
  const payload: AdminUserPayload = { ...form };
  if (avatarChanged.value) {
    payload.avatar = selectedAvatar.value;
  }
  if (editingId.value && !payload.password) {
    delete payload.password;
  }
  if (editingId.value) {
    await updateAdminUserApi(editingId.value, payload);
    message.success('用户已更新');
  } else {
    await createAdminUserApi(payload);
    message.success('用户已创建');
  }
  modalVisible.value = false;
  await loadUsers();
}

async function uploadSelectedAvatar(file: File) {
  avatarUploading.value = true;
  try {
    const avatar = await uploadAvatarFile(file, {
      getSignature: (fileName) =>
        getAdminUploadSignatureApi({ dirType: 'avatar', fileName }),
      uploadToOss: async (signature, uploadFile) => {
        await uploadAvatarToOss(signature, uploadFile);
      },
    });
    selectedAvatar.value = avatar;
    form.avatar = avatar;
    avatarChanged.value = true;
    avatarUploadFileList.value = [];
    message.success('头像已上传');
  } catch (error) {
    message.error(error instanceof Error ? error.message : '头像上传失败');
  } finally {
    avatarUploading.value = false;
  }
}

function handleBeforeAvatarUpload({ file }: { file: { file?: File | null } }) {
  const error = validateAvatarUploadFile(file.file);
  if (error) {
    message.error(error);
    return false;
  }
  if (!file.file) {
    message.error('请选择图片文件');
    return false;
  }
  revokeAvatarCropperUrl();
  pendingAvatarFile.value = file.file;
  avatarCropperImageUrl.value = URL.createObjectURL(file.file);
  avatarCropperVisible.value = true;
  avatarUploadFileList.value = [];
  return false;
}

async function handleConfirmAvatarCrop() {
  if (!avatarCropperRef.value || !pendingAvatarFile.value) {
    message.error('请先选择头像图片');
    return;
  }
  const cropResult = await avatarCropperRef.value.getCropImage(
    'image/png',
    0.92,
    'blob',
    256,
    256,
  );
  if (!(cropResult instanceof Blob) || cropResult.size === 0) {
    message.error('头像裁剪失败');
    return;
  }
  const croppedFile = createCroppedAvatarFile(
    cropResult,
    pendingAvatarFile.value.name,
  );
  avatarCropperVisible.value = false;
  revokeAvatarCropperUrl();
  pendingAvatarFile.value = null;
  await uploadSelectedAvatar(croppedFile);
}

async function handleUploadOriginalAvatar() {
  if (!pendingAvatarFile.value) {
    message.error('请先选择头像图片');
    return;
  }
  const originalFile = pendingAvatarFile.value;
  avatarCropperVisible.value = false;
  revokeAvatarCropperUrl();
  pendingAvatarFile.value = null;
  await uploadSelectedAvatar(originalFile);
}

function handleCancelAvatarCrop() {
  avatarCropperVisible.value = false;
  pendingAvatarFile.value = null;
  avatarUploadFileList.value = [];
  revokeAvatarCropperUrl();
}

function handleAvatarCropperVisibleChange(visible: boolean) {
  avatarCropperVisible.value = visible;
  if (!visible) {
    handleCancelAvatarCrop();
  }
}

function handleCancelAvatarUpload() {
  const cancelledAvatar = createCancelledAvatarSelection(originalAvatar.value);
  form.avatar = cancelledAvatar.avatar;
  avatarChanged.value = cancelledAvatar.avatarChanged;
  selectedAvatar.value = cancelledAvatar.selectedAvatar;
  avatarUploadFileList.value = cancelledAvatar.uploadFileList;
}

/**
 * 确认并删除用户。
 *
 * :param row: 用户数据。
 * :return: 无返回值。
 */
function handleDelete(row: AdminUser): void {
  showDeleteConfirm(`确认删除“${row.nickname || row.username}”？`, async () => {
    await deleteAdminUserApi(row.id);
    message.success('用户已删除');
    await loadUsers();
  });
}

async function openRole(row: AdminUser) {
  currentUserId.value = row.id;
  checkedRoleIds.value = await getAdminUserRoleIdsApi(row.id);
  roleModalVisible.value = true;
}

async function handleSaveRoles() {
  if (!currentUserId.value) {
    return;
  }
  await updateAdminUserRolesApi(currentUserId.value, checkedRoleIds.value);
  roleModalVisible.value = false;
  message.success('用户角色已更新');
  await loadUsers();
}

function handlePageChange(page: number) {
  query.current = page;
  void loadUsers();
}

function handlePageSizeChange(size: number) {
  query.size = size;
  query.current = 1;
  void loadUsers();
}

onMounted(async () => {
  await loadRoles();
  await loadUsers();
});

onBeforeUnmount(() => {
  revokeAvatarCropperUrl();
});
</script>

<template>
  <Page title="用户管理">
    <NCard :bordered="false">
      <div class="admin-filter-toolbar mb-4">
        <NSpace class="admin-filter-fields" wrap>
          <NInput
            v-model:value="query.keyword"
            clearable
            placeholder="用户名 / 昵称 / 手机号 / 邮箱"
            class="w-[260px]"
            @keyup.enter="handleSearch"
          />
          <NButton type="primary" @click="handleSearch">查询</NButton>
        </NSpace>
        <div class="admin-filter-actions">
          <NButton
            v-if="canAccess('user:create')"
            type="primary"
            @click="openCreate"
          >
            新增用户
          </NButton>
        </div>
      </div>

      <NDataTable
        :columns="columns"
        :data="users"
        :loading="loading"
        :row-key="(row) => row.id"
        :scroll-x="2320"
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
      :title="editingId ? '编辑用户' : '新增用户'"
      preset="card"
      class="w-[760px] max-w-[92vw]"
    >
      <NForm
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="left"
        label-width="92"
      >
        <div class="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <NFormItem v-if="editingId" label="UID">
            <NTag bordered type="info">{{ currentUid }}</NTag>
          </NFormItem>
          <NFormItem label="用户名" path="username">
            <NInput v-model:value="form.username" />
          </NFormItem>
          <NFormItem label="昵称" path="nickname">
            <NInput v-model:value="form.nickname" />
          </NFormItem>
          <NFormItem label="密码" path="password">
            <NInput
              v-model:value="form.password"
              :placeholder="editingId ? '留空则不修改' : '请输入密码'"
              show-password-on="click"
              type="password"
            />
          </NFormItem>
          <NFormItem label="角色" path="roleIds">
            <NSelect
              v-model:value="form.roleIds"
              :options="roleOptions"
              multiple
              placeholder="请选择角色"
            />
          </NFormItem>
          <NFormItem label="性别" path="gender">
            <NSelect v-model:value="form.gender" :options="genderOptions" />
          </NFormItem>
          <NFormItem label="手机号" path="mobile">
            <NInput v-model:value="form.mobile" />
          </NFormItem>
          <NFormItem label="邮箱" path="email">
            <NInput v-model:value="form.email" />
          </NFormItem>
          <NFormItem label="微信号" path="wechat">
            <NInput v-model:value="form.wechat" />
          </NFormItem>
          <NFormItem label="地址" path="address">
            <NInput v-model:value="form.address" />
          </NFormItem>
          <NFormItem label="头像" path="avatar">
            <NSpace vertical class="w-full">
              <NSpace align="center">
                <NAvatar
                  v-if="form.avatar"
                  :src="form.avatar"
                  :img-props="{ alt: form.nickname || form.username || '头像' }"
                  object-fit="cover"
                  round
                  :size="48"
                />
                <NUpload
                  v-model:file-list="avatarUploadFileList"
                  accept="image/*"
                  :disabled="avatarUploading"
                  :max="1"
                  :show-file-list="false"
                  @before-upload="handleBeforeAvatarUpload"
                >
                  <NButton :loading="avatarUploading">上传头像</NButton>
                </NUpload>
                <NButton
                  v-if="avatarChanged"
                  :disabled="avatarUploading"
                  @click="handleCancelAvatarUpload"
                >
                  取消选择
                </NButton>
                <span v-if="avatarChanged" class="text-sm text-green-600">
                  新头像已选择
                </span>
              </NSpace>
            </NSpace>
          </NFormItem>
          <NFormItem label="官方用户" path="isOfficial">
            <NSwitch v-model:value="form.isOfficial" />
          </NFormItem>
          <NFormItem label="简介" path="summary" class="md:col-span-2">
            <NInput v-model:value="form.summary" type="textarea" />
          </NFormItem>
          <NFormItem v-if="editingId" label="注册时间">
            <NInput :value="currentRegisterTime || '-'" disabled />
          </NFormItem>
          <NFormItem v-if="editingId" label="最后登录 IP">
            <NInput :value="currentLastLoginIp || '-'" disabled />
          </NFormItem>
          <NFormItem v-if="editingId" label="最后登录">
            <NInput :value="currentLastLoginTime || '-'" disabled />
          </NFormItem>
        </div>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="modalVisible = false">取消</NButton>
          <NButton
            v-if="
              editingId ? canAccess('user:update') : canAccess('user:create')
            "
            :disabled="avatarUploading"
            type="primary"
            @click="handleSubmit"
          >
            保存
          </NButton>
        </NSpace>
      </template>
    </NModal>

    <NModal
      :show="avatarCropperVisible"
      title="裁剪头像"
      preset="card"
      class="w-[560px] max-w-[92vw]"
      @update:show="handleAvatarCropperVisibleChange"
    >
      <div class="flex justify-center">
        <VCropper
          v-if="avatarCropperImageUrl"
          ref="avatarCropperRef"
          aspect-ratio="1:1"
          :height="420"
          :img="avatarCropperImageUrl"
          :width="420"
        />
      </div>
      <template #footer>
        <NSpace justify="end">
          <NButton :disabled="avatarUploading" @click="handleCancelAvatarCrop">
            取消
          </NButton>
          <NButton
            :loading="avatarUploading"
            secondary
            type="primary"
            @click="handleUploadOriginalAvatar"
          >
            原图上传
          </NButton>
          <NButton
            :loading="avatarUploading"
            type="primary"
            @click="handleConfirmAvatarCrop"
          >
            裁剪并上传
          </NButton>
        </NSpace>
      </template>
    </NModal>

    <NModal
      v-model:show="roleModalVisible"
      title="用户角色"
      preset="card"
      class="w-[520px] max-w-[92vw]"
    >
      <NSelect
        v-model:value="checkedRoleIds"
        :options="roleOptions"
        multiple
        placeholder="请选择角色"
      />
      <template #footer>
        <NSpace justify="end">
          <NButton @click="roleModalVisible = false">取消</NButton>
          <NButton
            v-if="canAccess('user:role')"
            type="primary"
            @click="handleSaveRoles"
          >
            保存
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </Page>
</template>
