import type { AdminUser } from '#/api';

/**
 * 获取用户 UID 标签文本。
 *
 * :param user: 管理后台用户
 * :return: 带 UID 前缀的标签文本
 */
export function getUserUidLabel(user: Pick<AdminUser, 'id' | 'uid'>): string {
  return `UID ${user.uid || user.id}`;
}

/**
 * 获取用户选择器的搜索文本。
 *
 * :param user: 管理后台用户
 * :return: 昵称（或用户名）与 UID 组合后的文本
 */
export function getUserSelectLabel(user: AdminUser): string {
  const name = user.nickname || user.username || '未命名用户';
  return `${name}（${getUserUidLabel(user)}）`;
}
