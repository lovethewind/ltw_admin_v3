import { describe, expect, it } from 'vitest';

import { getArticleAuthorUidLabel } from './article-author';

describe('article author', () => {
  it('formats author uid with a label for tag display', () => {
    expect(getArticleAuthorUidLabel({ id: '10001', uid: 'ltw-001' })).toBe(
      'UID ltw-001',
    );
  });

  it('falls back to id when uid is empty', () => {
    expect(getArticleAuthorUidLabel({ id: '10001', uid: '' })).toBe(
      'UID 10001',
    );
  });
});
