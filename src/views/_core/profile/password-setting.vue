<script setup lang="ts">
import type { Recordable } from '@vben/types';

import type { VbenFormSchema } from '#/adapter/form';

import { computed, ref } from 'vue';

import { ProfilePasswordSetting, z } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { message } from '#/adapter/naive';
import { updateAdminUserApi } from '#/api';

const userStore = useUserStore();
const passwordSettingRef = ref<InstanceType<typeof ProfilePasswordSetting>>();

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      fieldName: 'newPassword',
      label: '新密码',
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: '请输入新密码',
      },
      rules: z
        .string({ required_error: '请输入新密码' })
        .min(1, { message: '请输入新密码' })
        .max(128, { message: '密码不能超过 128 个字符' }),
    },
    {
      fieldName: 'confirmPassword',
      label: '确认密码',
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: '请再次输入新密码',
      },
      dependencies: {
        rules(values) {
          const { newPassword } = values;
          return z
            .string({ required_error: '请再次输入新密码' })
            .min(1, { message: '请再次输入新密码' })
            .refine((value) => value === newPassword, {
              message: '两次输入的密码不一致',
            });
        },
        triggerFields: ['newPassword'],
      },
    },
  ];
});

/**
 * 提交当前管理员的新密码。
 *
 * @param values 密码表单数据
 */
async function handleSubmit(values: Recordable<any>): Promise<void> {
  const userId = userStore.userInfo?.id;
  if (!userId) {
    message.error('无法获取当前用户 ID');
    return;
  }
  await updateAdminUserApi(userId, {
    password: values.newPassword,
  });
  await passwordSettingRef.value?.getFormApi().resetForm();
  message.success('密码修改成功');
}
</script>
<template>
  <ProfilePasswordSetting
    ref="passwordSettingRef"
    class="w-full max-w-xl"
    :form-schema="formSchema"
    @submit="handleSubmit"
  />
</template>
