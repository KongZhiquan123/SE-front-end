<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {ElMessage, ElMessageBox, UploadFile, UploadRawFile} from 'element-plus';
import {Document, Upload, Close, ArrowLeft, InfoFilled, View, Download} from '@element-plus/icons-vue';
import { formatDate } from '@/utils/formatDate';
import type { Assignment } from "@/types/interfaces";
import downloadFile from "@/utils/downloadFile";
import request from "@/utils/request";
import apiRequest from "@/utils/apiUtils";
import convertWordToHtml from "@/utils/convertWordToHtml";

const route = useRoute();
const router = useRouter();
const assignmentId: string = route.query.assignmentId;
const assignment = ref<Assignment | null>(null);
const loading = ref(true);
const submitting = ref(false);
const textResponse = ref('');

const fileList = ref<UploadFile[]>([]);
const previewVisible = ref(false);
const previewFile = ref<UploadFile | null>(null);

apiRequest<Assignment>(`/students/assignments/${assignmentId}/details`).then(data => {
  assignment.value = data ?? {
    id: '',
    title: '',
    type: '',
    description: '',
    dueDate: '',
    maxScore: NaN,
    openDate: '',
    status: 'unknown',
    instructions: ''
  };
  loading.value = false;
});

// 处理文件上传
const beforeFileUpload = (file: UploadRawFile) => {
  // 检查文件大小
  const isLessThan10MB = file.size / 1024 / 1024 < 10;
  if (!isLessThan10MB) {
    ElMessage.error('File size cannot exceed 10MB');
    return false;
  }

  // 检查文件是否有重复
  const isDuplicate = fileList.value.some(f => f.name === file.name);
  if (isDuplicate) {
    ElMessage.warning('File already added');
    return false;
  }

  // 检查文件数量
  if (fileList.value.length >= 10) {
    ElMessage.warning('You can only upload up to 10 files');
    return false;
  }

  return true;
};

const afterFileUpload = (_, file: UploadFile) => {
  // 上传完成后，文件会被添加到fileList中
  if (file.status === 'success') {
    file.url = URL.createObjectURL(file.raw);
  }
};

const removeFile = (file: UploadFile) => {
  // 根据文件uid从fileList移除
  fileList.value = fileList.value.filter(f => f.uid !== file.uid);

  // 如果文件有URL，释放它
  if (file.url) {
    URL.revokeObjectURL(file.url);
  }
};

// 预览文件
const previewFileHandler = async (file: UploadFile) => {
  if (!file.url && file.raw) {
    if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
      // 如果是Word文件，转换为HTML
      file.url = await convertWordToHtml(file.raw);
    } else {
      // 其他文件类型直接创建URL
      file.url = URL.createObjectURL(file.raw);
    }
  }

  previewFile.value = file;
  previewVisible.value = true;
};

// 关闭预览
const closePreview = () => {
  previewVisible.value = false;
};

// 判断文件是否可预览
const isPreviewable = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  const previewableExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'txt', 'html', 'htm', 'doc', 'docx'];
  return previewableExtensions.includes(extension);
};

// 判断截止日期是否已过
const isDeadlinePassed = computed(() => {
  if (!assignment.value?.dueDate) return false;
  return new Date(assignment.value.dueDate) < new Date();
});

// 提交作业
const submitAssignment = async () => {
  if (!isDeadlinePassed.value) {
    await processSubmission();
    return;
  }
  ElMessageBox.confirm(
      'The deadline has passed. Late submissions may be penalized. Continue?',
      'Warning',
      {
        confirmButtonText: 'Submit Anyway',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
  )
      .then(() => {
        processSubmission();
      })

};

// 处理提交过程
const processSubmission = async () => {
  if (!textResponse.value && fileList.value.length === 0) {
    ElMessage.warning('Please provide a text response or upload files');
    return;
  }

  try {
    submitting.value = true;
    const formData = new FormData();
    formData.append('content', textResponse.value);
    //后端要求文件字段名为files
    fileList.value.forEach(file => {
      formData.append('files', file.raw);
    });

    await request.post(
        `/students/submissions/${assignmentId}/submissions`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
    );
    ElMessage.success('Assignment submitted successfully!');
    goBack();
  } catch (error) {
    ElMessage.error('Error submitting assignment: ' + (error.response?.data?.message || error.message));
  } finally {
    submitting.value = false;
  }
};

// 返回上一页
const goBack = () => {
  router.push({
    path: '/student-course/course-assignments',
    query: {
      courseId: route.query.courseId,
      courseCode: route.query.courseCode
    },
  });
};


</script>

<template>
  <el-main class="submission-container">
    <el-card v-loading="loading" class="submission-card">
      <template #header>
        <div class="card-header">
          <h2 class="card-title">Assignment Submission</h2>
          <el-button @click="goBack" text class="back-button">
            <el-icon class="back-icon"><arrow-left /></el-icon>
            Back to Assignments
          </el-button>
        </div>
      </template>

      <div v-if="assignment" class="assignment-content">
        <el-alert
            v-if="isDeadlinePassed"
            title="The deadline has passed! Late submissions may be penalized."
            type="warning"
            :closable="false"
            show-icon
            class="deadline-alert"
        />

        <el-descriptions :column="1" border size="large" class="assignment-info">
          <el-descriptions-item label="Assignment Title">
            {{ assignment.title }}
          </el-descriptions-item>
          <el-descriptions-item label="Due Date">
            <span :class="{ 'text-danger': isDeadlinePassed }">
              {{ formatDate(assignment.dueDate) }}
              <el-tag
                  v-if="isDeadlinePassed"
                  type="danger"
                  size="small"
                  class="status-tag"
              >
                Overdue
              </el-tag>
              <el-tag
                  v-else
                  type="success"
                  size="small"
                  class="status-tag"
              >
                Open
              </el-tag>
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="Max Score">
            {{ assignment.maxScore }} points
          </el-descriptions-item>
          <el-descriptions-item label="Instructions">
            <div class="instructions">{{ assignment.instructions }}</div>
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left" class="section-divider">
          Your Submission
        </el-divider>

        <el-form label-position="top" class="submission-form">
          <el-form-item label="Text Response (optional)">
            <el-input
                v-model="textResponse"
                type="textarea"
                :rows="6"
                placeholder="Enter your response here..."
                resize="vertical"
                class="response-textarea"
            />
          </el-form-item>

          <el-form-item label="File Attachments (optional)">
            <el-upload
                class="file-uploader"
                drag
                multiple
                auto-upload
                :http-request="() => {}"
                v-model:file-list="fileList"
                :before-upload="beforeFileUpload"
                :on-success="afterFileUpload"
                :on-remove="removeFile"
            >
              <el-icon class="upload-icon"><Upload /></el-icon>
              <div class="upload-text">
                Drop files here or <em>click to upload</em>
              </div>
              <template #tip>
                <div class="upload-tip">
                  <el-icon><info-filled /></el-icon>
                  Max 10 files, each less than 10MB
                </div>
              </template>
            </el-upload>
          </el-form-item>

          <div v-if="fileList.length > 0" class="file-list-section">
            <h4 class="file-list-title">
              Files to submit ({{ fileList.length }})
            </h4>
            <div class="file-grid">
              <el-card
                  v-for="file in fileList"
                  :key="file.uid"
                  class="file-item"
                  shadow="hover"
              >
                <div class="file-content">
                  <div class="file-info">
                    <el-icon class="file-icon"><Document /></el-icon>
                    <div class="file-details">
                      <div class="file-name" :title="file.name">{{ file.name }}</div>
                      <div class="file-size">{{ (file.size / 1024).toFixed(1) }} KB</div>
                    </div>
                  </div>
                  <div class="file-actions">
                    <el-tooltip content="Preview file" placement="top" v-if="isPreviewable(file.name)">
                      <el-button
                          type="primary"
                          text
                          circle
                          @click="previewFileHandler(file)"
                          class="action-button"
                      >
                        <el-icon size="20"><View /></el-icon>
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="Download file" placement="top">
                      <el-button
                          type="success"
                          text
                          circle
                          @click="downloadFile(file?.url)"
                          class="action-button"
                      >
                        <el-icon size="20"><Download /></el-icon>
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="Remove file" placement="top">
                      <el-button
                          type="danger"
                          text
                          circle
                          @click="removeFile(file)"
                          class="action-button"
                      >
                        <el-icon size="20"><Close /></el-icon>
                      </el-button>
                    </el-tooltip>
                  </div>
                </div>
              </el-card>
            </div>
          </div>

          <div class="submission-actions">
            <el-button
                type="primary"
                size="large"
                @click="submitAssignment"
                :loading="submitting"
                :disabled="submitting"
                class="submit-button"
            >
              Submit Assignment
            </el-button>
            <el-button
                size="large"
                @click="goBack"
                class="cancel-button"
            >
              Cancel
            </el-button>
          </div>
        </el-form>
      </div>

      <el-empty
          v-else
          description="Assignment not found"
          class="empty-state"
      />
    </el-card>
  </el-main>

  <!-- 文件预览对话框 -->
  <el-dialog
      v-model="previewVisible"
      :title="previewFile?.name || 'File Preview'"
      width="70%"
      class="preview-dialog"
      destroy-on-close
  >
    <div class="preview-container">
      <iframe
          v-if="previewFile?.url"
          :src="previewFile?.url"
          class="preview-iframe"
      ></iframe>
      <div v-else class="preview-fallback">
        Unable to preview file
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closePreview">Close</el-button>
        <el-button
            type="primary"
            @click="downloadFile(previewFile?.url)"
        >
          Download
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
@use "@/assets/variables";



.submission-container {
  padding: 20px;
  margin: 0 auto;
}

.submission-card {
  box-shadow: variables.$box-shadow-light;
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;

  .card-title {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: variables.$text-primary;
  }

  .back-button {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .back-icon {
    font-size: 14px;
  }
}

.assignment-content {
  padding: 0 10px;

  .deadline-alert {
    margin-bottom: 24px;
    font-weight: 500;
  }
}

/* 作业信息样式 */
.assignment-info {
  margin-bottom: 32px;
  border-radius: 4px;
  overflow: hidden;
}

.status-tag {
  margin-left: 8px;
}

.instructions {
  white-space: pre-line;
  line-height: 1.6;
  padding: 4px 0;
}

.text-danger {
  color: variables.$danger-color;
  font-weight: 500;
}

.section-divider {
  margin: 32px 0;
  font-size: 18px;
  font-weight: 600;
}

/* 表单相关样式 */
.submission-form {
  margin-top: 20px;

  .response-textarea {
    border-radius: 4px;
    font-size: 14px;
  }
}

.file-uploader {
  width: 100%;
  border-radius: 6px;
}

.upload {
  &-icon {
    font-size: 48px;
    color: variables.$text-tertiary;
    margin-bottom: 8px;
  }

  &-text {
    font-size: 16px;
    color: variables.$text-secondary;
    margin-bottom: 8px;
  }

  &-tip {
    display: flex;
    align-items: center;
    gap: 5px;
    color: variables.$text-tertiary;
    font-size: 14px;
    padding: 8px 0;
  }
}

/* 文件列表相关样式 */
.file-list-section {
  margin-top: 24px;

  .file-list-title {
    margin-bottom: 12px;
    font-size: 16px;
    font-weight: 500;
    color: variables.$text-primary;
  }
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.file-item {
  height: auto;
  border-radius: 6px;
  transition: all 0.3s;
}

/* 文件项样式 */
.file {
  &-content {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 12px;
  }

  &-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    overflow: hidden;
    width: 100%;
  }

  &-icon {
    font-size: 30px;
    color: variables.$primary-color;
  }

  &-details {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &-name {
    font-weight: 500;
    font-size: 14px;
    color: variables.$text-primary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 160px;
  }

  &-size {
    color: variables.$text-tertiary;
    font-size: 12px;
    margin-top: 2px;
  }

  &-actions {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    width: 100%;
  }
}

.action-button {
  padding: 4px;
  margin-right: 5px;

  &:hover {
    background-color: variables.$background-light;
    border-radius: 50%;
  }
}

/* 按钮相关样式 */
.submission-actions {
  margin-top: 40px;
  display: flex;
  gap: 16px;
  justify-content: flex-start;

  .submit-button {
    min-width: 160px;
  }

  .cancel-button {
    min-width: 100px;
  }
}

/* 空状态样式 */
.empty-state {
  padding: 40px 0;
}

/* 文件预览对话框样式 */
.preview-dialog {
  :deep(.el-dialog__header) {
    border-bottom: 1px solid variables.$border-light;
    padding-bottom: 15px;
  }

  :deep(.el-dialog__body) {
    padding: 0;
  }
}

.preview {
  &-container {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 60vh;
    max-height: 70vh;
    overflow: hidden;
  }

  &-iframe {
    width: 100%;
    height: 100%;
    min-height: 60vh;
    border: none;
  }

  &-fallback {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 60vh;
    color: variables.$text-tertiary;
    font-size: 16px;
    background-color: variables.$background-light;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 10px 20px;
}

@media (max-width: 768px) {
  .file-grid {
    grid-template-columns: repeat(auto-fill, minmax(100%, 1fr));
  }

  .submission-actions {
    flex-direction: column;

    .submit-button,
    .cancel-button {
      width: 100%;
    }
  }
}
</style>