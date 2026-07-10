import type { TreeOption } from 'naive-ui';

import type { AdminTag, SnowflakeId } from '#/api';

export interface TagTreeOption extends TreeOption {
  children?: TagTreeOption[];
  key: SnowflakeId;
  tag: AdminTag;
}

export function toTagTreeOptions(tags: AdminTag[]): TagTreeOption[] {
  return tags.map((item) => ({
    children: item.children?.length
      ? toTagTreeOptions(item.children)
      : undefined,
    key: item.id,
    label: item.name || item.id,
    tag: item,
  }));
}

export function findTagByKey(
  tags: AdminTag[],
  key: SnowflakeId,
): AdminTag | null {
  for (const item of tags) {
    if (item.id === key) {
      return item;
    }

    const child = item.children?.length
      ? findTagByKey(item.children, key)
      : null;
    if (child) {
      return child;
    }
  }

  return null;
}

export function collectTagKeys(tags: AdminTag[]): SnowflakeId[] {
  return tags.flatMap((item) => [
    item.id,
    ...(item.children?.length ? collectTagKeys(item.children) : []),
  ]);
}

/**
 * 将嵌套标签树平铺为节点列表。
 *
 * :param tags: 标签树节点。
 * :return: 按树遍历顺序排列的所有标签。
 */
export function flattenTagTree(tags: AdminTag[]): AdminTag[] {
  return tags.flatMap((item) => [
    item,
    ...(item.children?.length ? flattenTagTree(item.children) : []),
  ]);
}
