import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { handleSubmit } from './routes/judgeHandler.js'; // c++実行関数インポート
//import { handleRanking } from './routes/ranking.js';//ランキングをインポート
import { authRouter } from './routes/auth.js'; // 認証関連のルーターをインポート

const app = new Hono();

app.use('*', cors());

// auth.js
// < ---  注　：　エンドポイントを叩くときは auth/login 等で ---　>
app.route('/auth', authRouter); // 認証関連のルーティングを追加


// judgeHandler.js
app.post('/submit', handleSubmit); // handleSubmitを使用


// ranking.js
//app.get('/ranking', handleRanking); // ランキングを取得するエンドポイント


const port = Number(process.env.PORT) || 8000;
console.log(`🚀 サーバー起動`);
serve({ fetch: app.fetch, port });
