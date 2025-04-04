<script setup lang="ts">
import {ref} from "vue";
import VueMarkdownRender from 'vue-markdown-render';
import type {CourseBasicInfo} from "@/types/interfaces";
import {useRoute} from "vue-router";
import apiRequest from "@/utils/apiUtils";
import {ElMessage} from "element-plus";
const courseId = useRoute().query.courseId;
const basicInfo = ref<CourseBasicInfo>({
  courseName: "",
  teacher: "",
  email: "",
  courseDescription: "",
});
const userRole = useRoute().path.startsWith('/teacher') ? 'teacher' : 'student';
const editedInfo = ref<CourseBasicInfo>({...basicInfo.value});
const isEditing = ref(false);
const loading = ref<boolean>(true);
const saving = ref<boolean>(false);

apiRequest<CourseBasicInfo>(`/${userRole+"s"}/courses/${courseId}`).then((res) => {
  basicInfo.value = res ?? basicInfo.value;
  loading.value = false;
})


const startEditing = () => {
  editedInfo.value = {...basicInfo.value};
  isEditing.value = true;
};

const cancelEditing = () => {
  isEditing.value = false;
};

const saveChanges = () => {
  saving.value = true;

  const endpoint = `/teachers/courses/${courseId}`;
  apiRequest(endpoint, 'put', 'Failed to update course information', {
    courseName: editedInfo.value.courseName,
    description: editedInfo.value.courseDescription
  }).then(
      (res) => {
        if (res) {
          ElMessage.success('Course information updated successfully');
          basicInfo.value = {...editedInfo.value};
        }
        isEditing.value = false;
        saving.value = false;
      }
  );
};

</script>

<template>
  <el-main class="class-info-container" v-loading="loading">
    <div class="info-section">
      <div class="header-container">
        <h2 class="page-title">Basic Information</h2>
        <div v-role="'teacher'" class="edit-controls">
          <template v-if="!isEditing">
            <el-button type="primary" @click="startEditing">
              Edit Information
            </el-button>
          </template>
          <template v-else>
            <el-button type="success" @click="saveChanges" :loading="saving">
              Save
            </el-button>
            <el-button @click="cancelEditing">
              Cancel
            </el-button>
          </template>
        </div>
      </div>

      <template v-if="!isEditing">
        <el-descriptions :column="1" border label-width="300px">
          <el-descriptions-item label="Course Name">{{ basicInfo.courseName }}</el-descriptions-item>
          <el-descriptions-item label="Teacher">{{ basicInfo.teacher }}</el-descriptions-item>
          <el-descriptions-item label="Email">{{ basicInfo.email }}</el-descriptions-item>
        </el-descriptions>
      </template>

      <template v-else>

        <el-form label-width="300px" class="edit-form">
          <el-form-item label="Course Name">
            <el-input v-model="editedInfo.courseName"/>
          </el-form-item>
          <el-form-item label="Teacher">
            <el-input v-model="editedInfo.teacher" disabled/>
          </el-form-item>
          <el-form-item label="Email">
            <el-input v-model="editedInfo.email" disabled/>
          </el-form-item>
        </el-form>

      </template>
    </div>

    <div class="info-section">
      <h2 class="page-title">Course Description</h2>
      <el-card class="description-card" v-if="!isEditing">
        <VueMarkdownRender :source="basicInfo.courseDescription"/>
      </el-card>
      <el-card class="description-card" v-else>
        <el-form-item label="Description (Markdown supported)">
          <el-input
              v-model="editedInfo.courseDescription"
              type="textarea"
              :rows="10"
              placeholder="Enter course description in Markdown format"
          />
        </el-form-item>
      </el-card>
    </div>
  </el-main>
</template>

<style scoped>
.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.edit-controls {
  display: flex;
  gap: 10px;
}

.description-card {
  width: 100%;
  margin-bottom: 20px;
}

.edit-form {
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