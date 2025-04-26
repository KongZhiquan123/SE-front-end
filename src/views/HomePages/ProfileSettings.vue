<script lang="ts" setup>
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { formatDate } from '@/utils/formatDate';
import AvatarCropper from '@/components/Others/AvatarCropper.vue';
import apiRequest from '@/utils/apiUtils';
import {type UserState, useUserStore } from '@/stores/user'

//本地存储用户信息
const isEditing = ref(false);
const showCropper = ref(false);
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';
const userStore = useUserStore();
const { id, username, email, role, createdAt, bio, avatarUrl } = userStore;
const userInfo = reactive<Partial<UserState>>({id, username, email, role, createdAt, bio, avatarUrl});
// 编辑表单
const editForm = reactive({
  username: '',
  bio: '',
  avatarUrl: ''
});

// 重置编辑表单
const resetEditForm = () => {
  editForm.username = userInfo.username || '';
  editForm.bio = userInfo.bio || '';
  editForm.avatarUrl = userInfo.avatarUrl || '';
};

// 获取用户角色名称
const getRoleName = (role) => {
  const roleMap = {
    'admin': 'Administrator',
    'student': 'Student',
    'teacher': 'Teacher',
    'null': 'Not set'
  };
  return roleMap[role] || 'Unknown role';
};

// 保存用户信息
const saveChanges = async () => {
  if (!editForm.username.trim()) {
    ElMessage.warning('Username cannot be empty');
    return;
  }

  // 根据用户角色决定使用哪个 API 端点
  const apiEndpoint = userInfo.role === 'teacher'
      ? '/teachers/profile'
      : '/students/profile';

  // 调用 API 保存用户资料
  const result = await apiRequest({
    url: apiEndpoint,
    requestType: 'put',
    errorMessage: 'Failed to update profile',
    data:  {...editForm}
  });

  if (result) {
    // 更新本地状态
    userStore.setUser({...result, authorized: true});
    const { id, username, email, role, createdAt, bio, avatarUrl } = userStore;
    Object.assign(userInfo, { id, username, email, role, createdAt, bio, avatarUrl });
    isEditing.value = false;
    ElMessage.success('Profile updated successfully');
  }
};

// 切换模式，编辑或保存
const toggleEditMode = () => {
  if (isEditing.value) {
    saveChanges();
  } else {
    isEditing.value = true;
    resetEditForm();
  }
};


const showAvatarUploader = () => {
  showCropper.value = true;
};

// 头像裁剪成功回调
const onCropSuccess = (avatarBase64) => {
  editForm.avatarUrl = avatarBase64;
  showCropper.value = false;
};
</script>


<template>
  <el-main class="user-profile-container">
    <el-card class="profile-card">
      <div class="profile-header">
        <h2>User Profile</h2>
        <el-button type="primary" size="small" @click="toggleEditMode">
          {{ isEditing ? 'Save' : 'Edit' }}
        </el-button>
      </div>

      <div class="avatar-section">
        <el-avatar :size="100" :src="editForm.avatarUrl || userInfo.avatarUrl || defaultAvatar" />
        <div v-if="isEditing" class="avatar-actions">
          <el-button type="primary" size="small" @click="showAvatarUploader">
            Upload Avatar
          </el-button>
        </div>
      </div>

      <div class="profile-info">
        <div class="info-item">
          <span class="label">Username:</span>
          <span v-if="!isEditing">{{ userInfo.username || 'No name yet' }}</span>
          <el-input
              v-else
              v-model="editForm.username"
              placeholder="Please enter username"
              maxlength="20"
              show-word-limit
          />
        </div>

        <div class="info-item">
          <span class="label">Email:</span>
          <span>{{ userInfo.email || 'Not set' }}</span>
        </div>

        <div class="info-item">
          <span class="label">Role:</span>
          <span>{{ getRoleName(userInfo.role) }}</span>
        </div>

        <div class="info-item">
          <span class="label">Account Created:</span>
          <span>{{ formatDate(userInfo.createdAt) }}</span>
        </div>

        <div class="info-item bio-item">
          <span class="label">Bio:</span>
          <span v-if="!isEditing">{{ userInfo.bio || 'No bio provided' }}</span>
          <el-input
              v-else
              v-model="editForm.bio"
              type="textarea"
              :rows="6"
              placeholder="Please enter your bio"
              maxlength="200"
              show-word-limit
          />
        </div>
      </div>
    </el-card>

    <!-- Avatar Cropping Dialog -->
    <el-dialog
        v-model="showCropper"
        title="Crop Avatar"
        width="700px"
        draggable
        destroy-on-close
    >
      <avatar-cropper
          v-if="showCropper"
          @crop-success="onCropSuccess"
          @crop-cancel="showCropper = false"
      />
    </el-dialog>
  </el-main>
</template>


<style lang="scss" scoped>
.user-profile-container {
  width: 100%;
  background-color: #f5f7fa;

  .profile-card {
    margin: 0 auto;
    border-radius: 12px;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    border: none;

    :deep(.el-card__body) {
      padding: 30px;
    }
  }

  .profile-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 1px solid #ebeef5;

    h2 {
      margin: 0;
      font-size: 1.8rem;
      color: #303133;
      font-weight: 600;
    }
  }

  .avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 32px;

    :deep(.el-avatar) {
      border: 4px solid #fff;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;

      &:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }
    }

    .avatar-actions {
      margin-top: 16px;

      .el-button {
        padding: 10px 20px;
        border-radius: 8px;
        font-weight: 500;
      }
    }
  }

  .profile-info {
    display: flex;
    flex-direction: column;
    gap: 20px;

    .info-item {
      display: flex;
      flex-direction: column;

      .label {
        font-weight: 600;
        margin-bottom: 6px;
        color: #606266;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      span:not(.label) {
        font-size: 1.05rem;
        color: #303133;
        line-height: 1.5;
      }

      :deep(.el-input__wrapper) {
        border-radius: 8px;
        padding: 10px 15px;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);

        &:hover, &:focus-within {
          box-shadow: 0 0 0 2px var(--el-color-primary-light-5);
        }
      }

      :deep(.el-textarea__inner) {
        border-radius: 8px;
        padding: 10px 15px;
        min-height: 120px;
        resize: vertical;
      }
    }

    .bio-item {
      margin-top: 12px;

      .label {
        margin-bottom: 12px;
      }
    }
  }
}

// 适配电脑端
@media screen and (min-width: 768px) {
  .user-profile-container {
    .profile-info {
      .info-item {
        flex-direction: row;
        align-items: baseline;

        .label {
          width: 160px;
          margin-bottom: 0;
          margin-right: 24px;
        }

        :deep(.el-input), :deep(.el-textarea) {
          width: calc(100% - 184px);
        }
      }

      .bio-item {
        flex-direction: column;

        .label {
          margin-bottom: 12px;
        }

        :deep(.el-textarea) {
          width: 100%;
        }
      }
    }
  }
}

// el-dialog 样式改进
:deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;

  .el-dialog__title {
    font-weight: 600;
    font-size: 1.2rem;
  }

  .el-dialog__body {
    padding: 24px;
  }
}

// 按钮样式
:deep(.el-button) {
  &.el-button--primary {
    border-radius: 8px;
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
    }
  }
}

</style>