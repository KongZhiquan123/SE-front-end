<template>
  <div class="avatar-cropper-container">
    <div class="uploader-area">
      <div v-if="!imageUrl" class="upload-trigger">
        <el-upload
            class="avatar-uploader"
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleFileChange"
            accept="image/*"
        >
          <div class="upload-text">Click or drop image to upload</div>
        </el-upload>
      </div>

      <div v-else class="cropper-wrapper">
        <vue-cropper
            ref="cropperRef"
            :img="imageUrl"
            :output-size="1"
            :output-type="'png'"
            :info="true"
            :full="false"
            :can-move="true"
            :can-scale="true"
            :zoom-on-wheel="true"
            :auto-crop="true"
            :auto-crop-width="300"
            :auto-crop-height="300"
            :fixed="true"
            :fixed-number="[1, 1]"
            :center-box="true"
            :high="true"
        />
      </div>
    </div>

    <div class="cropper-actions">
      <template v-if="imageUrl">
        <el-button @click="handleCancel">Cancel</el-button>
        <el-button @click="rotateLeft">Rotate Left</el-button>
        <el-button @click="rotateRight">Rotate Right</el-button>
        <el-button @click="reUpload">Re-upload</el-button>
        <el-button type="primary" @click="handleCrop">Confirm</el-button>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, shallowRef } from 'vue';
import {ElMessage, type UploadFile} from 'element-plus';
import 'vue-cropper/dist/index.css';
import { VueCropper } from 'vue-cropper';

// 定义组件事件
const emit = defineEmits(['crop-success', 'crop-cancel']);

// 本地状态
const imageUrl = ref<string>('');
const cropperRef = shallowRef<InstanceType<typeof VueCropper> | null>(null);

// 处理文件选择
const handleFileChange = (file: UploadFile) => {
  if (!file.raw) {
    ElMessage.error('File upload failed');
    return;
  }

  // 验证文件类型
  if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.raw.type)) {
    ElMessage.error('Only image files are allowed!');
    return;
  }

  // 验证文件大小
  if (file.raw.size / 1024 / 1024 > 5) {
    ElMessage.error('Image size cannot exceed 5MB!');
    return;
  }

  // 将文件转换为base64格式，大小会增加33%左右，需要注意
  const reader = new FileReader();
  reader.onload = (e) => {
    imageUrl.value = e.target.result;
  };
  reader.readAsDataURL(file.raw);
};

// 向左旋转
const rotateLeft = () => {
  cropperRef.value.rotateLeft();
};

// 向右旋转
const rotateRight = () => {
  cropperRef.value.rotateRight();
};

// 重新上传
const reUpload = () => {
  imageUrl.value = '';
};

// 确认裁剪
const handleCrop = () => {
  if (!cropperRef.value) {
    ElMessage.error('Cropper not initialized');
    return;
  }

  // 获取裁剪后的图片
  cropperRef.value.getCropData((data) => {
    // 发送裁剪后的base64图片数据给父组件
    emit('crop-success', data);
  });
};

// 取消裁剪
const handleCancel = () => {
  emit('crop-cancel');
};
</script>

<style lang="scss" scoped>
.avatar-cropper-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  padding: 10px;

  .uploader-area {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
    width: 100%;
  }

  .upload-trigger {
    width: 100%;
    height: 300px;
    border: 2px dashed #d9d9d9;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background-color: #f9f9fb;

    &:hover {
      border-color: var(--el-color-primary);
      background-color: #f0f7ff;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

      .upload-icon {
        color: var(--el-color-primary);
        transform: scale(1.1);
      }

      .upload-text {
        color: var(--el-color-primary);
      }
    }

    .upload-icon {
      font-size: 48px;
      color: #8c939d;
      margin-bottom: 16px;
      transition: all 0.3s ease;
    }

    .upload-text {
      color: #606266;
      font-size: 16px;
      font-weight: 500;
      transition: color 0.3s;
    }
  }

  .cropper-wrapper {
    width: 100%;
    height: 400px;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

    :deep(.cropper-view-box) {
      border-radius: 50%;
      outline: 2px solid var(--el-color-primary);
      outline-color: rgba(var(--el-color-primary-rgb), 0.75);
    }

    :deep(.cropper-face) {
      background-color: inherit !important;
    }

    :deep(.cropper-dashed) {
      border-color: rgba(255, 255, 255, 0.4);
    }

    :deep(.cropper-center) {
      opacity: 0.9;
    }

    :deep(.cropper-line, .cropper-point) {
      background-color: var(--el-color-primary);
    }
  }

  .cropper-actions {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-top: 18px;
    flex-wrap: wrap;
    padding: 5px 0;

    .el-button {
      margin: 0;
      padding: 10px 16px;
      border-radius: 8px;
      font-weight: 500;
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-2px);
      }

      &.el-button--primary {
        box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);

        &:hover {
          box-shadow: 0 6px 16px rgba(var(--el-color-primary-rgb), 0.4);
        }
      }
    }

    .el-button + .el-button {
      margin-left: 0;
    }
  }
}

// 电脑端响应式设计
@media screen and (min-width: 768px) {
  .avatar-cropper-container {
    padding: 20px 10px;

    .cropper-actions {
      justify-content: flex-end;
      padding: 10px 5px;
    }

    .upload-trigger {
      max-width: 600px;
      margin: 0 auto;
    }

    .cropper-wrapper {
      max-width: 600px;
      margin: 0 auto;
    }
  }
}
</style>