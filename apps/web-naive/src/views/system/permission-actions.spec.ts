import { describe, expect, it } from 'vitest';

import { getPermittedActions, hasActionPermission } from './permission-actions';

describe('permission actions', () => {
  const accessCodes = ['system:menu:create', 'system:user:role'];

  it('根据权限码判断单个操作是否可用', () => {
    expect(hasActionPermission(accessCodes, 'system:menu:create')).toBe(true);
    expect(hasActionPermission(accessCodes, 'system:menu:delete')).toBe(false);
  });

  it('过滤出当前用户可用的页面操作', () => {
    expect(
      getPermittedActions(accessCodes, [
        { code: 'system:menu:create', key: 'create' },
        { code: 'system:menu:delete', key: 'delete' },
        { code: 'system:user:role', key: 'role' },
      ]),
    ).toEqual([
      { code: 'system:menu:create', key: 'create' },
      { code: 'system:user:role', key: 'role' },
    ]);
  });
});
