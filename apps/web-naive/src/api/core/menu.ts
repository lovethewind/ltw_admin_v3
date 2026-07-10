import type { RouteRecordStringComponent } from '@vben/types';

import { requestClient } from '#/api/request';

import { normalizeBackendMenus } from './menu-adapter';

/**
 * 获取用户所有菜单
 */
export async function getAllMenusApi() {
  const menus =
    await requestClient.get<RouteRecordStringComponent[]>('/admin/user/menus');
  return normalizeBackendMenus(menus);
}
