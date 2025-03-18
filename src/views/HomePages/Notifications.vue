<script setup lang="ts">
import { ref, computed } from 'vue';
import { formatDate } from '@/utils/formatDate.ts';
import { ElMessage } from 'element-plus';
import {Bell, Check, Refresh, Reading, User} from "@element-plus/icons-vue";
import type { Notification } from '@/types/interfaces';


// 示例数据（替换为实际API调用）
const notifications = ref<Notification[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

// 用于过滤的计算属性
const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length);
const filteredNotifications = computed(() => {
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

const activeFilter = ref('all');

const fetchNotifications = async () => {
  loading.value = true;

  // TODO: 替换为实际API调用(await fetchData<Notification[]>('/notifications'))
  notifications.value = [
    {
      id: 1,
      title: 'Assignment deadline changed',
      content: 'Math assignment deadline has been extended to next Friday',
      isRead: false,
      createdAt: '2024-10-15T14:30:00',
      sender: 'Zhang Hengqian',
      relatedCourse: 'MATH101',
      priority: 'medium'
    },
    {
      id: 2,
      title: 'Missed deadline',
      content: 'You have missed the submission deadline for the physics lab report',
      isRead: false,
      createdAt: '2024-10-14T09:15:00',
      sender: 'Liu Yifan',
      relatedCourse: 'PHYS102',
      priority: 'high'
    },
  ];

  loading.value = false
};
fetchNotifications();
// 标记通知为已读
const markAsRead = async (notification: Notification) => {
  if (notification.isRead) return;
  // TODO: 替换为实际API调用
  // 更新本地状态
  const index = notifications.value.findIndex(n => n.id === notification.id);
  if (index !== -1) {
    notifications.value[index] = { ...notification, isRead: true };
  }
  ElMessage.success('Notification marked as read');

};

// 全部标记为已读
const markAllAsRead = async () => {

  // TODO: 替换为实际API调用
  // 更新本地状态
  notifications.value = notifications.value.map(n => ({ ...n, isRead: true }));
  ElMessage.success('All notifications marked as read');

};

// 获取优先级对应的标签类型
const getPriorityTagType = (priority: string) => {
  const priorityMap: Record<string, string> = {
    'high': 'danger',
    'medium': 'warning',
    'low': 'info'
  }
  return priorityMap[priority] || 'info';
};
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
            v-if="unreadCount > 0"
            @click="markAllAsRead"
            type="primary"
            size="large"
            :icon="Check"
        >
          Mark All as Read
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
        <el-radio-button value="unread">
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
            :timestamp="formatDate(notification.createdAt)"
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
                <h3>{{ notification.title }}</h3>
                <div class="tags">
                  <el-tag v-if="!notification.isRead" size="small" type="info" effect="dark">New</el-tag>
                  <el-tag
                      v-if="notification.priority"
                      size="small"
                      :type="getPriorityTagType(notification.priority)"
                      effect="plain"
                  >
                    {{
                      notification.priority === 'high' ? 'High Priority' :
                          notification.priority === 'medium' ? 'Medium Priority' : 'Low Priority'
                    }}
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