export const commentStatusOptions = [
  { label: '通过', value: 1 },
  { label: '审核中', value: 2 },
  { label: '已删除', value: 3 },
];

export const commentObjectTypeOptions = [
  { label: '文章', value: 1 },
  { label: '评论', value: 2 },
  { label: '用户', value: 3 },
  { label: '图片', value: 5 },
];

export function getCommentStatusLabel(status: number) {
  return (
    commentStatusOptions.find((item) => item.value === status)?.label ?? '未知'
  );
}

export function getCommentStatusType(status: number) {
  if (status === 1) {
    return 'success';
  }
  if (status === 2) {
    return 'warning';
  }
  if (status === 3) {
    return 'error';
  }
  return 'default';
}

export function getCommentObjectTypeLabel(objType: number) {
  return (
    commentObjectTypeOptions.find((item) => item.value === objType)?.label ??
    '未知'
  );
}
