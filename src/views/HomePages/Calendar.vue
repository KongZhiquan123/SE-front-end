<template>
  <el-main class="calendar-container">
    <el-row class="calendar-header">
      <el-col :span="12">
        <h2>Assignment Calendar</h2>
      </el-col>
      <el-col :span="12" class="header-controls">
        <el-radio-group v-model="viewType" size="large">
          <el-radio-button value="month">Month</el-radio-button>
          <el-radio-button value="week">Week</el-radio-button>
        </el-radio-group>
      </el-col>
    </el-row>

    <el-card v-if="loading" class="loading-card">
      <el-skeleton :rows="6" animated />
    </el-card>

    <el-calendar v-else v-model="currentDate" :range="calendarRange">
      <template #header="{ date }">
        <span>{{ date }}</span>
        <el-button-group>
          <el-button @click="changeDate('prev')">
            <el-icon><ArrowLeft /></el-icon>
            {{ viewType === 'month' ? 'Prev Month' : 'Prev Week' }}
          </el-button>
          <el-button @click="changeDate('today')">Today</el-button>
          <el-button @click="changeDate('next')">
            {{ viewType === 'month' ? 'Next Month' : 'Next Week' }}
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </el-button-group>
      </template>
      <template #date-cell="{ data }">
        <div class="calendar-cell">
          <p>{{ data.day.split('-').slice(2).join('') }}</p>
          <div class="task-dots">
            <template v-for="task in getTasksForDate(data.day)" :key="task.id">
              <el-tooltip
                  :content="`${task.courseName}: ${task.title} (Due Date: ${task.deadline})`"
                  placement="top"
              >
                <div
                    class="task-item"
                    :class="{ 'overdue': isOverdue(task) }"
                    @click="openTaskDetails(task)"
                >
                  {{ task.title }}
                </div>
              </el-tooltip>
            </template>
          </div>
        </div>
      </template>
    </el-calendar>

    <el-dialog
        v-model="taskDialogVisible"
        :title="selectedTask?.title"
        width="30%"
    >
      <template v-if="selectedTask">
        <p><strong>Class:</strong> {{ selectedTask.courseName }}</p>
        <p><strong>Deadline:</strong> {{ selectedTask.deadline }}</p>
        <p><strong>Description:</strong> {{ selectedTask.description }}</p>
      </template>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="goToAssignment" :disabled="isOverdue(selectedTask)">Go to Finish Assignment</el-button>
          <el-button @click="taskDialogVisible = false">Close</el-button>
        </span>
      </template>
    </el-dialog>
  </el-main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowLeft, ArrowRight } from "@element-plus/icons-vue";
import type { Task } from '@/types/interfaces.d.ts'
import apiRequest from "@/utils/apiUtils";
import {useRouter} from "vue-router";
import {ElMessage} from "element-plus";

const router = useRouter();
const currentDate = ref(new Date())
const viewType = ref('month')
const taskDialogVisible = ref(false)
const selectedTask = ref<Task | null>(null)
const loading = ref(true)

// 使用对象存储任务，键为日期字符串，值为该日期的任务数组
const tasksByDate = ref<Record<string, Task[]>>({})
const formatDateToYYYYMMDD = (isoString: string): string => {
  const date = new Date(isoString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// 加载日历事件
const loadCalendarEvents = async () => {
  loading.value = true
  const events = await apiRequest<Task[]>("/calendar/events")
  if (events === null) {
    loading.value = false
    return
  }
  // 重置并按日期组织任务
  tasksByDate.value = {}
  events.forEach((task: Task) => {
    task.deadline = formatDateToYYYYMMDD(task.deadline)
    if (!tasksByDate.value[task.deadline]) {
      tasksByDate.value[task.deadline] = []
    }
    tasksByDate.value[task.deadline].push(task)
  })
  loading.value = false
}

loadCalendarEvents()

const getTasksForDate = (date: string) => {
  return tasksByDate.value[date] || []
}

const isOverdue = (task: Task) => {
  if (!task || !task.deadline) return true
  return new Date(task.deadline) < new Date()
}
const goToAssignment = () => {
  if (!selectedTask.value) {
    ElMessage.warning('No task selected or task details not available.')
    return
  }
  if (isOverdue(selectedTask.value)) {
    ElMessage.warning('This task is overdue, you cannot submit it.')
    return;
  }
  const path = selectedTask.value?.assignmentType === 'code'
      ? '/code-edit-and-run/code-edit'
      : '/student-course/submit-assignments'
  router.push({
    path: path,
    query: {assignmentId: selectedTask.value.assignmentId,
      courseId: selectedTask.value.courseId,
      courseCode: selectedTask.value.courseCode}
  })
}
const openTaskDetails = (task: Task) => {
  selectedTask.value = task
  taskDialogVisible.value = true
}

// 国外的周日是一周的第一天，所以这里要设置为周日（getDay()返回0-6，0是周日）
const calendarRange = computed((): Date[] | undefined => {
  if (viewType.value === 'week') {
    const start = new Date(currentDate.value)
    start.setDate(start.getDate() - start.getDay()) // 设置为本周的周日
    const end = new Date(start)
    end.setDate(start.getDate() + 6) // 设置为本周的周六
    return [start, end]
  }
  return undefined // 月视图返回 undefined, el-calendar 会自动计算
})

const changeDate = (type: 'prev' | 'today' | 'next') => {
  const newDate = new Date(currentDate.value)
  const offset = viewType.value === 'week' ? 7 : 30

  switch (type) {
    case 'prev':
      newDate.setDate(newDate.getDate() - offset)
      break
    case 'next':
      newDate.setDate(newDate.getDate() + offset)
      break
    case 'today':
      newDate.setTime(new Date().getTime())
      break
  }
  currentDate.value = newDate
}
</script>

<style scoped>
.calendar-container {
  padding: 20px;
}

.calendar-header {
  margin-bottom: 20px;
}

.header-controls {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.calendar-cell {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.task-dots {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}
.task-item {
  background-color: #ecf5ff;
  color: #409eff;
  font-size: 10px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  border-left: 3px solid #409eff;
}

.task-item.overdue {
  background-color: #fef0f0;
  color: #f56c6c;
  border-left-color: #f56c6c;
}
.loading-card {
  margin: 20px 0;
  padding: 20px;
}

:deep(.el-calendar-table .el-calendar-day) {
  height: 100px;
  padding: 8px;
}
</style>