<template>
  <el-container class="common-layout" direction="vertical">
    <HeaderContent @toggle-collapse="toggleSidebar" />
    <el-container class="main-content" direction="horizontal">
      <HomeSidebar :is-collapse="isCollapse" />
      <router-view />
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import HomeSidebar from '../components/HomeSidebar.vue'
import HeaderContent from "../components/HeaderContent.vue"

const isCollapse = ref(false)
const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}
</script>

<style scoped>
</style>