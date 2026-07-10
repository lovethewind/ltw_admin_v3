import { describe, expect, it } from 'vitest';

import { getGenderLabel } from './user-options';

describe('user options', () => {
  it('返回性别展示文案', () => {
    expect(getGenderLabel(0)).toBe('保密');
    expect(getGenderLabel(1)).toBe('男');
    expect(getGenderLabel(2)).toBe('女');
    expect(getGenderLabel(99)).toBe('未知');
  });
});
