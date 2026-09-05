/**
 * Stats-style hierarchical clustering + dendrogram geometry.
 * Average linkage (UPGMA-like) on categorical feature vectors.
 */

function features(m) {
  return {
    type: m.type,
    theme: m.themeId || "none",
    book: m.book,
    scope: m.templeOnly ? "temple" : m.landOnly ? "land" : "general",
    parsha: m.parsha,
  };
}

/** Weighted categorical distance in [0, 1]. */
export function mitzvahDistance(a, b) {
  const fa = features(a);
  const fb = features(b);
  let d = 0;
  let w = 0;
  const add = (same, weight) => {
    w += weight;
    if (!same) d += weight;
  };
  add(fa.type === fb.type, 3);
  add(fa.theme === fb.theme, 4);
  add(fa.book === fb.book, 2);
  add(fa.scope === fb.scope, 1.5);
  add(fa.parsha === fb.parsha, 1);
  // soft numeric proximity by id (biblical order)
  const idGap = Math.min(1, Math.abs(a.id - b.id) / 80);
  w += 1.2;
  d += idGap * 1.2;
  return d / w;
}

/**
 * Average-linkage agglomerative clustering.
 * Returns root node: { id, height, size, leaf?, left?, right?, items[] }
 */
export function averageLinkage(items) {
  const n = items.length;
  if (!n) return null;
  if (n === 1) {
    return {
      id: `L${items[0].id}`,
      height: 0,
      size: 1,
      leaf: items[0],
      items: [items[0]],
    };
  }

  const dist = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = mitzvahDistance(items[i], items[j]);
      dist[i][j] = d;
      dist[j][i] = d;
    }
  }

  /** @type {Array<{id:string,height:number,size:number,leaf?:any,left?:any,right?:any,items:any[],active:boolean,index:number}>} */
  const nodes = items.map((m, i) => ({
    id: `L${m.id}`,
    height: 0,
    size: 1,
    leaf: m,
    items: [m],
    active: true,
    index: i,
  }));

  // Working distance between active cluster indices (into nodes array)
  const cd = dist.map((row) => row.slice());
  let nextId = 0;

  for (let step = 0; step < n - 1; step++) {
    let best = Infinity;
    let ai = -1;
    let bi = -1;
    for (let i = 0; i < nodes.length; i++) {
      if (!nodes[i].active) continue;
      for (let j = i + 1; j < nodes.length; j++) {
        if (!nodes[j].active) continue;
        const d = cd[i][j];
        if (d < best) {
          best = d;
          ai = i;
          bi = j;
        }
      }
    }
    if (ai < 0) break;

    const A = nodes[ai];
    const B = nodes[bi];
    const merged = {
      id: `N${nextId++}`,
      height: best,
      size: A.size + B.size,
      left: A,
      right: B,
      items: A.items.concat(B.items),
      active: true,
      index: nodes.length,
    };
    A.active = false;
    B.active = false;

    // Extend distance matrix for merged cluster (average linkage)
    const newRow = [];
    for (let k = 0; k < nodes.length; k++) {
      if (!nodes[k].active) {
        newRow[k] = 0;
        continue;
      }
      const d =
        (cd[ai][k] * A.size + cd[bi][k] * B.size) / (A.size + B.size);
      newRow[k] = d;
    }
    for (let k = 0; k < nodes.length; k++) {
      if (!cd[k]) continue;
      cd[k].push(nodes[k].active ? newRow[k] : 0);
    }
    newRow.push(0);
    cd.push(newRow);
    nodes.push(merged);
  }

  return nodes.filter((x) => x.active)[0] || nodes[nodes.length - 1];
}

/**
 * Constrained twin dendrogram: first split by type (Shabbat+/Idolatry−),
 * then average-linkage within each trunk.
 */
export function buildTwinDendrogram(items, twinRoots) {
  const pos = items.filter((m) => m.type === "positive").sort((a, b) => a.id - b.id);
  const neg = items.filter((m) => m.type === "negative").sort((a, b) => a.id - b.id);
  const left = averageLinkage(pos);
  const right = averageLinkage(neg);

  if (!left && !right) return null;
  if (!left) return annotateTrunk(right, twinRoots.idolatry);
  if (!right) return annotateTrunk(left, twinRoots.shabbat);

  const root = {
    id: "ROOT",
    height: 1.05,
    size: items.length,
    left: annotateTrunk(left, twinRoots.shabbat),
    right: annotateTrunk(right, twinRoots.idolatry),
    items,
    twin: true,
  };
  return root;
}

function annotateTrunk(node, rootMeta) {
  if (!node) return node;
  const mark = (n) => {
    n.trunk = rootMeta.id;
    n.trunkLabel = rootMeta.title;
    n.trunkType = rootMeta.type;
    if (n.left) mark(n.left);
    if (n.right) mark(n.right);
  };
  mark(node);
  return node;
}

/**
 * Layout dendrogram for SVG.
 * Horizontal classic stats look: leaves on the right, root on the left.
 * Returns { nodes, edges, width, height, leafPositions }
 */
export function layoutDendrogram(root, opts = {}) {
  const leafGap = opts.leafGap ?? 7;
  const margin = opts.margin ?? { top: 28, right: 88, bottom: 28, left: 120 };
  const xSpan = opts.xSpan ?? 640;

  const leaves = [];
  const walkLeaves = (n) => {
    if (n.leaf) leaves.push(n);
    else {
      if (n.left) walkLeaves(n.left);
      if (n.right) walkLeaves(n.right);
    }
  };
  walkLeaves(root);

  const height = margin.top + margin.bottom + Math.max(leaves.length, 1) * leafGap;
  const width = margin.left + margin.right + xSpan;

  let leafIndex = 0;
  const positions = new Map(); // node.id -> {x,y}

  const maxH = Math.max(root.height || 1, 1e-6);

  const place = (n) => {
    if (n.leaf) {
      const y = margin.top + leafIndex * leafGap + leafGap / 2;
      leafIndex += 1;
      const x = margin.left + xSpan;
      positions.set(n.id, { x, y, node: n });
      return y;
    }
    const y1 = place(n.left);
    const y2 = place(n.right);
    const y = (y1 + y2) / 2;
    const x = margin.left + (1 - n.height / maxH) * xSpan;
    positions.set(n.id, { x, y, node: n });
    return y;
  };
  place(root);

  const edges = [];
  const collect = (n) => {
    if (n.leaf) return;
    const p = positions.get(n.id);
    const L = positions.get(n.left.id);
    const R = positions.get(n.right.id);
    // Classic rectilinear dendrogram elbows
    edges.push({
      type: "h",
      x1: L.x,
      y1: L.y,
      x2: p.x,
      y2: L.y,
      trunk: n.left.trunk || n.trunk,
    });
    edges.push({
      type: "h",
      x1: R.x,
      y1: R.y,
      x2: p.x,
      y2: R.y,
      trunk: n.right.trunk || n.trunk,
    });
    edges.push({
      type: "v",
      x1: p.x,
      y1: L.y,
      x2: p.x,
      y2: R.y,
      trunk: n.trunk,
      merge: true,
      height: n.height,
    });
    collect(n.left);
    collect(n.right);
  };
  collect(root);

  return {
    width,
    height,
    margin,
    xSpan,
    maxH,
    positions,
    edges,
    leaves: leaves.map((n) => ({
      ...positions.get(n.id),
      node: n,
      mitzvah: n.leaf,
    })),
  };
}
