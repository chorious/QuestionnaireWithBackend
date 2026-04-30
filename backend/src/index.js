const express = require('express');
const cors = require('cors');
const path = require('path');
const handleSubmit = require('./handlers/submit');
const handleList = require('./handlers/list');
const handleExport = require('./handlers/export');
const handleStats = require('./handlers/stats');

const pkg = require('../package.json');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API routes
app.get('/api/version', (req, res) => {
  res.json({ version: pkg.version });
});

app.post('/api/submit', handleSubmit);
app.get('/api/submissions', handleList);
app.get('/api/submissions/export', handleExport);
app.get('/api/stats', handleStats);

// Static frontend (built files go here)
app.use(express.static(path.join(__dirname, '..', '..', 'frontend', 'dist')));

// SPA fallback
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
  console.log('API endpoints:');
  console.log(`  POST http://localhost:${PORT}/api/submit`);
  console.log(`  GET  http://localhost:${PORT}/api/submissions`);
  console.log(`  GET  http://localhost:${PORT}/api/submissions/export`);
  console.log(`  GET  http://localhost:${PORT}/api/version`);
  console.log(`  GET  http://localhost:${PORT}/api/stats`);
});
