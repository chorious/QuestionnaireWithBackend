const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    answers TEXT NOT NULL,
    scores TEXT NOT NULL,
    result TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    source TEXT DEFAULT ''
  );
  CREATE INDEX IF NOT EXISTS idx_created_at ON submissions(created_at);
  CREATE INDEX IF NOT EXISTS idx_result ON submissions(result);
`);

function saveSubmission(submission) {
  const stmt = db.prepare(`
    INSERT INTO submissions (id, user_id, answers, scores, result, created_at, source)
    VALUES (@id, @user_id, @answers, @scores, @result, @created_at, @source)
  `);
  stmt.run({
    id: submission.id,
    user_id: submission.user_id,
    answers: JSON.stringify(submission.answers),
    scores: JSON.stringify(submission.scores),
    result: submission.result,
    created_at: submission.created_at,
    source: submission.source || '',
  });
}

function listSubmissions(limit = 10000) {
  const stmt = db.prepare(`
    SELECT * FROM submissions ORDER BY created_at DESC LIMIT @limit
  `);
  const rows = stmt.all({ limit });
  return rows.map(row => ({
    ...row,
    answers: JSON.parse(row.answers),
    scores: JSON.parse(row.scores),
  }));
}

function getStats() {
  const total = db.prepare('SELECT COUNT(*) as count FROM submissions').get();
  const byResult = db.prepare(`
    SELECT result, COUNT(*) as count FROM submissions GROUP BY result ORDER BY count DESC
  `).all();
  return { total: total.count, byResult };
}

module.exports = { db, saveSubmission, listSubmissions, getStats };
