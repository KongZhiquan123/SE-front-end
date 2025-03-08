<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled, Lock, Message } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useRouter } from 'vue-router'
import request from "../utils/request.ts";
import type { RegisterForm } from '../types/interfaces.ts'
import type {AxiosError} from "axios";
import useVerificationCode from "../utils/useVerificationCode.ts";

const router = useRouter()
const loading = ref(false)
const registerFormRef = ref<FormInstance>()

const registerForm = reactive<RegisterForm>({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'STUDENT',
  verificationCode: ''
})

const { countdown, sendCode } = useVerificationCode()

const rules = reactive<FormRules>({
  username: [
    { required: true, message: 'Please enter username', trigger: 'blur' },
    { min: 3, max: 20, message: 'Length should be 3 to 20 characters', trigger: 'blur' }
  ],
  email: [
    { required: true, message: 'Please enter email', trigger: 'blur' },
    { type: 'email', message: 'Please enter valid email', trigger: 'blur' }
  ],
  password: [
    { required: true, message: 'Please enter password', trigger: 'blur' },
    { min: 6, message: 'Password must be at least 6 characters', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: 'Please confirm password', trigger: 'blur' },
    {
      validator: (_, value, callback) => {
        if (value !== registerForm.password) {
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
})


const sendVerificationCode = async () => {
  if (!registerForm.email) {
    ElMessage.warning('Please enter email first')
    return
  }

  try {
    await sendCode(registerForm.email, '/auth/send-verification/')
    ElMessage.success('Verification code sent')
  } catch (error) {
    const axiosError = error as AxiosError
    ElMessage.error(axiosError.response?.data || 'Failed to send verification code')
  }
}

const handleRegister = async (formEl?: FormInstance) => {
  if (!formEl) return

  await formEl.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      await request.post('/auth/register', {
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password,
        role: registerForm.role,
        verificationCode: registerForm.verificationCode
      })

      ElMessage.success('Registration successful')
      await router.push('/auth/login')
    } catch (error) {
      const axiosError = error as AxiosError
      ElMessage.error(axiosError.response?.data || 'Registration failed')
    } finally {
      loading.value = false
    }
  })
}
</script>

<template>
  <div class="register-container">
    <el-card class="register-card">
      <template #header>
        <h2 class="register-title">Register</h2>
      </template>

      <el-form
          ref="registerFormRef"
          :model="registerForm"
          :rules="rules"
          label-position="top"
          @submit.prevent
      >
        <el-form-item label="Username" prop="username">
          <el-input
              v-model="registerForm.username"
              placeholder="Please enter username"
              :prefix-icon="UserFilled"
          />
        </el-form-item>

        <el-form-item label="Email" prop="email">
          <el-input
              v-model="registerForm.email"
              placeholder="Please enter email"
              :prefix-icon="Message"
          />
        </el-form-item>

        <el-form-item label="Password" prop="password">
          <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="Please enter password"
              :prefix-icon="Lock"
              show-password
          />
        </el-form-item>

        <el-form-item label="Confirm Password" prop="confirmPassword">
          <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="Please confirm password"
              :prefix-icon="Lock"
              show-password
          />
        </el-form-item>

        <el-form-item label="Role">
          <el-radio-group v-model="registerForm.role">
            <el-radio value="STUDENT">Student</el-radio>
            <el-radio value="TEACHER">Teacher</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="Verification Code" prop="verificationCode">
          <div class="verification-code">
            <el-input
                v-model="registerForm.verificationCode"
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

        <el-form-item>
          <el-button
              type="primary"
              :loading="loading"
              class="register-button"
              @click="handleRegister(registerFormRef)"
          >
            Register
          </el-button>
        </el-form-item>

        <div class="register-links">
          <el-link type="primary" :underline="false" href="/auth/login">
            Already have an account? Login
          </el-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.register-card {
  width: 100%;
  max-width: 400px;
}

.register-title {
  text-align: center;
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.register-button {
  width: 100%;
}

.register-links {
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