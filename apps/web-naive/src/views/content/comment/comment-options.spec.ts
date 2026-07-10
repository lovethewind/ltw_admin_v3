import { describe, expect, it } from 'vitest';

import {
  getCommentObjectTypeLabel,
  getCommentStatusLabel,
  getCommentStatusType,
} from './comment-options';

describe('comment options', () => {
  it('返回评论状态文案和状态类型', () => {
    expect(getCommentStatusLabel(1)).toBe('通过');
    expect(getCommentStatusLabel(2)).toBe('审核中');
    expect(getCommentStatusLabel(3)).toBe('已删除');
    expect(getCommentStatusLabel(99)).toBe('未知');
    expect(getCommentStatusType(1)).toBe('success');
    expect(getCommentStatusType(2)).toBe('warning');
    expect(getCommentStatusType(3)).toBe('error');
  });

  it('返回评论对象类型文案', () => {
    expect(getCommentObjectTypeLabel(1)).toBe('文章');
    expect(getCommentObjectTypeLabel(5)).toBe('图片');
    expect(getCommentObjectTypeLabel(99)).toBe('未知');
  });
});
