import type { ImageUploadClient } from './image-upload';

import { describe, expect, it, vi } from 'vitest';

import {
  createCroppedImageFile,
  uploadImageFile,
  validateImageUploadFile,
} from './image-upload';

describe('image upload', () => {
  it('只允许上传图片文件', () => {
    expect(
      validateImageUploadFile(
        new File(['x'], 'cover.png', { type: 'image/png' }),
      ),
    ).toBeUndefined();
    expect(
      validateImageUploadFile(
        new File(['x'], 'cover.txt', { type: 'text/plain' }),
      ),
    ).toBe('请选择图片文件');
    expect(validateImageUploadFile(null)).toBe('请选择图片文件');
  });

  it('获取上传签名后返回图片访问地址', async () => {
    const file = new File(['cover'], 'cover.png', { type: 'image/png' });
    const client: ImageUploadClient = {
      getSignature: vi.fn().mockResolvedValue({
        contentDisposition: "attachment; filename*=utf-8''cover.png",
        contentType: 'image/png',
        uploadUrl: 'https://oss.example.com/cover.png?signature=1',
        url: 'https://cdn.example.com/cover.png',
      }),
      uploadToOss: vi.fn().mockResolvedValue(undefined),
    };

    await expect(uploadImageFile(file, client)).resolves.toBe(
      'https://cdn.example.com/cover.png',
    );
    expect(client.getSignature).toHaveBeenCalledWith('cover.png');
    expect(client.uploadToOss).toHaveBeenCalledWith(expect.any(Object), file);
  });

  it('把裁剪结果转换为可上传的图片文件', () => {
    const blob = new Blob(['cropped'], { type: 'image/png' });
    const file = createCroppedImageFile(blob, 'cover.source.jpg');

    expect(file).toBeInstanceOf(File);
    expect(file.name).toMatch(/^cover\.source-cropped-\d+\.png$/);
    expect(file.type).toBe('image/png');
  });
});
