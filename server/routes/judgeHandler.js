import { readFile } from 'fs/promises';
import { writeFile, unlink } from 'fs/promises';
import { randomUUID } from 'crypto';
import { spawn } from 'child_process';
import path from 'path';

// handleSubmit関数の定義
export const handleSubmit = async (c) => {
  const body = await c.req.json();
  console.log('[handleSubmit] Received request body:', body);

  const { code, problemId } = body;
  const filename = `/tmp/${randomUUID()}`;
  const sourcePath = `${filename}.cpp`;
  const binaryPath = `${filename}.out`;

  try {
    // 1. 書き込み
    console.log('[handleSubmit] Writing code to file:', sourcePath);
    await writeFile(sourcePath, code);

    // 2. コンパイル（stderr 収集付き）
    console.log('[handleSubmit] Compiling...');
    await new Promise((resolve, reject) => {
      const compile = spawn('g++', [sourcePath, '-o', binaryPath]);

      let compileError = '';

      compile.stderr.on('data', (data) => {
        compileError += data.toString();
      });

      compile.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          console.error('[handleSubmit] Compile error:\n', compileError);
          reject(new Error(`Compilation failed with exit code ${code}:\n${compileError}`));
        }
      });
    });

    // 3. テストケース読み込み
    const inputPath = path.join('testcases', `${problemId}`, 'input.txt');
    const expectedPath = path.join('testcases', `${problemId}`, 'output.txt');
    const input = await readFile(inputPath, 'utf8');
    const expected = (await readFile(expectedPath, 'utf8')).trim();

    console.log('[handleSubmit] Executing binary:', binaryPath);

    const child = spawn(binaryPath, [], {
      timeout: 10000,
    });

    let output = '';
    let error = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      error += data.toString();
    });

    child.stdin.write(input);
    child.stdin.end();

    const result = await new Promise((resolve, reject) => {
      child.on('close', (code, signal) => {
        if (signal === 'SIGTERM') {
          reject(new Error('Execution timed out'));
        } else if (code !== 0) {
          reject(new Error(`Execution failed with exit code ${code}\n${error}`));
        } else {
          resolve(output.trim());
        }
      });
    });

    const success = result === expected;
    return c.json({ result, expected, success });

  } catch (err) {
    console.error('[handleSubmit] Runtime error:', err);
    return c.json({ error: err.message }, 500);
  } finally {
    // クリーンアップ
    await Promise.allSettled([
      unlink(sourcePath),
      unlink(binaryPath),
    ]);
  }
};
