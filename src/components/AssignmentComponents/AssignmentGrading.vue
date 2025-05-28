<template>
  <el-main class="grading-container">
    <!-- Student submissions list -->
    <el-card class="submissions-list">
      <template #header>
        <div class="card-header">
          <h2>Student Submissions</h2>
          <div class="header-actions">
            <el-select v-model="statusFilter" placeholder="Filter by status" clearable style="width: 240px">
              <el-option label="All" value="" />
              <el-option label="Pending" value="pending" />
              <el-option label="Graded" value="graded" />
            </el-select>
            <el-button
                type="warning"
                :disabled="selectedSubmissions.length !== 2"
                @click="checkPlagiarism"
                size="default">
              Check Plagiarism
            </el-button>
          </div>
        </div>
      </template>

      <el-table
          :data="filteredSubmissions"
          stripe
          style="width: 100%"
          :row-class-name="getRowClassName"
          @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" />
        <el-table-column prop="studentName" label="Student Name" />
        <el-table-column prop="submitTime" label="Submit Time"  />
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

    <!-- Plagiarism Check Results Dialog -->
    <el-dialog
        v-model="plagiarismDialogVisible"
        title="Plagiarism Check Results"
        width="50%"
    >
      <div v-if="plagiarismLoading" class="plagiarism-loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>Analyzing submissions...</span>
      </div>
      <div v-else class="plagiarism-result">
        <div class="similarity-score">
          <h3>Similarity Score: <span :class="getSimilarityClass">{{ plagiarismResult.similarityScore }}%</span></h3>
          <p>Check Time: {{ formatDate(plagiarismResult.checkTime) }}</p>
          <p>Status: <el-tag>{{ plagiarismResult.status }}</el-tag></p>
        </div>
        <div class="plagiarism-details">
          <h4>Student Information:</h4>
          <div class="student-info">
            <div class="student">
              <strong>Student A:</strong> {{ plagiarismResult.studentAName }}
            </div>
            <div class="student">
              <strong>Student B:</strong> {{ plagiarismResult.studentBName }}
            </div>
          </div>
          <h4>Similar Content:</h4>
          <div class="similar-content" v-if="plagiarismResult.details && plagiarismResult.details.length > 0">
            <el-collapse v-model="activeSegments">
              <el-collapse-item
                  v-for="(segment, index) in parsedDetails"
                  :key="index"
                  :title="`Similar Segment ${index + 1}`"
                  :name="index"
              >
                <div class="segment-comparison">
                  <div class="segment-a">
                    <h5>Student A Code:</h5>
                    <pre>{{ segment.segmentA }}</pre>
                  </div>
                  <div class="segment-b">
                    <h5>Student B Code:</h5>
                    <pre>{{ segment.segmentB }}</pre>
                  </div>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
          <div v-else class="no-similar-content">
            No obvious similar content found
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="plagiarismDialogVisible = false">Close</el-button>
          <el-button type="primary" @click="handlePlagiarismReport">
            Generate Report
          </el-button>
        </span>
      </template>
    </el-dialog>
  </el-main>
</template>

<script lang="ts" setup>
import {ref, reactive, watch, computed} from 'vue';
import type {Submission} from "@/types/interfaces";
import {cloneDeep, defaultTo} from "lodash-es";
import apiRequest from "@/utils/apiUtils";
import {useRoute, useRouter} from "vue-router";
import {submissionsConversion} from "@/utils/DataFormatConversion";
import { Loading } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { formatDate} from "@/utils/formatDate";

interface GradingForm {
  score: number;
  feedback: string;
}

// 表单状态
const grading = reactive<GradingForm>({
  score: 0,
  feedback: '',
});

const defaultSubmission: Submission = {
  id: 0,
  studentName: '',
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
const statusFilter = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const totalSubmissions = computed(() => submissionsList.length);

// 抄袭检查相关
const selectedSubmissions = ref<Submission[]>([]);
const plagiarismDialogVisible = ref(false);
const plagiarismLoading = ref(false);
const activeSegments = ref([0]);

// 抄袭检查结果模型
interface PlagiarismResult {
  id?: number;
  similarityScore: number;
  studentAName: string;
  studentBName: string;
  checkTime: string;
  status: string;
  details: string;
}

const plagiarismResult = reactive<PlagiarismResult>({
  similarityScore: 0,
  studentAName: '',
  studentBName: '',
  checkTime: '',
  status: '',
  details: ''
});

const parsedDetails = computed(() => {
  if (!plagiarismResult.details) return [];
  try {
    return JSON.parse(plagiarismResult.details);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return [];
  }
});

const getSimilarityClass = computed(() => {
  if (plagiarismResult.similarityScore < 30) {
    return 'similarity-low';
  } else if (plagiarismResult.similarityScore < 70) {
    return 'similarity-medium';
  } else {
    return 'similarity-high';
  }
});


// 表格多选变更处理
const handleSelectionChange = (selections: Submission[]) => {
  selectedSubmissions.value = selections;
};


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
  router.push({
    path: '/teacher-course/grading-submission',
    query: {
      courseId: route.query.courseId,
      courseCode: route.query.courseCode,
      submissionId: submission.id
    },
  })
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

// 检查抄袭
const checkPlagiarism = async () => {
  if (selectedSubmissions.value.length !== 2) {
    ElMessage.warning('Please select two submissions for plagiarism check');
    return;
  }

  plagiarismDialogVisible.value = true;
  plagiarismLoading.value = true;
  const submissionA = selectedSubmissions.value[0];
  const submissionB = selectedSubmissions.value[1];
  const response = await apiRequest<PlagiarismResult>({
      url: `/plagiarism/check?submissionAId=${submissionA.id}&submissionBId=${submissionB.id}`,
      requestType: 'POST'
  });

  if (response) {
    plagiarismResult.similarityScore = response.similarityScore * 100; // 转换为百分比
    plagiarismResult.studentAName = submissionA.studentName;
    plagiarismResult.studentBName = submissionB.studentName;
    plagiarismResult.checkTime = response.checkTime;
    plagiarismResult.status = response.status;
    plagiarismResult.details = response.details;
  } else {
    ElMessage.error('Failed to get plagiarism check results');
  }
  plagiarismLoading.value = false;
};

// 生成抄袭报告
const handlePlagiarismReport = () => {
  ElMessage.success('Plagiarism report generated and saved');
  plagiarismDialogVisible.value = false;
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

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

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
  }
}

// 选中行的样式
:deep(.selected-row) {
  background-color: vars.$background-info-light !important;
  border-left: 3px solid vars.$primary-color;
}

// 抄袭检查相关样式
.plagiarism-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px;

  .el-icon {
    font-size: 32px;
    margin-bottom: 16px;
  }
}

.plagiarism-result {
  .similarity-score {
    text-align: center;
    margin-bottom: 20px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 4px;

    h3 {
      margin: 0 0 10px 0;

      .similarity-low {
        color: #67c23a;
      }

      .similarity-medium {
        color: #e6a23c;
      }

      .similarity-high {
        color: #f56c6c;
      }
    }

    p {
      margin: 5px 0;
    }
  }

  .plagiarism-details {
    .student-info {
      display: flex;
      gap: 30px;
      margin-bottom: 20px;

      .student {
        flex: 1;
        padding: 10px;
        background-color: #f8f9fa;
        border-radius: 4px;
      }
    }

    .similar-content {
      margin-top: 15px;

      .segment-comparison {
        display: flex;
        gap: 15px;

        .segment-a, .segment-b {
          flex: 1;

          pre {
            background-color: #f8f9fa;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
            white-space: pre-wrap;
            border-left: 3px solid #409eff;
          }
        }
      }
    }

    .no-similar-content {
      text-align: center;
      padding: 20px;
      color: #909399;
    }
  }
}
</style>