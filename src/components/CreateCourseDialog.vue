<template>
  <el-dialog
      v-model="dialogVisible"
      title="Create New Course"
      width="500px"
      :close-on-click-modal="false"
  >
    <el-form
        ref="formRef"
        :model="courseForm"
        :rules="rules"
        label-position="top"
        @submit.prevent
    >
      <el-form-item label="Course Code" prop="courseCode">
        <el-input v-model="courseForm.courseCode" placeholder="e.g., CS101" />
      </el-form-item>

      <el-form-item label="Course Name" prop="courseName">
        <el-input
            v-model="courseForm.courseName"
            placeholder="e.g., Introduction to Computer Science"
        />
      </el-form-item>

      <el-form-item label="Semester" prop="semester">
        <el-input v-model="courseForm.semester" placeholder="e.g., Spring 2024" />
      </el-form-item>

      <el-form-item label="Description" prop="description">
        <el-input
            v-model="courseForm.description"
            type="textarea"
            :rows="3"
            placeholder="Course description"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeDialog">Cancel</el-button>
        <el-button type="primary" :loading="loading" @click="submitForm">
          Create
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import request from "../utils/request.ts";

const dialogVisible = ref(false)
const loading = ref(false)
const formRef = ref<FormInstance>()

const courseForm = reactive({
  courseCode: '',
  courseName: '',
  semester: '',
  description: ''
})

const rules: FormRules = {
  courseCode: [
    { required: true, message: 'Please enter a course code', trigger: 'blur' },
    { min: 2, max: 10, message: 'Length should be 2 to 10 characters', trigger: 'blur' }
  ],
  courseName: [
    { required: true, message: 'Please enter a course name', trigger: 'blur' },
    { min: 3, max: 100, message: 'Length should be 3 to 100 characters', trigger: 'blur' }
  ],
  semester: [
    { required: true, message: 'Please enter a semester', trigger: 'blur' }
  ],
  description: [
    { max: 500, message: 'Description cannot exceed 500 characters', trigger: 'blur' }
  ]
}

const emit = defineEmits(['course-created'])

const submitForm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      loading.value = true
      const submittedForm = { ...courseForm, isActive: true }
      const response = await request.post('/teachers/courses', submittedForm)
      emit('course-created', response.data)
      closeDialog()
    } catch (error) {
      ElMessage.error('Failed to create course')
      console.error(error)
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