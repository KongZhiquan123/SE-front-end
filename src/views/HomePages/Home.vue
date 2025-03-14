<template>
  <el-main class="main-content-container">
    <!-- 没有课程时的欢迎界面 -->
    <div v-if="!courses.length" class="empty-state">
      <el-empty description="No courses yet">
        <div class="empty-state-actions">
          <el-button type="primary" size="large" @click="openCreateDialog">
            <el-icon><Plus /></el-icon>Create Course
          </el-button>
          <el-button size="large" @click="openJoinDialog">
            <el-icon><Link /></el-icon>Join Course
          </el-button>
        </div>
      </el-empty>
    </div>

    <!-- 展示课程列表 -->
    <div v-else class="courses-container">
      <div class="courses-header">
        <h2>Your Courses</h2>
        <div class="header-actions">
          <el-button type="primary" @click="openCreateDialog">
            <el-icon><Plus /></el-icon>Create
          </el-button>
          <el-button @click="openJoinDialog">
            <el-icon><Link /></el-icon>Join
          </el-button>
        </div>
      </div>

      <el-row :gutter="24">
        <el-col v-for="(course, index) in courses"
                :key="course.id"
                :xs="24"
                :sm="12"
                :md="8"
                :lg="6">
          <el-card class="course-card"
                   :style="{ borderTopColor: getCardColor(index) }"
                   @click="viewCourse(course.id, course.courseCode)">
            <div class="course-card-header">
              <span class="course-code">{{ course.courseCode }}</span>
              <span class="semester">{{ course.semester }}</span>
            </div>
            <h3 class="course-name">{{ course.courseName }}</h3>
            <p class="course-description">{{ course.description }}</p>
            <div class="course-footer">
              <span class="created-date">Created: {{ formatDate(course.createdAt) }}</span>
              <el-tag size="small" :type="course.isActive ? 'success' : 'info'">
                {{ course.isActive ? 'Active' : 'Inactive' }}
              </el-tag>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 基于el-dialog的加入和创建班级的对话框，组件在components里 -->
    <CreateCourseDialog ref="createDialogRef" @course-created="handleCourseCreated" />
    <JoinCourseDialog ref="joinDialogRef" @course-joined="handleCourseJoined" />
  </el-main>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useRouter } from 'vue-router'
import { Plus, Link } from '@element-plus/icons-vue'
import CreateCourseDialog from "@/components/CreateCourseDialog.vue";
import JoinCourseDialog from "@/components/JoinCourseDialog.vue";
import type { CourseItem } from "@/types/interfaces.ts"
import {ElMessage} from "element-plus";
import {formatDate} from "@/utils/formatDate.ts";
import {useUserStore} from "@/stores/user";
import fetchData from "@/utils/apiUtils";

const router = useRouter()
const createDialogRef = ref()
const joinDialogRef = ref()
const userStore = useUserStore()

const courses = ref<CourseItem[]>([])
if (userStore.authorized) {
  fetchData<CourseItem[]>('/students/courses/current').then((response) => {
    courses.value = response ?? []
  })
}

const colors = [
  '#4CAF50', // Green
  '#2196F3', // Blue
  '#9C27B0', // Purple
  '#F44336', // Red
  '#FF9800', // Orange
  '#00BCD4'  // Cyan
]

const getCardColor = (index: number): string => {
  return colors[index % colors.length]
}

const openCreateDialog = () => {
  createDialogRef.value.open()
}

const openJoinDialog = () => {
  joinDialogRef.value.open()
}

const handleCourseCreated = (newCourse: CourseItem) => {
  courses.value.unshift(newCourse)
  ElMessage.success(`Course ${newCourse.courseCode} was created successfully`)
}

const handleCourseJoined = (newCourse: CourseItem) => {
  courses.value.unshift(newCourse)
  ElMessage.success(`Course ${newCourse.courseCode} was joined successfully`)
}

const viewCourse = (courseId: number, courseCode: string) => {
  router.push({
    path: '/course/course-basic-info',
    query: { courseId: courseId, courseCode: courseCode }
  })
}
</script>

<style scoped>
.main-content-container {
  padding: 24px;
  height: 100%;
  overflow-y: auto;
}


.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state-actions {
  margin-top: 20px;
  display: flex;
  gap: 12px;
}

.courses-container {
  max-width: 1400px;
  margin: 0 auto;
}

.courses-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.course-card {
  height: 215px;
  border-top: 4px solid;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  margin-bottom: 24px;
}


.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.course-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  height: 24px;
}

.course-code {
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.semester {
  font-size: 0.9em;
  color: var(--el-text-color-secondary);
}

.course-name {
  margin: 0 0 8px;
  font-size: 1.2em;
  white-space: nowrap; /* 不换行会好看一些 */
  overflow: hidden;
  text-overflow: ellipsis;
  height: 26px; /* 只有一行，所以高度设置的低一些 */
}

.course-description {
  color: var(--el-text-color-regular);
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  height: 45px;
  flex: 1;
}

.course-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 24px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.created-date {
  font-size: 0.9em;
  color: var(--el-text-color-secondary);
}
</style>