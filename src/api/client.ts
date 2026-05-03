const USER_ID_KEY = 'questionnaire_user_id';

// Hardcoded tunnel URL for production; Vite proxy in dev
const DEFAULT_BASE = import.meta.env.DEV ? '/api' : 'https://transactions-measures-congress-son.trycloudflare.com';

export function getApiBase(): string {
  return DEFAULT_BASE;
}

export function hasApiBase(): boolean {
  return true;
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export function getOrCreateUserId(): string {
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = generateUUID();
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

export function setUserId(id: string): void {
  localStorage.setItem(USER_ID_KEY, id);
}

interface SubmissionPayload {
  answers: string[];
  scores: Record<string, number>;
  result: string;
  source?: string;
  user_id: string;
  name: string;
  phone: string;
}

function apiUrl(path: string): string {
  const base = getApiBase();
  if (!base) throw new Error('API base not configured');
  const normalized = base.replace(/\/$/, '');
  // Auto-append /api if base doesn't already end with it
  const apiBase = normalized.endsWith('/api') ? normalized : `${normalized}/api`;
  return `${apiBase}${path}`;
}

export async function submitSubmission(
  payload: Omit<SubmissionPayload, 'user_id'>
): Promise<{ success: boolean; id: string; user_id?: string }> {
  const userId = getOrCreateUserId();
  const res = await fetch(apiUrl('/submit'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, user_id: userId }),
  });
  if (!res.ok) throw new Error(`Submit failed: ${res.status}`);
  const data = await res.json();
  if (data.user_id) {
    setUserId(data.user_id);
  }
  return data;
}

export async function checkVersion(): Promise<string> {
  const res = await fetch(apiUrl('/version'));
  if (!res.ok) throw new Error(`Version check failed: ${res.status}`);
  const data = await res.json();
  return data.version;
}

export async function listSubmissions(adminToken: string): Promise<{ count: number; submissions: unknown[] }> {
  const res = await fetch(apiUrl('/submissions'), {
    headers: { 'X-Admin-Token': adminToken },
  });
  if (!res.ok) throw new Error(`List failed: ${res.status}`);
  return res.json();
}

export async function exportSubmissions(adminToken: string): Promise<Blob> {
  const res = await fetch(apiUrl('/submissions/export'), {
    headers: { 'X-Admin-Token': adminToken },
  });
  if (!res.ok) throw new Error(`Export failed: ${res.status}`);
  return res.blob();
}

export async function getStats(adminToken: string): Promise<{ total: number; byResult: { result: string; count: number }[] }> {
  const res = await fetch(apiUrl('/stats'), {
    headers: { 'X-Admin-Token': adminToken },
  });
  if (!res.ok) throw new Error(`Stats failed: ${res.status}`);
  return res.json();
}
