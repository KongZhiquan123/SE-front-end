<script setup lang="ts">
import {ref, onMounted, onBeforeUnmount, shallowRef} from 'vue';
import {ElMessage} from "element-plus";
import {useRouter} from 'vue-router';
import { Document, Monitor, Cpu, Timer, Collection, Upload } from '@element-plus/icons-vue'
// editorContainer元素的引用，它在挂载到DOM后会被用来初始化monaco编辑器
const editorContainer = shallowRef<HTMLElement | null>(null);
// 用于导入monaco-editor
const monaco = shallowRef(null);
// 默认选择python语言
const codeLanguage = ref<'python' | 'java' | 'cpp'>('python');
// 亮色主题默认开启
const isLightTheme = ref<boolean>(true);
/*
对于monaco.editor.IStandaloneCodeEditor这种复杂的对象（该对象属性有成千上万个），一定要使用shallowRef。
否则如果使用ref，递归的对它的所有属性都进行响应式处理的话，一旦调用它的任何方法，引发更新，就会直接卡死。
详见https://cn.vuejs.org/guide/extras/reactivity-in-depth#how-reactivity-works-in-vue
*/
const editorInstance = shallowRef(null);
// 添加加载状态标识
const isEditorLoading = ref(false);
// 问题描述
interface Problem {
  title: string;
  description: string;
  instructions: string;
  allowedLanguages: string;
  memoryLimitEnabled: boolean;
  memoryLimitMB: number;
  timeLimitEnabled: boolean;
  timeLimitSeconds: number;
}
// 测试
const problem = ref<Problem>({
  title: 'Two Sum',
  description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
  instructions: 'You can return the answer in any order.',
  allowedLanguages: 'Python, Java, C++',
  memoryLimitEnabled: true,
  memoryLimitMB: 512,
  timeLimitEnabled: true,
  timeLimitSeconds: 2
});

//不同语言的代码模板
const codeTemplates = {
  python: `def myFunc(arg1, arg2):
    # Your code here
    pass
`,
  java: `class Solution {
    public int[] myFunc(int[] nums, int target) {
        // Your code here
        return new int[]{0, 0};
    }
}`,
  cpp: `#include <vector>

std::vector<int> myFunc(std::vector<int>& nums, int target) {
    // Your code here
    return {0, 0};
}`
};

// 懒加载Monaco Editor
const loadMonacoEditor = async () => {
  if (isEditorLoading.value) return;
  isEditorLoading.value = true;

  try {
    // 动态导入Monaco Editor，避免进入页面时加载过多资源，导致卡顿
    monaco.value = await import('monaco-editor');
    await setupEditor(monaco.value);
  } catch (error) {
    console.error('Failed to load Monaco Editor:', error);
    ElMessage.error('Monaco Editor failed to load, please try again later');
  } finally {
    isEditorLoading.value = false;
  }
};

// 设置编辑器函数
const setupEditor = async (monaco) => {
  // 设置编辑器主题
  setupEditorThemes(monaco);

  if (editorContainer.value) {
    // 创建编辑器实例
    editorInstance.value = monaco.editor.create(editorContainer.value, {
      value: codeTemplates[codeLanguage.value],
      language: codeLanguage.value,
      theme: isLightTheme.value ? 'customLightTheme' : 'customDarkTheme',
      automaticLayout: true,
      minimap: {enabled: true},
      scrollBeyondLastLine: false,
      lineNumbers: 'on',
      tabSize: 4,
      fontSize: 14,
      renderLineHighlight: 'all',
      scrollbar: {
        useShadows: false,
        verticalHasArrows: true,
        horizontalHasArrows: true,
        vertical: 'visible',
        horizontal: 'visible',
        verticalScrollbarSize: 12,
        horizontalScrollbarSize: 12,
      }
    });
  }
};

// vscode主题
const setupEditorThemes = (monaco) => {
  // Dark theme
  monaco.editor.defineTheme('customDarkTheme', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#2a2a3a',
      'editor.foreground': '#f8f8f2',
      'editor.lineHighlightBackground': '#2a2a3a',
      'editorCursor.foreground': '#f8f8f2',
      'editorWhitespace.foreground': '#3B3A32'
    }
  });

  // Light theme
  monaco.editor.defineTheme('customLightTheme', {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#2c3e50',
      'editor.lineHighlightBackground': '#f5f5f5',
      'editorCursor.foreground': '#333333',
      'editorWhitespace.foreground': '#d4d4d4'
    }
  });
};

// 切换主题
const toggleEditorTheme = () => {
  if (editorInstance.value) {
    const customTheme = isLightTheme.value ? 'customLightTheme' : 'customDarkTheme';
    editorInstance.value.updateOptions({theme: customTheme});
  }
};

// 当组件挂载时，初始化编辑器
onMounted(() => {
  // 组件挂载后加载编辑器
  loadMonacoEditor();
});

// 当组件卸载时，销毁编辑器，你应该学习cpp的品德
onBeforeUnmount(() => {
  if (editorInstance.value) {
    editorInstance.value.dispose();
    editorInstance.value = null;
  }
  // 销毁所有编辑器的模型
  if (monaco.value.editor) {
    monaco.value.editor.getModels().forEach(model => {
      if (model && typeof model.dispose === 'function') {
        model.dispose();
      }
    });
    editorModels.value = {};
  }
});

// 用于存储不同语言的编辑器模型，避免切换语言时重新创建模型实例
const editorModels = shallowRef({});

// 切换语言处理函数
const handleLanguageChange = (newLanguage: 'python' | 'java' | 'cpp') => {
  if (!editorInstance.value || !monaco.value) return;

  if (!editorModels.value[newLanguage]) {
    editorModels.value[newLanguage] = monaco.value.editor.createModel(
        codeTemplates[newLanguage],
        newLanguage
    );
  }

  editorInstance.value.setModel(editorModels.value[newLanguage]);
  codeLanguage.value = newLanguage;
};
const router = useRouter();
// 提交代码函数
const submitCode = () => {
  if (!editorInstance.value) return;
  const code = editorInstance.value.getValue();
  // TODO: 将code提交到后端进行评测
  router.push('/code-edit-and-run/code-run');
  console.log(`Submitting ${codeLanguage.value} code:`, code);
  ElMessage.success('Submit successfully');
};
</script>

<template>
  <el-main class="code-editor-wrapper">
    <el-card class="code-editor-container" shadow="never">
      <el-row :gutter="0">
        <!-- 问题描述 -->
        <el-col :span="10" class="problem-panel">
          <h2 class="problem-title">
            <el-icon><Document /></el-icon>
            {{ problem.title }}
          </h2>
          <el-divider/>
          <div class="problem-description">
            <p>{{ problem.description }}</p>
            <p v-if="problem.instructions" class="instructions">{{ problem.instructions }}</p>

            <div class="limits-section" v-if="problem.memoryLimitEnabled || problem.timeLimitEnabled">
              <h3>
                <el-icon><Monitor /></el-icon>
                Limits:
              </h3>
              <el-card shadow="hover" class="limits-card">
                <div class="limit-item" v-if="problem.memoryLimitEnabled">
                  <el-icon><Cpu /></el-icon>
                  <span>Memory Limit: <strong>{{ problem.memoryLimitMB }} MB</strong></span>
                </div>
                <div class="limit-item" v-if="problem.timeLimitEnabled">
                  <el-icon><Timer /></el-icon>
                  <span>Time Limit: <strong>{{ problem.timeLimitSeconds }} seconds</strong></span>
                </div>
              </el-card>
            </div>

            <h3 v-if="problem.allowedLanguages">
              <el-icon><Collection /></el-icon>
              Allowed Languages:
            </h3>
            <template v-if="problem.allowedLanguages">
              <el-tag
                  v-for="lang in problem.allowedLanguages.split(',')"
                  :key="lang"
                  class="language-tag"
                  type="info"
                  effect="plain"
              >
                {{ lang.trim() }}
              </el-tag>
            </template>
          </div>
        </el-col>

        <!-- 代码编辑 -->
        <el-col :span="14" class="editor-panel">
          <el-card class="editor-card" shadow="never">
            <template #header>
              <div class="editor-header">
                <div class="language-selector">
                  <span>Language:</span>
                  <el-select v-model="codeLanguage" size="default" placeholder="Select language"
                             @change="handleLanguageChange">
                    <el-option label="Python" value="python"/>
                    <el-option label="Java" value="java"/>
                    <el-option label="C++" value="cpp"/>
                  </el-select>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span>Theme:</span>
                  <el-switch v-model="isLightTheme" active-text="Light" inactive-text="Dark"
                             @change="toggleEditorTheme"/>
                </div>
                <el-button type="primary" size="default" @click="submitCode" :icon="Upload">Submit Solution</el-button>
              </div>
            </template>

            <div ref="editorContainer" class="monaco-editor-container">
              <el-skeleton :loading="isEditorLoading" animated v-if="isEditorLoading">
                <template #template>
                  <div style="height: 100%; padding: 20px;">
                    <el-skeleton-item variant="text" style="height: 20px; margin-bottom: 10px; width: 90%"/>
                    <el-skeleton-item variant="text" style="height: 20px; margin-bottom: 10px; width: 80%"/>
                    <el-skeleton-item variant="text" style="height: 20px; margin-bottom: 10px; width: 85%"/>
                    <el-skeleton-item variant="text" style="height: 20px; margin-bottom: 10px; width: 70%"/>
                    <el-skeleton-item variant="text" style="height: 20px; width: 75%"/>
                  </div>
                </template>
              </el-skeleton>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </el-main>
</template>

<style lang="scss" scoped>
$primary-color: #409eff;
$background-color: #ffffff;
$border-color: #ebeef5;
$text-color: #2c3e50;
$card-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

.code-editor-wrapper {
  width: 100%;
  height: 100%;
  padding: 0;
}

.code-editor-container {
  height: 100%;
  display: flex;
  border: none;
  background-color: $background-color;

  :deep(.el-card__body) {
    height: 100%;
    padding: 0;
  }

  .el-row {
    height: 100%;
  }
}

.problem-panel {
  height: 100%;
  overflow-y: auto;
  background-color: #f8fafc;
  border-right: 1px solid $border-color;
  transition: all 0.3s ease;
  padding: 20px;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
  }

  .problem-title {
    margin-top: 0;
    color: $text-color;
    font-size: 22px;
    display: flex;
    align-items: center;
    gap: 10px;

    .el-icon {
      color: $primary-color;
    }
  }

  .problem-description {
    line-height: 1.6;
    color: $text-color;

    h3 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-size: 18px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;

      .el-icon {
        color: $primary-color;
        font-size: 18px;
      }
    }

    p {
      margin-bottom: 16px;
    }

    .instructions {
      padding: 12px;
      background-color: #f0f9eb;
      border-left: 4px solid #67c23a;
      border-radius: 4px;
    }
  }

  .limits-card {
    margin-bottom: 16px;
    border-radius: 6px;
    background-color: #fff;
    padding: 20px;

    .limit-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }

      .el-icon {
        color: $primary-color;
      }
    }
  }

  .language-tag {
    margin-right: 8px;
    margin-bottom: 8px;
  }
}

.editor-panel {
  height: 100%;
  display: flex;
  flex-direction: column;

  .editor-card {
    height: 100%;
    display: flex;
    flex-direction: column;
    border: none;

    :deep(.el-card__header) {
      padding: 12px 20px;
      background-color: #f8fafc;
      border-bottom: 1px solid $border-color;
    }

    :deep(.el-card__body) {
      flex: 1;
      padding: 0;
      overflow: hidden;
    }
  }

  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .language-selector {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 25%;

      span {
        font-weight: 500;
        color: $text-color;
      }
    }
  }

  .monaco-editor-container {
    height: 100%;
    width: 100%;
  }
}

// 添加响应式布局
@media (max-width: 1200px) {
  .code-editor-container {
    flex-direction: column;

    .el-row {
      flex-direction: column;
    }

    .problem-panel, .editor-panel {
      width: 100%;
      max-width: 100%;
    }

    .problem-panel {
      height: 40%;
      border-right: none;
      border-bottom: 1px solid $border-color;
    }

    .editor-panel {
      height: 60%;
    }
  }
}
</style>