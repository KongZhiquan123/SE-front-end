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
          <el-icon class="upload-icon"><Plus /></el-icon>
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
import { ref } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import 'vue-cropper/dist/index.css';
import { VueCropper } from 'vue-cropper';

// 定义组件事件
const emit = defineEmits(['crop-success', 'crop-cancel']);

// 本地状态
const imageUrl = ref('');
const cropperRef = ref(null);

// 处理文件选择
const handleFileChange = (file) => {
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

  // 将文件转换为base64格式
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
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: border-color 0.3s;

    &:hover {
      border-color: #409eff;
    }

    .upload-icon {
      font-size: 28px;
      margin-right: 10px;
      color: #8c939d;
    }

    .upload-text {
      color: #8c939d;
      margin-top: 8px;
    }
  }

  .cropper-wrapper {
    width: 100%;
    height: 400px;
  }

  .cropper-actions {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-top: 12px;
    flex-wrap: wrap;

    .el-button {
      margin: 0;
    }
  }
}

// 适配电脑端
@media screen and (min-width: 768px) {
  .avatar-cropper-container {
    .cropper-actions {
      justify-content: flex-end;
    }
  }
}
</style>