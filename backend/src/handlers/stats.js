const { getStats } = require('../db');

module.exports = function handleStats(req, res) {
  const stats = getStats();
  res.json(stats);
};
