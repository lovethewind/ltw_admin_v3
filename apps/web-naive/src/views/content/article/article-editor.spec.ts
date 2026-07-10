import { describe, expect, it } from 'vitest';

import {
  getArticleEditorMode,
  getArticleEditorModeLabel,
} from './article-editor';

describe('article editor', () => {
  it('根据 Markdown 开关返回文章编辑器类型', () => {
    expect(getArticleEditorMode(true)).toBe('markdown');
    expect(getArticleEditorMode(false)).toBe('richText');
  });

  it('返回文章编辑器类型展示文案', () => {
    expect(getArticleEditorModeLabel('markdown')).toBe('Markdown 编辑器');
    expect(getArticleEditorModeLabel('richText')).toBe('富文本编辑器');
  });
});
