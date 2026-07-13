export const articleStatusOptions = [
  { label: '草稿', value: 1 },
  { label: '已发布', value: 2 },
  { label: '待审核', value: 3 },
  { label: '回收站', value: 4 },
];

export const originalOptions = [
  { label: '原创', value: 1 },
  { label: '转载', value: 0 },
];

export const originalSwitchOptions = [
  { label: '原创', value: true },
  { label: '转载', value: false },
];

export function getArticleStatusLabel(status: number) {
  return (
    articleStatusOptions.find((item) => item.value === status)?.label ?? '未知'
  );
}

export function getArticleStatusType(status: number) {
  if (status === 2) {
    return 'success';
  }
  if (status === 3) {
    return 'warning';
  }
  if (status === 4) {
    return 'error';
  }
  return 'default';
}

export function getOriginalLabel(isOriginal: boolean) {
  return isOriginal ? '原创' : '转载';
}
