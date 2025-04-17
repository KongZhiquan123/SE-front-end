<template>
  <el-main class="grading-container">
    <!-- Student submissions list -->
    <el-card class="submissions-list">
      <template #header>
        <div class="card-header">
          <h2>Student Submissions</h2>
          <el-select v-model="statusFilter" placeholder="Filter by status" clearable style="width: 240px">
            <el-option label="All" value="" />
            <el-option label="Pending" value="pending" />
            <el-option label="Graded" value="graded" />
          </el-select>
        </div>
      </template>

      <el-table
          :data="filteredSubmissions"
          stripe
          style="width: 100%"
          @row-click="selectSubmission"
          :row-class-name="getRowClassName"
      >
        <el-table-column prop="id" label="ID" />
        <el-table-column prop="studentName" label="Student Name" />
        <el-table-column prop="submitTime" label="Submit Time"  />
        <el-table-column prop="attempts" label="Attempts"  />
        <el-table-column prop="status" label="Status" >
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="120">
          <template #default="scope">
            <el-button @click.stop="selectSubmission(scope.row)" type="primary" size="small">
              Grade
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-button @click="goBack" class="cancel-button">Cancel</el-button>
        <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="totalSubmissions"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 选中的提交项的评分对话框 -->
    <el-dialog v-model="gradingDialogVisible" class="submission-details">
      <template #header>
        <div class="card-header">
          <div class="submission-header">
            <h2>Grading: {{ selectedSubmission.id }}</h2>
            <el-tag :type="getStatusType(selectedSubmission.status)">
              {{ getStatusText(selectedSubmission.status) }}
            </el-tag>
          </div>

        </div>
      </template>

      <div class="submission-info">
        <div class="info-row">
          <div class="info-item">
            <strong>Submit Time:</strong> {{ formatDate(selectedSubmission.submitTime) }}
          </div>
          <div class="info-item">
            <strong>Student:</strong> {{ selectedSubmission.studentName }}
          </div>
          <div class="info-item">
            <strong>Attempt Count:</strong> {{ selectedSubmission.attempts }}
          </div>
        </div>
      </div>
      <!-- AI评分部分 -->
      <div v-if="selectedSubmission.aiGrading" class="ai-grading-section">
        <h3>AI Grading Results</h3>
        <el-alert
            title="AI assessment is provided for reference only. Please review and provide your own evaluation."
            type="info"
            :closable="false"
            class="ai-disclaimer"
        />

        <div class="ai-score-container">
          <div class="ai-score-box">
            <div class="ai-score-label">AI Score</div>
            <div class="ai-score-value">{{ selectedSubmission.aiGrading.aiScore }}</div>
          </div>

          <div class="ai-confidence">
            <span class="confidence-label">Confidence:</span>
            <el-progress
                :percentage="selectedSubmission.aiGrading.confidence * 100"
                :color="getConfidenceColor(selectedSubmission.aiGrading.confidence)"
                :stroke-width="8"
                :show-text="false"
                class="confidence-bar"
            />
            <span class="confidence-value">{{ Math.round(selectedSubmission.aiGrading.confidence * 100) }}%</span>
          </div>
        </div>

        <div class="ai-feedback">
          <div class="ai-feedback-label">AI Feedback Suggestions:</div>
          <div class="ai-feedback-content">{{ selectedSubmission.aiGrading.feedbackSuggestions }}</div>
          <el-button
              type="primary"
              size="small"
              @click="useAIFeedback"
              class="use-ai-feedback"
              plain
          >
            Use AI Feedback
          </el-button>
        </div>
      </div>
      <!-- 文本回答部分 -->
      <div v-if="selectedSubmission.textResponse" class="text-response">
        <h3>Text Response</h3>
        <div class="response-content">{{ selectedSubmission.textResponse }}</div>
      </div>

      <!-- 代码提交部分 -->
      <div v-if="selectedSubmission?.codeSubmissions?.length" class="code-submissions">
        <h3>Code Submissions</h3>
        <el-tabs v-model="activeCodeTab" type="border-card">
          <el-tab-pane
              v-for="(code, index) in selectedSubmission.codeSubmissions"
              :key="code.id"
              :label="`${code.language} (v${code.versionIndex})`"
              :name="String(index)"
          >
            <div class="code-header">
              <span><strong>Language:</strong> {{ code.language }}</span>
              <span><strong>Version:</strong> {{ code.versionIndex }}</span>
            </div>
            <pre class="code-display"><code>{{ code.script }}</code></pre>
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- 附件部分 -->
      <div v-if="selectedSubmission?.attachments?.length" class="attachments">
        <h3>Attachments</h3>
        <el-table :data="selectedSubmission.attachments" stripe style="width: 100%">
          <el-table-column prop="name" label="Name" />
          <el-table-column prop="size" label="Size"  width="120" />
          <el-table-column label="Actions" width="120">
            <template #default="scope">
              <el-button @click="viewAttachment(scope.row)" type="primary" size="small">
                View
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 评分部分 -->
      <div class="grading-section">
        <h3>Grade Submission</h3>
        <el-form :model="grading" label-position="top">
          <el-form-item label="Score" prop="score">
            <el-input-number
                v-model="grading.score"
                :min="0"
                :max="100"
                :step="1"
                controls-position="right"
                placeholder="Enter score"
            />
          </el-form-item>

          <el-form-item label="Feedback" prop="feedback">
            <el-input
                v-model="grading.feedback"
                type="textarea"
                :rows="4"
                placeholder="Provide constructive feedback for the student"
            />
          </el-form-item>

          <div class="form-actions">
            <el-button @click="closeSubmission">Close</el-button>
            <el-button @click="resetGrading">Reset</el-button>
            <el-button type="primary" @click="submitGrading" :loading="isSubmitting">
              Submit Grading
            </el-button>
          </div>
        </el-form>
      </div>
    </el-dialog>
  </el-main>
</template>

<script lang="ts" setup>
import {ref, reactive, watch, computed} from 'vue';
import { ElMessage } from 'element-plus';
import {formatDate} from "@/utils/formatDate";
import {Submission, Attachment} from "@/types/interfaces";
import {cloneDeep, defaultTo} from "lodash-es";
import apiRequest from "@/utils/apiUtils";
import {useRoute, useRouter} from "vue-router";
import {submissionsConversion} from "@/utils/DataFormatConversion";

interface GradingForm {
  score: number;
  feedback: string;
}

// 表单状态
const grading = reactive<GradingForm>({
  score: 0,
  feedback: '',
});

const defaultSubmission = {
  id: 0,
  submitTime: '',
  status: 'pending',
  attempts: 0,
  textResponse: '',
  codeSubmissions: [],
  attachments: []
}
const submissionsList = reactive<Submission[]>([]);
const filteredSubmissions = ref<Submission[]>([]);
const route = useRoute();
const router = useRouter();
const assignmentId = route.query.assignmentId;

// UI 状态
const selectedSubmission = ref<Submission>(cloneDeep(defaultSubmission));
const activeCodeTab = ref('0');
const isSubmitting = ref(false);
const statusFilter = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const totalSubmissions = computed(() => submissionsList.length);



apiRequest<Submission[]>(`/teachers/submissions/assignment/${assignmentId}/latest`).then((data) => {
  submissionsList.push(...submissionsConversion(data));
  filteredSubmissions.value = submissionsList;
})


// 获取状态类型（用于标签颜色）
const getStatusType = (status: string): string => {
  switch (status) {
    case 'graded': return 'success';
    case 'pending': return 'warning';
    default: return 'info';
  }
};

// 获取状态文本
const getStatusText = (status: string): string => {
  switch (status) {
    case 'graded': return 'Graded';
    case 'pending': return 'Pending';
    default: return 'Unknown';
  }
};

const goBack = async () => {
  await router.push({
    path: '/teacher-course/assignment-management',
    query: {
      courseId: route.query.courseId,
      courseCode: route.query.courseCode
    },
  })
};

const gradingDialogVisible = ref<boolean>(false);

// 选择提交项进行评分
const selectSubmission = (submission: Submission): void => {
  selectedSubmission.value = { ...submission };
  gradingDialogVisible.value = true;
  // 根据选定的提交项初始化评分表单
  grading.score = defaultTo(submission.grade?.score, 0);
  grading.feedback = defaultTo(submission.grade?.feedback, '');
  // 重置代码标签
  activeCodeTab.value = '0';
};

// 关闭当前选定的提交项
const closeSubmission = (): void => {
  selectedSubmission.value = cloneDeep(defaultSubmission);
  gradingDialogVisible.value = false;
  resetGrading();
};

// 查看附件
const viewAttachment = (attachment: Attachment): void => {
  // 在实际应用中，可能会在新窗口打开或者使用预览组件
  window.open(attachment.url, '_blank');
};
//置信度颜色
const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.8) return '#67C23A'; // High confidence - green
  if (confidence >= 0.5) return '#E6A23C'; // Medium confidence - orange
  return '#F56C6C'; // Low confidence - red
};

// Method to use AI feedback
const useAIFeedback = (): void => {
  if (selectedSubmission.value.aiGrading) {
    grading.feedback = selectedSubmission.value.aiGrading.feedbackSuggestions;
    ElMessage.success('AI feedback has been applied');
  }
};
// 重置表单
const resetGrading = (): void => {
  if (selectedSubmission.value) {
    // 重置为当前已有的值
    grading.score = selectedSubmission.value.score || 0;
    grading.feedback = selectedSubmission.value.feedback || '';
  } else {
    // 完全重置
    grading.score = 0;
    grading.feedback = '';
  }
};

// 提交评分
const submitGrading = async (): Promise<void> => {
  // 表单验证
  if (grading.feedback.trim() === '') {
    ElMessage.warning('Please provide feedback for the student');
    return;
  }

  if (!selectedSubmission.value) {
    ElMessage.error('No submission selected');
    return;
  }

  try {
    isSubmitting.value = true;


    // 成功后更新状态 (更新当前选定的项目和列表中的项目)
    const submissionId = selectedSubmission.value.id;
    const data = await apiRequest(`/teachers/grades/${submissionId}`,
        'POST', 'Error submitting grading', {...grading});
    if (!data) {
      return;
    }
    // 更新列表中的项目
    const submissionIndex = submissionsList.findIndex(s => s.id === submissionId);
    if (submissionIndex !== -1) {
      submissionsList[submissionIndex].status = 'pending';
    }

    // 更新当前选定的项目
    selectedSubmission.value.status = 'pending';

    ElMessage.success(`Grading for ${selectedSubmission.value.studentName} has been submitted successfully`);
  } finally {
    isSubmitting.value = false;
  }
};

// 处理分页变化
const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1; // 重置到第一页
};

const handleCurrentChange = (page: number) => {
  currentPage.value = page;
};

// 获取行类名
const getRowClassName = ({ row }: { row: Submission }) => {
  if (selectedSubmission.value && row.id === selectedSubmission.value.id) {
    return 'selected-row';
  }
  return '';
};
// 监听过滤器变化，重置分页
watch(statusFilter, () => {
  filteredSubmissions.value = submissionsList.filter((submission) => {
    if (statusFilter.value === '') return true;
    return submission.status === statusFilter.value;
  });
  currentPage.value = 1;
});
</script>

<style lang="scss" scoped>
@use "@/assets/variables" as vars;

.pagination-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: vars.$spacing-large;

  .cancel-button {
    margin-right: vars.$spacing-base;
  }

  :deep(.el-pagination) {
    flex: 1;
    justify-content: flex-end;
  }
}

.grading-container {
  .submissions-list {
    margin-bottom: vars.$spacing-large;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: vars.$spacing-medium;

      h2 {
        margin: 0;
        font-size: vars.$font-size-large;
        font-weight: vars.$font-weight-bold;
        color: vars.$text-primary;
      }
    }

    .pagination-container {
      margin-top: vars.$spacing-large;
      display: flex;
      justify-content: flex-end;
    }
  }

  .submission-details {
    margin-bottom: vars.$spacing-large;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .submission-header {
        display: flex;
        align-items: center;
        gap: vars.$spacing-base;

        h2 {
          margin: 0;
          font-size: vars.$font-size-large;
          font-weight: vars.$font-weight-bold;
          color: vars.$text-primary;
        }
      }
    }

    .submission-info {
      margin-bottom: vars.$spacing-large;
      padding-bottom: vars.$spacing-base;
      border-bottom: 1px solid vars.$border-light;

      .info-row {
        display: flex;
        margin: vars.$spacing-small 0;

        .info-item {
          flex: 1;
          margin-right: vars.$spacing-large;
          color: vars.$text-secondary;

          strong {
            color: vars.$text-primary;
            font-weight: vars.$font-weight-medium;
          }
        }
      }
    }

    .text-response {
      margin-bottom: vars.$spacing-large;

      h3 {
        font-size: vars.$font-size-base;
        font-weight: vars.$font-weight-medium;
        margin-bottom: vars.$spacing-small;
        color: vars.$text-primary;
      }

      .response-content {
        background-color: vars.$background-lighter;
        padding: vars.$spacing-base;
        border-radius: vars.$border-radius-base;
        white-space: pre-wrap;
        border: 1px solid vars.$border-lighter;
        color: vars.$text-secondary;
      }
    }

    .code-submissions {
      margin-bottom: vars.$spacing-large;

      h3 {
        font-size: vars.$font-size-base;
        font-weight: vars.$font-weight-medium;
        margin-bottom: vars.$spacing-small;
        color: vars.$text-primary;
      }

      .code-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: vars.$spacing-medium;
        color: vars.$text-secondary;

        strong {
          color: vars.$text-primary;
          font-weight: vars.$font-weight-medium;
        }
      }

      .code-display {
        background-color: #282c34;
        color: #abb2bf;
        padding: vars.$spacing-base;
        border-radius: vars.$border-radius-base;
        overflow-x: auto;
        margin: 0;
        box-shadow: vars.$box-shadow-light;
      }
    }

    .attachments {
      margin-bottom: vars.$spacing-large;

      h3 {
        font-size: vars.$font-size-base;
        font-weight: vars.$font-weight-medium;
        margin-bottom: vars.$spacing-small;
        color: vars.$text-primary;
      }
    }

    .grading-section {
      padding-top: vars.$spacing-large;
      border-top: 1px solid vars.$border-lighter;

      h3 {
        font-size: vars.$font-size-base;
        font-weight: vars.$font-weight-medium;
        margin-bottom: vars.$spacing-medium;
        color: vars.$text-primary;
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: vars.$spacing-medium;
        margin-top: vars.$spacing-large;
      }
    }
  }

  .empty-state {
    margin-top: vars.$spacing-extra-large;
    color: vars.$text-tertiary;
    text-align: center;
    padding: vars.$spacing-extra-large;
    background-color: vars.$background-lighter;
    border-radius: vars.$border-radius-base;
  }
}

.ai-grading-section {
  margin-bottom: vars.$spacing-large;
  padding: vars.$spacing-large;
  background-color: vars.$background-lighter;
  border-radius: vars.$border-radius-base;
  border: 1px solid vars.$border-light;

  h3 {
    font-size: vars.$font-size-base;
    font-weight: vars.$font-weight-medium;
    margin-bottom: vars.$spacing-small;
    color: vars.$text-primary;
  }

  .ai-disclaimer {
    margin-bottom: vars.$spacing-medium;
  }

  .ai-score-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: vars.$spacing-medium;

    .ai-score-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      background-color: vars.$background-white;
      border-radius: vars.$border-radius-base;
      padding: vars.$spacing-base;
      box-shadow: vars.$box-shadow-light;
      min-width: 100px;

      .ai-score-label {
        font-size: vars.$font-size-small;
        color: vars.$text-tertiary;
        margin-bottom: vars.$spacing-mini;
      }

      .ai-score-value {
        font-size: 24px;
        font-weight: vars.$font-weight-bold;
        color: vars.$primary-color;
      }
    }

    .ai-confidence {
      flex: 1;
      display: flex;
      align-items: center;
      margin-left: vars.$spacing-large;

      .confidence-label {
        margin-right: vars.$spacing-small;
        color: vars.$text-secondary;
        font-size: vars.$font-size-small;
      }

      .confidence-bar {
        flex: 1;
        margin: 0 vars.$spacing-small;
      }

      .confidence-value {
        font-weight: vars.$font-weight-medium;
        min-width: 40px;
      }
    }
  }

  .ai-feedback {
    background-color: vars.$background-white;
    border-radius: vars.$border-radius-base;
    padding: vars.$spacing-base;
    box-shadow: vars.$box-shadow-light;

    .ai-feedback-label {
      font-weight: vars.$font-weight-medium;
      color: vars.$text-primary;
      margin-bottom: vars.$spacing-small;
    }

    .ai-feedback-content {
      color: vars.$text-secondary;
      white-space: pre-line;
      margin-bottom: vars.$spacing-medium;
      padding: vars.$spacing-small;
      background-color: vars.$background-lighter;
      border-radius: vars.$border-radius-small;
      border-left: 3px solid vars.$primary-color;
    }

    .use-ai-feedback {
      margin-top: vars.$spacing-small;
    }
  }
}

// 选中行的样式
:deep(.selected-row) {
  background-color: vars.$background-info-light !important;
  border-left: 3px solid vars.$primary-color;
}
</style>