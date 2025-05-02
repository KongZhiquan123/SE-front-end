// ResourceDetail.vue
<template>
  <el-main>
    <template v-if="resource">
      <el-card class="detail-section">
        <el-form
            ref="formRef"
            :model="editForm"
            :rules="resourceRules"
            label-width="120px">
          <el-form-item label="Title" prop="title">
            <el-input v-model="editForm.title"/>
          </el-form-item>
          <el-form-item label="Type" prop="type">
            <el-input v-model="editForm.type"/>
          </el-form-item>
          <el-form-item label="Description" prop="description">
            <el-input v-model="editForm.description" type="textarea" :rows="4"/>
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

          <el-empty v-else-if="!resource.attachments?.length" description="No attachments"/>

          <el-table
              v-else
              :data="resource.attachments"
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
      </el-card>
    </template>
    <template v-else>
      <el-empty description="No resource found"/>
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

  </el-main>
</template>

<script lang="ts" setup>
import {ref, shallowRef} from 'vue';
import {ElMessage, ElMessageBox, type FormInstance, type FormRules, UploadFile, UploadRawFile} from 'element-plus';
import {Attachment, Resource} from '@/types/interfaces';
import request from "@/utils/request";
import apiRequest from "@/utils/apiUtils";
import downloadFile from "@/utils/downloadFile";
import {cloneDeep} from "lodash-es";
import {useRoute, useRouter} from "vue-router";

const formRef = shallowRef<FormInstance>();

const defaultForm: Resource = {
  id: 0,
  title: '',
  description: '',
  type: 'code',
  attachments: [],
}

const resourceRules: FormRules = {
  title: [{required: true, message: 'Please input the title', trigger: 'blur'}],
  type: [{required: true, message: 'Please select the type', trigger: 'blur'}],
  description: [{required: true, message: 'Please input the description', trigger: 'blur'}],
};

const resource = ref<Resource>(cloneDeep(defaultForm));
const editForm = ref<Resource>({...resource.value})

const loadingAttachments = ref(true);
const attachmentDialogVisible = ref(false);
const isSaving = ref(false);

// Attachment Management
const showAttachmentForm = () => {
  attachmentDialogVisible.value = true;
};

const resetEditing = () => {
  // Reset form data
  Object.assign(editForm.value, resource.value);
};

const route = useRoute();
const router = useRouter();

const resourceId = route.query.resourceId;
apiRequest<Resource>(
    `/teachers/resources/${resourceId}`,
    'get',
    'Failed to load resource'
).then(
    (resourceData) => {
      resource.value = resourceData ?? resource.value;
      resource.value.attachments = resourceData.attachments ?? [];
      resetEditing();
      loadingAttachments.value = false;
      return resourceData;
    }
);


const saveChanges = async () => {
  isSaving.value = true;

  try {
    // Validate form
    try {
      await formRef.value?.validate();
    } catch (error) {
      ElMessage.error('Please complete the required fields');
      console.error(error);
      return;
    }

    // API call to update
    const updatedResource = await apiRequest<Resource>(
        `/teachers/resources/${resource.value.id}`,
        'put',
        'Failed to update resource',
        editForm.value
    );

    if (updatedResource) {
      Object.assign(resource.value, editForm.value);
      ElMessage.success('Resource updated successfully');
    }

    await router.push({
      path: '/teacher-course/resource-management',
      query: {
        courseId: route.query.courseId,
        courseCode: route.query.courseCode,
      },
    })
  } catch (error) {
    ElMessage.error('Failed to update resource');
    console.error(error);
  } finally {
    isSaving.value = false;
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

// On success hook after successful upload
const onSuccess = (response) => {
  // If we have a resource, add the new attachment to the list
  if (resource.value && resource.value.attachments) {
    resource.value.attachments.push(response.data);
  }

  // Reset and close dialog
  fileList.value = [];
  attachmentDialogVisible.value = false;
  ElMessage.success('Attachment uploaded successfully');
};

// Upload attachment function
const uploadAttachment = async () => {
  if (!resource.value?.id || fileList.value.length === 0) {
    ElMessage.warning('Please select a file first');
    return;
  }

  try {
    const formData = new FormData();
    fileList.value.forEach(file => {
      formData.append('files', file.raw || new Blob(), file.name);
    });

    const {data: uploadedAttachments} = await request.post(
        `/teachers/resources/${resource.value.id}/attachments`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
    );

    // Update resource attachments
    if (resource.value.attachments) {
      resource.value.attachments = [...resource.value.attachments, ...uploadedAttachments];
    } else {
      resource.value.attachments = uploadedAttachments;
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
    await request.delete(`/teachers/resources/${resource.value.id}/attachments/${attachment.id}`);

    // Remove from local state
    if (resource.value && resource.value.attachments) {
      resource.value.attachments = resource.value.attachments.filter(a => a.id !== attachment.id);
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
    path: '/teacher-course/resource-management',
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