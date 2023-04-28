# 第一阶段：编译和构建应用程序
FROM node:14-slim AS build
WORKDIR /index
# 安装应用程序的依赖项
COPY package*.json ./
RUN npm install
# 将应用程序复制到工作目录
COPY . .

# 第二阶段：运行应用程序
FROM node:14-slim

WORKDIR /index

# 从第一阶段中的构建结果中复制应用程序
COPY --from=build /index/ .

# 暴露端口
EXPOSE 3000

# 运行应用程序
CMD ["node", "index.js"]