import { Hono } from 'hono'
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server'
import { exec } from 'child_process'
import { writeFileSync, unlinkSync, readFileSync } from 'fs'
import crypto from 'crypto'

const app = new Hono();

app.use('*', cors());


app.post('/submit', async (c) => {
  const { code, problemId } = await c.req.json();
  const id = String(problemId);
  const filePath = `/tmp/${crypto.randomUUID()}.cpp`;

  writeFileSync(filePath, code);

  const compileCmd = `g++ ${filePath} -o ${filePath}.out`;
  const execCmd = `${filePath}.out < testcases/${id}/input.txt`;

  try {
    await new Promise((resolve, reject) => {
      exec(compileCmd, (_err, _stdout, stderr) => {
        if (_err) {
          reject(new Error(stderr));
        } else {
          resolve();
        }
      });
    });

    console.log('コンパイル成功');

    const output = await new Promise((resolve, reject) => {
      exec(execCmd, (err, stdout, _stderr) => {
        if (err) reject(err);
        else resolve(stdout);
      });
    });

    console.log('実行結果:', output);

    const expected = readFileSync(`testcases/${id}/output.txt`, 'utf-8');
    const isCorrect = output.trim() === expected.trim();

    return c.json({ status: isCorrect ? 'AC' : 'WA', output });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return c.json({ status: 'RE', error: errMsg });
  } finally {
    try {
      unlinkSync(filePath);
      unlinkSync(`${filePath}.out`);
    } catch (e) {
      console.warn('一時ファイルの削除に失敗しました:', e);
    }
  }
});



console.log('🚀 サーバーの起動に成功しました。 http://localhost:8000/submit')
serve({ fetch: app.fetch, port: 8000 })
