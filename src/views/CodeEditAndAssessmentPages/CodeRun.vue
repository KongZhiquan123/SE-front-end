<script setup lang="ts">
import {ref, onMounted, computed} from 'vue';
import {ElMessage} from 'element-plus';
import {RefreshRight, Check, Close, Warning, ArrowDown} from '@element-plus/icons-vue';
import type {CodeExecutionResult} from '@/types/interfaces';
// 数据
const currentResults = ref<CodeExecutionResult[]>([]);
const previousResults = ref<CodeExecutionResult[]>([]);
const isLoading = ref(false);
const isHistoryLoading = ref(false);
const isHistoryLoaded = ref(false);
const activeTab = ref('current');

// 获取最新执行结果
const fetchCurrentResults = async () => {
  isLoading.value = true;

  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500));

    currentResults.value = [
      {
        id: 1,
        output: 'Hello, World!',
        error: '',
        statusCode: 0,
        memory: '1.2 MB',
        cpuTime: '0.5s',
        compilationStatus: 'Compilation successful',
        isExecutionSuccess: true,
        isCompiled: true
      },
      {
        id: 2,
        output: 'Edge case test passed',
        error: '',
        statusCode: 0,
        memory: '1.3 MB',
        cpuTime: '0.6s',
        compilationStatus: 'Compilation successful',
        isExecutionSuccess: true,
        isCompiled: true
      },
      {
        id: 3,
        output: '',
        error: 'NullReferenceException: Object reference not set to an instance of an object',
        statusCode: 1,
        memory: '1.4 MB',
        cpuTime: '0.7s',
        compilationStatus: 'Compilation successful',
        isExecutionSuccess: false,
        isCompiled: true
      }
    ];
  } catch (error) {
    ElMessage.error('Failed to load execution results');
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};

// 获取历史执行结果
const fetchPreviousResults = async () => {
  if (isHistoryLoaded.value) return;

  isHistoryLoading.value = true;
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 700));

    previousResults.value = [
      {
        id: 101,
        output: 'Hello, World!',
        error: '',
        statusCode: 0,
        memory: '1.2 MB',
        cpuTime: '0.5s',
        compilationStatus: 'Compilation successful',
        isExecutionSuccess: true,
        isCompiled: true,
        submitTime: '2021-09-01T12:00:00'
      },
      {
        id: 102,
        output: 'Edge case test passed',
        error: '',
        statusCode: 0,
        memory: '1.3 MB',
        cpuTime: '0.6s',
        compilationStatus: 'Compilation successful',
        isExecutionSuccess: true,
        isCompiled: true,
        submitTime: '2021-09-01T11:45:00'
      },
      {
        id: 103,
        output: '',
        error: 'NullReferenceException: Object reference not set to an instance of an object',
        statusCode: 1,
        memory: '1.4 MB',
        cpuTime: '0.7s',
        compilationStatus: 'Compilation successful',
        isExecutionSuccess: false,
        isCompiled: true,
        submitTime: '2021-09-01T11:30:00'
      }
    ];
    isHistoryLoaded.value = true;
  } catch (error) {
    ElMessage.error('Failed to load previous results');
    console.error(error);
  } finally {
    isHistoryLoading.value = false;
  }
};

// 状态图标计算属性
const getStatusIcon = (result: CodeExecutionResult) => {
  if (!result.isCompiled) return Warning;
  return result.isExecutionSuccess ? Check : Close;
};

// 状态类型计算属性
const getStatusType = (result: CodeExecutionResult) => {
  if (!result.isCompiled) return 'warning';
  return result.isExecutionSuccess ? 'success' : 'danger';
};

// 手动刷新结果
const refreshResults = () => {
  fetchCurrentResults();
};

// 格式化日期显示
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

// 切换标签页
const handleTabChange = (tab: string) => {
  activeTab.value = tab;
  if (tab === 'history' && !isHistoryLoaded.value && !isHistoryLoading.value) {
    fetchPreviousResults();
  }
};

// 获取测试结果摘要
const getResultsSummary = computed(() => {
  const total = currentResults.value.length;
  const success = currentResults.value.filter(r => r.isExecutionSuccess).length;
  const failed = total - success;

  return {
    total,
    success,
    failed
  };
});

onMounted(() => {
  fetchCurrentResults();
});
</script>
<template>
  <el-main class="code-execution-container">
    <!-- 刷新，加载历史记录 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-radio-group v-model="activeTab" size="small" @change="handleTabChange">
          <el-radio-button value="current">Current Results</el-radio-button>
          <el-radio-button value="history">History</el-radio-button>
        </el-radio-group>
      </div>

      <div class="toolbar-right">
        <el-button
            v-if="activeTab === 'current'"
            type="primary"
            size="small"
            :icon="RefreshRight"
            @click="refreshResults"
            :loading="isLoading"
        >
          Refresh
        </el-button>

        <el-button
            v-if="activeTab === 'history' && !isHistoryLoaded"
            type="primary"
            size="small"
            @click="fetchPreviousResults"
            :loading="isHistoryLoading"
        >
          <el-icon class="icon-margin">
            <ArrowDown/>
          </el-icon>
          Load History
        </el-button>
      </div>
    </div>

    <!-- 结果总结 -->
    <div v-if="activeTab === 'current' && !isLoading && currentResults.length > 0" class="summary-bar">
      <div class="summary-item">
        <span class="label">Test Cases:</span>
        <span class="value">{{ getResultsSummary.total }}</span>
      </div>
      <div class="summary-item success">
        <span class="label">Passed:</span>
        <span class="value">{{ getResultsSummary.success }}</span>
      </div>
      <div class="summary-item failed">
        <span class="label">Failed:</span>
        <span class="value">{{ getResultsSummary.failed }}</span>
      </div>
    </div>

    <!-- 目前运行的结果 -->
    <div v-if="activeTab === 'current'" class="results-container">
      <el-skeleton :loading="isLoading" animated v-if="!currentResults.length && isLoading">
        <template #default>
          <div class="skeleton-content">
            <el-skeleton-item variant="p" style="width: 100%; height: 30px;"/>
            <el-skeleton-item variant="p" style="width: 100%; height: 30px; margin-top: 10px;"/>
            <el-skeleton-item variant="p" style="width: 100%; height: 30px; margin-top: 10px;"/>
          </div>
        </template>
      </el-skeleton>

      <div class="results-grid">
        <el-card
            v-for="result in currentResults"
            :key="result.id"
            :class="['result-card', { 'failed-card': !result.isExecutionSuccess }]"
        >
          <template #header>
            <div class="card-header">
              <el-tag :type="getStatusType(result)" size="small">
                <el-icon class="icon-margin">
                  <component :is="getStatusIcon(result)"/>
                </el-icon>
                {{ result.isCompiled ? (result.isExecutionSuccess ? 'Passed' : 'Failed') : 'Compilation Error' }}
              </el-tag>
            </div>
          </template>

          <div class="metrics-row">
            <div class="metric">
              <span class="metric-label">CPU:</span>
              <span class="metric-value">{{ result.cpuTime }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Memory:</span>
              <span class="metric-value">{{ result.memory }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Status Code:</span>
              <span class="metric-value">{{ result.statusCode }}</span>
            </div>
          </div>

          <el-collapse>
            <el-collapse-item :name="`output-${result.id}`">
              <template #title>
                <div class="collapse-header">
                  <span class="output-title">Output/Error</span>
                </div>
              </template>

              <div v-if="result.isExecutionSuccess" class="output-content">
                <pre>{{ result.output }}</pre>
              </div>

              <div v-else class="output-content error">
                <pre>{{ result.error }}</pre>
              </div>
            </el-collapse-item>
          </el-collapse>
        </el-card>
      </div>
    </div>

    <!-- 过去的运行结果 -->
    <div v-else class="results-container">
      <el-skeleton :loading="isHistoryLoading" animated v-if="isHistoryLoading">
        <template #default>
          <div class="skeleton-content">
            <el-skeleton-item variant="p" style="width: 100%; height: 30px;"/>
            <el-skeleton-item variant="p" style="width: 100%; height: 30px; margin-top: 10px;"/>
            <el-skeleton-item variant="p" style="width: 100%; height: 30px; margin-top: 10px;"/>
          </div>
        </template>
      </el-skeleton>

      <el-empty v-if="!isHistoryLoading && !isHistoryLoaded"
                description="Click the Load History button to view history records"/>

      <div v-if="isHistoryLoaded" class="history-list">
        <el-table :data="previousResults" stripe style="width: 100%">
          <el-table-column prop="id" label="ID" width="70"/>
          <el-table-column label="Status" width="100">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row)" size="small">
                <el-icon class="icon-margin">
                  <component :is="getStatusIcon(scope.row)"/>
                </el-icon>
                {{ scope.row.isExecutionSuccess ? 'Passed' : 'Failed' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="memory" label="Memory" width="100"/>
          <el-table-column prop="cpuTime" label="CPU Time" width="100"/>
          <el-table-column prop="submitTime" label="Submit Time">
            <template #default="scope">
              {{ formatDate(scope.row.submitTime) }}
            </template>
          </el-table-column>
          <el-table-column label="Actions" width="120">
            <template #default="scope">
              <el-button type="primary" link size="small" @click="scope.row.showDetails = !scope.row.showDetails">
                View Details
              </el-button>
            </template>
          </el-table-column>
          <el-table-column type="expand">
            <template #default="scope">
              <div class="expanded-content">
                <div class="expanded-section">
                  <div class="section-title">Output</div>
                  <div class="section-content">
                    <pre>{{ scope.row.output || 'No output' }}</pre>
                  </div>
                </div>
                <div v-if="scope.row.error" class="expanded-section">
                  <div class="section-title">Error</div>
                  <div class="section-content error">
                    <pre>{{ scope.row.error }}</pre>
                  </div>
                </div>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </el-main>
</template>

<style lang="scss" scoped>
.code-execution-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;

  .toolbar-left {
    flex: 0 0 auto;
  }

  .toolbar-center {
    flex: 1;
    display: flex;
    justify-content: center;
    gap: 12px;

  }

  .toolbar-right {
    flex: 0 0 auto;
  }
}

.summary-bar {
  display: flex;
  gap: 24px;
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;

  .summary-item {
    display: flex;
    align-items: center;
    gap: 6px;

    .label {
      font-weight: 500;
      color: #606266;
    }

    .value {
      font-weight: 600;
      color: #303133;
    }

    &.success .value {
      color: #67C23A;
    }

    &.failed .value {
      color: #F56C6C;
    }
  }
}

.results-container {
  margin-bottom: 16px;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  align-items: start;
}

.result-card {
  transition: all 0.3s;

  &.failed-card {
    border-color: rgba(245, 108, 108, 0.2);
  }

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .test-case-name {
    font-weight: 500;
    font-size: 14px;
  }
}

.metrics-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;

  .metric {
    display: flex;
    align-items: center;
    gap: 4px;

    .metric-label {
      color: #909399;
      font-size: 12px;
    }

    .metric-value {
      font-size: 12px;
      font-weight: 500;
    }
  }
}

.collapse-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.output-title {
  font-size: 13px;
  font-weight: 500;
}

.output-content {
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 12px;
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;

  pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: monospace;
    font-size: 12px;
    line-height: 1.5;
  }

  &.error {
    background-color: #FFF5F5;
    border-color: #FFDBDB;
  }
}

.history-list {
  width: 100%;
}

.expanded-content {
  padding: 12px;
  background-color: #fafafa;
}

.expanded-section {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }

  .section-title {
    font-weight: 500;
    font-size: 13px;
    margin-bottom: 6px;
    color: #606266;
  }

  .section-content {
    background-color: #f5f7fa;
    border-radius: 4px;
    padding: 12px;
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #e4e7ed;

    pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: monospace;
      font-size: 12px;
      line-height: 1.5;
    }

    &.error {
      background-color: #FFF5F5;
      border-color: #FFDBDB;
    }
  }
}

.icon-margin {
  margin-right: 4px;
}

.skeleton-content {
  padding: 16px;
}
</style>