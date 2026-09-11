// Mock Midtrans Snap. Same order-id / signature / status-cycle contract as the real gateway,
// so swapping in the live client is a base-URL + credential change (PAY01-PAY04, S2-S4, S10).
import { createHash, randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { DATA_DIR } from './db.js';

const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-PROTOTYPE';
// ponytail: local JSON gateway state; swap for the Snap API base URL + real server key
const FILE = `${DATA_DIR}/gateway.json`;
const load = () => (existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : {});
const save = (g) => writeFileSync(FILE, JSON.stringify(g, null, 2));

export const signature = (orderId, statusCode, grossAmount) =>
  createHash('sha512').update(`${orderId}${statusCode}${grossAmount}${SERVER_KEY}`).digest('hex');

// gross_amount is sent as a decimal string by Midtrans; keep that shape for signature parity
const gross = (idr) => `${idr}.00`;

export function createTransaction({ order_id, amount_idr, expiry_minutes, customer }) {
  const g = load();
  g[order_id] = { order_id, amount_idr, status: 'not_found', token: randomUUID(),
    expires_at: new Date(Date.now() + expiry_minutes * 60000).toISOString(), customer };
  save(g);
  return { token: g[order_id].token, redirect_url: `/pay/${order_id}` };
}

// what the hosted page does when the customer finishes; emits the notification payload
export function simulate(order_id, outcome, channel = 'bank_transfer') {
  const g = load();
  const t = g[order_id];
  if (!t) throw new Error('order not found');
  const map = { pay: 'settlement', pending: 'pending', deny: 'deny', expire: 'expire', cancel: 'cancel' };
  t.status = map[outcome] || 'settlement';
  t.channel = channel;
  save(g);
  const status_code = t.status === 'settlement' || t.status === 'pending' ? '200' : t.status === 'deny' ? '202' : '407';
  return {
    transaction_time: new Date().toISOString(), transaction_status: t.status, transaction_id: randomUUID(),
    status_message: 'midtrans notification', status_code, signature_key: signature(order_id, status_code, gross(t.amount_idr)),
    payment_type: channel, order_id, gross_amount: gross(t.amount_idr),
    fraud_status: t.status === 'settlement' ? 'accept' : undefined, currency: 'IDR',
  };
}

export function verify(body) {
  if (!body?.order_id || !body?.signature_key) return false;
  return body.signature_key === signature(body.order_id, body.status_code, body.gross_amount);
}

// authoritative status lookup for ambiguous or reordered events (PAY03/PAY04)
export const status = (order_id) => load()[order_id] || { order_id, status: 'not_found' };

export function expireOrder(order_id) {
  const g = load();
  if (g[order_id] && ['not_found', 'pending'].includes(g[order_id].status)) { g[order_id].status = 'expire'; save(g); return true; }
  return false;
}

export function refund(order_id, amount_idr) {
  const g = load();
  const t = g[order_id];
  if (!t || t.status !== 'settlement') return { ok: false, error: 'transaction not refundable' };
  // real gateways refuse refunds on several channels; keep the manual path honest (R05/OPS05)
  if (['cstore', 'echannel'].includes(t.channel)) return { ok: false, error: `channel ${t.channel} does not support API refund` };
  t.refunded_idr = (t.refunded_idr || 0) + amount_idr;
  t.status = t.refunded_idr >= t.amount_idr ? 'refund' : 'partial_refund';
  save(g);
  return { ok: true, refund_key: `RFD-${order_id}`, reference: randomUUID() };
}
