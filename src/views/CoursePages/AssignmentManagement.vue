<template>
  <el-main>
  <el-card class="assignment-list">
    <div class="header">
      <h2 class="page-title">Assignment Management</h2>
      <el-button type="primary" @click="createAssignment">Add Assignment</el-button>
    </div>

    <el-table :data="assignments" border stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="title" label="Title" />
      <el-table-column prop="type" label="Type" width="120" />
      <el-table-column prop="dueDate" label="Due Date" width="180">
        <template #default="{ row }">
          {{ formatDate(row.dueDate) }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="Status" width="120">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Operations" width="250">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="updateAssignment(row.id)">Update</el-button>
          <el-button type="danger" size="small" @click="deleteAssignment(row)">Delete</el-button>
          <el-button type="warning" size="small"
                     @click="gradeAssignment(row.id)">
            Grade
          </el-button>
        </template>
      </el-table-column>
    </el-table>


  </el-card>
  </el-main>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { formatDate} from "@/utils/formatDate";
import type { Assignment } from '@/types/interfaces';
import request from "@/utils/request";
import {useRoute, useRouter} from "vue-router";

const router = useRouter();
const assignments = ref<Assignment[]>([]);

const route = useRoute();
const courseId = route.query.courseId;

// 获取作业
const fetchAssignments = async () => {
  try {
    const {data} = await request.get(`/teachers/assignments/course/${courseId}`);
    assignments.value = data ?? [];
    assignments.value.sort((a: Assignment, b: Assignment) => a.id - b.id); // 按照ID排序
  } catch (error) {
    ElMessage.error('Failed to fetch assignments');
    console.error(error);
  }
};

fetchAssignments();

// 获取作业状态类型，用于显示不同颜色的标签
const getStatusType = (status: Assignment['status']) => {
  const types = {
    open: 'success',
    closed: 'danger',
    upcoming: 'info',
  };
  return types[status] || 'info';
};

const createAssignment = () => {
  router.push({
    path: '/teacher-course/create-assignment',
    query: {
      courseId: route.query.courseId,
      courseCode: route.query.courseCode,
    },
  })
}

const updateAssignment = (id: number) => {
  router.push({
    path: '/teacher-course/update-assignment',
    query: {
      courseId: route.query.courseId,
      courseCode: route.query.courseCode,
      assignmentId: id
    },
  })
}
const gradeAssignment = (id: number) => {
  router.push({
    path: '/teacher-course/grading-assignment',
    query: {
      courseId: route.query.courseId,
      courseCode: route.query.courseCode,
      assignmentId: id
    },
  })
}
// Delete assignment
const deleteAssignment = (assignment: Assignment) => {
  ElMessageBox.confirm(
      `Are you sure you want to delete "${assignment.title}"?`,
      'Warning',
      {
        confirmButtonText: 'OK',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
  )
      .then(async () => {
        try {
          await request.delete(`/teachers/assignments/${assignment.id}`);
          ElMessage.success('Assignment deleted successfully');
          assignments.value = assignments.value.filter((a) => a.id !== assignment.id);
        } catch (error) {
          ElMessage.error('Failed to delete assignment');
          console.error(error);
        }
      })
      .catch(() => {
        console.log('Delete canceled');
      });
};

</script>

<style lang="scss" scoped>
.assignment-list {
  padding: 20px;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
}
</style>