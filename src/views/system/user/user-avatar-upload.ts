import type { AdminUploadSignature } from '#/api';

export interface AvatarUploadClient {
  getSignature: (fileName: string) => Promise<AdminUploadSignature>;
  uploadToOss: (signature: AdminUploadSignature, file: File) => Promise<void>;
}

export interface CancelledAvatarSelection {
  avatar: string;
  avatarChanged: boolean;
  selectedAvatar: string;
  uploadFileList: [];
}

export function createCancelledAvatarSelection(
  originalAvatar: string,
): CancelledAvatarSelection {
  return {
    avatar: originalAvatar,
    avatarChanged: false,
    selectedAvatar: '',
    uploadFileList: [],
  };
}

export function createCroppedAvatarFile(
  blob: Blob,
  originalName: string,
): File {
  const baseName = originalName.replace(/\.[^.]*$/, '').trim() || 'avatar';
  return new File([blob], `${baseName}-cropped-${Date.now()}.png`, {
    type: 'image/png',
  });
}

export function validateAvatarUploadFile(file?: File | null) {
  if (!file || !file.type.startsWith('image/')) {
    return '请选择图片文件';
  }
  return undefined;
}

export async function uploadAvatarFile(file: File, client: AvatarUploadClient) {
  const error = validateAvatarUploadFile(file);
  if (error) {
    throw new Error(error);
  }
  const signature = await client.getSignature(file.name);
  await client.uploadToOss(signature, file);
  return signature.url;
}

export async function uploadAvatarToOss(
  signature: AdminUploadSignature,
  file: File,
) {
  const response = await fetch(signature.uploadUrl, {
    body: file,
    headers: {
      'Content-Disposition': signature.contentDisposition,
      'Content-Type': signature.contentType,
      'x-oss-forbid-overwrite': 'true',
    },
    method: 'PUT',
  });

  if (!response.ok) {
    throw new Error('头像上传失败');
  }
}
