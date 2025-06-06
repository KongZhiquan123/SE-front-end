// AssignmentForm.vue
<template>
  <el-main>
    <el-card>
      <el-form
          ref="formRef"
          :model="form"
          :rules="assignmentRules"
          label-width="120px"
          label-position="top"
      >
        <div class="form-row">
          <el-form-item label="Title" prop="title">
            <el-input v-model="form.title"/>
          </el-form-item>

          <el-form-item label="Max Score" prop="maxScore">
            <el-input-number v-model="form.maxScore" :min="0" :max="100" style="width: 100%"/>
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="Type" prop="type">
            <el-select v-model="form.type" placeholder="Select type" style="width: 100%">
              <el-option label="Code" value="code"/>
              <el-option label="Essay" value="essay"/>
              <el-option label="Quiz" value="quiz"/>
            </el-select>
          </el-form-item>

          <el-form-item label="Open Date" prop="openDate">
            <el-date-picker
                v-model="form.openDate"
                type="datetime"
                placeholder="Select open date"
                style="width: 100%"
            />
          </el-form-item>

          <el-form-item label="Due Date" prop="dueDate">
            <el-date-picker
                v-model="form.dueDate"
                type="datetime"
                placeholder="Select due date"
                style="width: 100%"
            />
          </el-form-item>
        </div>
        <el-form-item label="Description" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4"/>
        </el-form-item>

        <el-form-item label="Instructions" prop="instructions">
          <el-input v-model="form.instructions" type="textarea" :rows="4"/>
        </el-form-item>

        <!-- Attachments section -->
        <h2>Attachments</h2>
        <el-upload
            multiple
            ref="uploadRef"
            :http-request="() => {}"
            v-model:file-list="fileList"
            :before-upload="beforeAttachmentUpload"
        >
          <template #trigger>
            <el-button type="primary">Click to upload attachments</el-button>
          </template>
          <template #tip>
            <div class="el-upload__tip">
              Files with a size less than 10MB.
            </div>
          </template>
        </el-upload>

        <el-divider/>
        <!-- Test Cases section (only for code assignments) -->
        <div v-if="form.type === 'code'" class="test-case-upload">
          <h2>TestCases</h2>
          <div v-for="(testCase, index) in testCases" :key="index" class="test-case-item">
            <div class="test-case-header">
              <h4>Test Case {{ index + 1 }}</h4>
              <el-tooltip content="Delete this testcase" placement="top" :hide-after="1000">
                <el-button
                    size="large"
                    type="info"
                    text
                    @click="removeTestCase(index)"
                >
                  <el-icon size="20px">
                    <Close/>
                  </el-icon>
                </el-button>
              </el-tooltip>
            </div>
            <el-form label-position="top">
              <el-form-item label="Input">
                <el-input v-model="testCase.input" type="textarea" :rows="2" placeholder="Input"/>
              </el-form-item>
              <el-form-item label="Expected Output">
                <el-input v-model="testCase.expectedOutput" type="textarea" :rows="2" placeholder="Expected Output"/>
              </el-form-item>
              <div class="test-case-actions">
                <el-form-item label="Weight">
                  <el-input-number v-model="testCase.weight" :min="0" :max="100" placeholder="Weight"/>
                </el-form-item>
              </div>
            </el-form>
          </div>
          <div style="margin-top: 10px">
            <el-button type="primary" @click="addTestCase">Add Test Case Manually</el-button>
            <el-button type="primary" @click="showCodeConfigDialog">Edit Code Configuration</el-button>
          </div>
        </div>
        <el-divider/>
        <h2>Operations</h2>
        <el-form-item>
          <el-button type="primary" @click="submitForm" :disabled="isSubmitting">Submit</el-button>
          <el-button type="primary" @click="resetForm">Reset</el-button>
          <el-button @click="cancel">Cancel</el-button>
        </el-form-item>
      </el-form>

    </el-card>
    <CodeAssignmentConfigDialog
        ref="codeConfigDialog"
        v-model:config="codeConfig"
        :assignment-id="0"/>
  </el-main>
</template>

<script lang="ts" setup>
import {ref, reactive, shallowRef} from 'vue';
import type {FormInstance, UploadInstance, UploadFile, UploadRawFile, FormRules} from 'element-plus';
import {ElMessage} from 'element-plus';
import {Close} from "@element-plus/icons-vue";
import type {Assignment, TestCase, CodeAssignmentConfig} from '@/types/interfaces';
import request from "@/utils/request";
import {useRoute} from "vue-router";
import {checkDate} from "./checkDate";
import {useRouter} from "vue-router";
import CodeAssignmentConfigDialog from "@/components/Dialogs/CodeAssignmentConfigDialog.vue";


const route = useRoute();
const courseId = route.query.courseId;
const courseCode = route.query.courseCode;
// Refs
const formRef = shallowRef<FormInstance>();
const uploadRef = ref<UploadInstance>();
const isSubmitting = ref<boolean>(false);
// State
const defaultForm = {
  id: 0,
  title: '',
  type: '',
  description: '',
  dueDate: '',
  maxScore: 100,
  openDate: '',
  status: 'upcoming' as 'open' | 'closed' | 'upcoming',
  instructions: ''
};
const form = reactive<Assignment>({...defaultForm});

const resetForm = () => {
  formRef.value?.resetFields();
  fileList.value = [];
  testCases.value = [];
};
const codeConfig = ref<CodeAssignmentConfig>({
  id: 0,
  allowedLanguages: '',
  memoryLimitEnabled: false,
  memoryLimitMB: 256,
  timeLimitEnabled: false,
  timeLimitSeconds: 5,
})
const router = useRouter();
const fileList = ref<UploadFile[]>([]);
const testCases = ref<TestCase[]>([]);
// Validation rules
const assignmentRules: FormRules = {
  title: [{required: true, message: 'Please input the title', trigger: 'blur'}],
  type: [{required: true, message: 'Please select the type', trigger: 'change'}],
  description: [{required: true, message: 'Please input the description', trigger: 'blur'}],
  dueDate: [{required: true, message: 'Please select the due date', trigger: 'change'}],
  openDate: [{required: true, message: 'Please select the open date', trigger: 'change'}],
  maxScore: [{required: true, message: 'Please input the max score', trigger: 'blur'}],
};
const codeConfigDialog = ref<InstanceType<typeof CodeAssignmentConfigDialog> | null>(null);
const showCodeConfigDialog = () => {
  if (codeConfigDialog.value) {
    codeConfigDialog.value.open();
  }
};
const beforeAttachmentUpload = (file: UploadRawFile) => {
  // Check file size (10MB max)
  const isLessThan10MB = file.size / 1024 / 1024 < 10;
  if (!isLessThan10MB) {
    ElMessage.error(`${file.name} is too large. Maximum size is 10MB`);
    return false;
  }

  // Check for duplicate files (by name)
  const isDuplicate = fileList.value.some(existingFile =>
      existingFile.name === file.name
  );
  if (isDuplicate) {
    ElMessage.warning(`${file.name} already exists`);
    return false;
  }

  // Check file count (even though limit is already set in el-upload)
  if (fileList.value.length >= 10) {
    ElMessage.warning('Maximum 10 files allowed');
    return false;
  }

  return true;
};
const addTestCase = () => {
  testCases.value.push({
    id: 0,
    input: '',
    expectedOutput: '',
    weight: 10,
  });
};

const removeTestCase = (index: number) => {
  testCases.value.splice(index, 1);
};

// Modify createAssignment to return the created assignment
const createAssignment = async (assignmentData: Assignment): Promise<Assignment | null> => {
  try {
    const {data} = await request.post(`/teachers/assignments/${courseId}/assignments`, assignmentData);
    ElMessage.success(`Assignment created successfully`);
    return data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    ElMessage.error('Failed to create assignment');
    return null;
  }
};

const submitForm = async () => {
  if (!formRef.value) return;
  isSubmitting.value = true;
  const openDate = new Date(form.openDate);
  const dueDate = new Date(form.dueDate);
  if (!checkDate(openDate, dueDate)) {
    isSubmitting.value = false;
    return;
  }
  await formRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.error('Please complete the required fields');
      return;
    }
    if (form.type === 'code' && !codeConfig.value.allowedLanguages) {
      ElMessage.error('Please select at least one language');
      return;
    }
    try {
      // Prepare assignment data
      const createdAssignment = await createAssignment({...form});

      if (createdAssignment) {
        const promises = [];
        promises.push(uploadAttachments(createdAssignment.id));
        if (form.type === 'code') {
          promises.push(uploadTestCases(createdAssignment.id));
          const submitCodeConfig = request.post(
              `/teachers/code-config`,
              {...codeConfig.value, assignmentId: createdAssignment.id, id: null}
          );
          promises.push(submitCodeConfig);
        }
        // Upload attachments and test cases in parallel
        await Promise.all(promises);
        resetForm();
      }
      await router.push({
        path: '/teacher-course/assignment-management',
        query: {courseId: courseId, courseCode: courseCode},
      })
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      ElMessage.error('Error during submission process');
    }
  });
  isSubmitting.value = false;
};

// New function to upload attachments concurrently
const uploadAttachments = async (assignmentId: number) => {
  if (fileList.value.length === 0) return;
  const formData = new FormData();
  fileList.value.forEach((file) => {
    formData.append('files', file.raw || new Blob(), file.name);
  })

  const results = await request.post(
      `/teachers/assignments/${assignmentId}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
  )
  if (results) {
    ElMessage.success(`${fileList.value.length} attachment(s) uploaded successfully`);
  } else {
    ElMessage.error('Failed to upload attachments');
  }
};

// New function to upload test cases concurrently
const uploadTestCases = async (assignmentId: number) => {
  if (testCases.value.length === 0 || form.type !== 'code') return;

  const uploadPromises = testCases.value.map(async (testCase) => {
    try {
      await request.post(
          `/teachers/assignments/${assignmentId}/testcases`,
          testCase
      );
      return true;
    } catch (error) {
      console.error('Failed to upload test case', error);
      return false;
    }
  });

  const results = await Promise.all(uploadPromises);
  const failedCount = results.filter(success => !success).length;

  if (failedCount > 0) {
    ElMessage.warning(`${failedCount} test case(s) failed to upload`);
  } else if (results.length > 0) {
    ElMessage.success(`${results.length} test case(s) uploaded successfully`);
  }
};

const cancel = async () => {
  await router.push({
    path: '/teacher-course/assignment-management',
    query: {courseId: courseId, courseCode: courseCode},
  })
};
</script>

<style lang="scss" scoped>
.form-row {
  display: flex;
  gap: 20px;

  .el-form-item {
    flex: 1;
  }
}

.test-case-upload {
  margin-bottom: 20px;

  .divider {
    text-align: center;
    margin: 15px 0;
    color: #999;
    font-weight: bold;
  }

  .test-case-item {
    border: 1px solid #eee;
    border-radius: 4px;
    padding: 15px;
    margin-top: 15px;
    position: relative;

    .test-case-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;

      h4 {
        margin: 0;
      }
    }


    .el-input, .el-input-number {
      margin-bottom: 10px;
    }
  }
}

</style>