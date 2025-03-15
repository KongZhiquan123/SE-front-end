<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Document, Upload, Close } from '@element-plus/icons-vue';
import { formatDate } from '@/utils/formatDate';
const route = useRoute();
const router = useRouter();
const assignmentId = route.query.assignmentId;
console.log(typeof assignmentId)
const assignment = ref<any>(null);
const loading = ref(true);
const submitting = ref(false);

const textResponse = ref('');
const uploadedFiles = ref<any[]>([]);
const fileList = ref<any[]>([]);


onMounted(async () => {
  try {
    loading.value = true;
    // TODO: 使用实际的 API 调用替换
  } catch (error) {
    ElMessage.error('Failed to load assignment details');
    console.error(error);
  } finally {
    loading.value = false;
  }
});


const handleFileUpload = (file: any) => {

  const isLessThan10MB = file.size / 1024 / 1024 < 10;
  if (!isLessThan10MB) {
    ElMessage.error('File size cannot exceed 10MB');
    return false;
  }

  uploadedFiles.value.push(file);
  return false;
};

const removeFile = (file: any) => {
  uploadedFiles.value = uploadedFiles.value.filter(f => f !== file);
  fileList.value = fileList.value.filter(f => f.uid !== file.uid);
};


const isDeadlinePassed = () => {
  if (!assignment.value?.dueDate) return false;
  return new Date(assignment.value.dueDate) < new Date();
};


const submitAssignment = async () => {
  if (isDeadlinePassed()) {
    ElMessageBox.confirm(
        'The deadline has passed. Late submissions may be penalized. Continue?',
        'Warning',
        {
          confirmButtonText: 'Submit Anyway',
          cancelButtonText: 'Cancel',
          type: 'warning',
        }
    ).then(() => {
      processSubmission();
    }).catch(() => {

    });
  } else {
    await processSubmission();
  }
};

const processSubmission = async () => {
  if (!textResponse.value && uploadedFiles.value.length === 0) {
    ElMessage.warning('Please provide a text response or upload files');
    return;
  }

  try {
    submitting.value = true;

    const formData = new FormData();
    formData.append('assignmentId', assignmentId);
    formData.append('textResponse', textResponse.value);
    uploadedFiles.value.forEach(file => {
      formData.append('files', file);
    });

    if (response.ok) {
      ElMessage.success('Assignment submitted successfully');
      goBack()
    } else {
      ElMessage.error('Error submitting assignment');
    }
  } catch (error) {
    ElMessage.error('Error submitting assignment');
    console.error(error);
  } finally {
    submitting.value = false;
  }
};

const goBack = () => {
  router.push({
    path: '/student-course/course-assignments',
    query: { courseId: route.query.courseId, courseCode: route.query.courseCode },
  })
};
</script>

<template>
  <el-main>
    <el-card v-loading="loading" class="submission-card">
      <template #header>
        <div class="card-header">
          <h2>Assignment Submission</h2>
          <el-button @click="goBack" text>Back to Assignments</el-button>
        </div>
      </template>

      <div v-if="assignment">
        <el-alert
            v-if="isDeadlinePassed()"
            title="The deadline has passed! Late submissions may be penalized."
            type="warning"
            :closable="false"
            show-icon
            class="deadline-alert"
        />

        <el-descriptions :column="1" border size="large" class="assignment-info">
          <el-descriptions-item label="Assignment Title">{{ assignment.title }}</el-descriptions-item>
          <el-descriptions-item label="Due Date">
            <span :class="{ 'text-danger': isDeadlinePassed() }">
              {{ formatDate(assignment.dueDate) }}
              <el-tag v-if="isDeadlinePassed()" type="danger" size="small">Overdue</el-tag>
              <el-tag v-else type="success" size="small">Open</el-tag>
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="Max Score">{{ assignment.maxScore }}</el-descriptions-item>
          <el-descriptions-item label="Instructions">
            <div class="instructions">{{ assignment.instructions }}</div>
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">Your Submission</el-divider>

        <el-form label-position="top">
          <el-form-item label="Text Response (optional)">
            <el-input
                v-model="textResponse"
                type="textarea"
                :rows="6"
                placeholder="Enter your response here..."
            />
          </el-form-item>

          <el-form-item label="File Attachments (optional)">
            <el-upload
                class="file-uploader"
                drag
                multiple
                :auto-upload="false"
                :http-request="() => {}"
                :on-change="handleFileUpload"
                :file-list="fileList"
                :on-remove="removeFile"
            >
              <el-icon class="el-icon--upload"><Upload /></el-icon>
              <div class="el-upload__text">
                Drop files here or <em>click to upload</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  Max 10 files, each less than 10MB
                </div>
              </template>
            </el-upload>
          </el-form-item>

          <div class="file-list" v-if="uploadedFiles.length > 0">
            <h4>Files to submit ({{ uploadedFiles.length }})</h4>
            <el-card v-for="file in uploadedFiles" :key="file.uid" class="file-item">
              <div class="file-info">
                <el-icon><Document /></el-icon>
                <div class="file-details">
                  <div class="file-name">{{ file.name }}</div>
                  <div class="file-size">{{ (file.size / 1024).toFixed(1) }} KB</div>
                </div>
              </div>
              <el-button type="danger" text circle @click="removeFile(file)">
                <el-icon><Close /></el-icon>
              </el-button>
            </el-card>
          </div>

          <div class="submission-actions">
            <el-button
                type="primary"
                size="large"
                @click="submitAssignment"
                :loading="submitting"
                :disabled="submitting"
            >
              Submit Assignment
            </el-button>
            <el-button size="large" @click="goBack">Cancel</el-button>
          </div>
        </el-form>
      </div>

      <el-empty v-else description="Assignment not found" />
    </el-card>
  </el-main>
</template>

<style scoped>
.submission-card {
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.deadline-alert {
  margin-bottom: 20px;
}

.assignment-info {
  margin-bottom: 24px;
}

.instructions {
  white-space: pre-line;
  line-height: 1.5;
}

.text-danger {
  color: #f56c6c;
}

.file-uploader {
  width: 100%;
}

.file-list {
  margin-top: 16px;
}

.file-item {
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-details {
  display: flex;
  flex-direction: column;
}

.file-name {
  font-weight: 500;
}

.file-size {
  color: #909399;
  font-size: 12px;
}

.submission-actions {
  margin-top: 30px;
  display: flex;
  gap: 16px;
}
</style>