<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Grade, Assignment } from '@/types/interfaces'
import { filter, orderBy, sumBy, defaultTo, get } from 'lodash-es'
import {
  ChatLineRound,
  Document,
  View,
  Warning,
  Timer,
  InfoFilled,
  Edit,
  Cpu
} from "@element-plus/icons-vue";
import {formatDate} from "@/utils/formatDate";
import apiRequest from "@/utils/apiUtils";
import {useRoute, useRouter} from "vue-router";
const route = useRoute();
const activeTab = ref<'all'|'graded'|'upcoming'|'submitted'>('all');
const sortBy = ref<'dueDate'|'score'|'title'>('dueDate');
const sortOrder = ref<'ascending'|'descending'>('ascending');
const loading = ref<boolean>(true);
const grades = ref<Grade[]>([]);
apiRequest<Grade[]>(`/students/courses/courses/${route.query.courseId}`).then(res => {
  grades.value = res ?? []
  loading.value = false
})

// 自定义排序规则
const filteredGrades = computed(() => {
  const filtered = filter(
      grades.value,
      grade => activeTab.value === 'all' || grade.status === activeTab.value
  )

  const iteratees = {
    'score': (item) => item.score ?? -1,
    'dueDate': (item) => new Date(item.dueDate).getTime(),
  }

  const iteratee = iteratees[sortBy.value] ||
      ((item) => item[sortBy.value]?.toLowerCase())

  return orderBy(
      filtered,
      [iteratee],
      [sortOrder.value === 'ascending' ? 'asc' : 'desc']
  )
})

// 计算总成绩
const calculateGrade = computed(() => {
  const gradedThings = filter(grades.value, { status: 'graded' })
  const totalEarned = sumBy(gradedThings, item => defaultTo(item.score, 0))
  const totalPossible = sumBy(gradedThings, 'maxScore')

  return ((totalEarned / totalPossible) * 100).toFixed(2)
})
// 获取成绩等级
const getGradeLevel = (score: number) => {
  if (score >= 90) return { label: 'A', color: '#67C23A' }
  if (score >= 80) return { label: 'B', color: '#409EFF' }
  if (score >= 60) return { label: 'C', color: '#E6A23C' }
  return { label: 'D', color: '#F56C6C' }
}

// 计算成绩等级
const gradeLevel = computed(() => {
  const score = parseFloat(calculateGrade.value)
  return getGradeLevel(score)
})


const getStatusTagType = (status: string): string => {
  const statusTagTypeMap: Record<string, string> = {
    'graded': 'success',
    'submitted': 'warning',
    'appealed': 'warning',
    'appealing': 'warning',
    'upcoming': 'info'
  }
  return get(statusTagTypeMap, status, 'info')
}
// 控制详情抽屉
const detailsDrawer = ref(false)
const currentGrade = ref<Grade | null>(null)

const showDetails = (row: Grade) => {
  currentGrade.value = row
  detailsDrawer.value = true
}
const router = useRouter();
const startAssignment = (assignmentId: number) => {
  apiRequest<Assignment>(`/students/assignments/${assignmentId}/details`).then(res => {
    if (!res) {
      return
    }
    const assignmentType = res.type;
    const path = assignmentType === 'code'
        ? '/code-edit-and-run/code-edit'
        : '/student-course/submit-assignments'
    router.push({
      path: path,
      query: {assignmentId: assignmentId,
        courseId: router.currentRoute.value.query.courseId,
        courseCode: router.currentRoute.value.query.courseCode}
    })
  })
}
const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return '#67C23A' // high confidence - green
  if (confidence >= 0.5) return '#E6A23C' // medium confidence - orange
  return '#F56C6C' // low confidence - red
}
</script>

<template>
  <el-main class="grades-container">
    <div class="header">
      <h2 class="page-title">Your Academic Progress</h2>
      <div class="overall-grade">
        <div class="grade-circle" :style="{ backgroundColor: gradeLevel.color }">
          {{ gradeLevel.label }}
        </div>
        <div class="grade-info">
          <div class="grade-percent">{{ calculateGrade }}%</div>
          <div class="grade-label">Overall Grade</div>
        </div>
      </div>
    </div>

    <el-card class="grade-card">
      <div class="filters">
        <el-tabs v-model="activeTab" type="border-card">
          <el-tab-pane label="All Assignments" name="all" />
          <el-tab-pane label="Graded" name="graded" />
          <el-tab-pane label="Upcoming" name="upcoming" />
          <el-tab-pane label="Submitted" name="submitted" />
        </el-tabs>

        <div class="sort-controls">
          <el-select v-model="sortBy" placeholder="Sort by" class="sort-select">
            <el-option label="Due Date" value="dueDate" />
            <el-option label="Score" value="score" />
            <el-option label="Title" value="title" />
          </el-select>

          <el-select v-model="sortOrder" class="sort-order">
            <el-option label="Ascending" value="ascending" />
            <el-option label="Descending" value="descending" />
          </el-select>
        </div>
      </div>

      <el-table :data="filteredGrades" stripe class="grade-table" @row-click="showDetails" v-loading="loading">
        <el-table-column prop="title" label="Assignment or Exam" min-width="180" >
          <template #default="{ row }">
            <div class="assignment-title">
              <el-icon class="icon"><Document /></el-icon>
              <span>{{ row.title }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="Type" width="100">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Score" width="120" align="center">
          <template #default="{ row }">
            <template v-if="row.score !== null">
              <div class="score-display">
                <div class="score-circle" :style="{ backgroundColor: getGradeLevel((row.score/row.maxScore)*100).color }">
                  {{ Math.round((row.score/row.maxScore)*100) }}%
                </div>
                <div class="score-value">{{ row.score }}/{{ row.maxScore }}</div>
              </div>
            </template>
            <el-tag v-else type="info" effect="plain" size="small">Not graded</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Due Date" width="160">
          <template #default="{ row }">
            {{ formatDate(row.dueDate) }}
          </template>
        </el-table-column>
        <el-table-column label="Status" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)"
                    effect="dark" size="small">
              {{ row.status.charAt(0).toUpperCase() + row.status.slice(1) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column width="80" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" text circle @click.stop="showDetails(row)">
              <el-icon size="25"><View /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 详情抽屉 -->
    <el-drawer
        v-model="detailsDrawer"
        :title="currentGrade?.title"
        direction="rtl"
        size="50%"
        class="grade-details-drawer"
    >
      <template v-if="currentGrade">
        <div class="drawer-content">
          <!-- 成绩概览卡片 -->
          <el-card class="detail-section score-overview" shadow="hover" v-if="currentGrade && currentGrade.score !== null">
            <div class="score-header">
              <div class="big-score" :style="{ color: getGradeLevel(((currentGrade.score || 0)/currentGrade.maxScore)*100).color }">
                {{ currentGrade.score }}<span class="max-score">/{{ currentGrade.maxScore }}</span>
              </div>
              <div class="score-percentage" :style="{ backgroundColor: getGradeLevel(((currentGrade.score || 0)/currentGrade.maxScore)*100).color }">
                {{ Math.round(((currentGrade.score || 0)/currentGrade.maxScore)*100) }}%
              </div>
            </div>
          </el-card>

          <!-- AI Grading Card -->
          <el-card
              class="detail-section ai-grading-card"
              shadow="hover"
              v-if="currentGrade && currentGrade.aiGrading"
          >
            <template #header>
              <div class="card-header">
                <el-icon><Cpu /></el-icon>
                <span>AI Assessment</span>
              </div>
            </template>

            <div class="ai-grading-content">
              <div class="ai-score-section">
                <div class="ai-score-container">
                  <div class="ai-score-box">
                    <div class="ai-score-label">AI Suggested Score</div>
                    <div class="ai-score-value">{{ currentGrade.aiGrading.aiScore }}</div>
                  </div>

                  <div class="ai-confidence">
                    <div class="confidence-label">Confidence:</div>
                    <el-progress
                        class="confidence-bar"
                        :percentage="currentGrade.aiGrading.confidence * 100"
                        :color="getConfidenceColor(currentGrade.aiGrading.confidence)"
                        :stroke-width="10"
                    />
                    <div class="confidence-value">{{ Math.round(currentGrade.aiGrading.confidence * 100) }}%</div>
                  </div>
                </div>
              </div>

              <div class="ai-feedback" v-if="currentGrade.aiGrading.feedbackSuggestions">
                <div class="ai-feedback-label">AI Feedback Suggestions:</div>
                <div class="ai-feedback-content">{{ currentGrade.aiGrading.feedbackSuggestions }}</div>
              </div>

              <div class="ai-disclaimer">
                <el-alert
                    type="info"
                    :closable="false"
                    show-icon
                >
                  <div class="disclaimer-text">
                    This is an AI-assisted assessment. The final grade is determined by your instructor.
                  </div>
                </el-alert>
              </div>
            </div>
          </el-card>

          <!-- 时间信息卡片 -->
          <el-card class="detail-section dates-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <el-icon><Timer /></el-icon>
                <span>Timeline</span>
              </div>
            </template>
            <el-timeline>

              <el-timeline-item
                  v-if="currentGrade.appealTime"
                  timestamp="Appeal Submitted"
                  type="danger"
              >
                {{ formatDate(currentGrade.appealTime) }}
              </el-timeline-item>

              <el-timeline-item
                  v-if="currentGrade.gradedDate"
                  timestamp="Graded"
                  type="warning"
              >
                {{ formatDate(currentGrade.gradedDate) }}
              </el-timeline-item>

              <el-timeline-item
                  timestamp="Due Date"
                  :type="new Date(currentGrade.dueDate) < new Date() ? 'primary' : 'info'"
                  :hollow="new Date(currentGrade.dueDate) >= new Date()"
              >
                {{ formatDate(currentGrade.dueDate) }}
              </el-timeline-item>

              <el-timeline-item
                  v-if="currentGrade.submittedDate"
                  timestamp="Submitted"
                  type="success"
              >
                {{ formatDate(currentGrade.submittedDate) }}
              </el-timeline-item>

            </el-timeline>
          </el-card>

          <!-- 反馈卡片 -->
          <el-card class="detail-section feedback-card" shadow="hover" v-if="currentGrade.status === 'graded'">
            <template #header>
              <div class="card-header">
                <el-icon><ChatLineRound /></el-icon>
                <span>Instructor Feedback</span>
              </div>
            </template>
            <div class="feedback-content" v-if="currentGrade.feedback">
              <el-alert
                  type="success"
                  :closable="false"
                  show-icon
              >
                <div class="feedback-text">{{ currentGrade.feedback }}</div>
              </el-alert>
            </div>
            <el-empty v-else description="No feedback provided yet" />
          </el-card>

          <!-- 申诉卡片 -->
          <el-card class="detail-section appeal-card" shadow="hover" v-if="currentGrade.status === 'graded'">
            <template #header>
              <div class="card-header">
                <el-icon><Warning /></el-icon>
                <span>Grade Appeal</span>
              </div>
            </template>
            <div v-if="currentGrade.appealReason">
              <div class="appeal-status">
                <el-tag type="warning">Appeal Submitted</el-tag>
                <div class="appeal-date">{{ formatDate(currentGrade.appealTime) }}</div>
              </div>
              <div class="appeal-content">
                <div class="appeal-label">Your Reason:</div>
                <div class="appeal-text">{{ currentGrade.appealReason }}</div>
              </div>
            </div>
            <div v-else class="appeal-form">
              <p class="appeal-info">If you believe there has been an error in grading, you can submit an appeal.</p>
              <el-button type="primary">Submit Appeal</el-button>
            </div>
          </el-card>

          <!-- 未完成作业卡片 -->
          <el-card class="detail-section upcoming-card" shadow="hover" v-if="currentGrade.status === 'upcoming'">
            <template #header>
              <div class="card-header">
                <el-icon><InfoFilled /></el-icon>
                <span>Assignment Details</span>
              </div>
            </template>
            <div class="countdown-display">
              <div class="countdown-title">Time Remaining</div>
              <div class="countdown-timer">
                {{ Math.max(0, Math.ceil((new Date(currentGrade.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) }} days
              </div>
            </div>
            <div class="assignment-actions">
              <el-button type="primary" @click="startAssignment(currentGrade.id)">
                <el-icon> <Edit/> </el-icon>
                Start Assignment
              </el-button>
            </div>
          </el-card>
        </div>
      </template>
    </el-drawer>
  </el-main>
</template>

<style lang="scss" scoped>
@use "@/assets/variables.scss" as vars;

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: vars.$spacing-large;
}

.overall-grade {
  display: flex;
  align-items: center;
  gap: vars.$spacing-base;
  background-color: vars.$background-white;
  padding: vars.$spacing-small vars.$spacing-base;
  border-radius: vars.$border-radius-base;
  box-shadow: vars.$box-shadow-light;
}

:deep(.el-tabs__content) {
  display: none;
}

.grade-circle {
  width: 60px;
  height: 60px;
  border-radius: vars.$border-radius-circle;
  display: flex;
  justify-content: center;
  align-items: center;
  color: vars.$background-white;
  font-size: vars.$font-size-extra-large;
  font-weight: vars.$font-weight-bold;
}

.grade-info {
  display: flex;
  flex-direction: column;

  .grade-percent {
    font-size: vars.$font-size-large;
    font-weight: vars.$font-weight-bold;
    color: vars.$text-primary;
  }

  .grade-label {
    font-size: vars.$font-size-base;
    color: vars.$text-tertiary;
  }
}

.grade-card {
  margin-bottom: vars.$spacing-base;
  border-radius: vars.$border-radius-base;
}

.filters {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: vars.$spacing-base;

  .sort-controls {
    display: flex;
    gap: vars.$spacing-mini;
    margin-top: vars.$spacing-mini;

    .sort-select, .sort-order {
      width: 150px;
    }
  }
}

.grade-table {
  border-radius: vars.$border-radius-base;
  overflow: hidden;

  :deep(.el-table__row) {
    cursor: pointer;
    transition: background-color vars.$transition-duration;

    &:hover {
      background-color: vars.$background-light !important;
    }
  }

  .assignment-title {
    display: flex;
    align-items: center;
    gap: vars.$spacing-small;

    .icon {
      color: vars.$text-tertiary;
    }
  }

  .score-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: vars.$spacing-mini;

    .score-circle {
      width: 36px;
      height: 36px;
      border-radius: vars.$border-radius-circle;
      display: flex;
      justify-content: center;
      align-items: center;
      color: vars.$background-white;
      font-size: vars.$font-size-small;
      font-weight: vars.$font-weight-bold;
    }

    .score-value {
      font-size: vars.$font-size-small;
      color: vars.$text-secondary;
    }
  }
}

/* Drawer styles */
.grade-details-drawer {
  :deep(.el-drawer__header) {
    margin-bottom: 0;
    padding: vars.$spacing-base vars.$spacing-large;
    border-bottom: 1px solid vars.$border-light;
    font-size: vars.$font-size-large;
    font-weight: vars.$font-weight-bold;
  }

  .drawer-content {
    padding: vars.$spacing-large;
    display: flex;
    flex-direction: column;
    gap: vars.$spacing-large;

    .detail-section {
      border-radius: vars.$border-radius-base;

      .card-header {
        display: flex;
        align-items: center;
        gap: vars.$spacing-small;
        font-weight: vars.$font-weight-bold;
        color: vars.$text-primary;
      }
    }

    /* Score overview card */
    .score-overview {
      background-color: vars.$background-light;

      .score-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .big-score {
          font-size: 42px;
          font-weight: vars.$font-weight-bold;

          .max-score {
            font-size: vars.$font-size-large;
            color: vars.$text-tertiary;
            font-weight: vars.$font-weight-regular;
          }
        }

        .score-percentage {
          padding: vars.$spacing-mini vars.$spacing-base;
          border-radius: 20px;
          color: vars.$background-white;
          font-weight: vars.$font-weight-bold;
        }
      }
    }

    /* Timeline card */
    .dates-card {
      :deep(.el-timeline-item__content) {
        font-weight: vars.$font-weight-bold;
      }
    }

    /* Feedback card */
    .feedback-card {
      .feedback-content {
        .feedback-text {
          white-space: pre-line;
          line-height: 1.6;
          font-size: vars.$font-size-base;
        }
      }
    }

    /* Appeal card */
    .appeal-card {
      .appeal-status {
        display: flex;
        align-items: center;
        gap: vars.$spacing-base;
        margin-bottom: vars.$spacing-large;

        .appeal-date {
          color: vars.$text-tertiary;
          font-size: vars.$font-size-base;
        }
      }

      .appeal-content {
        background-color: vars.$background-light;
        padding: vars.$spacing-small;
        border-radius: vars.$border-radius-small;

        .appeal-label {
          font-weight: vars.$font-weight-bold;
          margin-bottom: vars.$spacing-small;
          color: vars.$text-secondary;
        }

        .appeal-text {
          line-height: 1.6;
        }
      }

      .appeal-info {
        margin-bottom: vars.$spacing-large;
        color: vars.$text-secondary;
        font-size: vars.$font-size-base;
      }
    }

    /* Upcoming assignment card */
    .upcoming-card {
      .countdown-display {
        text-align: center;
        margin-bottom: vars.$spacing-large;

        .countdown-title {
          font-size: vars.$font-size-base;
          color: vars.$text-tertiary;
          margin-bottom: vars.$spacing-small;
        }

        .countdown-timer {
          font-size: 28px;
          font-weight: vars.$font-weight-bold;
          color: vars.$primary-color;
        }
      }

      .assignment-actions {
        display: flex;
        justify-content: center;
        gap: vars.$spacing-base;
      }
    }
  }
}

/* AI评分卡片 */
.ai-grading-card {
  border: 1px solid var(--el-border-color-light);

  .ai-grading-content {
    display: flex;
    flex-direction: column;
    gap: vars.$spacing-medium;

    .ai-score-section {
      margin-bottom: vars.$spacing-base;

      .ai-score-container {
        display: flex;
        align-items: center;
        justify-content: space-between;

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
        padding: vars.$spacing-small;
        background-color: vars.$background-lighter;
        border-radius: vars.$border-radius-small;
        border-left: 3px solid vars.$primary-color;
      }
    }

    .ai-disclaimer {
      margin-top: vars.$spacing-small;

      .disclaimer-text {
        font-size: vars.$font-size-small;
        color: vars.$text-secondary;
      }
    }
  }
}
</style>