<template>
  <el-container class="common-layout" direction="vertical">
    <HeaderContent @toggle-collapse="toggleSidebar" />
    <el-container class="el-container-main-content" direction="horizontal">
      <CourseSideBar :is-collapse="isCollapse" />
      <router-view />
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CourseSideBar from "../components/SideBars/CourseSideBar.vue"
import HeaderContent from "../components/Headers/HeaderContent.vue"

const isCollapse = ref(false)
const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}
</script>

<style scoped>
</style>