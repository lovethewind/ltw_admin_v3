import type { TreeOption } from 'naive-ui';

import type { AdminMenu } from '#/api';

export function toRoleMenuTreeOptions(menus: AdminMenu[]): TreeOption[] {
  return menus.map((item) => ({
    children: item.children?.length
      ? toRoleMenuTreeOptions(item.children)
      : undefined,
    key: item.id,
    label: item.name,
  }));
}

export function collectTreeKeys(tree: TreeOption[]): string[] {
  return tree.flatMap((item) => {
    const key = item.key as string;
    const children = item.children?.length
      ? collectTreeKeys(item.children)
      : [];
    return [key, ...children];
  });
}

export function normalizeCheckedTreeKeys(
  checkedKeys: string[],
  tree: TreeOption[],
): string[] {
  const normalizedKeys = new Set(checkedKeys);

  function visit(nodes: TreeOption[], ancestors: string[]) {
    for (const node of nodes) {
      const key = node.key as string;
      if (normalizedKeys.has(key)) {
        for (const ancestor of [...ancestors].toReversed()) {
          normalizedKeys.add(ancestor);
        }
      }
      if (node.children?.length) {
        visit(node.children, [...ancestors, key]);
      }
    }
  }

  visit(tree, []);
  return [...normalizedKeys];
}
