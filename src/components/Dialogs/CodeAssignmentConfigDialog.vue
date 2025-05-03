<template>
  <el-dialog
      :title="config.id ? 'Edit Code Assignment Configuration' : 'Create Code Assignment Configuration'"
      v-model="visible"
      width="600px"
  >
    <el-form
        :model="form"
        :rules="rules"
        ref="formRef"
        label-width="180px"
        label-position="left"
    >
      <!-- Allowed Languages -->
      <el-form-item label="Allowed Languages" prop="allowedLanguages">
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
      <el-form-item label="Memory Limit" prop="memoryLimitMB">
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
      <el-form-item label="Time Limit" prop="timeLimitSeconds">
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

    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="visible = false">Cancel</el-button>
        <el-button type="primary" @click="submitForm" :loading="saving">
          {{ config.id ? 'Update' : 'Create' }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>


<script lang="ts" setup>
import { ref, reactive, watch, computed } from 'vue';
import {ElMessage, FormInstance, FormRules} from 'element-plus';
import { CodeAssignmentConfig } from '@/types/interfaces';
import apiRequest from '@/utils/apiUtils';

const props = defineProps({
  config: {
    type: Object as () => CodeAssignmentConfig,
    default: () => ({
      id: 0,
      allowedLanguages: '',
      memoryLimitEnabled: false,
      memoryLimitMB: 256,
      timeLimitEnabled: false,
      timeLimitSeconds: 5
    }),
  },
  assignmentId: {
    type: Number,
    default: 0,
  }
});

const visible = ref(false);
const emit = defineEmits(['update:config']);
const form = reactive<CodeAssignmentConfig>({
  id: 0,
  allowedLanguages: '',
  memoryLimitEnabled: false,
  memoryLimitMB: 256,
  timeLimitEnabled: false,
  timeLimitSeconds: 5,
});
const formRef = ref<FormInstance>();
// Form validation rules
const rules: FormRules = {
  allowedLanguages: [
    { required: true, message: 'Please select at least one language', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        if (!value || value.trim() === '') {
          callback(new Error('Please select at least one language'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ],
  memoryLimitMB: [
    {
      validator: (rule, value, callback) => {
        if (form.memoryLimitEnabled && (!value || value < 1)) {
          callback(new Error('Please enter a valid memory limit'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ],
  timeLimitSeconds: [
    {
      validator: (rule, value, callback) => {
        if (form.timeLimitEnabled && (!value || value < 1)) {
          callback(new Error('Please enter a valid time limit'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
};


const saving = ref(false);

// Available programming languages
const availableLanguages = [
  { value: 'python3', label: 'Python3' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'sql', label: 'SQLite'}
];

// Convert between string and array for languages
const selectedLanguages = computed({
  get: () => form.allowedLanguages ? form.allowedLanguages.split(',') : [],
  set: (value) => { form.allowedLanguages = value.join(','); }
});

// Watch for changes in props.config to update form
watch(() => props.config, (newConfig) => {
  Object.assign(form, newConfig);
}, { immediate: true, deep: true });

const submitForm = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (valid) {
      await saveConfig();
    } else {
      ElMessage.error('Please correct the errors in the form');
      return false;
    }
  });
};

const saveConfig = async () => {
  if (!form.id){
    emit('update:config', {...form});
    visible.value = false;
    ElMessage.success(`Configuration saved successfully`);
    return
  }
  saving.value = true;
  try {
    const endpoint = `/teachers/code-config`

    const savedConfig = await apiRequest<CodeAssignmentConfig>(
        endpoint,
        'POST',
        `Failed to update configuration`,
        {...form, assignmentId: props.assignmentId}
    );

    if (savedConfig) {
      ElMessage.success(`Configuration updated successfully`);
      emit('update:config', {...savedConfig});
      visible.value = false;
    }
  } catch (error) {
    console.error('Error saving configuration:', error);
  } finally {
    saving.value = false;
  }
};
const open = () => {
  visible.value = true;
};
defineExpose({open});
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