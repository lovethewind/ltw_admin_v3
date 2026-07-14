<script setup lang="ts">
import type { UserDisplayIdentity } from './user-select';

import type { SnowflakeId } from '#/api';

import { NSpace, NTag } from 'naive-ui';

import { getUserUidLabel } from './user-select';

const props = withDefaults(
  defineProps<{
    fallback?: null | SnowflakeId;
    user?: null | UserDisplayIdentity;
  }>(),
  {
    fallback: null,
    user: null,
  },
);
</script>

<template>
  <NSpace v-if="props.user" align="center" :size="6" :wrap="false">
    <span>{{
      props.user.nickname || props.user.username || '未命名用户'
    }}</span>
    <NTag :bordered="false" size="small" type="info">
      {{ getUserUidLabel(props.user) }}
    </NTag>
  </NSpace>
  <span v-else>{{ props.fallback || '-' }}</span>
</template>
