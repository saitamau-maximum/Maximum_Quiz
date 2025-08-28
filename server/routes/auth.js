import { Hono } from 'hono'
import bcrypt from 'bcrypt'
import Database from 'better-sqlite3'
import jwt from 'jsonwebtoken'

// 秘密鍵（本番環境では .env などから読み込む）
const JWT_SECRET = 'your-secret-key'

export const authRouter = new Hono()

// SQLite 初期化
const db = new Database('db/users.db')

// users テーブルを作成（存在しない場合）
db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run()

// --- JWT生成 ---
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },   // ペイロード
    JWT_SECRET,                           // 秘密鍵
    { expiresIn: '1d' }                   // 有効期限: 1日
  )
}

// --- 登録 ---
const userRegister = async (c) => {
  const { email, password } = await c.req.json()
  if (!email || !password)
    return c.json({ error: 'Email & password required' }, 400)

  try {
    const hashed = await bcrypt.hash(password, 10)
    const stmt = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)')
    const info = stmt.run(email, hashed)

    const user = { id: info.lastInsertRowid, email }
    const token = generateToken(user)

    return c.json({ success: true, user, token })
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return c.json({ error: 'Email already registered' }, 400)
    }
    return c.json({ error: err.message }, 500)
  }
}

// --- ログイン ---
const userLogin = async (c) => {
  const { email, password } = await c.req.json()
  if (!email || !password)
    return c.json({ error: 'Email & password required' }, 400)

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  if (!user) return c.json({ error: 'Invalid email or password' }, 401)

  const match = await bcrypt.compare(password, user.password)
  if (!match) return c.json({ error: 'Invalid email or password' }, 401)

  const token = generateToken(user)
  return c.json({ success: true, user: { id: user.id, email: user.email }, token })
}

// --- ログアウト（クライアント側でトークン削除するだけなのでサーバー処理不要）
const userLogout = async (c) => {
  return c.json({ success: true, message: 'Please delete token on client' })
}

// --- 認証確認 ---
const getCurrentUser = async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) return c.json({ user: null })

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return c.json({ user: { id: decoded.id, email: decoded.email } })
  } catch (err) {
    return c.json({ user: null })
  }
}

// ルーター登録
authRouter.post('/register', userRegister)
authRouter.post('/login', userLogin)
authRouter.post('/logout', userLogout)
authRouter.get('/me', getCurrentUser)
