<template>
  <el-container class="common-layout" direction="vertical">
    <HeaderContent @toggle-collapse="toggleSidebar" />
    <el-container class="main-content" direction="horizontal">
      <component :is="SideBarType ? ClassSideBar : HomeSidebar" :is-collapse="isCollapse" />
      <router-view />
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import HomeSidebar from './components/HomeSidebar.vue'
import ClassSideBar from "./components/ClassSideBar.vue"
import HeaderContent from "./components/HeaderContent.vue"
import {useRoute} from "vue-router";
//判断当前路由是home还是class，以便显示不同的侧边栏
const route = useRoute()
const SideBarType = computed((): boolean => {
  return route.path.includes('class')
})
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
