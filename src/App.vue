<template>
  <router-view v-slot="{ Component }">
    <!-- 使用 transition 组件包裹组件，添加过渡效果，直接使用v-if会有明显的闪烁效果 -->
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<style scoped>
/* 添加过渡效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
:deep(.el-container) {
  background: var(--background-color);
}
</style>