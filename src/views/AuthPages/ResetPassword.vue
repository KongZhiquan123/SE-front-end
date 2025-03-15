<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Lock, Message } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useRouter } from 'vue-router'
import request from "@/utils/request.ts"
import type { AxiosError } from "axios"
import useVerificationCode from '@/utils/useVerificationCode.ts'

// 定义重置密码表单接口
interface ResetPasswordForm {
  email: string
  verificationCode: string
  newPassword: string
  confirmPassword: string
}

const router = useRouter()
const loading = ref(false)
const resetFormRef = ref<FormInstance>()

// 使用可重用的验证码逻辑
const { countdown, sendCode } = useVerificationCode()

const resetForm = reactive<ResetPasswordForm>({
  email: '',
  verificationCode: '',
  newPassword: '',
  confirmPassword: ''
})

const rules: FormRules = {
  email: [
    { required: true, message: 'Please enter email', trigger: 'blur' },
    { type: 'email', message: 'Please enter valid email', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: 'Please enter new password', trigger: 'blur' },
    { min: 6, message: 'Password must be at least 6 characters', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: 'Please confirm password', trigger: 'blur' },
    {
      validator: (_, value, callback) => {
        if (value !== resetForm.newPassword) {
          callback(new Error('Passwords do not match!'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  verificationCode: [
    { required: true, message: 'Please enter verification code', trigger: 'blur' },
    { len: 6, message: 'Verification code must be 6 digits', trigger: 'blur' }
  ]
}

const sendVerificationCode = async () => {
  if (!resetForm.email) {
    ElMessage.warning('Please enter email first')
    return
  }

  try {
    await sendCode(resetForm.email, '/auth/send-verification/')
    ElMessage.success('Verification code sent')
  } catch (error) {
    const axiosError = error as AxiosError
    ElMessage.error(axiosError.response?.data || 'Failed to send verification code')
  }
}

const handleResetPassword = async (formEl?: FormInstance) => {
  if (!formEl) return

  await formEl.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      await request.post('/auth/reset-password', {
        email: resetForm.email,
        verificationCode: resetForm.verificationCode,
        newPassword: resetForm.newPassword
      })

      ElMessage.success('Password reset successful')
      await router.push('/auth/login')
    } catch (error) {
      const axiosError = error as AxiosError
      ElMessage.error(axiosError.response?.data || 'Password reset failed')
    } finally {
      loading.value = false
    }
  })
}
</script>

<template>
  <div class="reset-container">
    <el-card class="reset-card">
      <template #header>
        <h2 class="reset-title">Reset Password</h2>
      </template>

      <el-form
          ref="resetFormRef"
          :model="resetForm"
          :rules="rules"
          label-position="top"
          @submit.prevent
      >
        <el-form-item label="Email" prop="email">
          <el-input
              v-model="resetForm.email"
              placeholder="Please enter your email"
              :prefix-icon="Message"
          />
        </el-form-item>

        <el-form-item label="Verification Code" prop="verificationCode">
          <div class="verification-code">
            <el-input
                v-model="resetForm.verificationCode"
                placeholder="Enter verification code"
            />
            <el-button
                type="primary"
                :disabled="countdown > 0"
                @click="sendVerificationCode"
            >
              {{ countdown > 0 ? `${countdown}s` : 'Get Code' }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="New Password" prop="newPassword">
          <el-input
              v-model="resetForm.newPassword"
              type="password"
              placeholder="Please enter new password"
              :prefix-icon="Lock"
              show-password
          />
        </el-form-item>

        <el-form-item label="Confirm Password" prop="confirmPassword">
          <el-input
              v-model="resetForm.confirmPassword"
              type="password"
              placeholder="Please confirm password"
              :prefix-icon="Lock"
              show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button
              type="primary"
              :loading="loading"
              class="reset-button"
              @click="handleResetPassword(resetFormRef)"
          >
            Reset Password
          </el-button>
        </el-form-item>

        <div class="reset-links">
          <el-link type="primary" :underline="false" href="/auth/login">
            Back to Login
          </el-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.reset-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.reset-card {
  width: 100%;
  max-width: 400px;
}

.reset-title {
  text-align: center;
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.reset-button {
  width: 100%;
}

.reset-links {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.verification-code {
  display: flex;
  gap: 10px;
}

:deep(.el-card__header) {
  padding: 16px 20px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}
</style>