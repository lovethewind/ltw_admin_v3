import type { VNodeChild } from 'vue';

import { h } from 'vue';

import { NImage } from 'naive-ui';

/**
 * 渲染列表图片，并支持使用独立的原图地址进行预览。
 *
 * :param src: 列表加载的图片地址。
 * :param alt: 图片替代文本。
 * :param previewSrc: 点击预览时加载的原图地址。
 * :return: 图片虚拟节点或空值占位符。
 */
export function renderImageCell(
  src?: null | string,
  alt = '图片',
  previewSrc?: null | string,
): VNodeChild {
  const imageUrl = src?.trim();

  if (!imageUrl) {
    return '-';
  }

  const previewImageUrl = previewSrc?.trim() || imageUrl;

  return h(NImage, {
    alt,
    class: 'admin-image-cell',
    height: 44,
    objectFit: 'cover',
    previewSrc: previewImageUrl,
    src: imageUrl,
    width: 72,
  });
}
