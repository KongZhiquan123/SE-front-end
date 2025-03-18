<script setup lang="ts">
import { ref } from "vue";
import VueMarkdownRender from 'vue-markdown-render';
import type {CourseBasicInfo} from "@/types/interfaces";
import {useRoute} from "vue-router";
import apiRequest from "@/utils/apiUtils";

const courseId = useRoute().query.courseId;
const basicInfo = ref<CourseBasicInfo>({
  courseName: "",
  teacher: "",
  email: "",
  courseDescription: "",
});
const loading = ref<boolean>(true);
apiRequest<CourseBasicInfo>(`/students/courses/${courseId}`).then((res) => {
  basicInfo.value = res ?? basicInfo.value;
  loading.value = false;
})


</script>

<template>
  <el-main class="class-info-container" v-loading="loading">
    <div class="info-section">
      <h2 class="page-title">Basic Information</h2>
      <el-descriptions :column="1" border label-width="300px">
        <el-descriptions-item label="Course Name">{{ basicInfo.courseName }}</el-descriptions-item>
        <el-descriptions-item label="Teacher">{{ basicInfo.teacher }}</el-descriptions-item>
        <el-descriptions-item label="Email">{{ basicInfo.email }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <div class="info-section">
      <h2>Course Description</h2>
      <el-card class="description-card">
        <VueMarkdownRender :source="basicInfo.courseDescription" />
      </el-card>
    </div>
  </el-main>
</template>

<style scoped>
.description-card {
  width: 100%;
  margin-bottom: 20px;
}
/*
scoped只会将当前组件的样式应用到当前组件，不会影响子组件，
因此需要使用deep选择器来穿透组件边界，
这里我们希望对VueMarkdownRender组件内部的h1、h2、h3、p、pre、code标签进行样式设置
*/
:deep(.description-card h1,
.description-card h2,
.description-card h3) {
  color: #409EFF;
}

:deep(.description-card p) {
  font-size: 16px;
  line-height: 1.5;
}

:deep(.description-card pre) {
  background-color: #f6f8fa;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
}

:deep(.description-card code) {
  padding: 0.2em 0.4em;
  border-radius: 6px;
  font-size: 85%;
}
</style>