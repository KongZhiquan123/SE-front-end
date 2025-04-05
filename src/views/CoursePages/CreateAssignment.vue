<script setup lang="ts">
import {ref, reactive} from 'vue';
import type {Assignment, Attachment} from '@/types/interfaces';
import {ElMessage, ElMessageBox} from 'element-plus';
import {UploadFilled} from "@element-plus/icons-vue";
import type {UploadFiles, UploadRawFile, UploadFile} from 'element-plus'
import request from "@/utils/request";
import {useRoute} from "vue-router";

const assignmentForm = reactive({
  title: '',
  type: 'assignment',
  description: '',
  dueDate: '',
  maxScore: 100,
  openDate: '',
  instructions: '',
  status: 'upcoming' as const
});

const loading = ref(false);
const uploadLoading = ref(false);
const fileList = ref<UploadFiles>([]);
const route = useRoute();
const createAssignment = async () => {
  try {
    if (!validateForm()) {
      return;
    }

    loading.value = true;

    const assignmentData: Partial<Assignment> = {
      ...assignmentForm,
    };
    const courseId = route.query.courseId;
    // 先创建作业，获取作业ID
    const {data} = await request.post(`/teachers/assignments/${courseId}/assignments`, assignmentData);
    const assignmentId = data.id;
    if (!assignmentId) {
      ElMessage.error('Failed to create assignment. Please try again.');
    }

    // 上传文件
    const filesToUpload = fileList.value.filter(file => file.raw).map(file => file.raw);
    if (filesToUpload.length > 0) {
      for (const file of filesToUpload) {
        await uploadFile(file, assignmentId);
      }
    }

    ElMessage({
      type: 'success',
      message: 'Assignment created successfully'
    });

    resetForm();
  } catch (error) {
    console.error('Failed to create assignment:', error);
    ElMessage({
      type: 'error',
      message: 'Failed to create assignment. Please try again.'
    });
  } finally {
    loading.value = false;
  }
};

const uploadFile = async (file: UploadRawFile, assignmentId: number) => {
  try {
    uploadLoading.value = true;

    // 创建 FormData 对象
    const formData = new FormData();
    formData.append('file', file);

    const response = await request.post(`/teachers/assignments/${assignmentId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    if (!response || response.status !== 200) {
      ElMessage.error('Failed to upload file. Please try again.');
    }
  } catch (error) {
    console.error('Failed to upload file:', error);
    ElMessage({
      type: 'error',
      message: 'Failed to upload file. Please try again.'
    });
  } finally {
    uploadLoading.value = false;
  }
};

const handleFileUpload = (file: UploadFile) => {
  const isValidFile = validateFile(file);
  if (!isValidFile) return false;

  fileList.value.push(file);

  return false; // 拒绝上传
};
const removeAttachment = (file: UploadRawFile) => {
  const index = fileList.value.findIndex(f => f.uid === file.uid);
  if (index !== -1) {
    return new Promise((resolve, reject) => {
      ElMessageBox.confirm('Are you sure you want to remove this file?', 'Warning', {
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
        type: 'warning'
      }).then(() => {
        fileList.value.splice(index, 1);
        resolve(true);
      }).catch(() => {
        resolve(false);
      });
    });
  }
  return true;
}

const validateFile = (file: UploadFile) => {
  // Check file size (limit to 10MB)
  const isLessThan10MB = file.size / 1024 / 1024 < 10;
  if (!isLessThan10MB) {
    ElMessage.error('File size cannot exceed 10MB!');
    return false;
  }
  return true;
};

const validateForm = () => {
  if (!assignmentForm.title) {
    ElMessage.error('Please enter a title');
    return false;
  }
  if (!assignmentForm.description) {
    ElMessage.error('Please enter a description');
    return false;
  }
  if (!assignmentForm.dueDate) {
    ElMessage.error('Please select a due date');
    return false;
  }
  if (!assignmentForm.openDate) {
    ElMessage.error('Please select an open date');
    return false;
  }
  return true;
};

const resetForm = () => {
  Object.assign(assignmentForm, {
    title: '',
    type: 'assignment',
    description: '',
    dueDate: '',
    maxScore: 100,
    openDate: '',
    instructions: '',
    status: 'upcoming'
  });
  fileList.value = [];
};

// Define assignment status options
const statusOptions = [
  {label: 'Open', value: 'open'},
  {label: 'Closed', value: 'closed'},
  {label: 'Upcoming', value: 'upcoming'}
];
</script>

<template>
  <el-main class="assignment-container">
    <div class="header">
      <h2 class="page-title">Create Assignment</h2>
    </div>

    <el-form :model="assignmentForm" label-position="top" class="assignment-form">
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="Title" required>
            <el-input v-model="assignmentForm.title" placeholder="Enter assignment title"/>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="Status">
            <el-select v-model="assignmentForm.status" placeholder="Select status">
              <el-option
                  v-for="option in statusOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="Open Date" required>
            <el-date-picker
                v-model="assignmentForm.openDate"
                type="datetime"
                placeholder="Select open date"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
                style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="Due Date" required>
            <el-date-picker
                v-model="assignmentForm.dueDate"
                type="datetime"
                placeholder="Select due date"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
                style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="Maximum Score">
            <el-input-number v-model="assignmentForm.maxScore" :min="0" :max="100" :step="5" style="width: 100%"/>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="Description" required>
        <el-input
            v-model="assignmentForm.description"
            type="textarea"
            :rows="3"
            placeholder="Enter a brief description of the assignment"
        />
      </el-form-item>

      <el-form-item label="Detailed Instructions">
        <el-input
            v-model="assignmentForm.instructions"
            type="textarea"
            :rows="6"
            placeholder="Enter detailed instructions for completing the assignment"
        />
      </el-form-item>

      <el-form-item label="Attachments">
        <el-upload
            class="attachment-uploader"
            drag
            action="#"
            :auto-upload="false"
            :multiple="true"
            :file-list="fileList"
            :http-request="() => {}"
            :on-change="(file: UploadFile) => handleFileUpload(file)"
            :before-remove="(file: UploadFile) => removeAttachment(file)"
        >
          <el-icon class="el-icon--upload">
            <upload-filled/>
          </el-icon>
          <div class="el-upload__text">Drop files here or <em>click to upload</em></div>
          <template #tip>
            <div class="el-upload__tip">
              Max file size: 10MB. Files will be uploaded when you submit the form.
            </div>
          </template>
        </el-upload>
      </el-form-item>

      <div class="form-actions">
        <el-button @click="resetForm">Reset</el-button>
        <el-button type="primary" @click="createAssignment" :loading="loading">
          Create Assignment
        </el-button>
      </div>
    </el-form>
  </el-main>
</template>

<style scoped>
.assignment-container {
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.assignment-form {
  background-color: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.attachment-uploader {
  width: 100%;
}

.attachment-list {
  margin-top: 16px;
}

.attachment-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 8px;
}

.attachment-info {
  flex-grow: 1;
  margin-left: 8px;
}

.attachment-name {
  font-weight: 500;
}

.attachment-size {
  color: #909399;
  font-size: 12px;
}
</style>