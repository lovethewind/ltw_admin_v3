<script setup lang="ts">
import type { UploadFileInfo } from 'naive-ui';

import { onBeforeUnmount, ref } from 'vue';

import { VCropper } from '@vben/common-ui';

import {
  NButton,
  NImage,
  NInput,
  NModal,
  NSpace,
  NUpload,
  useMessage,
} from 'naive-ui';

import { getAdminUploadSignatureApi } from '#/api';

import {
  createCroppedImageFile,
  uploadImageFile,
  uploadImageToOss,
  validateImageUploadFile,
} from './image-upload';

interface ImageCropperRef {
  getCropImage: (
    format?: 'image/jpeg' | 'image/png',
    quality?: number,
    outputType?: 'base64' | 'blob',
    targetWidth?: number,
    targetHeight?: number,
  ) => Promise<Blob | string | undefined>;
}

const props = withDefaults(
  defineProps<{
    allowUrlInput?: boolean;
    aspectRatio?: string;
    cropHeight?: number;
    cropWidth?: number;
    dirType?: string;
    targetHeight?: number;
    targetWidth?: number;
  }>(),
  {
    allowUrlInput: false,
    aspectRatio: undefined,
    cropHeight: 360,
    cropWidth: 520,
    dirType: 'cover',
    targetHeight: 540,
    targetWidth: 960,
  },
);

const imageUrl = defineModel<string>({ default: '' });
const message = useMessage();
const uploading = ref(false);
const uploadFileList = ref<UploadFileInfo[]>([]);
const cropperVisible = ref(false);
const cropperRef = ref<ImageCropperRef | null>(null);
const cropperImageUrl = ref('');
const pendingFile = ref<File | null>(null);

function revokeCropperUrl(): void {
  if (cropperImageUrl.value) {
    URL.revokeObjectURL(cropperImageUrl.value);
  }
  cropperImageUrl.value = '';
}

function handleBeforeUpload({ file }: { file: { file?: File | null } }): false {
  const error = validateImageUploadFile(file.file);
  if (error) {
    message.error(error);
    return false;
  }
  if (!file.file) {
    message.error('请选择图片文件');
    return false;
  }
  revokeCropperUrl();
  pendingFile.value = file.file;
  cropperImageUrl.value = URL.createObjectURL(file.file);
  cropperVisible.value = true;
  uploadFileList.value = [];
  return false;
}

async function uploadSelectedImage(file: File): Promise<void> {
  uploading.value = true;
  try {
    const nextUrl = await uploadImageFile(file, {
      getSignature: (fileName) =>
        getAdminUploadSignatureApi({ dirType: props.dirType, fileName }),
      uploadToOss: async (signature, uploadFile) => {
        await uploadImageToOss(signature, uploadFile);
      },
    });
    imageUrl.value = nextUrl;
    uploadFileList.value = [];
    message.success('图片已上传');
  } catch (error) {
    message.error(error instanceof Error ? error.message : '图片上传失败');
  } finally {
    uploading.value = false;
  }
}

async function handleUploadOriginal(): Promise<void> {
  if (!pendingFile.value) {
    message.error('请先选择图片');
    return;
  }
  const originalFile = pendingFile.value;
  cropperVisible.value = false;
  revokeCropperUrl();
  pendingFile.value = null;
  await uploadSelectedImage(originalFile);
}

async function handleUploadCropped(): Promise<void> {
  if (!cropperRef.value || !pendingFile.value) {
    message.error('请先选择图片');
    return;
  }
  const cropResult = await cropperRef.value.getCropImage(
    'image/png',
    0.92,
    'blob',
    props.targetWidth,
    props.targetHeight,
  );
  if (!(cropResult instanceof Blob) || cropResult.size === 0) {
    message.error('图片裁剪失败');
    return;
  }
  const croppedFile = createCroppedImageFile(
    cropResult,
    pendingFile.value.name,
  );
  cropperVisible.value = false;
  revokeCropperUrl();
  pendingFile.value = null;
  await uploadSelectedImage(croppedFile);
}

function handleCancelCrop(): void {
  cropperVisible.value = false;
  pendingFile.value = null;
  uploadFileList.value = [];
  revokeCropperUrl();
}

function handleCropperVisibleChange(visible: boolean): void {
  cropperVisible.value = visible;
  if (!visible) {
    handleCancelCrop();
  }
}

onBeforeUnmount(() => {
  revokeCropperUrl();
});
</script>

<template>
  <NSpace vertical class="w-full">
    <NSpace align="center" class="w-full" :size="12">
      <NImage
        v-if="imageUrl"
        :src="imageUrl"
        :preview-src="imageUrl"
        class="admin-image-upload-preview"
        object-fit="cover"
        width="320"
        height="180"
      />
      <NUpload
        v-model:file-list="uploadFileList"
        accept="image/*"
        :disabled="uploading"
        :max="1"
        :show-file-list="false"
        @before-upload="handleBeforeUpload"
      >
        <NButton :loading="uploading">上传图片</NButton>
      </NUpload>
    </NSpace>
    <NInput
      v-if="props.allowUrlInput"
      v-model:value="imageUrl"
      clearable
      placeholder="或直接输入图片链接"
    />

    <NModal
      :show="cropperVisible"
      title="裁剪图片"
      preset="card"
      class="w-[660px] max-w-[92vw]"
      @update:show="handleCropperVisibleChange"
    >
      <div class="flex justify-center">
        <VCropper
          v-if="cropperImageUrl"
          ref="cropperRef"
          :aspect-ratio="aspectRatio"
          :height="cropHeight"
          :img="cropperImageUrl"
          :width="cropWidth"
        />
      </div>
      <template #footer>
        <NSpace justify="end">
          <NButton :disabled="uploading" @click="handleCancelCrop">
            取消
          </NButton>
          <NButton
            :loading="uploading"
            secondary
            type="primary"
            @click="handleUploadOriginal"
          >
            原图上传
          </NButton>
          <NButton
            :loading="uploading"
            type="primary"
            @click="handleUploadCropped"
          >
            裁剪上传
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </NSpace>
</template>

<style scoped>
.admin-image-upload-preview {
  width: min(100%, 320px);
  height: 180px;
}

.admin-image-upload-preview :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
