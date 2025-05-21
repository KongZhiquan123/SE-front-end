<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { RefreshRight, Check, Close, Warning } from '@element-plus/icons-vue';
import { Vue3Lottie } from 'vue3-lottie'
import {useRoute} from "vue-router";
import {CodeExecutionResult, TestCaseResult} from "@/types/interfaces";
import apiRequest from "@/utils/apiUtils";
import CodeRunningAnimation from "@/assets/CodeRunningAnimation.json";

const route = useRoute();
const submissionId = route.query.submissionId;
// Data
const executionResult = ref<CodeExecutionResult>({
  submissionId: Number(submissionId),
  script: "",
  language: "",
  versionIndex: 0,
  score: 0,
  testCaseResults: []
});
const isLoading = ref(false);
const loadingStartTime = ref<number>(0);
const loadingMessage = ref("Initializing...");
const loadingProgress = ref(0);
const loadingInterval = ref<number | null>(null);
const showLottieAnimation = ref(true);
const animationPlayed = ref(false);

// Fetch results from backend
const fetchExecutionResults = async () => {
  if (isLoading.value) return;

  isLoading.value = true;
  loadingStartTime.value = Date.now();
  showLottieAnimation.value = true;
  loadingProgress.value = 0;

  // Start progress animation
  if (loadingInterval.value) clearInterval(loadingInterval.value);
  loadingInterval.value = setInterval(() => {
    const elapsedTime = Date.now() - loadingStartTime.value;
    // Calculate progress for a 20 seconds loading time
    const maxTime = 20000;

    // Update loading message based on elapsed time
    if (elapsedTime < 4000) {
      loadingMessage.value = "Compiling your code...";
      loadingProgress.value = Math.min((elapsedTime / maxTime) * 100, 20);
    } else if (elapsedTime < 8000) {
      loadingMessage.value = "Running test cases...";
      loadingProgress.value = Math.min(20 + ((elapsedTime - 4000) / maxTime) * 100, 50);
    } else if (elapsedTime < 12000) {
      loadingMessage.value = "Analyzing results...";
      loadingProgress.value = Math.min(50 + ((elapsedTime - 8000) / maxTime) * 100, 80);
    } else {
      loadingMessage.value = "Finalizing results...";
      loadingProgress.value = Math.min(80 + ((elapsedTime - 12000) / maxTime) * 100, 95);
    }
    loadingProgress.value = Math.round(loadingProgress.value);
    // Stop at 95% - will reach 100% when data is actually received
    if (loadingProgress.value >= 95) {
      loadingProgress.value = 95;
      if (loadingInterval.value) clearInterval(loadingInterval.value);
    }
  }, 200);

  try {
    // Wait 10 seconds before fetching (as requested)
    await new Promise(resolve => setTimeout(resolve, 21000));

    const response = await apiRequest(`/students/submissions/assignments/submissions/code/${submissionId}`);
    executionResult.value = response ?? executionResult.value;
    loadingProgress.value = 100;
    // Delay for smooth animation completion
    await new Promise(resolve => setTimeout(resolve, 500));
    showLottieAnimation.value = false;
    animationPlayed.value = true;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    ElMessage.error('Failed to load execution results');

    loadingProgress.value = 100;
    showLottieAnimation.value = false;
  } finally {
    if (loadingInterval.value) clearInterval(loadingInterval.value);
    isLoading.value = false;
  }
};

// Status icon computation
const getStatusIcon = (result: TestCaseResult) => {
  if (!result.compiled) return Warning;
  return result.passed ? Check : Close;
};

// Status type computation
const getStatusType = (result: TestCaseResult) => {
  if (!result.compiled) return 'warning';
  return result.passed ? 'success' : 'danger';
};

// Manual refresh
const refreshResults = () => {
  fetchExecutionResults();
};

// Get results summary
const getResultsSummary = computed(() => {
  if (!executionResult.value) return { total: 0, success: 0, failed: 0 };

  const testCases = executionResult.value.testCaseResults;
  const total = testCases.length;
  const success = testCases.filter(r => r.passed).length;
  const failed = total - success;

  return {
    total,
    success,
    failed,
    score: executionResult.value.score
  };
});

// Progress color gradient for different stages
const progressColorGradient = [
  {color: '#FFCC00', percentage: 0},
  {color: '#FFB366', percentage: 25},
  {color: '#FF99CC', percentage: 50},
  {color: '#CC99FF', percentage: 75},
  {color: '#9966FF', percentage: 100},
];

onMounted(() => {
  fetchExecutionResults();
});
</script>

<template>
  <el-main class="code-execution-container">
    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h2 class="execution-title">Code Execution Results</h2>
      </div>

      <div class="toolbar-right">
        <el-button
            type="primary"
            size="small"
            :icon="RefreshRight"
            @click="refreshResults"
            :loading="isLoading"
        >
          Refresh
        </el-button>
      </div>
    </div>

    <!-- Loading Animation -->
    <div v-if="isLoading || showLottieAnimation" class="loading-container">
      <Vue3Lottie
          :animationData="CodeRunningAnimation"
          :speed="1"
          style="width: 300px; height: 300px; background: transparent;"
          loop
          autoplay
      ></Vue3Lottie>

      <div class="loading-info">
        <h3>{{ loadingMessage }}</h3>
        <el-progress
            :percentage="loadingProgress"
            :stroke-width="8"
            :color="progressColorGradient"
        />
      </div>
    </div>

    <!-- Results Summary -->
    <div v-if="!isLoading && !showLottieAnimation && executionResult" class="summary-bar">
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
      <div class="summary-item score">
        <span class="label">Score:</span>
        <span class="value">{{ getResultsSummary.score?.toFixed(0) }}%</span>
      </div>
    </div>

    <!-- Results Grid -->
    <div v-if="!isLoading && !showLottieAnimation && executionResult" class="results-container">
      <div class="results-grid">
        <el-card
            v-for="result in executionResult.testCaseResults"
            :key="result.testCaseId"
            :class="['result-card', { 'failed-card': !result.passed }]"
        >
          <template #header>
            <div class="card-header">
              <el-tag :type="getStatusType(result)" size="small">
                <el-icon class="icon-margin">
                  <component :is="getStatusIcon(result)"></component>
                </el-icon>
                {{ result.compiled ? (result.passed ? 'Passed' : 'Failed') : 'Compilation Error' }}
              </el-tag>
              <span class="test-case-id">Test Case #{{ result.testCaseId }}</span>
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
              <span class="metric-label">Weight:</span>
              <span class="metric-value">{{ result.weight }}</span>
            </div>
          </div>

          <div class="test-data-row">
            <el-collapse>

              <el-collapse-item name="actual">
                <template #title>
                  <div class="collapse-header">
                    <span class="output-title">Actual Output</span>
                  </div>
                </template>
                <div class="output-content" :class="{ 'error': !result.passed }">
                  <pre>{{ result.actualOutput || 'No output' }}</pre>
                </div>
              </el-collapse-item>

              <el-collapse-item v-if="result.error && result.error !== 'null'" name="error">
                <template #title>
                  <div class="collapse-header">
                    <span class="output-title error-title">Error</span>
                  </div>
                </template>
                <div class="output-content error">
                  <pre>{{ result.error }}</pre>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </el-card>
      </div>
    </div>

    <!-- Empty state when no results -->
    <el-empty
        v-if="!isLoading && !showLottieAnimation && !executionResult && animationPlayed"
        description="No execution results available"
    >
      <el-button type="primary" @click="refreshResults">Run Code</el-button>
    </el-empty>
  </el-main>
</template>

<style lang="scss" scoped>
@use "@/assets/variables";

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
  background-color: variables.$background-light;
  border-radius: 4px;
  border: 1px solid variables.$border-light;

  .execution-title {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  text-align: center;

  .loading-info {
    width: 80%;
    max-width: 500px;
    margin-top: 16px;

    h3 {
      margin-bottom: 16px;
      color: variables.$text-secondary;
    }
  }
}

.summary-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  padding: 12px;
  background-color: variables.$background-light;
  border-radius: 4px;
  border: 1px solid variables.$border-light;

  .summary-item {
    display: flex;
    align-items: center;
    gap: 8px;

    .label {
      font-weight: 500;
      color: variables.$text-secondary;
    }

    .value {
      font-weight: 600;
      color: variables.$text-primary;
    }

    &.success .value {
      color: variables.$success-color;
    }

    &.failed .value {
      color: variables.$danger-color;
    }

    &.score .value {
      color: #1989fa;
    }
  }
}

.execution-status {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background-color: variables.$background-light;
  border-radius: 4px;
  border: 1px solid variables.$border-light;

  .feedback {
    font-weight: 500;
    color: variables.$text-secondary;
  }
}

.results-container {
  margin-bottom: 16px;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
  align-items: start;
}

.result-card {
  transition: all 0.3s;

  &.failed-card {
    border-color: variables.$border-danger-light-alpha;
  }

  &:hover {
    box-shadow: variables.$box-shadow-light;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .test-case-id {
    font-weight: 500;
    font-size: 14px;
    color: variables.$text-secondary;
  }
}

.metrics-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 8px;
  background-color: #f9f9f9;
  border-radius: 4px;

  .metric {
    display: flex;
    align-items: center;
    gap: 4px;

    .metric-label {
      color: variables.$text-tertiary;
      font-size: 12px;
    }

    .metric-value {
      font-size: 12px;
      font-weight: 500;
    }
  }
}

.test-data-row {
  margin-top: 8px;
}

.collapse-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.output-title {
  font-size: 13px;
  font-weight: 500;
  &.error-title {
    color: variables.$danger-color;
  }
}

.output-content {
  background-color: variables.$background-light;
  border-radius: 4px;
  padding: 12px;
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid variables.$border-light;

  pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: monospace;
    font-size: 12px;
    line-height: 1.5;
  }

  &.error {
    background-color: variables.$background-danger-light;
    border-color: variables.$border-danger-light;
  }
}

.icon-margin {
  margin-right: 4px;
}
</style>