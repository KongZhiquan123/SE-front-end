<script setup lang="ts">
import {shallowRef} from 'vue';
import { useRoute } from "vue-router";
import BaseMaterialForm from "@/components/Forms/BaseMaterialForm.vue"

const route = useRoute();
const courseId = route.query.courseId;
const baseMaterialFormRef = shallowRef<InstanceType<typeof BaseMaterialForm>>();

// 默认表单对象
const defaultForm = {
  title: '',
  type: 'material',
  description: '',
  status: 'upcoming'
};

// 提交成功处理函数（可以添加例如导航到列表页等功能）
const handleSubmitSuccess = (materialId) => {
  console.log('Material created with ID:', materialId);
};
</script>

<template>
  <el-main>
    <h2 class="page-title">Create Course Material</h2>
    <base-material-form
        ref="baseMaterialFormRef"
        :course-id="courseId"
        :default-form="defaultForm"
        api-path="resources"
        @submit-success="handleSubmitSuccess"
    />
  </el-main>
</template>