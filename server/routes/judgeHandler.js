import { exec } from 'child_process'
import { writeFileSync, unlinkSync, readFileSync } from 'fs'
import crypto from 'crypto'

export async function handleSubmit(c) {
  const MAX_CODE_SIZE_BYTES = 512 * 1024 // 512 KiB

  try {
    const body = await c.req.json()
    console.log('[handleSubmit] Received request body:', body)

    const code = body.code
    const problemId = body.problemId

    if (typeof code !== 'string' || typeof problemId === 'undefined') {
      console.log('[handleSubmit] Invalid request format')
      return c.json({ status: 'RE', error: 'Invalid request format' }, 400)
    }

    const codeSize = Buffer.byteLength(code, 'utf8')
    if (codeSize > MAX_CODE_SIZE_BYTES) {
      console.log(`[handleSubmit] Code too large: ${codeSize} bytes`)
      return c.json({ status: 'RE', error: 'Code too large. Must be ≤ 512 KiB' }, 400)
    }

    const id = String(problemId)
    const filePath = `/var/tmp/${crypto.randomUUID()}.cpp`

    console.log(`[handleSubmit] Writing code to file: ${filePath}`)
    writeFileSync(filePath, code)

    const compileCmd = `g++ ${filePath} -o ${filePath}.out`
    console.log('[handleSubmit] Compile command:', compileCmd)

    await new Promise((resolve, reject) => {
      exec(compileCmd, { timeout: 2000 }, (_err, _stdout, stderr) => {
        if (_err) {
          console.log('[handleSubmit] Compile error:', stderr || _err.message)
          reject(new Error(stderr || _err.message))
        } else {
          console.log('[handleSubmit] Compile succeeded')
          resolve()
        }
      })
    })

    const execCmd = `timeout 2s ${filePath}.out < /app/testcases/${id}/input.txt`
    console.log('[handleSubmit] Execution command:', execCmd)

    const output = await new Promise((resolve, reject) => {
      exec(execCmd, { timeout: 2000 }, (err, stdout, stderr) => {
        if (err) {
          console.log('[handleSubmit] Execution error:', stderr || err.message)
          reject(new Error(stderr || err.message))
        } else {
          console.log('[handleSubmit] Execution succeeded. Output:', stdout)
          resolve(stdout)
        }
      })
    })

    const expectedPath = `/app/testcases/${id}/output.txt`
    console.log('[handleSubmit] Reading expected output from:', expectedPath)
    const expected = readFileSync(expectedPath, 'utf-8')

    const isCorrect = output.trim() === expected.trim()
    console.log('[handleSubmit] Result:', isCorrect ? 'AC' : 'WA')

    return c.json({ status: isCorrect ? 'AC' : 'WA', output })
  } catch (error) {
    console.log('[handleSubmit] Error caught:', error)
    const errMsg = error instanceof Error ? error.message : String(error)
    return c.json({ status: 'RE', error: errMsg })
  } finally {
    try {
      console.log('[handleSubmit] Cleaning up temporary files')
      unlinkSync(filePath)
      unlinkSync(`${filePath}.out`)
    } catch (e) {
      console.warn('[handleSubmit] Failed to delete temporary files:', e)
    }
  }
}
