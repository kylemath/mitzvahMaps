import {
  THEMES,
  PILLARS,
  enrichMitzvot,
  decadeChunks,
  groupByTheme,
} from "./taxonomy.js";
import { buildTwinDendrogram, layoutDendrogram } from "./dendrogram.js";

const BOOK_COLORS = {
  Bereshit: "#c47a3a",
  Shemot: "#2f6f63",
  Vayikra: "#8b3f34",
  Bamidbar: "#3d5a80",
  Devarim: "#6b5b8a",
};

const MODES = [
  {
    id: "foam",
    label: "Foam",
    group: "spatial",
    blurb: "Soft packed bubbles fill the frame. Left negative, right positive; early Torah at the top.",
  },
  {
    id: "shelves",
    label: "Shelves",
    group: "spatial",
    blurb: "One shelf per book. Buttons pack each shelf—negatives left of the spine, positives right.",
  },
  {
    id: "mosaic",
    label: "Mosaic",
    group: "spatial",
    blurb: "A dense tile quilt. Two panels side by side; reading order runs top to bottom in each.",
  },
  {
    id: "comb",
    label: "Comb",
    group: "spatial",
    blurb: "A honeycomb of hex buttons tiling the space—same left/right and top/bottom rules.",
  },
  {
    id: "decades",
    label: "Decades",
    group: "digest",
    blurb: "Chunked into groups of ten in biblical order—open one decade at a time to browse ~10 commandments.",
  },
  {
    id: "themes",
    label: "Themes",
    group: "digest",
    blurb: "Nine life-areas (faith, festivals, temple, food…). Open a theme card to see its related mitzvot.",
  },
  {
    id: "pyramid",
    label: "Pyramid",
    group: "digest",
    blurb: "Apex pillars → mid themes → leaf mitzvot. Climb down the hierarchy one level at a time.",
  },
  {
    id: "orbit",
    label: "Orbit",
    group: "digest",
    blurb: "Core tenants at the center; click a hub to see related commandments branch into an outer ring.",
  },
  {
    id: "sheet",
    label: "Sheet",
    group: "digest",
    blurb: "A dense spreadsheet of all 613. Pick row and column categories, swap them, and scan every mitzvah as a tight cell.",
  },
  {
    id: "twin",
    label: "Dendrogram",
    group: "digest",
    blurb: "A statistics-style dendrogram: hierarchical clustering under Keep Shabbat (+) and No idolatry (−). Closer joins = more similar mitzvot.",
  },
];

/** Classical reduction: positives hang from Shabbat; negatives from rejecting idolatry. */
const TWIN_ROOTS = {
  shabbat: {
    id: "shabbat",
    rootMitzvahId: 31,
    companionIds: [31, 32, 85],
    title: "Keep Shabbat",
    hebrewHint: "aseh",
    type: "positive",
    blurb: "One positive root. Every aseh commandment branches from the covenant of sacred time.",
  },
  idolatry: {
    id: "idolatry",
    rootMitzvahId: 26,
    companionIds: [26, 27, 28, 29],
    title: "No idolatry",
    hebrewHint: "lo ta’aseh",
    type: "negative",
    blurb: "One negative root. Every lo ta’aseh commandment branches from rejecting other powers.",
  },
};

const SHEET_AXES = [
  { id: "book", label: "Book" },
  { id: "theme", label: "Theme" },
  { id: "type", label: "Pos / Neg" },
  { id: "decade", label: "Decade ×10" },
  { id: "scope", label: "Land / Temple" },
  { id: "parsha", label: "Parsha" },
];

function axisInfo(m, axisId, meta) {
  switch (axisId) {
    case "book":
      return {
        key: m.book,
        label: m.book,
        order: meta.books.indexOf(m.book),
      };
    case "theme":
      return {
        key: m.themeId,
        label: m.themeName,
        order: THEMES.findIndex((t) => t.id === m.themeId),
      };
    case "type":
      return {
        key: m.type,
        label: m.type === "positive" ? "Positive" : "Negative",
        order: m.type === "negative" ? 0 : 1,
      };
    case "decade": {
      const start = Math.floor((m.id - 1) / 10) * 10 + 1;
      const end = Math.min(613, start + 9);
      return {
        key: `d${start}`,
        label: `#${start}–${end}`,
        order: start,
      };
    }
    case "scope":
      if (m.templeOnly) return { key: "temple", label: "Temple", order: 2 };
      if (m.landOnly) return { key: "land", label: "Land only", order: 1 };
      return { key: "general", label: "General", order: 0 };
    case "parsha":
      return {
        key: m.parsha,
        label: m.parsha,
        order: m.id,
      };
    default:
      return { key: "all", label: "All", order: 0 };
  }
}

function uniqueAxisValues(list, axisId, meta) {
  const map = new Map();
  for (const m of list) {
    const info = axisInfo(m, axisId, meta);
    if (!map.has(info.key)) map.set(info.key, info);
  }
  return [...map.values()].sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
}

function hash01(n) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function shortLabel(text, max = 28) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}

function makeButton(m, extraClass = "") {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `mitz-btn mitz-btn-${m.type} ${extraClass}`.trim();
  btn.dataset.id = String(m.id);
  btn.dataset.type = m.type;
  btn.dataset.book = m.book;
  btn.style.setProperty("--book", BOOK_COLORS[m.book] || "#666");
  btn.title = `#${m.id} — ${m.text}`;
  btn.setAttribute("aria-label", `Mitzvah ${m.id}: ${m.text}`);
  return btn;
}

/** Circle packing toward type/order targets so bubbles fill the box. */
function packFoam(items, width, height) {
  const n = items.length;
  if (!n) return [];

  const area = width * height;
  let r = Math.sqrt(area / (n * Math.PI)) * 0.9;
  r = Math.max(14, Math.min(r, 34));

  const nodes = items.map((m, i) => {
    const t = (m.id - 1) / 612;
    const left = m.type === "negative";
    const tx =
      width * (left ? 0.22 : 0.78) +
      (hash01(m.id) - 0.5) * width * 0.28;
    const ty = height * (0.05 + t * 0.9) + (hash01(m.id + 9) - 0.5) * 12;
    return {
      m,
      x: tx + (hash01(i + 3) - 0.5) * 20,
      y: ty,
      tx,
      ty,
      r: r * (0.88 + hash01(m.id * 3) * 0.28),
    };
  });

  const cell = r * 2.2;
  const iters = n > 400 ? 36 : n > 200 ? 48 : 64;

  for (let iter = 0; iter < iters; iter++) {
    const strength = 0.5 + (1 - iter / iters) * 0.3;
    const grid = new Map();
    const key = (x, y) => `${x},${y}`;

    for (let i = 0; i < n; i++) {
      const node = nodes[i];
      const gx = Math.floor(node.x / cell);
      const gy = Math.floor(node.y / cell);
      const k = key(gx, gy);
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k).push(i);
    }

    for (let i = 0; i < n; i++) {
      const a = nodes[i];
      const gx = Math.floor(a.x / cell);
      const gy = Math.floor(a.y / cell);
      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          const bucket = grid.get(key(gx + ox, gy + oy));
          if (!bucket) continue;
          for (const j of bucket) {
            if (j <= i) continue;
            const b = nodes[j];
            let dx = b.x - a.x;
            let dy = b.y - a.y;
            let dist = Math.hypot(dx, dy);
            const min = a.r + b.r - 0.6;
            if (dist === 0) {
              dx = 0.01;
              dy = 0.01;
              dist = 0.014;
            }
            if (dist < min) {
              const push = ((min - dist) / 2) * strength;
              dx /= dist;
              dy /= dist;
              a.x -= dx * push;
              a.y -= dy * push;
              b.x += dx * push;
              b.y += dy * push;
            }
          }
        }
      }
    }

    for (const node of nodes) {
      node.x += (node.tx - node.x) * 0.04;
      node.y += (node.ty - node.y) * 0.06;
      node.x = Math.min(width - node.r, Math.max(node.r, node.x));
      node.y = Math.min(height - node.r, Math.max(node.r, node.y));
      if (node.m.type === "negative") {
        node.x = Math.min(node.x, width * 0.48 - node.r * 0.2);
      } else {
        node.x = Math.max(node.x, width * 0.52 + node.r * 0.2);
      }
    }
  }
  return nodes;
}

function hexMetrics(size) {
  const w = size * Math.sqrt(3);
  const h = size * 1.5;
  return { w, h, size };
}

function packComb(items, width, height) {
  const n = items.length;
  if (!n) return [];

  // Estimate hex size to fill area (~ hex area = (3*sqrt(3)/2) * size^2)
  const hexArea = areaFactor(width, height, n);
  let size = Math.sqrt(hexArea / 2.598);
  size = Math.max(12, Math.min(size, 30));

  let { w, h } = hexMetrics(size);
  let cols = Math.max(4, Math.floor(width / w));
  let rows = Math.ceil(n / cols);
  while (rows * h > height * 1.05 && size > 12) {
    size -= 0.5;
    ({ w, h } = hexMetrics(size));
    cols = Math.max(4, Math.floor(width / w));
    rows = Math.ceil(n / cols);
  }

  const neg = items.filter((m) => m.type === "negative").sort((a, b) => a.id - b.id);
  const pos = items.filter((m) => m.type === "positive").sort((a, b) => a.id - b.id);
  const mid = Math.floor(cols / 2);

  const cells = [];
  const place = (list, colStart, colEnd) => {
    const span = Math.max(1, colEnd - colStart);
    list.forEach((m, i) => {
      const col = colStart + (i % span);
      const row = Math.floor(i / span);
      const xOff = (row % 2) * (w * 0.5);
      const x = col * w + w / 2 + xOff;
      const y = row * h + size;
      cells.push({ m, x, y, size });
    });
  };

  place(neg, 0, mid);
  place(pos, mid, cols);
  return { cells, size, width: cols * w + w / 2, height: Math.max(...cells.map((c) => c.y)) + size };
}

function areaFactor(width, height, n) {
  return (width * height) / Math.max(n, 1);
}

export function createViz(container, options) {
  const { mitzvot, meta, onSelectMitzvah, onSelectBook } = options;
  const root = container.closest(".viz-section") || document;
  const tooltip = container.querySelector("[data-viz-tooltip]");
  const crumb = container.querySelector("[data-viz-crumb]");
  const blurbEl = root.querySelector("[data-viz-blurb]");
  const canvas = container.querySelector("[data-viz-canvas]");
  const modeBar = root.querySelector("[data-viz-modes]");

  let mode = "decades";
  let activeIds = new Set(mitzvot.map((m) => m.id));
  let selectedId = null;
  const items = enrichMitzvot(mitzvot);
  let openDecade = "d-1";
  let openTheme = null;
  let pyramidTheme = null;
  let orbitHub = THEMES[0].id;
  let sheetRows = "theme";
  let sheetCols = "book";
  let dendroCacheKey = "";
  let dendroLayout = null;
  let dendroPending = false;

  modeBar.innerHTML = "";
  const groups = [
    { id: "spatial", label: "Spatial" },
    { id: "digest", label: "Digest" },
  ];
  for (const g of groups) {
    const wrap = document.createElement("div");
    wrap.className = "viz-mode-group";
    const lab = document.createElement("span");
    lab.className = "mode-label";
    lab.textContent = g.label;
    wrap.appendChild(lab);
    const chips = document.createElement("div");
    chips.className = "chip-group";
    for (const m of MODES.filter((x) => x.group === g.id)) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = `chip${m.id === mode ? " is-active" : ""}`;
      chip.dataset.mode = m.id;
      chip.textContent = m.label;
      chip.addEventListener("click", () => {
        mode = m.id;
        modeBar.querySelectorAll(".chip").forEach((c) => {
          c.classList.toggle("is-active", c.dataset.mode === mode);
        });
        render();
      });
      chips.appendChild(chip);
    }
    wrap.appendChild(chips);
    modeBar.appendChild(wrap);
  }

  function setCrumb(text) {
    if (crumb) crumb.textContent = text;
  }

  function showTip(m, e) {
    if (!tooltip) return;
    tooltip.hidden = false;
    tooltip.innerHTML = `<strong>#${m.id} · ${m.type}</strong><span>${escapeHtml(m.text)}</span><em>${escapeHtml(m.parsha)} · ${escapeHtml(m.book)}${m.templeOnly ? " · Temple" : m.landOnly ? " · Land of Israel" : ""}</em>`;
    const rect = container.getBoundingClientRect();
    let left = e.clientX - rect.left + 14;
    let top = e.clientY - rect.top + 14;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    requestAnimationFrame(() => {
      const tr = tooltip.getBoundingClientRect();
      if (tr.right > rect.right - 8) tooltip.style.left = `${left - tr.width - 28}px`;
      if (tr.bottom > rect.bottom - 8) tooltip.style.top = `${top - tr.height - 28}px`;
    });
  }

  function hideTip() {
    if (tooltip) tooltip.hidden = true;
  }

  function wireBtn(btn, m) {
    btn.addEventListener("click", () => onSelectMitzvah?.(m.id));
    btn.addEventListener("pointerenter", (e) => showTip(m, e));
    btn.addEventListener("pointermove", (e) => showTip(m, e));
    btn.addEventListener("pointerleave", hideTip);
  }

  function applyActiveState(root) {
    root.querySelectorAll(".mitz-btn").forEach((btn) => {
      const id = Number(btn.dataset.id);
      const on = activeIds.has(id);
      btn.classList.toggle("is-dim", !on);
      btn.classList.toggle("is-selected", id === selectedId);
      btn.disabled = !on;
      btn.tabIndex = on ? 0 : -1;
    });
    const pos = [...activeIds].filter((id) => mitzvot.find((x) => x.id === id)?.type === "positive").length;
    const neg = activeIds.size - pos;
    setCrumb(`${activeIds.size} showing · ${neg} neg · ${pos} pos`);
  }

  function renderFoam() {
    const width = Math.max(320, canvas.clientWidth || 900);
    const height = Math.max(520, Math.min(780, Math.round(width * 0.72)));
    const visible = items.filter((m) => activeIds.has(m.id));
    const packItems = visible.length ? visible : items;
    const nodes = packFoam(packItems, width, height);

    const stage = document.createElement("div");
    stage.className = "viz-foam";
    stage.style.width = `${width}px`;
    stage.style.height = `${height}px`;

    const axis = document.createElement("div");
    axis.className = "viz-axis";
    axis.innerHTML = `
      <span class="viz-axis-neg">Negative</span>
      <span class="viz-axis-mid">Bereshit ↑ · Devarim ↓</span>
      <span class="viz-axis-pos">Positive</span>
    `;
    stage.appendChild(axis);

    const spine = document.createElement("div");
    spine.className = "viz-spine";
    stage.appendChild(spine);

    for (const node of nodes) {
      const btn = makeButton(node.m, "mitz-btn-foam");
      const d = node.r * 2;
      btn.style.width = `${d}px`;
      btn.style.height = `${d}px`;
      btn.style.left = `${node.x - node.r}px`;
      btn.style.top = `${node.y - node.r}px`;
      btn.innerHTML = `<span class="mitz-num">${node.m.id}</span>`;
      wireBtn(btn, node.m);
      stage.appendChild(btn);
    }

    canvas.replaceChildren(stage);
    applyActiveState(stage);
  }

  function renderShelves() {
    const wrap = document.createElement("div");
    wrap.className = "viz-shelves";

    const head = document.createElement("div");
    head.className = "viz-axis viz-axis-inline";
    head.innerHTML = `
      <span class="viz-axis-neg">Negative</span>
      <span class="viz-axis-mid">Books as shelves · Torah order ↓</span>
      <span class="viz-axis-pos">Positive</span>
    `;
    wrap.appendChild(head);

    for (const book of meta.books) {
      const show = items
        .filter((m) => m.book === book && activeIds.has(m.id))
        .sort((a, b) => a.id - b.id);
      if (!show.length) continue;

      const shelf = document.createElement("section");
      shelf.className = "viz-shelf";
      shelf.style.setProperty("--book", BOOK_COLORS[book]);

      const title = document.createElement("button");
      title.type = "button";
      title.className = "viz-shelf-title";
      title.innerHTML = `<strong>${escapeHtml(book)}</strong><span>${meta.bookEn[book]} · ${show.length}</span>`;
      title.addEventListener("click", () => onSelectBook?.(book));
      shelf.appendChild(title);

      const row = document.createElement("div");
      row.className = "viz-shelf-row";

      const left = document.createElement("div");
      left.className = "viz-shelf-side viz-shelf-neg";
      const right = document.createElement("div");
      right.className = "viz-shelf-side viz-shelf-pos";

      for (const m of show) {
        const btn = makeButton(m, "mitz-btn-chip");
        btn.innerHTML = `<span class="mitz-num">${m.id}</span><span class="mitz-chip-text">${escapeHtml(shortLabel(m.text, 22))}</span>`;
        wireBtn(btn, m);
        (m.type === "negative" ? left : right).appendChild(btn);
      }

      if (!left.childElementCount) {
        left.innerHTML = `<p class="viz-empty-side">No negatives</p>`;
      }
      if (!right.childElementCount) {
        right.innerHTML = `<p class="viz-empty-side">No positives</p>`;
      }

      row.append(left, right);
      shelf.appendChild(row);
      wrap.appendChild(shelf);
    }

    if (!wrap.querySelector(".viz-shelf")) {
      wrap.appendChild(Object.assign(document.createElement("p"), {
        className: "viz-empty-side",
        textContent: "No mitzvot match these filters.",
      }));
    }

    canvas.replaceChildren(wrap);
    applyActiveState(wrap);
  }

  function renderMosaic() {
    const wrap = document.createElement("div");
    wrap.className = "viz-mosaic";

    const head = document.createElement("div");
    head.className = "viz-axis viz-axis-inline";
    head.innerHTML = `
      <span class="viz-axis-neg">Negative</span>
      <span class="viz-axis-mid">Tile quilt · biblical order ↓</span>
      <span class="viz-axis-pos">Positive</span>
    `;
    wrap.appendChild(head);

    const split = document.createElement("div");
    split.className = "viz-mosaic-split";

    const makePanel = (list, side) => {
      const panel = document.createElement("div");
      panel.className = `viz-mosaic-panel viz-mosaic-${side}`;
      const sorted = list.filter((m) => activeIds.has(m.id)).sort((a, b) => a.id - b.id);
      for (const m of sorted) {
        const btn = makeButton(m, "mitz-btn-tile");
        btn.innerHTML = `<span class="mitz-num">${m.id}</span><span class="mitz-tile-text">${escapeHtml(shortLabel(m.text, 36))}</span>`;
        wireBtn(btn, m);
        panel.appendChild(btn);
      }
      if (!sorted.length) {
        panel.innerHTML = `<p class="viz-empty-side">Nothing matches</p>`;
      }
      return panel;
    };

    split.append(
      makePanel(items.filter((m) => m.type === "negative"), "neg"),
      makePanel(items.filter((m) => m.type === "positive"), "pos")
    );
    wrap.appendChild(split);
    canvas.replaceChildren(wrap);
    applyActiveState(wrap);
  }

  function renderComb() {
    const width = Math.max(320, canvas.clientWidth || 900);
    const height = Math.max(480, Math.min(720, Math.round(width * 0.7)));
    const visible = items.filter((m) => activeIds.has(m.id));
    const packItems = visible.length ? visible : items;
    const packed = packComb(packItems, width, height);

    const stage = document.createElement("div");
    stage.className = "viz-comb";
    stage.style.width = `${Math.max(width, packed.width)}px`;
    stage.style.height = `${Math.max(height, packed.height + 20)}px`;

    const axis = document.createElement("div");
    axis.className = "viz-axis";
    axis.innerHTML = `
      <span class="viz-axis-neg">Negative</span>
      <span class="viz-axis-mid">Honeycomb · early ↑ late ↓</span>
      <span class="viz-axis-pos">Positive</span>
    `;
    stage.appendChild(axis);

    for (const cell of packed.cells) {
      const btn = makeButton(cell.m, "mitz-btn-hex");
      const d = cell.size * 2;
      btn.style.width = `${d}px`;
      btn.style.height = `${d * 1.15}px`;
      btn.style.left = `${cell.x - cell.size}px`;
      btn.style.top = `${cell.y - cell.size}px`;
      btn.innerHTML = `<span class="mitz-num">${cell.m.id}</span>`;
      wireBtn(btn, cell.m);
      stage.appendChild(btn);
    }

    canvas.replaceChildren(stage);
    applyActiveState(stage);
  }

  function visibleItems() {
    return items.filter((m) => activeIds.has(m.id));
  }

  function fillChipRow(parent, list) {
    for (const m of list) {
      const btn = makeButton(m, "mitz-btn-chip");
      const tags = [
        m.templeOnly ? `<span class="scope-tag">Temple</span>` : "",
        !m.templeOnly && m.landOnly ? `<span class="scope-tag">Land</span>` : "",
      ].join("");
      btn.innerHTML = `<span class="mitz-num">${m.id}</span><span class="mitz-chip-text">${escapeHtml(shortLabel(m.text, 26))}</span>${tags}`;
      wireBtn(btn, m);
      parent.appendChild(btn);
    }
  }

  function renderDecades() {
    const wrap = document.createElement("div");
    wrap.className = "viz-digest viz-decades";

    for (const chunk of decadeChunks(items)) {
      const matched = chunk.items.filter((m) => activeIds.has(m.id));
      if (!matched.length) continue;
      const open = openDecade === chunk.id;
      const card = document.createElement("section");
      card.className = `digest-card${open ? " is-open" : ""}`;

      const head = document.createElement("button");
      head.type = "button";
      head.className = "digest-card-head";
      head.innerHTML = `<strong>${chunk.label}</strong><span>${matched.length} mitzvot</span>`;
      head.addEventListener("click", () => {
        openDecade = open ? null : chunk.id;
        render();
      });
      card.appendChild(head);

      if (open) {
        const body = document.createElement("div");
        body.className = "digest-card-body digest-chip-row";
        fillChipRow(body, matched);
        card.appendChild(body);
      }
      wrap.appendChild(card);
    }

    if (!wrap.childElementCount) {
      wrap.innerHTML = `<p class="viz-empty-side">No mitzvot match these filters.</p>`;
    }
    canvas.replaceChildren(wrap);
    applyActiveState(wrap);
  }

  function renderThemes() {
    const wrap = document.createElement("div");
    wrap.className = "viz-digest viz-themes";
    const groups = groupByTheme(items);

    for (const g of groups) {
      const matched = g.items.filter((m) => activeIds.has(m.id));
      if (!matched.length) continue;
      const open = openTheme === g.id;
      const card = document.createElement("section");
      card.className = `digest-card theme-card${open ? " is-open" : ""}`;
      card.style.setProperty("--theme", g.color);

      const head = document.createElement("button");
      head.type = "button";
      head.className = "digest-card-head";
      head.innerHTML = `<strong>${escapeHtml(g.name)}</strong><span>${matched.length} · ${escapeHtml(g.blurb)}</span>`;
      head.addEventListener("click", () => {
        openTheme = open ? null : g.id;
        render();
      });
      card.appendChild(head);

      if (open) {
        const body = document.createElement("div");
        body.className = "digest-card-body digest-chip-row";
        fillChipRow(body, matched);
        card.appendChild(body);
      }
      wrap.appendChild(card);
    }

    if (!wrap.childElementCount) {
      wrap.innerHTML = `<p class="viz-empty-side">No mitzvot match these filters.</p>`;
    }
    canvas.replaceChildren(wrap);
    applyActiveState(wrap);
  }

  function renderPyramid() {
    const wrap = document.createElement("div");
    wrap.className = "viz-digest viz-pyramid";

    const crumbNav = document.createElement("div");
    crumbNav.className = "pyramid-crumb";
    const rootBtn = document.createElement("button");
    rootBtn.type = "button";
    rootBtn.className = "chip";
    rootBtn.textContent = "Pillars";
    rootBtn.addEventListener("click", () => {
      pyramidTheme = null;
      render();
    });
    crumbNav.appendChild(rootBtn);
    if (pyramidTheme) {
      const theme = THEMES.find((t) => t.id === pyramidTheme);
      const tBtn = document.createElement("button");
      tBtn.type = "button";
      tBtn.className = "chip is-active";
      tBtn.textContent = theme?.name || pyramidTheme;
      crumbNav.appendChild(tBtn);
    }
    wrap.appendChild(crumbNav);

    if (!pyramidTheme) {
      const apex = document.createElement("div");
      apex.className = "pyramid-tier pyramid-apex";
      apex.innerHTML = `<h3>Core pillars</h3><p>Start with ten central commandments, then open their theme family.</p>`;
      const row = document.createElement("div");
      row.className = "pyramid-row";
      for (const p of PILLARS) {
        const m = items.find((x) => x.id === p.id);
        if (!m || !activeIds.has(m.id)) continue;
        const btn = makeButton(m, "mitz-btn-pillar");
        btn.innerHTML = `<span class="mitz-num">${m.id}</span><span class="pillar-role">${escapeHtml(p.role)}</span><span class="mitz-chip-text">${escapeHtml(shortLabel(m.text, 40))}</span>`;
        wireBtn(btn, m);
        const go = document.createElement("button");
        go.type = "button";
        go.className = "chip pyramid-dive";
        go.textContent = "Theme →";
        go.addEventListener("click", (e) => {
          e.stopPropagation();
          pyramidTheme = m.themeId;
          render();
        });
        const cell = document.createElement("div");
        cell.className = "pyramid-pillar-cell";
        cell.append(btn, go);
        row.appendChild(cell);
      }
      apex.appendChild(row);

      const mid = document.createElement("div");
      mid.className = "pyramid-tier pyramid-mid";
      mid.innerHTML = `<h3>Theme bands</h3>`;
      const themesRow = document.createElement("div");
      themesRow.className = "pyramid-themes";
      for (const g of groupByTheme(items)) {
        const count = g.items.filter((m) => activeIds.has(m.id)).length;
        if (!count) continue;
        const b = document.createElement("button");
        b.type = "button";
        b.className = "theme-band";
        b.style.setProperty("--theme", g.color);
        b.innerHTML = `<strong>${escapeHtml(g.name)}</strong><span>${count}</span>`;
        b.addEventListener("click", () => {
          pyramidTheme = g.id;
          render();
        });
        themesRow.appendChild(b);
      }
      mid.appendChild(themesRow);
      wrap.append(apex, mid);
    } else {
      const theme = THEMES.find((t) => t.id === pyramidTheme);
      const matched = items
        .filter((m) => m.themeId === pyramidTheme && activeIds.has(m.id))
        .sort((a, b) => a.id - b.id);
      const base = document.createElement("div");
      base.className = "pyramid-tier pyramid-base";
      base.innerHTML = `<h3>${escapeHtml(theme?.name || "")}</h3><p>${escapeHtml(theme?.blurb || "")} · ${matched.length} mitzvot</p>`;
      const body = document.createElement("div");
      body.className = "digest-chip-row";
      fillChipRow(body, matched);
      base.appendChild(body);
      wrap.appendChild(base);
    }

    canvas.replaceChildren(wrap);
    applyActiveState(wrap);
  }

  function renderOrbit() {
    const wrap = document.createElement("div");
    wrap.className = "viz-digest viz-orbit";
    const width = Math.max(320, canvas.clientWidth || 900);
    const size = Math.min(720, width);
    const cx = size / 2;
    const cy = size / 2;

    const stage = document.createElement("div");
    stage.className = "orbit-stage";
    stage.style.width = `${size}px`;
    stage.style.height = `${size}px`;

    const core = document.createElement("div");
    core.className = "orbit-core";
    core.innerHTML = `<strong>613</strong><span>tenants</span>`;
    stage.appendChild(core);

    const hubs = THEMES.map((t, i) => {
      const count = items.filter((m) => m.themeId === t.id && activeIds.has(m.id)).length;
      return { ...t, count, angle: (i / THEMES.length) * Math.PI * 2 - Math.PI / 2 };
    }).filter((h) => h.count);

    const hubR = size * 0.28;
    for (const h of hubs) {
      const x = cx + Math.cos(h.angle) * hubR;
      const y = cy + Math.sin(h.angle) * hubR;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `orbit-hub${orbitHub === h.id ? " is-active" : ""}`;
      btn.style.left = `${x}px`;
      btn.style.top = `${y}px`;
      btn.style.setProperty("--theme", h.color);
      btn.innerHTML = `<strong>${escapeHtml(h.name)}</strong><span>${h.count}</span>`;
      btn.addEventListener("click", () => {
        orbitHub = h.id;
        render();
      });
      stage.appendChild(btn);
    }

    const related = items
      .filter((m) => m.themeId === orbitHub && activeIds.has(m.id))
      .sort((a, b) => a.id - b.id);
    const hub = hubs.find((h) => h.id === orbitHub) || hubs[0];
    if (hub && related.length) {
      const ringR = size * 0.42;
      related.slice(0, 48).forEach((m, i, arr) => {
        const a = hub.angle - 0.7 + (1.4 * i) / Math.max(arr.length - 1, 1);
        const x = cx + Math.cos(a) * ringR;
        const y = cy + Math.sin(a) * ringR;
        const btn = makeButton(m, "mitz-btn-orbit");
        btn.style.left = `${x}px`;
        btn.style.top = `${y}px`;
        btn.innerHTML = `<span class="mitz-num">${m.id}</span>`;
        wireBtn(btn, m);
        stage.appendChild(btn);
      });
    }

    const list = document.createElement("div");
    list.className = "orbit-list";
    const theme = THEMES.find((t) => t.id === orbitHub);
    list.innerHTML = `<h3>${escapeHtml(theme?.name || "Theme")}</h3><p>${escapeHtml(theme?.blurb || "")}</p>`;
    const chips = document.createElement("div");
    chips.className = "digest-chip-row";
    fillChipRow(chips, related);
    list.appendChild(chips);

    wrap.append(stage, list);
    canvas.replaceChildren(wrap);
    applyActiveState(wrap);
  }

  function renderSheet() {
    const wrap = document.createElement("div");
    wrap.className = "viz-digest viz-sheet";

    const controls = document.createElement("div");
    controls.className = "sheet-controls";

    const mkSelect = (id, value, labelText) => {
      const lab = document.createElement("label");
      lab.className = "select-field sheet-axis-field";
      lab.innerHTML = `<span>${labelText}</span>`;
      const sel = document.createElement("select");
      sel.id = id;
      for (const ax of SHEET_AXES) {
        const opt = document.createElement("option");
        opt.value = ax.id;
        opt.textContent = ax.label;
        if (ax.id === value) opt.selected = true;
        sel.appendChild(opt);
      }
      lab.appendChild(sel);
      return { lab, sel };
    };

    const rowCtrl = mkSelect("sheet-rows", sheetRows, "Rows");
    const colCtrl = mkSelect("sheet-cols", sheetCols, "Columns");

    rowCtrl.sel.addEventListener("change", (e) => {
      sheetRows = e.target.value;
      if (sheetRows === sheetCols) {
        sheetCols = SHEET_AXES.find((a) => a.id !== sheetRows)?.id || "book";
      }
      render();
    });
    colCtrl.sel.addEventListener("change", (e) => {
      sheetCols = e.target.value;
      if (sheetCols === sheetRows) {
        sheetRows = SHEET_AXES.find((a) => a.id !== sheetCols)?.id || "theme";
      }
      render();
    });

    const swap = document.createElement("button");
    swap.type = "button";
    swap.className = "chip";
    swap.textContent = "Swap axes";
    swap.addEventListener("click", () => {
      const tmp = sheetRows;
      sheetRows = sheetCols;
      sheetCols = tmp;
      render();
    });

    controls.append(rowCtrl.lab, swap, colCtrl.lab);
    wrap.appendChild(controls);

    const matched = items.filter((m) => activeIds.has(m.id)).sort((a, b) => a.id - b.id);
    const rowVals = uniqueAxisValues(matched, sheetRows, meta);
    const colVals = uniqueAxisValues(matched, sheetCols, meta);

    const metaLine = document.createElement("p");
    metaLine.className = "sheet-meta";
    metaLine.textContent = `${matched.length} mitzvot · ${rowVals.length} rows × ${colVals.length} columns`;
    wrap.appendChild(metaLine);

    const scroller = document.createElement("div");
    scroller.className = "sheet-scroll";

    const table = document.createElement("table");
    table.className = "sheet-table";

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    const corner = document.createElement("th");
    corner.className = "sheet-corner";
    corner.textContent = `${SHEET_AXES.find((a) => a.id === sheetRows)?.label || ""} \\ ${SHEET_AXES.find((a) => a.id === sheetCols)?.label || ""}`;
    headRow.appendChild(corner);
    for (const col of colVals) {
      const th = document.createElement("th");
      th.textContent = col.label;
      th.title = col.label;
      headRow.appendChild(th);
    }
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    const buckets = new Map();
    for (const m of matched) {
      const rk = axisInfo(m, sheetRows, meta).key;
      const ck = axisInfo(m, sheetCols, meta).key;
      const k = `${rk}||${ck}`;
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k).push(m);
    }

    for (const row of rowVals) {
      const tr = document.createElement("tr");
      const rh = document.createElement("th");
      rh.textContent = row.label;
      rh.title = row.label;
      tr.appendChild(rh);

      for (const col of colVals) {
        const td = document.createElement("td");
        const cellItems = buckets.get(`${row.key}||${col.key}`) || [];
        if (!cellItems.length) {
          td.className = "sheet-empty";
        } else {
          const cell = document.createElement("div");
          cell.className = "sheet-cell";
          for (const m of cellItems) {
            const btn = makeButton(m, "mitz-btn-sheet");
            btn.textContent = String(m.id);
            wireBtn(btn, m);
            cell.appendChild(btn);
          }
          td.appendChild(cell);
        }
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    scroller.appendChild(table);
    wrap.appendChild(scroller);

    // Flat strip: every mitzvah once, ordered by row then col then id — full 613 scan line
    const stripWrap = document.createElement("div");
    stripWrap.className = "sheet-strip-wrap";
    stripWrap.innerHTML = `<h3>All cells in order</h3><p>Row → column → biblical number. Every visible mitzvah as a micro-card.</p>`;
    const strip = document.createElement("div");
    strip.className = "sheet-strip";
    const ordered = matched.slice().sort((a, b) => {
      const ra = axisInfo(a, sheetRows, meta).order;
      const rb = axisInfo(b, sheetRows, meta).order;
      if (ra !== rb) return ra - rb;
      const ca = axisInfo(a, sheetCols, meta).order;
      const cb = axisInfo(b, sheetCols, meta).order;
      if (ca !== cb) return ca - cb;
      return a.id - b.id;
    });
    for (const m of ordered) {
      const btn = makeButton(m, "mitz-btn-sheet mitz-btn-sheet-flat");
      btn.textContent = String(m.id);
      wireBtn(btn, m);
      strip.appendChild(btn);
    }
    stripWrap.appendChild(strip);
    wrap.appendChild(stripWrap);

    canvas.replaceChildren(wrap);
    applyActiveState(wrap);
  }

  function renderTwin() {
    const wrap = document.createElement("div");
    wrap.className = "viz-digest viz-twin viz-dendro";

    const visible = items
      .filter((m) => activeIds.has(m.id))
      .sort((a, b) => a.id - b.id);
    const cacheKey = visible.map((m) => m.id).join(",");

    const intro = document.createElement("div");
    intro.className = "twin-intro";
    intro.innerHTML = `
      <h3>Clustering dendrogram</h3>
      <p>
        Hierarchical (average-linkage) clustering, constrained to the classic
        twin roots: <strong>Keep Shabbat</strong> gathers every positive
        commandment; <strong>No idolatry</strong> gathers every negative.
        Branch height encodes dissimilarity—nearby leaves are similar by theme,
        book, scope, and biblical proximity.
      </p>
    `;
    wrap.appendChild(intro);

    const legend = document.createElement("div");
    legend.className = "dendro-legend";
    legend.innerHTML = `
      <span class="dendro-leg dendro-leg-pos">Shabbat trunk · positives</span>
      <span class="dendro-leg dendro-leg-neg">Idolatry trunk · negatives</span>
      <span class="dendro-leg-note">Hover a tip · click to open</span>
    `;
    wrap.appendChild(legend);

    const host = document.createElement("div");
    host.className = "dendro-host";
    wrap.appendChild(host);
    canvas.replaceChildren(wrap);

    const paint = (layout) => {
      const ns = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(ns, "svg");
      svg.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);
      svg.setAttribute("width", String(layout.width));
      svg.setAttribute("height", String(layout.height));
      svg.classList.add("dendro-svg");
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", "Mitzvot clustering dendrogram");

      // Axis: similarity
      const axis = document.createElementNS(ns, "g");
      axis.setAttribute("class", "dendro-axis");
      const axY = layout.margin.top - 14;
      const x0 = layout.margin.left;
      const x1 = layout.margin.left + layout.xSpan;
      const axisLine = document.createElementNS(ns, "line");
      axisLine.setAttribute("x1", x0);
      axisLine.setAttribute("x2", x1);
      axisLine.setAttribute("y1", axY);
      axisLine.setAttribute("y2", axY);
      axis.appendChild(axisLine);
      const labL = document.createElementNS(ns, "text");
      labL.setAttribute("x", x0);
      labL.setAttribute("y", axY - 4);
      labL.textContent = "more similar";
      axis.appendChild(labL);
      const labR = document.createElementNS(ns, "text");
      labR.setAttribute("x", x1);
      labR.setAttribute("y", axY - 4);
      labR.setAttribute("text-anchor", "end");
      labR.textContent = "tips (mitzvot)";
      axis.appendChild(labR);
      svg.appendChild(axis);

      const edgeG = document.createElementNS(ns, "g");
      edgeG.setAttribute("class", "dendro-edges");
      for (const e of layout.edges) {
        const line = document.createElementNS(ns, "line");
        line.setAttribute("x1", e.x1);
        line.setAttribute("y1", e.y1);
        line.setAttribute("x2", e.x2);
        line.setAttribute("y2", e.y2);
        line.setAttribute(
          "class",
          `dendro-edge dendro-edge-${e.trunk === "idolatry" ? "neg" : e.trunk === "shabbat" ? "pos" : "root"}`
        );
        if (e.merge) line.setAttribute("data-height", e.height.toFixed(3));
        edgeG.appendChild(line);
      }
      svg.appendChild(edgeG);

      // Trunk labels near first major split
      const rootPos = layout.positions.get("ROOT");
      if (rootPos) {
        const g = document.createElementNS(ns, "g");
        g.setAttribute("class", "dendro-trunk-labels");
        const mk = (text, y, cls) => {
          const t = document.createElementNS(ns, "text");
          t.setAttribute("x", layout.margin.left - 8);
          t.setAttribute("y", y);
          t.setAttribute("text-anchor", "end");
          t.setAttribute("class", cls);
          t.textContent = text;
          g.appendChild(t);
        };
        // Approximate mid of each trunk by average leaf y
        const posYs = layout.leaves.filter((l) => l.mitzvah.type === "positive").map((l) => l.y);
        const negYs = layout.leaves.filter((l) => l.mitzvah.type === "negative").map((l) => l.y);
        if (posYs.length) mk("Keep Shabbat (+)", posYs.reduce((a, b) => a + b, 0) / posYs.length, "dendro-lab-pos");
        if (negYs.length) mk("No idolatry (−)", negYs.reduce((a, b) => a + b, 0) / negYs.length, "dendro-lab-neg");
        svg.appendChild(g);
      }

      const tipG = document.createElementNS(ns, "g");
      tipG.setAttribute("class", "dendro-tips");
      for (const leaf of layout.leaves) {
        const m = leaf.mitzvah;
        const g = document.createElementNS(ns, "g");
        g.setAttribute("class", `dendro-tip dendro-tip-${m.type}`);
        g.style.cursor = "pointer";
        g.dataset.id = String(m.id);

        const tick = document.createElementNS(ns, "line");
        tick.setAttribute("x1", leaf.x);
        tick.setAttribute("x2", leaf.x + 6);
        tick.setAttribute("y1", leaf.y);
        tick.setAttribute("y2", leaf.y);
        g.appendChild(tick);

        const dot = document.createElementNS(ns, "circle");
        dot.setAttribute("cx", leaf.x + 10);
        dot.setAttribute("cy", leaf.y);
        dot.setAttribute("r", selectedId === m.id ? 4.2 : 2.6);
        g.appendChild(dot);

        const label = document.createElementNS(ns, "text");
        label.setAttribute("x", leaf.x + 16);
        label.setAttribute("y", leaf.y + 3);
        label.textContent = String(m.id);
        g.appendChild(label);

        g.addEventListener("pointerenter", (e) => showTip(m, e));
        g.addEventListener("pointermove", (e) => showTip(m, e));
        g.addEventListener("pointerleave", hideTip);
        g.addEventListener("click", () => onSelectMitzvah?.(m.id));
        tipG.appendChild(g);
      }
      svg.appendChild(tipG);

      host.replaceChildren(svg);
      setCrumb(`${visible.length} tips · dendrogram`);
    };

    if (dendroLayout && dendroCacheKey === cacheKey) {
      paint(dendroLayout);
      return;
    }

    host.innerHTML = `<div class="dendro-loading">Computing hierarchical clustering…</div>`;
    dendroPending = true;
    const run = () => {
      const tree = buildTwinDendrogram(visible, TWIN_ROOTS);
      if (!tree) {
        host.innerHTML = `<p class="viz-empty-side">No mitzvot match these filters.</p>`;
        dendroPending = false;
        return;
      }
      dendroLayout = layoutDendrogram(tree, {
        leafGap: visible.length > 400 ? 6 : 8,
        xSpan: Math.min(720, Math.max(420, host.clientWidth - 200 || 560)),
      });
      dendroCacheKey = cacheKey;
      dendroPending = false;
      paint(dendroLayout);
    };

    // Yield so the loading message paints before heavy work
    requestAnimationFrame(() => setTimeout(run, 30));
  }

  function render() {
    const info = MODES.find((m) => m.id === mode);
    if (blurbEl && info) blurbEl.textContent = info.blurb;
    hideTip();

    if (mode === "foam") renderFoam();
    else if (mode === "shelves") renderShelves();
    else if (mode === "mosaic") renderMosaic();
    else if (mode === "comb") renderComb();
    else if (mode === "decades") renderDecades();
    else if (mode === "themes") renderThemes();
    else if (mode === "pyramid") renderPyramid();
    else if (mode === "orbit") renderOrbit();
    else if (mode === "sheet") renderSheet();
    else if (mode === "twin") renderTwin();
    else renderDecades();
  }

  let resizeTimer = null;
  const ro = new ResizeObserver(() => {
    if (mode !== "foam" && mode !== "comb" && mode !== "orbit") return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(render, 120);
  });
  ro.observe(canvas);

  render();

  return {
    setFilter(ids) {
      activeIds = new Set(ids);
      render();
    },
    setSelected(id) {
      selectedId = id;
      canvas.querySelectorAll(".mitz-btn").forEach((btn) => {
        btn.classList.toggle("is-selected", Number(btn.dataset.id) === id);
      });
      if (id != null) {
        canvas.querySelector(`.mitz-btn[data-id="${id}"]`)?.focus({ preventScroll: false });
      }
    },
    setMode(next) {
      mode = next;
      modeBar.querySelectorAll(".chip").forEach((c) => {
        c.classList.toggle("is-active", c.dataset.mode === mode);
      });
      render();
    },
    resetView() {
      selectedId = null;
      openDecade = "d-1";
      openTheme = null;
      pyramidTheme = null;
      dendroCacheKey = "";
      dendroLayout = null;
      render();
    },
    rerender: render,
  };
}

export { MODES };
