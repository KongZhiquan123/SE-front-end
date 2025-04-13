<script setup lang="ts">
import {ref, computed} from 'vue'
import {ElMenu} from "element-plus"
import {useRoute} from 'vue-router'
import {
  InfoFilled,
  Files,
  GoldMedal
} from '@element-plus/icons-vue'
import {useUserStore} from "@/stores/user"

defineProps<{
  isCollapse: boolean
}>()

const userStore = useUserStore()
const route = useRoute()

const getCourseSideBarItems = (role: 'teacher' | 'student' | 'admin')  => {
  if (role === 'teacher') {
    return [
      {name: 'Basic Information', path: '/teacher-course/course-basic-info', icon: InfoFilled},
      {name: 'Assignment Management', path: '/teacher-course/assignment-management', icon: Files},
    ]
  } else if (role === 'student') {
    return [
      {name: 'Basic Information', path: '/student-course/course-basic-info', icon: InfoFilled},
      {name: 'Class Materials', path: '/student-course/course-materials', icon: Files},
      {name: 'Assignments', path: '/student-course/course-assignments', icon: Files},
      {name: 'Your Grades', path: '/student-course/course-grades', icon: GoldMedal},
    ]
  } else {
    //管理员看到所有
    return [
      {name: 'Basic Information', path: '/student-course/course-basic-info', icon: InfoFilled},
      {name: 'Class Materials', path: '/student-course/course-materials', icon: Files},
      {name: 'Assignments', path: '/student-course/course-assignments', icon: Files},
      {name: 'Your Grades', path: '/student-course/course-grades', icon: GoldMedal},
    ]
  }
}

const menuItems = computed(() => {
  return getCourseSideBarItems(userStore.role)
})

const queryParams = computed(() => {
  return `?courseId=${route.query.courseId}&courseCode=${route.query.courseCode}`
})

// 设置默认选中项
const activeIndex = ref(route.path + queryParams.value)
</script>

<template>
  <el-aside width="250px">
    <div class="class-name">
      Course: {{ route.query.courseCode }}
    </div>
    <el-menu
        style="height: calc(100% - 61px)"
        mode="vertical"
        :default-active="activeIndex"
        :collapse="isCollapse"
        router
    >
      <el-menu-item
          v-for="item in menuItems"
          :key="item.path"
          :index="`${item.path}${queryParams}`"
      >
        <el-icon>
          <component :is="item.icon" />
        </el-icon>
        <span>{{ item.name }}</span>
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