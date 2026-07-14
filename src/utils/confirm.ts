import { h, ref } from 'vue';

import { NInput } from 'naive-ui';

import { dialog } from '#/adapter/naive';

export interface DeleteConfirmOptions {
  positiveText?: string;
  title?: string;
}

export interface PromptDialogOptions {
  content?: string;
  onConfirm: (value: string) => Promise<void> | void;
  placeholder?: string;
  positiveText?: string;
  title: string;
}

/**
 * 显示统一的删除确认弹窗。
 *
 * :param content: 删除确认提示内容。
 * :param onConfirm: 确认删除后的回调。
 * :return: 无返回值。
 */
export function showDeleteConfirm(
  content: string,
  onConfirm: () => Promise<void> | void,
  options: DeleteConfirmOptions = {},
): void {
  dialog.warning({
    content,
    negativeText: '取消',
    onPositiveClick: onConfirm,
    positiveButtonProps: { type: 'error' },
    positiveText: options.positiveText ?? '删除',
    title: options.title ?? '确认删除',
  });
}

/**
 * 显示统一的文本输入确认弹窗。
 *
 * :param options: 输入弹窗配置。
 * :return: 无返回值。
 */
export function showPromptDialog(options: PromptDialogOptions): void {
  const value = ref('');
  dialog.info({
    content: () =>
      h('div', { class: 'space-y-3' }, [
        options.content ? h('div', options.content) : null,
        h(NInput, {
          autofocus: true,
          clearable: true,
          onUpdateValue: (nextValue: string) => {
            value.value = nextValue;
          },
          placeholder: options.placeholder,
          value: value.value,
        }),
      ]),
    negativeText: '取消',
    onPositiveClick: () => options.onConfirm(value.value),
    positiveText: options.positiveText ?? '确认',
    title: options.title,
  });
}
