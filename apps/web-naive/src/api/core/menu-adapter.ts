import type { RouteRecordStringComponent } from '@vben/types';

function normalizeRoutePath(path: string): string {
  if (!path) {
    return path;
  }
  return path.startsWith('/') ? path : `/${path}`;
}

function isLayoutComponent(component: string): boolean {
  return component === 'Layout' || component === 'BasicLayout';
}

function isPageComponent(component: string): boolean {
  return component.startsWith('/');
}

function normalizeBackendMenu(
  menu: RouteRecordStringComponent,
): null | RouteRecordStringComponent {
  const component = menu.component || '';
  const children = menu.children?.length
    ? normalizeBackendMenus(menu.children)
    : [];

  if (
    !isPageComponent(component) &&
    !isLayoutComponent(component) &&
    children.length === 0
  ) {
    return null;
  }
  if (isLayoutComponent(component) && children.length === 0) {
    return null;
  }

  return {
    ...menu,
    children: children.length > 0 ? children : undefined,
    component: children.length > 0 ? 'BasicLayout' : component,
    path: normalizeRoutePath(menu.path),
  };
}

export function normalizeBackendMenus(
  menus: RouteRecordStringComponent[],
): RouteRecordStringComponent[] {
  return menus
    .map((menu) => normalizeBackendMenu(menu))
    .filter(Boolean) as RouteRecordStringComponent[];
}
