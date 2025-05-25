<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import apiRequest from "@/utils/apiUtils";
import type { CourseItem } from '@/types/interfaces';
import {useUserStore} from "@/stores/user";

const dialogVisible = ref(false);
const courseId = ref<number | null>(null);
const selectedCourse = ref<CourseItem | null>(null);
const courses = ref<CourseItem[]>([]);
const title = ref('');
const content = ref('');
const priority = ref('MEDIUM');
const loading = ref(false);
const userStore = useUserStore();
// 获取教师所有课程
const fetchCourses = async () => {
  loading.value = true;
  courses.value = await apiRequest<CourseItem[]>('/teachers/courses');
  loading.value = false;
};
const emit = defineEmits(['add:notification']);
// 打开对话框
const open = () => {
  fetchCourses();
  dialogVisible.value = true;
  resetForm();
};

// 重置表单
const resetForm = () => {
  title.value = '';
  content.value = '';
  priority.value = 'MEDIUM';
  courseId.value = null;
  selectedCourse.value = null;
};

// 当选择课程变化时
const handleCourseChange = (value: number) => {
  courseId.value = value;
  selectedCourse.value = courses.value.find(c => c.id === value) || null;
};

// 发送通知
const sendNotification = async () => {
  if (!courseId.value) {
    ElMessage.warning('Please select a course');
    return;
  }

  if (!title.value.trim()) {
    ElMessage.warning('Title is required');
    return;
  }

  if (!content.value.trim()) {
    ElMessage.warning('Content is required');
    return;
  }
  loading.value = true;
  const params = new URLSearchParams();
  params.append('title', title.value);
  params.append('content', content.value);
  params.append('priority', priority.value);
  const success = await apiRequest<object>({
    url: `/teachers/notifications/course/${courseId.value}?${params.toString()}`,
    requestType: 'POST',
  });

  if (success !== null) {
    ElMessage.success('Notification sent successfully');
    dialogVisible.value = false;
    emit(
      'add:notification', {
        title: title.value,
        content: content.value,
        priority: priority.value.toLowerCase(),
        relatedCourse: selectedCourse.value!.courseCode,
        createdAt: new Date().toISOString(),
        isRead: true,
        selected: false,
        sender: userStore.username
      }
    )
    resetForm();
  }
  loading.value = false;

};

defineExpose({
  open
});
</script>

<template>
  <el-dialog
      v-model="dialogVisible"
      title="Send Notification to Students"
      width="500px"
  >
    <el-form :model="{ title, content, priority, courseId }" label-width="120px">
      <el-form-item label="Course">
        <el-select
            v-model="courseId"
            placeholder="Select course"
            @change="handleCourseChange"
            style="width: 100%"
        >
          <el-option
              v-for="course in courses"
              :key="course.id"
              :label="course.courseName"
              :value="course.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Title">
        <el-input v-model="title" placeholder="Notification title" maxlength="100" show-word-limit />
      </el-form-item>

      <el-form-item label="Content">
        <el-input
            v-model="content"
            type="textarea"
            :rows="4"
            placeholder="Notification content"
            maxlength="500"
            show-word-limit
        />
      </el-form-item>

      <el-form-item label="Priority">
        <el-radio-group v-model="priority">
          <el-radio value="LOW">Low</el-radio>
          <el-radio value="MEDIUM">Medium</el-radio>
          <el-radio value="HIGH">High</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item v-if="selectedCourse" label="Recipients">
        <el-tag type="info">All students in {{ selectedCourse!.courseName }}</el-tag>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="sendNotification" :loading="loading">
          Send
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>