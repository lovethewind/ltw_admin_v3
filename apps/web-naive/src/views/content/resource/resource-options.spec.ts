import { describe, expect, it } from 'vitest';

import {
  getAlbumTypeLabel,
  getCheckStatusLabel,
  getCheckStatusType,
} from './resource-options';

describe('resource options', () => {
  it('返回审核状态文案和状态类型', () => {
    expect(getCheckStatusLabel(1)).toBe('通过');
    expect(getCheckStatusLabel(2)).toBe('审核中');
    expect(getCheckStatusLabel(3)).toBe('拒绝');
    expect(getCheckStatusLabel(99)).toBe('未知');
    expect(getCheckStatusType(1)).toBe('success');
    expect(getCheckStatusType(2)).toBe('warning');
    expect(getCheckStatusType(3)).toBe('error');
    expect(getCheckStatusType(99)).toBe('default');
  });

  it('返回图册类型文案', () => {
    expect(getAlbumTypeLabel(1)).toBe('公开');
    expect(getAlbumTypeLabel(2)).toBe('私密');
    expect(getAlbumTypeLabel(99)).toBe('未知');
  });
});
