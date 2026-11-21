// The Crawl: game server on Cloudflare Workers.
// Static game files are served from ./public. Everything under /api/ comes here.
// All persistent state (accounts, sessions, invites, characters, saves, AI usage) lives in one
// SQLite-backed Durable Object, so there is nothing to provision beyond this repo.
import { DurableObject } from 'cloudflare:workers';

const COOKIE = 'crawl_session';
const SESSION_DAYS = 30;
const AI_DAILY_LIMIT = 400;       // AI calls per player per day
const AI_MAX_TOKENS = 1200;       // hard cap per reply
const PBKDF2_ITER = 30000;  // kept modest so login stays inside the free plan's CPU limit

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      // simple CSRF guard: state-changing calls must come from our own pages
      const origin = request.headers.get('Origin');
      if (origin && origin !== url.origin) return json({ error: 'bad_origin' }, 403);
    }
    const stub = env.CAMPAIGN.get(env.CAMPAIGN.idFromName('main'));
    if (url.pathname === '/api/ai' && request.method === 'POST') return ai(request, env, stub);
    return stub.fetch(request);
  }
};

// The model call happens here, in the stateless worker; the Durable Object only checks the
// session and counts usage. The API key never reaches the browser.
async function ai(request, env, stub) {
  if (!env.ANTHROPIC_API_KEY) return json({ error: 'ai_not_configured', message: 'The host has not added an AI key yet.' }, 503);
  const gate = await stub.fetch(new Request(new URL('/api/_ai_gate', request.url), { method: 'POST', headers: { cookie: request.headers.get('cookie') || '' } }));
  if (!gate.ok) return gate;
  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad_json' }, 400); }
  let messages = body.messages;
  if (typeof messages === 'string') messages = [{ role: 'user', content: messages }];
  if (!Array.isArray(messages) || !messages.length || messages.length > 40) return json({ error: 'bad_messages' }, 400);
  messages = messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 20000) }));
  if (messages[messages.length - 1].role !== 'user') return json({ error: 'last_must_be_user' }, 400);
  const model = body.tier === 'default' || body.tier === 'complex' ? (env.AI_MODEL_BIG || env.AI_MODEL) : env.AI_MODEL;
  const payload = { model, max_tokens: Math.min(AI_MAX_TOKENS, Math.max(64, body.max_tokens | 0 || 700)), messages };
  if (body.system) payload.system = String(body.system).slice(0, 20000);
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const code = r.status === 429 ? 'rate_limited' : 'ai_error';
    return json({ error: code, message: (data.error && data.error.message) || 'AI request failed' }, r.status === 429 ? 429 : 502);
  }
  const text = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
  return json({ text, truncated: data.stop_reason === 'max_tokens', model });
}

function json(obj, status = 200, headers = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers } });
}
function b64(buf) { return btoa(String.fromCharCode(...new Uint8Array(buf))); }
function randToken(bytes = 24) { const a = new Uint8Array(bytes); crypto.getRandomValues(a); return b64(a).replace(/[+/=]/g, c => ({ '+': '-', '/': '_', '=': '' }[c])); }
function inviteCode() {
  const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', a = new Uint8Array(8); crypto.getRandomValues(a);
  const s = Array.from(a, x => A[x % A.length]).join(''); return s.slice(0, 4) + '-' + s.slice(4);
}
async function hashPassword(pw, saltB64) {
  const salt = saltB64 ? Uint8Array.from(atob(saltB64), c => c.charCodeAt(0)) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITER }, key, 256);
  return { hash: b64(bits), salt: b64(salt) };
}
function safeEqual(a, b) { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; }
function cookieOf(req) { const m = /(?:^|;\s*)crawl_session=([^;]+)/.exec(req.headers.get('cookie') || ''); return m ? m[1] : null; }

export class Campaign extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.fails = new Map();
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE COLLATE NOCASE, pass TEXT, salt TEXT, role TEXT DEFAULT 'player', created INTEGER);
      CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id INTEGER, expires INTEGER);
      CREATE TABLE IF NOT EXISTS invites (code TEXT PRIMARY KEY, note TEXT, created_by INTEGER, created INTEGER, used_by INTEGER, used_at INTEGER);
      CREATE TABLE IF NOT EXISTS characters (user_id INTEGER PRIMARY KEY, data TEXT, updated INTEGER);
      CREATE TABLE IF NOT EXISTS kv (user_id INTEGER, k TEXT, v TEXT, updated INTEGER, PRIMARY KEY (user_id, k));
      CREATE TABLE IF NOT EXISTS board (id INTEGER PRIMARY KEY, user_id INTEGER, room INTEGER, text TEXT, created INTEGER);
      CREATE TABLE IF NOT EXISTS ai_usage (user_id INTEGER, day TEXT, calls INTEGER, PRIMARY KEY (user_id, day));
      CREATE TABLE IF NOT EXISTS stash (id INTEGER PRIMARY KEY, data TEXT, by_user INTEGER, created INTEGER);
      CREATE TABLE IF NOT EXISTS world (fk TEXT, k TEXT, v TEXT, by_user INTEGER, updated INTEGER, PRIMARY KEY (fk, k));
    `);
  }
  one(q, ...a) { const r = this.sql.exec(q, ...a).toArray(); return r[0] || null; }
  all(q, ...a) { return this.sql.exec(q, ...a).toArray(); }
  me(req) {
    const t = cookieOf(req); if (!t) return null;
    const s = this.one('SELECT user_id, expires FROM sessions WHERE token = ?', t);
    if (!s || s.expires < Date.now()) { if (s) this.sql.exec('DELETE FROM sessions WHERE token = ?', t); return null; }
    return this.one('SELECT id, username, role FROM users WHERE id = ?', s.user_id);
  }
  startSession(uid) {
    const t = randToken(), exp = Date.now() + SESSION_DAYS * 864e5;
    this.sql.exec('INSERT INTO sessions (token, user_id, expires) VALUES (?, ?, ?)', t, uid, exp);
    this.sql.exec('DELETE FROM sessions WHERE expires < ?', Date.now());
    return `${COOKIE}=${t}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_DAYS * 86400}`;
  }
  // ---------- the shared world: one live connection per player, grouped by floor (fk = floor:layout) ----------
  // Every player on a floor sees the others move, and the floor's events (kills, truces, set pieces, jammed doors, loot) are kept
  // here once for everyone and replayed to whoever joins.
  liveOpen(req, url) {
    if (req.headers.get('Upgrade') !== 'websocket') return json({ error: 'expected_websocket' }, 426);
    const origin = req.headers.get('Origin'); if (origin && origin !== url.origin) return json({ error: 'bad_origin' }, 403);
    const u = this.me(req); if (!u) return json({ error: 'signed_out' }, 401);
    const fk = String(url.searchParams.get('fk') || '').slice(0, 24); if (!/^[0-9a-z:_-]+$/i.test(fk)) return json({ error: 'bad_floor' }, 400);
    const pair = new WebSocketPair(), [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server, ['fk:' + fk]);
    server.serializeAttachment({ id: u.id, name: u.username, role: u.role, fk, at: Date.now(), p: null, look: null, cname: null });
    return new Response(null, { status: 101, webSocket: client });
  }
  liveOthers(fk, except) { return this.ctx.getWebSockets('fk:' + fk).filter(w => w !== except); }
  liveSend(w, obj) { try { w.send(typeof obj === 'string' ? obj : JSON.stringify(obj)); } catch (e) {} }
  liveRoster(fk) { // one entry per player (a second tab replaces the first)
    const seen = {}; this.ctx.getWebSockets('fk:' + fk).forEach(w => { const a = w.deserializeAttachment(); if (a) seen[a.id] = { id: a.id, name: a.name, cname: a.cname, role: a.role, p: a.p, look: a.look }; });
    return Object.values(seen);
  }
  async webSocketMessage(ws, raw) {
    let msg; try { msg = JSON.parse(raw); } catch (e) { return; } if (!msg || typeof msg !== 'object') return;
    const a = ws.deserializeAttachment(); if (!a) return; const fk = a.fk;
    if (msg.t === 'hello') {
      a.cname = String(msg.cname || '').slice(0, 40) || null; a.look = msg.look && typeof msg.look === 'object' ? msg.look : null; a.p = msg.p || null; ws.serializeAttachment(a);
      const rows = this.all('SELECT k, v FROM world WHERE fk = ?', fk);
      this.liveSend(ws, { t: 'state', fk, you: a.id, items: rows.map(r => [r.k, JSON.parse(r.v)]), roster: this.liveRoster(fk).filter(q => q.id !== a.id) });
      const join = JSON.stringify({ t: 'join', p: { id: a.id, name: a.name, cname: a.cname, role: a.role, p: a.p, look: a.look } });
      this.liveOthers(fk, ws).forEach(w => this.liveSend(w, join)); return;
    }
    if (msg.t === 'look') { // changed clothes or appearance after joining: everyone else rebuilds my model
      if (!a.look) return; a.look = msg.look && typeof msg.look === 'object' ? msg.look : a.look; if (msg.cname) a.cname = String(msg.cname).slice(0, 40); ws.serializeAttachment(a);
      const out = JSON.stringify({ t: 'look', id: a.id, look: a.look, cname: a.cname }); this.liveOthers(fk, ws).forEach(w => this.liveSend(w, out)); return;
    }
    if (msg.t === 'pos') { // where I am and what I'm doing; passed straight on
      a.p = { x: +msg.x || 0, z: +msg.z || 0, px: +msg.px || 0, pz: +msg.pz || 0, ry: +msg.ry || 0, mv: msg.mv ? 1 : 0, cr: msg.cr ? 1 : 0, dn: msg.dn ? 1 : 0, hp: +msg.hp || 0, mx: +msg.mx || 0, ac: +msg.ac || 0 }; ws.serializeAttachment(a);
      const out = JSON.stringify({ t: 'pos', id: a.id, ...a.p }); this.liveOthers(fk, ws).forEach(w => this.liveSend(w, out)); return;
    }
    if (msg.t === 'act' || msg.t === 'say') {
      const out = JSON.stringify({ t: msg.t, id: a.id, name: a.cname || a.name, a: String(msg.a || '').slice(0, 24), text: String(msg.text || '').slice(0, 200) });
      this.liveOthers(fk, ws).forEach(w => this.liveSend(w, out)); return;
    }
    if (msg.t === 'ev' && Array.isArray(msg.evs)) { // world events: [key, value]; a null value clears the key
      const keep = [];
      for (const e of msg.evs.slice(0, 50)) {
        if (!Array.isArray(e)) continue; const k = String(e[0] || '').slice(0, 80); if (!k) continue; const v = e[1];
        if (v === null || v === undefined) this.sql.exec('DELETE FROM world WHERE fk = ? AND k = ?', fk, k);
        else { const sv = JSON.stringify(v); if (sv.length > 2000) continue; this.sql.exec('INSERT INTO world (fk, k, v, by_user, updated) VALUES (?, ?, ?, ?, ?) ON CONFLICT(fk, k) DO UPDATE SET v = excluded.v, by_user = excluded.by_user, updated = excluded.updated', fk, k, sv, a.id, Date.now()); }
        keep.push([k, v === undefined ? null : v]);
      }
      const out = JSON.stringify({ t: 'ev', by: a.id, name: a.cname || a.name, evs: keep }); this.liveOthers(fk, ws).forEach(w => this.liveSend(w, out)); return;
    }
    if (msg.t === 'cb' && msg.k) { // shared fights: the fight's host and its players pass turns, results and hits through here
      const out = JSON.stringify({ ...msg, from: a.id }); if (out.length > 30000) return;
      this.liveOthers(fk, ws).forEach(w => { if (msg.to) { const b = w.deserializeAttachment(); if (!b || b.id !== msg.to) return; } this.liveSend(w, out); }); return;
    }
    if (msg.t === 'ping') { this.liveSend(ws, { t: 'pong' }); return; }
  }
  async webSocketClose(ws) { this.liveGone(ws); }
  async webSocketError(ws) { this.liveGone(ws); }
  liveGone(ws) { const a = ws.deserializeAttachment(); if (!a) return; try { ws.close(1000, 'bye'); } catch (e) {}
    const still = this.liveOthers(a.fk, ws).some(w => { const b = w.deserializeAttachment(); return b && b.id === a.id; });
    if (!still) { const out = JSON.stringify({ t: 'leave', id: a.id }); this.liveOthers(a.fk, ws).forEach(w => this.liveSend(w, out)); } }
  profile(u) {
    const c = this.one('SELECT data FROM characters WHERE user_id = ?', u.id);
    return { user: { id: u.id, username: u.username, role: u.role }, character: c ? JSON.parse(c.data) : null };
  }
  async fetch(req) {
    const url = new URL(req.url), p = url.pathname, m = req.method;
    if (p === '/api/live') return this.liveOpen(req, url);
    const body = m === 'POST' || m === 'PUT' ? await req.json().catch(() => ({})) : {};
    try {
      if (p === '/api/register' && m === 'POST') return this.register(body);
      if (p === '/api/login' && m === 'POST') return this.login(body);
      const u = this.me(req);
      if (p === '/api/me' && m === 'GET') return u ? json(this.profile(u)) : json({ error: 'signed_out' }, 401);
      if (!u) return json({ error: 'signed_out' }, 401);
      if (p === '/api/logout' && m === 'POST') { this.sql.exec('DELETE FROM sessions WHERE token = ?', cookieOf(req)); return json({ ok: true }, 200, { 'set-cookie': `${COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0` }); }
      if (p === '/api/_ai_gate' && m === 'POST') {
        const day = new Date().toISOString().slice(0, 10);
        const r = this.one('SELECT calls FROM ai_usage WHERE user_id = ? AND day = ?', u.id, day);
        if (r && r.calls >= AI_DAILY_LIMIT) return json({ error: 'rate_limited', message: 'Daily AI limit reached. It resets tomorrow.' }, 429);
        this.sql.exec('INSERT INTO ai_usage (user_id, day, calls) VALUES (?, ?, 1) ON CONFLICT(user_id, day) DO UPDATE SET calls = calls + 1', u.id, day);
        return json({ ok: true });
      }
      if (p === '/api/character' && m === 'PUT') {
        const s = JSON.stringify(body.character || null); if (s.length > 200000) return json({ error: 'too_big' }, 413);
        this.sql.exec('INSERT INTO characters (user_id, data, updated) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated = excluded.updated', u.id, s, Date.now());
        return json({ ok: true });
      }
      if (p === '/api/sheet' && m === 'GET') { // a friend's character sheet, for Examine
        const r = this.one('SELECT u.username, c.data FROM users u LEFT JOIN characters c ON c.user_id = u.id WHERE u.id = ?', parseInt(url.searchParams.get('id') || '0', 10));
        if (!r || !r.data) return json({ error: 'none', message: 'No character yet.' }, 404);
        const c = JSON.parse(r.data);
        return json({ sheet: { username: r.username, name: c.name, level: c.level || 1, xp: c.xp || 0, stats: c.stats || {}, skills: c.skills || {}, trait: c.trait, traitDesc: c.traitDesc || '', flaw: c.flaw, flawDesc: c.flawDesc || '', wield: c.wield || null, back: c.back || null, kit: c.kit || null, gold: c.gold || 0, dead: !!c.dead,
          gear: (c.gear || []).filter(g => g && g.cat !== 'body').map(g => ({ name: g.name, qty: g.qty || 1, dmg: g.dmg || '', cat: g.cat || '', worn: !!g.worn, rarity: g.rarity || '' })) } });
      }
      if (p === '/api/party' && m === 'GET') {
        const rows = this.all('SELECT u.id, u.username, u.role, c.data, c.updated FROM users u LEFT JOIN characters c ON c.user_id = u.id ORDER BY u.id');
        return json({ party: rows.map(r => { const c = r.data ? JSON.parse(r.data) : null; return { id: r.id, username: r.username, role: r.role, name: c && c.name, xp: c ? c.xp || 0 : 0, level: c ? c.level || 1 : 1, trait: c && c.trait, flaw: c && c.flaw, dead: !!(c && c.dead), updated: r.updated }; }) });
      }
      if (p === '/api/board' && m === 'GET') {
        const room = parseInt(url.searchParams.get('room') || '0', 10);
        return json({ messages: this.all('SELECT b.text, b.created, u.username FROM board b JOIN users u ON u.id = b.user_id WHERE b.room = ? ORDER BY b.created DESC LIMIT 40', room).reverse() });
      }
      if (p === '/api/board' && m === 'POST') {
        const text = String(body.text || '').trim().slice(0, 400); if (!text) return json({ error: 'empty' }, 400);
        this.sql.exec('INSERT INTO board (user_id, room, text, created) VALUES (?, ?, ?, ?)', u.id, parseInt(body.room, 10) || 0, text, Date.now());
        return json({ ok: true });
      }
      // the party's shared stash: anyone can put an item in or take one out; taking is atomic so two people can't grab the same thing
      if (p === '/api/stash' && m === 'GET') return json({ items: this.all('SELECT s.id, s.data, s.created, u.username FROM stash s LEFT JOIN users u ON u.id = s.by_user ORDER BY s.id DESC LIMIT 500').map(r => ({ id: r.id, item: JSON.parse(r.data), by: r.username, t: r.created })) });
      if (p === '/api/stash/put' && m === 'POST') {
        const it = body.item; if (!it || typeof it.name !== 'string') return json({ error: 'bad_item' }, 400);
        const s0 = JSON.stringify(it); if (s0.length > 8000) return json({ error: 'too_big' }, 413);
        if ((this.one('SELECT COUNT(*) AS n FROM stash') || {}).n >= 500) return json({ error: 'full', message: 'The shared stash is full (500 things).' }, 400);
        this.sql.exec('INSERT INTO stash (data, by_user, created) VALUES (?, ?, ?)', s0, u.id, Date.now());
        const id = (this.one('SELECT last_insert_rowid() AS id') || {}).id;
        const out = JSON.stringify({ t: 'stash', k: 'put', who: u.username, name: it.name }); this.ctx.getWebSockets().forEach(w => this.liveSend(w, out));
        return json({ ok: true, id });
      }
      if (p === '/api/stash/take' && m === 'POST') {
        const id = parseInt(body.id, 10) || 0; const r = this.one('SELECT data FROM stash WHERE id = ?', id);
        if (!r) return json({ error: 'gone', message: 'Someone already took that.' }, 404);
        this.sql.exec('DELETE FROM stash WHERE id = ?', id); const it = JSON.parse(r.data);
        const out = JSON.stringify({ t: 'stash', k: 'take', who: u.username, name: it.name }); this.ctx.getWebSockets().forEach(w => this.liveSend(w, out));
        return json({ ok: true, item: it });
      }
      // campaign settings everyone can read; only the DM changes them (live = the campaign has started and testing tools lock)
      // recipes the SGC has invented, shared by everyone (inventor, level and track ride along)
      if (p === '/api/recipes' && m === 'GET') { const r = this.one('SELECT v FROM kv WHERE user_id = 0 AND k = ?', 'recipes'); return json({ value: r ? JSON.parse(r.v) : [] }); }
      if (p === '/api/recipes' && m === 'POST') {
        const rec = body.recipe; if (!rec || typeof rec.name !== 'string') return json({ error: 'bad_recipe' }, 400);
        const s0 = JSON.stringify(rec); if (s0.length > 4000) return json({ error: 'too_big' }, 413);
        const r = this.one('SELECT v FROM kv WHERE user_id = 0 AND k = ?', 'recipes'); let list = r ? JSON.parse(r.v) : [];
        if (!list.some(x => x.name.toLowerCase() === rec.name.toLowerCase())) { rec.by_user = u.id; rec.t = Date.now(); list.push(rec); if (list.length > 300) list = list.slice(-300); }
        this.sql.exec('INSERT INTO kv (user_id, k, v, updated) VALUES (0, ?, ?, ?) ON CONFLICT(user_id, k) DO UPDATE SET v = excluded.v, updated = excluded.updated', 'recipes', JSON.stringify(list), Date.now());
        return json({ ok: true, value: list });
      }
      // the DM's level edits, per floor: everyone reads them, only the DM writes (see v2_editor.js)
      if (p === '/api/edits' && m === 'GET') { const f = parseInt(url.searchParams.get('floor') || '1', 10) || 1; const r = this.one('SELECT v FROM kv WHERE user_id = 0 AND k = ?', 'edits-' + f); return json({ value: r ? JSON.parse(r.v) : [] }); }
      if (p === '/api/dm/edits' && m === 'PUT') {
        if (u.role !== 'dm') return json({ error: 'dm_only', message: 'Only the DM can publish edits.' }, 403);
        const f = parseInt(body.floor, 10) || 0; if (f < 1 || f > 20 || !Array.isArray(body.ops)) return json({ error: 'bad_edits' }, 400);
        const s = JSON.stringify(body.ops); if (s.length > 200000) return json({ error: 'too_big', message: 'Too many edits on one floor.' }, 413);
        this.sql.exec('INSERT INTO kv (user_id, k, v, updated) VALUES (0, ?, ?, ?) ON CONFLICT(user_id, k) DO UPDATE SET v = excluded.v, updated = excluded.updated', 'edits-' + f, s, Date.now()); return json({ ok: true });
      }
      if (p === '/api/campaign' && m === 'GET') { const r = this.one('SELECT v FROM kv WHERE user_id = 0 AND k = ?', 'campaign'); return json({ value: r ? JSON.parse(r.v) : { live: false } }); }
      if (p === '/api/dm/campaign' && m === 'PUT') {
        if (u.role !== 'dm') return json({ error: 'dm_only' }, 403);
        const v = JSON.stringify({ live: !!body.live, since: body.live ? Date.now() : null });
        this.sql.exec('INSERT INTO kv (user_id, k, v, updated) VALUES (0, ?, ?, ?) ON CONFLICT(user_id, k) DO UPDATE SET v = excluded.v, updated = excluded.updated', 'campaign', v, Date.now()); return json({ ok: true });
      }
      if (p.startsWith('/api/kv/')) {
        const k = decodeURIComponent(p.slice(8)).slice(0, 80);
        if (m === 'GET') { const r = this.one('SELECT v FROM kv WHERE user_id = ? AND k = ?', u.id, k); return json({ value: r ? JSON.parse(r.v) : null }); }
        if (m === 'PUT') { const s = JSON.stringify(body.value === undefined ? null : body.value); if (s.length > 100000) return json({ error: 'too_big' }, 413); this.sql.exec('INSERT INTO kv (user_id, k, v, updated) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, k) DO UPDATE SET v = excluded.v, updated = excluded.updated', u.id, k, s, Date.now()); return json({ ok: true }); }
      }
      // ---- DM only ----
      if (p.startsWith('/api/dm/')) {
        if (u.role !== 'dm') return json({ error: 'dm_only' }, 403);
        if (p === '/api/dm/wipe' && m === 'POST') { // start the campaign over: every character, every save, the shared floors and invented recipes go; accounts stay
          if (body.confirm !== 'START OVER') return json({ error: 'confirm', message: 'Type START OVER to confirm.' }, 400);
          this.sql.exec('DELETE FROM characters'); this.sql.exec('DELETE FROM kv WHERE user_id > 0'); this.sql.exec("DELETE FROM kv WHERE user_id = 0 AND k = 'recipes'"); this.sql.exec('DELETE FROM world'); this.sql.exec('DELETE FROM stash');
          const out = JSON.stringify({ t: 'reset', fk: '*' }); this.ctx.getWebSockets().forEach(w => this.liveSend(w, out)); return json({ ok: true }); }
        if (p === '/api/dm/world' && m === 'GET') return json({ floors: this.all('SELECT fk, COUNT(*) AS n, MAX(updated) AS updated FROM world GROUP BY fk') });
        if (p === '/api/dm/world' && m === 'DELETE') { // reset one floor's shared world (everything comes back)
          const fk = String(url.searchParams.get('fk') || ''); this.sql.exec('DELETE FROM world WHERE fk = ?', fk);
          const out = JSON.stringify({ t: 'reset', fk }); this.ctx.getWebSockets('fk:' + fk).forEach(w => this.liveSend(w, out)); return json({ ok: true }); }
        if (p === '/api/dm/invites' && m === 'GET') return json({ invites: this.all('SELECT i.code, i.note, i.created, i.used_at, u.username AS used_by FROM invites i LEFT JOIN users u ON u.id = i.used_by ORDER BY i.created DESC') });
        if (p === '/api/dm/invites' && m === 'POST') { const code = inviteCode(); this.sql.exec('INSERT INTO invites (code, note, created_by, created) VALUES (?, ?, ?, ?)', code, String(body.note || '').slice(0, 60), u.id, Date.now()); return json({ code }); }
        if (p === '/api/dm/invites' && m === 'DELETE') { this.sql.exec('DELETE FROM invites WHERE code = ? AND used_by IS NULL', String(url.searchParams.get('code') || '')); return json({ ok: true }); }
        if (p === '/api/dm/revive' && m === 'POST') { // stand-in for party revival until party play exists
          const r = this.one('SELECT data FROM characters WHERE user_id = ?', parseInt(body.user_id, 10) || 0); if (!r) return json({ error: 'no_character' }, 404);
          const c = JSON.parse(r.data); c.dead = null; c.revivedAt = Date.now();
          this.sql.exec('UPDATE characters SET data = ?, updated = ? WHERE user_id = ?', JSON.stringify(c), Date.now(), parseInt(body.user_id, 10)); return json({ ok: true });
        }
        if (p === '/api/dm/reset-password' && m === 'POST') {
          const t = this.one('SELECT id FROM users WHERE username = ?', String(body.username || '')); if (!t) return json({ error: 'no_user' }, 404);
          const temp = inviteCode(), h = await hashPassword(temp); this.sql.exec('UPDATE users SET pass = ?, salt = ? WHERE id = ?', h.hash, h.salt, t.id); this.sql.exec('DELETE FROM sessions WHERE user_id = ?', t.id);
          return json({ temp });
        }
        if (p === '/api/dm/talk' && m === 'GET') return json({ logs: this.all("SELECT u.username, k.k, k.v, k.updated FROM kv k JOIN users u ON u.id = k.user_id WHERE k.k LIKE 'talk-%' ORDER BY k.updated DESC LIMIT 50").map(r => ({ username: r.username, npc: r.k.slice(5), log: JSON.parse(r.v), updated: r.updated })) });
      }
      return json({ error: 'not_found' }, 404);
    } catch (e) { return json({ error: 'server_error', message: String(e && e.message || e) }, 500); }
  }
  async register(b) {
    const username = String(b.username || '').trim(), pw = String(b.password || ''), code = String(b.invite || '').trim().toUpperCase();
    if (!/^[A-Za-z0-9_.-]{3,20}$/.test(username)) return json({ error: 'bad_username', message: 'Usernames are 3 to 20 letters, numbers, dots, dashes or underscores.' }, 400);
    if (pw.length < 8 || pw.length > 200) return json({ error: 'bad_password', message: 'Passwords need at least 8 characters.' }, 400);
    if (this.one('SELECT id FROM users WHERE username = ?', username)) return json({ error: 'taken', message: 'That username is taken.' }, 409);
    let role = 'player', inv = null;
    const dmCode = String(this.env.DM_INVITE || '').trim().toUpperCase();
    if (dmCode && code === dmCode) {
      if (this.one("SELECT id FROM users WHERE role = 'dm'")) return json({ error: 'bad_invite', message: 'That invite code has already been used.' }, 403);
      role = 'dm';
    } else {
      inv = this.one('SELECT code, used_by FROM invites WHERE code = ?', code);
      if (!inv || inv.used_by) return json({ error: 'bad_invite', message: inv ? 'That invite code has already been used.' : 'That invite code is not valid.' }, 403);
    }
    const h = await hashPassword(pw);
    this.sql.exec('INSERT INTO users (username, pass, salt, role, created) VALUES (?, ?, ?, ?, ?)', username, h.hash, h.salt, role, Date.now());
    const u = this.one('SELECT id, username, role FROM users WHERE username = ?', username);
    if (inv) this.sql.exec('UPDATE invites SET used_by = ?, used_at = ? WHERE code = ?', u.id, Date.now(), inv.code);
    return json(this.profile(u), 200, { 'set-cookie': this.startSession(u.id) });
  }
  async login(b) {
    const username = String(b.username || '').trim(), pw = String(b.password || '');
    const f = this.fails.get(username.toLowerCase()) || { n: 0, until: 0 };
    if (f.until > Date.now()) return json({ error: 'slow_down', message: 'Too many tries. Wait a minute and try again.' }, 429);
    const row = this.one('SELECT id, username, role, pass, salt FROM users WHERE username = ?', username);
    const h = row ? await hashPassword(pw, row.salt) : await hashPassword(pw);
    if (!row || !safeEqual(h.hash, row.pass)) {
      f.n++; if (f.n >= 5) { f.until = Date.now() + 60000; f.n = 0; } this.fails.set(username.toLowerCase(), f);
      return json({ error: 'bad_login', message: 'Wrong username or password.' }, 401);
    }
    this.fails.delete(username.toLowerCase());
    return json(this.profile(row), 200, { 'set-cookie': this.startSession(row.id) });
  }
}
