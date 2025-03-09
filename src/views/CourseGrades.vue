<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Grade } from '../types/interfaces.ts'

const activeTab = ref('all')
const sortBy = ref('dueDate')
const sortOrder = ref('ascending')
const assignments = ref<Grade[]>([
  {
    id: 1,
    name: 'Midterm Exam',
    type: 'Exam',
    score: 90,
    maxScore: 100,
    dueDate: '2024-03-15',
    submittedDate: '2024-03-15',
    gradedDate: '2024-03-18',
    feedback: 'Great job!',
    appealReason: null,
    appealTime: null,
    status: 'graded',
  },
  {
    id: 2,
    name: 'Final Project',
    type: 'Project',
    score: null,
    maxScore: 100,
    dueDate: '2024-04-20',
    submittedDate: null,
    gradedDate: null,
    feedback: null,
    appealReason: null,
    appealTime: null,
    status: 'upcoming'
  },
])

// Format date function
const formatDate = (dateString: string | null) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString()
}

//自定义排序规则
const filteredAssignments = computed(() => {
  //浅拷贝assignments数组，避免直接修改assignments
  let filtered = [...assignments.value]

  if (activeTab.value !== 'all') {
    filtered = filtered.filter(a => a.status === activeTab.value)
  }

  return filtered.sort((a, b) => {
    //如果Assignment对象的sortBy.value属性为null或者undefined，则默认为空字符串
    //as keyof Assignment表示断言sortBy.value的类型是Assignment的key
    const aValue = a[sortBy.value as keyof Grade] ?? ''
    const bValue = b[sortBy.value as keyof Grade] ?? ''

    //根据sortBy.value的值进行排序，一种是字符串，一种是数字
    if (sortBy.value === 'score') {
      const aScore = a.score ?? -1
      const bScore = b.score ?? -1
      return sortOrder.value === 'ascending' ? aScore - bScore : bScore - aScore
    }

    const aStr = String(aValue)
    const bStr = String(bValue)
    return sortOrder.value === 'ascending'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr)
  })
})

//也许计算总成绩时需要加上权重，这里只是简单的计算
const calculateGrade = computed(() => {
  const gradedAssignments = assignments.value.filter(a => a.status === 'graded')
  const totalEarned = gradedAssignments.reduce((sum, a) => sum + (a.score ?? 0), 0)
  const totalPossible = gradedAssignments.reduce((sum, a) => sum + a.maxScore, 0)
  return ((totalEarned / totalPossible) * 100).toFixed(2)
})
</script>

<template>
  <el-main class="grades-container">
    <div class="header">
      <h2>Your Grades</h2>
      <div class="overall-grade">
        Overall Grade: {{ calculateGrade }}
      </div>
    </div>

    <div class="filters">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="All" name="all" />
        <el-tab-pane label="Graded" name="graded" />
        <el-tab-pane label="Upcoming" name="upcoming" />
        <el-tab-pane label="Submitted" name="submitted" />
      </el-tabs>

      <el-select v-model="sortBy" placeholder="Sort by" class="sort-select">
        <el-option label="Due Date" value="dueDate" />
        <el-option label="Score" value="score" />
        <el-option label="Name" value="name" />
      </el-select>

      <el-select v-model="sortOrder" class="sort-order">
        <el-option label="Ascending" value="ascending" />
        <el-option label="Descending" value="descending" />
      </el-select>
    </div>

    <el-table :data="filteredAssignments" stripe>
      <el-table-column type="expand">
        <template #default="props">
          <div class="expanded-details">
            <el-descriptions :column="1" label-width="150px" border title="Assignment Details">
              <el-descriptions-item  label="Submitted Date">
                {{ formatDate(props.row.submittedDate) }}
              </el-descriptions-item>
              <el-descriptions-item label="Graded Date">
                {{ formatDate(props.row.gradedDate) }}
              </el-descriptions-item>
              <el-descriptions-item  label="Feedback">
                <template v-if="props.row.feedback">{{ props.row.feedback }}</template>
                <template v-else><span class="no-data">No feedback provided</span></template>
              </el-descriptions-item>
              <el-descriptions-item label-width="" label="Appeal Time">
                {{ formatDate(props.row.appealTime) }}
              </el-descriptions-item>
              <el-descriptions-item label="Appeal Reason">
                <template v-if="props.row.appealReason">{{ props.row.appealReason }}</template>
                <template v-else><span class="no-data">You have not submitted an appeal</span></template>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="Assignment" />
      <el-table-column prop="type" label="Type" width="120" />
      <el-table-column label="Score" width="120">
        <template #default="{ row }">
          {{ row.score === null ? '-' : `${row.score}/${row.totalPoints}` }}
        </template>
      </el-table-column>
      <el-table-column prop="dueDate" label="Due Date" width="120" />
      <el-table-column prop="status" label="Status" width="120">
        <template #default="{ row }">
          <el-tag :type="row.status === 'graded' ? 'success' :
                        row.status === 'submitted' || row.status === 'appealed' ? 'warning' :
                        row.status === 'upcoming' ? 'info' : 'danger'">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>
  </el-main>
</template>

<style scoped>
.grades-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.overall-grade {
  font-size: 18px;
  font-weight: bold;
  color: #409EFF;
}

.filters {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  gap: 20px;
}

.sort-select, .sort-order {
  width: 150px;
}


.expanded-details {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.no-data {
  color: #909399;
  font-style: italic;
}

</style>