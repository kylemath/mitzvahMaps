import { createViz } from "./views.js";
import { enrichMitzvot } from "./taxonomy.js";

const state = {
  mitzvot: [],
  meta: null,
  filtered: [],
  type: "all",
  book: "all",
  groupBy: "order",
  query: "",
  selectedId: null,
  parshaFocus: null,
  showLand: true,
  showTemple: true,
};

let viz = null;

const els = {
  bookMap: document.getElementById("book-map"),
  constellation: document.getElementById("constellation"),
  search: document.getElementById("search"),
  groupBy: document.getElementById("group-by"),
  bookFilter: document.getElementById("book-filter"),
  resultMeta: document.getElementById("result-meta"),
  results: document.getElementById("results"),
  drawer: document.getElementById("drawer"),
  drawerKicker: document.getElementById("drawer-kicker"),
  drawerTitle: document.getElementById("drawer-title"),
  drawerText: document.getElementById("drawer-text"),
  drawerId: document.getElementById("drawer-id"),
  drawerType: document.getElementById("drawer-type"),
  drawerBook: document.getElementById("drawer-book"),
  drawerParsha: document.getElementById("drawer-parsha"),
  prev: document.getElementById("prev-mitzvah"),
  next: document.getElementById("next-mitzvah"),
  vizStage: document.getElementById("viz-stage"),
  filterReset: document.getElementById("filter-reset"),
  showLand: document.getElementById("show-land"),
  showTemple: document.getElementById("show-temple"),
};

function normalize(s) {
  return s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

function bookCounts() {
  const counts = Object.fromEntries(state.meta.books.map((b) => [b, 0]));
  for (const m of state.mitzvot) counts[m.book] += 1;
  return counts;
}

function renderBookMap() {
  const counts = bookCounts();
  const max = Math.max(...Object.values(counts));
  els.bookMap.innerHTML = "";

  state.meta.books.forEach((book, i) => {
    const count = counts[book];
    const row = document.createElement("button");
    row.type = "button";
    row.className = "book-row";
    row.style.animationDelay = `${i * 80}ms`;
    row.setAttribute("role", "listitem");
    row.dataset.book = book;
    if (state.book === book) row.classList.add("is-active");

    row.innerHTML = `
      <div>
        <span class="book-name">${book}</span>
        <span class="book-en">${state.meta.bookEn[book]}</span>
      </div>
      <div class="bar-track" aria-hidden="true">
        <div class="bar-fill" style="width:${(count / max) * 100}%"></div>
      </div>
      <span class="book-count">${count}</span>
    `;

    row.addEventListener("click", () => {
      state.parshaFocus = null;
      state.book = book === state.book ? "all" : book;
      els.bookFilter.value = state.book;
      update();
      document.getElementById("explore").scrollIntoView({ behavior: "smooth" });
    });

    els.bookMap.appendChild(row);
  });
}

function renderConstellation() {
  const frag = document.createDocumentFragment();
  const activeIds = new Set(state.filtered.map((m) => m.id));

  for (const m of state.mitzvot) {
    const dot = document.createElement("span");
    dot.className = `dot is-${m.type}`;
    if (!activeIds.has(m.id)) dot.classList.add("is-dim");
    if (state.selectedId === m.id) dot.classList.add("is-hot");
    dot.title = `#${m.id}`;
    frag.appendChild(dot);
  }

  els.constellation.replaceChildren(frag);
}

function fillBookFilter() {
  for (const book of state.meta.books) {
    const opt = document.createElement("option");
    opt.value = book;
    opt.textContent = `${book} (${state.meta.bookEn[book]})`;
    els.bookFilter.appendChild(opt);
  }
}

function applyFilters() {
  const q = normalize(state.query.trim());

  state.filtered = state.mitzvot.filter((m) => {
    if (state.type !== "all" && m.type !== state.type) return false;
    if (state.book !== "all" && m.book !== state.book) return false;
    if (state.parshaFocus && m.parsha !== state.parshaFocus) return false;
    if (!state.showTemple && m.templeOnly) return false;
    if (!state.showLand && m.landOnly) return false;
    if (!q) return true;
    const hay = normalize(`${m.id} ${m.text} ${m.parsha} ${m.book} ${m.bookEn}`);
    return hay.includes(q);
  });
}

function groupItems(items) {
  if (state.groupBy === "order") {
    return [{ key: "order", title: "Biblical order", items }];
  }

  if (state.groupBy === "type") {
    const pos = items.filter((m) => m.type === "positive");
    const neg = items.filter((m) => m.type === "negative");
    return [
      { key: "positive", title: "Positive commandments", items: pos },
      { key: "negative", title: "Negative commandments", items: neg },
    ].filter((g) => g.items.length);
  }

  if (state.groupBy === "book") {
    return state.meta.books
      .map((book) => ({
        key: book,
        title: `${book} · ${state.meta.bookEn[book]}`,
        items: items.filter((m) => m.book === book),
      }))
      .filter((g) => g.items.length);
  }

  const groups = [];
  const index = new Map();
  for (const m of items) {
    if (!index.has(m.parsha)) {
      index.set(m.parsha, groups.length);
      groups.push({
        key: m.parsha,
        title: `${m.parsha}`,
        subtitle: `${m.book} · ${m.bookEn}`,
        items: [],
      });
    }
    groups[index.get(m.parsha)].items.push(m);
  }
  return groups;
}

function mitzvahButton(m) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "mitzvah";
  btn.dataset.id = String(m.id);
  btn.innerHTML = `
    <span class="mitzvah-num">${m.id}</span>
    <p class="mitzvah-text">${escapeHtml(m.text)}</p>
    <span class="mitzvah-side">
      <span class="badge badge-${m.type}">${m.type}</span>
      ${m.templeOnly ? `<span class="badge badge-temple">Temple</span>` : m.landOnly ? `<span class="badge badge-land">Land</span>` : ""}
      <span class="mitzvah-parsha">${escapeHtml(m.parsha)}</span>
    </span>
  `;
  btn.addEventListener("click", () => openDrawer(m.id));
  return btn;
}

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderResults() {
  const groups = groupItems(state.filtered);
  const focusNote = state.parshaFocus ? ` · focused on ${state.parshaFocus}` : "";
  els.resultMeta.textContent =
    state.filtered.length === state.mitzvot.length
      ? `Showing all ${state.mitzvot.length} mitzvot`
      : `Showing ${state.filtered.length} of ${state.mitzvot.length} mitzvot${focusNote}`;

  if (!state.filtered.length) {
    els.results.innerHTML = `<div class="empty">No mitzvot match these filters.</div>`;
    return;
  }

  const frag = document.createDocumentFragment();
  for (const group of groups) {
    const section = document.createElement("section");
    section.className = "group";
    section.id = `group-${group.key}`;

    const heading = document.createElement("div");
    heading.className = "group-heading";
    heading.innerHTML = `
      <h3>${escapeHtml(group.title)}${group.subtitle ? `<span class="group-sub">${escapeHtml(group.subtitle)}</span>` : ""}</h3>
      <span>${group.items.length}</span>
    `;
    section.appendChild(heading);

    const list = document.createElement("div");
    list.className = "mitzvah-list";
    for (const m of group.items) list.appendChild(mitzvahButton(m));
    section.appendChild(list);
    frag.appendChild(section);
  }

  els.results.replaceChildren(frag);
}

function syncViz() {
  if (!viz) return;
  viz.setFilter(state.filtered.map((m) => m.id));
  viz.setSelected(state.selectedId);
}

function openDrawer(id) {
  const m = state.mitzvot.find((x) => x.id === id);
  if (!m) return;
  state.selectedId = id;

  els.drawerKicker.textContent = `Mitzvah ${m.id}`;
  els.drawerTitle.textContent = m.text;
  els.drawerText.textContent = [
    `Appears in ${m.parsha} (${m.book} / ${m.bookEn}), in biblical sequence.`,
    m.templeOnly
      ? "Applicability: Temple-era (Land of Israel)."
      : m.landOnly
        ? "Applicability: Land of Israel."
        : "Applicability: generally practiced outside the Land as well (heuristic).",
  ].join(" ");
  els.drawerId.textContent = `#${m.id}`;
  els.drawerType.textContent = m.type === "positive" ? "Positive (aseh)" : "Negative (lo ta'aseh)";
  els.drawerBook.textContent = `${m.book} · ${m.bookEn}`;
  els.drawerParsha.textContent = m.parsha;

  els.prev.disabled = id <= 1;
  els.next.disabled = id >= state.mitzvot.length;

  els.drawer.hidden = false;
  document.body.style.overflow = "hidden";
  renderConstellation();
  viz?.setSelected(id);
}

function closeDrawer() {
  state.selectedId = null;
  els.drawer.hidden = true;
  document.body.style.overflow = "";
  renderConstellation();
  viz?.setSelected(null);
}

function clearFilters() {
  state.parshaFocus = null;
  state.book = "all";
  state.type = "all";
  state.query = "";
  state.showLand = true;
  state.showTemple = true;
  els.bookFilter.value = "all";
  els.search.value = "";
  if (els.showLand) els.showLand.checked = true;
  if (els.showTemple) els.showTemple.checked = true;
  document.querySelectorAll(".chip[data-type]").forEach((c) => {
    c.classList.toggle("is-active", c.dataset.type === "all");
  });
  viz?.resetView();
  update();
}

function update() {
  applyFilters();
  renderBookMap();
  renderConstellation();
  renderResults();
  syncViz();
}

function wireEvents() {
  els.search.addEventListener("input", (e) => {
    state.query = e.target.value;
    state.parshaFocus = null;
    update();
  });

  els.groupBy.addEventListener("change", (e) => {
    state.groupBy = e.target.value;
    update();
  });

  els.bookFilter.addEventListener("change", (e) => {
    state.book = e.target.value;
    state.parshaFocus = null;
    update();
  });

  document.querySelectorAll(".chip[data-type]").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip[data-type]").forEach((c) => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      state.type = chip.dataset.type;
      update();
    });
  });

  els.filterReset?.addEventListener("click", clearFilters);

  els.showLand?.addEventListener("change", (e) => {
    state.showLand = e.target.checked;
    // Temple ⊂ Land: hiding land also hides temple
    if (!state.showLand) {
      state.showTemple = false;
      if (els.showTemple) els.showTemple.checked = false;
    }
    update();
  });

  els.showTemple?.addEventListener("change", (e) => {
    state.showTemple = e.target.checked;
    // Showing temple requires showing land
    if (state.showTemple && !state.showLand) {
      state.showLand = true;
      if (els.showLand) els.showLand.checked = true;
    }
    update();
  });

  els.drawer.querySelectorAll("[data-close]").forEach((el) => {
    el.addEventListener("click", closeDrawer);
  });

  els.prev.addEventListener("click", () => {
    if (state.selectedId > 1) openDrawer(state.selectedId - 1);
  });

  els.next.addEventListener("click", () => {
    if (state.selectedId < state.mitzvot.length) openDrawer(state.selectedId + 1);
  });

  document.addEventListener("keydown", (e) => {
    if (els.drawer.hidden) return;
    if (e.key === "Escape") closeDrawer();
    if (e.key === "ArrowLeft") els.prev.click();
    if (e.key === "ArrowRight") els.next.click();
  });
}

function initViz() {
  viz = createViz(els.vizStage, {
    mitzvot: state.mitzvot,
    meta: state.meta,
    onSelectMitzvah: (id) => openDrawer(id),
    onSelectBook: (book) => {
      state.parshaFocus = null;
      state.book = state.book === book ? "all" : book;
      els.bookFilter.value = state.book;
      update();
    },
  });
  syncViz();
}

async function init() {
  const res = await fetch("data/mitzvot.json");
  const data = await res.json();
  state.mitzvot = enrichMitzvot(data.mitzvot);
  state.meta = data.meta;
  fillBookFilter();
  wireEvents();
  update();
  initViz();
}

init().catch((err) => {
  console.error(err);
  els.results.innerHTML = `<div class="empty">Could not load mitzvot data.</div>`;
});
