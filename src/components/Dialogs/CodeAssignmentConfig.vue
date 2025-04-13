<template>
  <el-dialog
      :title="config.id ? 'Edit Code Assignment Configuration' : 'Create Code Assignment Configuration'"
      v-model="visible"
      width="600px"
  >
    <el-form :model="form" label-width="180px" label-position="left">
      <!-- Allowed Languages -->
      <el-form-item label="Allowed Languages">
        <el-select
            v-model="selectedLanguages"
            multiple
            placeholder="Select languages"
            style="width: 100%"
        >
          <el-option
              v-for="lang in availableLanguages"
              :key="lang.value"
              :label="lang.label"
              :value="lang.value"
          />
        </el-select>
      </el-form-item>

      <!-- Memory Limit -->
      <el-form-item label="Memory Limit">
        <div class="limit-control">
          <el-switch v-model="form.memoryLimitEnabled" />
          <el-input-number
              v-model="form.memoryLimitMB"
              :disabled="!form.memoryLimitEnabled"
              :min="1"
              :max="2048"
              :step="32"
              controls-position="right"
          />
          <span class="unit-label">MB</span>
        </div>
      </el-form-item>

      <!-- Time Limit -->
      <el-form-item label="Time Limit">
        <div class="limit-control">
          <el-switch v-model="form.timeLimitEnabled" />
          <el-input-number
              v-model="form.timeLimitSeconds"
              :disabled="!form.timeLimitEnabled"
              :min="1"
              :max="60"
              :step="1"
              controls-position="right"
          />
          <span class="unit-label">seconds</span>
        </div>
      </el-form-item>

      <!-- Language Versions -->
      <el-form-item label="Language Versions">
        <el-input
            v-model="form.languageVersions"
            placeholder="e.g. Python 3.9, Java 17"
        />
      </el-form-item>

      <!-- Disabled Libraries -->
      <el-form-item label="Disabled Libraries">
        <el-input
            v-model="form.disabledLibraries"
            type="textarea"
            :rows="3"
            placeholder="List libraries separated by commas"
        />
      </el-form-item>

      <!-- Auto Grading -->
      <el-form-item label="Auto Grading">
        <el-switch v-model="form.autoGradingEnabled" />
      </el-form-item>

      <!-- Show Detailed Results -->
      <el-form-item label="Show Detailed Results">
        <el-switch v-model="form.showDetailedResults" />
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="visible = false">Cancel</el-button>
        <el-button type="primary" @click="saveConfig" :loading="saving">
          {{ config.id ? 'Update' : 'Create' }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, reactive, watch, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { CodeAssignmentConfig } from '@/types/interfaces';
import apiRequest from '@/utils/apiUtils';

const visible = defineModel<boolean>('visible', {
  type: Boolean,
  default: false,
});

const props = defineProps({
  config: {
    type: Object as () => CodeAssignmentConfig,
    default: () => ({
      id: 0,
      allowedLanguages: '',
      memoryLimitEnabled: false,
      memoryLimitMB: 256,
      timeLimitEnabled: false,
      timeLimitSeconds: 5,
      languageVersions: '',
      disabledLibraries: '',
      autoGradingEnabled: true,
      showDetailedResults: true,
    }),
  },
  assignmentId: {
    type: Number,
    default: 0,
  }
});

const form = reactive<CodeAssignmentConfig>({
  id: 0,
  allowedLanguages: '',
  memoryLimitEnabled: false,
  memoryLimitMB: 256,
  timeLimitEnabled: false,
  timeLimitSeconds: 5,
  languageVersions: '',
  disabledLibraries: '',
  autoGradingEnabled: true,
  showDetailedResults: true,
});

const saving = ref(false);

// Available programming languages
const availableLanguages = [
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'csharp', label: 'C#' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'go', label: 'Go' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' }
];

// Convert between string and array for languages
const selectedLanguages = computed({
  get: () => form.allowedLanguages ? form.allowedLanguages.split(',') : [],
  set: (value) => { form.allowedLanguages = value.join(','); }
});

// Watch for changes in props.config to update form
watch(() => props.config, (newConfig) => {
  Object.assign(form, {...newConfig,});
}, { immediate: true, deep: true });

const saveConfig = async () => {
  if (!form.id){
    visible.value = false;
    return
  }
  saving.value = true;
  try {
    const endpoint = `/teachers/assignments/${props.assignmentId}/code-config/${form.id}`

    const savedConfig = await apiRequest<CodeAssignmentConfig>(
        endpoint,
        'PUT',
        `Failed to update configuration`,
        form
    );

    if (savedConfig) {
      ElMessage.success(`Configuration updated successfully`);
      visible.value = false;
    }
  } catch (error) {
    console.error('Error saving configuration:', error);
  } finally {
    saving.value = false;
  }
};
</script>

<style lang="scss" scoped>
.limit-control {
  display: flex;
  align-items: center;
  gap: 12px;

  .unit-label {
    color: var(--el-text-color-secondary);
    margin-left: 4px;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>