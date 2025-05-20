// ResourceForm.vue
<template>
  <el-main>
    <el-card>
      <el-form
          ref="formRef"
          :model="form"
          :rules="resourceRules"
          label-width="120px"
          label-position="top"
      >

        <el-form-item label="Title" prop="title">
          <el-input v-model="form.title"/>
        </el-form-item>
        <div class="form-row">
          <el-form-item label="Type" prop="type">
            <el-input v-model="form.type"/>
          </el-form-item>
        </div>
        <el-form-item label="Description" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4"/>
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
        <h2>Operations</h2>
        <el-form-item>
          <el-button type="primary" @click="resetForm">Reset</el-button>
          <el-button type="primary" @click="submitForm" :disabled="isSubmitting">Submit</el-button>
          <el-button @click="cancel">Cancel</el-button>
        </el-form-item>
      </el-form>

    </el-card>
  </el-main>
</template>

<script lang="ts" setup>
import {ref, reactive, shallowRef} from 'vue';
import type {FormInstance, UploadInstance, UploadFile, UploadRawFile, FormRules} from 'element-plus';
import {ElMessage} from 'element-plus';
import {Assignment, Resource} from '@/types/interfaces';
import request from "@/utils/request";
import {useRoute} from "vue-router";
import {useRouter} from "vue-router";

const route = useRoute();
const courseId = route.query.courseId;
const courseCode = route.query.courseCode;
// Refs
const formRef = shallowRef<FormInstance>();
const uploadRef = ref<UploadInstance>();
const isSubmitting = ref<boolean>(false);
// State
const defaultForm: Resource = {
  id: 0,
  title: '',
  type: '',
  description: '',
  uploadTime: '',
};
const form = reactive<Resource>({...defaultForm});

const resetForm = () => {
  console.log('reset')
  formRef.value?.resetFields();
  fileList.value = [];
};

const router = useRouter();
const fileList = ref<UploadFile[]>([]);

// Validation rules
const resourceRules: FormRules = {
  title: [{required: true, message: 'Please input the title', trigger: 'blur'}],
  type: [{required: true, message: 'Please select the type', trigger: 'blur'}],
  description: [{required: true, message: 'Please input the description', trigger: 'blur'}],
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

// Modify createAssignment to return the created assignment
const createResource = async (resourceData: Assignment): Promise<Assignment | null> => {
  try {
    const {data} = await request.post(`/teachers/resources/${courseId}/resources`, resourceData);
    ElMessage.success(`Resource created successfully`);
    return data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    ElMessage.error('Failed to create resource');
    return null;
  }
};

const submitForm = async () => {
  if (!formRef.value) return;
  isSubmitting.value = true;

  await formRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.error('Please complete the required fields');
      return;
    }

    try {
      // Prepare assignment data
      const createdResource = await createResource({...form});

      if (createdResource) {
        const promises = [];
        promises.push(uploadAttachments(createdResource.id));
        await Promise.all(promises);
        resetForm();
      }
      await router.push({
        path: '/teacher-course/resource-management',
        query: {courseId: courseId, courseCode: courseCode},
      })
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      ElMessage.error('Error during submission process');
    }
  });
  isSubmitting.value = false;
};

const cancel = async () => {
  await router.push({
    path: '/teacher-course/resource-management',
    query: {courseId: courseId, courseCode: courseCode},
  })
};

// New function to upload attachments concurrently
const uploadAttachments = async (resourceId: number) => {
  if (fileList.value.length === 0) return;
  const formData = new FormData();
  fileList.value.forEach((file) => {
    formData.append('files', file.raw || new Blob(), file.name);
  })
  console.log(fileList.value);

  const results = await request.post(
      `/teachers/resources/${resourceId}/attachments`,
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