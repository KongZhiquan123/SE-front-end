<template>
  <el-main class="main-content-container">
    <div v-if="!classes.length" class="welcome-message">
      <h1>Welcome to Classroom</h1>
      <p>Add a class to get started</p>
      <div class="buttons">
        <el-button type="primary" @click="createClass">Create Class</el-button>
        <el-button @click="joinClass">Join Class</el-button>
      </div>
    </div>

    <div v-else class="classes-list">
      <h2>Your Classes</h2>
      <el-row :gutter="20">
        <el-col v-for="(item, index) in classes" :key="item.id" :xs="24" :sm="12" :md="8" :lg="6">
          <el-card
              class="class-card"
              :body-style="{ padding: '0px' }"
              :style="{ backgroundColor: getCardColor(index) }"
              @click="viewClass(item.id, item.name)"
          >
            <div class="card-content">
              <h3>{{ item.name }}</h3>
              <p>{{ item.description }}</p>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </el-main>
</template>

<script setup lang="ts">
import {onBeforeMount} from 'vue'
import {ElButton, ElRow, ElCol, ElCard} from 'element-plus'
import {ref} from "vue"
import {useRouter} from 'vue-router'
import type {ClassItem} from "../types/interfaces.ts";
//按照后端返回的数据结构定义接口

onBeforeMount(() => {
  //axios请求后端数据。当然，如果没有登录，可以把welcome message显示出来（classes数组为空）
  console.log('Home page mounted')
})
const classes = ref<ClassItem[]>(
    [{id: '1', name: 'Math', description: 'Mathematics class'},
      {id: '2', name: 'Science', description: 'Science class'},
      {id: '3', name: 'English', description: 'English class'},
      {id: '4', name: 'History', description: 'History class'},
      {id: '5', name: 'Geography', description: 'Geography class'},
      {id: '6', name: 'Computer Science', description: 'Computer Science class'},
      {id: '7', name: 'Physics', description: 'Physics class'},
      {id: '8', name: 'Chemistry', description: 'Chemistry class'},
      {id: '9', name: 'Biology', description: 'Biology class'},
      {id: '10', name: 'Economics', description: 'Economics class'}]
)

//创建班级
const createClass = () => {
  console.log('Create Class clicked')
}

//加入班级
const joinClass = () => {
  console.log('Join Class clicked')
}

const router = useRouter()
//查看班级详情
const viewClass = (classId: string, className: string) => {
  router.push({
    name: 'class-basic-info',
    query: { classID: classId, className: className }
  })
  console.log('View Class clicked, ','classId:',classId,'className:',className)
}

const colors = [
  '#FFE1E1', // 红色
  '#E1FFE1', // 绿色
  '#E1E1FF', // 蓝色
  '#FFE1FF', // 紫色
  '#FFFFE1', // 黄色
  '#E1FFFF'  // 青色
]

const getCardColor = (index: number): string => {
  return colors[index % colors.length]
}

</script>

<style scoped>
.main-content-container {
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.welcome-message {
  text-align: center;
}

.buttons {
  margin-top: 20px;
}

.classes-list {
  width: 100%;
}

.class-card {
  margin-bottom: 20px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.class-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-content {
  padding: 20px;
  color: #333;
}
</style>