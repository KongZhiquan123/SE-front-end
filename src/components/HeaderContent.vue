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
    </div>
    <div class="right-section">
      <el-dropdown placement="bottom">
        <el-icon size="20px"><Plus /></el-icon>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item>Join a class</el-dropdown-item>
            <el-dropdown-item>Create a class</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-dropdown placement="bottom">
        <el-icon size="20px"><Grid /></el-icon>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item>Help</el-dropdown-item>
            <el-dropdown-item>Administer</el-dropdown-item>
            <el-dropdown-item>Teacher</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-button link type="primary">Log out</el-button>
    </div>
  </el-header>
</template>

<script setup lang="ts">
import {Fold, Grid, Plus} from '@element-plus/icons-vue'
//通过defineEmits声明一个toggle-collapse事件，用于在父组件中监听，以便实现该组件对另一个组件的控制
defineEmits(['toggle-collapse'])
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