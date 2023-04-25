FROM node:14-alpine
LABEL authors="xuanqb"

RUN apk update && apk add bash tzdata && cp -r -f /usr/share/zoneinfo/Asia/Shanghai /etc/localtime

# 设置工作目录
WORKDIR /app

# 将 package.json 和 package-lock.json 复制到工作目录
COPY package*.json ./

# 安装依赖项
RUN npm install

# 将应用程序复制到工作目录
COPY . .

# 暴露端口
EXPOSE 3000

# 运行应用程序
CMD ["node", "app.js"]