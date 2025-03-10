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

    <el-calendar v-model="currentDate" :range="calendarRange">
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
                  :content="`${task.courseName}: ${task.title} (${task.completed ? 'Completed' : 'Pending'})`"
                  placement="top"
              >
                <div
                    class="task-dot"
                    :class="{
                      'completed': task.completed,
                      'pending': !task.completed,
                      'overdue': isOverdue(task)
                    }"
                    @click="openTaskDetails(task)"
                />
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
        <p><strong>Deadline:</strong> {{ formatDate(selectedTask.deadline) }}</p>
        <p><strong>Description:</strong> {{ selectedTask.description }}</p>
        <p><strong>Status:</strong> {{ selectedTask.completed ? 'Completed' : 'Pending' }}</p>
      </template>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="taskDialogVisible = false">Close</el-button>
          <el-button
              type="primary"
              @click="toggleTaskStatus"
              :disabled="!selectedTask"
          >
            {{ selectedTask?.completed ? 'Mark as Incomplete' : 'Mark as Complete' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </el-main>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue'
import {ArrowLeft, ArrowRight} from "@element-plus/icons-vue";
import type {Task} from '@/types/interfaces.ts'
import {formatDate} from "@/utils/formatDate.ts";

const currentDate = ref(new Date())
const viewType = ref('month')
const taskDialogVisible = ref(false)
const selectedTask = ref<Task | null>(null)

const tasks = ref<Task[]>([
  {
    id: 1,
    title: 'Math Assignment',
    deadline: '2025-03-20',
    completed: false,
    courseId: '1',
    courseName: 'Mathematics',
    description: 'Complete exercises 1-10'
  },
  {
    id: 2,
    title: 'Physics Lab Report',
    deadline: '2025-03-22',
    completed: true,
    courseId: '7',
    courseName: 'Physics',
    description: 'Write lab report for experiment #3'
  },
])

const getTasksForDate = (date: string) => {
  return tasks.value.filter(task => task.deadline === date)
}

const isOverdue = (task: Task) => {
  return !task.completed && new Date(task.deadline) < new Date()
}

const openTaskDetails = (task: Task) => {
  selectedTask.value = task
  taskDialogVisible.value = true
}

const toggleTaskStatus = () => {
  if (selectedTask.value) {
    const task = tasks.value.find(t => t.id === selectedTask.value!.id)
    if (task) {
      task.completed = !task.completed
      selectedTask.value = { ...task }
    }
  }
}
//国外的周日是一周的第一天，所以这里要设置为周日（getDay()返回0-6，0是周日）
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

.task-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  cursor: pointer;
}

.task-dot.completed {
  background-color: #67C23A;
}

.task-dot.pending {
  background-color: #E6A23C;
}

.task-dot.overdue {
  background-color: #F56C6C;
}

:deep(.el-calendar-table .el-calendar-day) {
  height: 100px;
  padding: 8px;
}
</style>