<script setup lang="ts">
defineOptions({
  name: 'NotFound',
})
import { useRouter } from 'vue-router'

const router = useRouter()

// 返回上一页
const goBack = () => {
  router.back()
}
</script>

<template>
  <el-main class="not-found-container">
    <div class="not-found-content">
      <!-- 记得尽量让配色与element-plus保持一致 -->
      <h1 class="error-code">404</h1>
      <h2 class="error-title">Page Not Found</h2>
      <p class="error-description">The page you're looking for doesn't exist or has been moved.</p>
      <p class="back-link" @click="goBack">← Click here to go back</p>
    </div>
  </el-main>
</template>

<style scoped>
.not-found-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.not-found-content {
  text-align: center;
}

.error-code {
  font-size: 6rem;
  margin: 0;
  color: var(--el-color-primary);
}

.error-title {
  font-size: 2rem;
  margin: 1rem 0;
}

.error-description {
  color: var(--el-text-color-secondary);
  margin-bottom: 2rem;
}

.back-link {
  color: var(--el-color-primary);
  cursor: pointer;
  transition: color 0.3s;
}

.back-link:hover {
  color: var(--el-color-primary-light-3);
}
</style>