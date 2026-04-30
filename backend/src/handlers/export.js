const { listSubmissions } = require('../db');

module.exports = function handleExport(req, res) {
  const rows = listSubmissions(10000);

  const headers = ['id', 'user_id', 'result', 'created_at', 'source', 'answers', 'scores'];
  const lines = [headers.join(',')];

  for (const row of rows) {
    const answers = typeof row.answers === 'string' ? row.answers : JSON.stringify(row.answers);
    const scores = typeof row.scores === 'string' ? row.scores : JSON.stringify(row.scores);
    const line = [
      escapeCsv(row.id),
      escapeCsv(row.user_id),
      escapeCsv(row.result),
      escapeCsv(new Date(row.created_at).toISOString()),
      escapeCsv(row.source || ''),
      escapeCsv(answers),
      escapeCsv(scores),
    ].join(',');
    lines.push(line);
  }

  const csv = '﻿' + lines.join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="submissions.csv"');
  res.send(csv);
};

function escapeCsv(value) {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}
