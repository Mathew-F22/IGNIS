import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { applyOp, resolve, uid } from '../../shared/ops.js';
import { getToken } from './api.js';

const Ctx = createContext(null);
export const ProjectCtx = Ctx;
export const useProject = () => useContext(Ctx);

export function ProjectProvider({ projectId, meta, setMeta, me, children }) {
  const docRef = useRef(null);
  const [version, setVersion] = useState(0);
  const [status, setStatus] = useState('conectando');
  const [presence, setPresence] = useState([]);
  const [error, setError] = useState(null);
  const sockRef = useRef(null);
  const queue = useRef([]);

  useEffect(() => {
    const s = io({ auth: { token: getToken() }, transports: ['websocket', 'polling'] });
    sockRef.current = s;
    const join = () => s.emit('join', projectId, (res) => {
      if (res?.error) { setError(res.error === 'forbidden' ? 'Você não faz parte deste projeto.' : 'Projeto não encontrado.'); return; }
      docRef.current = res.data;
      setVersion((v) => v + 1);
      setStatus('online');
      if (queue.current.length) { s.emit('op', queue.current); queue.current = []; }
    });
    s.on('connect', join);
    s.on('disconnect', () => setStatus('offline'));
    s.on('connect_error', () => setStatus('offline'));
    s.on('op', ({ ops }) => {
      if (!docRef.current) return;
      for (const op of ops) applyOp(docRef.current, op);
      setVersion((v) => v + 1);
    });
    s.on('presence', setPresence);
    s.on('meta', (m) => setMeta?.((old) => ({ ...old, ...m })));
    return () => { s.disconnect(); };
  }, [projectId, setMeta]);

  const send = useCallback((ops) => {
    const list = Array.isArray(ops) ? ops : [ops];
    if (!docRef.current) return;
    for (const op of list) applyOp(docRef.current, op);
    setVersion((v) => v + 1);
    const s = sockRef.current;
    if (s?.connected) s.emit('op', list); else queue.current.push(...list);
  }, []);

  const api = useMemo(() => ({
    get: (path) => (docRef.current ? resolve(docRef.current, path, false) : undefined),
    set: (path, v) => send({ t: 'set', p: path, v }),
    push: (path, v) => { const item = { id: uid(), ...v }; send({ t: 'push', p: path, v: item }); return item; },
    del: (path, id) => send({ t: 'del', p: path, id }),
    move: (path, id, to) => send({ t: 'move', p: path, id, to }),
    send,
    focus: (field, step) => sockRef.current?.emit('focus', { field, step }),
  }), [send]);

  const value = { ...api, doc: docRef.current, version, status, presence, error, projectId, meta, setMeta, me };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// Quem (além de mim) está editando este campo.
export function useFieldPresence(key) {
  const { presence, me } = useProject();
  return presence.filter((p) => p.id !== me?.id && p.focus === key);
}
