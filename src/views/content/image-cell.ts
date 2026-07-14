import type { VNodeChild } from 'vue';

import { h } from 'vue';

import { NImage } from 'naive-ui';

/**
 * 生成带首字符的图片占位地址。
 *
 * :param text: 占位文本。
 * :return: SVG Data URL。
 */
function createInitialFallbackSrc(text: string): string {
  const initial = Array.from(text.trim())[0] || '?';
  const codePoint = initial.codePointAt(0) ?? 63;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 44"><rect width="72" height="44" rx="6" fill="#f1f5f9"/><text x="36" y="22" fill="#64748b" font-family="sans-serif" font-size="22" font-weight="600" text-anchor="middle" dominant-baseline="central">&#${codePoint};</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

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

/**
 * 渲染带首字符加载失败占位的列表图片。
 *
 * :param src: 列表加载的图片地址。
 * :param alt: 图片替代文本及占位字符来源。
 * :param previewSrc: 点击预览时加载的原图地址。
 * :return: 图片虚拟节点。
 */
export function renderImageCellWithInitialFallback(
  src?: null | string,
  alt = '图片',
  previewSrc?: null | string,
): VNodeChild {
  const imageUrl = src?.trim();
  const fallbackSrc = createInitialFallbackSrc(alt);
  const previewImageUrl = previewSrc?.trim() || imageUrl;

  return h(NImage, {
    alt,
    class: 'admin-image-cell',
    fallbackSrc,
    height: 44,
    objectFit: 'cover',
    previewDisabled: !imageUrl,
    previewSrc: previewImageUrl,
    src: imageUrl || fallbackSrc,
    width: 72,
  });
}
