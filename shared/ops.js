// Operações de edição compartilhadas entre cliente e servidor.
// Um caminho é uma lista de chaves. Um segmento "#id" localiza o item de uma lista pelo campo id.

export function resolve(root, path, create = true) {
  let node = root;
  for (const seg of path) {
    if (node == null) return undefined;
    if (typeof seg === 'string' && seg.startsWith('#')) {
      if (!Array.isArray(node)) return undefined;
      node = node.find((it) => it && it.id === seg.slice(1));
    } else {
      if (node[seg] === undefined && create) node[seg] = {};
      node = node[seg];
    }
  }
  return node;
}

function parentOf(root, path) {
  const parent = resolve(root, path.slice(0, -1));
  return [parent, path[path.length - 1]];
}

function setKey(parent, key, value) {
  if (parent == null) return;
  if (typeof key === 'string' && key.startsWith('#') && Array.isArray(parent)) {
    const i = parent.findIndex((it) => it && it.id === key.slice(1));
    if (i >= 0) parent[i] = value;
  } else parent[key] = value;
}

// op: { t: 'set', p, v } | { t: 'push', p, v } | { t: 'del', p, id } | { t: 'move', p, id, to }
export function applyOp(doc, op) {
  switch (op.t) {
    case 'set': {
      const [parent, key] = parentOf(doc, op.p);
      setKey(parent, key, op.v);
      break;
    }
    case 'push': {
      const [parent, key] = parentOf(doc, op.p);
      if (!parent) break;
      if (!Array.isArray(parent[key])) parent[key] = [];
      if (!parent[key].some((it) => it && op.v && it.id === op.v.id)) parent[key].push(op.v);
      break;
    }
    case 'del': {
      const list = resolve(doc, op.p, false);
      if (Array.isArray(list)) {
        const i = list.findIndex((it) => it && it.id === op.id);
        if (i >= 0) list.splice(i, 1);
      }
      break;
    }
    case 'move': {
      const list = resolve(doc, op.p, false);
      if (Array.isArray(list)) {
        const i = list.findIndex((it) => it && it.id === op.id);
        if (i >= 0) {
          const [it] = list.splice(i, 1);
          list.splice(Math.max(0, Math.min(op.to, list.length)), 0, it);
        }
      }
      break;
    }
  }
  return doc;
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
