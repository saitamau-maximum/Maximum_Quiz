// judgeHandler.js
import { exec } from 'child_process'
import { writeFileSync, unlinkSync, readFileSync } from 'fs'
import crypto from 'crypto'

/**
 * @param {import('hono').Context} c
 */
export async function handleSubmit(c) {
  const MAX_CODE_SIZE_BYTES = 512 * 1024 // 512 KiB

  const body = await c.req.json()

  // 入力チェック
  const code = body.code
  const problemId = body.problemId

  if (typeof code !== 'string' || typeof problemId === 'undefined') {
    return c.json({ status: 'RE', error: 'Invalid request format' }, 400)
  }

  const codeSize = Buffer.byteLength(code, 'utf8')
  if (codeSize > MAX_CODE_SIZE_BYTES) {
    return c.json({ status: 'RE', error: 'Code too large. Must be ≤ 512 KiB' }, 400)
  }

  const id = String(problemId)
  const filePath = `/tmp/${crypto.randomUUID()}.cpp`

  writeFileSync(filePath, code)

  const compileCmd = `g++ ${filePath} -o ${filePath}.out`
  const execCmd = `${filePath}.out < testcases/${id}/input.txt`

  try {
    // コンパイル（タイムアウト 2秒）
    await new Promise((resolve, reject) => {
      exec(compileCmd, { timeout: 2000 }, (_err, _stdout, stderr) => {
        if (_err) {
          reject(new Error(stderr || _err.message))
        } else {
          resolve()
        }
      })
    })

    console.log('コンパイル成功')

    // 実行（タイムアウト 2秒）
    const output = await new Promise((resolve, reject) => {
      exec(execCmd, { timeout: 2000 }, (err, stdout, stderr) => {
        if (err) {
          reject(new Error(stderr || err.message))
        } else {
          resolve(stdout)
        }
      })
    })

    console.log('実行結果:', output)

    const expected = readFileSync(`testcases/${id}/output.txt`, 'utf-8')
    const isCorrect = output.trim() === expected.trim()

    return c.json({ status: isCorrect ? 'AC' : 'WA', output })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    return c.json({ status: 'RE', error: errMsg })
  } finally {
    try {
      unlinkSync(filePath)
      unlinkSync(`${filePath}.out`)
    } catch (e) {
      console.warn('一時ファイルの削除に失敗しました:', e)
    }
  }
}
