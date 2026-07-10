export const checkStatusOptions = [
  { label: '通过', value: 1 },
  { label: '审核中', value: 2 },
  { label: '拒绝', value: 3 },
];

export const albumTypeOptions = [
  { label: '公开', value: 1 },
  { label: '私密', value: 2 },
];

export function getCheckStatusLabel(status: number) {
  return (
    checkStatusOptions.find((item) => item.value === status)?.label ?? '未知'
  );
}

export function getCheckStatusType(status: number) {
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

export function getAlbumTypeLabel(albumType: number) {
  return (
    albumTypeOptions.find((item) => item.value === albumType)?.label ?? '未知'
  );
}
