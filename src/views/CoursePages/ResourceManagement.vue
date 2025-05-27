<template>
  <el-main>
    <el-card class="resource-list">
      <div class="header">
        <h2 class="page-title">Resource Management</h2>
        <el-button type="primary" @click="createResource">Add Resource</el-button>
      </div>

      <el-table :data="resources" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="Title" />
        <el-table-column prop="type" label="Type" width="120" />
        <el-table-column prop="uploadTime" label="Upload Time" width="180">
          <template #default="{ row }">
            {{ formatDate(row.uploadTime) }}
          </template>
        </el-table-column>
        <el-table-column label="Operations" width="200">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="updateAssignment(row.id)">View / Update</el-button>
            <el-button type="danger" size="small" @click="deleteAssignment(row)">Delete</el-button>
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
import { Resource } from '@/types/interfaces';
import request from "@/utils/request";
import {useRoute, useRouter} from "vue-router";

const router = useRouter();
const resources = ref<Resource[]>([]);

const route = useRoute();
const courseId = route.query.courseId;



// 获取作业
const fetchResources = async () => {
  try {
    const {data} = await request.get(`/teachers/resources/course/${courseId}`)
    data.sort((a: Resource, b: Resource) => a.id - b.id); // 按照ID排序
    resources.value = data ?? [];
  } catch (error) {
    ElMessage.error('Failed to fetch resources');
    console.error(error);
  }
};

fetchResources();

const createResource = () => {
  router.push({
    path: '/teacher-course/create-resource',
    query: {
      courseId: route.query.courseId,
      courseCode: route.query.courseCode,
    },
  })
}

const updateAssignment = (id: number) => {
  router.push({
    path: '/teacher-course/update-resource',
    query: {
      courseId: route.query.courseId,
      courseCode: route.query.courseCode,
      resourceId: id,
    },
  })
}
// Delete assignment
const deleteAssignment = (resource: Resource) => {
  ElMessageBox.confirm(
      `Are you sure you want to delete "${resource.title}"?`,
      'Warning',
      {
        confirmButtonText: 'OK',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
  )
      .then(async () => {
        try {
          await request.delete(`/teachers/resources/${resource.id}`);
          ElMessage.success('Assignment deleted successfully');
          resources.value = resources.value.filter((a) => a.id !== resource.id);
        } catch (error) {
          ElMessage.error('Failed to delete resource');
          console.error(error);
        }
      })
      .catch(() => {
        console.log('Delete canceled');
      });
};

</script>

<style lang="scss" scoped>
.resource-list {
  padding: 20px;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
}
</style>