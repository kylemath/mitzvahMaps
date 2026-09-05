/**
 * Question tree, ritual presets, and liturgy compiler for the siddur builder.
 * Texts are resolved to Sefaria (and Tanakh) refs; nothing copyrighted is stored here.
 */

export const GROUPS = [
  { id: "preparatory", en: "Preparatory", he: "הכנה" },
  { id: "offerings", en: "Offerings & study", he: "קרבנות" },
  { id: "pesukei", en: "Pesukei d'zimra", he: "פסוקי דזמרה" },
  { id: "shema", en: "Shema", he: "קריאת שמע" },
  { id: "amidah", en: "Amidah", he: "עמידה" },
  { id: "supplication", en: "Supplication", he: "תחנון" },
  { id: "torah", en: "Torah service", he: "קריאת התורה" },
  { id: "musaf", en: "Musaf", he: "מוסף" },
  { id: "concluding", en: "Concluding", he: "סיום" },
];

const ASH_WD = "Siddur Ashkenaz, Weekday, Shacharit";
const ASH_SH = "Siddur Ashkenaz, Shabbat, Shacharit";
const ASH_MUSAF = "Siddur Ashkenaz, Shabbat, Musaf LeShabbat";
const EDOT_WD = "Siddur Edot HaMizrach, Weekday Shacharit";
const EDOT_SH = "Siddur Edot HaMizrach, Shabbat Shacharit";
const EDOT_PREP = "Siddur Edot HaMizrach, Preparatory Prayers";
const SEF_UP = "Siddur Sefard, Upon Arising";
const SEF_WD = "Siddur Sefard, Weekday Shacharit";

function isSefardi(f) {
  return f.nusach === "edot_hamizrach" || f.nusach === "sefard" || f.nusach === "ari";
}

function isOrthodox(f) {
  return f.movement === "orthodox";
}

function wantsMinyan(f) {
  return f.minyan === "yes";
}

function ash(f, rest) {
  return `${f.day === "shabbat" ? ASH_SH : ASH_WD}, ${rest}`;
}

function pickRef(f, map) {
  if (f.nusach === "edot_hamizrach" && map.edot) return map.edot;
  if ((f.nusach === "sefard" || f.nusach === "ari") && map.sefard) return map.sefard;
  if (map.ash) return typeof map.ash === "function" ? map.ash(f) : map.ash;
  return map.tanakh || null;
}

function prefixLeaves(prefix, names) {
  return names.map((name) => `${prefix}, ${name}`);
}

const WD_AMIDAH = prefixLeaves(`${ASH_WD}, Amidah`, [
  "Patriarchs",
  "Divine Might",
  "Holiness of God",
  "Kedushah",
  "Knowledge",
  "Repentance",
  "Forgiveness",
  "Redemption",
  "Healing",
  "Prosperity",
  "Gathering the Exiles",
  "Justice",
  "Against Enemies",
  "The Righteous",
  "Rebuilding Jerusalem",
  "Kingdom of David",
  "Response to Prayer",
  "Temple Service",
  "Thanksgiving",
  "Birkat Kohanim",
  "Peace",
  "Concluding Passage",
]);

const SH_AMIDAH = prefixLeaves(`${ASH_SH}, Amidah`, [
  "Patriarchs",
  "Divine Might",
  "Kedushah",
  "Holiness of God",
  "Sanctity of the Day",
  "Temple Service",
  "Thanksgiving",
  "Birkat Kohanim",
  "Peace",
  "Concluding Passage",
]);

const MUSAF_AMIDAH = [
  ...prefixLeaves(`${ASH_MUSAF}, Amidah`, [
    "Patriarchs",
    "Divine Might",
    "Kedushah",
    "Holiness of God",
  ]),
  `${ASH_MUSAF}, Amidah, Sanctity of the Day, For Shabbat`,
  ...prefixLeaves(`${ASH_MUSAF}, Amidah`, [
    "Temple Service",
    "Thanksgiving",
    "Birkat Kohanim",
    "Peace",
    "Concluding Passage",
  ]),
];

const SH_ARK = prefixLeaves(`${ASH_SH}, Torah Reading, Removing the Torah from the Ark`, [
  "Ein Kamocha",
  "Vayehi Binsoa",
  "Berich Shmei",
  "Shema Yisrael (Gadlu)",
  "Lecha Hashem",
  "Veyazor Veyagen",
]);

const WD_ARK = prefixLeaves(`${ASH_WD}, Torah Reading, Removing the Torah from Ark`, [
  "El Erech Appayim",
  "Vayehi Binsoa",
  "Berich Shmei",
  "Lekha Hashem",
  "Av Harachamim",
  "Vetigaleh Veteraeh",
]);

const WD_TACHANUN = prefixLeaves(`${ASH_WD}, Post Amidah, Tachanun`, [
  "Nefilat Apayim",
  "God of Israel",
  "Shomer Yisrael",
]);

export const MODULES = [
  {
    id: "modeh_ani",
    group: "preparatory",
    en: "Modeh Ani",
    he: "מודה אני",
    hint: "First words upon waking, before washing the hands.",
    defaultOn: (f) => f.movement !== "reform" || f.setting === "home",
    resolve: (f) => ({
      ref: pickRef(f, {
        edot: `${EDOT_PREP}, Modeh Ani`,
        sefard: `${SEF_UP}, Modeh Ani`,
        ash: ash(f, "Preparatory Prayers, Modeh Ani"),
      }),
    }),
  },
  {
    id: "netilat",
    group: "preparatory",
    en: "Netilat yadayim & Asher Yatzar",
    he: "נטילת ידיים ואשר יצר",
    hint: "Morning handwashing and the blessing of the body.",
    defaultOn: (f) => f.movement !== "reform",
    resolve: (f) => ({
      ref: pickRef(f, {
        ash: ash(f, "Preparatory Prayers, Netilat Yadayim"),
        sefard: `${SEF_UP}, Introductory Prayers`,
        edot: `${EDOT_PREP}, Morning Blessings`,
      }),
    }),
  },
  {
    id: "elokai_neshama",
    group: "preparatory",
    en: "Elokai Neshama",
    he: "אלהי נשמה",
    hint: "Thanksgiving for the return of the soul.",
    defaultOn: (f) => f.movement !== "reform",
    available: (f) => f.nusach !== "edot_hamizrach",
    resolve: (f) => ({
      ref: ash(f, "Preparatory Prayers, Elokai Neshama"),
    }),
  },
  {
    id: "birchot_hashachar",
    group: "preparatory",
    en: "Morning blessings",
    he: "ברכות השחר",
    hint: "Birchot hashachar — the sequence of dawn blessings.",
    defaultOn: (f) => f.movement !== "reform",
    resolve: (f) => ({
      ref: pickRef(f, {
        edot: `${EDOT_WD}, Morning Prayer`,
        sefard: `${SEF_WD}, Morning Blessings`,
        ash: ash(f, "Preparatory Prayers, Morning Blessings"),
      }),
    }),
  },
  {
    id: "torah_blessings",
    group: "preparatory",
    en: "Blessings of the Torah",
    he: "ברכות התורה",
    hint: "Said before any other study; includes a short passage of Torah.",
    defaultOn: (f) => isOrthodox(f) || f.movement === "conservative",
    resolve: (f) => ({
      ref: pickRef(f, {
        edot: `${EDOT_PREP}, Torah Blessings`,
        sefard: `${SEF_WD}, Blessings on Torah`,
        ash: `${ASH_WD}, Preparatory Prayers, Torah Blessings`,
      }),
    }),
  },
  {
    id: "petichat_eliyahu",
    group: "preparatory",
    en: "Petichat Eliyahu",
    he: "פתח אליהו",
    hint: "Kabbalistic prologue from Tikkunei Zohar, standard in many Sefardic and Mizrahi rites.",
    defaultOn: (f) => f.nusach === "edot_hamizrach" && isOrthodox(f),
    available: (f) => isSefardi(f),
    resolve: () => ({ ref: `${EDOT_WD}, Petichat Eliyahu` }),
  },
  {
    id: "ma_tovu",
    group: "preparatory",
    en: "Mah Tovu",
    he: "מה טובו",
    hint: "Entering the sanctuary. Often the first public words in a Reform Saturday service.",
    defaultOn: (f) => f.setting !== "home",
    resolve: (f) => ({
      ref: pickRef(f, {
        sefard: `${SEF_UP}, Upon Entering Synagogue`,
        ash: ash(f, "Preparatory Prayers, Ma Tovu"),
        edot: `${EDOT_WD}, Hanna's Prayer`,
      }),
    }),
  },
  {
    id: "adon_olam_open",
    group: "preparatory",
    en: "Adon Olam (opening)",
    he: "אדון עולם",
    hint: "Sung as an opening hymn in many synagogues, especially Reform and some Sefardic communities.",
    defaultOn: (f) => f.movement === "reform" || f.setting === "synagogue",
    resolve: (f) => ({
      ref: ash(f, "Preparatory Prayers, Adon Olam"),
    }),
  },
  {
    id: "tallit",
    group: "preparatory",
    en: "Tallit",
    he: "טלית",
    hint: "Wrapping in the tallit. In a kollel this is assumed; in many Reform synagogues all genders who wish to wear one do.",
    defaultOn: (f) =>
      f.setting !== "home" || isOrthodox(f) || f.movement === "conservative",
    resolve: (f) => ({
      ref: pickRef(f, {
        edot: `${EDOT_WD}, Order of Talit`,
        sefard: `${SEF_UP}, Tallit`,
        ash: ash(f, "Preparatory Prayers, Tallit"),
      }),
    }),
  },
  {
    id: "tefillin",
    group: "preparatory",
    en: "Tefillin",
    he: "תפילין",
    hint: "Weekday only. A Sefardic kollel will not skip this; it is never worn on Shabbat.",
    defaultOn: (f) =>
      f.day === "weekday" && isOrthodox(f) && f.who !== "woman",
    available: (f) => f.day === "weekday",
    resolve: (f) => ({
      ref: pickRef(f, {
        edot: `${EDOT_WD}, Order of Tefillin`,
        sefard: `${SEF_UP}, Tefilin`,
        ash: `${ASH_WD}, Preparatory Prayers, Tefillin`,
      }),
    }),
  },
  {
    id: "korbanot",
    group: "offerings",
    en: "Korbanot",
    he: "קרבנות",
    hint: "Recitation of the daily offerings. Standard in an Orthodox kollel; almost never in Reform.",
    defaultOn: (f) => isOrthodox(f) && f.setting === "kollel",
    available: (f) => f.movement !== "reform",
    resolve: (f) => ({
      ref: pickRef(f, {
        edot: `${EDOT_WD}, Incense Offering`,
        sefard: `${SEF_WD}, Korbanot`,
        ash: ash(f, "Preparatory Prayers, Korbanot, Korban HaTamid"),
      }),
    }),
  },
  {
    id: "ketoret",
    group: "offerings",
    en: "Pitum haketoret",
    he: "פיטום הקטורת",
    hint: "The compounding of the incense — a Sefardic and kollel staple.",
    defaultOn: (f) => isOrthodox(f) && isSefardi(f),
    available: (f) => f.movement !== "reform",
    resolve: (f) => ({
      ref: pickRef(f, {
        edot: `${EDOT_WD}, Incense Offering`,
        sefard: `${SEF_WD}, Korbanot`,
        ash: ash(f, "Preparatory Prayers, Korbanot, Ketoret"),
      }),
    }),
  },
  {
    id: "baraita",
    group: "offerings",
    en: "Baraita of Rabbi Yishmael",
    he: "ברייתא דרבי ישמעאל",
    hint: "The thirteen hermeneutical rules, so that the morning includes Torah, Mishnah, and Talmud.",
    defaultOn: (f) => isOrthodox(f),
    available: (f) => f.movement !== "reform",
    resolve: (f) => ({
      ref: pickRef(f, {
        sefard: `${SEF_WD}, B'raita d'Rabi Yishmael`,
        ash: ash(f, "Preparatory Prayers, Korbanot, Baraita of Rabbi Yishmael"),
        edot: `${EDOT_WD}, Morning Prayer`,
      }),
    }),
  },
  {
    id: "kaddish_derabbanan",
    group: "offerings",
    en: "Kaddish derabbanan",
    he: "קדיש דרבנן",
    hint: "After words of Torah, with a minyan.",
    defaultOn: (f) => isOrthodox(f) && wantsMinyan(f),
    available: (f) => wantsMinyan(f),
    resolve: (f) => ({
      ref: ash(f, "Preparatory Prayers, Korbanot, Kaddish DeRabbanan"),
      rubric: "Said with a minyan after the morning study passages.",
    }),
  },
  {
    id: "hodu",
    group: "pesukei",
    en: "Hodu",
    he: "הודו",
    hint: "In Edot HaMizrach and Nusach Sefard, Hodu is recited before Baruch She'amar.",
    defaultOn: (f) => isOrthodox(f),
    resolve: (f) => ({
      ref: pickRef(f, {
        edot: `${EDOT_WD}, Hodu`,
        sefard: `${SEF_WD}, Hodu`,
        ash: ash(f, "Pesukei Dezimra, Hodu"),
      }),
    }),
  },
  {
    id: "mizmor_shir",
    group: "pesukei",
    en: "Mizmor shir (Psalm 30)",
    he: "מזמור שיר",
    hint: "Psalm 30 opens pesukei d'zimra on Shabbat in Ashkenaz.",
    defaultOn: (f) => f.day === "shabbat" && f.movement !== "reform",
    available: (f) => f.day === "shabbat",
    resolve: () => ({
      ref: `${ASH_SH}, Pesukei Dezimra, Mizmor Shir`,
    }),
  },
  {
    id: "baruch_sheamar",
    group: "pesukei",
    en: "Baruch She'amar",
    he: "ברוך שאמר",
    hint: "The formal opening of pesukei d'zimra.",
    defaultOn: (f) => f.movement !== "reform",
    available: (f) => f.nusach !== "edot_hamizrach",
    resolve: (f) => ({
      ref: ash(f, "Pesukei Dezimra, Barukh She'amar"),
    }),
  },
  {
    id: "pesukei_full_edot",
    group: "pesukei",
    en: "Pesukei d'zimra (Edot HaMizrach)",
    he: "פסוקי דזמרה",
    hint: "The full Sefardic/Mizrahi psalm block, including the daily Halleluyahs.",
    defaultOn: (f) => f.nusach === "edot_hamizrach" && isOrthodox(f),
    available: (f) => f.nusach === "edot_hamizrach",
    resolve: (f) => ({
      ref: f.day === "shabbat" ? `${EDOT_SH}, Pesukei D'Zimra` : `${EDOT_WD}, Pesukei D'Zimra`,
    }),
  },
  {
    id: "shabbat_psalms",
    group: "pesukei",
    en: "Shabbat psalms (19, 34, 90, 91, 135, 136, 33, 92, 93)",
    he: "מזמורי שבת",
    hint: "The extra Shabbat psalms of pesukei d'zimra. A kollel on Saturday would say them; a modern Reform service usually does not.",
    defaultOn: (f) => f.day === "shabbat" && isOrthodox(f),
    available: (f) => f.day === "shabbat" && f.nusach !== "edot_hamizrach",
    resolve: () => ({
      ref: `${ASH_SH}, Pesukei Dezimra, Psalm 92`,
      extraRefs: [
        `${ASH_SH}, Pesukei Dezimra, Psalm 19`,
        `${ASH_SH}, Pesukei Dezimra, Psalm 34`,
        `${ASH_SH}, Pesukei Dezimra, Psalm 90`,
        `${ASH_SH}, Pesukei Dezimra, Psalm 91`,
        `${ASH_SH}, Pesukei Dezimra, Psalm 135`,
        `${ASH_SH}, Pesukei Dezimra, Psalm 136`,
        `${ASH_SH}, Pesukei Dezimra, Psalm 33`,
        `${ASH_SH}, Pesukei Dezimra, Psalm 93`,
      ],
    }),
  },
  {
    id: "ashrei",
    group: "pesukei",
    en: "Ashrei (Psalm 145)",
    he: "אשרי",
    hint: "The psalm the Talmud says one should recite three times daily. Kept even in abbreviated rites.",
    defaultOn: () => true,
    available: (f) => f.nusach !== "edot_hamizrach",
    resolve: (f) => ({
      ref: ash(f, "Pesukei Dezimra, Ashrei"),
    }),
  },
  {
    id: "halleluyahs",
    group: "pesukei",
    en: "Psalms 146–150",
    he: "הללויה",
    hint: "The five closing psalms of the book of Tehillim.",
    defaultOn: (f) => f.movement !== "reform",
    available: (f) => f.nusach !== "edot_hamizrach",
    resolve: (f) => ({
      ref: ash(f, "Pesukei Dezimra, Psalm 150"),
      extraRefs: [
        ash(f, "Pesukei Dezimra, Psalm 146"),
        ash(f, "Pesukei Dezimra, Psalm 147"),
        ash(f, "Pesukei Dezimra, Psalm 148"),
        ash(f, "Pesukei Dezimra, Psalm 149"),
      ],
    }),
  },
  {
    id: "vayevarech",
    group: "pesukei",
    en: "Vayevarech David & Az Yashir",
    he: "ויברך דוד ואו ישיר",
    hint: "David's blessing and the Song at the Sea.",
    defaultOn: (f) => isOrthodox(f),
    available: (f) => f.nusach !== "edot_hamizrach",
    resolve: (f) => ({
      ref: ash(f, "Pesukei Dezimra, Vayevarech David"),
      extraRefs: [
        f.day === "shabbat"
          ? `${ASH_SH}, Pesukei Dezimra, Shirat HaYam`
          : `${ASH_WD}, Pesukei Dezimra, Az Yashir`,
      ],
    }),
  },
  {
    id: "nishmat",
    group: "pesukei",
    en: "Nishmat kol chai",
    he: "נשמת כל חי",
    hint: "The Shabbat expansion of pesukei d'zimra. Often retained in Reform Saturday morning as a musical centerpiece.",
    defaultOn: (f) => f.day === "shabbat",
    available: (f) => f.day === "shabbat",
    resolve: () => ({
      ref: `${ASH_SH}, Pesukei Dezimra, Nishmat Kol Chai`,
    }),
  },
  {
    id: "yishtabach",
    group: "pesukei",
    en: "Yishtabach",
    he: "ישתבח",
    hint: "Closes pesukei d'zimra. After this, one does not interrupt until the Amidah.",
    defaultOn: (f) => f.movement !== "reform" || f.day === "shabbat",
    resolve: (f) => ({
      ref: pickRef(f, {
        sefard: `${SEF_WD}, Yishtabach`,
        ash: ash(f, "Pesukei Dezimra, Yishtabach"),
        edot: f.day === "shabbat" ? `${EDOT_SH}, Pesukei D'Zimra` : `${EDOT_WD}, Pesukei D'Zimra`,
      }),
    }),
  },
  {
    id: "chatzi_kaddish",
    group: "pesukei",
    en: "Chatzi Kaddish",
    he: "חצי קדיש",
    hint: "Half-kaddish with a minyan, bridging pesukei d'zimra and Barchu.",
    defaultOn: (f) => wantsMinyan(f),
    available: (f) => wantsMinyan(f),
    resolve: (f) => ({
      ref: ash(f, "Pesukei Dezimra, Half Kaddish"),
    }),
  },
  {
    id: "barchu",
    group: "shema",
    en: "Barchu",
    he: "ברכו",
    hint: "The call to prayer. Requires a minyan in Orthodox practice; Reform often sings it regardless.",
    defaultOn: (f) => wantsMinyan(f) || f.movement === "reform",
    resolve: (f) => ({
      ref: pickRef(f, {
        edot: f.day === "shabbat" ? `${EDOT_SH}, The Shema` : `${EDOT_WD}, The Shema`,
        sefard: `${SEF_WD}, The Shema`,
        ash: ash(f, "Blessings of the Shema, Barchu"),
      }),
    }),
  },
  {
    id: "yotzer",
    group: "shema",
    en: "Yotzer Or / blessings before Shema",
    he: "יוצר אור",
    hint: "The two blessings before the Shema. Shabbat has a longer yotzer.",
    defaultOn: () => true,
    available: (f) => f.nusach !== "edot_hamizrach" && f.nusach !== "sefard" && f.nusach !== "ari",
    resolve: (f) => ({
      ref: ash(f, "Blessings of the Shema, First Blessing before Shema"),
      extraRefs: [ash(f, "Blessings of the Shema, Second Blessing before Shema")],
    }),
  },
  {
    id: "shema_full_nusach",
    group: "shema",
    en: "Shema and its blessings (nusach)",
    he: "קריאת שמע וברכותיה",
    hint: "The complete Sefardic/Mizrahi Shema block, including all three paragraphs.",
    defaultOn: (f) => isSefardi(f) && f.movement !== "reform",
    available: (f) => isSefardi(f),
    resolve: (f) => ({
      ref: pickRef(f, {
        edot: f.day === "shabbat" ? `${EDOT_SH}, The Shema` : `${EDOT_WD}, The Shema`,
        sefard: `${SEF_WD}, The Shema`,
      }),
    }),
  },
  {
    id: "shema_1",
    group: "shema",
    en: "Shema — first paragraph (Deut. 6:4–9)",
    he: "שמע / ואהבת",
    hint: "The watchword. Classical Reform sometimes stopped here; modern Reform usually continues.",
    defaultOn: () => true,
    available: (f) => !isSefardi(f) || f.movement === "reform",
    resolve: () => ({ ref: "Deuteronomy 6:4-9", sourceLabel: "Tanakh" }),
  },
  {
    id: "shema_2",
    group: "shema",
    en: "Shema — second paragraph (Deut. 11:13–21)",
    he: "והיה אם שמוע",
    hint: "Reward and consequence. Sometimes omitted in classical Reform; kept in Orthodox and most modern Reform.",
    defaultOn: (f) => f.movement !== "reform" || f.rite_depth !== "classical",
    available: (f) => !isSefardi(f) || f.movement === "reform",
    resolve: () => ({ ref: "Deuteronomy 11:13-21", sourceLabel: "Tanakh" }),
  },
  {
    id: "shema_3",
    group: "shema",
    en: "Shema — third paragraph (Num. 15:37–41)",
    he: "ויאמר / ציצית",
    hint: "Tzitzit and the Exodus. Often kept even when the second paragraph is dropped.",
    defaultOn: () => true,
    available: (f) => !isSefardi(f) || f.movement === "reform",
    resolve: () => ({ ref: "Numbers 15:37-41", sourceLabel: "Tanakh" }),
  },
  {
    id: "geulah",
    group: "shema",
    en: "Blessing after Shema (Ge'ulah)",
    he: "גאולה",
    hint: "Emet veyatziv / Emet ve'emunah, running straight into the Amidah.",
    defaultOn: () => true,
    available: (f) => !isSefardi(f),
    resolve: (f) => ({
      ref: ash(f, "Blessings of the Shema, Blessing after Shema"),
    }),
  },
  {
    id: "amidah",
    group: "amidah",
    en: "Amidah",
    he: "עמידה",
    hint: "Weekday: 19 blessings. Shabbat: 7. The silent standing prayer is the core of Shacharit in every movement.",
    defaultOn: () => true,
    resolve: (f) => {
      if (f.nusach === "edot_hamizrach") {
        return {
          ref: f.day === "shabbat" ? `${EDOT_SH}, Amidah` : `${EDOT_WD}, Amida`,
        };
      }
      if (f.nusach === "sefard" || f.nusach === "ari") {
        return { ref: `${SEF_WD}, Amidah` };
      }
      const leaves = f.day === "shabbat" ? SH_AMIDAH : WD_AMIDAH;
      return { ref: leaves[0], extraRefs: leaves.slice(1) };
    },
  },
  {
    id: "vidui",
    group: "supplication",
    en: "Vidui",
    he: "וידוי",
    hint: "Sefardic weekday confession after the Amidah. Not said on Shabbat.",
    defaultOn: (f) =>
      f.day === "weekday" && isOrthodox(f) && f.nusach === "edot_hamizrach",
    available: (f) => f.day === "weekday" && f.movement !== "reform",
    resolve: () => ({ ref: `${EDOT_WD}, Vidui` }),
  },
  {
    id: "tachanun",
    group: "supplication",
    en: "Tachanun",
    he: "תחנון",
    hint: "Weekday supplication, skipped on Shabbat, Rosh Chodesh, and many other days. A Reform Saturday service never includes it.",
    defaultOn: (f) => f.day === "weekday" && isOrthodox(f) && f.nusach !== "edot_hamizrach",
    available: (f) => f.day === "weekday" && f.movement !== "reform",
    resolve: (f) => {
      if (f.nusach === "sefard" || f.nusach === "ari") {
        return { ref: `${SEF_WD}, Tachanun` };
      }
      return { ref: WD_TACHANUN[0], extraRefs: WD_TACHANUN.slice(1) };
    },
  },
  {
    id: "torah_service",
    group: "torah",
    en: "Taking out the Torah",
    he: "הוצאת ספר תורה",
    hint: "Ark opening, processional, and aliyah blessings. Central to a Saturday synagogue service; on weekdays only Monday and Thursday (and Rosh Chodesh).",
    defaultOn: (f) =>
      f.day === "shabbat" ||
      (f.day === "weekday" &&
        (f.weekday === "mon" || f.weekday === "thu") &&
        wantsMinyan(f)),
    resolve: (f) => {
      if (f.nusach === "edot_hamizrach") {
        return {
          ref: f.day === "shabbat" ? `${EDOT_SH}, Torah Reading` : `${EDOT_WD}, Torah Reading`,
        };
      }
      if (f.nusach === "sefard" || f.nusach === "ari") {
        return { ref: `${SEF_WD}, Torah Reading` };
      }
      const leaves = f.day === "shabbat" ? SH_ARK : WD_ARK;
      return { ref: leaves[0], extraRefs: leaves.slice(1) };
    },
  },
  {
    id: "aliyah_blessings",
    group: "torah",
    en: "Aliyah blessings",
    he: "ברכות התורה לעולה",
    hint: "Blessings before and after each aliyah.",
    defaultOn: (f) =>
      f.day === "shabbat" || f.weekday === "mon" || f.weekday === "thu",
    available: (f) => f.day === "shabbat" || f.weekday === "mon" || f.weekday === "thu",
    resolve: (f) => ({
      ref:
        f.day === "shabbat"
          ? `${ASH_SH}, Torah Reading, Reading from Sefer, Birkat HaTorah`
          : `${ASH_WD}, Torah Reading, Reading from Sefer, Birkat HaTorah`,
    }),
  },
  {
    id: "weekly_parsha",
    group: "torah",
    en: "This week's Torah reading",
    he: "פרשת השבוע",
    hint: "Pulled live from Sefaria's calendar. A siddur usually prints only the blessings; the reading itself is from the scroll.",
    defaultOn: (f) => f.day === "shabbat" && f.setting === "synagogue",
    available: (f) => f.day === "shabbat",
    resolve: () => ({ calendar: "parasha" }),
  },
  {
    id: "haftarah",
    group: "torah",
    en: "Haftarah",
    he: "הפטרה",
    hint: "The prophetic reading for this Shabbat, from Sefaria's calendar.",
    defaultOn: (f) => f.day === "shabbat" && f.setting === "synagogue",
    available: (f) => f.day === "shabbat",
    resolve: () => ({ calendar: "haftarah" }),
  },
  {
    id: "mi_sheberach",
    group: "torah",
    en: "Mi sheberach (healing & community)",
    he: "מי שברך",
    hint: "Prayers for those called to the Torah, for healing, and for the community. A modern Reform Saturday service often makes this a center of care.",
    defaultOn: (f) => f.day === "shabbat" && f.setting === "synagogue",
    available: (f) => f.day === "shabbat",
    resolve: () => ({
      ref: `${ASH_SH}, Torah Reading, Reading from Sefer, Mi Sheberach, For Sickness (includes man and woman)`,
    }),
  },
  {
    id: "prayer_israel",
    group: "torah",
    en: "Prayers for Israel & captives",
    he: "תפילה לשלום המדינה",
    hint: "Modern additions after the Torah reading.",
    defaultOn: (f) => f.day === "shabbat" && f.setting === "synagogue",
    available: (f) => f.day === "shabbat",
    resolve: () => ({
      ref: `${ASH_SH}, Communal Prayers, Prayer of the State of Israel`,
      extraRefs: [
        `${ASH_SH}, Communal Prayers, Prayer for Israeli Soldiers`,
        `${ASH_SH}, Communal Prayers, Prayer for Those Being Held in Captivity`,
      ],
    }),
  },
  {
    id: "musaf",
    group: "musaf",
    en: "Musaf Amidah",
    he: "מוסף",
    hint: "The additional Shabbat standing prayer, recalling the extra offering. Orthodox Saturday morning includes it; many modern Reform congregations omit it.",
    defaultOn: (f) =>
      f.day === "shabbat" && f.service === "shacharit_musaf" && f.movement !== "reform",
    available: (f) => f.day === "shabbat",
    resolve: (f) => {
      if (f.nusach === "edot_hamizrach") {
        return { ref: "Siddur Edot HaMizrach, Shabbat Mussaf, Amida" };
      }
      return { ref: MUSAF_AMIDAH[0], extraRefs: MUSAF_AMIDAH.slice(1) };
    },
  },
  {
    id: "ashrei_end",
    group: "concluding",
    en: "Ashrei (closing)",
    he: "אשרי",
    hint: "Repeated before the Torah is returned, or before Uva l'Tzion on weekdays.",
    defaultOn: (f) => isOrthodox(f),
    resolve: (f) => ({
      ref: pickRef(f, {
        edot: f.day === "shabbat" ? `${EDOT_SH}, Ashrei` : `${EDOT_WD}, Ashrei`,
        sefard: `${SEF_WD}, Ashrei`,
        ash: f.day === "shabbat" ? `${ASH_SH}, Ashrei` : `${ASH_WD}, Concluding Prayers, Ashrei`,
      }),
    }),
  },
  {
    id: "uva_letzion",
    group: "concluding",
    en: "Uva l'Tzion",
    he: "ובא לציון",
    hint: "Weekday concluding kedushah. Not part of a typical Reform Saturday morning.",
    defaultOn: (f) => f.day === "weekday" && isOrthodox(f),
    available: (f) => f.day === "weekday",
    resolve: (f) => ({
      ref: pickRef(f, {
        edot: `${EDOT_WD}, Uva LeSion`,
        ash: `${ASH_WD}, Concluding Prayers, Uva Letzion`,
      }),
    }),
  },
  {
    id: "ein_kelohenu",
    group: "concluding",
    en: "Ein kelohenu",
    he: "אין כאלהינו",
    hint: "Often sung at the end of Shabbat morning, in Orthodox and Reform rooms alike.",
    defaultOn: (f) => f.day === "shabbat",
    available: (f) => f.day === "shabbat",
    resolve: () => ({
      ref: `${ASH_MUSAF}, Ein Keloheinu`,
    }),
  },
  {
    id: "song_of_day",
    group: "concluding",
    en: "Song of the day",
    he: "שיר של יום",
    hint: "The Levitical psalm for this day of the week.",
    defaultOn: (f) => isOrthodox(f),
    resolve: (f) => ({
      ref: pickRef(f, {
        edot: `${EDOT_WD}, Song of the Day`,
        sefard: `${SEF_WD}, Song of the Day`,
        ash: `${ASH_WD}, Concluding Prayers, Song of the Day`,
      }),
    }),
  },
  {
    id: "kaveh",
    group: "concluding",
    en: "Kaveh el Hashem",
    he: "קוה אל ה'",
    hint: "A Sefardic closing passage of hope.",
    defaultOn: (f) => isSefardi(f) && isOrthodox(f),
    available: (f) => isSefardi(f),
    resolve: (f) => ({
      ref: pickRef(f, {
        edot: `${EDOT_WD}, Kaveh`,
        sefard: `${SEF_WD}, Kaveh`,
      }),
    }),
  },
  {
    id: "aleinu",
    group: "concluding",
    en: "Aleinu",
    he: "עלינו",
    hint: "Closes almost every service, across movements.",
    defaultOn: () => true,
    resolve: (f) => ({
      ref: pickRef(f, {
        edot: `${EDOT_WD}, Alenu`,
        sefard: `${SEF_WD}, Aleinu`,
        ash:
          f.day === "shabbat"
            ? `${ASH_MUSAF}, Alenu`
            : `${ASH_WD}, Concluding Prayers, Alenu`,
      }),
    }),
  },
  {
    id: "kaddish_yatom",
    group: "concluding",
    en: "Mourner's Kaddish",
    he: "קדיש יתום",
    hint: "With a minyan. In Reform, often said by the whole room.",
    defaultOn: (f) => wantsMinyan(f) || f.movement === "reform",
    resolve: (f) => ({
      ref:
        f.day === "shabbat"
          ? `${ASH_MUSAF}, Mourner's Kaddish`
          : `${ASH_WD}, Concluding Prayers, Mourner's Kaddish`,
    }),
  },
  {
    id: "adon_olam_close",
    group: "concluding",
    en: "Adon Olam (closing)",
    he: "אדון עולם",
    hint: "Closing hymn. Many Reform Saturday mornings end here, often with a choir or instruments.",
    defaultOn: (f) => f.movement === "reform" || f.day === "shabbat",
    resolve: () => ({
      ref: `${ASH_MUSAF}, Adon Olam`,
    }),
  },
];

export const PRACTICE_OPTIONS = [
  {
    id: "head_covering",
    en: "Head covering expected",
    hint: "Kippah / other covering for those leading or for the whole room.",
  },
  {
    id: "tallit_all_genders",
    en: "Tallit offered to all genders",
    hint: "Common in modern Reform; uncommon in a Sefardic kollel.",
  },
  {
    id: "mechitza",
    en: "Separate seating / mechitzah",
    hint: "Orthodox kollel default; never in Reform.",
  },
  {
    id: "mixed_seating",
    en: "Mixed seating",
    hint: "Standard in Reform and Conservative sanctuaries.",
  },
  {
    id: "instruments",
    en: "Musical instruments on this day",
    hint: "A live limit-case: forbidden in Orthodox Shabbat, ordinary in Reform Saturday.",
  },
  {
    id: "choir",
    en: "Choir or songleader",
    hint: "Shaped Saturday morning in Reform; rare in a kollel shacharit.",
  },
  {
    id: "responsive",
    en: "Responsive English reading",
    hint: "Call-and-response in the vernacular.",
  },
  {
    id: "imahot",
    en: "Name the matriarchs in the Amidah",
    hint: "A widely used modern addition. Traditional Sefardic and Ashkenaz texts on Sefaria do not include it; we mark the place.",
  },
  {
    id: "sit_shema",
    en: "Sit for the Shema",
    hint: "Reform custom; Orthodox typically remain in the posture of the blessings.",
  },
  {
    id: "full_kavanot",
    en: "Kabbalistic kavanot / leshem yichud",
    hint: "Spoken intentions before mitzvot, expected in a Sefardic kollel.",
  },
];

export const PRESETS = {
  sefardi_kollel: {
    label: "Orthodox Sefardic kollel",
    lede: "Weekday Shacharit at full volume: tefillin, korbanot, Petichat Eliyahu, vidui, and the Edot HaMizrach rite.",
    facts: {
      community: "Sefardic Kollel",
      day: "weekday",
      weekday: "mon",
      service: "shacharit",
      movement: "orthodox",
      nusach: "edot_hamizrach",
      setting: "kollel",
      minyan: "yes",
      land: "israel",
      who: "man",
      language: "he",
      practice: ["head_covering", "mechitza", "full_kavanot"],
    },
  },
  reform_shabbat: {
    label: "Modern Reform Saturday",
    lede: "Shabbat morning in a mixed, musical sanctuary: abbreviated pesukei d'zimra, full Shema, no Musaf, Torah at the center.",
    facts: {
      community: "A modern Reform synagogue",
      day: "shabbat",
      weekday: "",
      service: "shacharit",
      movement: "reform",
      nusach: "reform",
      setting: "synagogue",
      minyan: "yes",
      land: "diaspora",
      who: "mixed",
      language: "both",
      practice: [
        "tallit_all_genders",
        "mixed_seating",
        "instruments",
        "choir",
        "responsive",
        "imahot",
        "sit_shema",
      ],
    },
  },
};

export function emptyFacts() {
  return {
    community: "",
    day: "",
    weekday: "",
    service: "",
    movement: "",
    nusach: "",
    setting: "",
    minyan: "",
    land: "",
    who: "",
    language: "both",
    practice: [],
    modules: {},
  };
}

export function applyPreset(id) {
  const preset = PRESETS[id];
  if (!preset) return emptyFacts();
  const facts = { ...emptyFacts(), ...preset.facts, preset: id };
  facts.modules = defaultModules(facts);
  return facts;
}

export function defaultModules(facts) {
  const modules = {};
  for (const mod of MODULES) {
    if (mod.available && !mod.available(facts)) {
      modules[mod.id] = false;
      continue;
    }
    modules[mod.id] = Boolean(mod.defaultOn(facts));
  }
  return modules;
}

export const QUESTIONS = [
  {
    id: "start",
    title: "How should we begin?",
    lede: "Two opposite rooms, or a path of questions. Weekday Shacharit is the spine; Saturday morning is the stress test.",
    type: "choice",
    options: [
      {
        id: "guided",
        en: "Ask me",
        hint: "A forking series of ritual choices, then a checklist.",
      },
      {
        id: "sefardi_kollel",
        en: PRESETS.sefardi_kollel.label,
        hint: PRESETS.sefardi_kollel.lede,
      },
      {
        id: "reform_shabbat",
        en: PRESETS.reform_shabbat.label,
        hint: PRESETS.reform_shabbat.lede,
      },
      {
        id: "library",
        en: "Open a saved siddur",
        hint: "Load one you gathered earlier, from this browser or a file.",
      },
    ],
  },
  {
    id: "community",
    title: "Whose siddur is this?",
    lede: "A name for the cover. You can leave it blank.",
    type: "text",
    placeholder: "e.g. Kollel Beit Yosef, or Temple Emanu-El",
    field: "community",
    skipIfPreset: true,
  },
  {
    id: "day",
    title: "When is the service?",
    lede: "Shacharit changes shape between a weekday and Shabbat. Festivals can come later.",
    type: "choice",
    field: "day",
    options: [
      {
        id: "weekday",
        en: "Weekday",
        hint: "Ordinary morning: tefillin, 19-blessing Amidah, tachanun or vidui.",
      },
      {
        id: "shabbat",
        en: "Shabbat / Saturday",
        hint: "No tefillin, seven-blessing Amidah, Torah at the center of synagogue life.",
      },
    ],
  },
  {
    id: "weekday",
    title: "Which weekday?",
    lede: "Monday and Thursday add a Torah reading when there is a minyan. The song of the day also changes.",
    type: "choice",
    field: "weekday",
    showIf: (f) => f.day === "weekday",
    options: [
      { id: "sun", en: "Sunday", hint: "Psalm 24." },
      { id: "mon", en: "Monday", hint: "Torah reading with a minyan. Psalm 48." },
      { id: "tue", en: "Tuesday", hint: "Psalm 82." },
      { id: "wed", en: "Wednesday", hint: "Psalm 94." },
      { id: "thu", en: "Thursday", hint: "Torah reading with a minyan. Psalm 81." },
      { id: "fri", en: "Friday", hint: "Psalm 93." },
    ],
  },
  {
    id: "service",
    title: "Which service?",
    lede: "This builder starts with Shacharit. Musaf is the extra Shabbat standing prayer.",
    type: "choice",
    field: "service",
    options: (f) =>
      f.day === "shabbat"
        ? [
            {
              id: "shacharit",
              en: "Shacharit only",
              hint: "Morning service, ending after Torah / Aleinu. Typical modern Reform Saturday.",
            },
            {
              id: "shacharit_musaf",
              en: "Shacharit and Musaf",
              hint: "The Orthodox Saturday morning shape, with the additional Amidah.",
            },
          ]
        : [
            {
              id: "shacharit",
              en: "Shacharit",
              hint: "The morning service. Mincha and Maariv can be added later.",
            },
          ],
  },
  {
    id: "movement",
    title: "What kind of community?",
    lede: "This is the largest fork: it decides what is thinkable before you touch a single checkbox.",
    type: "choice",
    field: "movement",
    options: [
      {
        id: "orthodox",
        en: "Orthodox",
        hint: "Received rite, full text, minyan rules in force.",
      },
      {
        id: "conservative",
        en: "Conservative / Masorti",
        hint: "Traditional structure with some egalitarian and modern additions.",
      },
      {
        id: "reform",
        en: "Reform",
        hint: "Vernacular, musical, abbreviated pesukei d'zimra, Torah-forward on Saturday.",
      },
      {
        id: "reconstructionist",
        en: "Reconstructionist",
        hint: "Peoplehood-centered, often highly adapted; we start from an Ashkenaz skeleton.",
      },
      {
        id: "independent",
        en: "Independent / unaffiliated",
        hint: "You will do the choosing. We only set gentle defaults.",
      },
    ],
  },
  {
    id: "nusach",
    title: "Which rite (nusach)?",
    lede: "The words themselves. Sefardic Edot HaMizrach is not Nusach Sefard (Hasidic), and neither is Reform.",
    type: "choice",
    field: "nusach",
    showIf: (f) => f.movement !== "reform",
    options: (f) => {
      const core = [
        {
          id: "ashkenaz",
          en: "Ashkenaz",
          hint: "Central and Western European rite. The most finely structured tree on Sefaria.",
        },
        {
          id: "sefard",
          en: "Nusach Sefard",
          hint: "Hasidic rite: Ashkenaz bones with Lurianic and Sefardic insertions.",
        },
        {
          id: "edot_hamizrach",
          en: "Edot HaMizrach",
          hint: "Iraqi / Sefardic-Mizrahi rite. The kollel test case.",
        },
        {
          id: "ari",
          en: "Nusach Ari (Chabad)",
          hint: "Open texts are sparse; we fall back to Nusach Sefard with a note.",
        },
      ];
      if (f.movement === "orthodox") return core;
      return core.filter((o) => o.id === "ashkenaz" || o.id === "sefard" || o.id === "edot_hamizrach");
    },
  },
  {
    id: "setting",
    title: "Where is this happening?",
    lede: "A kollel weekday and a cathedral-style Saturday morning do not share a room, even when they share a psalm.",
    type: "choice",
    field: "setting",
    options: [
      { id: "home", en: "Home / private", hint: "No ark, often no minyan." },
      { id: "synagogue", en: "Synagogue", hint: "Public worship, Torah, music or silence." },
      { id: "kollel", en: "Kollel / beit midrash", hint: "Study hall davening, full text, little choreography." },
      { id: "school", en: "School / camp", hint: "Educational pacing, often shortened." },
    ],
  },
  {
    id: "minyan",
    title: "Is there a minyan?",
    lede: "Kaddish, Barchu, repetition, and Torah reading hang on this in Orthodox practice. Reform often sings them anyway.",
    type: "choice",
    field: "minyan",
    options: [
      { id: "yes", en: "Yes", hint: "Ten adults, by the community's own count." },
      { id: "no", en: "No", hint: "Individual prayer. Communal calls become optional notes." },
    ],
  },
  {
    id: "land",
    title: "In the Land of Israel?",
    lede: "Daily priestly blessing is the usual Israeli Orthodox custom; in the diaspora it is reserved for festivals.",
    type: "choice",
    field: "land",
    options: [
      { id: "israel", en: "In Israel", hint: "Birkat kohanim each morning in most Orthodox rooms." },
      { id: "diaspora", en: "Outside Israel", hint: "Priestly blessing on festivals, not weekdays." },
    ],
  },
  {
    id: "who",
    title: "Who is in the room?",
    lede: "This changes Modeh/Modah, tallit and tefillin defaults, and whether the service is framed as mixed.",
    type: "choice",
    field: "who",
    options: [
      { id: "man", en: "Men / masculine davener", hint: "Traditional kollel default." },
      { id: "woman", en: "Women / feminine davener", hint: "Tefillin default off in Orthodox; tallit often on elsewhere." },
      { id: "mixed", en: "Mixed congregation", hint: "The Reform Saturday default." },
      { id: "unspecified", en: "Prefer not to say", hint: "Neutral rubrics." },
    ],
  },
  {
    id: "language",
    title: "What should the page show?",
    lede: "Hebrew from Sefaria, and English translation when a real translation exists. Transliteration is never shown.",
    type: "choice",
    field: "language",
    options: [
      { id: "he", en: "Hebrew", hint: "The kollel page." },
      { id: "en", en: "English", hint: "Translation only — no transliteration." },
      { id: "both", en: "Hebrew and English", hint: "Facing columns. Never a Latin-letter stand-in for the Hebrew." },
    ],
  },
  {
    id: "practice",
    title: "How does this room behave?",
    lede: "Not every ritual choice is a paragraph of text. These notes print on the cover.",
    type: "multi",
    field: "practice",
    options: PRACTICE_OPTIONS.map((o) => ({ id: o.id, en: o.en, hint: o.hint })),
  },
  {
    id: "modules",
    title: "Build the order of service",
    lede: "Defaults follow your answers. Uncheck to omit, check to restore. This is the last fork before the pages are gathered.",
    type: "modules",
  },
];

export function visibleQuestions(facts) {
  return QUESTIONS.filter((q) => {
    if (q.skipIfPreset && facts.preset) return false;
    if (q.showIf && !q.showIf(facts)) return false;
    if (q.id === "nusach" && facts.movement === "reform") return false;
    return true;
  });
}

export function optionsFor(question, facts) {
  const opts = question.options;
  if (typeof opts === "function") return opts(facts);
  return opts || [];
}

export function afterAnswer(facts, questionId, value) {
  const next = { ...facts, practice: [...(facts.practice || [])] };
  const q = QUESTIONS.find((item) => item.id === questionId);

  if (questionId === "start") {
    if (value === "sefardi_kollel" || value === "reform_shabbat") {
      return applyPreset(value);
    }
    return emptyFacts();
  }

  if (q?.type === "multi") {
    next[q.field] = value;
  } else if (q?.field) {
    next[q.field] = value;
  }

  if (questionId === "movement" && value === "reform") {
    next.nusach = "reform";
  }

  if (questionId === "day" && value === "shabbat") {
    next.weekday = "";
  }

  const structural = [
    "day",
    "weekday",
    "service",
    "movement",
    "nusach",
    "setting",
    "minyan",
    "land",
    "who",
  ];
  if (structural.includes(questionId)) {
    next.modules = defaultModules(next);
  }
  return next;
}

export function compile(facts) {
  const selected = MODULES.filter((mod) => {
    if (mod.available && !mod.available(facts)) return false;
    return Boolean(facts.modules?.[mod.id]);
  });

  const items = [];
  for (const mod of selected) {
    const resolved = mod.resolve(facts) || {};
    const refs = [resolved.ref, ...(resolved.extraRefs || [])].filter(Boolean);
    const key = `${resolved.calendar || ""}|${refs.join("|")}|${resolved.rubric || ""}`;
    const last = items[items.length - 1];
    if (last && last.mergeKey === key && key !== "||") {
      last.titlesEn.push(mod.en);
      last.titlesHe.push(mod.he);
      last.ids.push(mod.id);
      continue;
    }
    items.push({
      ids: [mod.id],
      group: mod.group,
      titlesEn: [mod.en],
      titlesHe: [mod.he],
      hint: mod.hint,
      refs,
      calendar: resolved.calendar || null,
      rubric: resolved.rubric || "",
      sourceLabel: resolved.sourceLabel || "Sefaria",
      mergeKey: key,
    });
  }
  return items;
}

export function serviceTitle(facts) {
  const day =
    facts.day === "shabbat"
      ? "Shabbat morning"
      : facts.weekday
        ? weekdayName(facts.weekday) + " morning"
        : "Weekday morning";
  const svc = facts.service === "shacharit_musaf" ? "Shacharit & Musaf" : "Shacharit";
  return `${day} · ${svc}`;
}

export function weekdayName(id) {
  return (
    {
      sun: "Sunday",
      mon: "Monday",
      tue: "Tuesday",
      wed: "Wednesday",
      thu: "Thursday",
      fri: "Friday",
    }[id] || "Weekday"
  );
}

export function nusachLabel(id) {
  return (
    {
      ashkenaz: "Nusach Ashkenaz",
      sefard: "Nusach Sefard",
      edot_hamizrach: "Edot HaMizrach",
      ari: "Nusach Ari (via Sefard)",
      reform: "Reform practice (Ashkenaz-derived open texts)",
    }[id] || id
  );
}

export function movementLabel(id) {
  return (
    {
      orthodox: "Orthodox",
      conservative: "Conservative / Masorti",
      reform: "Reform",
      reconstructionist: "Reconstructionist",
      independent: "Independent",
    }[id] || id
  );
}

export function coverNotes(facts) {
  const notes = [];
  if (facts.nusach === "ari") {
    notes.push(
      "Nusach Ari as a separate open tree is thin on Sefaria; wording is drawn from Nusach Sefard."
    );
  }
  if (facts.movement === "reform") {
    notes.push(
      "Modern Reform congregations often pray from Mishkan T'filah, which is not open-licensed. This compilation follows a typical Saturday-morning shape with public-domain and CC-licensed texts from Sefaria and Tanakh."
    );
  }
  if (facts.practice?.includes("imahot")) {
    notes.push(
      "The matriarchs are named in many contemporary Amidahs. The open Sefaria siddurim still print the received Avot; mark the insertion at the first blessing."
    );
  }
  if (facts.land === "israel" && isOrthodox(facts)) {
    notes.push("In Israel, the priestly blessing is customarily included in the weekday repetition.");
  }
  if (facts.day === "shabbat" && facts.practice?.includes("instruments")) {
    notes.push("Instruments on Shabbat: ordinary here, and a boundary for Orthodox practice.");
  }
  return notes;
}
