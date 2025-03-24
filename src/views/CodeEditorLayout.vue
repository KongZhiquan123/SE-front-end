<script setup lang="ts">
import HeaderContent from "@/components/HeaderContent.vue";
</script>

<template>
  <el-container class="common-layout" direction="vertical">
    <HeaderContent/>
    <router-view />
  </el-container>
</template>

<style scoped>
</style>