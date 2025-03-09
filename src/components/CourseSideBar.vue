<script setup lang="ts">
import {ref, computed} from 'vue'
import {ElMenu} from "element-plus"
import {useRoute} from 'vue-router'
import {
  InfoFilled,
  Files,
  GoldMedal
} from '@element-plus/icons-vue'

defineProps<{
  isCollapse: boolean
}>()

const route = useRoute()

const queryParams = computed(() => {
  return `?courseId=${route.query.courseId}&courseCode=${route.query.courseCode}`
})
const activeIndex = ref(`/course/course-basic-info${queryParams.value}`)
</script>

<template>
  <el-aside width="250px">
    <div class="class-name">
      Course: {{ route.query.courseCode }}
    </div>
    <!-- el-menu的高度设置为100%减去class-name的高度和边框的高度，class-name的高度为60px，边框高度为1px（设置组件高度不要忘记边框高度） -->
    <el-menu
        style="height: calc(100% - 61px)"
        mode="vertical"
        :default-active="activeIndex"
        :collapse="isCollapse"
        router
    >
      <el-menu-item :index="`/course/course-basic-info${queryParams}`">
        <el-icon>
          <info-filled/>
        </el-icon>
        <span>Basic Information</span>
      </el-menu-item>
      <el-menu-item :index="`/course/course-materials${queryParams}`">
        <el-icon>
          <files/>
        </el-icon>
        <span>Class Materials</span>
      </el-menu-item>
      <el-menu-item :index="`/course/course-assignments${queryParams}`">
        <el-icon>
          <files/>
        </el-icon>
        <span>Assignments</span>
      </el-menu-item>
      <el-menu-item :index="`/course/course-grades${queryParams}`">
        <el-icon>
          <gold-medal/>
        </el-icon>
        <span>Your Grade</span>
      </el-menu-item>
    </el-menu>
  </el-aside>
</template>

<style scoped>
.class-name {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  color: #409EFF;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e6e6e6;
}

.el-menu-item {
  display: flex;
  align-items: center;
}

.el-icon {
  margin-right: 8px;
}
</style>