import { describe, expect, it } from 'vitest';

import {
  getBooleanLabel,
  getJobStatusType,
  getOptionLabel,
  jobStatusOptions,
  noticeTypeOptions,
  restrictTypeOptions,
} from './operation-options';
describe('operation options', () => {
  it('返回运营模块枚举文案', () => {
    expect(getOptionLabel(jobStatusOptions, 1)).toBe('正常');
    expect(getOptionLabel(noticeTypeOptions, 7)).toBe('关注');
    expect(getOptionLabel(restrictTypeOptions, 2)).toBe('禁言');
    expect(getOptionLabel(restrictTypeOptions, 99)).toBe('未知');
  });
  it('返回状态类型和布尔文案', () => {
    expect(getJobStatusType(1)).toBe('success');
    expect(getJobStatusType(2)).toBe('warning');
    expect(getBooleanLabel(true)).toBe('是');
    expect(getBooleanLabel(false)).toBe('否');
  });
});
