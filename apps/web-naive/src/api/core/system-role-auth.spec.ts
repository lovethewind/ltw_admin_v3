import { describe, expect, it } from 'vitest';

import { toAdminRoleMenuPayload, toAdminUserRolePayload } from './system';

describe('toAdminRoleMenuPayload', () => {
  it('保留雪花 ID 字符串，避免授权保存时丢失精度', () => {
    const menuId = '2067963391396630533';

    expect(toAdminRoleMenuPayload([menuId])).toEqual({
      menuIds: [menuId],
    });
  });
});

describe('toAdminUserRolePayload', () => {
  it('保留角色雪花 ID 字符串，避免用户授权保存时丢失精度', () => {
    const roleId = '2067963391396630528';

    expect(toAdminUserRolePayload([roleId])).toEqual({
      roleIds: [roleId],
    });
  });
});
