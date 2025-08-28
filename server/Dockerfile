FROM node:20

WORKDIR /app

# ネイティブモジュール用のビルドツール
RUN apt-get update && apt-get install -y build-essential python3 make g++

# package.json と lockファイルをコピー
COPY package.json package-lock.json* ./

# 依存関係インストール（強制）
RUN npm install --legacy-peer-deps --force

# アプリ全体をコピー
COPY . .

CMD ["node", "server.js"]
