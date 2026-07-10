import { describe, expect, it } from 'vitest';

import { renderImageCell } from './image-cell';

describe('image cell', () => {
  it('空图片地址显示占位符', () => {
    expect(renderImageCell()).toBe('-');
    expect(renderImageCell('')).toBe('-');
    expect(renderImageCell('   ')).toBe('-');
  });

  it('图片地址渲染为 Naive Image 组件', () => {
    const image = renderImageCell('https://example.com/cover.png', '封面');

    expect(image).toEqual(
      expect.objectContaining({
        props: expect.objectContaining({
          alt: '封面',
          class: 'admin-image-cell',
          height: 44,
          objectFit: 'cover',
          previewSrc: 'https://example.com/cover.png',
          src: 'https://example.com/cover.png',
          width: 72,
        }),
      }),
    );
  });

  it('列表加载缩略图并在预览时使用原图', () => {
    const image = renderImageCell(
      'https://example.com/cover-thumb.webp',
      '封面',
      'https://example.com/cover.png',
    );

    expect(image).toEqual(
      expect.objectContaining({
        props: expect.objectContaining({
          previewSrc: 'https://example.com/cover.png',
          src: 'https://example.com/cover-thumb.webp',
        }),
      }),
    );
  });
});
