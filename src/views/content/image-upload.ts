import type { AdminUploadSignature } from '#/api';

export interface ImageUploadClient {
  getSignature: (fileName: string) => Promise<AdminUploadSignature>;
  uploadToOss: (signature: AdminUploadSignature, file: File) => Promise<void>;
}

export function validateImageUploadFile(
  file?: File | null,
): string | undefined {
  if (!file || !file.type.startsWith('image/')) {
    return '请选择图片文件';
  }
  return undefined;
}

export function createCroppedImageFile(blob: Blob, originalName: string): File {
  const baseName = originalName.replace(/\.[^.]*$/, '').trim() || 'image';
  return new File([blob], `${baseName}-cropped-${Date.now()}.png`, {
    type: 'image/png',
  });
}

export async function uploadImageFile(
  file: File,
  client: ImageUploadClient,
): Promise<string> {
  const error = validateImageUploadFile(file);
  if (error) {
    throw new Error(error);
  }
  const signature = await client.getSignature(file.name);
  await client.uploadToOss(signature, file);
  return signature.url;
}

export async function uploadImageToOss(
  signature: AdminUploadSignature,
  file: File,
): Promise<void> {
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
    throw new Error('图片上传失败');
  }
}
