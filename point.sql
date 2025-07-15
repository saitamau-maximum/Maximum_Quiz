CREATE TABLE IF NOT EXISTS quiz_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    correct_count INTEGER NOT NULL DEFAULT 0,
    wrong_count INTEGER NOT NULL DEFAULT 0,
    -- ここで得点状況を保存
);

SELECT * FROM quiz_results WHERE user_id = 'example_user';
INSERT INTO quiz_results (user_id, correct_count, wrong_count) VALUES ('example_user',  5, 3);
UPDATE quiz_results SET correct_count = 6 WHERE user_id = 'example_user';
DELETE FROM quiz_results WHERE user_id = 'example_user';
CREATE INDEX IF NOT EXISTS idx_user_id ON quiz_results (user_id);
CREATE TABLE IF NOT EXISTS quiz_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    options TEXT NOT NULL, -- JSON形式で選択肢を保存
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
SELECT * FROM quiz_questions WHERE id = 1;
INSERT INTO quiz_questions (question, answer, options) VALUES ('What is the capital of France?', 'Paris', '["Paris", "London", "Berlin", "Madrid"]');
UPDATE quiz_questions SET question = 'What is the capital of Germany?' WHERE id = 1;
DELETE FROM quiz_questions WHERE id = 1;
CREATE INDEX IF NOT EXISTS idx_question_id ON quiz_questions (id);
CREATE TABLE IF NOT EXISTS quiz_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);