import { RHYTHMS, groupByRhythm } from "./time-taxonomy.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const WORLD_WIDTH = 6800;
const WORLD_HEIGHT = 4400;
const C = 2000;

const DAY_WINDOWS = [
  { id: "wake", name: "Wake prep", start: 5, end: 8.5, mean: 6.75 },
  { id: "morning", name: "Daily prayer", start: 5.5, end: 10.5, mean: 8 },
  { id: "dress", name: "Dress", start: 6, end: 11, mean: 7.5 },
  { id: "meal-prep", name: "Meal prep", start: 6, end: 20, mean: 17 },
  { id: "eating", name: "Eating", start: 6.5, end: 22, mean: 13 },
  { id: "work", name: "Work", start: 8, end: 18, mean: 13 },
  { id: "people", name: "With people", start: 8, end: 21, mean: 14 },
  { id: "home", name: "At home", start: 7, end: 23, mean: 18 },
  { id: "evening", name: "Evening prayer", start: 18, end: 24, mean: 20.5 },
  { id: "sleep", name: "Sleep prep", start: 20, end: 24, mean: 22 },
  { id: "all-day", name: "All day", start: 0, end: 24, mean: 12 },
];

const YEAR_WINDOWS = {
  "High Holy": [{ start: 0.94, end: 1.08 }],
  Sukkot: [{ start: 0.01, end: 0.17 }],
  Pesach: [{ start: 0.46, end: 0.66 }],
  Omer: [{ start: 0.5, end: 0.72 }],
  Shavuot: [{ start: 0.63, end: 0.78 }],
  Pilgrimage: [
    { start: 0.02, end: 0.15 },
    { start: 0.48, end: 0.63 },
    { start: 0.66, end: 0.77 },
  ],
  Harvest: [{ start: 0.42, end: 0.86 }],
  Annual: [{ start: 0, end: 1 }],
};

const BOOK_SHORT = {
  Bereshit: "Ber",
  Shemot: "Shem",
  Vayikra: "Vay",
  Bamidbar: "Bam",
  Devarim: "Dev",
};

const DAY_ICONS = {
  wake: "↑",
  morning: "✦",
  dress: "◫",
  "meal-prep": "⌁",
  eating: "●",
  work: "□",
  people: "◇",
  home: "⌂",
  evening: "✦",
  sleep: "↓",
  "all-day": "○",
};

const YEAR_ICONS = {
  "High Holy": "♩",
  Sukkot: "⌂",
  Pesach: "◇",
  Omer: "⋮",
  Shavuot: "△",
  Pilgrimage: "↟",
  Harvest: "⌁",
  Annual: "○",
};

function svgEl(tag, attrs = {}) {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) {
    element.setAttribute(name, String(value));
  }
  return element;
}

function pointAt(radius, fraction) {
  const angle = fraction * Math.PI * 2 - Math.PI / 2;
  return {
    x: C + radius * Math.cos(angle),
    y: C + radius * Math.sin(angle),
  };
}

function arcPath(radius, start, end) {
  let finish = end;
  while (finish <= start) finish += 1;
  if (finish - start >= 0.999) {
    const top = pointAt(radius, 0);
    const bottom = pointAt(radius, 0.5);
    return `M ${top.x} ${top.y} A ${radius} ${radius} 0 1 1 ${bottom.x} ${bottom.y} A ${radius} ${radius} 0 1 1 ${top.x} ${top.y}`;
  }
  const from = pointAt(radius, start);
  const to = pointAt(radius, finish);
  const large = finish - start > 0.5 ? 1 : 0;
  return `M ${from.x} ${from.y} A ${radius} ${radius} 0 ${large} 1 ${to.x} ${to.y}`;
}

function addTitle(element, text) {
  const title = svgEl("title");
  title.textContent = text;
  element.appendChild(title);
}

function readableRotation(fraction) {
  let rotation = ((fraction % 1) + 1) % 1 * 360;
  if (rotation > 90 && rotation < 270) rotation += 180;
  return rotation;
}

function makeCard(item, radius, fraction, size, onOpen) {
  const point = pointAt(radius, fraction);
  const group = svgEl("g", {
    class: `timeline-card is-${item.type}`,
    transform: `translate(${point.x} ${point.y}) rotate(${readableRotation(fraction)})`,
    tabindex: "0",
    role: "button",
    "aria-label": `Mitzvah ${item.id}, ${item.shortName}`,
  });
  const width = size.width;
  const height = size.height;

  group.appendChild(
    svgEl("rect", {
      x: -width / 2,
      y: -height / 2,
      width,
      height,
      rx: Math.min(9, height / 5),
      class: "timeline-card-bg",
    })
  );
  group.appendChild(
    svgEl("line", {
      x1: -width / 2 + 3,
      y1: -height / 2 + 3,
      x2: -width / 2 + 3,
      y2: height / 2 - 3,
      class: "timeline-card-signline",
    })
  );

  const sign = svgEl("text", {
    x: -width / 2 + 10,
    y: -4,
    class: "timeline-card-sign",
  });
  sign.textContent = item.type === "positive" ? "+" : "−";

  const number = svgEl("text", {
    x: width / 2 - 8,
    y: -4,
    class: "timeline-card-number",
    "text-anchor": "end",
  });
  number.textContent = `#${item.id}`;

  const label = svgEl("text", {
    x: -width / 2 + 10,
    y: height / 2 - 9,
    class: "timeline-card-label",
  });
  label.textContent = item.shortName;

  const source = svgEl("text", {
    x: width / 2 - 8,
    y: height / 2 - 9,
    class: "timeline-card-source",
    "text-anchor": "end",
  });
  source.textContent = BOOK_SHORT[item.book] || item.book;

  group.append(sign, number, label, source);
  addTitle(group, `#${item.id} ${item.shortName} · ${item.text}`);
  group.addEventListener("click", (event) => {
    event.stopPropagation();
    onOpen(item.id);
  });
  group.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(item.id);
    }
  });
  return group;
}

function placePackedCards(layer, items, options) {
  if (!items.length) return [];
  let end = options.end;
  while (end <= options.start) end += 1;
  const span = end - options.start;
  const averageRadius = options.baseRadius;
  const available = Math.max(
    options.size.width + options.gap,
    averageRadius * Math.PI * 2 * span
  );
  const capacity = Math.max(
    1,
    Math.floor(available / (options.size.width + options.gap))
  );
  const laneCount = Math.ceil(items.length / capacity);
  const placements = [];

  for (let lane = 0; lane < laneCount; lane += 1) {
    const laneItems = items.slice(lane * capacity, (lane + 1) * capacity);
    const radius = options.baseRadius + lane * options.laneStep;
    laneItems.forEach((item, index) => {
      const fraction =
        options.start + span * ((index + 0.5) / laneItems.length);
      layer.appendChild(
        makeCard(item, radius, fraction, options.size, options.onOpen)
      );
      placements.push({ item, radius, fraction });
    });
  }
  return placements;
}

function dayWindowIds(mitzvah) {
  const text = mitzvah.text.toLowerCase();
  if (text.includes("shema")) return ["wake", "sleep"];
  if (text.includes("prayer") || text.includes("priestly blessing")) {
    return ["morning", "evening"];
  }
  if (
    text.includes("tefillin") ||
    text.includes("fringes") ||
    text.includes("clothes") ||
    text.includes("wear") ||
    text.includes("hair") ||
    text.includes("beard")
  ) {
    return ["dress"];
  }
  if (
    text.includes("check the signs") ||
    text.includes("checking the signs") ||
    text.includes("slaughter") ||
    text.includes("cook") ||
    text.includes("meat in milk") ||
    text.includes("meat with milk")
  ) {
    return ["meal-prep"];
  }
  if (mitzvah.rhythmGroup === "Meals") return ["eating"];
  if (mitzvah.rhythmGroup === "Work") return ["work"];
  if (mitzvah.rhythmGroup === "People") return ["people"];
  if (mitzvah.rhythmGroup === "Home") return ["home"];
  if (mitzvah.rhythmGroup === "Morning") return ["wake"];
  if (mitzvah.rhythmGroup === "Prayer") return ["morning"];
  if (mitzvah.rhythmGroup === "Body") return ["dress"];
  if (mitzvah.rhythmGroup === "Temple day") return ["morning"];
  if (mitzvah.rhythmGroup === "Speech") return ["people"];
  return ["all-day"];
}

function buildDayData(mitzvot) {
  const daily = mitzvot.filter((mitzvah) => mitzvah.rhythmId === "daily");
  return DAY_WINDOWS.map((window) => ({
    ...window,
    items: daily.filter((mitzvah) => dayWindowIds(mitzvah).includes(window.id)),
  }));
}

function makeArc({ radius, start, end, color, className, label, onSelect }) {
  const path = svgEl("path", {
    d: arcPath(radius, start, end),
    class: className,
    stroke: color,
    tabindex: "0",
    role: "button",
    "aria-label": label,
  });
  addTitle(path, label);
  path.addEventListener("click", (event) => {
    event.stopPropagation();
    onSelect();
  });
  path.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect();
    }
  });
  return path;
}

function addPathIcon(layer, radius, fraction, icon, label) {
  const point = pointAt(radius, fraction);
  const marker = svgEl("g", {
    class: "path-subset-icon",
    transform: `translate(${point.x} ${point.y})`,
    "aria-label": label,
  });
  marker.appendChild(svgEl("circle", { cx: 0, cy: 0, r: 22 }));
  const glyph = svgEl("text", {
    x: 0,
    y: 7,
    "text-anchor": "middle",
  });
  glyph.textContent = icon;
  marker.appendChild(glyph);
  addTitle(marker, label);
  layer.appendChild(marker);
}

function makeCirclePanel(world, config) {
  const frame = svgEl("g", { class: "circle-panel-frame" });
  frame.appendChild(
    svgEl("circle", {
      cx: config.x,
      cy: config.y,
      r: config.frameRadius,
    })
  );
  const icon = svgEl("text", {
    x: config.x,
    y: config.y - config.frameRadius + 42,
    class: "circle-panel-icon",
    "text-anchor": "middle",
  });
  icon.textContent = config.icon;
  const title = svgEl("text", {
    x: config.x,
    y: config.y - config.frameRadius + 88,
    class: "circle-panel-title",
    "text-anchor": "middle",
  });
  title.textContent = config.title;
  const subtitle = svgEl("text", {
    x: config.x,
    y: config.y - config.frameRadius + 118,
    class: "circle-panel-subtitle",
    "text-anchor": "middle",
  });
  subtitle.textContent = config.subtitle;
  frame.append(icon, title, subtitle);
  world.appendChild(frame);

  const content = svgEl("g", {
    class: `circle-panel circle-panel-${config.id}`,
    transform: `translate(${config.x} ${config.y}) scale(${config.scale}) translate(${-C} ${-C})`,
  });
  world.appendChild(content);
  return content;
}

function drawDay(world, dayData, onSelect, onOpen) {
  const rhythm = RHYTHMS.find((item) => item.id === "daily");
  const arcs = svgEl("g", { class: "world-arcs world-day-arcs" });
  const cards = svgEl("g", { class: "world-cards world-day-cards" });

  dayData.forEach((window, index) => {
    const radius = 1080 + index * 76;
    arcs.appendChild(
      svgEl("circle", {
        cx: C,
        cy: C,
        r: radius,
        class: "world-track",
      })
    );
    arcs.appendChild(
      makeArc({
        radius,
        start: window.start / 24,
        end: window.end / 24,
        color: rhythm.color,
        className: "world-window-arc",
        label: `${window.name}, ${window.items.length} mitzvot`,
        onSelect: () =>
          onSelect(window.items, `${window.name} · daily window`),
      })
    );
    addPathIcon(
      arcs,
      radius,
      window.mean / 24,
      DAY_ICONS[window.id],
      `${window.name} subset`
    );
    placePackedCards(cards, window.items, {
      start: window.start / 24,
      end: window.end / 24,
      baseRadius: radius,
      laneStep: 34,
      size: { width: 124, height: 42 },
      gap: 13,
      onOpen,
    });
  });

  for (let hour = 0; hour < 24; hour += 1) {
    const inner = pointAt(1044, hour / 24);
    const outer = pointAt(hour % 3 === 0 ? 1905 : 1885, hour / 24);
    arcs.appendChild(
      svgEl("line", {
        x1: inner.x,
        y1: inner.y,
        x2: outer.x,
        y2: outer.y,
        class: hour % 3 === 0 ? "world-hour-major" : "world-hour-minor",
      })
    );
    if (hour % 3 === 0) {
      const labelPoint = pointAt(1930, hour / 24);
      const label = svgEl("text", {
        x: labelPoint.x,
        y: labelPoint.y + 6,
        class: "world-hour-label",
        "text-anchor": "middle",
      });
      label.textContent = formatHour(hour);
      arcs.appendChild(label);
    }
  }
  world.append(arcs, cards);
}

function drawWeek(world, groups, onSelect, onOpen) {
  const rhythm = RHYTHMS.find((item) => item.id === "weekly");
  const items = groups.flatMap((group) => group.items);
  const arcs = svgEl("g", { class: "world-arcs" });
  const cards = svgEl("g", { class: "world-cards" });
  arcs.appendChild(
    svgEl("circle", { cx: C, cy: C, r: 1005, class: "world-track-bold" })
  );
  arcs.appendChild(
    makeArc({
      radius: 1005,
      start: 6 / 7,
      end: 1,
      color: rhythm.color,
      className: "world-period-arc",
      label: `Shabbat, ${items.length} mitzvot`,
      onSelect: () => onSelect(items, "Shabbat · each week"),
    })
  );
  addPathIcon(arcs, 1005, 13 / 14, "✦", "Shabbat subset of the week");
  placePackedCards(cards, items, {
    start: 6 / 7,
    end: 1,
    baseRadius: 1005,
    laneStep: -36,
    size: { width: 116, height: 40 },
    gap: 14,
    onOpen,
  });
  world.append(arcs, cards);
}

function drawMonth(world, groups, onSelect, onOpen) {
  const rhythm = RHYTHMS.find((item) => item.id === "monthly");
  const arcs = svgEl("g", { class: "world-arcs" });
  const cards = svgEl("g", { class: "world-cards" });
  arcs.appendChild(
    svgEl("circle", { cx: C, cy: C, r: 935, class: "world-track-bold" })
  );

  groups.forEach((group, index) => {
    const isNiddah = group.name === "Niddah";
    const start = isNiddah ? 0.12 : 0.95;
    const end = isNiddah ? 0.88 : 1.08;
    const radius = 920 + index * 25;
    const arc = makeArc({
      radius,
      start,
      end,
      color: rhythm.color,
      className: `world-period-arc${isNiddah ? " is-variable" : ""}`,
      label: `${group.name}, ${group.items.length} mitzvot`,
      onSelect: () =>
        onSelect(
          group.items,
          isNiddah ? "Niddah · personal timing" : "New moon · each month"
        ),
    });
    arcs.appendChild(arc);
    addPathIcon(
      arcs,
      radius,
      isNiddah ? 0.5 : 0.015,
      isNiddah ? "∿" : "◐",
      isNiddah ? "Variable personal cycle" : "New moon subset"
    );
    placePackedCards(cards, group.items, {
      start,
      end,
      baseRadius: radius,
      laneStep: -34,
      size: { width: 110, height: 38 },
      gap: 12,
      onOpen,
    });
  });
  world.append(arcs, cards);
}

function drawYear(world, groups, onSelect, onOpen) {
  const rhythm = RHYTHMS.find((item) => item.id === "yearly");
  const arcs = svgEl("g", { class: "world-arcs" });
  const cards = svgEl("g", { class: "world-cards" });
  arcs.appendChild(
    svgEl("circle", { cx: C, cy: C, r: 800, class: "world-track-bold" })
  );

  groups.forEach((group, groupIndex) => {
    const windows = YEAR_WINDOWS[group.name] || [
      { start: groupIndex / groups.length, end: (groupIndex + 0.8) / groups.length },
    ];
    const subsets = windows.map(() => []);
    group.items.forEach((item, index) => subsets[index % windows.length].push(item));

    windows.forEach((window, windowIndex) => {
      const radius = 720 + groupIndex * 25 + windowIndex * 8;
      arcs.appendChild(
        makeArc({
          radius,
          start: window.start,
          end: window.end,
          color: rhythm.color,
          className: "world-period-arc world-year-arc",
          label: `${group.name}, ${group.items.length} mitzvot`,
          onSelect: () => onSelect(group.items, `${group.name} · each year`),
        })
      );
      addPathIcon(
        arcs,
        radius,
        (window.start + window.end) / 2,
        YEAR_ICONS[group.name] || "◇",
        `${group.name} subset of the year`
      );
      placePackedCards(cards, subsets[windowIndex], {
        start: window.start,
        end: window.end,
        baseRadius: radius,
        laneStep: 24,
        size: { width: 102, height: 36 },
        gap: 11,
        onOpen,
      });
    });
  });
  world.append(arcs, cards);
}

function drawLife(world, groups, onSelect, onOpen) {
  const rhythm = RHYTHMS.find((item) => item.id === "life");
  const arcs = svgEl("g", { class: "world-arcs" });
  const cards = svgEl("g", { class: "world-cards" });
  const total = groups.reduce((sum, group) => sum + group.items.length, 0);
  let cursor = 0;

  groups.forEach((group) => {
    const proportional = group.items.length / total;
    const start = cursor + 0.002;
    const end = cursor + proportional - 0.002;
    cursor += proportional;
    arcs.appendChild(
      makeArc({
        radius: 570,
        start,
        end,
        color: rhythm.color,
        className: "world-period-arc world-life-arc",
        label: `${group.name}, ${group.items.length} mitzvot`,
        onSelect: () => onSelect(group.items, `${group.name} · life context`),
      })
    );
    addPathIcon(
      arcs,
      570,
      (start + end) / 2,
      "◇",
      `${group.name} subset of life`
    );
    placePackedCards(cards, group.items, {
      start,
      end,
      baseRadius: 300,
      laneStep: 30,
      size: { width: 84, height: 32 },
      gap: 8,
      onOpen,
    });
  });
  arcs.appendChild(
    svgEl("circle", { cx: C, cy: C, r: 570, class: "world-track-bold" })
  );
  world.append(arcs, cards);
}

function drawCycles(world, groups, onSelect, onOpen) {
  const rhythm = RHYTHMS.find((item) => item.id === "cycles");
  const arcs = svgEl("g", { class: "world-arcs" });
  const cards = svgEl("g", { class: "world-cards" });
  const items = groups.flatMap((group) => group.items);

  groups.forEach((group, index) => {
    const radius = 105 + index * 44;
    arcs.appendChild(
      makeArc({
        radius,
        start: 0,
        end: 1,
        color: rhythm.color,
        className: "world-cycle-arc",
        label: `${group.name}, ${group.items.length} mitzvot`,
        onSelect: () => onSelect(group.items, `${group.name} · long cycle`),
      })
    );
    addPathIcon(
      arcs,
      radius,
      index / Math.max(1, groups.length),
      "∞",
      `${group.name} long-cycle subset`
    );
  });
  placePackedCards(cards, items, {
    start: 0,
    end: 1,
    baseRadius: 115,
    laneStep: 42,
    size: { width: 72, height: 28 },
    gap: 7,
    onOpen,
  });

  const core = svgEl("g", { class: "world-core" });
  core.appendChild(svgEl("circle", { cx: C, cy: C, r: 58 }));
  const number = svgEl("text", {
    x: C,
    y: C - 3,
    "text-anchor": "middle",
  });
  number.textContent = "7 · 49";
  const note = svgEl("text", {
    x: C,
    y: C + 19,
    "text-anchor": "middle",
    class: "world-core-note",
  });
  note.textContent = "YEAR CYCLES";
  core.append(number, note);
  arcs.appendChild(core);
  world.append(arcs, cards);
}

function drawRareCases(world, groups, onSelect, onOpen) {
  const items = groups.flatMap((group) => group.items);
  if (!items.length) return;
  const rhythm = RHYTHMS.find((item) => item.id === "occasion");
  const arcs = svgEl("g", { class: "world-arcs" });
  const cards = svgEl("g", { class: "world-cards" });
  arcs.appendChild(
    makeArc({
      radius: 260,
      start: 0,
      end: 1,
      color: rhythm.color,
      className: "world-cycle-arc is-rare",
      label: `Rare cases, ${items.length} mitzvot`,
      onSelect: () => onSelect(items, "Rare triggered cases"),
    })
  );
  placePackedCards(cards, items, {
    start: 0,
    end: 1,
    baseRadius: 260,
    laneStep: 32,
    size: { width: 76, height: 30 },
    gap: 8,
    onOpen,
  });
  world.append(arcs, cards);
}

function renderActivityList(container, dayData, onSelect) {
  const list = document.createElement("div");
  list.className = "day-activity-list";
  for (const window of dayData) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "day-activity";
    const mean =
      window.id === "all-day"
        ? "any time"
        : `often near ${formatHour(window.mean)}`;
    button.innerHTML = `
      <span class="activity-time">${formatRange(window.start, window.end)}</span>
      <strong>${window.name}</strong>
      <span class="activity-mean">${mean}</span>
      <b>${window.items.length}</b>
    `;
    button.addEventListener("click", () =>
      onSelect(window.items, `${window.name} · daily window`)
    );
    list.appendChild(button);
  }
  container.appendChild(list);
}

function formatHour(hour) {
  const rounded = Math.round(hour * 2) / 2;
  const whole = Math.floor(rounded) % 24;
  const minutes = rounded % 1 ? ":30" : "";
  const suffix = whole < 12 ? "am" : "pm";
  return `${whole % 12 || 12}${minutes}${suffix}`;
}

function formatRange(start, end) {
  if (start === 0 && end === 24) return "00—24";
  return `${formatHour(start)}—${formatHour(end)}`;
}

function enablePanZoom(svg, controls) {
  const full = { x: 0, y: 0, width: WORLD_WIDTH, height: WORLD_HEIGHT };
  const morning = { x: 100, y: 80, width: 2300, height: 1750 };
  let box = { ...morning };
  let drag = null;

  const apply = () => {
    svg.setAttribute("viewBox", `${box.x} ${box.y} ${box.width} ${box.height}`);
    controls.readout.textContent = `${Math.round(WORLD_WIDTH / box.width * 100)}%`;
  };

  const zoom = (factor, clientX, clientY) => {
    const rect = svg.getBoundingClientRect();
    const px = (clientX - rect.left) / rect.width;
    const py = (clientY - rect.top) / rect.height;
    const worldX = box.x + px * box.width;
    const worldY = box.y + py * box.height;
    const width = Math.max(520, Math.min(WORLD_WIDTH, box.width * factor));
    const height = width * (rect.height / rect.width);
    box = {
      x: worldX - px * width,
      y: worldY - py * height,
      width,
      height,
    };
    apply();
  };

  svg.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      zoom(event.deltaY > 0 ? 1.14 : 0.86, event.clientX, event.clientY);
    },
    { passive: false }
  );

  svg.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".timeline-card")) return;
    drag = {
      clientX: event.clientX,
      clientY: event.clientY,
      x: box.x,
      y: box.y,
    };
    svg.setPointerCapture(event.pointerId);
    svg.classList.add("is-dragging");
  });
  svg.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const rect = svg.getBoundingClientRect();
    box.x = drag.x - ((event.clientX - drag.clientX) / rect.width) * box.width;
    box.y = drag.y - ((event.clientY - drag.clientY) / rect.height) * box.height;
    apply();
  });
  const endDrag = () => {
    drag = null;
    svg.classList.remove("is-dragging");
  };
  svg.addEventListener("pointerup", endDrag);
  svg.addEventListener("pointercancel", endDrag);

  controls.zoomIn.addEventListener("click", () => {
    const rect = svg.getBoundingClientRect();
    zoom(0.75, rect.left + rect.width / 2, rect.top + rect.height / 2);
  });
  controls.zoomOut.addEventListener("click", () => {
    const rect = svg.getBoundingClientRect();
    zoom(1.3, rect.left + rect.width / 2, rect.top + rect.height / 2);
  });
  controls.fit.addEventListener("click", () => {
    box = { ...full };
    apply();
  });
  controls.morning.addEventListener("click", () => {
    box = { ...morning };
    apply();
  });
  apply();
}

function makeExplorer() {
  const explorer = document.createElement("div");
  explorer.className = "wheel-explorer";
  const controls = document.createElement("div");
  controls.className = "wheel-canvas-controls";
  controls.innerHTML = `
    <span class="canvas-hint">Drag to move · scroll to zoom</span>
    <button type="button" data-morning>Day circle</button>
    <button type="button" data-fit>Fit atlas</button>
    <button type="button" data-out aria-label="Zoom out">−</button>
    <span class="zoom-readout">100%</span>
    <button type="button" data-in aria-label="Zoom in">+</button>
  `;
  const stage = document.createElement("div");
  stage.className = "wheel-canvas-stage";
  const svg = svgEl("svg", {
    viewBox: `0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`,
    class: "time-wheel-svg",
    role: "img",
    "aria-labelledby": "wheel-svg-title wheel-svg-description",
  });
  const title = svgEl("title", { id: "wheel-svg-title" });
  title.textContent = "Atlas of large mitzvah time circles";
  const description = svgEl("desc", { id: "wheel-svg-description" });
  description.textContent =
    "A zoomable and pannable grid of separate day, week, month, year, life, and long-cycle circles with readable cards and subset icons.";
  svg.append(title, description);
  stage.appendChild(svg);
  explorer.append(controls, stage);
  return {
    explorer,
    svg,
    controls: {
      morning: controls.querySelector("[data-morning]"),
      fit: controls.querySelector("[data-fit]"),
      zoomOut: controls.querySelector("[data-out]"),
      zoomIn: controls.querySelector("[data-in]"),
      readout: controls.querySelector(".zoom-readout"),
    },
  };
}

export function createTimeWheel(container, mitzvot, onSelect, onOpen) {
  const dayData = buildDayData(mitzvot);
  const rhythms = groupByRhythm(mitzvot);
  const groupsFor = (id) =>
    rhythms.find((rhythm) => rhythm.id === id)?.groups || [];
  const choose = (items, label) => {
    if (items.length) onSelect(items.map((item) => item.id), label);
  };

  const layout = document.createElement("div");
  layout.className = "time-wheel-layout";
  const { explorer, svg, controls } = makeExplorer();
  const world = svgEl("g", { class: "wheel-world" });
  svg.appendChild(world);

  const dayPanel = makeCirclePanel(world, {
    id: "day",
    x: 1250,
    y: 1150,
    scale: 0.52,
    frameRadius: 1080,
    icon: "☀",
    title: "DAY",
    subtitle: "activity windows across 24 hours",
  });
  const weekPanel = makeCirclePanel(world, {
    id: "week",
    x: 3300,
    y: 900,
    scale: 0.65,
    frameRadius: 760,
    icon: "✦",
    title: "WEEK",
    subtitle: "Shabbat as a marked subset",
  });
  const monthPanel = makeCirclePanel(world, {
    id: "month",
    x: 5050,
    y: 900,
    scale: 0.65,
    frameRadius: 760,
    icon: "◐",
    title: "MONTH",
    subtitle: "new moon and personal cycle",
  });
  const yearPanel = makeCirclePanel(world, {
    id: "year",
    x: 1550,
    y: 3150,
    scale: 0.82,
    frameRadius: 850,
    icon: "○",
    title: "YEAR",
    subtitle: "festivals, pilgrimage, and harvest",
  });
  const lifePanel = makeCirclePanel(world, {
    id: "life",
    x: 3500,
    y: 3000,
    scale: 1,
    frameRadius: 850,
    icon: "◇",
    title: "LIFE",
    subtitle: "contexts and turning points",
  });
  const cyclePanel = makeCirclePanel(world, {
    id: "cycles",
    x: 5550,
    y: 3000,
    scale: 2,
    frameRadius: 720,
    icon: "∞",
    title: "LONG CYCLES",
    subtitle: "tithes, shemitah, Hakhel, Jubilee",
  });

  drawDay(dayPanel, dayData, choose, onOpen);
  drawWeek(weekPanel, groupsFor("weekly"), choose, onOpen);
  drawMonth(monthPanel, groupsFor("monthly"), choose, onOpen);
  drawYear(yearPanel, groupsFor("yearly"), choose, onOpen);
  drawLife(lifePanel, groupsFor("life"), choose, onOpen);
  drawRareCases(lifePanel, groupsFor("occasion"), choose, onOpen);
  drawCycles(cyclePanel, groupsFor("cycles"), choose, onOpen);

  const side = document.createElement("aside");
  side.className = "wheel-side";
  side.innerHTML = `
    <p class="wheel-kicker">Outside the day</p>
    <h3>Daily activity bands</h3>
    <p class="wheel-side-copy">
      Cards sit inside a likely interval rather than at one rigid time. Their
      center is a plausible point within the available window. Select an
      activity to filter; select a card to read it.
    </p>
  `;
  renderActivityList(side, dayData, choose);
  const note = document.createElement("p");
  note.className = "wheel-scale-note";
  note.textContent =
    "Life contexts are ordered conceptually, not by fixed ages. Niddah remains a variable personal cycle. Only a small core of genuinely rare triggered cases remains.";
  side.appendChild(note);

  layout.append(explorer, side);
  container.replaceChildren(layout);
  enablePanZoom(svg, controls);
}
