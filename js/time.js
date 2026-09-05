import {
  RHYTHMS,
  enrichWithRhythm,
  groupByRhythm,
} from "./time-taxonomy.js";
import { createTimeWheel } from "./time-wheel.js";

const state = {
  mitzvot: [],
  filtered: [],
  query: "",
  type: "all",
  rhythm: "all",
  wheelIds: null,
  wheelLabel: "",
  selectedId: null,
  collapsed: new Set(),
};

const els = {
  rhythmLine: document.getElementById("rhythm-line"),
  sections: document.getElementById("rhythm-sections"),
  search: document.getElementById("search"),
  resultCount: document.getElementById("result-count"),
  clear: document.getElementById("clear-filter"),
  wheel: document.getElementById("time-wheel"),
  wheelSelection: document.getElementById("wheel-selection"),
  wheelReset: document.getElementById("wheel-reset"),
  drawer: document.getElementById("detail-drawer"),
  drawerRhythm: document.getElementById("drawer-rhythm"),
  drawerNumber: document.getElementById("drawer-number"),
  drawerTitle: document.getElementById("drawer-title"),
  drawerFull: document.getElementById("drawer-full"),
  drawerType: document.getElementById("drawer-type"),
  drawerOrder: document.getElementById("drawer-order"),
  drawerBook: document.getElementById("drawer-book"),
  drawerParsha: document.getElementById("drawer-parsha"),
  previous: document.getElementById("previous-mitzvah"),
  next: document.getElementById("next-mitzvah"),
};

function normalize(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function rhythmFor(id) {
  return RHYTHMS.find((rhythm) => rhythm.id === id);
}

function rhythmCounts() {
  return Object.fromEntries(
    RHYTHMS.map((rhythm) => [
      rhythm.id,
      state.mitzvot.filter((mitzvah) => mitzvah.rhythmId === rhythm.id).length,
    ])
  );
}

function renderOverview() {
  const counts = rhythmCounts();
  const fragment = document.createDocumentFragment();

  RHYTHMS.forEach((rhythm, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "rhythm-node";
    button.dataset.rhythm = rhythm.id;
    button.style.setProperty("--rhythm", rhythm.color);
    button.setAttribute("role", "listitem");
    button.setAttribute(
      "aria-label",
      `${rhythm.name}, ${counts[rhythm.id]} mitzvot`
    );
    button.classList.toggle("is-active", state.rhythm === rhythm.id);
    button.innerHTML = `
      <span class="node-index">0${index + 1}</span>
      <strong>${escapeHtml(rhythm.short)}</strong>
      <small>${escapeHtml(rhythm.description)}</small>
      <span class="node-count">${counts[rhythm.id]} mitzvot</span>
    `;

    button.addEventListener("click", () => {
      state.rhythm = state.rhythm === rhythm.id ? "all" : rhythm.id;
      state.wheelIds = null;
      state.wheelLabel = "";
      updateWheelSelection();
      applyFilters();
      render();
      document.getElementById("all-mitzvot").scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    fragment.appendChild(button);
  });

  els.rhythmLine.replaceChildren(fragment);
}

function applyFilters() {
  const query = normalize(state.query.trim());

  state.filtered = state.mitzvot.filter((mitzvah) => {
    if (state.type !== "all" && mitzvah.type !== state.type) return false;
    if (state.rhythm !== "all" && mitzvah.rhythmId !== state.rhythm) return false;
    if (state.wheelIds && !state.wheelIds.has(mitzvah.id)) return false;
    if (!query) return true;

    const haystack = normalize(
      [
        mitzvah.id,
        mitzvah.shortName,
        mitzvah.text,
        mitzvah.book,
        mitzvah.bookEn,
        mitzvah.parsha,
        mitzvah.rhythmGroup,
      ].join(" ")
    );
    return haystack.includes(query);
  });
}

function makeCard(mitzvah) {
  const card = document.createElement("button");
  const sign = mitzvah.type === "positive" ? "+" : "−";
  const signWord = mitzvah.type === "positive" ? "Do" : "Refrain";

  card.type = "button";
  card.className = `mitz-card is-${mitzvah.type}`;
  card.dataset.id = String(mitzvah.id);
  card.title = `${signWord}: ${mitzvah.text}`;
  card.setAttribute(
    "aria-label",
    `Mitzvah ${mitzvah.id}, ${mitzvah.shortName}. ${mitzvah.text}`
  );
  card.innerHTML = `
    <span class="card-sign" aria-hidden="true">${sign}</span>
    <span class="card-number">#${mitzvah.id}</span>
    <strong>${escapeHtml(mitzvah.shortName)}</strong>
    <span class="card-source">${escapeHtml(mitzvah.book)} · ${escapeHtml(mitzvah.parsha)}</span>
  `;
  card.addEventListener("click", () => openDrawer(mitzvah.id));
  return card;
}

function renderSections() {
  const rhythms = groupByRhythm(state.filtered);
  const fragment = document.createDocumentFragment();

  for (const rhythm of rhythms) {
    const count = rhythm.groups.reduce((sum, group) => sum + group.items.length, 0);
    if (!count) continue;

    const section = document.createElement("section");
    section.className = "rhythm-section";
    section.id = `rhythm-${rhythm.id}`;
    section.style.setProperty("--rhythm", rhythm.color);
    section.classList.toggle("is-collapsed", state.collapsed.has(rhythm.id));

    const heading = document.createElement("button");
    heading.type = "button";
    heading.className = "rhythm-section-head";
    heading.setAttribute(
      "aria-expanded",
      String(!state.collapsed.has(rhythm.id))
    );
    heading.innerHTML = `
      <h3>${escapeHtml(rhythm.name)}</h3>
      <p>${escapeHtml(rhythm.description)}</p>
      <span class="section-total">${count} shown</span>
    `;
    heading.addEventListener("click", () => {
      if (state.collapsed.has(rhythm.id)) state.collapsed.delete(rhythm.id);
      else state.collapsed.add(rhythm.id);
      section.classList.toggle("is-collapsed");
      heading.setAttribute(
        "aria-expanded",
        String(!section.classList.contains("is-collapsed"))
      );
    });

    const body = document.createElement("div");
    body.className = "rhythm-section-body";

    for (const group of rhythm.groups) {
      const groupEl = document.createElement("section");
      groupEl.className = "activity-group";

      const groupHeading = document.createElement("h4");
      groupHeading.className = "activity-heading";
      groupHeading.innerHTML = `${escapeHtml(group.name)}<span>${group.items.length}</span>`;

      const grid = document.createElement("div");
      grid.className = "card-grid";
      for (const mitzvah of group.items) grid.appendChild(makeCard(mitzvah));

      groupEl.append(groupHeading, grid);
      body.appendChild(groupEl);
    }

    section.append(heading, body);
    fragment.appendChild(section);
  }

  if (!fragment.childNodes.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No mitzvot match these filters.";
    fragment.appendChild(empty);
  }

  els.sections.replaceChildren(fragment);
}

function renderCount() {
  const hasFilters =
    state.query.trim() ||
    state.type !== "all" ||
    state.rhythm !== "all" ||
    state.wheelIds;
  els.resultCount.textContent = hasFilters
    ? `${state.filtered.length} of 613 shown`
    : "All 613 shown";
}

function updateWheelSelection() {
  if (!state.wheelIds) {
    els.wheelSelection.textContent =
      "Select any arc or activity band to see its mitzvot.";
    return;
  }
  els.wheelSelection.textContent = `${state.wheelLabel} · ${state.wheelIds.size} mitzvot selected`;
}

function selectWheelItems(ids, label) {
  state.wheelIds = new Set(ids);
  state.wheelLabel = label;
  state.rhythm = "all";
  applyFilters();
  updateWheelSelection();
  render();
  document.getElementById("all-mitzvot").scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function render() {
  renderOverview();
  renderSections();
  renderCount();
}

function openDrawer(id) {
  const mitzvah = state.mitzvot.find((item) => item.id === id);
  if (!mitzvah) return;

  const rhythm = rhythmFor(mitzvah.rhythmId);
  state.selectedId = id;
  els.drawerRhythm.textContent = `${rhythm.name} · ${mitzvah.rhythmGroup}`;
  els.drawerNumber.textContent = `Mitzvah ${mitzvah.id} of 613`;
  els.drawerTitle.textContent = mitzvah.shortName;
  els.drawerFull.textContent = mitzvah.text;
  els.drawerType.textContent =
    mitzvah.type === "positive" ? "+ Do (aseh)" : "− Refrain (lo ta’aseh)";
  els.drawerOrder.textContent = `#${mitzvah.id}`;
  els.drawerBook.textContent = `${mitzvah.book} · ${mitzvah.bookEn}`;
  els.drawerParsha.textContent = mitzvah.parsha;
  els.previous.disabled = id <= 1;
  els.next.disabled = id >= 613;
  els.drawer.hidden = false;
  document.body.classList.add("is-locked");
  els.drawer.querySelector(".drawer-close").focus();
}

function closeDrawer() {
  if (els.drawer.hidden) return;
  const card = document.querySelector(`.mitz-card[data-id="${state.selectedId}"]`);
  els.drawer.hidden = true;
  document.body.classList.remove("is-locked");
  state.selectedId = null;
  card?.focus();
}

function clearFilters() {
  state.query = "";
  state.type = "all";
  state.rhythm = "all";
  state.wheelIds = null;
  state.wheelLabel = "";
  els.search.value = "";
  document.querySelectorAll(".filter[data-type]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.type === "all");
  });
  updateWheelSelection();
  applyFilters();
  render();
}

function wireEvents() {
  els.search.addEventListener("input", (event) => {
    state.query = event.target.value;
    applyFilters();
    render();
  });

  document.querySelectorAll(".filter[data-type]").forEach((button) => {
    button.addEventListener("click", () => {
      state.type = button.dataset.type;
      document.querySelectorAll(".filter[data-type]").forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });
      applyFilters();
      render();
    });
  });

  els.clear.addEventListener("click", clearFilters);
  els.wheelReset.addEventListener("click", clearFilters);
  els.drawer.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", closeDrawer);
  });

  els.previous.addEventListener("click", () => {
    if (state.selectedId > 1) openDrawer(state.selectedId - 1);
  });
  els.next.addEventListener("click", () => {
    if (state.selectedId < 613) openDrawer(state.selectedId + 1);
  });

  document.addEventListener("keydown", (event) => {
    if (els.drawer.hidden) return;
    if (event.key === "Escape") closeDrawer();
    if (event.key === "ArrowLeft") els.previous.click();
    if (event.key === "ArrowRight") els.next.click();
  });
}

async function init() {
  const response = await fetch("data/mitzvot.json");
  if (!response.ok) throw new Error(`Could not load mitzvot: ${response.status}`);
  const data = await response.json();

  state.mitzvot = enrichWithRhythm(data.mitzvot);
  if (state.mitzvot.length !== 613) {
    throw new Error(`Expected 613 mitzvot, received ${state.mitzvot.length}`);
  }

  createTimeWheel(els.wheel, state.mitzvot, selectWheelItems, openDrawer);
  applyFilters();
  wireEvents();
  render();
}

init().catch((error) => {
  console.error(error);
  els.sections.innerHTML =
    '<p class="empty-state">The mitzvot data could not be loaded.</p>';
});
