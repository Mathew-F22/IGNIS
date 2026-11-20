import express from 'express';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { db, one, all, run, id, publicUser, JWT_SECRET } from './db.js';
import { applyOp } from '../shared/ops.js';
import { newProjectData, migrate } from '../shared/template.js';
import { MAX_MEMBERS, scoreIdea, areaOfType } from '../shared/catalog.js';
import { PHASES, GATE_STATUS } from '../shared/psf.js';
import { projectStatus } from '../shared/progress.js';
import { sendResetEmail, mailEnabled } from './mail.js';

const PORT = Number(process.env.PORT || 4000);
const app = express();
app.use(express.json({ limit: '30mb' }));

// ---------- helpers ----------
const sign = (u) => jwt.sign({ sub: u.id, role: u.role }, JWT_SECRET, { expiresIn: '7d' });
const bad = (res, code, msg) => res.status(code).json({ error: msg });
const clean = (s) => (typeof s === 'string' ? s.trim() : s);
const norm = (s) => (s || '').toString().trim().toLowerCase();

function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return bad(res, 401, 'Sessão expirada. Entre novamente.');
  try {
    const p = jwt.verify(token, JWT_SECRET);
    const u = one('SELECT * FROM users WHERE id = ?', p.sub);
    if (!u || u.status !== 'ativo') return bad(res, 401, 'Acesso não autorizado.');
    req.user = u;
    next();
  } catch {
    return bad(res, 401, 'Sessão expirada. Entre novamente.');
  }
}
const master = (req, res, next) => (req.user.role === 'mestre' ? next() : bad(res, 403, 'Apenas o login mestre pode fazer isso.'));

function canAccess(user, projectId) {
  if (user.role === 'mestre') return true;
  return !!one('SELECT 1 FROM members WHERE project_id = ? AND user_id = ?', projectId, user.id);
}
function log(projectId, userId, text) {
  run('INSERT INTO activity (project_id, user_id, text) VALUES (?, ?, ?)', projectId, userId, text);
}
function validPassword(p) {
  return typeof p === 'string' && p.length >= 6;
}

// ---------- setup do login mestre ----------
app.get('/api/setup', (req, res) => {
  const has = one("SELECT COUNT(*) AS n FROM users WHERE role = 'mestre'").n > 0;
  res.json({ needsSetup: !has, mail: mailEnabled() });
});
app.post('/api/setup', (req, res) => {
  if (one("SELECT COUNT(*) AS n FROM users WHERE role = 'mestre'").n > 0) return bad(res, 409, 'O login mestre já foi criado.');
  const { name, email, password } = req.body || {};
  if (!name || !email || !validPassword(password)) return bad(res, 400, 'Preencha nome, e-mail e uma senha com pelo menos 6 caracteres.');
  const u = { id: id() };
  run(`INSERT INTO users (id, role, status, name, email, password_hash, cargo) VALUES (?, 'mestre', 'ativo', ?, ?, ?, 'Gestor do programa')`,
    u.id, clean(name), norm(email), bcrypt.hashSync(password, 10));
  const user = one('SELECT * FROM users WHERE id = ?', u.id);
  res.json({ token: sign(user), user: publicUser(user) });
});

// ---------- autenticação ----------
app.post('/api/auth/login', (req, res) => {
  const { identifier, password, mode } = req.body || {};
  const ident = norm(identifier);
  const u = one('SELECT * FROM users WHERE lower(email) = ? OR lower(matricula) = ?', ident, ident);
  if (!u || !bcrypt.compareSync(password || '', u.password_hash)) return bad(res, 401, 'Usuário ou senha incorretos.');
  if (mode === 'mestre' && u.role !== 'mestre') return bad(res, 403, 'Este usuário não é um login mestre.');
  if (mode === 'colaborador' && u.role === 'mestre') return bad(res, 403, 'Use a aba "Gestor" para o login mestre.');
  if (u.status === 'pendente') return bad(res, 403, 'Seu cadastro está em análise. Você recebe o acesso quando a ideia for selecionada.');
  if (u.status !== 'ativo') return bad(res, 403, 'Seu acesso está desativado. Fale com o gestor do programa.');
  run("UPDATE users SET last_login = datetime('now') WHERE id = ?", u.id);
  res.json({ token: sign(u), user: publicUser(u) });
});

app.post('/api/auth/register', (req, res) => {
  const b = req.body || {};
  const required = ['name', 'email', 'matricula', 'password', 'linha', 'cargo', 'tipoMelhoria', 'previa'];
  for (const k of required) if (!clean(b[k])) return bad(res, 400, 'Preencha todos os campos obrigatórios.');
  if (!validPassword(b.password)) return bad(res, 400, 'A senha precisa ter pelo menos 6 caracteres.');
  if (!/^\d+$/.test(String(b.matricula).trim())) return bad(res, 400, 'A matrícula deve ter só números, como no crachá.');
  if (one('SELECT 1 FROM users WHERE lower(email) = ? OR matricula = ?', norm(b.email), clean(b.matricula)))
    return bad(res, 409, 'Já existe um cadastro com este e-mail ou matrícula.');
  const idea = b.idea || {};
  idea.score = scoreIdea({ ...idea, tipoMelhoria: b.tipoMelhoria });
  const uidv = id();
  run(`INSERT INTO users (id, role, status, name, email, matricula, password_hash, photo, linha, cargo, turno, time, posto, tipo_melhoria, previa, idea)
       VALUES (?, 'colaborador', 'pendente', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    uidv, clean(b.name), norm(b.email), clean(b.matricula), bcrypt.hashSync(b.password, 10), b.photo || null,
    clean(b.linha), clean(b.cargo), clean(b.turno) || null, clean(b.time) || null, clean(b.posto) || null,
    clean(b.tipoMelhoria), clean(b.previa), JSON.stringify(idea));
  res.json({ ok: true, score: idea.score });
});

app.post('/api/auth/forgot', async (req, res) => {
  const ident = norm(req.body?.identifier);
  const u = ident && one('SELECT * FROM users WHERE lower(email) = ? OR lower(matricula) = ?', ident, ident);
  // Resposta sempre igual para não revelar quem tem cadastro.
  const generic = { ok: true, mail: mailEnabled() };
  if (!u) return res.json(generic);
  const token = crypto.randomBytes(24).toString('hex');
  run('INSERT INTO resets (token, user_id, expires) VALUES (?, ?, ?)', token, u.id, Date.now() + 1000 * 60 * 60);
  if (!one('SELECT 1 FROM reset_requests WHERE user_id = ? AND resolved = 0', u.id))
    run('INSERT INTO reset_requests (id, user_id) VALUES (?, ?)', id(), u.id);
  const base = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const link = `${base}/redefinir-senha/${token}`;
  console.log(`[IGNIS] Link de redefinição de senha para ${u.email}: ${link}`);
  if (mailEnabled() && u.email) {
    try { await sendResetEmail(u.email, u.name, link); } catch (e) { console.error('[IGNIS] Falha ao enviar e-mail:', e.message); }
  }
  res.json(generic);
});

app.post('/api/auth/reset', (req, res) => {
  const { token, password } = req.body || {};
  const r = one('SELECT * FROM resets WHERE token = ?', token || '');
  if (!r || r.used || r.expires < Date.now()) return bad(res, 400, 'Este link expirou ou já foi usado. Peça um novo.');
  if (!validPassword(password)) return bad(res, 400, 'A senha precisa ter pelo menos 6 caracteres.');
  run('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?', bcrypt.hashSync(password, 10), r.user_id);
  run('UPDATE resets SET used = 1 WHERE token = ?', token);
  run('UPDATE reset_requests SET resolved = 1 WHERE user_id = ?', r.user_id);
  res.json({ ok: true });
});

// ---------- perfil ----------
app.get('/api/me', auth, (req, res) => res.json({ user: publicUser(req.user) }));
app.put('/api/me', auth, (req, res) => {
  const b = req.body || {};
  const u = req.user;
  run(`UPDATE users SET name = ?, photo = ?, linha = ?, cargo = ?, turno = ?, time = ?, posto = ?, tipo_melhoria = ? WHERE id = ?`,
    clean(b.name) || u.name, b.photo === undefined ? u.photo : b.photo, clean(b.linha) ?? u.linha, clean(b.cargo) ?? u.cargo,
    clean(b.turno) ?? u.turno, clean(b.time) ?? u.time, clean(b.posto) ?? u.posto, clean(b.tipoMelhoria) ?? u.tipo_melhoria, u.id);
  res.json({ user: publicUser(one('SELECT * FROM users WHERE id = ?', u.id)) });
});
app.put('/api/me/password', auth, (req, res) => {
  const { current, password } = req.body || {};
  if (!bcrypt.compareSync(current || '', req.user.password_hash)) return bad(res, 400, 'A senha atual está incorreta.');
  if (!validPassword(password)) return bad(res, 400, 'A nova senha precisa ter pelo menos 6 caracteres.');
  run('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?', bcrypt.hashSync(password, 10), req.user.id);
  res.json({ ok: true });
});

// ---------- gestão de colaboradores (mestre) ----------
app.get('/api/users', auth, (req, res) => {
  if (req.user.role !== 'mestre') {
    // Colaboradores só veem dados públicos de quem está ativo.
    return res.json({ users: all("SELECT * FROM users WHERE status = 'ativo'").map((u) => publicUser(u, false)) });
  }
  const users = all('SELECT * FROM users ORDER BY created_at DESC').map((u) => ({
    ...publicUser(u),
    projects: all('SELECT p.id, p.title FROM projects p JOIN members m ON m.project_id = p.id WHERE m.user_id = ?', u.id),
    resetPending: !!one('SELECT 1 FROM reset_requests WHERE user_id = ? AND resolved = 0', u.id),
  }));
  res.json({ users });
});

app.post('/api/users', auth, master, (req, res) => {
  const b = req.body || {};
  if (!clean(b.name) || !(clean(b.email) || clean(b.matricula))) return bad(res, 400, 'Informe nome e e-mail ou matrícula.');
  if (!validPassword(b.password)) return bad(res, 400, 'A senha inicial precisa ter pelo menos 6 caracteres.');
  if (one('SELECT 1 FROM users WHERE (email IS NOT NULL AND lower(email) = ?) OR (matricula IS NOT NULL AND matricula = ?)', norm(b.email), clean(b.matricula) || '\u0000'))
    return bad(res, 409, 'Já existe um cadastro com este e-mail ou matrícula.');
  const role = b.role === 'mestre' ? 'mestre' : 'colaborador';
  const nid = id();
  run(`INSERT INTO users (id, role, status, name, email, matricula, password_hash, photo, linha, cargo, turno, time, posto, tipo_melhoria, previa, must_change_password)
       VALUES (?, ?, 'ativo', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    nid, role, clean(b.name), norm(b.email) || null, clean(b.matricula) || null, bcrypt.hashSync(b.password, 10), b.photo || null,
    clean(b.linha) || null, clean(b.cargo) || null, clean(b.turno) || null, clean(b.time) || null, clean(b.posto) || null,
    clean(b.tipoMelhoria) || null, clean(b.previa) || null);
  res.json({ user: publicUser(one('SELECT * FROM users WHERE id = ?', nid)) });
});

app.put('/api/users/:id', auth, master, (req, res) => {
  const u = one('SELECT * FROM users WHERE id = ?', req.params.id);
  if (!u) return bad(res, 404, 'Colaborador não encontrado.');
  const b = req.body || {};
  if (u.id === req.user.id && b.status && b.status !== 'ativo') return bad(res, 400, 'Você não pode desativar o próprio login.');
  const pick = (k, col) => (b[k] === undefined ? u[col] : clean(b[k]) || null);
  run(`UPDATE users SET name = ?, email = ?, matricula = ?, photo = ?, linha = ?, cargo = ?, turno = ?, time = ?, posto = ?, tipo_melhoria = ?, previa = ?, status = ?, role = ? WHERE id = ?`,
    pick('name', 'name') || u.name, b.email === undefined ? u.email : norm(b.email) || null, pick('matricula', 'matricula'),
    b.photo === undefined ? u.photo : b.photo, pick('linha', 'linha'), pick('cargo', 'cargo'), pick('turno', 'turno'), pick('time', 'time'),
    pick('posto', 'posto'), pick('tipoMelhoria', 'tipo_melhoria'), pick('previa', 'previa'),
    ['ativo', 'pendente', 'inativo'].includes(b.status) ? b.status : u.status,
    u.id === req.user.id ? u.role : (['mestre', 'colaborador'].includes(b.role) ? b.role : u.role), u.id);
  res.json({ user: publicUser(one('SELECT * FROM users WHERE id = ?', u.id)) });
});

// Aprova a ideia do colaborador: ativa o acesso e (opcional) cria o projeto já com ele no time.
app.post('/api/users/:id/approve', auth, master, (req, res) => {
  const u = one('SELECT * FROM users WHERE id = ?', req.params.id);
  if (!u) return bad(res, 404, 'Colaborador não encontrado.');
  run("UPDATE users SET status = 'ativo' WHERE id = ?", u.id);
  let project = null;
  if (req.body?.createProject !== false) {
    const idea = u.idea ? JSON.parse(u.idea) : {};
    const pid = id();
    const title = clean(req.body?.title) || idea.titulo || `Projeto de ${u.name.split(' ')[0]}`;
    const data = newProjectData({ linha: u.linha, posto: u.posto, autor: u.name, area: areaOfType(u.tipo_melhoria)?.area, previa: u.previa });
    if (idea.solucao) data.stages.s08.fields.alternativas = `Ideia inicial do colaborador: ${idea.solucao}`;
    if (idea.ganho) data.stages.s07.fields.indicador = idea.ganho;
    run('INSERT INTO projects (id, title, status, tipo_melhoria, linha, owner_id, data) VALUES (?, ?, ?, ?, ?, ?, ?)',
      pid, title, 'andamento', u.tipo_melhoria, u.linha, u.id, JSON.stringify(data));
    run('INSERT INTO members (project_id, user_id) VALUES (?, ?)', pid, u.id);
    log(pid, req.user.id, `aprovou a ideia de ${u.name} e criou o projeto`);
    project = { id: pid, title };
  }
  res.json({ ok: true, project });
});

app.put('/api/users/:id/password', auth, master, (req, res) => {
  const u = one('SELECT * FROM users WHERE id = ?', req.params.id);
  if (!u) return bad(res, 404, 'Colaborador não encontrado.');
  if (!validPassword(req.body?.password)) return bad(res, 400, 'A senha precisa ter pelo menos 6 caracteres.');
  run('UPDATE users SET password_hash = ?, must_change_password = ? WHERE id = ?', bcrypt.hashSync(req.body.password, 10), req.body.forceChange === false ? 0 : 1, u.id);
  run('UPDATE reset_requests SET resolved = 1 WHERE user_id = ?', u.id);
  res.json({ ok: true });
});

app.delete('/api/users/:id', auth, master, (req, res) => {
  if (req.params.id === req.user.id) return bad(res, 400, 'Você não pode remover o próprio login.');
  run('DELETE FROM users WHERE id = ?', req.params.id);
  res.json({ ok: true });
});

app.get('/api/reset-requests', auth, master, (req, res) => {
  res.json({
    requests: all(`SELECT r.id, r.created_at AS createdAt, u.id AS userId, u.name, u.email, u.matricula, u.photo
                   FROM reset_requests r JOIN users u ON u.id = r.user_id WHERE r.resolved = 0 ORDER BY r.created_at DESC`),
  });
});

// ---------- projetos ----------
function projectSummary(p, withData = false) {
  const members = all('SELECT u.* FROM users u JOIN members m ON m.user_id = u.id WHERE m.project_id = ?', p.id).map((u) => publicUser(u, false));
  const data = migrate(docs.get(p.id)?.data || JSON.parse(p.data || '{}'));
  const st = projectStatus(data);
  const cur = st.phases.find((x) => x.n === st.phase);
  const out = {
    id: p.id, title: p.title, status: p.status, tipoMelhoria: p.tipo_melhoria, linha: p.linha, ownerId: p.owner_id,
    createdAt: p.created_at, updatedAt: p.updated_at, members,
    progress: { total: st.total, current: st.current, phase: st.phase, maturity: st.maturity, maturityLabel: st.maturityLabel, gate: cur.gate.id, gateStatus: cur.gateStatus },
  };
  if (withData) out.data = data;
  return out;
}

app.get('/api/projects', auth, (req, res) => {
  const full = req.query.full === '1' && req.user.role === 'mestre';
  const rows = req.user.role === 'mestre'
    ? all('SELECT * FROM projects ORDER BY updated_at DESC')
    : all('SELECT p.* FROM projects p JOIN members m ON m.project_id = p.id WHERE m.user_id = ? ORDER BY p.updated_at DESC', req.user.id);
  res.json({ projects: rows.map((p) => projectSummary(p, full)) });
});

app.post('/api/projects', auth, master, (req, res) => {
  const b = req.body || {};
  if (!clean(b.title)) return bad(res, 400, 'Dê um nome ao projeto.');
  const ids = Array.isArray(b.members) ? [...new Set(b.members)] : [];
  if (ids.length > MAX_MEMBERS) return bad(res, 400, `Cada projeto aceita no máximo ${MAX_MEMBERS} colaboradores.`);
  const pid = id();
  run('INSERT INTO projects (id, title, status, tipo_melhoria, linha, owner_id, data) VALUES (?, ?, ?, ?, ?, ?, ?)',
    pid, clean(b.title), 'andamento', clean(b.tipoMelhoria) || null, clean(b.linha) || null, req.user.id,
    JSON.stringify(newProjectData({ linha: b.linha, previa: b.descricao })));
  for (const m of ids) run('INSERT OR IGNORE INTO members (project_id, user_id) VALUES (?, ?)', pid, m);
  log(pid, req.user.id, 'criou o projeto');
  res.json({ project: projectSummary(one('SELECT * FROM projects WHERE id = ?', pid)) });
});

app.get('/api/projects/:id', auth, (req, res) => {
  const p = one('SELECT * FROM projects WHERE id = ?', req.params.id);
  if (!p) return bad(res, 404, 'Projeto não encontrado.');
  if (!canAccess(req.user, p.id)) return bad(res, 403, 'Você não faz parte deste projeto.');
  flushDoc(p.id);
  const fresh = one('SELECT * FROM projects WHERE id = ?', p.id);
  res.json({
    project: projectSummary(fresh, true),
    activity: all(`SELECT a.text, a.created_at AS createdAt, u.name FROM activity a LEFT JOIN users u ON u.id = a.user_id
                   WHERE a.project_id = ? ORDER BY a.id DESC LIMIT 30`, p.id),
  });
});

app.put('/api/projects/:id', auth, (req, res) => {
  const p = one('SELECT * FROM projects WHERE id = ?', req.params.id);
  if (!p) return bad(res, 404, 'Projeto não encontrado.');
  if (!canAccess(req.user, p.id)) return bad(res, 403, 'Você não faz parte deste projeto.');
  const b = req.body || {};
  const status = req.user.role === 'mestre' && b.status ? b.status : p.status;
  run("UPDATE projects SET title = ?, status = ?, tipo_melhoria = ?, linha = ?, updated_at = datetime('now') WHERE id = ?",
    clean(b.title) || p.title, status, b.tipoMelhoria === undefined ? p.tipo_melhoria : b.tipoMelhoria, b.linha === undefined ? p.linha : b.linha, p.id);
  const out = projectSummary(one('SELECT * FROM projects WHERE id = ?', p.id));
  io.to(p.id).emit('meta', out);
  res.json({ project: out });
});

app.put('/api/projects/:id/members', auth, master, (req, res) => {
  const p = one('SELECT * FROM projects WHERE id = ?', req.params.id);
  if (!p) return bad(res, 404, 'Projeto não encontrado.');
  const ids = [...new Set(req.body?.members || [])];
  if (ids.length > MAX_MEMBERS) return bad(res, 400, `Cada projeto aceita no máximo ${MAX_MEMBERS} colaboradores.`);
  db.exec('BEGIN');
  run('DELETE FROM members WHERE project_id = ?', p.id);
  for (const m of ids) run('INSERT INTO members (project_id, user_id) VALUES (?, ?)', p.id, m);
  db.exec('COMMIT');
  log(p.id, req.user.id, 'atualizou o time do projeto');
  const out = projectSummary(p);
  io.to(p.id).emit('meta', out);
  res.json({ project: out });
});

app.delete('/api/projects/:id', auth, master, (req, res) => {
  docs.delete(req.params.id);
  run('DELETE FROM projects WHERE id = ?', req.params.id);
  res.json({ ok: true });
});

app.get('/api/export/backup', auth, master, (req, res) => {
  for (const pid of docs.keys()) flushDoc(pid);
  const payload = {
    exportedAt: new Date().toISOString(),
    users: all('SELECT * FROM users').map((u) => publicUser(u)),
    projects: all('SELECT * FROM projects').map((p) => projectSummary(p, true)),
  };
  res.setHeader('Content-Disposition', `attachment; filename="ignis-backup-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json(payload);
});

app.get('/api/stats', auth, master, (req, res) => {
  res.json({
    users: one("SELECT COUNT(*) AS n FROM users WHERE role = 'colaborador' AND status = 'ativo'").n,
    pending: one("SELECT COUNT(*) AS n FROM users WHERE status = 'pendente'").n,
    projects: one('SELECT COUNT(*) AS n FROM projects').n,
    done: one("SELECT COUNT(*) AS n FROM projects WHERE status = 'concluido'").n,
    resets: one('SELECT COUNT(*) AS n FROM reset_requests WHERE resolved = 0').n,
  });
});

// ---------- Stage Gates ----------
// Colaborador solicita a avaliação; o gestor aprova, pede ajustes, mantém em espera ou rejeita.
app.post('/api/projects/:id/gates/:gate', auth, (req, res) => {
  const p = one('SELECT * FROM projects WHERE id = ?', req.params.id);
  if (!p) return bad(res, 404, 'Projeto não encontrado.');
  if (!canAccess(req.user, p.id)) return bad(res, 403, 'Você não faz parte deste projeto.');
  const phase = PHASES.find((x) => x.gate.id === req.params.gate);
  if (!phase) return bad(res, 404, 'Gate inválido.');
  const action = req.body?.action;
  const comment = clean(req.body?.comment) || '';
  const d = loadDoc(p.id);
  const st = projectStatus(d.data);
  const info = st.phases.find((x) => x.n === phase.n);
  const isMaster = req.user.role === 'mestre';
  if (action === 'solicitado') {
    if (!info.unlocked) return bad(res, 400, 'Esta fase ainda não foi liberada pelo Gate anterior.');
    if (info.noTool.length) return bad(res, 400, 'Escolha pelo menos uma ferramenta em cada etapa da fase antes de solicitar a avaliação.');
  } else if (!isMaster) return bad(res, 403, 'Só o gestor decide o Gate.');
  if (!['solicitado', 'pendente', ...Object.keys(GATE_STATUS)].includes(action)) return bad(res, 400, 'Ação inválida.');
  const me = one('SELECT name FROM users WHERE id = ?', req.user.id);
  const prev = d.data.gates?.[phase.gate.id] || { history: [] };
  const entry = { status: action, comment, by: me?.name || '', at: new Date().toISOString() };
  const value = { ...entry, history: [...(prev.history || []), entry].slice(-30) };
  const op = { t: 'set', p: ['gates', phase.gate.id], v: value };
  applyOp(d.data, op);
  scheduleFlush(p.id);
  io.to(p.id).emit('op', { ops: [op], by: req.user.id });
  // Status do projeto acompanha as decisões.
  const after = projectStatus(d.data);
  const status = action === 'rejeitado' ? 'cancelado' : action === 'espera' ? 'pausado' : after.maturity >= 5 ? 'concluido' : after.maturity >= 4 ? 'medicao' : 'andamento';
  run("UPDATE projects SET status = ?, updated_at = datetime('now') WHERE id = ?", status, p.id);
  log(p.id, req.user.id, `${action === 'solicitado' ? 'solicitou a avaliação do' : `registrou "${GATE_STATUS[action]?.label || action}" no`} ${phase.gate.title}`);
  const out = projectSummary(one('SELECT * FROM projects WHERE id = ?', p.id));
  io.to(p.id).emit('meta', out);
  res.json({ ok: true, gate: value, project: out });
});

// ---------- tempo real ----------
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 12e6 });

const docs = new Map(); // projectId -> { data, dirty, timer }
function loadDoc(pid) {
  if (!docs.has(pid)) {
    const p = one('SELECT data FROM projects WHERE id = ?', pid);
    if (!p) return null;
    const raw = JSON.parse(p.data || '{}');
    const data = migrate(raw);
    docs.set(pid, { data, dirty: data !== raw, timer: null });
    if (data !== raw) scheduleFlush(pid);
  }
  return docs.get(pid);
}
function flushDoc(pid) {
  const d = docs.get(pid);
  if (!d || !d.dirty) return;
  clearTimeout(d.timer);
  d.timer = null;
  d.dirty = false;
  run("UPDATE projects SET data = ?, updated_at = datetime('now') WHERE id = ?", JSON.stringify(d.data), pid);
}
function scheduleFlush(pid) {
  const d = docs.get(pid);
  d.dirty = true;
  if (!d.timer) d.timer = setTimeout(() => flushDoc(pid), 800);
}

io.use((socket, next) => {
  try {
    const p = jwt.verify(socket.handshake.auth?.token, JWT_SECRET);
    const u = one('SELECT * FROM users WHERE id = ?', p.sub);
    if (!u || u.status !== 'ativo') return next(new Error('unauthorized'));
    socket.data.user = publicUser(u, false);
    socket.data.raw = u;
    next();
  } catch { next(new Error('unauthorized')); }
});

function presence(pid) {
  const room = io.sockets.adapter.rooms.get(pid) || new Set();
  const seen = new Map();
  for (const sid of room) {
    const s = io.sockets.sockets.get(sid);
    if (s) seen.set(s.data.user.id, { ...s.data.user, focus: s.data.focus || null, step: s.data.step || null });
  }
  return [...seen.values()];
}

io.on('connection', (socket) => {
  socket.on('join', (pid, ack) => {
    if (!canAccess(socket.data.raw, pid)) return ack?.({ error: 'forbidden' });
    const d = loadDoc(pid);
    if (!d) return ack?.({ error: 'not_found' });
    for (const r of socket.rooms) if (r !== socket.id) socket.leave(r);
    socket.join(pid);
    socket.data.project = pid;
    ack?.({ data: d.data });
    io.to(pid).emit('presence', presence(pid));
  });

  socket.on('op', (ops, ack) => {
    const pid = socket.data.project;
    if (!pid) return;
    const d = loadDoc(pid);
    if (!d) return;
    // Decisões de Gate só passam pela rota própria (com checagem de perfil).
    const list = (Array.isArray(ops) ? ops : [ops]).filter((op) => op && Array.isArray(op.p) && op.p[0] !== 'gates');
    if (!list.length) return;
    for (const op of list) {
      try { applyOp(d.data, op); } catch (e) { console.error('op inválida', e.message); }
    }
    scheduleFlush(pid);
    socket.to(pid).emit('op', { ops: list, by: socket.data.user.id });
    ack?.({ ok: true });
  });

  socket.on('focus', ({ field, step } = {}) => {
    socket.data.focus = field || null;
    socket.data.step = step || socket.data.step || null;
    if (socket.data.project) io.to(socket.data.project).emit('presence', presence(socket.data.project));
  });

  socket.on('disconnect', () => {
    const pid = socket.data.project;
    if (pid) {
      io.to(pid).emit('presence', presence(pid));
      if (!io.sockets.adapter.rooms.get(pid)) { flushDoc(pid); docs.delete(pid); }
    }
  });
});

// ---------- front-end compilado ----------
const dist = path.resolve('dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api|socket\.io).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

const shutdown = () => { for (const pid of docs.keys()) flushDoc(pid); process.exit(0); };
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

server.listen(PORT, () => {
  console.log(`\n  🔥 IGNIS API rodando em http://localhost:${PORT}`);
  if (fs.existsSync(dist)) console.log(`  Abra http://localhost:${PORT} no navegador.`);
  console.log(`  E-mail de recuperação: ${mailEnabled() ? 'ativado (SMTP)' : 'desativado (pedidos vão para o login mestre)'}\n`);
});
