<template>
  <el-header class="header">
    <div class="left-section">
      <el-icon
          size="20px"
          style="margin-right: 20px; cursor: pointer"
          @click="$emit('toggle-collapse')"
      >
        <Fold />
      </el-icon>
      Classroom
      <el-icon
          size="20px"
          style="margin-left: 20px; cursor: pointer"
          @click="router.push('/')"
      >
        <HomeFilled />
      </el-icon>
    </div>
    <div class="right-section">
      <el-button v-if="userStore.authorized" link type="primary" @click="logout">Log Out</el-button>
      <el-button v-else link type="primary" @click="login">Log In</el-button>
    </div>
  </el-header>
</template>

<script setup lang="ts">
import {Fold, HomeFilled} from '@element-plus/icons-vue'
import { useRouter } from "vue-router"
import { useUserStore } from '@/stores/user'
//向父组件发送事件toggle-collapse，父组件监听到事件后，执行toggleCollapse方法，实现侧边栏的展开和收缩
defineEmits(['toggle-collapse'])
const router = useRouter()
const userStore = useUserStore()

const login = () => {
  router.push('/auth/login')
}

const logout = () => {
  userStore.clearUser()
  router.push('/auth/login')
}
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: var(--header-content-height);
  width: 100%;
  border-bottom: 1px solid var(--el-border-color);
}

.left-section {
  display: flex;
  align-items: center;
  font-size: 20px;
}
.el-icon {
  color: #606266;
}
.right-section {
  display: flex;
  align-items: center;
  gap: 20px;
}
</style>