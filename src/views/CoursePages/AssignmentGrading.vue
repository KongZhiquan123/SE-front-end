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
            <el-option label="Accepted" value="accepted" />
            <el-option label="Rejected" value="rejected" />
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

    <!-- Selected submission grading view -->
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
            <strong>Attempt Count:</strong> {{ selectedSubmission.attempts }}
          </div>
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

          <el-form-item label="Status" prop="status">
            <el-select v-model="grading.status" placeholder="Select status">
              <el-option label="Accepted" value="accepted" />
              <el-option label="Rejected" value="rejected" />
              <el-option label="Pending" value="pending" />
            </el-select>
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
import { ref, reactive, watch } from 'vue';
import { ElMessage } from 'element-plus';
import {formatDate} from "@/utils/formatDate";
import {Submission, Attachment} from "@/types/interfaces";
import {cloneDeep} from "lodash-es";
import apiRequest from "@/utils/apiUtils";
import {useRoute} from "vue-router";
import {submissionsConversion} from "@/utils/DataFormatConversion";

interface GradingForm {
  score: number;
  feedback: string;
  status: 'pending' | 'accepted' | 'rejected';
}

const submissionsList = reactive<Submission[]>([]);
const filteredSubmissions = ref<Submission[]>([]);
const route = useRoute();
const assignmentId = route.query.assignmentId;
apiRequest<Submission[]>(`/teachers/submissions/assignment/${assignmentId}/latest`).then((data) => {
  submissionsList.push(...submissionsConversion(data));
  filteredSubmissions.value = submissionsList;
})

const defaultSubmission = {
  id: 0,
  submitTime: '',
  status: 'pending',
  attempts: 0,
  textResponse: '',
  codeSubmissions: [],
  attachments: []
}
// UI 状态
const selectedSubmission = ref<Submission>(cloneDeep(defaultSubmission));
const activeCodeTab = ref('0');
const isSubmitting = ref(false);
const statusFilter = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const totalSubmissions = ref(submissionsList.length);

// 表单状态
const grading = reactive<GradingForm>({
  score: 0,
  feedback: '',
  status: 'pending'
});

// 获取状态类型（用于标签颜色）
const getStatusType = (status: string): string => {
  switch (status) {
    case 'accepted': return 'success';
    case 'rejected': return 'danger';
    case 'pending': return 'warning';
    default: return 'info';
  }
};

// 获取状态文本
const getStatusText = (status: string): string => {
  switch (status) {
    case 'accepted': return 'Accepted';
    case 'rejected': return 'Rejected';
    case 'pending': return 'Pending';
    default: return 'Unknown';
  }
};

const gradingDialogVisible = ref<boolean>(false);

// 选择提交项进行评分
const selectSubmission = (submission: Submission): void => {
  selectedSubmission.value = { ...submission };
  gradingDialogVisible.value = true;
  // 根据选定的提交项初始化评分表单
  grading.score = 0;
  grading.feedback = '';
  grading.status = submission.status;

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

// 重置表单
const resetGrading = (): void => {
  if (selectedSubmission.value) {
    // 重置为当前已有的值
    grading.score = selectedSubmission.value.score || 0;
    grading.feedback = selectedSubmission.value.feedback || '';
    grading.status = selectedSubmission.value.status;
  } else {
    // 完全重置
    grading.score = 0;
    grading.feedback = '';
    grading.status = 'pending';
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
    if (!data?.score) {
      return;
    }
    // 更新列表中的项目
    const submissionIndex = submissionsList.findIndex(s => s.id === submissionId);
    if (submissionIndex !== -1) {
      submissionsList[submissionIndex].status = grading.status;
    }

    // 更新当前选定的项目
    selectedSubmission.value.status = grading.status;

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
.grading-container {
  .submissions-list {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;

      h2 {
        margin: 0;
      }
    }

    .pagination-container {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .submission-details {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .submission-header {
        display: flex;
        align-items: center;
        gap: 15px;

        h2 {
          margin: 0;
        }
      }
    }

    .submission-info {
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid #eaeaea;

      .info-row {
        display: flex;
        margin: 8px 0;

        .info-item {
          flex: 1;
          margin-right: 20px;
        }
      }
    }

    .text-response {
      margin-bottom: 20px;

      .response-content {
        background-color: #f9f9f9;
        padding: 15px;
        border-radius: 4px;
        white-space: pre-wrap;
      }
    }

    .code-submissions {
      margin-bottom: 20px;

      .code-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
      }

      .code-display {
        background-color: #282c34;
        color: #abb2bf;
        padding: 15px;
        border-radius: 4px;
        overflow-x: auto;
        margin: 0;
      }
    }

    .attachments {
      margin-bottom: 20px;
    }

    .grading-section {
      padding-top: 20px;
      border-top: 1px solid #eaeaea;

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 20px;
      }
    }
  }

  .empty-state {
    margin-top: 40px;
  }
}

// 选中行的样式
:deep(.selected-row) {
  background-color: #f0f9ff !important;
}
</style>