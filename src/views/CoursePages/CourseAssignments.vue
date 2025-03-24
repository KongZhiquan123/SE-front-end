<script setup lang="ts">
import {ref, computed} from 'vue'
import {ElMessage, ElDivider} from 'element-plus'
import {Document, Download, Upload} from "@element-plus/icons-vue";
import {formatDate} from "@/utils/formatDate";
import type {Assignment, Submission} from '@/types/interfaces'
import {useRouter, useRoute} from "vue-router";
import apiRequest from "@/utils/apiUtils";
import formatFileSize from "@/utils/formatFileSize";
import downloadFile from "@/utils/downloadFile";

const router = useRouter()
const route = useRoute()
const assignments = ref<Assignment[]>([])
const submissions = ref<Submission[]>([])
const activeAssignment = ref<Assignment | null>(null)
const filterStatus = ref<string>('all')
const sortBy = ref<'dueDate' | 'title' | 'maxScore'>('dueDate')
const sortOrder = ref<'ascending' | 'descending'>('ascending')
const drawerVisible = ref(false)
const loading = ref<boolean>(true)

apiRequest<Assignment[]>(`students/assignments/course/${route.query.courseId}/active`).then(data => {
  assignments.value = data ?? []
  assignments.value = assignments.value.map(assignment => ({
    ...assignment,
    status: assignment.status.toLowerCase(),
  }))
  loading.value = false;
})
const filteredAssignments = computed(() => {
  return assignments.value
      .filter(assignment => filterStatus.value == 'all' || assignment.status === filterStatus.value)
      .sort((a, b) => {
        // 分数排序
        if (sortBy.value === 'maxScore') {
          return sortOrder.value === 'ascending'
              ? a.maxScore - b.maxScore
              : b.maxScore - a.maxScore

        }
        //日期排序
        if (sortBy.value === 'dueDate') {
          const aDate = new Date(a.dueDate).getTime()
          const bDate = new Date(b.dueDate).getTime()
          return sortOrder.value === 'ascending'
              ? aDate - bDate
              : bDate - aDate
        }
        //名字字符串排序
        return sortOrder.value === 'ascending'
            ? a[sortBy.value].localeCompare(b[sortBy.value])
            : b[sortBy.value].localeCompare(a[sortBy.value])
      })
})
//展示作业历史
const showSubmissionHistory = (assignment: Assignment) => {
  activeAssignment.value = assignment
  apiRequest<Submission[]>(`students/assignments/${assignment.id}/submissions`).then(data => {
    submissions.value =  (data ?? [])
        .sort((a, b) => new Date(a.submitTime).getTime() - new Date(b.submitTime).getTime())
        .map((submission, index) => ({
          ...submission,
          status: submission.status.toLowerCase(),
          attempts: index + 1,
          attachments: submission.attachments?.map(attachment => ({
            ...attachment,
            size: formatFileSize(attachment.size)
          }))
        })).reverse();
  })
  drawerVisible.value = true
}

const closeSubmissionPanel = () => {
  activeAssignment.value = null
  drawerVisible.value = false
}
//获取状态类型
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    'open': 'success',
    'upcoming': 'info',
    'closed': 'danger',
    'accepted': 'success',
    'pending': 'warning',
    'rejected': 'danger'
  }

  return statusMap[status] || 'info'
}

const getStatusText = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1)
}


const submitAssignment = (activeAssignmentId: number) => {
  const path = activeAssignment.value.type === 'code'
      ? '/code-editor'
      : '/student-course/submit-assignments'
  router.push({
    path: path,
    query: {assignmentId: activeAssignmentId,
      courseId: router.currentRoute.value.query.courseId,
      courseCode: router.currentRoute.value.query.courseCode}
  })
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
      .then(() => ElMessage.success('Text copied to clipboard'))
      .catch(() => ElMessage.error('Failed to copy text'))
}

</script>

<template>
  <el-main>
    <el-card>
      <div class="header">
        <h2 class="page-title">Assignments</h2>

        <div class="filters">
          <el-select v-model="filterStatus" placeholder="Filter by status" class="filter-select">
            <el-option label="All" value="all"/>
            <el-option label="Open" value="open"/>
            <el-option label="Closed" value="closed"/>
            <el-option label="Upcoming" value="upcoming"/>
          </el-select>

          <el-select v-model="sortBy" placeholder="Sort by" class="sort-select">
            <el-option label="Due Date" value="dueDate"/>
            <el-option label="Title" value="title"/>
            <el-option label="Max Score" value="maxScore"/>
          </el-select>

          <el-select v-model="sortOrder" class="sort-order">
            <el-option label="Ascending" value="ascending"/>
            <el-option label="Descending" value="descending"/>
          </el-select>
        </div>
      </div>
      <!-- 作业列表，与CourseGrades.vue中的filterMaterials很相似 -->
      <el-table :data="filteredAssignments" stripe class="assignment-table" v-loading="loading">
        <el-table-column prop="title" label="Title" min-width="200">
          <template #default="{ row }">
            <div class="title-cell">
              <span>{{ row.title }}</span>
              <el-badge v-if="row.attachments?.length" :value="row.attachments.length" type="primary"
                        class="attachment-badge"/>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="Type" width="120"/>
        <el-table-column label="Due Date" width="180">
          <template #default="{ row }">
            {{ formatDate(row.dueDate) }}
          </template>
        </el-table-column>
        <el-table-column label="Max Score" width="100">
          <template #default="{ row }">
            {{ row.maxScore }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="Status" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="180">
          <template #default="{ row }">
            <el-button
                size="small"
                type="primary"
                @click="showSubmissionHistory(row)"
                :disabled="row.status === 'closed'"
            >
              View/Submit
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 作业详情，使用el-drawer组件展示 -->
    <el-drawer
        v-model="drawerVisible"
        direction="rtl"
        size="60%"
        :destroy-on-close="true"
        @close="closeSubmissionPanel"
    >
      <template #header>
        <h3>{{ activeAssignment?.title }}</h3>
      </template>

      <div v-if="activeAssignment" class="drawer-content">
        <el-descriptions :column="1" border class="assignment-details">
          <el-descriptions-item label="Type">{{ activeAssignment.type }}</el-descriptions-item>
          <el-descriptions-item label="Due Date">{{ formatDate(activeAssignment.dueDate) }}</el-descriptions-item>
          <el-descriptions-item label="Max Score">{{ activeAssignment.maxScore }}</el-descriptions-item>
          <el-descriptions-item label="Status">
            <el-tag :type="getStatusType(activeAssignment.status)">
              {{ getStatusText(activeAssignment.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Description">{{ activeAssignment.description }}</el-descriptions-item>
          <el-descriptions-item label="Instructions" v-if="activeAssignment.instructions">
            {{ activeAssignment.instructions }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">Assignment Materials</el-divider>

        <!-- 展示作业需要的附件 -->
        <div class="assignment-attachments">
          <el-empty
              v-if="!activeAssignment.attachments?.length"
              description="No materials provided"
          />
          <el-card v-else shadow="hover" class="attachment-list">
            <div v-for="file in activeAssignment.attachments" :key="file.id" class="attachment-item">
              <div class="file-info">
                <el-icon>
                  <Document/>
                </el-icon>
                <span class="file-name">{{ file.name }}</span>
                <span class="file-size">{{ file.size }}</span>
              </div>
              <el-button size="default" type="primary" text @click="downloadFile(file?.url)" :icon="Download">
                Download
              </el-button>
            </div>
          </el-card>
        </div>

        <el-divider content-position="left">Submission History</el-divider>

        <!-- 提交历史 -->
        <div class="submission-history">
          <el-empty
              v-if="!submissions?.length"
              description="No submissions yet"
          />

          <el-timeline v-else>
            <el-timeline-item
                v-for="submission in submissions"
                :key="submission.id"
                :timestamp="formatDate(submission.submitTime)"
                :type="getStatusType(submission.status)"
            >
              <el-card class="submission-card">
                <div class="submission-details">
                  <div>
                    <strong>Status:</strong>
                    <el-tag size="small" :type="getStatusType(submission.status)">
                      {{ getStatusText(submission.status) }}
                    </el-tag>
                  </div>
                  <div><strong>Attempt:</strong> {{ submission.attempts }}</div>
                </div>

                <el-divider v-if="submission.textResponse"/>
                <div v-if="submission.textResponse" class="text-response-container">
                  <h5>Text Response:</h5>
                  <el-card class="text-response-content" shadow="hover">
                    <pre>{{ submission.textResponse }}</pre>
                    <el-tooltip content="Copy to clipboard" placement="top" :hide-after="1000">
                      <el-button
                          size="default"
                          type="info"
                          text
                          class="copy-button"
                          @click="copyToClipboard(submission.textResponse)"
                      >
                        <el-icon><Document /></el-icon>
                      </el-button>
                    </el-tooltip>
                  </el-card>
                </div>

                <el-divider v-if="submission.attachments?.length"/>
                <div v-if="submission.attachments?.length" class="submission-files">
                  <h5>Submitted Files:</h5>
                  <div v-for="file in submission.attachments" :key="file.id" class="file-item">
                    <el-icon>
                      <Document/>
                    </el-icon>
                    <span>{{ file.name }}</span>
                    <el-button size="small" type="primary" text @click="downloadFile(file?.url)">
                      Download
                    </el-button>
                  </div>
                </div>

              </el-card>
            </el-timeline-item>
          </el-timeline>
        </div>

        <!--此按钮仅用于跳转到提交作业页面-->
        <el-divider content-position="left">Submit Your Work</el-divider>
        <div class="submission-form">
          <el-button size="large" @click="submitAssignment(activeAssignment.id)" type="primary">
            <el-icon size="20"><Upload/></el-icon>Submit Assignment
          </el-button>
          <el-button size="large" @click="closeSubmissionPanel">Close</el-button>
        </div>
      </div>
    </el-drawer>
  </el-main>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filters {
  display: flex;
  gap: 16px;
}

.filter-select, .sort-select, .sort-order {
  width: 150px;
}

.drawer-content {
  padding: 20px;
}

.assignment-details {
  margin-bottom: 24px;
}

.attachment-list {
  margin-top: 16px;
}

.attachment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
}

.attachment-item:last-child {
  border-bottom: none;
}

.title-cell {
  display: flex;
  align-items: center;
}

.attachment-badge {
  margin-left: 8px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-name {
  font-weight: 500;
}

.file-size {
  color: #909399;
  font-size: 12px;
}

.submission-form, .submission-history {
  margin-top: 20px;
}

.assignment-table {
  width: 100%;
}

h4 {
  margin-bottom: 16px;
  font-size: 18px;
  color: #333;
}

.submission-card {
  margin-bottom: 12px;
}

.submission-details {
  display: flex;
  justify-content: space-between;
}

/* 提交的文本的样式 */
.text-response-container {
  margin: 12px 0;
}

.text-response-content {
  position: relative;
  background-color: #f9f9f9;
  border-left: 3px solid #409eff;
}

.text-response-content pre {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  margin: 0;
  padding: 8px 30px 8px 8px;
  max-height: 300px;
  overflow-y: auto;
}

.copy-button {
  position: absolute;
  top: 8px;
  right: 8px;
}

/* 提交的文件的样式 */
.submission-files {
  margin-top: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 8px 0;
  padding: 8px;
  background-color: #f8f8f8;
  border-radius: 4px;
}
</style>