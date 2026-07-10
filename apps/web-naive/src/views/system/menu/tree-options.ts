import type { TreeOption } from 'naive-ui';

import type { AdminMenu, SnowflakeId } from '#/api';

export interface MenuTreeOption extends TreeOption {
  children?: MenuTreeOption[];
  key: SnowflakeId;
  menu: AdminMenu;
}

export function toMenuTreeOptions(menus: AdminMenu[]): MenuTreeOption[] {
  return menus.map((item) => ({
    children: item.children?.length
      ? toMenuTreeOptions(item.children)
      : undefined,
    key: item.id,
    label: item.name || item.code || item.id,
    menu: item,
  }));
}

export function findMenuByKey(
  menus: AdminMenu[],
  key: SnowflakeId,
): AdminMenu | null {
  for (const item of menus) {
    if (item.id === key) {
      return item;
    }

    const child = item.children?.length
      ? findMenuByKey(item.children, key)
      : null;
    if (child) {
      return child;
    }
  }

  return null;
}

export function collectMenuKeys(menus: AdminMenu[]): SnowflakeId[] {
  return menus.flatMap((item) => [
    item.id,
    ...(item.children?.length ? collectMenuKeys(item.children) : []),
  ]);
}
