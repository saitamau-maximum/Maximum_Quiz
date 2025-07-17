import { readFile, writeFile, unlink } from 'fs/promises'
import { randomUUID } from 'crypto'
import { spawn } from 'child_process'
import path from 'path'

// Hono用：handleSubmit関数の定義
export const handleSubmit = async (c) => {
  try {
    const body = await c.req.json()
    console.log('[handleSubmit] Received request body:', body)

    const { code, problemId } = body
    if (!code || !problemId) {
      return c.json({ error: 'code と problemId の両方が必要です。' }, 400)
    }

    const filename = `/tmp/${randomUUID()}`
    const sourcePath = `${filename}.cpp`
    const binaryPath = `${filename}.out`

    // 1. 書き込み
    console.log('[handleSubmit] Writing source to:', sourcePath)
    await writeFile(sourcePath, code)

    // 2. コンパイル
    console.log('[handleSubmit] Compiling source...')
    await new Promise((resolve, reject) => {
      const compile = spawn('g++', [sourcePath, '-o', binaryPath])
      let compileError = ''

      compile.stderr.on('data', (data) => {
        compileError += data.toString()
      })

      compile.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          console.error('[handleSubmit] Compile Error:\n', compileError)
          reject(new Error(`コンパイル失敗 (exit code ${code}):\n${compileError}`))
        }
      })
    })

    // 3. テストケースの読み込み
    const inputPath = path.join('testcases', `${problemId}`, 'input.txt')
    const outputPath = path.join('testcases', `${problemId}`, 'output.txt')
    const input = await readFile(inputPath, 'utf8')
    const expected = (await readFile(outputPath, 'utf8')).trim()

    console.log('[handleSubmit] Running executable...')
    const child = spawn(binaryPath, [], { timeout: 10000 })
    let output = ''
    let error = ''

    child.stdout.on('data', (data) => {
      output += data.toString()
    })

    child.stderr.on('data', (data) => {
      error += data.toString()
    })

    child.stdin.write(input)
    child.stdin.end()

    const result = await new Promise((resolve, reject) => {
      child.on('close', (code, signal) => {
        if (signal === 'SIGTERM') {
          reject(new Error('実行がタイムアウトしました。'))
        } else if (code !== 0) {
          reject(new Error(`実行失敗 (exit code ${code}):\n${error}`))
        } else {
          resolve(output.trim())
        }
      })
    })

    const success = result === expected
    return c.json({ result, expected, success })
  } catch (err) {
    console.error('[handleSubmit] エラー:', err)
    return c.json({ error: err.message }, 500)
  } finally {
    // 一時ファイルの削除
    if (typeof sourcePath !== 'undefined' && typeof binaryPath !== 'undefined') {
      await Promise.allSettled([
        unlink(sourcePath),
        unlink(binaryPath)
      ])
    }
  }
}
