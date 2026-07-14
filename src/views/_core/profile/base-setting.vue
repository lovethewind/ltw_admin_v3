<script setup lang="ts">
import { useUserStore } from '@vben/stores';

import { NDescriptions, NDescriptionsItem } from 'naive-ui';

const userStore = useUserStore();
</script>

<template>
  <NDescriptions :column="1" bordered label-placement="left">
    <NDescriptionsItem label="UID">
      {{ userStore.userInfo?.uid || '-' }}
    </NDescriptionsItem>
    <NDescriptionsItem label="用户名">
      {{ userStore.userInfo?.username || '-' }}
    </NDescriptionsItem>
    <NDescriptionsItem label="昵称">
      {{ userStore.userInfo?.nickname || '-' }}
    </NDescriptionsItem>
    <NDescriptionsItem label="邮箱">
      {{ userStore.userInfo?.email || '-' }}
    </NDescriptionsItem>
    <NDescriptionsItem label="手机号">
      {{ userStore.userInfo?.mobile || '-' }}
    </NDescriptionsItem>
    <NDescriptionsItem label="角色">
      {{ userStore.userInfo?.roles?.join('、') || '-' }}
    </NDescriptionsItem>
  </NDescriptions>
</template>
