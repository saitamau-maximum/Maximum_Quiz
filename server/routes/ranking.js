import { Hono } from 'hono';
import { serve } from '@hono/node-server';
 
const app = new Hono();
 
let users = [
  { id: 1, name: '田中太郎', age: 20, hobby: 'プログラミング' },
  { id: 2, name: '佐藤花子', age: 22, hobby: '読書' },
  { id: 3, name: '鈴木次郎', age: 19, hobby: 'ゲーム' }
];
 
// GET メソッドは省略
 
app.post('/api/users', async (c) => {
  try {
    // リクエストボディを取得
    const { name, age, hobby } = await c.req.json();
 
    // 一番大きいid + 1 を新しいユーザーのidとする
    const newId = users.length + 1;
 
    const newUser = {
      id: newId,
      name,
      age: parseInt(age, 10),
      hobby
    };
 
    users.push(newUser);
 
    // 全ユーザーを返す（新規ユーザー含む）
    return c.json(users, 201);
  } catch (err) {
    console.error('jsonのデータ取得に失敗しました.');
    return c.json({ error: '不正なjson形式です' }, 400);
  }
});
 
 
//サーバーの立ち上げは省略