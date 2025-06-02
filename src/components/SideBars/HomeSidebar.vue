<template>
  <el-aside width="200px">
    <el-menu
        style="height: 100%"
        mode="vertical"
        theme="light"
        :collapse="isCollapse"
        :default-active="activeMenu"
        router
    >
      <el-menu-item index="/">
        <el-icon><House /></el-icon>
        <span>Home</span>
      </el-menu-item>
      <el-menu-item index="/calendar">
        <el-icon><Calendar /></el-icon>
        <span>Calendar</span>
      </el-menu-item>
      <el-menu-item index="/settings">
        <el-icon><Setting /></el-icon>
        <span>Profile Settings</span>
      </el-menu-item>
      <el-menu-item index="/notifications">
        <el-icon><Notification /></el-icon>
        <span>Notifications</span>
      </el-menu-item>
    </el-menu>
  </el-aside>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMenu, ElMenuItem } from 'element-plus'
import {House, Calendar, Setting, Notification} from '@element-plus/icons-vue'

defineProps<{
  isCollapse: boolean
}>()

const activeMenu = ref('/')
</script>

<style scoped>
</style>