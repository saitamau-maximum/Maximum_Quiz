FROM node:20


RUN apt-get update && apt-get install -y g++


WORKDIR /app


COPY . .


RUN npm install


EXPOSE 8000


CMD ["node", "server.js"]
