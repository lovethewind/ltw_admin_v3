import type { AdminTag } from '#/api';

import { describe, expect, it } from 'vitest';

import * as tagTree from './tag-tree';
import { collectTagKeys, findTagByKey, toTagTreeOptions } from './tag-tree';

const tags: AdminTag[] = [
  {
    children: [
      {
        children: [],
        description: 'Vue 相关',
        id: '2',
        index: 1,
        isActive: true,
        level: 2,
        name: 'Vue',
        parentId: '1',
      },
    ],
    description: '技术分类',
    id: '1',
    index: 0,
    isActive: true,
    level: 1,
    name: '技术',
    parentId: '0',
  },
];

describe('tag tree', () => {
  it('把后端标签树转换为 Naive Tree 节点', () => {
    const options = toTagTreeOptions(tags);

    expect(options[0]).toEqual(
      expect.objectContaining({
        key: '1',
        label: '技术',
        tag: tags[0],
      }),
    );
    expect(options[0]?.children?.[0]).toEqual(
      expect.objectContaining({
        key: '2',
        label: 'Vue',
        tag: tags[0]?.children?.[0],
      }),
    );
  });

  it('可以通过 key 查找标签并收集全部节点 key', () => {
    expect(findTagByKey(tags, '2')?.name).toBe('Vue');
    expect(findTagByKey(tags, '999')).toBeNull();
    expect(collectTagKeys(tags)).toEqual(['1', '2']);
  });

  it('平铺标签树以生成父级选项', () => {
    expect(tagTree.flattenTagTree(tags).map((item) => item.name)).toEqual([
      '技术',
      'Vue',
    ]);
  });
});
