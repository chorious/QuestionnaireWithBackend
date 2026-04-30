const { listSubmissions } = require('../db');

module.exports = function handleList(req, res) {
  const rows = listSubmissions(10000);
  res.json({ count: rows.length, submissions: rows });
};
