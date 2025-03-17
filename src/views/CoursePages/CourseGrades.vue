<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Grade } from '@/types/interfaces'
import {ChatLineRound, Document, View, Warning, Timer, InfoFilled} from "@element-plus/icons-vue";
import {formatDate} from "@/utils/formatDate";
import apiRequest from "@/utils/apiUtils";
import {useRoute} from "vue-router";
const route = useRoute()
const activeTab = ref('all')
const sortBy = ref<'dueDate'|'score'|'title'>('dueDate')
const sortOrder = ref<'ascending'|'descending'>('ascending')
const loading = ref<boolean>(true)
const grades = ref<Grade[]>([])
apiRequest<Grade[]>(`/students/courses/courses/${route.query.courseId}`).then(res => {
  if(!grades) return
  grades.value = res ?? []
  loading.value = false
})
loading.value = false

// 自定义排序规则
const filteredGrades = computed(() => {
  return grades.value.filter(
      grade => activeTab.value === 'all' || grade.status === activeTab.value
  ).sort((a, b) => {
    //根据不同的排序字段进行排序
    //对于分数进行数字排序
    if (sortBy.value === 'score') {
      const aScore = a.score ?? -1
      const bScore = b.score ?? -1
      return sortOrder.value === 'ascending' ? aScore - bScore : bScore - aScore
    }
    //对于日期进行时间戳排序
    if (sortBy.value === 'dueDate') {
      const aDueDate = new Date(a.dueDate).getTime()
      const bDueDate = new Date(b.dueDate).getTime()
      return sortOrder.value === 'ascending' ? aDueDate - bDueDate : bDueDate - aDueDate
    }
    //对于字符串进行字典排序
    const aValue = a[sortBy.value]
    const bValue = b[sortBy.value]
    return sortOrder.value === 'ascending'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
  })
})

// 计算总成绩
const calculateGrade = computed(() => {
  const gradedThings = grades.value.filter(a => a.status === 'graded')
  const totalEarned = gradedThings.reduce((sum, a) => sum + (a.score ?? 0), 0)
  const totalPossible = gradedThings.reduce((sum, a) => sum + a.maxScore, 0)
  return ((totalEarned / totalPossible) * 100).toFixed(2)
})

// 获取成绩等级
const getGradeLevel = (score: number) => {
  if (score >= 90) return { label: 'A', color: '#67C23A' }
  if (score >= 80) return { label: 'B', color: '#409EFF' }
  if (score >= 70) return { label: 'C', color: '#E6A23C' }
  if (score >= 60) return { label: 'D', color: '#F56C6C' }
  return { label: 'F', color: '#F56C6C' }
}

// 计算成绩等级
const gradeLevel = computed(() => {
  const score = parseFloat(calculateGrade.value)
  return getGradeLevel(score)
})

// 控制详情抽屉
const detailsDrawer = ref(false)
const currentGrade = ref<Grade | null>(null)

const showDetails = (row: Grade) => {
  currentGrade.value = row
  detailsDrawer.value = true
}
</script>

<template>
  <el-main class="grades-container">
    <div class="header">
      <h2>Your Academic Progress</h2>
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
            <el-tag :type="row.status === 'graded' ? 'success' :
                        row.status === 'submitted' || row.status === 'appealed' ? 'warning' :
                        row.status === 'upcoming' ? 'info' : 'danger'"
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

              <el-timeline-item
                  v-if="currentGrade.gradedDate"
                  timestamp="Graded"
                  type="warning"
              >
                {{ formatDate(currentGrade.gradedDate) }}
              </el-timeline-item>

              <el-timeline-item
                  v-if="currentGrade.appealTime"
                  timestamp="Appeal Submitted"
                  type="danger"
              >
                {{ formatDate(currentGrade.appealTime) }}
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
              <el-button type="primary">Start Assignment</el-button>
              <el-button>View Instructions</el-button>
            </div>
          </el-card>
        </div>
      </template>
    </el-drawer>
  </el-main>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.overall-grade {
  display: flex;
  align-items: center;
  gap: 16px;
  background-color: white;
  padding: 10px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

:deep(.el-tabs__content) {
  display: none;
}

.grade-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 24px;
  font-weight: bold;
}

.grade-info {
  display: flex;
  flex-direction: column;
}

.grade-percent {
  font-size: 22px;
  font-weight: bold;
  color: #303133;
}

.grade-label {
  font-size: 14px;
  color: #909399;
}

.grade-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.filters {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.sort-controls {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.sort-select, .sort-order {
  width: 150px;
}

.grade-table {
  border-radius: 8px;
  overflow: hidden;
}

.grade-table :deep(.el-table__row) {
  cursor: pointer;
  transition: background-color 0.3s;
}

.grade-table :deep(.el-table__row:hover) {
  background-color: #f0f9ff !important;
}

.assignment-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon {
  color: #909399;
}

.score-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.score-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.score-value {
  font-size: 12px;
  color: #606266;
}

/* 抽屉样式 */
.grade-details-drawer :deep(.el-drawer__header) {
  margin-bottom: 0;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
  font-size: 18px;
  font-weight: bold;
}

.drawer-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-section {
  border-radius: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  color: #303133;
}

/* 成绩概览卡片 */
.score-overview {
  background-color: #f0f9ff;
}

.score-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.big-score {
  font-size: 42px;
  font-weight: bold;
}

.max-score {
  font-size: 20px;
  color: #909399;
  font-weight: normal;
}

.score-percentage {
  padding: 8px 16px;
  border-radius: 20px;
  color: white;
  font-weight: bold;
}

/* 时间线卡片 */
.dates-card :deep(.el-timeline-item__content) {
  font-weight: bold;
}

/* 反馈卡片 */
.feedback-text {
  white-space: pre-line;
  line-height: 1.6;
  font-size: 14px;
}

/* 申诉卡片 */
.appeal-status {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.appeal-date {
  color: #909399;
  font-size: 14px;
}

.appeal-content {
  background-color: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
}

.appeal-label {
  font-weight: bold;
  margin-bottom: 8px;
  color: #606266;
}

.appeal-text {
  line-height: 1.6;
}

.appeal-info {
  margin-bottom: 16px;
  color: #606266;
  font-size: 14px;
}

/* 未完成作业卡片 */
.countdown-display {
  text-align: center;
  margin-bottom: 20px;
}

.countdown-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.countdown-timer {
  font-size: 28px;
  font-weight: bold;
  color: #409EFF;
}

.assignment-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}
</style>