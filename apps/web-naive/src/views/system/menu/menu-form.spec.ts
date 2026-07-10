import { describe, expect, it } from 'vitest';

import {
  getParentMenuLabel,
  normalizeAdminMenuPayload,
  validateMenuCode,
  validateMenuType,
} from './menu-form';

describe('menu form', () => {
  it('允许目录类型的值 0 通过类型校验', () => {
    expect(validateMenuType(0)).toBe(true);
  });

  it('只要求按钮类型填写权限标识', () => {
    expect(validateMenuCode(0, '')).toBe(true);
    expect(validateMenuCode(1, '')).toBe(true);
    expect(validateMenuCode(2, '')).toBe(false);
    expect(validateMenuCode(2, 'system:menu:create')).toBe(true);
  });

  it('提交菜单时把空白权限标识规范为空值', () => {
    expect(
      normalizeAdminMenuPayload({
        alwaysShow: false,
        code: '   ',
        component: 'Layout',
        hidden: false,
        icon: '',
        index: 1,
        isActive: true,
        isOutLink: false,
        menuType: 0,
        name: '系统管理',
        parentId: '0',
        path: 'system',
        routeName: 'System',
      }),
    ).toEqual(
      expect.objectContaining({
        code: null,
        menuType: 0,
      }),
    );
  });

  it('根据上级 ID 返回菜单名称展示', () => {
    expect(
      getParentMenuLabel(
        [
          {
            alwaysShow: false,
            children: [
              {
                alwaysShow: false,
                children: [],
                code: null,
                component: 'system/menu/index',
                hidden: false,
                icon: '',
                id: '2',
                index: 1,
                isActive: true,
                isOutLink: false,
                menuType: 1,
                name: '菜单管理',
                parentId: '1',
                path: 'menu',
                routeName: 'SystemMenu',
              },
            ],
            code: null,
            component: 'Layout',
            hidden: false,
            icon: '',
            id: '1',
            index: 1,
            isActive: true,
            isOutLink: false,
            menuType: 0,
            name: '系统管理',
            parentId: '0',
            path: 'system',
            routeName: 'System',
          },
        ],
        '2',
      ),
    ).toBe('菜单管理');
    expect(getParentMenuLabel([], '0')).toBe('顶级菜单');
    expect(getParentMenuLabel([], 0)).toBe('顶级菜单');
    expect(getParentMenuLabel([], '999')).toBe('未知上级菜单');
  });
});
