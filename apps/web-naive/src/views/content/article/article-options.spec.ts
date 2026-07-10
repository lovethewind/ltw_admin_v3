import { describe, expect, it } from 'vitest';

import {
  getArticleStatusLabel,
  getArticleStatusType,
  getOriginalLabel,
} from './article-options';

describe('article options', () => {
  it('返回文章状态展示文案和状态类型', () => {
    expect(getArticleStatusLabel(1)).toBe('草稿');
    expect(getArticleStatusLabel(2)).toBe('已发布');
    expect(getArticleStatusLabel(3)).toBe('待审核');
    expect(getArticleStatusLabel(4)).toBe('回收站');
    expect(getArticleStatusLabel(99)).toBe('未知');
    expect(getArticleStatusType(2)).toBe('success');
    expect(getArticleStatusType(3)).toBe('warning');
    expect(getArticleStatusType(4)).toBe('error');
  });

  it('返回原创展示文案', () => {
    expect(getOriginalLabel(true)).toBe('原创');
    expect(getOriginalLabel(false)).toBe('转载');
  });
});
