import { requestClient } from '#/api/request';

export type SnowflakeId = string;

export interface AdminMenu {
  alwaysShow: boolean;
  children?: AdminMenu[];
  code?: null | string;
  component?: null | string;
  hidden: boolean;
  icon?: null | string;
  id: SnowflakeId;
  index: number;
  isActive: boolean;
  isOutLink: boolean;
  menuType: number;
  name: string;
  parentId: SnowflakeId;
  path?: null | string;
  routeName?: null | string;
}

export interface AdminRole {
  code: string;
  description?: null | string;
  id: SnowflakeId;
  isActive: boolean;
  name: string;
}

export interface AdminUser {
  address?: null | string;
  avatar?: null | string;
  email?: null | string;
  gender: number;
  id: SnowflakeId;
  isOfficial: boolean;
  lastLoginIp?: null | string;
  lastLoginTime?: null | string;
  mobile?: null | string;
  nickname: string;
  registerTime: string;
  roleIds: SnowflakeId[];
  summary?: null | string;
  uid: SnowflakeId;
  username: string;
  wechat?: null | string;
}

export interface AdminUserPage {
  current: number;
  pages: number;
  records: AdminUser[];
  size: number;
  total: number;
}

export interface AdminUploadSignature {
  contentDisposition: string;
  contentType: string;
  uploadUrl: string;
  url: string;
}

export interface AdminCategory {
  description?: null | string;
  id: SnowflakeId;
  index: number;
  isActive: boolean;
  name: string;
}

export interface AdminTag {
  children?: AdminTag[];
  description?: null | string;
  id: SnowflakeId;
  index: number;
  isActive: boolean;
  level: number;
  name: string;
  parentId: SnowflakeId;
}

export interface AdminArticle {
  author?: AdminArticleAuthor | null;
  attachList: Array<Record<string, unknown>>;
  categoryId: SnowflakeId;
  content: string;
  cover: string;
  coverThumb: string;
  createTime: string;
  editTime?: null | string;
  id: SnowflakeId;
  isDeleted: boolean;
  isMarkdown: boolean;
  isOriginal: boolean;
  originalUrl: string;
  status: number;
  tagList: SnowflakeId[];
  title: string;
  updateTime: string;
  userId: SnowflakeId;
}

export interface AdminArticleAuthor {
  address?: null | string;
  avatar?: null | string;
  email?: null | string;
  gender: number;
  id: SnowflakeId;
  lastLoginTime?: null | string;
  mobile?: null | string;
  nickname: string;
  registerTime: string;
  summary?: null | string;
  uid: SnowflakeId;
  username: string;
}

export interface AdminArticlePage {
  current: number;
  pages: number;
  records: AdminArticle[];
  size: number;
  total: number;
}

export interface AdminComment {
  content: string;
  createTime: string;
  firstLevelId: SnowflakeId;
  id: SnowflakeId;
  objId: SnowflakeId;
  objType: number;
  parentId: SnowflakeId;
  replyUserId: SnowflakeId;
  status: number;
  updateTime: string;
  userId: SnowflakeId;
}

export interface AdminCommentPage {
  current: number;
  pages: number;
  records: AdminComment[];
  size: number;
  total: number;
}

export interface AdminMessage {
  address: string;
  avatar?: null | string;
  content: string;
  createTime: string;
  email?: null | string;
  firstLevelId: SnowflakeId;
  id: SnowflakeId;
  nickname?: null | string;
  parentId: SnowflakeId;
  replyUserId: SnowflakeId;
  updateTime: string;
  userId: SnowflakeId;
}

export interface AdminMessagePage {
  current: number;
  pages: number;
  records: AdminMessage[];
  size: number;
  total: number;
}

export interface AdminPictureAlbum {
  albumType: number;
  cover: string;
  createTime: string;
  description?: null | string;
  id: SnowflakeId;
  name: string;
  status: number;
  updateTime: string;
  userId: SnowflakeId;
}

export interface AdminPictureAlbumPage {
  current: number;
  pages: number;
  records: AdminPictureAlbum[];
  size: number;
  total: number;
}

export interface AdminPicture {
  albumId: SnowflakeId;
  createTime: string;
  description?: null | string;
  height: number;
  id: SnowflakeId;
  size: number;
  status: number;
  thumbUrl: string;
  updateTime: string;
  url: string;
  userId: SnowflakeId;
  width: number;
}

export interface AdminPicturePage {
  current: number;
  pages: number;
  records: AdminPicture[];
  size: number;
  total: number;
}

export interface AdminLink {
  cover: string;
  createTime: string;
  description?: null | string;
  email?: null | string;
  id: SnowflakeId;
  index: number;
  introduce: string;
  name: string;
  status: number;
  updateTime: string;
  url: string;
}

export interface AdminLinkPage {
  current: number;
  pages: number;
  records: AdminLink[];
  size: number;
  total: number;
}

export interface AdminWebsiteCategory {
  createTime: string;
  id: SnowflakeId;
  index: number;
  name: string;
  updateTime: string;
}

export interface AdminWebsite {
  categoryId: SnowflakeId;
  cover: string;
  createTime: string;
  id: SnowflakeId;
  index: number;
  introduce: string;
  name: string;
  status: number;
  updateTime: string;
  url: string;
  userId: SnowflakeId;
}

export interface AdminWebsitePage {
  current: number;
  pages: number;
  records: AdminWebsite[];
  size: number;
  total: number;
}

export interface AdminConfig {
  createTime: string;
  description?: null | string;
  id: SnowflakeId;
  isActive: boolean;
  name: string;
  updateTime: string;
  value: string;
}

export interface AdminConfigPage {
  current: number;
  pages: number;
  records: AdminConfig[];
  size: number;
  total: number;
}

export type AdminMenuPayload = Omit<AdminMenu, 'children' | 'id'>;

export type AdminRolePayload = Omit<AdminRole, 'id'>;

export type AdminUserPayload = Partial<
  Omit<
    AdminUser,
    'id' | 'lastLoginIp' | 'lastLoginTime' | 'registerTime' | 'uid'
  >
> & {
  password?: string;
};

export interface AdminUploadSignaturePayload {
  dirType: string;
  fileName: string;
}

export type AdminCategoryPayload = Omit<AdminCategory, 'id'>;

export type AdminTagPayload = Omit<AdminTag, 'children' | 'id'>;

export type AdminArticlePayload = Partial<
  Omit<
    AdminArticle,
    'createTime' | 'editTime' | 'id' | 'isDeleted' | 'updateTime'
  >
>;

export type AdminCommentPayload = Partial<
  Pick<AdminComment, 'content' | 'status'>
>;

export type AdminMessagePayload = Partial<
  Pick<AdminMessage, 'address' | 'avatar' | 'content' | 'email' | 'nickname'>
>;

export type AdminPictureAlbumPayload = Partial<
  Omit<AdminPictureAlbum, 'createTime' | 'id' | 'updateTime'>
>;

export type AdminPicturePayload = Partial<
  Omit<AdminPicture, 'createTime' | 'id' | 'updateTime'>
>;

export type AdminLinkPayload = Partial<
  Omit<AdminLink, 'createTime' | 'id' | 'updateTime'>
>;

export type AdminWebsiteCategoryPayload = Omit<
  AdminWebsiteCategory,
  'createTime' | 'id' | 'updateTime'
>;

export type AdminWebsitePayload = Partial<
  Omit<AdminWebsite, 'createTime' | 'id' | 'updateTime'>
>;

export type AdminConfigPayload = Omit<
  AdminConfig,
  'createTime' | 'id' | 'updateTime'
>;

export async function getAdminMenuTreeApi(activeOnly = false) {
  return requestClient.get<AdminMenu[]>('/menu/tree', {
    params: { activeOnly },
  });
}

export async function createAdminMenuApi(data: AdminMenuPayload) {
  return requestClient.post<AdminMenu>('/menu/', data);
}

export async function updateAdminMenuApi(
  menuId: number | string,
  data: Partial<AdminMenuPayload>,
) {
  return requestClient.put<AdminMenu>(`/menu/${menuId}`, data);
}

export async function deleteAdminMenuApi(menuId: number | string) {
  return requestClient.delete(`/menu/${menuId}`);
}

export async function getAdminRoleListApi() {
  return requestClient.get<AdminRole[]>('/menu/role/list');
}

export async function createAdminRoleApi(data: AdminRolePayload) {
  return requestClient.post<AdminRole>('/menu/role', data);
}

export async function updateAdminRoleApi(
  roleId: number | string,
  data: Partial<AdminRolePayload>,
) {
  return requestClient.put<AdminRole>(`/menu/role/${roleId}`, data);
}

export async function deleteAdminRoleApi(roleId: number | string) {
  return requestClient.delete(`/menu/role/${roleId}`);
}

export async function getAdminRoleMenuIdsApi(roleId: number | string) {
  return requestClient.get<SnowflakeId[]>(`/menu/role/${roleId}/menus`);
}

export function toAdminRoleMenuPayload(menuIds: SnowflakeId[]) {
  return {
    menuIds: [...new Set(menuIds)],
  };
}

export async function updateAdminRoleMenusApi(
  roleId: number | string,
  menuIds: SnowflakeId[],
) {
  return requestClient.put(
    `/menu/role/${roleId}/menus`,
    toAdminRoleMenuPayload(menuIds),
  );
}

export async function getAdminUserPageApi(params: {
  current: number;
  keyword?: string;
  size: number;
}) {
  return requestClient.get<AdminUserPage>('/user/list', { params });
}

export async function getAdminUserApi(userId: number | string) {
  return requestClient.get<AdminUser>(`/user/${userId}`);
}

export async function createAdminUserApi(data: AdminUserPayload) {
  return requestClient.post<AdminUser>('/user/', data);
}

export async function updateAdminUserApi(
  userId: number | string,
  data: AdminUserPayload,
) {
  return requestClient.put<AdminUser>(`/user/${userId}`, data);
}

export async function deleteAdminUserApi(userId: number | string) {
  return requestClient.delete(`/user/${userId}`);
}

export async function getAdminUserRoleIdsApi(userId: number | string) {
  return requestClient.get<SnowflakeId[]>(`/user/${userId}/roles`);
}

export async function updateAdminUserRolesApi(
  userId: number | string,
  roleIds: SnowflakeId[],
) {
  return requestClient.put(
    `/user/${userId}/roles`,
    toAdminUserRolePayload(roleIds),
  );
}

export function toAdminUserRolePayload(roleIds: SnowflakeId[]) {
  return {
    roleIds: [...new Set(roleIds)],
  };
}

export async function getAdminUploadSignatureApi(
  data: AdminUploadSignaturePayload,
) {
  return requestClient.post<AdminUploadSignature>(
    '/common/upload/signature',
    data,
  );
}

export async function getAdminCategoryListApi() {
  return requestClient.get<AdminCategory[]>('/content/category/list');
}

export async function createAdminCategoryApi(data: AdminCategoryPayload) {
  return requestClient.post<AdminCategory>('/content/category', data);
}

export async function updateAdminCategoryApi(
  categoryId: number | string,
  data: Partial<AdminCategoryPayload>,
) {
  return requestClient.put<AdminCategory>(
    `/content/category/${categoryId}`,
    data,
  );
}

export async function deleteAdminCategoryApi(categoryId: number | string) {
  return requestClient.delete(`/content/category/${categoryId}`);
}

export async function getAdminTagTreeApi(activeOnly = false) {
  return requestClient.get<AdminTag[]>('/content/tag/tree', {
    params: { activeOnly },
  });
}

export async function createAdminTagApi(data: AdminTagPayload) {
  return requestClient.post<AdminTag>('/content/tag', data);
}

export async function updateAdminTagApi(
  tagId: number | string,
  data: Partial<AdminTagPayload>,
) {
  return requestClient.put<AdminTag>(`/content/tag/${tagId}`, data);
}

export async function deleteAdminTagApi(tagId: number | string) {
  return requestClient.delete(`/content/tag/${tagId}`);
}

export async function getAdminArticlePageApi(params: {
  categoryId?: null | number | string;
  current: number;
  isOriginal?: boolean | null;
  keyword?: string;
  size: number;
  status?: null | number;
  userId?: null | number | string;
}) {
  return requestClient.get<AdminArticlePage>('/content/article/list', {
    params,
  });
}

export async function getAdminArticleApi(articleId: number | string) {
  return requestClient.get<AdminArticle>(`/content/article/${articleId}`);
}

export async function createAdminArticleApi(data: AdminArticlePayload) {
  return requestClient.post<AdminArticle>('/content/article', data);
}

export async function updateAdminArticleApi(
  articleId: number | string,
  data: AdminArticlePayload,
) {
  return requestClient.put<AdminArticle>(
    `/content/article/${articleId}`,
    data,
  );
}

export async function updateAdminArticleStatusApi(
  articleId: number | string,
  status: number,
) {
  return requestClient.put<AdminArticle>(
    `/content/article/${articleId}/status`,
    { status },
  );
}

export async function deleteAdminArticleApi(articleId: number | string) {
  return requestClient.delete(`/content/article/${articleId}`);
}

export async function getAdminCommentPageApi(params: {
  current: number;
  keyword?: string;
  objId?: null | number | string;
  objType?: null | number;
  size: number;
  status?: null | number;
  userId?: null | number | string;
}) {
  return requestClient.get<AdminCommentPage>('/content/comment/list', {
    params,
  });
}

export async function getAdminCommentApi(commentId: number | string) {
  return requestClient.get<AdminComment>(`/content/comment/${commentId}`);
}

export async function updateAdminCommentApi(
  commentId: number | string,
  data: AdminCommentPayload,
) {
  return requestClient.put<AdminComment>(
    `/content/comment/${commentId}`,
    data,
  );
}

export async function updateAdminCommentStatusApi(
  commentId: number | string,
  status: number,
) {
  return requestClient.put<AdminComment>(
    `/content/comment/${commentId}/status`,
    { status },
  );
}

export async function deleteAdminCommentApi(commentId: number | string) {
  return requestClient.delete(`/content/comment/${commentId}`);
}

export async function getAdminMessagePageApi(params: {
  current: number;
  keyword?: string;
  parentId?: null | number | string;
  size: number;
  userId?: null | number | string;
}) {
  return requestClient.get<AdminMessagePage>('/content/message/list', {
    params,
  });
}

export async function getAdminMessageApi(messageId: number | string) {
  return requestClient.get<AdminMessage>(`/content/message/${messageId}`);
}

export async function updateAdminMessageApi(
  messageId: number | string,
  data: AdminMessagePayload,
) {
  return requestClient.put<AdminMessage>(
    `/content/message/${messageId}`,
    data,
  );
}

export async function deleteAdminMessageApi(messageId: number | string) {
  return requestClient.delete(`/content/message/${messageId}`);
}

export async function getAdminPictureAlbumPageApi(params: {
  albumType?: null | number;
  current: number;
  keyword?: string;
  size: number;
  status?: null | number;
  userId?: null | SnowflakeId;
}) {
  return requestClient.get<AdminPictureAlbumPage>(
    '/content/picture/album/list',
    { params },
  );
}

export async function getAdminPictureAlbumApi(albumId: SnowflakeId) {
  return requestClient.get<AdminPictureAlbum>(
    `/content/picture/album/${albumId}`,
  );
}

export async function createAdminPictureAlbumApi(
  data: AdminPictureAlbumPayload,
) {
  return requestClient.post<AdminPictureAlbum>(
    '/content/picture/album',
    data,
  );
}

export async function updateAdminPictureAlbumApi(
  albumId: SnowflakeId,
  data: AdminPictureAlbumPayload,
) {
  return requestClient.put<AdminPictureAlbum>(
    `/content/picture/album/${albumId}`,
    data,
  );
}

export async function updateAdminPictureAlbumStatusApi(
  albumId: SnowflakeId,
  status: number,
) {
  return requestClient.put<AdminPictureAlbum>(
    `/content/picture/album/${albumId}/status`,
    { status },
  );
}

export async function deleteAdminPictureAlbumApi(albumId: SnowflakeId) {
  return requestClient.delete(`/content/picture/album/${albumId}`);
}

export async function getAdminPicturePageApi(params: {
  albumId?: null | SnowflakeId;
  current: number;
  keyword?: string;
  size: number;
  status?: null | number;
  userId?: null | SnowflakeId;
}) {
  return requestClient.get<AdminPicturePage>('/content/picture/list', {
    params,
  });
}

export async function getAdminPictureApi(pictureId: SnowflakeId) {
  return requestClient.get<AdminPicture>(`/content/picture/${pictureId}`);
}

export async function createAdminPictureApi(data: AdminPicturePayload) {
  return requestClient.post<AdminPicture>('/content/picture', data);
}

export async function updateAdminPictureApi(
  pictureId: SnowflakeId,
  data: AdminPicturePayload,
) {
  return requestClient.put<AdminPicture>(
    `/content/picture/${pictureId}`,
    data,
  );
}

export async function updateAdminPictureStatusApi(
  pictureId: SnowflakeId,
  status: number,
) {
  return requestClient.put<AdminPicture>(
    `/content/picture/${pictureId}/status`,
    { status },
  );
}

export async function deleteAdminPictureApi(pictureId: SnowflakeId) {
  return requestClient.delete(`/content/picture/${pictureId}`);
}

export async function getAdminLinkPageApi(params: {
  current: number;
  keyword?: string;
  size: number;
  status?: null | number;
}) {
  return requestClient.get<AdminLinkPage>('/content/link/list', {
    params,
  });
}

export async function getAdminLinkApi(linkId: SnowflakeId) {
  return requestClient.get<AdminLink>(`/content/link/${linkId}`);
}

export async function createAdminLinkApi(data: AdminLinkPayload) {
  return requestClient.post<AdminLink>('/content/link', data);
}

export async function updateAdminLinkApi(
  linkId: SnowflakeId,
  data: AdminLinkPayload,
) {
  return requestClient.put<AdminLink>(`/content/link/${linkId}`, data);
}

export async function updateAdminLinkStatusApi(
  linkId: SnowflakeId,
  status: number,
) {
  return requestClient.put<AdminLink>(`/content/link/${linkId}/status`, {
    status,
  });
}

export async function deleteAdminLinkApi(linkId: SnowflakeId) {
  return requestClient.delete(`/content/link/${linkId}`);
}

export async function getAdminWebsiteCategoryListApi() {
  return requestClient.get<AdminWebsiteCategory[]>(
    '/content/website/category/list',
  );
}

export async function createAdminWebsiteCategoryApi(
  data: AdminWebsiteCategoryPayload,
) {
  return requestClient.post<AdminWebsiteCategory>(
    '/content/website/category',
    data,
  );
}

export async function updateAdminWebsiteCategoryApi(
  categoryId: SnowflakeId,
  data: Partial<AdminWebsiteCategoryPayload>,
) {
  return requestClient.put<AdminWebsiteCategory>(
    `/content/website/category/${categoryId}`,
    data,
  );
}

export async function deleteAdminWebsiteCategoryApi(categoryId: SnowflakeId) {
  return requestClient.delete(`/content/website/category/${categoryId}`);
}

export async function getAdminWebsitePageApi(params: {
  categoryId?: null | SnowflakeId;
  current: number;
  keyword?: string;
  size: number;
  status?: null | number;
  userId?: null | SnowflakeId;
}) {
  return requestClient.get<AdminWebsitePage>('/content/website/list', {
    params,
  });
}

export async function getAdminWebsiteApi(websiteId: SnowflakeId) {
  return requestClient.get<AdminWebsite>(`/content/website/${websiteId}`);
}

export async function createAdminWebsiteApi(data: AdminWebsitePayload) {
  return requestClient.post<AdminWebsite>('/content/website', data);
}

export async function updateAdminWebsiteApi(
  websiteId: SnowflakeId,
  data: AdminWebsitePayload,
) {
  return requestClient.put<AdminWebsite>(
    `/content/website/${websiteId}`,
    data,
  );
}

export async function updateAdminWebsiteStatusApi(
  websiteId: SnowflakeId,
  status: number,
) {
  return requestClient.put<AdminWebsite>(
    `/content/website/${websiteId}/status`,
    { status },
  );
}

export async function deleteAdminWebsiteApi(websiteId: SnowflakeId) {
  return requestClient.delete(`/content/website/${websiteId}`);
}

export async function getAdminConfigPageApi(params: {
  current: number;
  isActive?: boolean | null;
  keyword?: string;
  size: number;
}) {
  return requestClient.get<AdminConfigPage>('/content/config/list', {
    params,
  });
}

export async function getAdminConfigApi(configId: SnowflakeId) {
  return requestClient.get<AdminConfig>(`/content/config/${configId}`);
}

export async function createAdminConfigApi(data: AdminConfigPayload) {
  return requestClient.post<AdminConfig>('/content/config', data);
}

export async function updateAdminConfigApi(
  configId: SnowflakeId,
  data: Partial<AdminConfigPayload>,
) {
  return requestClient.put<AdminConfig>(
    `/content/config/${configId}`,
    data,
  );
}

export async function deleteAdminConfigApi(configId: SnowflakeId) {
  return requestClient.delete(`/content/config/${configId}`);
}

export interface AdminJob {
  concurrent: boolean;
  createTime: string;
  createUserId: SnowflakeId;
  cronExpression: string;
  description?: null | string;
  group: string;
  id: SnowflakeId;
  invokeTarget: string;
  misfirePolicy: number;
  name: string;
  status: number;
  updateTime: string;
  updateUserId?: null | SnowflakeId;
}

export interface AdminJobPage {
  current: number;
  pages: number;
  records: AdminJob[];
  size: number;
  total: number;
}
export interface AdminSource {
  createTime: string;
  id: SnowflakeId;
  isDeleted: boolean;
  updateTime: string;
  url: string;
  userId: SnowflakeId;
}
export interface AdminSourcePage {
  current: number;
  pages: number;
  records: AdminSource[];
  size: number;
  total: number;
}
export interface AdminNotice {
  content: string;
  createTime: string;
  detail: Record<string, unknown>;
  id: SnowflakeId;
  isRead: boolean;
  noticeType: number;
  title: string;
  updateTime: string;
  userId: SnowflakeId;
}
export interface AdminNoticePage {
  current: number;
  pages: number;
  records: AdminNotice[];
  size: number;
  total: number;
}
export interface AdminUserRestriction {
  cancelReason?: null | string;
  cancelTime?: null | string;
  createTime: string;
  endTime?: null | string;
  id: SnowflakeId;
  isCancel: boolean;
  isForever: boolean;
  reason?: null | string;
  restrictType: number;
  startTime?: null | string;
  updateTime: string;
  userId: SnowflakeId;
}
export interface AdminUserRestrictionPage {
  current: number;
  pages: number;
  records: AdminUserRestriction[];
  size: number;
  total: number;
}
export type AdminJobPayload = Partial<
  Omit<AdminJob, 'createTime' | 'id' | 'updateTime'>
>;
export type AdminSourcePayload = Partial<Pick<AdminSource, 'isDeleted'>>;
export type AdminNoticePayload = Partial<
  Pick<AdminNotice, 'content' | 'isRead' | 'title'>
>;
export type AdminUserRestrictionPayload = Partial<
  Omit<AdminUserRestriction, 'createTime' | 'id' | 'updateTime'>
>;

export async function getAdminJobPageApi(params: {
  current: number;
  group?: string;
  keyword?: string;
  size: number;
  status?: null | number;
}) {
  return requestClient.get<AdminJobPage>('/operation/job/list', {
    params,
  });
}
export async function getAdminJobApi(jobId: SnowflakeId) {
  return requestClient.get<AdminJob>(`/operation/job/${jobId}`);
}
export async function createAdminJobApi(data: AdminJobPayload) {
  return requestClient.post<AdminJob>('/operation/job', data);
}
export async function updateAdminJobApi(
  jobId: SnowflakeId,
  data: AdminJobPayload,
) {
  return requestClient.put<AdminJob>(`/operation/job/${jobId}`, data);
}
export async function updateAdminJobStatusApi(
  jobId: SnowflakeId,
  status: number,
) {
  return requestClient.put<AdminJob>(`/operation/job/${jobId}/status`, {
    status,
  });
}
export async function deleteAdminJobApi(jobId: SnowflakeId) {
  return requestClient.delete(`/operation/job/${jobId}`);
}
export async function getAdminSourcePageApi(params: {
  current: number;
  isDeleted?: boolean | null;
  keyword?: string;
  size: number;
  userId?: null | SnowflakeId;
}) {
  return requestClient.get<AdminSourcePage>('/operation/source/list', {
    params,
  });
}
export async function updateAdminSourceApi(
  sourceId: SnowflakeId,
  data: AdminSourcePayload,
) {
  return requestClient.put<AdminSource>(
    `/operation/source/${sourceId}`,
    data,
  );
}
export async function deleteAdminSourceApi(sourceId: SnowflakeId) {
  return requestClient.delete(`/operation/source/${sourceId}`);
}
export async function getAdminNoticePageApi(params: {
  current: number;
  isRead?: boolean | null;
  keyword?: string;
  noticeType?: null | number;
  size: number;
  userId?: null | SnowflakeId;
}) {
  return requestClient.get<AdminNoticePage>('/operation/notice/list', {
    params,
  });
}
export async function getAdminNoticeApi(noticeId: SnowflakeId) {
  return requestClient.get<AdminNotice>(`/operation/notice/${noticeId}`);
}
export async function updateAdminNoticeApi(
  noticeId: SnowflakeId,
  data: AdminNoticePayload,
) {
  return requestClient.put<AdminNotice>(
    `/operation/notice/${noticeId}`,
    data,
  );
}
export async function deleteAdminNoticeApi(noticeId: SnowflakeId) {
  return requestClient.delete(`/operation/notice/${noticeId}`);
}
export async function getAdminUserRestrictionPageApi(params: {
  current: number;
  isCancel?: boolean | null;
  restrictType?: null | number;
  size: number;
  userId?: null | SnowflakeId;
}) {
  return requestClient.get<AdminUserRestrictionPage>(
    '/operation/restriction/list',
    { params },
  );
}
export async function createAdminUserRestrictionApi(
  data: AdminUserRestrictionPayload,
) {
  return requestClient.post<AdminUserRestriction>(
    '/operation/restriction',
    data,
  );
}
export async function updateAdminUserRestrictionApi(
  restrictionId: SnowflakeId,
  data: AdminUserRestrictionPayload,
) {
  return requestClient.put<AdminUserRestriction>(
    `/operation/restriction/${restrictionId}`,
    data,
  );
}
export async function cancelAdminUserRestrictionApi(
  restrictionId: SnowflakeId,
  cancelReason?: string,
) {
  return requestClient.put<AdminUserRestriction>(
    `/operation/restriction/${restrictionId}/cancel`,
    { cancelReason },
  );
}
export async function deleteAdminUserRestrictionApi(
  restrictionId: SnowflakeId,
) {
  return requestClient.delete(`/operation/restriction/${restrictionId}`);
}
