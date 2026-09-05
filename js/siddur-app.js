import {
  GROUPS,
  MODULES,
  QUESTIONS,
  PRACTICE_OPTIONS,
  afterAnswer,
  applyPreset,
  compile,
  coverNotes,
  defaultModules,
  emptyFacts,
  movementLabel,
  nusachLabel,
  optionsFor,
  serviceTitle,
  visibleQuestions,
} from "./siddur-liturgy.js";
import { englishOnly, hebrewOnly, loadSiddur } from "./siddur-sefaria.js";
import {
  deleteSiddur,
  downloadJson,
  fromFilePayload,
  getSiddur,
  listSiddurim,
  loadSettings,
  newId,
  saveSiddur,
  saveSettings,
} from "./siddur-store.js";

const HE_FONTS = {
  frank: '"Frank Ruhl Libre", "Times New Roman", serif',
  noto: '"Noto Serif Hebrew", "Times New Roman", serif',
};

const EN_FONTS = {
  manrope: '"Manrope", system-ui, sans-serif',
  fraunces: '"Fraunces", Georgia, serif',
  georgia: "Georgia, 'Times New Roman', serif",
};

const state = {
  facts: emptyFacts(),
  step: 0,
  built: null,
  view: "wizard",
  settings: loadSettings(),
  currentSec: "siddur-cover",
};

let spy = null;
let spyIgnoreUntil = 0;

const els = {};

function $(sel) {
  return document.querySelector(sel);
}

function questions() {
  return visibleQuestions(state.facts);
}

function currentQuestion() {
  return questions()[state.step] || null;
}

function setFacts(next) {
  state.facts = next;
  if (!Object.keys(state.facts.modules || {}).length) {
    state.facts.modules = defaultModules(state.facts);
  }
  render();
}

function go(delta) {
  const list = questions();
  state.step = Math.max(0, Math.min(list.length - 1, state.step + delta));
  render();
}

function choose(question, value) {
  if (question.id === "start" && value === "library") {
    openLibrary();
    return;
  }
  const next = afterAnswer(state.facts, question.id, value);
  const list = visibleQuestions(next);
  state.facts = next;
  if (question.id === "start" && (value === "sefardi_kollel" || value === "reform_shabbat")) {
    const modulesAt = list.findIndex((q) => q.id === "modules");
    state.step = modulesAt >= 0 ? modulesAt : list.length - 1;
    render();
    return;
  }
  const idx = list.findIndex((q) => q.id === question.id);
  if (question.type === "choice" && idx >= 0 && idx < list.length - 1) {
    state.step = idx + 1;
  }
  render();
}

function outlineItems() {
  return compile(state.facts);
}

function render() {
  if (state.view === "siddur") {
    els.wizard.hidden = true;
    els.siddur.hidden = false;
    return;
  }
  els.wizard.hidden = false;
  els.siddur.hidden = true;
  renderProgress();
  renderQuestion();
  renderOutline();
}

function renderProgress() {
  const list = questions();
  const q = currentQuestion();
  els.progress.innerHTML = list
    .map((item, i) => {
      const done = i < state.step;
      const current = i === state.step;
      return `<button type="button" class="step-dot${current ? " is-current" : ""}${done ? " is-done" : ""}" data-step="${i}"${current ? ' aria-current="step"' : ""}>${item.title}</button>`;
    })
    .join("");
  els.kicker.textContent = q ? `Step ${state.step + 1} of ${list.length}` : "";
}

function renderQuestion() {
  const q = currentQuestion();
  if (!q) {
    els.question.innerHTML = "";
    return;
  }

  let body = "";
  if (q.type === "choice") {
    const selected = q.field ? state.facts[q.field] : state.facts.preset || (state.facts.day ? "guided" : "");
    const startSelected =
      q.id === "start"
        ? state.facts.preset || (state.facts.day || state.facts.community ? "guided" : "")
        : selected;
    body = `<div class="option-grid">${optionsFor(q, state.facts)
      .map((opt) => {
        const isOn =
          q.id === "start"
            ? startSelected === opt.id || (opt.id === "guided" && !state.facts.preset && state.step > 0)
            : selected === opt.id;
        return `<button type="button" class="option${isOn ? " is-selected" : ""}" data-choice="${opt.id}">
          <span class="option-title">${opt.en}</span>
          <span class="option-hint">${opt.hint || ""}</span>
        </button>`;
      })
      .join("")}</div>`;
  } else if (q.type === "text") {
    body = `<label class="text-field"><span class="sr-only">${q.title}</span>
      <input type="text" id="community-input" value="${escapeAttr(state.facts.community || "")}" placeholder="${escapeAttr(q.placeholder || "")}" />
    </label>
    <button type="button" class="btn btn-primary" data-save-text>Continue</button>`;
  } else if (q.type === "multi") {
    const picked = new Set(state.facts.practice || []);
    body = `<div class="check-list">${optionsFor(q, state.facts)
      .map(
        (opt) => `<label class="check-row">
          <input type="checkbox" data-practice="${opt.id}" ${picked.has(opt.id) ? "checked" : ""} />
          <span><strong>${opt.en}</strong><em>${opt.hint || ""}</em></span>
        </label>`
      )
      .join("")}</div>
      <button type="button" class="btn btn-primary" data-next>Continue</button>`;
  } else if (q.type === "modules") {
    body = renderChecklist();
  }

  els.question.innerHTML = `
    <p class="eyebrow">${els.kicker.textContent}</p>
    <h2>${q.title}</h2>
    <p class="lede">${q.lede || ""}</p>
    ${body}
    <div class="step-nav">
      <button type="button" class="btn btn-ghost" data-back ${state.step === 0 ? "disabled" : ""}>Back</button>
      ${q.type === "modules" ? "" : `<button type="button" class="btn btn-ghost" data-next>Skip</button>`}
    </div>
  `;
}

function renderChecklist() {
  const facts = state.facts;
  if (!Object.keys(facts.modules || {}).length) {
    facts.modules = defaultModules(facts);
  }
  return GROUPS.map((group) => {
    const mods = MODULES.filter((m) => m.group === group.id && (!m.available || m.available(facts)));
    if (!mods.length) return "";
    return `<fieldset class="module-group">
      <legend>${group.en} <span lang="he">${group.he}</span></legend>
      ${mods
        .map(
          (m) => `<label class="check-row">
            <input type="checkbox" data-module="${m.id}" ${facts.modules[m.id] ? "checked" : ""} />
            <span><strong>${m.en} <span lang="he">${m.he}</span></strong><em>${m.hint}</em></span>
          </label>`
        )
        .join("")}
    </fieldset>`;
  }).join("") +
    `<div class="generate-row">
      <button type="button" class="btn btn-primary" data-generate>Gather the siddur</button>
      <p class="tiny">Open texts from Sefaria. English, when present, is a licensed translation — not a denominational prayerbook.</p>
    </div>`;
}

function renderOutline() {
  const items = outlineItems();
  const facts = state.facts;
  const ready = facts.day && facts.movement;
  els.outlineStatus.innerHTML = ready
    ? `<p class="outline-kicker">${escapeHtml(facts.community || "Untitled community")}</p>
       <h3>${escapeHtml(serviceTitle(facts))}</h3>
       <p>${escapeHtml(movementLabel(facts.movement))} · ${escapeHtml(nusachLabel(facts.nusach))}</p>`
    : `<p class="outline-kicker">Live order</p><h3>The service will assemble here.</h3>`;

  els.outlineList.innerHTML = items.length
    ? items
        .map(
          (item, i) => `<li>
            <span class="n">${String(i + 1).padStart(2, "0")}</span>
            <span>${escapeHtml(item.titlesEn.join(" · "))}
              <small lang="he">${escapeHtml(item.titlesHe[0] || "")}</small>
            </span>
          </li>`
        )
        .join("")
    : `<li class="empty">Answer a few questions to see the order of service.</li>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, "&quot;");
}

function onWizardClick(event) {
  const stepBtn = event.target.closest("[data-step]");
  if (stepBtn) {
    state.step = Number(stepBtn.dataset.step);
    render();
    return;
  }
  if (event.target.closest("[data-back]")) {
    go(-1);
    return;
  }
  if (event.target.closest("[data-next]")) {
    const q = currentQuestion();
    if (q?.type === "text") saveText();
    else go(1);
    return;
  }
  if (event.target.closest("[data-save-text]")) {
    saveText();
    return;
  }
  if (event.target.closest("[data-generate]")) {
    generate();
    return;
  }
  const choice = event.target.closest("[data-choice]");
  if (choice) {
    choose(currentQuestion(), choice.dataset.choice);
  }
}

function saveText() {
  const input = $("#community-input");
  const q = currentQuestion();
  if (!q) return;
  const next = afterAnswer(state.facts, q.id, input?.value?.trim() || "");
  setFacts(next);
  go(1);
}

function onWizardChange(event) {
  const practice = event.target.closest("[data-practice]");
  if (practice) {
    const picked = [...els.question.querySelectorAll("[data-practice]:checked")].map((el) => el.dataset.practice);
    state.facts = afterAnswer(state.facts, "practice", picked);
    renderOutline();
    return;
  }
  const mod = event.target.closest("[data-module]");
  if (mod) {
    state.facts.modules = { ...state.facts.modules, [mod.dataset.module]: mod.checked };
    renderOutline();
  }
}

async function generate() {
  const items = compile(state.facts);
  if (!items.length) return;
  state.view = "siddur";
  els.wizard.hidden = true;
  els.siddur.hidden = false;
  els.siddurBody.innerHTML = `<div class="loading"><p>Gathering open texts from Sefaria…</p><progress id="load-progress" max="100" value="0"></progress><p class="tiny" id="load-ref"></p></div>`;
  renderCover();
  try {
    const built = await loadSiddur(items, (done, total, ref) => {
      const bar = $("#load-progress");
      const label = $("#load-ref");
      if (bar) bar.value = Math.round((done / total) * 100);
      if (label) label.textContent = `${done} / ${total} · ${ref}`;
    });
    state.built = built;
    renderSiddur(built);
    bindReading();
  } catch (err) {
    els.siddurBody.innerHTML = `<div class="loading"><p>Could not reach Sefaria.</p><p class="tiny">${escapeHtml(err.message)}</p></div>`;
  }
}

function renderCover() {
  const f = state.facts;
  const practices = PRACTICE_OPTIONS.filter((p) => f.practice?.includes(p.id));
  els.cover.innerHTML = `
    <p class="eyebrow">A custom siddur</p>
    <h2>${escapeHtml(f.community || "Untitled community")}</h2>
    <p class="lede">${escapeHtml(serviceTitle(f))}</p>
    <dl class="cover-meta">
      <div><dt>Community</dt><dd>${escapeHtml(movementLabel(f.movement))} · ${escapeHtml(nusachLabel(f.nusach))}</dd></div>
      <div><dt>Room</dt><dd>${escapeHtml(f.setting || "—")} · ${f.minyan === "yes" ? "minyan" : "without a minyan"} · ${f.land === "israel" ? "in Israel" : "in the diaspora"}</dd></div>
      <div><dt>Language</dt><dd>${f.language === "he" ? "Hebrew" : f.language === "en" ? "English" : "Hebrew and English"}</dd></div>
    </dl>
    ${
      practices.length
        ? `<ul class="practice-pills">${practices.map((p) => `<li>${escapeHtml(p.en)}</li>`).join("")}</ul>`
        : ""
    }
    <ul class="cover-notes">${coverNotes(f).map((n) => `<li>${escapeHtml(n)}</li>`).join("")}</ul>
    <p class="tiny">Sources: Sefaria siddurim (Edot HaMizrach, Sefard, Ashkenaz) and Tanakh. Metsudah English is CC-BY. This is a study compilation, not a replacement for a community's received book.</p>
  `;
}

function renderSiddur(built) {
  const lang = state.facts.language || "both";
  const showHe = lang !== "en";
  const showEn = lang !== "he";
  const html = built.sections
    .map((section, i) => {
      const title = section.titlesEn.join(" · ");
      const heTitle = section.titlesHe[0] || "";
      const cal = section.calendarInfo
        ? `<p class="cal-line">${escapeHtml(section.calendarInfo.name)} <span lang="he">${escapeHtml(section.calendarInfo.nameHe || "")}</span></p>`
        : "";
      const rubric = section.rubric ? `<p class="rubric">${escapeHtml(section.rubric)}</p>` : "";
      const hint = section.hint ? `<p class="rubric">${escapeHtml(section.hint)}</p>` : "";
      const parts = section.parts
        .map((part) => {
          if (part.error) {
            return `<p class="missing">Could not load ${escapeHtml(part.ref)}: ${escapeHtml(part.error)}</p>`;
          }
          const text = part.text;
          if (!text) return "";
          const he = showHe ? renderLines(hebrewOnly(text.he), "he") : "";
          const en = showEn ? renderLines(englishOnly(text.en, text.versionTitle), "en") : "";
          let cols = "";
          if (he && en) cols = `<div class="pair">${he}${en}</div>`;
          else if (he) cols = he;
          else if (en) cols = en;
          else cols = `<p class="missing">No open text for this passage.</p>`;
          return `<div class="passage">
            <a class="src" href="${escapeAttr(text.url)}" target="_blank" rel="noreferrer">${escapeHtml(text.ref)}${text.license ? ` · ${escapeHtml(text.license)}` : ""}</a>
            ${cols}
          </div>`;
        })
        .join("");
      return `<section class="siddur-section" id="sec-${i}" data-index="${i}">
        <header>
          <p class="group-label">${escapeHtml(groupLabel(section.group))}</p>
          <h3>${escapeHtml(title)} <span lang="he">${escapeHtml(heTitle)}</span></h3>
          ${cal}${hint}${rubric}
        </header>
        ${parts}
      </section>`;
    })
    .join("");

  els.siddurBody.innerHTML = html || `<p>Nothing selected.</p>`;
  renderToc(built);
}

function renderToc(built) {
  if (!els.toc) return;
  const items = [
    { id: "siddur-cover", n: "00", en: "Cover", he: "" },
    ...(built?.sections || []).map((section, i) => ({
      id: `sec-${i}`,
      n: String(i + 1).padStart(2, "0"),
      en: section.titlesEn.join(" · "),
      he: section.titlesHe[0] || "",
    })),
  ];
  els.toc.innerHTML = items
    .map(
      (item) => `<button type="button" class="toc-link${item.id === state.currentSec ? " is-current" : ""}" data-jump="${item.id}">
        <span class="n">${item.n}</span>
        <span>${escapeHtml(item.en)}${item.he ? `<small lang="he">${escapeHtml(item.he)}</small>` : ""}</span>
      </button>`
    )
    .join("");
}

function bindReading() {
  applySettings(state.settings);
  if (spy) spy.disconnect();
  const nodes = [els.cover, ...document.querySelectorAll(".siddur-section")].filter(Boolean);
  spy = new IntersectionObserver(
    (entries) => {
      if (Date.now() < spyIgnoreUntil) return;
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (!visible.length) return;
      setCurrentSec(visible[0].target.id);
    },
    { root: null, rootMargin: "-18% 0px -62% 0px", threshold: [0, 0.1, 0.4] }
  );
  for (const node of nodes) spy.observe(node);
}

function setCurrentSec(id) {
  if (!id || state.currentSec === id) return;
  state.currentSec = id;
  els.toc?.querySelectorAll(".toc-link").forEach((link) => {
    const on = link.dataset.jump === id;
    link.classList.toggle("is-current", on);
    if (on) link.scrollIntoView({ block: "nearest" });
  });
}

function jumpTo(id) {
  const target = document.getElementById(id);
  if (!target) return;
  spyIgnoreUntil = Date.now() + 700;
  setCurrentSec(id);
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function applySettings(settings) {
  state.settings = settings;
  const root = document.documentElement;
  root.style.setProperty("--siddur-he-size", `${settings.heSize}rem`);
  root.style.setProperty("--siddur-en-size", `${settings.enSize}rem`);
  root.style.setProperty("--siddur-line", String(settings.lineHeight));
  root.style.setProperty("--siddur-para-gap", `${settings.paraGap}rem`);
  root.style.setProperty("--siddur-he-font", HE_FONTS[settings.heFont] || HE_FONTS.frank);
  root.style.setProperty("--siddur-en-font", EN_FONTS[settings.enFont] || EN_FONTS.manrope);
}

function fillSettingsForm() {
  const form = els.settingsForm;
  if (!form) return;
  const s = state.settings;
  form.heSize.value = s.heSize;
  form.enSize.value = s.enSize;
  form.lineHeight.value = s.lineHeight;
  form.paraGap.value = s.paraGap;
  form.heFont.value = s.heFont;
  form.enFont.value = s.enFont;
}

function readSettingsForm() {
  const form = els.settingsForm;
  return {
    heSize: Number(form.heSize.value),
    enSize: Number(form.enSize.value),
    lineHeight: Number(form.lineHeight.value),
    paraGap: Number(form.paraGap.value),
    heFont: form.heFont.value,
    enFont: form.enFont.value,
  };
}

function toast(message) {
  if (!els.toast) return;
  els.toast.hidden = false;
  els.toast.textContent = message;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    els.toast.hidden = true;
  }, 2400);
}

function recordFromState(name) {
  const title = name || state.facts.community || "Untitled siddur";
  return {
    id: state.savedId || newId(),
    name: title,
    savedAt: new Date().toISOString(),
    summary: `${serviceTitle(state.facts)} · ${movementLabel(state.facts.movement)}`,
    facts: state.facts,
    built: state.built,
  };
}

async function saveCurrent() {
  if (!state.built) {
    toast("Gather the siddur first.");
    return;
  }
  const suggested = state.facts.community || "Untitled siddur";
  const name = window.prompt("Name this siddur", suggested);
  if (name == null) return;
  const record = recordFromState(name.trim() || suggested);
  await saveSiddur(record);
  state.savedId = record.id;
  toast("Saved in this browser.");
}

function showSiddur(record) {
  state.facts = record.facts;
  state.built = record.built;
  state.savedId = record.id;
  state.view = "siddur";
  state.currentSec = "siddur-cover";
  els.wizard.hidden = true;
  els.siddur.hidden = false;
  renderCover();
  renderSiddur(record.built);
  bindReading();
  window.scrollTo({ top: 0 });
}

async function openLibrary() {
  els.library.showModal();
  await refreshLibrary();
}

async function refreshLibrary() {
  const rows = await listSiddurim();
  if (!rows.length) {
    els.libraryList.innerHTML = `<li class="empty">Nothing saved here yet.</li>`;
    return;
  }
  els.libraryList.innerHTML = rows
    .map(
      (row) => `<li>
        <span>
          <strong>${escapeHtml(row.name)}</strong>
          <em>${escapeHtml(row.summary || "")} · ${escapeHtml(formatWhen(row.savedAt))}</em>
        </span>
        <button type="button" class="btn btn-ghost" data-open-id="${escapeAttr(row.id)}">Open</button>
        <button type="button" class="btn btn-ghost" data-download-id="${escapeAttr(row.id)}">File</button>
        <button type="button" class="btn btn-ghost" data-delete-id="${escapeAttr(row.id)}">Delete</button>
      </li>`
    )
    .join("");
}

function formatWhen(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso || "";
  }
}

async function openSaved(id) {
  const record = await getSiddur(id);
  if (!record) return;
  els.library.close();
  showSiddur(record);
}

function openFilePicker() {
  els.fileInput.click();
}

async function onFileChosen(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const record = fromFilePayload(data);
    showSiddur(record);
    els.library.close();
    toast("Opened from file. Save if you want it in this browser.");
  } catch (err) {
    toast(err.message || "Could not open that file.");
  }
}

function groupLabel(id) {
  return GROUPS.find((g) => g.id === id)?.en || id;
}

function renderLines(lines, lang) {
  if (!lines?.length) return "";
  const body = lines
    .map((line) => `<p>${line}</p>`)
    .join("");
  return `<div class="col col-${lang}" lang="${lang === "he" ? "he" : "en"}">${body}</div>`;
}

function onSiddurClick(event) {
  if (event.target.closest("[data-edit]")) {
    state.view = "wizard";
    state.step = questions().length - 1;
    if (spy) spy.disconnect();
    render();
    return;
  }
  if (event.target.closest("[data-print]")) {
    window.print();
    return;
  }
  if (event.target.closest("[data-settings]")) {
    fillSettingsForm();
    els.settings.showModal();
    return;
  }
  if (event.target.closest("[data-save]")) {
    saveCurrent();
    return;
  }
  if (event.target.closest("[data-load]")) {
    openLibrary();
    return;
  }
  const jump = event.target.closest("[data-jump]");
  if (jump) {
    jumpTo(jump.dataset.jump);
  }
}

function onLibraryClick(event) {
  if (event.target.closest("[data-close-library]")) {
    els.library.close();
    return;
  }
  if (event.target.closest("[data-open-file]")) {
    openFilePicker();
    return;
  }
  const openId = event.target.closest("[data-open-id]");
  if (openId) {
    openSaved(openId.dataset.openId);
    return;
  }
  const del = event.target.closest("[data-delete-id]");
  if (del) {
    deleteSiddur(del.dataset.deleteId).then(refreshLibrary);
    return;
  }
  const dl = event.target.closest("[data-download-id]");
  if (dl) {
    getSiddur(dl.dataset.downloadId).then((record) => {
      if (record) downloadJson(record);
    });
  }
}

function init() {
  els.wizard = $("#wizard");
  els.siddur = $("#siddur-view");
  els.progress = $("#progress");
  els.kicker = $("#step-kicker");
  els.question = $("#question");
  els.outlineStatus = $("#outline-status");
  els.outlineList = $("#outline-list");
  els.cover = $("#siddur-cover");
  els.siddurBody = $("#siddur-body");
  els.toc = $("#toc-nav");
  els.toast = $("#siddur-toast");
  els.settings = $("#settings-dialog");
  els.settingsForm = $("#settings-form");
  els.library = $("#library-dialog");
  els.libraryList = $("#library-list");
  els.fileInput = $("#siddur-file");

  els.wizard.addEventListener("click", onWizardClick);
  els.wizard.addEventListener("change", onWizardChange);
  els.siddur.addEventListener("click", onSiddurClick);
  els.library.addEventListener("click", onLibraryClick);
  els.fileInput.addEventListener("change", onFileChosen);
  els.settingsForm.addEventListener("input", () => {
    const next = readSettingsForm();
    applySettings(next);
    saveSettings(next);
  });
  $("#question").addEventListener("keydown", (event) => {
    if (event.key === "Enter" && event.target.id === "community-input") {
      event.preventDefault();
      saveText();
    }
  });

  applySettings(state.settings);

  const hash = location.hash.replace(/^#/, "");
  applyHash(hash);
  window.addEventListener("hashchange", () => {
    applyHash(location.hash.replace(/^#/, ""));
    state.view = "wizard";
    state.built = null;
    render();
  });

  render();
}

function applyHash(hash) {
  if (hash === "sefardi" || hash === "kollel") {
    state.facts = applyPreset("sefardi_kollel");
    const list = visibleQuestions(state.facts);
    const at = list.findIndex((q) => q.id === "modules");
    state.step = at >= 0 ? at : list.length - 1;
  } else if (hash === "reform") {
    state.facts = applyPreset("reform_shabbat");
    const list = visibleQuestions(state.facts);
    const at = list.findIndex((q) => q.id === "modules");
    state.step = at >= 0 ? at : list.length - 1;
  }
}

init();
