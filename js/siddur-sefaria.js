const SEFARIA = "https://www.sefaria.org/api";

function flatten(node) {
  if (node == null || node === "") return [];
  if (typeof node === "string") return [node];
  if (Array.isArray(node)) return node.flatMap(flatten);
  return [];
}

function sanitize(html) {
  return String(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<i\b[^>]*>/gi, "<em>")
    .replace(/<\/i>/gi, "</em>")
    .replace(/<b\b[^>]*>/gi, "<strong>")
    .replace(/<\/b>/gi, "</strong>")
    .replace(/<(?!\/?(strong|em)\b)[^>]+>/gi, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

function useful(lines) {
  return lines.map(sanitize).filter((line) => line && line !== "[]");
}

const EN_WORD =
  /\b(the|and|of|to|in|an|is|are|was|were|be|been|you|your|our|we|they|them|their|for|that|this|these|those|it|with|as|from|by|not|have|has|had|who|which|will|would|can|may|shall|unto|thee|thou|thy|hath|blessed|lord|god|on|at|or|but|if|when|all|one|him|his|her|she|he|i|me|my|us|so|let|give|thanks|king|living|soul|mercy|hear|israel|before|after|upon|into|over|under|without|among|every|forever|ever|holy|name|world|light|peace|love|heart|day|night|morning|prayer|blessing)\b/gi;

function stripTags(s) {
  return String(s).replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ");
}

function hebrewCount(s) {
  return (s.match(/[\u0590-\u05FF]/g) || []).length;
}

function latinCount(s) {
  return (s.match(/[A-Za-zÀ-ÿ]/g) || []).length;
}

function isTransliterationLine(plain) {
  const apostrophe = (plain.match(/[A-Za-z]['’][A-Za-z]/g) || []).length;
  const enHits = (plain.match(EN_WORD) || []).length;
  if (apostrophe >= 3 && enHits < 2) return true;
  if (/[áéíóúÁÉÍÓÚ]/.test(plain) && apostrophe >= 1 && enHits < 2) return true;
  if (
    /\b(baruch|barukh|atah|adonai|adonoy|hashem|shema|yisrael|melech|v'amar|kam rabi|l'cha|b'shem)\b/i.test(
      plain
    ) &&
    enHits < 2
  ) {
    return true;
  }
  return false;
}

function isEnglishLine(line) {
  const plain = stripTags(line).trim();
  if (!plain) return false;
  if (hebrewCount(plain) > latinCount(plain)) return false;
  if (isTransliterationLine(plain)) return false;
  const enHits = (plain.match(EN_WORD) || []).length;
  if (enHits >= 1) return true;
  const words = plain.split(/\s+/).filter(Boolean);
  if (words.length <= 3 && /^[A-Za-z .,'’!?]+$/.test(plain) && !/[A-Za-z]['’][A-Za-z]/.test(plain)) {
    return true;
  }
  return false;
}

function englishOnly(lines, versionTitle) {
  if (/translit/i.test(versionTitle || "")) return [];
  return (lines || []).filter(isEnglishLine);
}

function hebrewOnly(lines) {
  return (lines || []).filter((line) => {
    const plain = stripTags(line).trim();
    if (!plain) return false;
    const he = hebrewCount(plain);
    const la = latinCount(plain);
    if (he > 0) return true;
    return la === 0;
  });
}

export { englishOnly, hebrewOnly };

export async function fetchText(ref) {
  const url = `${SEFARIA}/texts/${encodeURIComponent(ref)}?context=0&commentary=0`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Sefaria ${res.status} for ${ref}`);
  }
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  const he = hebrewOnly(useful(flatten(data.he)));
  const en = englishOnly(useful(flatten(data.text)), data.versionTitle || "");
  return {
    ref: data.ref || ref,
    heRef: data.heRef || "",
    he,
    en,
    license: data.license || "",
    versionTitle: data.versionTitle || "",
    heVersionTitle: data.heVersionTitle || "",
    url: `https://www.sefaria.org/${(data.ref || ref).replace(/ /g, "_")}`,
  };
}

export async function fetchCalendar() {
  const res = await fetch(`${SEFARIA}/calendars`);
  if (!res.ok) throw new Error(`Sefaria calendar ${res.status}`);
  const data = await res.json();
  const items = data.calendar_items || [];
  const find = (en) =>
    items.find((item) => item.title?.en === en) ||
    items.find((item) => (item.title?.en || "").toLowerCase().includes(en.toLowerCase()));
  const parasha = find("Parashat Hashavua");
  const haftarah = find("Haftarah");
  return {
    date: data.date,
    parasha: parasha
      ? {
          name: parasha.displayValue?.en || "",
          nameHe: parasha.displayValue?.he || "",
          ref: parasha.ref || parasha.url,
        }
      : null,
    haftarah: haftarah
      ? {
          name: haftarah.displayValue?.en || "",
          nameHe: haftarah.displayValue?.he || "",
          ref: haftarah.ref || haftarah.url,
        }
      : null,
  };
}

async function mapPool(items, limit, worker) {
  const out = new Array(items.length);
  let i = 0;
  async function run() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await worker(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return out;
}

export async function loadSiddur(items, onProgress) {
  const calendarNeeded = items.some((item) => item.calendar);
  let calendar = null;
  if (calendarNeeded) {
    try {
      calendar = await fetchCalendar();
    } catch (err) {
      calendar = { error: err.message };
    }
  }

  const jobs = [];
  for (const item of items) {
    if (item.calendar === "parasha" && calendar?.parasha?.ref) {
      jobs.push({ item, ref: calendar.parasha.ref, meta: calendar.parasha });
    } else if (item.calendar === "haftarah" && calendar?.haftarah?.ref) {
      jobs.push({ item, ref: calendar.haftarah.ref, meta: calendar.haftarah });
    } else {
      for (const ref of item.refs) jobs.push({ item, ref, meta: null });
    }
  }

  let done = 0;
  const results = await mapPool(jobs, 4, async (job) => {
    try {
      const text = await fetchText(job.ref);
      done += 1;
      onProgress?.(done, jobs.length, job.ref);
      return { ...job, text, error: null };
    } catch (err) {
      done += 1;
      onProgress?.(done, jobs.length, job.ref);
      return { ...job, text: null, error: err.message };
    }
  });

  const byItem = new Map();
  for (const item of items) byItem.set(item, []);
  for (const result of results) byItem.get(result.item).push(result);

  const sections = items.map((item) => {
    const parts = byItem.get(item) || [];
    return {
      ...item,
      calendarInfo: parts.find((p) => p.meta)?.meta || null,
      parts: parts.map((p) => ({
        ref: p.ref,
        error: p.error,
        text: p.text,
      })),
    };
  });

  return { calendar, sections };
}
