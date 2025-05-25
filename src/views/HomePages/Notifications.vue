<script setup lang="ts">
import {ref, computed, shallowRef} from 'vue';
import { formatDate } from '@/utils/formatDate.ts';
import { ElMessage } from 'element-plus';
import {Bell, Check, Refresh, Reading, User, Delete, Connection} from "@element-plus/icons-vue";
import type { Notification } from '@/types/interfaces';
import apiRequest from "@/utils/apiUtils";
import {capitalize} from "lodash-es";
import {useUserStore} from "@/stores/user";
import SendNotificationDialog from "@/components/Dialogs/SendNotificationDialog.vue";

const sendNotificationDialogRef = shallowRef<InstanceType<typeof SendNotificationDialog> | null>(null);
const role = useUserStore().role;
const notifications = ref<Notification[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const activeFilter = ref('all');
// 用于过滤的计算属性
const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length);
const filteredNotifications = computed<Notification[]>(() => {
  if (activeFilter.value === 'all') return sortedNotifications.value;
  if (activeFilter.value === 'unread') return sortedNotifications.value.filter(n => !n.isRead);
  return sortedNotifications.value.filter(n => n.priority === activeFilter.value);
});
// 按优先级和日期排序通知
const sortedNotifications = computed(() => {
  return [...notifications.value].sort((a, b) => {
    // 首先按优先级排序
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    // 其次按日期降序排序（新的在前）
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
});



const fetchNotifications = async () => {
  loading.value = true;
  const url = role === 'student' ? '/students/notifications' : '/teachers/notifications/sent';
  const data = await apiRequest<Notification[]>(url);
  notifications.value = data ?? [];
  notifications.value.forEach((notification: Notification) => {
    notification.createdAt = formatDate(notification.createdAt);
    notification.isRead = notification.read || role === 'teacher'; // 教师角色默认已读
    notification.priority = notification.priority.split(' ')[0].toLowerCase() || 'low'; // 确保优先级为小写
    notification.selected = false; // 添加选中状态
    notification.sender = notification.senderUsername || 'System'; // 默认发送者为系统
  });
  loading.value = false
};

// 用于存储选中的通知ID
const selectedNotifications = ref<number[]>([]);

// 批量删除选中的通知
const deleteSelected = async () => {
  if (selectedNotifications.value.length === 0) {
    ElMessage.warning('Please select notifications to delete');
    return;
  }
  const results = await Promise.all(
      selectedNotifications.value.map(id =>
          apiRequest<object>({
            url: `/students/notifications/${id}`,
            requestType: 'DELETE'
          })
      )
  );

  if (results.some(result => result === null)) {
    ElMessage.warning('Some notifications failed to delete');
  } else {
    // 从列表中移除已删除的通知
    notifications.value = notifications.value.filter(
        n => !selectedNotifications.value.includes(n.id)
    );
    selectedNotifications.value = []; // 清空选择
    ElMessage.success('Selected notifications deleted');
  }

};

// 处理选择变化
const handleSelectionChange = (selection: Notification[]) => {
  selectedNotifications.value = selection.map(item => item.id);
};

// 标记通知为已读
const markAsRead = async (notification: Notification) => {
  if (notification.isRead) return;
  const success = await apiRequest<object>({
    url: `/students/notifications/${notification.id}/read`,
    requestType: 'PUT'
  });
  if (success === null) {
    return
  }
  // 更新本地状态
  const index = notifications.value.findIndex(n => n.id === notification.id);
  if (index !== -1) {
    notifications.value[index] = { ...notification, isRead: true };
  }
  ElMessage.success('Notification marked as read');

};

// 全部标记为已读
const markAllAsRead = async () => {

  const successes = await Promise.all<object[]>(
    notifications.value.map(notification => {
      if (!notification.isRead) {
        return apiRequest({
          url: `/students/notifications/${notification.id}/read`,
          requestType: 'PUT'
        });
      }
      return Promise.resolve({});
    })
  );
  if (successes.some((res) => res === null)) {
    ElMessage.warning('Some notifications failed to mark as read');
    return
  }
  // 更新本地状态
  notifications.value = notifications.value.map(n => ({ ...n, isRead: true }));
  ElMessage.success('All notifications marked as read');

};

// 获取优先级对应的标签类型
const getPriorityColor = (priority: string) => {
  const priorityMap: Record<string, string> = {
    'high': 'danger',
    'medium': 'warning',
    'low': 'info'
  }
  return priorityMap[priority] || 'info';
};

fetchNotifications();
</script>

<template>
  <el-main>
    <!-- 顶部操作栏 -->
    <div class="notifications-header">
      <div class="title-section">
        <h1>Notification Center</h1>
        <el-badge :value="unreadCount" :hidden="unreadCount === 0" type="danger" class="unread-badge">
          <el-icon><Bell /></el-icon>
        </el-badge>
      </div>

      <div class="actions">
        <el-button
            v-role="['student']"
            v-if="unreadCount > 0"
            @click="markAllAsRead"
            type="primary"
            size="large"
            :icon="Check"
        >
          Mark All as Read
        </el-button>

        <!-- 添加批量删除按钮 -->
        <el-button
            v-role="['student']"
            v-if="selectedNotifications.length > 0"
            @click="deleteSelected"
            type="danger"
            size="large"
            :icon="Delete"
        >
          Delete Selected ({{ selectedNotifications.length }})
        </el-button>

        <el-tooltip content="Refresh notifications">
          <el-button
              @click="fetchNotifications"
              :icon="Refresh"
              circle
              size="large"
          />
        </el-tooltip>
      </div>
    </div>

    <!-- 过滤选项 -->
    <div class="filter-section">
      <el-radio-group v-model="activeFilter">
        <el-radio-button value="all">All</el-radio-button>
        <el-radio-button value="unread" v-role="['student']">
          Unread
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" />
        </el-radio-button>
        <el-radio-button value="high">
          High Priority
        </el-radio-button>
        <el-radio-button value="medium">
          Medium Priority
        </el-radio-button>
        <el-radio-button value="low">
          Low Priority
        </el-radio-button>
      </el-radio-group>
    </div>

    <!-- 通知内容 -->
    <el-card class="notifications-content" :body-style="{ padding: '0px' }">
      <el-skeleton :rows="3" animated v-if="loading" />

      <el-alert
          v-else-if="error"
          type="error"
          :title="error"
          :closable="false"
      />

      <el-empty
          v-else-if="filteredNotifications.length === 0"
          description="No notifications found"
          :image-size="200"
      >
        <template #image>
          <el-icon style="font-size: 64px; color: #909399;"><Bell /></el-icon>
        </template>
      </el-empty>

      <el-timeline v-else>
        <el-timeline-item
            v-for="notification in filteredNotifications"
            :key="notification.id"
            :type="getPriorityColor(notification.priority)"
            :timestamp="notification.createdAt"
            :hollow="notification.isRead"
            size="large"
        >
          <el-card
              :class="[
              'notification-card',
              !notification.isRead ? 'unread' : '',
              notification.priority === 'high' ? 'high-priority' : ''
            ]"
              @click="markAsRead(notification)"
              shadow="hover"
          >
            <div class="notification-header">
              <div class="title-wrapper">
                <el-checkbox
                    v-model="notification.selected"
                    @change="() => handleSelectionChange(filteredNotifications.filter(n => n.selected))"
                    style="margin-right: 8px"
                    v-role="['student']"
                ></el-checkbox>
                <h3>{{ notification.title }}</h3>
                <div class="tags">
                  <el-tag v-if="!notification.isRead" size="small" type="info" effect="dark">New</el-tag>
                  <el-tag
                      v-if="notification.priority"
                      size="small"
                      :type="getPriorityColor(notification.priority)"
                      effect="plain"
                  >
                    {{ capitalize(notification.priority) }} Priority
                  </el-tag>
                </div>
              </div>
            </div>

            <div class="notification-content">
              <p>{{ notification.content }}</p>

              <div class="notification-meta" v-if="notification.relatedCourse || notification.sender">
                <div v-if="notification.relatedCourse" class="course-info">
                  <el-icon><Reading /></el-icon>
                  <span>Course Code: {{ notification.relatedCourse }}</span>
                </div>

                <div v-if="notification.sender" class="sender-info">
                  <el-icon><User /></el-icon>
                  <span>From: {{ notification.sender }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-card>
    <el-button v-role="['teacher', 'admin']" type="primary" size="large"
      @click="sendNotificationDialogRef?.open()"
    >
      <el-icon><Connection /></el-icon>
      <span>Send Notification to students </span>
    </el-button>
    <SendNotificationDialog
        ref="sendNotificationDialogRef"
        @add:notification="(notification: Notification) => notifications.unshift(notification)"
    />
  </el-main>
</template>

<style scoped>
.notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-section h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.unread-badge {
  margin-left: 8px;
}

.actions {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-section {
  margin-bottom: 20px;
}

.notifications-content {
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.notification-card {
  cursor: pointer;
  margin-bottom: 8px;
  transition: all 0.3s;
  border-radius: 8px;
  overflow: hidden;
}

.notification-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.notification-card.unread {
  background-color: #ecf5ff;
  border-left: 4px solid #409EFF;
}

.notification-card.high-priority {
  border-left: 4px solid #F56C6C;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.title-wrapper {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.title-wrapper h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.notification-content p {
  color: #606266;
  font-size: 14px;
  margin: 0 0 10px;
}

.notification-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 12px;
  color: #909399;
}

.course-info, .sender-info {
  display: flex;
  align-items: center;
  gap: 5px;
}

</style>