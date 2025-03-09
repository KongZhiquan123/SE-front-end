<template>
  <el-main class="class-info-container">
    <div class="info-section">
      <h2>Course Materials</h2>
      <el-card v-for="material in courseMaterials"
               :key="material.id"
               class="material-card">
        <div class="material-header">
          <h3>{{ material.title }}</h3>
          <el-tag size="small">{{ material.type }}</el-tag>
        </div>

        <p class="material-description">{{ material.description }}</p>

        <div class="attachments-section" v-if="material.attachments?.length">
          <h4>Attachments:</h4>
          <el-card v-for="file in material.attachments"
                   :key="file.id"
                   class="attachment-card">
            <div class="attachment-info">
              <el-icon><Document /></el-icon>
              <span class="filename">{{ file.name }}</span>
              <span class="filesize">{{ file.size }}</span>
              <el-button type="primary" link>Download</el-button>
            </div>
          </el-card>
        </div>
      </el-card>
    </div>
  </el-main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Document } from '@element-plus/icons-vue'
import type {CourseMaterial} from '../../types/interfaces.ts'



const courseMaterials = ref<CourseMaterial[]>([
  {
    id: 1,
    title: 'Course Syllabus',
    type: 'Document',
    description: 'Complete course syllabus including grading criteria and schedule.',
    attachments: [
      { id: 1, name: 'syllabus.pdf', size: '2.3 MB' , url: 'https://example.com/syllabus.pdf'},
      { id: 2, name: 'schedule.xlsx', size: '156 KB' , url: 'https://example.com/schedule.xlsx'}
    ]
  },
  {
    id: 2,
    title: 'Week 1 Materials',
    type: 'Lecture',
    description: 'Introduction to the course topics and basic concepts.',
    attachments: [
      { id: 3, name: 'lecture_slides.pptx', size: '5.1 MB' , url: 'https://example.com/lecture_slides.pptx'},
      { id: 4, name: 'reading_material.pdf', size: '1.8 MB' , url: 'https://example.com/reading_material.pdf'}
    ]
  }
])
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