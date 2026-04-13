#!/usr/bin/env node
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xzkasvcqvddmgybzajeu.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const FLOWMANDO_PROJECT = process.env.FLOWMANDO_PROJECT || '';
async function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    const timeout = setTimeout(() => { resolve(null); }, 5000);
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => {
      clearTimeout(timeout);
      try { resolve(JSON.parse(data)); } catch { resolve(null); }
    });
    process.stdin.on('error', () => { clearTimeout(timeout); resolve(null); });
    process.stdin.resume();
  });
}
async function supabaseRequest(endpoint, method, body) {
  if (!SUPABASE_ANON_KEY) return null;
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
      method,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal'
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000)
    });
    if (method === 'POST' && response.ok) {
      const result = await response.json();
      return result?.[0] || null;
    }
    return response.ok;
  } catch { return null; }
}
async function handleSessionStart(event) {
  if (!FLOWMANDO_PROJECT) return;
  const result = await supabaseRequest('agent_sessions', 'POST', {
    project_slug: FLOWMANDO_PROJECT,
    agent_name: 'claude-code',
    status: 'active',
    started_at: new Date().toISOString()
  });
  if (result?.id) process.env._RYNO_SESSION_ID = result.id;
}
async function handlePostToolUse(event) {
  const sessionId = event.session_id || event.sessionId;
  const toolName = event.tool_name || event.toolName || event.tool;
  if (!sessionId || !FLOWMANDO_PROJECT) return;
  const toolInput = event.tool_input || event.input || {};
  const filePath = toolInput.file_path || toolInput.path || toolInput.command || '';
  await supabaseRequest('agent_events', 'POST', {
    session_id: sessionId,
    event_type: 'PostToolUse',
    tool_name: toolName,
    file_path: typeof filePath === 'string' ? filePath.slice(0, 500) : '',
    detail: { success: !(event.tool_result || event.result || {}).error },
    timestamp: new Date().toISOString()
  });
}
async function handleStop(event) {
  const sessionId = event.session_id || event.sessionId;
  if (!sessionId) return;
  await supabaseRequest(
    `agent_sessions?id=eq.${sessionId}`, 'PATCH',
    { stopped_at: new Date().toISOString(), status: 'stopped' }
  );
}
async function main() {
  try {
    const event = await readStdin();
    if (!event) { process.exit(0); }
    const eventType = event.type || event.event_type || event.hook;
    switch (eventType) {
      case 'SessionStart': case 'session_start': await handleSessionStart(event); break;
      case 'PostToolUse': case 'post_tool_use': case 'tool_use': await handlePostToolUse(event); break;
      case 'Stop': case 'stop': case 'session_stop': await handleStop(event); break;
    }
  } catch {}
  process.exit(0);
}
main();
