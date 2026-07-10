import { describe, expect, it } from 'vitest';

import { collectTreeKeys, normalizeCheckedTreeKeys } from './role-auth';

describe('collectTreeKeys', () => {
  it('收集授权树全部节点 key，供全选使用', () => {
    const tree = [
      {
        children: [
          { key: '2067963391396630533', label: '菜单管理' },
          {
            children: [{ key: '2067963391396630539', label: '角色查询' }],
            key: '2067963391396630538',
            label: '角色管理',
          },
        ],
        key: '2067963391396630532',
        label: '系统管理',
      },
    ];

    expect(collectTreeKeys(tree)).toEqual([
      '2067963391396630532',
      '2067963391396630533',
      '2067963391396630538',
      '2067963391396630539',
    ]);
  });

  it('保存子节点授权时补齐祖先节点，保证动态菜单能挂载', () => {
    const tree = [
      {
        children: [
          {
            children: [{ key: '2067963391396630534', label: '菜单查询' }],
            key: '2067963391396630533',
            label: '菜单管理',
          },
        ],
        key: '2067963391396630532',
        label: '系统管理',
      },
    ];

    expect(normalizeCheckedTreeKeys(['2067963391396630534'], tree)).toEqual([
      '2067963391396630534',
      '2067963391396630533',
      '2067963391396630532',
    ]);
  });
});
