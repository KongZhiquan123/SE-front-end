<script setup lang="ts">
import {ref, computed, onBeforeUnmount} from 'vue'
import { ElMessage } from 'element-plus'
import type {Attachment, CodeSubmission, Submission} from "@/types/interfaces";
import {capitalize} from "lodash-es";
import {Document, Picture, Folder, Download, CoffeeCup, Edit, Plus, MagicStick} from '@element-plus/icons-vue'
import apiRequest from "@/utils/apiUtils";
import {useRoute} from "vue-router";
import {submissionConversion} from "@/utils/DataFormatConversion";
import GradingDialog from '../Dialogs/GradeDialog.vue';
import downloadFile from "@/utils/downloadFile";
import convertWordToHtml from "@/utils/convertWordToHtml";
const submission = ref<Submission>({
  id: 0,
  studentName: '',
  submitTime: '',
  status: 'pending',
  textResponse: '',
  attachments: [],
  codeSubmissions: [],
})
const route = useRoute();
apiRequest<Submission>(`/teachers/submissions/${route.query.submissionId}`).then((res) => {
  submission.value = res ?? submission.value;
  submission.value = submissionConversion(submission.value);
  if (submission.value.grade) {
    submission.value.grade.score = submission.value.grade.score ?? 0;
    submission.value.grade.maxScore = submission.value.grade.maxScore || 100;
  }
  //初始化当前附件和代码提交，以便预览
}).then(() => {
    if (submission.value.attachments && submission.value.attachments.length > 0) {
      currentAttachment.value = submission.value.attachments[0]
      loadBlob(submission.value.attachments[0])
    }

    if (submission.value.codeSubmissions && submission.value.codeSubmissions.length > 0) {
      currentCodeSubmission.value = submission.value.codeSubmissions[0]
    }
}).catch(() => {
  ElMessage.error('Failed to load submission data');
})
// UI 状态
const currentAttachment = ref<Attachment | null>(null)
const showCode = ref(false)
const currentCodeSubmission = ref<CodeSubmission | null>(null)
const gradingDialog = ref<InstanceType<typeof GradingDialog> | null>(null)
const loadingAIGrading = ref<boolean>(false)
const aiModels = [
  { label: 'Qwen 3 (32B)', value: 'qwen3-32b' },
  { label: 'Qwen 3 (235B)', value: 'qwen3-235b-a22b' },
  { label: 'QWQ (32B)', value: 'qwq-32b' },
  { label: 'DeepSeek (32B)', value: 'deepseek-r1-distill-qwen-32b' }
]
const selectedModel = ref('qwen3-32b')

onBeforeUnmount(() => {
  if (blobUrl.value) {
    window.URL.revokeObjectURL(blobUrl.value);
    blobUrl.value = null
  }
})
// Calculate AI confidence level display
const confidenceLevel = computed(() => {
  if (!submission.value.aiGrading) return ''

  const confidence = submission.value.aiGrading.confidence
  if (confidence >= 0.8) return 'High'
  if (confidence >= 0.5) return 'Medium'
  return 'Low'
})

const blobUrl = ref<string | null>(null)
const loadingBlob = ref<boolean>(false)
const loadBlob = async (attachment: Attachment) => {
  if (!attachment || !attachment.id) return null;
  loadingBlob.value = true
  try {
    const blob = await apiRequest<Blob>({
      url: `/attachments/${attachment.id}/download`,
      requestType: 'GET',
      config: {
        responseType: 'blob'
      }
    })
    if (!blob) return null

    // 如果有之前的 URL，先释放它
    if (blobUrl.value) {
      window.URL.revokeObjectURL(blobUrl.value)
      blobUrl.value = null
    }

    // 检查是否为 Word 文档类型 (.doc 或 .docx)
    const fileName = attachment.name.toLowerCase()
    if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      const htmlUrl = await convertWordToHtml(blob)
      blobUrl.value = htmlUrl
      return htmlUrl
    } else {
      // 其他类型的文件直接创建 URL
      blobUrl.value = window.URL.createObjectURL(blob)
      return blobUrl.value
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    ElMessage.error('Failed to load file')
    return null
  } finally {
    loadingBlob.value = false;
  }
}
const showAttachment = async (attachment: Attachment) => {
  currentAttachment.value = attachment
  showCode.value = false

  // 如果是可预览的文件，预加载blob
  if (isPreviewable.value) {
    await loadBlob(attachment)
  }
}

// Show code submission
const showCodeSubmission = (codeSubmission: CodeSubmission) => {
  currentCodeSubmission.value = codeSubmission
  showCode.value = true
}

// Get file icon based on extension
const getFileIcon = (fileName: string) => {
  const fileIconMap: Record<string, string> = Object.fromEntries([
    // 文档类
    ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].map(ext => [ext, Document]),
    // 图片类
    ['jpg', 'jpeg', 'png', 'gif'].map(ext => [ext, Picture]),
    // 压缩文件
    ['zip', 'rar'].map(ext => [ext, Folder])
  ].flat())
  const extension = fileName.split('.').pop()?.toLowerCase() || ''
  return fileIconMap[extension] || Document // 默认返回Document图标
}

// Get color for status badge
const getStatusColor = (status: string): string => {
  const statusColorMap: Record<string, string> = {
    graded: 'success',
    pending: 'warning',
    draft: 'info',
  }
  return statusColorMap[status] || 'info'
}

// Get language display name for code submission
const getLanguageDisplay = (language: string): string => {
  const languageDisplayMap: Record<string, string> = {
    javascript: 'JavaScript',
    python: 'Python',
    java: 'Java',
    csharp: 'C#',
    cpp: 'C++'
  }
  const key = language.toLowerCase()
  return languageDisplayMap[key] || language
}
// Calculate score percentage for the progress bar
const scorePercentage = computed(() => {
  if (!submission.value.grade) return 0
  return (submission.value.grade.score! / submission.value.grade.maxScore) * 100
})

// Determine the color based on score percentage
const scoreColor = computed(() => {
  const percentage = scorePercentage.value
  if (percentage >= 90) return 'var(--el-color-success)'
  if (percentage >= 60) return 'var(--el-color-warning)'
  return 'var(--el-color-danger)'
})

// 处理评分成功
const handleGradeSubmitted = (gradeData: {score: number, feedback: string})=> {
  // 更新本地数据
  submission.value.grade = {
    score: gradeData.score,
    maxScore: submission.value.grade?.maxScore || 100,
    feedback: gradeData.feedback
  }

  submission.value.status = 'graded'
}
const openGradingDialog = () => {
  if (gradingDialog.value) {
    gradingDialog.value.open();
  }
}
const isPreviewable = computed<boolean>(() => {
  if (!currentAttachment.value) return false;
  const previewableExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'html', 'htm', 'txt', 'docx', 'doc'];
  const fileExtension = currentAttachment.value.name.split('.').pop()?.toLowerCase() || '';
  return previewableExtensions.includes(fileExtension);
})
// 请求AI评分
const requestAIGrading = async () => {
  if (loadingAIGrading.value || !submission.value.id) return;
  loadingAIGrading.value = true;
  const aiGradingResult = await apiRequest({
    url: `/ai-grading/grade?submissionId=${submission.value.id}&modelName=${selectedModel.value}`,
    requestType: 'POST'
  });

  if (aiGradingResult) {
    submission.value.aiGrading = aiGradingResult;
    ElMessage.success('AI Grading completed successfully');
  } else {
    ElMessage.warning('AI Grading server is busy, please try later');
  }
  loadingAIGrading.value = false;
}
</script>

<template>
  <el-main class="submission-page">
    <!-- Main content area -->
    <div class="content-area">
      <!-- Left panel for file/code preview -->
      <div class="preview-panel">
        <div class="preview-header">
          <template v-if="showCode && currentCodeSubmission">
            <h3>Code Submission - {{ getLanguageDisplay(currentCodeSubmission.language) }}</h3>
          </template>
          <template v-else-if="currentAttachment">
            <h3>{{ currentAttachment.name }}</h3>
          </template>
          <template v-else>
            <h3>No File Selected</h3>
          </template>
        </div>

        <div class="preview-content">
          <!-- Code submission preview -->
          <template v-if="showCode && currentCodeSubmission">
            <div class="code-preview">
              <pre><code>{{ currentCodeSubmission.script }}</code></pre>
            </div>
          </template>

          <template v-else-if="isPreviewable">
            <div class="preview-container preview-able" v-loading="loadingBlob">
              <iframe
                  element-loading-text="Loading File..."
                  :src="blobUrl || ''"
              />
            </div>
          </template>

          <!-- No preview available -->
          <template v-else-if="currentAttachment">
            <div class="preview-container no-preview">
              <el-empty description="This file type cannot be previewed">
                <el-button type="primary" @click="downloadFile(currentAttachment)">
                  Download to View
                </el-button>
              </el-empty>
            </div>
          </template>

          <!-- No file selected -->
          <template v-else>
            <el-empty description="No file selected for preview" />
          </template>
        </div>
      </div>

      <!-- Right sidebar with information -->
      <div class="info-panel">
        <!-- Student information -->
        <div class="student-section">
          <h4>Submission Details</h4>
          <div class="info-container">
            <div class="info-row">
              <span class="info-label">Student:</span>
              <span class="info-value">{{ submission.studentName }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Submitted:</span>
              <span class="info-value">{{ submission.submitTime }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Status:</span>
              <span class="info-value">
                <el-tag :type="getStatusColor(submission.status)" size="small">
                  {{ capitalize(submission.status) }}
                </el-tag>
              </span>
            </div>
          </div>
        </div>
        <!-- 评分按钮 -->
        <div class="grading-actions">
          <div style="width: 100%; display: flex; justify-content: center; align-items: center; gap: 10px">
            <span style="font-size: 14px; color: var(--el-text-color-secondary);">AI Model:</span>
            <el-select v-model="selectedModel" size="small" style="width: 50%">
              <el-option
                  v-for="model in aiModels"
                  :key="model.value"
                  :label="model.label"
                  :value="model.value"
              />
            </el-select>
          </div>
          <el-button-group>
            <el-button
                type="primary"
                @click="requestAIGrading"
                :loading="loadingAIGrading"
                :icon="MagicStick"
                class="grade-button"
            >
              {{ submission.aiGrading ? 'Regrade with AI' : 'Grade with AI' }}
            </el-button>
            <el-button
                type="primary"
                @click="openGradingDialog"
                :loading="loadingAIGrading"
                :icon="submission.status === 'graded' ? Edit : Plus"
                class="grade-button"
            >
              {{ submission.status === 'graded' ? 'Modify Grade' : 'Grade Submission' }}
            </el-button>
          </el-button-group>
        </div>

        <!-- Grade information -->
        <div class="score-section" v-if="submission.grade || submission.aiGrading">
          <h4>Grade Information</h4>
          <div class="score-container" >
            <div class="score-display" v-if="submission.grade">
              <span class="score-text" :style="{ color: scoreColor }">
                {{ submission.grade.score }}
              </span>
              <span class="score-separator">/</span>
              <span class="max-score">{{ submission.grade.maxScore }}</span>
            </div>
            <el-progress
                v-if="submission.grade"
                :percentage="scorePercentage"
                :color="scoreColor"
                :stroke-width="10"
                :show-text="false"
            />
            <!-- AI Grading Info -->
            <div class="ai-grading" v-if="submission.aiGrading">
              <div class="ai-score">
                <span class="ai-label">AI Score: </span>
                <span class="ai-value">{{ submission.aiGrading.aiScore }}</span>
                <el-tooltip content="AI confidence level in the scoring">
                  <span class="confidence-badge">
                    <el-tag size="small" type="info">
                      {{ confidenceLevel }} Confidence
                    </el-tag>
                  </span>
                </el-tooltip>
              </div>
            </div>
          </div>
        </div>

        <!-- Text response section -->
        <div class="response-section" v-if="submission.textResponse">
          <h4>Student Response</h4>
          <el-card class="response-container">
            <p>{{ submission.textResponse }}</p>
          </el-card>
        </div>

        <!-- Attachments list -->
        <div class="attachments-section" v-if="submission.attachments && submission.attachments.length > 0">
          <h4>Submitted Files</h4>
          <ul class="attachments-list">
            <li
                v-for="attachment in submission.attachments"
                :key="attachment.id"
                :class="{ active: !showCode && currentAttachment?.id === attachment.id }"
                @click="showAttachment(attachment)"
            >
              <div class="attachment-info">
                <el-icon>
                  <Component :is="getFileIcon(attachment.name)" />
                </el-icon>
                <div class="attachment-details">
                  <span class="attachment-name">{{ attachment.name }}</span>
                  <span class="attachment-size">{{ attachment.size }}</span>
                </div>
              </div>
              <div class="attachment-actions">
                <el-button
                    type="primary"
                    size="small"
                    text
                    @click.stop="downloadFile(attachment)"
                >
                  <el-icon size="large"><Download /></el-icon>
                </el-button>
              </div>
            </li>
          </ul>
        </div>

        <!-- Code submissions -->
        <div class="code-section" v-if="submission.codeSubmissions && submission.codeSubmissions.length > 0">
          <h4>Code Submissions</h4>
          <ul class="code-list">
            <li
                v-for="code in submission.codeSubmissions"
                :key="code.id"
                :class="{ active: showCode && currentCodeSubmission?.id === code.id }"
                @click="showCodeSubmission(code)"
            >
              <div class="code-info">
                <el-icon><CoffeeCup /></el-icon>
                <div class="code-details">
                  <span class="code-name">{{ getLanguageDisplay(code.language) }} Code</span>
                  <span class="code-version">Version {{ code.versionIndex }}</span>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <grading-dialog
        ref="gradingDialog"
        :submission-id="submission.id"
        :current-grade="submission.grade"
        :ai-grading="submission.aiGrading"
        @grade-submitted="handleGradeSubmitted"
    />
  </el-main>
</template>

<style lang="scss" scoped>
.submission-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: var(--el-bg-color);
}

.content-area {
  display: flex;
  flex: 1;
  overflow: hidden;

  .preview-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--el-border-color-light);
    background-color: var(--el-bg-color);

    .preview-header {
      padding: 16px;
      border-bottom: 1px solid var(--el-border-color-light);
      h3 {
        margin: 0;
        font-size: 18px;
        color: var(--el-text-color-primary);
      }
    }

    .preview-content {
      flex: 1;
      overflow: auto;
      display: flex;
      align-items: center;
      justify-content: center;

      .preview-container {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;

        &.preview-able {
          width: 100%;
          height: 100%;
          overflow-y: auto;
          iframe {
            width: 100%;
            height: 100%;
            border: none;
          }
        }

        &.no-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
      }

      .code-preview {
        width: 100%;
        box-sizing: border-box;
        height: 100%;
        overflow: auto;
        padding: 20px;

        pre {
          margin: 0;
          padding: 16px;
          background-color: var(--el-bg-color-page);
          border-radius: 4px;
          white-space: pre-wrap;
          overflow-x: auto;

          code {
            font-family: monospace;
            font-size: 14px;
            color: var(--el-text-color-primary);
          }
        }
      }
    }
  }

  .info-panel {
    width: 320px;
    display: flex;
    flex-direction: column;
    background-color: var(--el-bg-color);
    border-left: 1px solid var(--el-border-color-light);
    overflow-y: auto;

    h4 {
      margin: 0 0 16px 0;
      font-size: 16px;
      color: var(--el-text-color-primary);
    }

    .student-section,
    .score-section,
    .response-section,
    .attachments-section,
    .code-section {
      padding: 20px;
      border-bottom: 1px solid var(--el-border-color-light);
    }

    .info-container {
      background-color: var(--el-bg-color-page);
      border-radius: 8px;
      padding: 16px;

      .info-row {
        display: flex;
        margin-bottom: 8px;
        align-items: center;

        &:last-child {
          margin-bottom: 0;
        }

        .info-label {
          width: 100px;
          color: var(--el-text-color-secondary);
          font-size: 14px;
        }

        .info-value {
          flex: 1;
          color: var(--el-text-color-primary);
          font-size: 14px;
          font-weight: 500;
        }
      }
    }
    .grading-actions {
      padding: 0 10px 0;
      margin-top: 16px;
      display: flex;
      gap: 12px;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      .grade-button {
        width: 50%;
      }
      .grade-button + .grade-button {
        margin-left: 0;
      }
    }
    .score-container {
      background-color: var(--el-bg-color-page);
      border-radius: 8px;
      padding: 16px;

      .score-display {
        margin-bottom: 16px;
        text-align: center;

        .score-text {
          font-size: 32px;
          font-weight: bold;
        }

        .score-separator {
          font-size: 24px;
          margin: 0 5px;
          color: var(--el-text-color-secondary);
        }

        .max-score {
          font-size: 24px;
          color: var(--el-text-color-secondary);
        }
      }


      .ai-grading {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px dashed var(--el-border-color);

        .ai-score {
          display: flex;
          align-items: center;

          .ai-label {
            font-size: 14px;
            color: var(--el-text-color-secondary);
          }

          .ai-value {
            font-size: 16px;
            font-weight: bold;
            margin-right: 10px;
            color: var(--el-text-color-primary);
          }

          .confidence-badge {
            margin-left: auto;
          }
        }
      }
    }

    .response-container {
      p {
        margin: 0;
        font-size: 14px;
        line-height: 1.6;
        color: var(--el-text-color-primary);
      }
    }

    .attachments-list,
    .code-list {
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s;
        margin-bottom: 8px;

        &:hover {
          background-color: var(--el-fill-color-light);
        }

        &.active {
          background-color: var(--el-fill-color);
        }

        .attachment-info,
        .code-info {
          display: flex;
          align-items: center;
          overflow: hidden;

          .el-icon {
            font-size: 20px;
            color: var(--el-text-color-secondary);
            margin-right: 12px;
          }

          .attachment-details,
          .code-details {
            display: flex;
            flex-direction: column;
            overflow: hidden;

            .attachment-name,
            .code-name {
              font-size: 14px;
              color: var(--el-text-color-primary);
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .attachment-size,
            .code-version {
              font-size: 12px;
              color: var(--el-text-color-secondary);
              margin-top: 4px;
            }
          }
        }

        .attachment-actions {
          flex-shrink: 0;
        }
      }
    }
  }
}
</style>