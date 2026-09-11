// Visitor <-> staff support chat. SQLite is the record; Server-Sent Events push updates live.
// No JS on the client? Every action is a plain form post, so the chat still works.
import { randomUUID } from 'node:crypto';
import { db, audit } from './db.js';

const one = (s, ...a) => db.prepare(s).get(...a);
const all = (s, ...a) => db.prepare(s).all(...a);
const run = (s, ...a) => db.prepare(s).run(...a);
const now = () => new Date().toISOString();
export const MAX_LEN = 2000;

/* ---------- live push ---------- */
// ponytail: in-process subscriber map; move to Redis pub/sub when running more than one app instance
const subs = new Map(); // channel -> Set(res)
export function subscribe(channel, res) {
  res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
  res.write('retry: 4000\n\n');
  if (!subs.has(channel)) subs.set(channel, new Set());
  subs.get(channel).add(res);
  const ping = setInterval(() => res.write(': ping\n\n'), 25000);
  res.on('close', () => { clearInterval(ping); subs.get(channel)?.delete(res); });
}
export function publish(channel, event, data) {
  for (const res of subs.get(channel) ?? []) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

/* ---------- validation & abuse limits (SEC01) ---------- */
function clean(body) {
  const text = String(body ?? '').replace(/\r\n/g, '\n').trim();
  if (!text) throw new Error('Write a message before sending.');
  if (text.length > MAX_LEN) throw new Error(`Messages are limited to ${MAX_LEN} characters; yours has ${text.length}.`);
  return text;
}
function limit(sql, args, max, msg) { if (one(sql, ...args).c >= max) throw new Error(msg); }

/* ---------- conversations ---------- */
export function start({ name, email, subject, body, user = null, booking_ref = null }) {
  name = String(name ?? '').trim(); email = String(email ?? '').trim().toLowerCase();
  if (!name) throw new Error('Tell us your name so staff know who they are talking to.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter an email address such as name@example.com, so we can reply if you leave.');
  const text = clean(body);
  limit(`SELECT count(*) c FROM conversations WHERE email=? AND created_at > ?`, [email, new Date(Date.now() - 3600e3).toISOString()],
    5, 'You have opened several conversations in the last hour. Please continue in an existing one.');
  if (booking_ref && !one(`SELECT 1 FROM bookings WHERE ref=?`, booking_ref)) booking_ref = null;
  const id = randomUUID(), token = randomUUID();
  run(`INSERT INTO conversations(id,token,name,email,user_id,booking_ref,subject,status,created_at,updated_at,visitor_read_at)
       VALUES(?,?,?,?,?,?,?,'open',?,?,?)`, id, token, name.slice(0, 120), email.slice(0, 200), user?.id ?? null, booking_ref,
    String(subject || 'General question').slice(0, 120), now(), now(), now());
  const msg = add(id, 'visitor', name, text);
  audit(email, 'chat_started', id, booking_ref ?? '');
  publish('staff', 'conversation', summary(id));
  return { id, token, msg };
}

export function send(conversation_id, sender, author, body) {
  const c = get(conversation_id);
  if (!c) throw new Error('Conversation not found');
  const text = clean(body);
  if (sender === 'visitor') {
    limit(`SELECT count(*) c FROM messages WHERE conversation_id=? AND sender='visitor' AND created_at > ?`,
      [conversation_id, new Date(Date.now() - 60e3).toISOString()], 10, 'You are sending messages very quickly. Wait a moment and try again.');
    if (c.status === 'closed') run(`UPDATE conversations SET status='open' WHERE id=?`, conversation_id); // a reply reopens
  }
  return add(conversation_id, sender, author, text);
}

function add(conversation_id, sender, author, text) {
  const t = now();
  const { lastInsertRowid } = run(`INSERT INTO messages(conversation_id,sender,author,body,created_at) VALUES(?,?,?,?,?)`,
    conversation_id, sender, author, text, t);
  run(`UPDATE conversations SET updated_at=?, ${sender === 'staff' ? 'staff_read_at' : 'visitor_read_at'}=? WHERE id=?`, t, t, conversation_id);
  const msg = { id: Number(lastInsertRowid), sender, author, body: text, created_at: t };
  publish(`conv:${conversation_id}`, 'message', msg);
  publish('staff', 'conversation', summary(conversation_id));
  return msg;
}

export const get = (id) => one(`SELECT * FROM conversations WHERE id=?`, id);
export const byToken = (token) => (token ? one(`SELECT * FROM conversations WHERE token=?`, token) : null);
export const messages = (id, after = 0) => all(`SELECT id,sender,author,body,created_at FROM messages WHERE conversation_id=? AND id>? ORDER BY id`, id, after);

export function markRead(id, who) {
  run(`UPDATE conversations SET ${who === 'staff' ? 'staff_read_at' : 'visitor_read_at'}=? WHERE id=?`, now(), id);
  if (who === 'staff') publish('staff', 'conversation', summary(id));
}

const UNREAD = (who, other) => `(SELECT count(*) FROM messages m WHERE m.conversation_id=c.id AND m.sender='${other}'
  AND m.created_at > COALESCE(c.${who}_read_at,''))`;

export const summary = (id) => one(`SELECT c.id, c.name, c.email, c.subject, c.status, c.assigned_to, c.booking_ref, c.updated_at,
  ${UNREAD('staff', 'visitor')} unread,
  (SELECT body FROM messages m WHERE m.conversation_id=c.id ORDER BY id DESC LIMIT 1) last
  FROM conversations c WHERE c.id=?`, id);

export function inbox({ status = 'open', q = '' } = {}) {
  const like = `%${q}%`;
  return all(`SELECT c.id FROM conversations c WHERE (?='all' OR c.status=?)
    AND (?='' OR c.name LIKE ? OR c.email LIKE ? OR c.booking_ref LIKE ? OR c.subject LIKE ?)
    ORDER BY c.updated_at DESC LIMIT 100`, status, status, q, like, like, like, like).map((r) => summary(r.id));
}

export const staffUnread = () => one(`SELECT COALESCE(SUM(${UNREAD('staff', 'visitor')}),0) n FROM conversations c WHERE c.status='open'`).n;
export const visitorUnread = (id) => one(`SELECT ${UNREAD('visitor', 'staff')} n FROM conversations c WHERE c.id=?`, id)?.n ?? 0;

export function setStatus(id, status, actor) {
  if (!['open', 'closed'].includes(status)) throw new Error('Unknown status');
  run(`UPDATE conversations SET status=?, updated_at=? WHERE id=?`, status, now(), id);
  audit(actor, 'chat_' + status, id);
  publish(`conv:${id}`, 'status', { status });
  publish('staff', 'conversation', summary(id));
}

export function assign(id, email, actor) {
  run(`UPDATE conversations SET assigned_to=? WHERE id=?`, email || null, id);
  audit(actor, 'chat_assigned', id, email || 'unassigned');
  publish('staff', 'conversation', summary(id));
}
