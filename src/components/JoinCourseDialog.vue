<template>
  <el-dialog
      v-model="dialogVisible"
      title="Join a Course"
      width="500px"
      :close-on-click-modal="false"
  >
    <el-form
        ref="formRef"
        :model="joinForm"
        :rules="rules"
        label-position="top"
        @submit.prevent
    >
      <el-form-item label="Course Code" prop="courseCode">
        <el-input
            v-model="joinForm.courseCode"
            placeholder="Enter course code"
        />
      </el-form-item>

      <el-form-item label="Access Code (if required)" prop="accessCode">
        <el-input
            v-model="joinForm.accessCode"
            placeholder="Enter access code if provided by teacher"
            show-password
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeDialog">Cancel</el-button>
        <el-button type="primary" :loading="loading" @click="submitForm">
          Join
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import request from "@/utils/request";

const dialogVisible = ref(false)
const loading = ref(false)
const formRef = ref<FormInstance>()

const joinForm = reactive({
  courseCode: '',
  accessCode: ''
})

const rules: FormRules = {
  courseCode: [
    { required: true, message: 'Please enter a course code', trigger: 'blur' }
  ]
}

const emit = defineEmits(['course-joined'])

const submitForm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      loading.value = true
      const {data} = await request.post(
          `/students/courses/join?courseCode=${encodeURIComponent(joinForm.courseCode)}`
      )
      emit('course-joined', data)
      closeDialog()
    } catch (error) {
      ElMessage.error('Failed to join course')
    } finally {
      loading.value = false
    }
  })
}

const closeDialog = () => {
  dialogVisible.value = false
  formRef.value?.resetFields()
}

const open = () => {
  dialogVisible.value = true
}

defineExpose({ open })
</script>