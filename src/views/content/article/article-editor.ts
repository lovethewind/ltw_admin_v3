export type ArticleEditorMode = 'markdown' | 'richText';

export function getArticleEditorMode(isMarkdown: boolean): ArticleEditorMode {
  return isMarkdown ? 'markdown' : 'richText';
}

export function getArticleEditorModeLabel(mode: ArticleEditorMode): string {
  return mode === 'markdown' ? 'Markdown 编辑器' : '富文本编辑器';
}
