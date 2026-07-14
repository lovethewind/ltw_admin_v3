/**
 * 将字节数转换为可读的文件大小。
 *
 * :param size: 文件字节数。
 * :return: 带单位的文件大小。
 */
export function transformSize(size: number): string {
  if (size < 1024) {
    return `${size.toFixed(2)}B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)}KB`;
  }
  if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)}MB`;
  }
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)}GB`;
}
