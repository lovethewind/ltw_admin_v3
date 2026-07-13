<script setup lang="ts">
import type { SelectOption } from 'naive-ui';

import type { VNodeChild } from 'vue';

import type { AdminUser, SnowflakeId } from '#/api';

import { computed, h } from 'vue';

import { NSelect, NSpace, NTag } from 'naive-ui';

import { getUserSelectLabel, getUserUidLabel } from './user-select';

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    placeholder?: string;
    users: AdminUser[];
  }>(),
  {
    clearable: true,
    disabled: false,
    placeholder: '请选择用户',
  },
);

const model = defineModel<null | SnowflakeId>('value', { default: null });

const userMap = computed(() => {
  return new Map(props.users.map((user) => [user.id, user]));
});

const options = computed(() =>
  props.users.map((user) => ({
    label: getUserSelectLabel(user),
    value: user.id,
  })),
);

/**
 * 使用昵称与 UID 标签渲染用户选项。
 *
 * :param option: 用户下拉选项
 * :return: 用户选项 VNode
 */
function renderOptionLabel(option: SelectOption): VNodeChild {
  const user = userMap.value.get((option.value ?? '') as SnowflakeId);
  if (!user) {
    return option.label as VNodeChild;
  }
  return h(
    NSpace,
    { align: 'center', size: 6 },
    {
      default: () => [
        h('span', user.nickname || user.username || '未命名用户'),
        h(
          NTag,
          { bordered: false, size: 'small', type: 'info' },
          { default: () => getUserUidLabel(user) },
        ),
      ],
    },
  );
}
</script>

<template>
  <NSelect
    v-model:value="model"
    :clearable="props.clearable"
    :disabled="props.disabled"
    :filterable="true"
    :options="options"
    :placeholder="props.placeholder"
    :render-label="renderOptionLabel"
  />
</template>
