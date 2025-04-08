<template>
  <el-main class="class-info-container" v-loading="loading">
    <div class="info-section">
      <h2 class="page-title">Course Materials</h2>

      <!-- 空状态显示 -->
      <el-empty v-if="!loading && courseMaterials.length === 0"
                description="No course materials available" />

      <TransitionGroup name="list" tag="div" class="materials-grid">
        <el-card v-for="material in courseMaterials"
                 :key="material.id"
                 class="material-card"
                 shadow="hover">
          <div class="material-header">
            <h3 class="material-title">{{ material.title }}</h3>
            <el-tag size="large" :type="getTagType(material.type)" effect="dark">
              {{ material.type }}
            </el-tag>
          </div>

          <p class="material-description">{{ material.description }}</p>

          <div class="attachments-section" v-if="material.attachments?.length">
            <h4 class="attachments-title">
              <el-icon><Folder /></el-icon>
              Attachments ({{ material.attachments.length }})
            </h4>
            <div class="attachments-list">
              <el-card v-for="file in material.attachments"
                       :key="file.id"
                       class="attachment-card"
                       shadow="never">
                <div class="attachment-info">
                  <el-icon size="24px" :color="getFileIconColor(file.name)">
                    <component :is="getFileIcon(file.name)" />
                  </el-icon>
                  <span class="filename">{{ file.name }}</span>
                  <span class="filesize">{{ file.size }}</span>
                  <el-button type="primary"
                             class="download-btn"
                             @click="downloadFile(file.url)">
                    <el-icon><Download /></el-icon>
                    Download
                  </el-button>
                </div>
              </el-card>
            </div>
          </div>
        </el-card>
      </TransitionGroup>

    </div>
  </el-main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  Document,
  Folder,
  Download,
  Picture,
  VideoPlay,
  Film,
  Collection
} from '@element-plus/icons-vue'
import type { CourseMaterial } from '@/types/interfaces'
import apiRequest from "@/utils/apiUtils"
import { useRoute } from "vue-router"
import downloadFile from "@/utils/downloadFile"
import formatFileSize from "@/utils/formatFileSize"

const courseMaterials = ref<CourseMaterial[]>([])
const route = useRoute()
const loading = ref<boolean>(true)

apiRequest<CourseMaterial[]>(`/students/courses/${route.query.courseId}/resources`)
    .then((data) => {
      courseMaterials.value = data ?? []
      // 将附件的大小转换为更友好的格式，如 1MB
      courseMaterials.value.forEach(material => {
        material.attachments?.forEach(attachment => {
          attachment.size = formatFileSize(attachment.size)
        })
      })

      loading.value = false
    })



// 获取文件类型图标
const getFileIcon = (filename: string) => {
  const extension = filename.split('.').pop()?.toLowerCase()

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
    return Picture
  } else if (['mp4', 'mov', 'avi', 'webm'].includes(extension || '')) {
    return VideoPlay
  } else if (['pdf'].includes(extension || '')) {
    return Document
  } else if (['ppt', 'pptx'].includes(extension || '')) {
    return Film
  } else if (['zip', 'rar', '7z'].includes(extension || '')) {
    return Collection
  }

  return Document
}

// 获取文件图标颜色
const getFileIconColor = (filename: string) => {
  const extension = filename.split('.').pop()?.toLowerCase()

  const colorMap: Record<string, string> = {
    'pdf': '#E74C3C',
    'doc': '#3498DB',
    'docx': '#3498DB',
    'xls': '#27AE60',
    'xlsx': '#27AE60',
    'ppt': '#F39C12',
    'pptx': '#F39C12',
    'jpg': '#9B59B6',
    'jpeg': '#9B59B6',
    'png': '#9B59B6'
  }

  return colorMap[extension || ''] || '#409EFF'
}

// 获取标签类型
const getTagType = (materialType: string) => {
  const typeMap: Record<string, string> = {
    'Lecture': 'success',
    'Assignment': 'warning',
    'Reading': 'info',
    'Video': 'danger',
    'Quiz': 'primary'
  }

  return typeMap[materialType] || 'info'
}


</script>

<style lang="scss" scoped>
@use "@/assets/variables.scss" as vars;

.class-info-container {
  padding: vars.$spacing-large;
  height: 100%;
  overflow-y: auto;
  background-color: vars.$background-lighter;
}

.materials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: vars.$spacing-large;
}

.material {
  &-card {
    border-radius: vars.$border-radius-base;
    transition: all 0.3s ease;
    height: 100%;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
    }
  }

  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: vars.$spacing-base;
  }

  &-title {
    margin: 0;
    font-size: vars.$font-size-large;
    color: vars.$text-primary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 70%;
  }

  &-description {
    margin: vars.$spacing-small 0 vars.$spacing-large;
    color: vars.$text-secondary;
    line-height: 1.6;
    font-size: vars.$font-size-base;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 66px;
  }
}

.attachments {
  &-section {
    margin-top: vars.$spacing-base;
    border-top: 1px dashed vars.$border-lighter;
    padding-top: vars.$spacing-small;
  }

  &-title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: vars.$text-secondary;
    font-size: 16px;
    margin-bottom: vars.$spacing-small;
  }

  &-list {
    display: flex;
    flex-direction: column;
    gap: vars.$spacing-small;
  }
}

.attachment {
  &-card {
    margin: 5px 0;
    border: 1px solid vars.$border-lighter;
    background-color: vars.$background-lighter;
  }

  &-info {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 5px;
  }
}

.filename {
  flex-grow: 1;
  font-size: vars.$font-size-base;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.filesize {
  color: vars.$text-tertiary;
  font-size: vars.$font-size-small;
  white-space: nowrap;
}

.download-btn {
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 5px;
}

/* 列表动画效果 */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

@media (max-width: 768px) {
  .materials-grid {
    grid-template-columns: 1fr;
  }

  .material-header {
    flex-direction: column;
    align-items: flex-start;
    gap: vars.$spacing-small;
  }

  .material-title {
    max-width: 100%;
  }

  .attachment-info {
    flex-wrap: wrap;
  }

  .download-btn {
    margin-top: 5px;
    width: 100%;
  }
}
</style>