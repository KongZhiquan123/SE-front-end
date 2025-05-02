<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Grade, AIGrading } from "@/types/interfaces"
import apiRequest from "@/utils/apiUtils"

const props = defineProps({
  submissionId: {
    type: Number,
    required: true
  },
  currentGrade: {
    type: Object as () => Grade | undefined,
    default: () => ({
      id: 0,
      title: '',
      type: '',
      score: null,
      maxScore: 100,
      feedback: ""
    })
  },
  aiGrading: {
    type: Object as () => AIGrading | undefined,
    default: undefined
  }
})

const emit = defineEmits([ 'grade-submitted'])
const visible = ref<boolean>(false)
// 评分表单
const gradeForm = ref<{
  score: number | null;
  feedback: string;
}>({
  score: props.currentGrade?.score || null,
  feedback: props.currentGrade?.feedback || ''
})

const submitting = ref(false)

// 关闭对话框
const closeDialog = () => {
  visible.value = false
  gradeForm.value.score = props.currentGrade?.score || null
  gradeForm.value.feedback = props.currentGrade?.feedback || ''
}

// 提交评分
const submitGrade = async () => {
  // 验证成绩是否合法
  if (gradeForm.value.score === null || isNaN(gradeForm.value.score)) {
    ElMessage.warning('Please enter a valid score')
    return
  }

  const maxScore = props.currentGrade?.maxScore || 100
  if (gradeForm.value.score! < 0 || gradeForm.value.score! > maxScore) {
    ElMessage.warning(`score must be between 0 and ${maxScore}`)
    return
  }

  submitting.value = true
  try {
    const gradeData = {
      score: gradeForm.value.score,
      feedback: gradeForm.value.feedback,
    }

    const result = await apiRequest({
      url: `/teachers/grades/${props.submissionId}`,
      requestType: 'POST',
      data: gradeData,
      errorMessage: 'Failed to submit grade'
    })

    if (result) {
      ElMessage.success('Grade submitted successfully')
      // 发送成功事件，通知父组件更新数据
      emit('grade-submitted', {
        score: gradeForm.value.score,
        feedback: gradeForm.value.feedback,
      })
      closeDialog()
    }
  } catch (error) {
    console.error('Error submitting grade:', error)
  } finally {
    submitting.value = false
  }
}

// 使用AI评分建议
const useAIGrading = () => {
  if (!props.aiGrading) {
    ElMessage.warning('No AI grading suggestions available')
    return
  }

  ElMessageBox.confirm(
      'Are you sure you want to use AI grading suggestions? This will overwrite your current score and feedback.',
      'Use AI Grading Suggestions',
      {
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        type: 'info'
      }
  ).then(() => {
    gradeForm.value.score = props.aiGrading!.aiScore
    gradeForm.value.feedback = props.aiGrading!.feedbackSuggestions
  }).catch(() => {
    // 用户取消
  })
}
const open = () => {
  visible.value = true
}
defineExpose({open})
</script>

<template>
  <el-dialog
      v-model="visible"
      title="Grade Submission"
      width="500px"
  >
    <el-form :model="gradeForm" label-width="80px">
      <el-form-item label="Score">
        <el-input-number
            v-model="gradeForm.score"
            :min="0"
            :max="currentGrade?.maxScore || 100"
            :precision="1"
            :step="0.5"
            style="width: 150px"
        />
        <span class="max-score-label">/ {{ currentGrade?.maxScore || 100 }}</span>
      </el-form-item>

      <el-form-item label="Feedback">
        <el-input
            v-model="gradeForm.feedback"
            type="textarea"
            :rows="4"
            placeholder="Enter feedback"
        />
      </el-form-item>

      <div class="dialog-footer">
        <el-button @click="closeDialog">Cancel</el-button>
        <el-button
            v-if="aiGrading"
            @click="useAIGrading"
            type="info"
        >
          Use AI Grading
        </el-button>
        <el-button type="primary" @click="submitGrade" :loading="submitting">
          Submit Grade
        </el-button>
      </div>
    </el-form>
  </el-dialog>
</template>

<style lang="scss" scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  gap: 10px;
}

.max-score-label {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
}
</style>