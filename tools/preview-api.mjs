/** Disposable local UI fixtures. Never used by the Go API or a production build. */
import http from 'node:http';
import { randomUUID } from 'node:crypto';
const timestamp = () => new Date().toISOString();
const user = { id: randomUUID(), display_name: 'Alex Morgan', email: 'alex@example.test' };
let twins = [
  { id: randomUUID(), name: 'Everyday me', language: 'English', style_summary: 'A thoughtful sounding board for everyday decisions, big ideas, and everything in between.', sliders: { humor: 0.6, formality: 0.3, empathy: 0.8 }, samples: [{ text: 'I like to keep things simple, stay curious, and make a little progress every day.' }], created_at: timestamp(), updated_at: timestamp() },
  { id: randomUUID(), name: 'Creative partner', language: 'English', style_summary: 'Curious by nature. Here to find a fresh angle and turn a spark into something worth making.', sliders: { humor: 0.8, formality: 0.2, empathy: 0.7 }, samples: [{ text: 'What if we looked at it a little differently? There is usually another way in.' }], created_at: timestamp(), updated_at: timestamp() },
];
let sessions = ['A little clarity on what comes next', 'Finding the words for a new idea', 'Small steps, meaningful progress', 'A different way to look at things'].map((title, index) => ({ id: randomUUID(), personality_id: twins[index % 2].id, title, updated_at: timestamp(), messages: [{ id: randomUUID(), from_user: true, content: 'Help me think through a new idea.', created_at: timestamp() }, { id: randomUUID(), from_user: false, content: 'Of course. Let’s start with the part that feels most interesting to you. **What is the idea, and what would you like to do with it?**', created_at: timestamp(), metadata: { sources: [] } }] }));
let memories = [
  { id: randomUUID(), personality_id: twins[0].id, content: 'I prefer clear, thoughtful answers with a few practical next steps.', tags: 'preferences, communication', created_at: timestamp() },
  { id: randomUUID(), personality_id: twins[0].id, content: 'I am learning to build useful software and want to make time for a small creative project each week.', tags: 'goals, creativity', created_at: timestamp() },
  { id: randomUUID(), personality_id: twins[0].id, content: 'My best ideas usually come from a walk and a little time away from the screen.', tags: 'habits', created_at: timestamp() },
];
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  let data = ''; for await (const chunk of req) { data += chunk; if (data.length > 1_048_576) { res.writeHead(413); res.end(); return; } }
  let input; try { input = data ? JSON.parse(data) : {}; } catch { res.writeHead(400); res.end(); return; }
  const send = (body, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(status === 204 ? undefined : JSON.stringify(body)); };
  if (url.pathname.startsWith('/auth/')) return send({ user: { ...user, display_name: input.display_name || user.display_name }, token: 'disposable-preview-token' });
  if (req.headers.authorization !== 'Bearer disposable-preview-token') return send({ error: 'Fixture session expired. Sign in with any test email and password.' }, 401);
  const resourceId = url.pathname.split('/')[3];
  if (url.pathname === '/api/me') return send({ user });
  if (url.pathname === '/api/export') return send({ version: 1, user, twins, sessions, memories });
  if (url.pathname === '/api/chat') {
    if (input.message.includes('[fail]')) return send({ error: 'Simulated provider failure.' }, 502);
    let session = sessions.find(s => s.id === input.session_id);
    if (!session) { session = { id: randomUUID(), personality_id: input.personality_id, title: input.message.slice(0, 70), updated_at: timestamp(), messages: [] }; sessions.unshift(session); }
    const sources = memories.filter(m => m.personality_id === input.personality_id).slice(0, 2).map(m => ({ id: m.id, text: m.content, kind: 'memory', score: 0.8 }));
    const messages = [{ id: randomUUID(), from_user: true, content: input.message, created_at: timestamp() }, { id: randomUUID(), from_user: false, content: '**Preview response** — this is disposable fixture data, not a live Gemini reply.\n\nLet’s break the idea into a few small steps:\n\n1. Define what you want to achieve.\n2. Find one action you can take today.\n3. Reflect on what you learn.\n\nWhat would a useful first step look like for you?', metadata: { sources }, created_at: timestamp() }];
    session.messages.push(...messages); session.updated_at = timestamp(); return send({ session_id: session.id, reply: messages[1].content, messages, sources });
  }
  if (url.pathname.startsWith('/api/twins')) {
    if (req.method === 'GET') return send({ twins });
    if (req.method === 'DELETE') { twins = twins.filter(t => t.id !== resourceId); sessions = sessions.filter(s => s.personality_id !== resourceId); memories = memories.filter(m => m.personality_id !== resourceId); return send(null, 204); }
    const twin = { ...input, id: resourceId || randomUUID(), created_at: timestamp(), updated_at: timestamp() }; twins = [twin, ...twins.filter(t => t.id !== twin.id)]; return send({ twin });
  }
  if (url.pathname.startsWith('/api/memories')) {
    if (req.method === 'GET') return send({ memories: memories.filter(m => m.personality_id === url.searchParams.get('twin_id')) });
    if (req.method === 'DELETE') { memories = memories.filter(m => m.id !== resourceId); return send(null, 204); }
    const memory = { ...input, id: resourceId || randomUUID(), created_at: timestamp() }; memories = [memory, ...memories.filter(m => m.id !== memory.id)]; return send({ memory });
  }
  if (url.pathname.startsWith('/api/sessions')) {
    if (!resourceId) return send({ sessions: sessions.map(({ messages: _messages, ...session }) => session) });
    const session = sessions.find(s => s.id === resourceId); if (!session) return send({ error: 'Conversation not found.' }, 404);
    if (req.method === 'DELETE') { sessions = sessions.filter(s => s.id !== resourceId); return send(null, 204); }
    if (req.method === 'PUT') session.title = input.title;
    return send({ session });
  }
  return send({ error: 'Fixture route not found.' }, 404);
});
server.listen(8081, '127.0.0.1', () => console.log('Disposable fixture API: http://127.0.0.1:8081 — no database or AI calls.'));
