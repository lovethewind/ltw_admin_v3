interface ArticleAuthorIdentity {
  id: string;
  uid?: null | string;
}

export function getArticleAuthorUidLabel(
  author: ArticleAuthorIdentity,
): string {
  return `UID ${author.uid || author.id}`;
}
