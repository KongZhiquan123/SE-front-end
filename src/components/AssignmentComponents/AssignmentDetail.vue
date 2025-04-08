// AssignmentDetail.vue
<template>
  <el-dialog
      title="Assignment Details"
      v-model="visible"
      width="70%"
  >
    <template v-if="assignment">
      <div class="detail-section">
        <el-form :model="editForm" label-width="120px">
          <el-form-item label="Title">
            <el-input v-model="editForm.title" />
          </el-form-item>

          <el-form-item label="Max Score">
            <el-input-number v-model="editForm.maxScore" :min="0" />
          </el-form-item>

          <el-form-item label="Open Date">
            <el-date-picker v-model="editForm.openDate" type="datetime" />
          </el-form-item>

          <el-form-item label="Due Date">
            <el-date-picker v-model="editForm.dueDate" type="datetime" />
          </el-form-item>

          <el-form-item label="Description">
            <el-input v-model="editForm.description" type="textarea" :rows="4" />
          </el-form-item>

          <el-form-item label="Instructions">
            <el-input v-model="editForm.instructions" type="textarea" :rows="4" />
          </el-form-item>

          <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
            <el-button @click="cancelEditing">Cancel</el-button>
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

          <el-empty v-if="!assignment.attachments?.length" description="No attachments" />

          <el-table
              v-else
              :data="assignment.attachments"
              border
              style="width: 100%"
          >
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="Name" />
            <el-table-column prop="size" label="Size" width="120"/>
            <el-table-column label="Operations" width="200">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="downloadFile(row.url)">
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
            <el-button type="primary" size="small" plain @click="showTestCaseForm">
              Add Test Case
            </el-button>
          </div>

          <div v-if="loadingTestCases" class="loading-section">
            <el-skeleton :rows="3" animated />
          </div>

          <el-empty v-else-if="!testCases.length" description="No test cases"/>

          <el-table
              v-else
              :data="testCases"
              border
              style="width: 100%"
          >
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="input" label="Input" show-overflow-tooltip />
            <el-table-column prop="expectedOutput" label="Expected Output" show-overflow-tooltip />
            <el-table-column prop="weight" label="Weight" width="100" />
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
      </div>
    </template>
    <template v-else>
      <el-empty description="No assignment found" />
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
            :on-success="onSuccess"
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
          <el-input v-model="currentTestCase.input" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="Expected Output">
          <el-input v-model="currentTestCase.expectedOutput" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="Weight">
          <el-input-number v-model="currentTestCase.weight" :min="0" :max="100" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span>
          <el-button @click="testCaseDialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="saveTestCase">Save</el-button>
        </span>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, reactive, watch } from 'vue';
import {ElMessage, ElMessageBox, UploadFile, UploadRawFile} from 'element-plus';
import { Assignment, Attachment, TestCase } from '@/types/interfaces';
import request from "@/utils/request";
import apiRequest from "@/utils/apiUtils";
import downloadFile from "@/utils/downloadFile";
import {cloneDeep} from "lodash-es";
import {checkDate} from "@/components/AssignmentComponents/checkDate";
const visible = defineModel<boolean>('visible', {
  type: Boolean,
  default: false,
});


// Props and emits
const props = defineProps({
  assignmentParent: {
    type: Object as () => Assignment,
    default: () => ({
      id: 0,
      title: '',
      description: '',
      instructions: '',
      type: 'code',
      status: 'upcoming',
      maxScore: 100,
      openDate: new Date(),
      dueDate: new Date(),
      attachments: [],
    }),
  }
})

const emit = defineEmits(['update-success']);

const assignment = ref<Assignment>(cloneDeep(props.assignmentParent));
const editForm = ref<Assignment>(cloneDeep(assignment.value));

const loadingTestCases = ref(true);
const attachmentDialogVisible = ref(false);
const testCaseDialogVisible = ref(false);
const currentTestCase = reactive<TestCase>({
  id: 0,
  input: '',
  expectedOutput: '',
  weight: 10,
});
watch(() => props.assignmentParent, (newVal) => {
  assignment.value = cloneDeep(newVal);
  if (!newVal.title) {
    return;
  }
  editForm.value = cloneDeep(newVal);
  apiRequest<Assignment>(
      `/teachers/assignments/${assignment.value.id}/attachments`,
      'get',
      'Failed to load assignment'
  ).then(
      (attachmentData) => {
        assignment.value.attachments = attachmentData.attachments ?? [];
      }
  );
  if (assignment.value.type === 'code') {
    apiRequest<TestCase[]>(
        `/teachers/assignments/${assignment.value.id}/testcases`,
        'get',
        'Failed to load test cases'
    ).then(
        (testCases) => {
          assignment.value.testcases = testCases ?? [];
          loadingTestCases.value = false;
        }
    );
  } else {
    loadingTestCases.value = false;
  }
}, { deep: true, immediate: true });


const isSaving = ref(false);

const cancelEditing = () => {
  // Reset form data
  Object.assign(editForm.value, assignment.value);
};

const saveChanges = async () => {
  isSaving.value = true;

  try {
    // Validate dates
    const openDate = new Date(editForm.value.openDate);
    const dueDate = new Date(editForm.value.dueDate);

    if (!checkDate(openDate, dueDate)) {
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
      Object.assign(assignment.value, updatedAssignment);
      emit('update-success', assignment.value);
      ElMessage.success('Assignment updated successfully');
    }
  } catch (error) {
    ElMessage.error('Failed to update assignment');
    console.error(error);
  } finally {
    isSaving.value = false;
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

const editTestCase = (testCase: TestCase) => {
  // Copy test case data to form
  Object.assign(currentTestCase, testCase);
  testCaseDialogVisible.value = true;
};

const saveTestCase = async () => {
  if (!props.assignmentId) return;

  try {
    const testcases = assignment.value.testcases;
    if (currentTestCase.id) {
      // API CALL: Update existing test case
      await request.put(`/teachers/assignments/${assignment.value.id}/testcases/${currentTestCase.id}`, currentTestCase);
      const index = testcases.findIndex(tc => tc.id === currentTestCase.id);
      if (index !== -1) {
        testcases.value[index] = { ...currentTestCase };
      }
      ElMessage.success('Test case updated successfully');
    } else {
      // API CALL: Create new test case
      const { data } = await request.post(`/teachers/assignments/${assignment.value.id}/testcases`, currentTestCase);
      testcases.push(data);
      ElMessage.success('Test case added successfully');
    }
    testCaseDialogVisible.value = false;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    ElMessage.error('Failed to save test case');
  }
};

const deleteTestCase = async (testCase: TestCase) => {
  if (!props.assignmentId) return;

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
    assignment.value.testcases = assignment.value.testcases.value.filter(tc => tc.id !== testCase.id);
    ElMessage.success('Test case deleted successfully');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Failed to delete test case');
    }
  }
};


// Attachment Management
const showAttachmentForm = () => {
  attachmentDialogVisible.value = true;
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

// On success hook after successful upload
const onSuccess = (response) => {
  // If we have an assignment, add the new attachment to the list
  if (assignment.value && assignment.value.attachments) {
    assignment.value.attachments.push(response.data);
  }

  // Reset and close dialog
  fileList.value = [];
  attachmentDialogVisible.value = false;
  ElMessage.success('Attachment uploaded successfully');
};

// Upload attachment function
// Upload attachment function
const uploadAttachment = async () => {
  if (!assignment.value?.id || fileList.value.length === 0) {
    ElMessage.warning('Please select a file first');
    return;
  }

  try {
    // Create an array of upload promises for each file
    const uploadPromises = fileList.value.map(file => {
      const formData = new FormData();
      formData.append('file', file.raw);

      return request.post(
          `/teachers/assignments/${assignment.value.id}/attachments`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
      );
    });

    // Upload all files concurrently
    const responses = await Promise.all(uploadPromises);

    // Collect all uploaded attachments from responses
    const uploadedAttachments = responses.flatMap(response => response.data);

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
</script>

<style lang="scss" scoped>
.detail-section {
  h2 {
    margin-top: 0;
    margin-bottom: 20px;
  }

  .detail-content {
    margin: 20px 0;

    h3 {
      margin-bottom: 10px;
      border-bottom: 1px solid #eee;
      padding-bottom: 5px;
    }

    p {
      white-space: pre-line;
    }
  }
}

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