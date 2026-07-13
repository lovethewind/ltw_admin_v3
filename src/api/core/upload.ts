import { requestClient } from '#/api/request';

export interface AdminUploadSignature {
  contentDisposition: string;
  contentType: string;
  uploadUrl: string;
  url: string;
}

export interface AdminUploadSignaturePayload {
  dirType: string;
  fileName: string;
}

export async function getAdminUploadSignatureApi(
  data: AdminUploadSignaturePayload,
) {
  return requestClient.post<AdminUploadSignature>(
    '/common/upload/signature',
    data,
  );
}
