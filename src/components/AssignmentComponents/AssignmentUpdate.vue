// AssignmentDetail.vue
<template>
  <el-main>
    <template v-if="assignment">
      <el-card class="detail-section">
        <el-form
            ref="formRef"
            :model="editForm"
            :rules="assignmentRules"
            label-width="120px">
          <el-form-item label="Title" prop="title">
            <el-input v-model="editForm.title"/>
          </el-form-item>
          <el-form-item label="Max Score" prop="maxScore">
            <el-input-number v-model="editForm.maxScore" :min="0" :max="100"/>
          </el-form-item>

          <el-form-item label="Open Date" prop="openDate">
            <el-date-picker v-model="editForm.openDate" type="datetime"/>
          </el-form-item>

          <el-form-item label="Due Date" prop="dueDate">
            <el-date-picker v-model="editForm.dueDate" type="datetime"/>
          </el-form-item>

          <el-form-item label="Description" prop="description">
            <el-input v-model="editForm.description" type="textarea" :rows="4"/>
          </el-form-item>

          <el-form-item label="Instructions">
            <el-input v-model="editForm.instructions" type="textarea" :rows="4"/>
          </el-form-item>

          <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
            <el-button @click="cancelUpdate">Cancel</el-button>
            <el-button @click="resetEditing">Reset</el-button>
            <el-button type="primary" @click="saveChanges" :loading="isSaving">Save</el-button>
          </div>
        </el-form>

        <!-- Attachments Section -->
        <div class="attachments-section">
          <div class="section-header">
            <h3>Attachments</h3>
            <el-button type="primary" size="small" plain @click="showAttachmentForm">
              Add Attachment
            </el-button>
          </div>

          <div v-if="loadingAttachments" class="loading-section">
            <el-skeleton :rows="3" animated/>
          </div>

          <el-empty v-else-if="!assignment.attachments?.length" description="No attachments"/>

          <el-table
              v-else
              :data="assignment.attachments"
              border
              style="width: 100%"
          >
            <el-table-column prop="id" label="ID" width="80"/>
            <el-table-column prop="name" label="Name"/>
            <el-table-column prop="size" label="Size" width="120"/>
            <el-table-column label="Operations" width="200">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="downloadFile(row)">
                  Download
                </el-button>
                <el-button type="danger" size="small" @click="deleteAttachment(row)">
                  Delete
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- Test Cases Section (only for code assignments) -->
        <div v-if="assignment.type === 'code'" class="test-cases-section">
          <div class="section-header">
            <h3>Test Cases</h3>
            <el-button-group>
              <el-button type="primary" size="small" plain @click="showTestCaseForm">
                Add Test Case
              </el-button>
              <el-button type="primary" size="small" plain @click="showCodeConfigDialog">
                Edit Code Config
              </el-button>
            </el-button-group>
          </div>

          <div v-if="loadingTestCases" class="loading-section">
            <el-skeleton :rows="3" animated/>
          </div>

          <el-empty v-else-if="!assignment.testcases?.length" description="No test cases"/>

          <el-table
              v-else
              :data="assignment.testcases"
              border
              style="width: 100%"
          >
            <el-table-column prop="id" label="ID" width="80"/>
            <el-table-column prop="input" label="Input" show-overflow-tooltip/>
            <el-table-column prop="expectedOutput" label="Expected Output" show-overflow-tooltip/>
            <el-table-column prop="weight" label="Weight" width="100"/>
            <el-table-column label="Operations" width="200">
              <template #default="{ row }">
                <el-button type="warning" size="small" @click="editTestCase(row)">
                  Edit
                </el-button>
                <el-button type="danger" size="small" @click="deleteTestCase(row)">
                  Delete
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>
    </template>
    <template v-else>
      <el-empty description="No assignment found"/>
    </template>
    <!-- Attachment Form Dialog -->
    <el-dialog
        v-model="attachmentDialogVisible"
        title="Add Attachment"
        append-to-body
        width="500px"
    >

      <el-upload
          :http-request="() => {}"
          :before-upload="beforeUpload"
          v-model:file-list="fileList"
          multiple
          :limit="10"
      >
        <template #trigger>
          <el-button type="primary">select file</el-button>
        </template>
        <el-button style="margin-left: 10px" type="success" @click="uploadAttachment">
          upload to server
        </el-button>
        <template #tip>
          <div class="el-upload__tip">
            limit 10 files, each file size should be less than 10MB
          </div>
        </template>
      </el-upload>

      <template #footer>
        <span>
          <el-button @click="attachmentDialogVisible = false">Cancel</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Test Case Form Dialog -->
    <el-dialog
        v-model="testCaseDialogVisible"
        :title="currentTestCase.id ? 'Edit Test Case' : 'Add Test Case'"
        append-to-body
        width="500px"
    >
      <el-form :model="currentTestCase" label-width="140px">
        <el-form-item label="Input">
          <el-input v-model="currentTestCase.input" type="textarea" :rows="3"/>
        </el-form-item>
        <el-form-item label="Expected Output">
          <el-input v-model="currentTestCase.expectedOutput" type="textarea" :rows="3"/>
        </el-form-item>
        <el-form-item label="Weight">
          <el-input-number v-model="currentTestCase.weight" :min="0" :max="100"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <span>
          <el-button @click="testCaseDialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="saveTestCase">Save</el-button>
        </span>
      </template>
    </el-dialog>
    <CodeAssignmentConfigDialog
        ref="codeConfigDialog"
        v-model:config="assignment.codeConfig!"
        :assignment-id="assignment.id"
    />
  </el-main>
</template>

<script lang="ts" setup>
import {ref, reactive} from 'vue';
import {ElMessage, ElMessageBox, type FormInstance, type FormRules, type UploadFile, type UploadRawFile} from 'element-plus';
import type {Assignment, Attachment, TestCase, CodeAssignmentConfig} from '@/types/interfaces';
import request from "@/utils/request";
import apiRequest from "@/utils/apiUtils";
import downloadFile from "@/utils/downloadFile";
import {cloneDeep} from "lodash-es";
import {checkDate} from "@/components/AssignmentComponents/checkDate";
import CodeAssignmentConfigDialog from "@/components/Dialogs/CodeAssignmentConfigDialog.vue";
import {useRoute, useRouter} from "vue-router";

const codeConfig: CodeAssignmentConfig = {
  id: 0,
  allowedLanguages: '',
  memoryLimitEnabled: false,
  memoryLimitMB: 256,
  timeLimitEnabled: false,
  timeLimitSeconds: 5
}

const defaultForm: Assignment = {
  id: 0,
  title: '',
  description: '',
  instructions: '',
  type: 'code',
  status: 'upcoming',
  maxScore: 100,
  openDate: new Date().toISOString(),
  dueDate: new Date().toISOString(),
  attachments: [],
  testcases: [],
  codeConfig: codeConfig
}

const assignmentRules: FormRules = {
  title: [{required: true, message: 'Please input the title', trigger: 'blur'}],
  description: [{required: true, message: 'Please input the description', trigger: 'blur'}],
  dueDate: [{required: true, message: 'Please select the due date', trigger: 'change'}],
  openDate: [{required: true, message: 'Please select the open date', trigger: 'change'}],
  maxScore: [{required: true, message: 'Please input the max score', trigger: 'blur'}],
};

const assignment = ref<Assignment>(cloneDeep(defaultForm));
//解构，只提取需要的属性
const {id, title, description, instructions, type, status, maxScore, openDate, dueDate} = assignment.value;
const editForm = ref<Assignment>({id, title, description, instructions, type, status, maxScore, openDate, dueDate})
const formRef = ref<FormInstance>();
const loadingTestCases = ref(true);
const loadingAttachments = ref(true);
const attachmentDialogVisible = ref(false);
const testCaseDialogVisible = ref(false);
const currentTestCase = reactive<TestCase>({
  id: 0,
  input: '',
  expectedOutput: '',
  weight: 10,
});
const isSaving = ref(false);
const codeConfigDialog = ref<InstanceType<typeof CodeAssignmentConfigDialog> | null>(null);

const showCodeConfigDialog = () => {
  if (codeConfigDialog.value) {
    codeConfigDialog.value.open();
  }
};

// Test Case Management
const showTestCaseForm = () => {
  // Reset form data
  Object.assign(currentTestCase, {
    id: 0,
    input: '',
    expectedOutput: '',
    weight: 10,
  });
  testCaseDialogVisible.value = true;
};

// Attachment Management
const showAttachmentForm = () => {
  attachmentDialogVisible.value = true;
};

const resetEditing = () => {
  const {id, title, description, instructions, type, status, maxScore, openDate, dueDate} = assignment.value;
  editForm.value =  {id, title, description, instructions, type, status, maxScore, openDate, dueDate};
};

const route = useRoute();
const router = useRouter();

const assignmentId = route.query.assignmentId;
apiRequest<Assignment>(
    `/common/assignments/${assignmentId}/details`,
    'get',
    'Failed to load assignment'
).then(
    (assignmentData) => {
      assignment.value = assignmentData ?? assignment.value;
      assignment.value.attachments = assignmentData?.attachments ?? [];
      assignment.value.testcases = assignmentData?.testcases ?? [];
      assignment.value.codeConfig = assignmentData?.codeConfig ?? assignment.value.codeConfig;
      resetEditing();
      loadingTestCases.value = false;
      loadingAttachments.value = false;
      return assignment.value;
    }
).then((assignmentData) => {
  if (assignmentData.type === 'code') {
    return apiRequest<CodeAssignmentConfig>(
        `/teachers/code-config/${assignmentData.id}`,
        'get',
        'Failed to load code config'
    );
  }
  return null;
}).then((codeConfig) => {
  assignment.value.codeConfig = codeConfig ?? assignment.value.codeConfig;
})


const saveChanges = async () => {
  isSaving.value = true;

  try {
    // Validate dates
    const openDate = new Date(editForm.value.openDate);
    const dueDate = new Date(editForm.value.dueDate);

    if (!checkDate(openDate, dueDate)) {
      return;
    }

    try {
      await formRef.value?.validate();
    } catch (error) {
      ElMessage.error('Please complete the required fields');
      console.error(error);
      return;
    }

    // API call to update assignment
    const updatedAssignment = await apiRequest<Assignment>(
        `/teachers/assignments/${assignment.value.id}`,
        'put',
        'Failed to update assignment',
        editForm.value
    );

    if (updatedAssignment) {
      Object.assign(assignment.value, editForm.value);
      ElMessage.success('Assignment updated successfully');
    }


  } catch (error) {
    ElMessage.error('Failed to update assignment');
    console.error(error);
  } finally {
    isSaving.value = false;
  }
};

const editTestCase = (testCase: TestCase) => {
  // Copy test case data to form
  Object.assign(currentTestCase, testCase);
  testCaseDialogVisible.value = true;
};

const saveTestCase = async () => {
  try {
    const testcases = assignment.value.testcases!;
    if (currentTestCase.id) {
      // API CALL: Update existing test case
      await request.put(`/teachers/assignments/${assignment.value.id}/testcases/${currentTestCase.id}`, currentTestCase);
      const index = testcases.findIndex(tc => tc.id === currentTestCase.id);
      if (index !== -1) {
        testcases[index] = {...currentTestCase};
      }
      ElMessage.success('Test case updated successfully');
    } else {
      // API CALL: Create new test case
      const {data} = await request.post(`/teachers/assignments/${assignment.value.id}/testcases`, currentTestCase);
      testcases.push(data);
      ElMessage.success('Test case added successfully');
    }
    testCaseDialogVisible.value = false;
     
  } catch (error) {
    console.log(error);
    ElMessage.error('Failed to save test case');
  }
};

const deleteTestCase = async (testCase: TestCase) => {
  try {
    await ElMessageBox.confirm(
        'Are you sure you want to delete this test case?',
        'Warning',
        {
          confirmButtonText: 'Delete',
          cancelButtonText: 'Cancel',
          type: 'warning',
        }
    );

    // API CALL: Delete test case
    await request.delete(`/teachers/assignments/${assignment.value.id}/testcases/${testCase.id}`);

    // Remove from local state
    assignment.value.testcases = assignment.value.testcases!.filter(tc => tc.id !== testCase.id);
    ElMessage.success('Test case deleted successfully');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Failed to delete test case');
    }
  }
};


const fileList = ref<UploadFile[]>([]);

// Before upload hook for validation
const beforeUpload = (file: UploadRawFile) => {
  // Check file size (10MB limit)
  const isLessThan10MB = file.size / 1024 / 1024 < 10;
  if (!isLessThan10MB) {
    ElMessage.error('File size cannot exceed 10MB!');
    return false;
  }

  return true;
};


// Upload attachment function
const uploadAttachment = async () => {
  if (!assignment.value?.id || fileList.value.length === 0) {
    ElMessage.warning('Please select a file first');
    return;
  }

  try {
    const formData = new FormData();
    fileList.value.forEach(file => {
      formData.append('files', file.raw || new Blob(), file.name);
    });

    const {data: uploadedAttachments} = await request.post(
        `/teachers/assignments/${assignment.value.id}/attachments`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
    );

    // Update assignment attachments
    if (assignment.value.attachments) {
      assignment.value.attachments = [...assignment.value.attachments, ...uploadedAttachments];
    } else {
      assignment.value.attachments = uploadedAttachments;
    }

    // Reset and close dialog
    fileList.value = [];
    attachmentDialogVisible.value = false;
    ElMessage.success('Attachments uploaded successfully');

  } catch (error) {
    ElMessage.error('Failed to upload attachment');
    console.error(error);
  }
};

const deleteAttachment = async (attachment: Attachment) => {
  try {
    await ElMessageBox.confirm(
        'Are you sure you want to delete this attachment?',
        'Warning',
        {
          confirmButtonText: 'Delete',
          cancelButtonText: 'Cancel',
          type: 'warning',
        }
    );

    // API CALL: Delete attachment
    await request.delete(`/teachers/assignments/${assignment.value.id}/attachments/${attachment.id}`);

    // Remove from local state
    if (assignment.value && assignment.value.attachments) {
      assignment.value.attachments = assignment.value.attachments.filter(a => a.id !== attachment.id);
    }
    ElMessage.success('Attachment deleted successfully');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Failed to delete attachment');
    }
  }
};

const cancelUpdate = async () => {
  await router.push({
    path: '/teacher-course/assignment-management',
    query: {
      courseId: route.query.courseId,
      courseCode: route.query.courseCode
    },
  })
};
</script>

<style lang="scss" scoped>

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
  margin-bottom: 15px;

  h3 {
    margin: 0;
  }
}

.empty-section {
  padding: 20px;
  text-align: center;
  color: #999;
  background-color: #fafafa;
  border-radius: 4px;
}

.loading-section {
  padding: 20px;
}
</style>