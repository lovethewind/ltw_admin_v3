import { describe, expect, it } from 'vitest';

import { normalizeBackendMenus } from './menu-adapter';

describe('backend menu adapter', () => {
  it('keeps configured backend route components for dynamic menu mode', () => {
    expect(
      normalizeBackendMenus([
        {
          children: [
            {
              component: '/system/menu/index',
              meta: {
                icon: 'carbon:menu',
                title: '菜单管理',
              },
              name: 'SystemMenu',
              path: '/system/menu',
            },
          ],
          meta: {
            icon: 'carbon:settings',
            title: '系统管理',
          },
          component: '',
          name: 'System',
          path: '/system',
        },
      ]),
    ).toEqual([
      {
        children: [
          {
            component: '/system/menu/index',
            meta: {
              icon: 'carbon:menu',
              title: '菜单管理',
            },
            name: 'SystemMenu',
            path: '/system/menu',
          },
        ],
        meta: {
          icon: 'carbon:settings',
          title: '系统管理',
        },
        component: 'BasicLayout',
        name: 'System',
        path: '/system',
      },
    ]);
  });

  it('drops legacy menu entries that cannot be resolved by current naive views', () => {
    expect(
      normalizeBackendMenus([
        {
          children: [
            {
              component: 'user/list',
              meta: { title: '用户管理' },
              name: 'User',
              path: 'user',
            },
            {
              component: '/system/role/index',
              meta: { title: '角色管理' },
              name: 'SystemRole',
              path: '/system/role',
            },
          ],
          component: 'Layout',
          meta: { title: '系统管理' },
          name: 'System',
          path: 'system',
        },
        {
          children: [
            {
              component: 'article/list',
              meta: { title: '文章管理' },
              name: 'Article',
              path: 'article-list',
            },
          ],
          component: 'Layout',
          meta: { title: '文章管理' },
          name: 'ArticleManage',
          path: 'article',
        },
      ]),
    ).toEqual([
      {
        children: [
          {
            component: '/system/role/index',
            meta: { title: '角色管理' },
            name: 'SystemRole',
            path: '/system/role',
          },
        ],
        component: 'BasicLayout',
        meta: { title: '系统管理' },
        name: 'System',
        path: '/system',
      },
    ]);
  });
});
