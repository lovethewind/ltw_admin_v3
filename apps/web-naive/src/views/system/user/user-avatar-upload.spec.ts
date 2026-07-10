import type { AvatarUploadClient } from './user-avatar-upload';

import { describe, expect, it, vi } from 'vitest';

import {
  createCancelledAvatarSelection,
  createCroppedAvatarFile,
  uploadAvatarFile,
  validateAvatarUploadFile,
} from './user-avatar-upload';

describe('user avatar upload', () => {
  it('只允许上传图片文件', () => {
    expect(
      validateAvatarUploadFile(
        new File(['x'], 'avatar.png', { type: 'image/png' }),
      ),
    ).toBeUndefined();
    expect(
      validateAvatarUploadFile(
        new File(['x'], 'avatar.txt', { type: 'text/plain' }),
      ),
    ).toBe('请选择图片文件');
    expect(validateAvatarUploadFile(null)).toBe('请选择图片文件');
  });

  it('获取上传签名后返回头像访问地址', async () => {
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    const client: AvatarUploadClient = {
      getSignature: vi.fn().mockResolvedValue({
        contentDisposition: "attachment; filename*=utf-8''avatar.png",
        contentType: 'image/*',
        uploadUrl: 'https://oss.example.com/avatar.png?signature=1',
        url: 'https://cdn.example.com/avatar.png',
      }),
      uploadToOss: vi.fn().mockResolvedValue(undefined),
    };

    await expect(uploadAvatarFile(file, client)).resolves.toBe(
      'https://cdn.example.com/avatar.png',
    );
    expect(client.getSignature).toHaveBeenCalledWith('avatar.png');
    expect(client.uploadToOss).toHaveBeenCalledWith(
      expect.objectContaining({
        uploadUrl: 'https://oss.example.com/avatar.png?signature=1',
      }),
      file,
    );
  });

  it('取消头像选择时还原原头像并清空上传控件文件列表', () => {
    expect(
      createCancelledAvatarSelection('https://cdn.example.com/old.png'),
    ).toEqual({
      avatar: 'https://cdn.example.com/old.png',
      avatarChanged: false,
      selectedAvatar: '',
      uploadFileList: [],
    });
  });

  it('把裁剪结果转换为可上传的头像文件', () => {
    const blob = new Blob(['cropped'], { type: 'image/png' });
    const file = createCroppedAvatarFile(blob, 'avatar.source.jpg');

    expect(file).toBeInstanceOf(File);
    expect(file.name).toMatch(/^avatar\.source-cropped-\d+\.png$/);
    expect(file.type).toBe('image/png');
  });

  it('原图上传时保留原始文件信息', async () => {
    const file = new File(['origin'], 'avatar-origin.png', {
      type: 'image/png',
    });
    const client: AvatarUploadClient = {
      getSignature: vi.fn().mockResolvedValue({
        contentDisposition: "attachment; filename*=utf-8''avatar-origin.png",
        contentType: 'image/png',
        uploadUrl: 'https://oss.example.com/avatar-origin.png?signature=1',
        url: 'https://cdn.example.com/avatar-origin.png',
      }),
      uploadToOss: vi.fn().mockResolvedValue(undefined),
    };

    await uploadAvatarFile(file, client);

    expect(client.getSignature).toHaveBeenCalledWith('avatar-origin.png');
    expect(client.uploadToOss).toHaveBeenCalledWith(expect.any(Object), file);
  });
});
