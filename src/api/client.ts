const API_BASE = '/api';

interface SubmissionPayload {
  answers: string[];
  scores: Record<string, number>;
  result: string;
  source?: string;
}

export async function submitSubmission(payload: SubmissionPayload): Promise<{ success: boolean; id: string }> {
  const res = await fetch(`${API_BASE}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Submit failed: ${res.status}`);
  return res.json();
}
