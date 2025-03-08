<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Assignment } from '../types/interfaces.ts'

const activeTab = ref('all')
const sortBy = ref('dueDate')
const sortOrder = ref('ascending')
const assignments = ref<Assignment[]>([
  {
    id: 1,
    name: 'Midterm Exam',
    type: 'Exam',
    score: 90,
    totalPoints: 100,
    dueDate: '2024-03-15',
    submittedDate: '2024-03-15',
    gradedDate: '2024-03-18',
    status: 'graded'
  },
  {
    id: 2,
    name: 'Final Project',
    type: 'Project',
    score: null,
    totalPoints: 100,
    dueDate: '2024-04-20',
    submittedDate: null,
    gradedDate: null,
    status: 'upcoming'
  },
])
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
    const aValue = a[sortBy.value as keyof Assignment] ?? ''
    const bValue = b[sortBy.value as keyof Assignment] ?? ''

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
  const totalPossible = gradedAssignments.reduce((sum, a) => sum + a.totalPoints, 0)
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
                        row.status === 'submitted' ? 'warning' :
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
</style>