<template>
  <el-container class="common-layout" direction="vertical">
    <HeaderContent @toggle-collapse="toggleSidebar" />
    <el-container class="main-content" direction="horizontal">
      <CourseSideBar :is-collapse="isCollapse" />
      <router-view />
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CourseSideBar from "../components/CourseSideBar.vue"
import HeaderContent from "../components/HeaderContent.vue"

const isCollapse = ref(false)
const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}
</script>

<style scoped>
.main-content {
  height: var(--main-content-height);
  width: 100%;
}
.common-layout {
  height: 100vh;
  margin-top: 0;
}
</style>