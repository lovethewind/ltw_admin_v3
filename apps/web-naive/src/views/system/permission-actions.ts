export interface PermissionAction<T extends string = string> {
  code: string;
  key: T;
}

export function hasActionPermission(
  accessCodes: readonly string[],
  code: string,
) {
  return accessCodes.includes(code);
}

export function getPermittedActions<T extends string>(
  accessCodes: readonly string[],
  actions: ReadonlyArray<PermissionAction<T>>,
) {
  return actions.filter((action) =>
    hasActionPermission(accessCodes, action.code),
  );
}
