# 软件工程项目
**项目详细信息链接:** [Blackboard 软件工程项目](https://bb.sustech.edu.cn/bbcswebdav/pid-508647-dt-content-rid-17334213_1/courses/CS304-30018694-2025SP/project-intro-2025.pdf)

## 目录
- [项目概述](#项目概述)
- [配置环境](#配置环境)
- [使用指南](#使用指南)
  - [学生使用流程](#学生使用流程)
  - [教师使用流程](#教师使用流程)
- [功能特点](#功能特点)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [后端仓库](#后端仓库)
- [支持与反馈](#支持与反馈)

## 项目概述
目前，计算机科学专业的学生需通过多个平台完成学业任务：在Blackboard（BB）提交文本和图像作业，在Online Judge（OJ）提交代码作业。

这种分散的评估体系存在诸多问题：学生需频繁切换平台，作业管理繁琐；代码评测因测试用例质量参差不齐导致结果不一致；手写作业的字迹清晰度可能影响最终成绩；此外，截止日期前的高并发访问常引发系统延迟，使提交过程充满压力且不可靠。

为此，我们开发了一套改进版作业评分系统以解决上述痛点。该系统并非对Blackboard、Sakai或Online Judge的简单复制，而是集成了文本、代码、图像及文档作业的全方位解决方案。

## 配置环境
- nodejs版本要求：>= 20.0.0
- npm版本要求：>= 9.0.0
首先确保您已经安装了Node.js和npm。然后克隆项目并安装依赖：
```bash
git clone https://github.com/KongZhiquan123/SE-front-end
cd SE-front-end
npm install
```
可以使用如下命令启动开发服务器，便于本地开发和调试：
```bash
npm run dev
```
也可以使用如下命令构建项目以生成生产环境代码：
```bash
npm run build
```
输出的代码将位于`dist/`目录下。

项目也使用了Docker进行容器化部署，您可以使用以下命令构建Docker镜像：
```bash
docker build -t software-engineering-project .
```

## 使用指南
### 学生使用流程
1. 注册账号或使用提供的账号登录系统
2. 通过课程代码加入课程
3. 查看课程作业列表和截止日期
4. 提交作业（代码、文本或文件）
5. 查看成绩和教师反馈
### 教师使用流程
1. 登录系统
2. 创建新课程或管理现有课程
3. 添加学生到课程
4. 创建作业并设置提交要求
5. 查看学生提交并评分
6. 发布课程公告和资源


## 功能特点
我们实现的核心功能包括：
- **统一平台:** 构建支持多类型作业提交的一站式系统，终结多平台切换的困扰
- **智能评阅:** 采用AI与规则引擎辅助手写作业/考试批改，显著降低人工工作量
- **友好交互:** 集成截止日历提醒、代码高亮编辑器等多项人性化功能

本项目基于Vue 3的`<script setup>`单文件组件开发，查阅[脚本设置文档](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup)获取更多信息。  
关于推荐的项目配置与IDE支持，请参考[Vue官方TypeScript指南](https://vuejs.org/guide/typescript/overview.html#project-setup)。  
`package.json`已包含Vue 3 TypeScript项目所有依赖，运行`npm install`即可安装。

## 技术栈
- Vue 3 (使用 Composition API 和 `<script setup>`)
- TypeScript (编程语言)
- Vite (构建工具)
- Pinia (状态管理)
- Vue Router (路由管理)
- Axios (HTTP 请求)
- Element Plus (UI 组件库)
- Monaco (代码编辑器)
- Lodash (实用工具库)
- Mammoth (PDF 处理)
- Sass (样式预处理)

## 项目结构
```
project/
├── public/          # 静态资源
├── src/             # 源代码
│   ├── assets/      # 资源文件
│   ├── components/  # 组件
│   ├── directives/   # 自定义指令
│   ├── views/       # 页面
│   ├── router/      # 路由
│   ├── stores/       # 状态管理
│   ├── utils/       # 工具函数
│   ├── types/        # TypeScript 类型定义
│   ├── App.vue      # 根组件
│   └── main.ts      # 入口文件
└── [其他文件和目录]
```

## 后端仓库
本项目为前后端分离架构，后端代码托管在独立仓库中。请访问以下链接获取后端代码：[Orion](https://github.com/zhqnb6666/Orion)

## 支持与反馈
如需支持或有任何问题，请提交issue或联系项目维护者（12211205@mail.sustech.edu.cn)
