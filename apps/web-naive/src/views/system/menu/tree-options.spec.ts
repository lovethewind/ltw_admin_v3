import type { AdminMenu } from '#/api';

import { describe, expect, it } from 'vitest';

import { findMenuByKey, toMenuTreeOptions } from './tree-options';

const menus: AdminMenu[] = [
  {
    alwaysShow: false,
    children: [
      {
        alwaysShow: false,
        code: 'system:menu',
        component: '/system/menu/index',
        hidden: false,
        icon: 'lucide:list-tree',
        id: '2',
        index: 1,
        isActive: true,
        isOutLink: false,
        menuType: 1,
        name: '菜单管理',
        parentId: '1',
        path: '/system/menu',
        routeName: 'SystemMenu',
      },
    ],
    code: 'system',
    component: 'BasicLayout',
    hidden: false,
    icon: 'lucide:settings',
    id: '1',
    index: 0,
    isActive: true,
    isOutLink: false,
    menuType: 0,
    name: '系统管理',
    parentId: '0',
    path: '/system',
    routeName: 'System',
  },
];

describe('menu tree options', () => {
  it('把后端菜单树转换为 Naive Tree 节点，并保留原始菜单数据', () => {
    const options = toMenuTreeOptions(menus);

    expect(options).toEqual([
      expect.objectContaining({
        key: '1',
        label: '系统管理',
        menu: menus[0],
      }),
    ]);
    expect(options[0]?.children?.[0]).toEqual(
      expect.objectContaining({
        key: '2',
        label: '菜单管理',
        menu: menus[0]?.children?.[0],
      }),
    );
  });

  it('可以通过树节点 key 在原始菜单树中找到菜单', () => {
    expect(findMenuByKey(menus, '2')?.name).toBe('菜单管理');
    expect(findMenuByKey(menus, '1')?.name).toBe('系统管理');
    expect(findMenuByKey(menus, '999')).toBeNull();
  });
});
