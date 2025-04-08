<script setup lang="ts">
import {ref, computed, shallowRef} from 'vue'
import {ElMessage, ElDivider} from 'element-plus'
import {Document, Download, Upload} from "@element-plus/icons-vue";
import {formatDate} from "@/utils/formatDate";
import type {Assignment, Submission} from '@/types/interfaces'
import { capitalize, defaultTo, orderBy, get, filter } from 'lodash-es'
import {useRouter, useRoute} from "vue-router";
import apiRequest from "@/utils/apiUtils";
import formatFileSize from "@/utils/formatFileSize";
import downloadFile from "@/utils/downloadFile";

const router = useRouter()
const route = useRoute()
const assignments = ref<Assignment[]>([])
const submissions = ref<Submission[]>([])
const activeAssignment = shallowRef<Assignment | null>(null)
const filterStatus = ref<string>('all')
const sortBy = ref<'dueDate' | 'title' | 'maxScore'>('dueDate')
const sortOrder = ref<'ascending' | 'descending'>('ascending')
const drawerVisible = ref(false)
const loading = ref<boolean>(true)



apiRequest<Assignment[]>(`students/assignments/course/${route.query.courseId}/active`).then(data => {
  assignments.value = defaultTo(data, []).map(assignment => ({
    ...assignment,
    status: assignment.status.toLowerCase(),
  }))
  loading.value = false;
})

//自定义排序
const filteredAssignments = computed(() => {
  const filtered = filter(assignments.value, assignment =>
      filterStatus.value === 'all' || assignment.status === filterStatus.value
  );
  return orderBy(
      filtered,
      [
        sortBy.value === 'maxScore' ? 'maxScore' :
        sortBy.value === 'dueDate' ? (item) => new Date(item.dueDate).getTime() :
        (item) => item[sortBy.value]?.toLowerCase() // 字符串排序统一转小写
      ],
      [sortOrder.value === 'ascending' ? 'asc' : 'desc']
  );
});
//展示作业历史
const showSubmissionHistory = (assignment: Assignment) => {
  activeAssignment.value = assignment
  apiRequest<Submission[]>(`students/assignments/${assignment.id}/submissions`).then(data => {
    submissions.value =  defaultTo(data,[])
        .sort((a, b) => new Date(a.submitTime).getTime() - new Date(b.submitTime).getTime())
        .map((submission, index) => ({
          ...submission,
          status: submission.status.toLowerCase(),
          attempts: index + 1,
          attachments: submission.contents.filter(content => content.type.toLowerCase() === 'file' && content.file)
              .map(content => ({...content.file, size: formatFileSize(content.file.size)}
          )),
          codeSubmissions: submission.contents.filter(content => content.codeSubmission).map(content => content.codeSubmission)
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

  return get(statusMap, status, 'info')
}
const submitAssignment = (activeAssignmentId: number) => {
  const path = activeAssignment.value.type === 'code'
      ? '/code-edit-and-run/code-edit'
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
              {{ capitalize(row.status) }}
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
              {{ capitalize(activeAssignment.status) }}
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
                      {{ capitalize(submission.status) }}
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
          <el-button size="large" @click="submitAssignment(activeAssignment.id)"
                     type="primary" :disabled="activeAssignment.status !== 'open'">
            <el-icon size="20"><Upload/></el-icon>Submit Assignment
          </el-button>
          <el-button size="large" @click="closeSubmissionPanel">Close</el-button>
        </div>
      </div>
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

.filters {
  display: flex;
  gap: vars.$spacing-base;

  .filter-select,
  .sort-select,
  .sort-order {
    width: 150px;
  }
}

.drawer-content {
  padding: vars.$spacing-large;
}

.assignment {
  &-details {
    margin-bottom: vars.$spacing-large;
  }

  &-attachments {
    .attachment-list {
      margin-top: vars.$spacing-base;
    }
  }

  &-table {
    width: 100%;
  }
}

.attachment {
  &-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: vars.$spacing-small 0;
    border-bottom: 1px solid vars.$border-lighter;

    &:last-child {
      border-bottom: none;
    }
  }

  &-badge {
    margin-left: vars.$spacing-small;
  }
}

.title-cell {
  display: flex;
  align-items: center;
}

.file {
  &-info {
    display: flex;
    align-items: center;
    gap: vars.$spacing-small;
  }

  &-name {
    font-weight: vars.$font-weight-medium;
  }

  &-size {
    color: vars.$text-tertiary;
    font-size: vars.$font-size-small;
  }

  &-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: vars.$spacing-small 0;
    padding: vars.$spacing-small;
    background-color: vars.$background-lighter;
    border-radius: vars.$border-radius-base;
  }
}

.submission {
  &-form,
  &-history {
    margin-top: vars.$spacing-large;
  }

  &-card {
    margin-bottom: vars.$spacing-base;
  }

  &-details {
    display: flex;
    justify-content: space-between;
  }

  &-files {
    margin-top: vars.$spacing-small;
  }
}

h4 {
  margin-bottom: vars.$spacing-base;
  font-size: vars.$font-size-large;
  color: vars.$text-primary;
}

.text-response {
  &-container {
    margin: vars.$spacing-small 0;
  }

  &-content {
    position: relative;
    background-color: vars.$background-lighter;
    border-left: 3px solid vars.$primary-color;

    pre {
      white-space: pre-wrap;
      word-break: break-word;
      font-family: inherit;
      margin: 0;
      padding: vars.$spacing-small vars.$spacing-extra-large vars.$spacing-small vars.$spacing-small;
      max-height: 300px;
      overflow-y: auto;
    }
  }
}

.copy-button {
  position: absolute;
  top: vars.$spacing-small;
  right: vars.$spacing-small;
}
</style>