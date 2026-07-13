import type { AdminMenu, AdminMenuPayload } from '#/api';

export type AdminMenuFormPayload = Omit<AdminMenuPayload, 'parentId'> & {
  parentId: string;
};

export function validateMenuType(menuType: null | number | undefined): boolean {
  return menuType === 0 || menuType === 1 || menuType === 2;
}

export function validateMenuCode(
  menuType: null | number | undefined,
  code: null | string | undefined,
): boolean {
  return menuType !== 2 || Boolean(code?.trim());
}

export function normalizeAdminMenuPayload(
  form: AdminMenuFormPayload,
): AdminMenuPayload {
  const code = form.code?.trim() || null;

  return {
    ...form,
    code,
  };
}

function findMenuNameById(menus: AdminMenu[], id: string): null | string {
  for (const menu of menus) {
    if (menu.id === id) {
      return menu.name;
    }

    const childName = findMenuNameById(menu.children ?? [], id);
    if (childName) {
      return childName;
    }
  }

  return null;
}

export function getParentMenuLabel(
  menus: AdminMenu[],
  parentId: null | number | string | undefined,
): string {
  const normalizedParentId =
    parentId === null || parentId === undefined
      ? '0'
      : `${parentId}`.trim() || '0';

  if (normalizedParentId === '0') {
    return '顶级菜单';
  }

  return findMenuNameById(menus, normalizedParentId) ?? '未知上级菜单';
}
