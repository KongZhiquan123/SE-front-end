<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import request from "@/utils/request.ts";
import type { FormInstance, FormRules } from 'element-plus'
import {UserFilled, Lock} from "@element-plus/icons-vue";
import type {AxiosError} from "axios";

const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive({
  identifier: '',
  password: ''
})

const rules: FormRules = {
  identifier: [
    { required: true, message: 'Please input username or email', trigger: 'blur' },
    { min: 3, message: 'Length should be at least 3 characters', trigger: 'blur' }
  ],
  password: [
    { required: true, message: 'Please input password', trigger: 'blur' },
    { min: 4, message: 'Password must be at least 4 characters', trigger: 'blur' }
  ]
}

const handleLogin = async (formEl?: FormInstance) => {
  if (!formEl) return

  await formEl.validate(async (valid) => {
    if (!valid) return

    try {
      loading.value = true

      const { data } = await request.post('/auth/login', {
        usernameOrEmail: loginForm.identifier,
        password: loginForm.password
      })
      userStore.setUser({
        token: data.jwt,
      })
      const success = await userStore.autoLogin()
      if (!success) {
        ElMessage.error('Login failed')
        return
      }
      ElMessage.success('Login successful')
      await router.push('/')
    } catch (error) {
      const axiosError = error as AxiosError
      ElMessage.error(axiosError.response?.data || 'Login failed')
    } finally {
      loading.value = false
    }
  })
}
</script>

<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <h2 class="login-title">login</h2>
      </template>

      <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="rules"
          label-position="top"
          @submit.prevent
      >
        <el-form-item label="username or email" prop="identifier">
          <el-input
              v-model="loginForm.identifier"
              placeholder="Please enter your username or email"
              :prefix-icon="UserFilled"
          />
        </el-form-item>

        <el-form-item label="password" prop="password">
          <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="Please enter your password"
              :prefix-icon="Lock"
              @keydown.enter="handleLogin(loginFormRef)"
              show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button
              type="primary"
              :loading="loading"
              class="login-button"
              @click="handleLogin(loginFormRef)"
          >
            login
          </el-button>
        </el-form-item>

        <div class="login-links">
          <el-link type="primary" :underline="false" href="/auth/register">
            register
          </el-link>
          <el-link type="primary" :underline="false" href="/auth/reset-password">
            forget password?
          </el-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.login-card {
  width: 100%;
  max-width: 400px;
}

.login-title {
  text-align: center;
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.login-button {
  width: 100%;
}

.login-links {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
}

:deep(.el-card__header) {
  padding: 16px 20px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}
</style>