# 使用Node.js作为基础镜像
FROM node:22-alpine as build-stage

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制项目文件
COPY . .

# 构建应用
RUN npm run build

# 使用nginx作为生产环境镜像
FROM nginx:stable-alpine as production-stage

# 从构建阶段复制构建好的文件到nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 添加自定义nginx配置 - 处理Vue路由
RUN echo 'server {\
    listen 80;\
    server_name _;\
    root /usr/share/nginx/html;\
    index index.html;\
    location / {\
        try_files $uri $uri/ /index.html;\
    }\
    location /api/ {\
        proxy_pass http://backend:8080;\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
    }\
}' > /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]