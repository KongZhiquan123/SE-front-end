<script setup lang="ts">
import {PropType, reactive, ref} from 'vue';
import type {UploadFile, UploadFiles, UploadRawFile} from 'element-plus'
import {ElMessage, ElMessageBox} from 'element-plus';
import {UploadFilled} from "@element-plus/icons-vue";
import request from "@/utils/request";
import {capitalize} from "lodash-es";

interface DefaultForm {
  title: string;
  type: string;
  description: string;
  dueDate?: string;
  maxScore?: number;
  openDate?: string;
  instructions?: string;
  status: 'upcoming' | 'open' | 'closed';
}

const props = defineProps({
  courseId: {
    type: [String, Number],
    required: true
  },
  // 设置默认的表单字段
  defaultForm: {
    type: Object as PropType<DefaultForm>,
    default: () => ({
      title: '',
      type: 'material',
      description: '',
      status: 'upcoming'
    })
  },
  // API路径
  apiPath: {
    type: String,
    default: 'materials'
  },
  // 钩子，在创建之前执行
  beforeCreate: {
    type: Function as PropType<() => Promise<boolean> | boolean>,
    default: () => true
  }
});

const emit = defineEmits(['submit-success', 'reset']);

// 使用props.defaultForm作为初始值
const materialForm = reactive<DefaultForm>({ ...props.defaultForm });

const loading = ref(false);
const uploadLoading = ref(false);
const fileList = ref<UploadFiles>([]);

const createMaterial = async (): boolean => {
  try {
    if (!validateForm()) {
      return false;
    }

    // 执行钩子函数
    const shouldProceed = await props.beforeCreate();
    if (!shouldProceed) {
      return false;
    }

    loading.value = true;

    const materialData = { ...materialForm };

    // 创建课程材料或作业
    const { data } = await request.post(`/teachers/${props.apiPath}/${props.courseId}/${props.apiPath}`, materialData);
    const materialId = data.id;

    if (!materialId) {
      ElMessage.error(`Failed to create ${props.apiPath}. Please try again.`);
      return false;
    }

    // 上传文件
    const filesToUpload = fileList.value.filter(file => file.raw).map(file => file.raw);
    if (filesToUpload.length > 0) {
      for (const file of filesToUpload) {
        await uploadFile(file, materialId);
      }
    }

    ElMessage.success(`${capitalize(props.apiPath)} created successfully`);

    emit('submit-success', materialId);
    resetForm();
    return true;
  } catch (error) {
    console.error(`Failed to create ${props.apiPath}:`, error);
    ElMessage.error(`Failed to create ${props.apiPath}. Please try again.`);
    return false;
  } finally {
    loading.value = false;
  }
};

// 上传文件
const uploadFile = async (file: UploadRawFile, materialId: number) => {
  try {
    uploadLoading.value = true;

    // 创建 FormData 对象
    const formData = new FormData();
    formData.append('file', file);

    const response = await request.post(`/teachers/${props.apiPath}/${materialId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (!response || response.status !== 200) {
      ElMessage.error('Failed to upload file. Please try again.');
    }
  } catch (error) {
    console.error('Failed to upload file:', error);
    ElMessage.error('Failed to upload file. Please try again.');
  } finally {
    uploadLoading.value = false;
  }
};

const handleFileUpload = (file: UploadRawFile) => {

  // 检查文件大小
  const isLessThan10MB = file.size / 1024 / 1024 < 10;
  if (!isLessThan10MB) {
    ElMessage.error('File size cannot exceed 10MB');
    return false;
  }

  // 检查文件是否有重复
  const isDuplicate = fileList.value.some(f => f.name === file.name);
  if (isDuplicate) {
    ElMessage.warning('File already added');
    return false;
  }

  // 检查文件数量
  if (fileList.value.length >= 10) {
    ElMessage.warning('You can only upload up to 10 files');
    return false;
  }

  return true;
};

const removeAttachment = (file: UploadFile) => {
  const index = fileList.value.findIndex(f => f.uid === file.uid);
  if (index !== -1) {
    return new Promise((resolve) => {
      ElMessageBox.confirm('Are you sure you want to remove this file?', 'Warning', {
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
        type: 'warning'
      }).then(() => {
        fileList.value.splice(index, 1);
        resolve(true);
      }).catch(() => {
        resolve(false);
      });
    });
  }
  return true;
};

const validateForm = () => {
  if (!materialForm.title) {
    ElMessage.error('Please enter a title');
    return false;
  }
  if (!materialForm.description) {
    ElMessage.error('Please enter a description');
    return false;
  }
  return true;
};

const resetForm = () => {
  Object.assign(materialForm, props.defaultForm);
  fileList.value = [];
  emit('reset');
};

const statusOptions = [
  {label: 'Open', value: 'open'},
  {label: 'Closed', value: 'closed'},
  {label: 'Upcoming', value: 'upcoming'}
];

// 暴露方法和响应式数据给父组件
defineExpose({
  materialForm,
  fileList,
  createMaterial,
  resetForm,
  validateForm
});
</script>

<template>
  <el-form :model="materialForm" label-position="top" class="material-form">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-form-item label="Title" required>
          <el-input v-model="materialForm.title" placeholder="Enter title"/>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-form-item label="Status">
          <el-select v-model="materialForm.status" placeholder="Select status">
            <el-option
                v-for="option in statusOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
            />
          </el-select>
        </el-form-item>
      </el-col>

      <!-- 插槽位置用于Assignment特有字段 -->
      <slot name="additional-fields"></slot>
    </el-row>

    <el-form-item label="Description" required>
      <el-input
          v-model="materialForm.description"
          type="textarea"
          :rows="3"
          placeholder="Enter a brief description"
      />
    </el-form-item>

    <!-- 额外的内容插槽 -->
    <slot name="extra-content"></slot>

    <el-form-item label="Attachments">
      <el-upload
          class="attachment-uploader"
          drag
          action="#"
          :auto-upload="false"
          :multiple="true"
          :file-list="fileList"
          :http-request="() => {}"
          :before-upload="handleFileUpload"
          :before-remove="removeAttachment"
      >
        <el-icon class="el-icon--upload">
          <upload-filled/>
        </el-icon>
        <div class="el-upload__text">Drop files here or <em>click to upload</em></div>
        <template #tip>
          <div class="el-upload__tip">
            Max file size: 10MB. Files will be uploaded when you submit the form.
          </div>
        </template>
      </el-upload>
    </el-form-item>

    <div class="form-actions">
      <el-button @click="resetForm">Reset</el-button>
      <el-button type="primary" @click="createMaterial" :loading="loading">
        Create {{ capitalize(props.apiPath) }}
      </el-button>
    </div>
  </el-form>
</template>

<style lang="scss" scoped>
@use "@/assets/variables";
.material-form {
  background-color: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: variables.$box-shadow-light;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.attachment-uploader {
  width: 100%;
}
</style>