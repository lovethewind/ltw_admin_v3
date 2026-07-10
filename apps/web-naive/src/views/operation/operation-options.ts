export const jobStatusOptions = [
  { label: '正常', value: 1 },
  { label: '暂停', value: 2 },
];
export const misfirePolicyOptions = [
  { label: '立即执行', value: 1 },
  { label: '执行一次', value: 2 },
  { label: '放弃执行', value: 3 },
];
export const noticeTypeOptions = [
  { label: '系统', value: 1 },
  { label: '评论', value: 2 },
  { label: '回复', value: 3 },
  { label: '@我', value: 4 },
  { label: '点赞', value: 5 },
  { label: '收藏', value: 6 },
  { label: '关注', value: 7 },
];
export const restrictTypeOptions = [
  { label: '封禁', value: 1 },
  { label: '禁言', value: 2 },
];
export const booleanNumberOptions = [
  { label: '是', value: 1 },
  { label: '否', value: 0 },
];
export function getOptionLabel(
  options: Array<{ label: string; value: number }>,
  value: number,
) {
  return options.find((item) => item.value === value)?.label ?? '未知';
}
/**
 * 获取任务状态对应的标签类型。
 *
 * @param status 任务状态值。
 * @return 状态标签类型。
 */
export function getJobStatusType(
  status: number,
): 'default' | 'success' | 'warning' {
  if (status === 1) return 'success';
  if (status === 2) return 'warning';
  return 'default';
}
export function getBooleanLabel(value: boolean) {
  return value ? '是' : '否';
}
