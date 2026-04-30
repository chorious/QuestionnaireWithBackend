const { saveSubmission } = require('../db');

module.exports = function handleSubmit(req, res) {
  const body = req.body;

  const submission = {
    id: body.id || generateId(),
    user_id: body.user_id || generateId(),
    answers: body.answers || [],
    scores: body.scores || {},
    result: body.result || '',
    created_at: Date.now(),
    source: body.source || '',
  };

  saveSubmission(submission);

  res.json({ success: true, id: submission.id });
};

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
