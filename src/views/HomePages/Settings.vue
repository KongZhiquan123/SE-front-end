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
        <el-avatar :size="100" :src="userInfo.avatarUrl || defaultAvatar" />
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
        width="500px"
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

<script lang="ts" setup>
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { formatDate } from '@/utils/formatDate';
import AvatarCropper from '@/components/Others/AvatarCropper.vue';
import apiRequest from '@/utils/apiUtils';
import  {type UserState, useUserStore } from '@/stores/user'

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

  // 构建要更新的用户数据
  const updateData = {...editForm};

  // 根据用户角色决定使用哪个 API 端点
  const apiEndpoint = userInfo.role === 'teacher'
      ? '/teachers/profile'
      : '/students/profile';

  // 调用 API 保存用户资料
  const result = await apiRequest({
    url: apiEndpoint,
    requestType: 'put',
    errorMessage: 'Failed to update profile',
    data: updateData
  });

  if (result) {
    // 更新本地状态
    Object.assign(userInfo, updateData);
    userStore.setUser(updateData);
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
const onCropSuccess = (avatarUrl) => {
  editForm.avatarUrl = avatarUrl;
  showCropper.value = false;
};
</script>

<style lang="scss" scoped>
.user-profile-container {
  width: 100%;

  .profile-card {
    margin-bottom: 20px;
  }

  .profile-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      margin: 0;
      font-size: 1.5rem;
      color: #303133;
    }
  }

  .avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 24px;

    .avatar-actions {
      margin-top: 12px;
    }
  }

  .profile-info {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .info-item {
      display: flex;
      flex-direction: column;

      .label {
        font-weight: bold;
        margin-bottom: 4px;
        color: #606266;
      }
    }

    .bio-item {
      margin-top: 8px;
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
          width: 200px;
          margin-bottom: 0;
          margin-right: 16px;
        }
      }

      .bio-item {
        flex-direction: column;

        .label {
          margin-bottom: 8px;
        }
      }
    }
  }
}
</style>