<script setup lang="ts">
import {computed, shallowRef} from 'vue';
import { useRoute } from "vue-router";
import { ElMessage } from 'element-plus';
import BaseMaterialForm from '@/components/Forms/BaseMaterialForm.vue';

const route = useRoute();
const courseId = route.query.courseId;
const baseMaterialFormRef = shallowRef<InstanceType<typeof BaseMaterialForm>>();

// 默认表单对象，包含Assignment特有的字段
const defaultForm = {
  title: '',
  type: 'assignment',
  description: '',
  dueDate: '',
  maxScore: 100,
  openDate: '',
  instructions: '',
  status: 'upcoming'
};

// 提交前的额外验证
const handleCreateAssignment = async () => {
  // 访问子组件的表单数据
  const materialForm = baseMaterialFormRef.value.materialForm;

  // 验证Assignment特有字段
  if (!materialForm.dueDate) {
    ElMessage.error('Please select a due date');
    return false;
  }
  if (!materialForm.openDate) {
    ElMessage.error('Please select an open date');
    return false;
  }
  //判断openDate和当前时间的先后关系
  if (new Date(materialForm.openDate) < new Date()) {
    ElMessage.error('Open date must be after current time');
    return false;
  }
  //判断openDate和dueDate的先后关系
  if (new Date(materialForm.openDate) >= new Date(materialForm.dueDate)) {
    ElMessage.error('Open date must be before due date');
    return false;
  }

  return true;
};

// 提交成功处理函数
const handleSubmitSuccess = (assignmentId: number) => {
  console.log('Assignment created with ID:', assignmentId);
};

// 定义一些计算属性，主要是因为v-model不允许js表达式的传入，因此需要使用计算属性来处理
const openDate = computed({
  get: () => baseMaterialFormRef.value?.materialForm.openDate,
  set: (value) => {
    if (baseMaterialFormRef.value) {
      baseMaterialFormRef.value.materialForm.openDate = value;
    }
  }
});

const dueDate = computed({
  get: () => baseMaterialFormRef.value?.materialForm.dueDate,
  set: (value) => {
    if (baseMaterialFormRef.value) {
      baseMaterialFormRef.value.materialForm.dueDate = value;
    }
  }
});

const maxScore = computed({
  get: () => baseMaterialFormRef.value?.materialForm.maxScore,
  set: (value) => {
    if (baseMaterialFormRef.value) {
      baseMaterialFormRef.value.materialForm.maxScore = value;
    }
  }
});

const instructions = computed({
  get: () => baseMaterialFormRef.value?.materialForm.instructions,
  set: (value) => {
    if (baseMaterialFormRef.value) {
      baseMaterialFormRef.value.materialForm.instructions = value;
    }
  }
});
</script>

<template>
  <el-main>
    <h2 class="page-title">Create Assignment</h2>
    <base-material-form
        ref="baseMaterialFormRef"
        :course-id="courseId"
        :default-form="defaultForm"
        api-path="assignments"
        :before-create="handleCreateAssignment"
        @submit-success="handleSubmitSuccess"
    >
      <!-- 使用插槽添加Assignment特有的字段 -->
      <template #additional-fields>
        <el-col :span="8">
          <el-form-item label="Open Date" required>
            <el-date-picker
                v-model="openDate"
                type="datetime"
                placeholder="Select open date"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
                style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="Due Date" required>
            <el-date-picker
                v-model="dueDate"
                type="datetime"
                placeholder="Select due date"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
                style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </template>

      <!-- 添加额外内容 -->
      <template #extra-content>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="Maximum Score">
              <el-input-number
                  v-model="maxScore"
                  :min="0"
                  :max="100"
                  :step="5"
                  style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Detailed Instructions">
          <el-input
              v-model="instructions"
              type="textarea"
              :rows="6"
              placeholder="Enter detailed instructions for completing the assignment"
          />
        </el-form-item>
      </template>
    </base-material-form>
  </el-main>
</template>