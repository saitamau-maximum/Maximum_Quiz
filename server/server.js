import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { handleSubmit } from './routes/judgeHandler.js'; // 修正したインポート

const app = new Hono();

app.use('*', cors());

app.post('/submit', handleSubmit); // handleSubmitを使用

const port = Number(process.env.PORT) || 8000;
console.log(`🚀 サーバー起動: http://localhost:${port}/submit`);
serve({ fetch: app.fetch, port });
