FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# C++ コンパイルのために build-essential を追加
RUN apt-get update && apt-get install -y build-essential

CMD ["node", "server.js"]
