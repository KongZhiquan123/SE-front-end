<template>
  <el-main class="class-info-container" v-loading="loading">
    <div class="info-section">
      <h2>Course Materials</h2>
      <el-card v-for="material in courseMaterials"
               :key="material.id"
               class="material-card">
        <div class="material-header">
          <h3>{{ material.title }}</h3>
          <el-tag size="large" style="font-size: 20px">{{ material.type }}</el-tag>
        </div>

        <p class="material-description">{{ material.description }}</p>

        <div class="attachments-section" v-if="material.attachments?.length">
          <h4>Attachments:</h4>
          <el-card v-for="file in material.attachments"
                   :key="file.id"
                   class="attachment-card">
            <div class="attachment-info">
              <el-icon size="30px">
                <Document/>
              </el-icon>
              <span class="filename">{{ file.name }}</span>
              <span class="filesize">{{ file.size }}</span>
              <el-button type="primary" link @click="downloadFile(file.url)">Download</el-button>
            </div>
          </el-card>
        </div>
      </el-card>
    </div>
  </el-main>
</template>

<script setup lang="ts">
import {ref} from 'vue'
import {Document} from '@element-plus/icons-vue'
import type {CourseMaterial} from '@/types/interfaces'
import apiRequest from "@/utils/apiUtils";
import {useRoute} from "vue-router";
import downloadFile from "@/utils/downloadFile";
import formatFileSize from "@/utils/formatFileSize";

const courseMaterials = ref<CourseMaterial[]>([])
const route = useRoute()
const loading = ref<boolean>(true)
apiRequest<CourseMaterial[]>(`/students/courses/${route.query.courseId}/resources`)
    .then((data) => {
      if (!courseMaterials) return
      courseMaterials.value = data ?? []
      // 将附件的大小转换为更友好的格式，如 1MB
      courseMaterials.value.forEach(material => {
        material.attachments?.forEach(attachment => {
          attachment.size = formatFileSize(attachment.size)
        })
      })
      loading.value = false
    })
</script>

<style scoped>
.class-info-container {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.material-card {
  width: 100%;
  margin-bottom: 20px;
}

.material-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.material-description {
  margin: 10px 0;
  color: #666;
}

.attachments-section {
  margin-top: 15px;
}

.attachment-card {
  margin: 10px 0;
}

.attachment-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filename {
  flex-grow: 1;
}

.filesize {
  color: #909399;
  margin-right: 10px;
}
</style>