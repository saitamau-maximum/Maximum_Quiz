import { readFile, writeFile, unlink } from 'fs/promises'
import { randomUUID } from 'crypto'
import { spawn } from 'child_process'
import path from 'path'

export const handleSubmit = async (c) => {
  const MAX_CODE_SIZE_BYTES = 512 * 1024
  const NUM_TESTCASE = 3 // ← テストケース数

  let sourcePath, binaryPath

  try {
    const body = await c.req.json()
    const { code, problemId } = body

    if (typeof code !== 'string' || typeof problemId === 'undefined') {
      return c.json({ status: 'RE', error: 'Invalid request format' }, 400)
    }

    const codeSize = Buffer.byteLength(code, 'utf8')
    if (codeSize > MAX_CODE_SIZE_BYTES) {
      return c.json({ status: 'RE', error: 'Code too large. Must be ≤ 512 KiB' }, 400)
    }

    const filename = `/tmp/${randomUUID()}`
    sourcePath = `${filename}.cpp`
    binaryPath = `${filename}.out`

    await writeFile(sourcePath, code)

    // コンパイル
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
          reject(new Error(`Compilation error:\n${compileError}`))
        }
      })
    })

    // テストケース実行ループ
    for (let i = 1; i <= NUM_TESTCASE; i++) {
      const inputPath = path.join('testcases', `Problem${problemId}`, `testcase${i}`, 'input.txt')
      const outputPath = path.join('testcases', `Problem${problemId}`, `testcase${i}`, 'output.txt')

      const input = await readFile(inputPath, 'utf8')
      const expected = (await readFile(outputPath, 'utf8')).trim()

      const result = await new Promise((resolve, reject) => {
        const child = spawn(binaryPath, [], { timeout: 2000 })
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

        child.on('close', (code, signal) => {
          if (signal === 'SIGTERM') {
            reject(new Error('Execution timed out'))
          } else if (code !== 0) {
            reject(new Error(`Execution failed (exit code ${code})\n${error}`))
          } else {
            resolve(output.trim())
          }
        })
      })

      if (result !== expected) {
        return c.json({ status: 'WA', testcase: i, output: result, expected })
      }
    }

    return c.json({ status: 'AC' })

  } catch (err) {
    console.error('[handleSubmit] Error:', err)
    return c.json({ status: 'RE', error: err.message })
  } finally {
    await Promise.allSettled([
      sourcePath && unlink(sourcePath),
      binaryPath && unlink(binaryPath)
    ])
  }
}
