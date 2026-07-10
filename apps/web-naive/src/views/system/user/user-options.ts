export const genderOptions = [
  { label: '保密', value: 0 },
  { label: '男', value: 1 },
  { label: '女', value: 2 },
];

export function getGenderLabel(gender: number) {
  return genderOptions.find((item) => item.value === gender)?.label ?? '未知';
}
