/** Thematic taxonomy + digestible chunking for the 613. */

export const THEMES = [
  {
    id: "god",
    name: "God & faith",
    color: "#6b4c2a",
    blurb: "Belief, unity, love and fear of God, idolatry, oaths, prophecy",
    hubIds: [25, 26, 417, 418, 432, 296],
    keys: [
      "belief in god",
      "besides god",
      "idolatry",
      "idol",
      "molekh",
      "unification of god",
      "loving god",
      "fearing god",
      "sanctification of the name",
      "profaned",
      "swear",
      "prophet",
      "prophecy",
      "false prophet",
      "test a true prophet",
      "walk in the ways",
    ],
  },
  {
    id: "time",
    name: "Shabbat & festivals",
    color: "#2f6f63",
    blurb: "Shabbat, calendar, Pesach, Sukkot, Yom Kippur, and sacred time",
    hubIds: [31, 32, 85, 297, 313, 324],
    keys: [
      "shabbat",
      "pesach",
      "chamets",
      "matsah",
      "sukkot",
      "sukkah",
      "lulav",
      "shavuot",
      "rosh hashanah",
      "yom kippur",
      "tishrei",
      "nissan",
      "omer",
      "festival",
      "new month",
      "shemini atseret",
      "jubilee",
      "seventh year",
      "sabbatical",
    ],
  },
  {
    id: "temple",
    name: "Temple & offerings",
    color: "#8b3f34",
    blurb: "Sanctuary, priests, sacrifices, tithes, and consecrated things",
    hubIds: [95, 99, 185, 440, 254],
    keys: [
      "temple",
      "altar",
      "sacrifice",
      "offering",
      "priest",
      "levite",
      "tithe",
      "terumah",
      "consecrat",
      "burnt offering",
      "sin offering",
      "guilt offering",
      "peace offering",
      "meal offering",
      "incense",
      "ark",
      "choice house",
      "sanctuary",
      "first fruits",
      "firstborn",
      "half shekel",
      "red heifer",
      "nazirite",
      "anointing",
    ],
  },
  {
    id: "food",
    name: "Food & purity",
    color: "#3d5a80",
    blurb: "Kashrut, impurity, metsora, and bodily purity laws",
    hubIds: [153, 175, 92, 147],
    keys: [
      "eat",
      "meat",
      "milk",
      "blood",
      "carcass",
      "swarming",
      "impure",
      "impurity",
      "pure",
      "metsora",
      "tsaraat",
      "niddah",
      "menstruant",
      "zav",
      "semen",
      "immer",
      "fish",
      "fowl",
      "grasshopper",
      "sciatic",
      "limb from the living",
      "torn animal",
      "orlah",
    ],
  },
  {
    id: "family",
    name: "Family & intimacy",
    color: "#7a3d5c",
    blurb: "Marriage, kinship, sexual ethics, parents, and household",
    hubIds: [33, 212, 552, 243],
    keys: [
      "father",
      "mother",
      "nakedness",
      "marry",
      "marriage",
      "wife",
      "divorce",
      "levirate",
      "procreation",
      "circumcise",
      "groom",
      "rapist",
      "adulter",
      "sotah",
      "mamzer",
      "eunuch",
      "intercourse",
      "lay with",
      "bondwoman",
      "hebrew slave",
      "canaanite slave",
    ],
  },
  {
    id: "justice",
    name: "Courts & justice",
    color: "#4a5568",
    blurb: "Judges, testimony, penalties, and fair process",
    hubIds: [235, 491, 122, 78],
    keys: [
      "court",
      "judge",
      "judgment",
      "testify",
      "witness",
      "bribe",
      "penalty",
      "death penalty",
      "strangulation",
      "sword",
      "stone",
      "hang",
      "lash",
      "flogging",
      "collusive",
      "cities of refuge",
      "murder",
      "kill",
      "appoint judges",
    ],
  },
  {
    id: "people",
    name: "Neighbor & society",
    color: "#1f5f52",
    blurb: "Charity, honesty, speech ethics, and care for others",
    hubIds: [243, 479, 66, 239],
    keys: [
      "love of israel",
      "charity",
      "lend",
      "poor",
      "orphan",
      "widow",
      "convert",
      "stranger",
      "neighbor",
      "steal",
      "rob",
      "oppress",
      "wage",
      "lost item",
      "rebuke",
      "hate",
      "avenge",
      "begrudge",
      "spy",
      "whitening",
      "measure",
      "weight",
      "interest",
      "surety",
    ],
  },
  {
    id: "land",
    name: "Land & produce",
    color: "#5c6b3a",
    blurb: "Agriculture, gleanings, mixtures, and the Land of Israel",
    hubIds: [216, 84, 340, 548],
    keys: [
      "field",
      "vineyard",
      "glean",
      "corner",
      "peret",
      "forgotten",
      "sow",
      "plant",
      "harvest",
      "land of israel",
      "jubilee",
      "forbidden mixture",
      "shaatnez",
      "fruit tree",
      "aftergrowth",
      "open areas",
      "walled cities",
    ],
  },
  {
    id: "nation",
    name: "Nation & war",
    color: "#5a4a78",
    blurb: "Kingship, war, Amalek, and communal governance",
    hubIds: [497, 603, 527, 425],
    keys: [
      "king",
      "war",
      "amalek",
      "seven nations",
      "egypt",
      "besiege",
      "pursuer",
      "trumpet",
      "anoint a priest for war",
      "beautiful form",
      "ammonite",
      "moabite",
      "edomite",
    ],
  },
];

export const PILLARS = [
  { id: 25, role: "Belief in God" },
  { id: 417, role: "Unity of God" },
  { id: 418, role: "Love of God" },
  { id: 31, role: "Shabbat" },
  { id: 33, role: "Honor parents" },
  { id: 34, role: "Do not murder" },
  { id: 243, role: "Love of Israel" },
  { id: 235, role: "Judge righteously" },
  { id: 479, role: "Charity" },
  { id: 296, role: "Sanctify the Name" },
];

function scoreTheme(text, theme) {
  const t = text.toLowerCase();
  let score = 0;
  for (const key of theme.keys) {
    if (t.includes(key)) score += key.length > 12 ? 2 : 1;
  }
  return score;
}

export function assignTheme(m) {
  let best = THEMES[THEMES.length - 1];
  let bestScore = -1;
  for (const theme of THEMES) {
    const s = scoreTheme(m.text, theme);
    if (s > bestScore) {
      bestScore = s;
      best = theme;
    }
  }
  // Prefer hub membership
  for (const theme of THEMES) {
    if (theme.hubIds.includes(m.id)) return theme;
  }
  if (bestScore <= 0) {
    // soft fallback by book tendencies
    if (m.book === "Vayikra") return THEMES.find((t) => t.id === "temple") || best;
    if (m.book === "Devarim") return THEMES.find((t) => t.id === "people") || best;
  }
  return best;
}

export function classifyScope(m) {
  const t = m.text.toLowerCase();

  const templeKeys = [
    "temple",
    "altar",
    "burnt offering",
    "sin offering",
    "guilt offering",
    "peace offering",
    "meal offering",
    "sacrifice",
    "sacrifices",
    "incense",
    "choice house",
    "sanctuary",
    "priestly clothes",
    "breastplate",
    "apron",
    "high priest",
    "sprinkle",
    "showbread",
    "bread of display",
    "frankincense",
    "half shekel",
    "red heifer",
    "additional sacrifice",
    "regular sacrifices",
    "daily meal offering",
    "lighting fire on the altar",
    "lifting of the ashes",
    "poles of the ark",
    "carrying the ark",
    "priestly blessing",
    "guard the temple",
    "guarding of the temple",
    "service of the levites",
    "service of yom kippur",
    "enter the temple",
    "enter the entire sanctuary",
    "temple yard",
    "temple mount",
    "first fruits",
    "sotah",
    "suspected adulteress",
    "nazirite",
    "anointing oil",
    "anointing the high priest",
    "lights in the temple",
    "gold altar",
    "consecrated animals",
    "consecrated things",
    "higher level consecrated",
    "lower level consecrated",
    "priestly tithe",
    "great tithe",
    "foreleg, the jaw",
    "first shearing",
    "blemish",
    "unblemished",
    "castrate",
  ];

  const landKeys = [
    "land of israel",
    "in our land",
    "in the land",
    "our land",
    "field in the land",
    "seventh year",
    "jubilee",
    "aftergrowth",
    "corner of the field",
    "corner of the vineyard",
    "glean",
    "peret",
    "forgotten",
    "orlah",
    "fourth year plant",
    "forbidden mixture",
    "sow seeds",
    "vineyard",
    "challah",
    "first tithe",
    "second tithe",
    "poor tithe",
    "tithe of pure beasts",
    "tithe of beasts",
    "cities of refuge",
    "cities within which the levites",
    "open areas of the levites",
    "walled cities",
    "return land",
    "sell a field",
    "releasing of lands",
    "work the land",
    "harvest the aftergrowth",
    "fruit of the trees",
    "dwell in the land of egypt",
    "seven nations",
    "appoint a king",
    "tribe of levi not inherit",
    "new grain",
    "omer of barley",
    "shemit",
    "sabbatical",
    "landmark",
    "behead the calf",
  ];

  let templeOnly = templeKeys.some((k) => t.includes(k));
  let landOnly = landKeys.some((k) => t.includes(k));

  // Temple service lives in the Land — temple ⊂ land
  if (templeOnly) landOnly = true;

  // Agricultural / produce gifts strongly land-bound
  if (
    /\b(terumah|tithe|peah|leket|shichecha|olelot|orlah|shemittah|yovel|kilayim|challah)\b/.test(
      t
    )
  ) {
    landOnly = true;
  }

  return { landOnly, templeOnly };
}

export function enrichMitzvot(mitzvot) {
  return mitzvot.map((m) => {
    const theme = assignTheme(m);
    const scope = classifyScope(m);
    return {
      ...m,
      themeId: theme.id,
      themeName: theme.name,
      themeColor: theme.color,
      landOnly: scope.landOnly,
      templeOnly: scope.templeOnly,
    };
  });
}

export function decadeChunks(mitzvot) {
  const chunks = [];
  for (let start = 1; start <= 613; start += 10) {
    const end = Math.min(613, start + 9);
    const items = mitzvot.filter((m) => m.id >= start && m.id <= end);
    chunks.push({
      id: `d-${start}`,
      start,
      end,
      label: end === start ? `#${start}` : `#${start}–${end}`,
      items,
    });
  }
  return chunks;
}

export function groupByTheme(mitzvot) {
  return THEMES.map((theme) => ({
    ...theme,
    items: mitzvot.filter((m) => m.themeId === theme.id).sort((a, b) => a.id - b.id),
  })).filter((g) => g.items.length);
}
