/**
 * A primary-time map for browsing all 613 mitzvot.
 *
 * This is intentionally a learning aid, not a ruling on practical obligation.
 * Each mitzvah receives one primary rhythm so the collection remains a true
 * partition and every item is visible exactly once.
 */

export const RHYTHMS = [
  {
    id: "daily",
    name: "Any day",
    short: "Day",
    description: "Practices and choices that can shape an ordinary day.",
    color: "#b86a32",
  },
  {
    id: "weekly",
    name: "Each week",
    short: "Week",
    description: "Shabbat: preparation, rest, words, and sacred service.",
    color: "#7c6650",
  },
  {
    id: "monthly",
    name: "Each month",
    short: "Month",
    description: "New-month observance and the recurring laws of niddah.",
    color: "#567b87",
  },
  {
    id: "yearly",
    name: "Each year",
    short: "Year",
    description: "Festivals, fasts, offerings, and the annual Torah cycle.",
    color: "#987142",
  },
  {
    id: "life",
    name: "Life moments",
    short: "Life",
    description: "Birth, family, marriage, vocation, loss, and inheritance.",
    color: "#865b6d",
  },
  {
    id: "cycles",
    name: "Long cycles",
    short: "Cycles",
    description: "Tithing cycles, shemitah, Hakhel, and the Jubilee.",
    color: "#62744a",
  },
  {
    id: "occasion",
    name: "As needed",
    short: "Occasion",
    description: "Mitzvot activated by a case, place, role, or event.",
    color: "#59616d",
  },
];

const MULTI_YEAR = [
  "seventh year",
  "sabbatical",
  "jubilee",
  "seven cycles",
  "release all of his loans",
  "claim a debt that the seventh year",
  "first tithe",
  "second tithe",
  "great tithe",
  "poor tithe",
  "tithe of pure beasts",
  "tithe of beasts",
  "declaration of tithes",
  "gather all of israel",
];

const YEARLY = [
  "pesach",
  "chamets",
  "matsah",
  "omer",
  "shavuot",
  "rosh hashanah",
  "tishrei",
  "yom kippur",
  "sukkot",
  "sukkah",
  "lulav",
  "shemini atseret",
  "festival",
  "festive sacrifice",
  "first fruits",
  "half shekel during the year",
  "tithe of pure beasts every year",
  "pesach sheni",
  "fourteenth of iyar",
];

const WEEKLY = ["shabbat"];
const MONTHLY = ["new month", "each and every month", "menstruant", "niddah"];

const LIFE = [
  "procreation",
  "circumcise",
  "father and mother",
  "parent",
  "woman who has given birth",
  "marry",
  "marriage",
  "wife",
  "husband",
  "divorce",
  "groom",
  "widow",
  "levirate",
  "inheritance",
  "firstborn of a man",
  "firstborn donkey",
  "buried",
  "bury",
  "the dead",
  "dead body",
  "mourning",
  "relatives",
  "brother",
  "sister",
  "daughter",
  "son",
  "seed to molekh",
  "sexual",
  "intercourse",
  "nakedness",
  "mamzer",
  "eunuch",
  "suspected adulteress",
  "sotah",
  "write a torah scroll",
];

const DAILY = [
  "belief in god",
  "god besides",
  "idolatry",
  "idol",
  "swear",
  "sanctification of the name",
  "profaned among people",
  "love of israel",
  "loving god",
  "loving the stranger",
  "fearing god",
  "walk in the ways",
  "torah study",
  "shema",
  "tefillin",
  "mezuzah",
  "prayer",
  "fringes",
  "bless god after eating",
  "eat",
  "food",
  "drink",
  "meat",
  "milk",
  "blood",
  "fish",
  "fowl",
  "grasshopper",
  "swarming",
  "sciatic nerve",
  "carcass",
  "torn animal",
  "steal",
  "rob",
  "oppress",
  "curse",
  "covet",
  "desire the money",
  "hate",
  "rebuke",
  "avenge",
  "begrudge",
  "neighbor",
  "poor",
  "charity",
  "lend",
  "interest",
  "wage",
  "lost item",
  "burden",
  "stumbling block",
  "weights and measures",
  "just scales",
  "cheat in measures",
  "clothes",
  "wear",
  "hair",
  "beard",
  "tattoo",
  "divine",
  "soothsay",
  "clairvoyance",
  "magic",
  "charm",
  "inquire of the dead",
  "every day",
  "daily",
  "morning and evening",
  "priestly blessing",
];

const YEARLY_LAND = [
  "corner of the field",
  "corner in the field",
  "gleanings",
  "time of the harvesting",
  "corner of the vineyard",
  "peret",
  "laws of produce",
  "seeds of forbidden mixtures",
  "forbidden mixtures in a vineyard",
  "challah",
  "first shearing",
  "fruit trees",
  "work or sow",
];

const DAILY_SERVICE = [
  "arranging lights",
  "burning the incense",
  "lifting of the ashes",
  "fire upon the altar",
  "guard the temple",
  "guarding of the temple",
  "service of the levites",
  "priestly blessing",
  "sanctifying the hands and the feet",
  "bread of display",
];

const DAILY_COMMERCE = [
  "buyer and the seller",
  "returning theft",
  "surety",
  "borrower",
  "guardian",
  "money",
  "bribe",
  "wageworker",
  "weights",
  "measures",
];

const LIFE_JUSTICE = [
  "court",
  "judge",
  "judgment",
  "testif",
  "witness",
  "penalties",
  "liable",
  "justice",
  "cities of refuge",
  "ransom",
  "lash",
  "flogging",
];

const LIFE_PURITY = [
  "impurity",
  "impure",
  "purification",
  "metsora",
  "tsaraat",
  "zav",
  "zavah",
  "red heifer",
  "immersion",
];

const LIFE_SERVICE = [
  "temple",
  "altar",
  "sacrifice",
  "offering",
  "priest",
  "levite",
  "consecrated",
  "sanctuary",
  "choice house",
  "ark",
  "anointing oil",
];

const LIFE_LEADERSHIP = [
  "king",
  "prophet",
  "war",
  "besiege",
  "seven nations",
  "amalek",
  "enticed city",
  "seducer",
  "appoint judges",
  "tribe of levi",
];

const LIFE_EVENTS = [
  "vow",
  "nazirite",
  "hebrew slave",
  "bondwoman",
  "canaanite slave",
  "apprais",
  "dedicat",
  "redeem",
  "redemption",
  "inherit",
  "lost item",
  "pursued",
  "mother bird",
  "parapet",
  "confession",
];

const RARE_CASES = [
  "behead the calf",
  "one of beautiful form",
  "collusive witness",
  "enticed city",
  "red heifer",
  "suspected adulteress",
  "sotah",
  "cities of refuge",
];

const GROUP_RULES = {
  daily: [
    ["Morning", ["morning", "tefillin", "shema"]],
    ["Prayer", ["prayer", "blessing", "god", "name", "swear", "torah study", "sage"]],
    ["Meals", ["eat", "food", "drink", "meat", "milk", "blood", "fish", "fowl", "grain"]],
    ["Work", ["wage", "lend", "interest", "money", "weights", "measures", "steal", "rob"]],
    ["People", ["neighbor", "israel", "poor", "stranger", "oppress", "rebuke", "hate", "avenge"]],
    ["Body", ["clothes", "wear", "hair", "beard", "tattoo", "fringes"]],
    ["Home", ["mezuzah", "stumbling block"]],
    ["Temple day", ["temple", "altar", "incense", "ashes", "levite", "priest"]],
    ["Speech", ["words", "speech", "spy", "false", "curse", "vow"]],
    ["All day", []],
  ],
  weekly: [["Shabbat", []]],
  monthly: [
    ["New moon", ["new month", "each and every month"]],
    ["Niddah", ["menstruant", "niddah"]],
  ],
  yearly: [
    ["Pesach", ["pesach", "chamets", "matsah", "nissan"]],
    ["Omer", ["omer", "new grain", "sixteenth"]],
    ["Shavuot", ["shavuot", "new meal offering"]],
    ["High Holy", ["rosh hashanah", "yom kippur", "tishrei", "shofar"]],
    ["Sukkot", ["sukkot", "sukkah", "lulav", "shemini atseret"]],
    ["Pilgrimage", ["festival", "festive", "first fruits", "vows"]],
    ["Harvest", ["field", "vineyard", "harvest", "produce", "sow", "challah", "shearing"]],
    ["Annual", []],
  ],
  life: [
    ["Birth", ["procreation", "circumcise", "given birth", "firstborn"]],
    ["Parents", ["father", "mother", "parent"]],
    ["Marriage", ["marry", "marriage", "wife", "husband", "groom", "divorce", "levirate"]],
    ["Intimacy", ["nakedness", "sexual", "intercourse", "menstruant", "molekh"]],
    ["Justice", ["court", "judge", "judgment", "testif", "witness", "liable", "justice", "lash", "penalt"]],
    ["Purity", ["impure", "impurity", "purif", "metsora", "tsaraat", "zav", "immer"]],
    ["Vows", ["vow", "nazirite", "oath"]],
    ["Sacred service", ["temple", "altar", "sacrifice", "offering", "priest", "levite", "consecrat", "ark"]],
    ["Leadership", ["king", "prophet", "appoint", "nation", "amalek"]],
    ["Conflict", ["war", "besiege", "pursued", "killer", "seducer"]],
    ["Loss", ["dead", "bury", "mourning", "widow"]],
    ["Legacy", ["inheritance", "torah scroll"]],
    ["Turning points", []],
  ],
  cycles: [
    ["Shemitah", ["seventh year", "sabbatical", "release all", "claim a debt"]],
    ["Tithes", ["tithe", "declaration"]],
    ["Jubilee", ["jubilee", "seven cycles"]],
    ["Hakhel", ["gather all of israel"]],
  ],
  occasion: [
    ["Rare cases", []],
  ],
};

const LABEL_RULES = [
  ["sanctifying the new month", "New Month"],
  ["belief in god", "Know God"],
  ["unification of god", "One God"],
  ["loving god", "Love God"],
  ["fearing god", "Fear God"],
  ["torah study", "Study Torah"],
  ["recitation of shema", "Say Shema"],
  ["tefillin of the arm", "Arm Tefillin"],
  ["tefillin of the head", "Head Tefillin"],
  ["affix a mezuzah", "Place Mezuzah"],
  ["bless god after eating", "Meal Blessing"],
  ["priestly blessing", "Priestly Blessing"],
  ["sanctification of shabbat", "Kiddush"],
  ["rest on shabbat", "Shabbat Rest"],
  ["work on shabbat", "Shabbat Work"],
  ["boundary on shabbat", "Shabbat Boundary"],
  ["procreation", "Have Children"],
  ["circumcise", "Brit Milah"],
  ["sciatic nerve", "Sciatic Nerve"],
  ["disposing of chamets", "Remove Chamets"],
  ["eating matsah", "Eat Matzah"],
  ["recount the exodus", "Tell Exodus"],
  ["resting on the first day of pesach", "Pesach Rest"],
  ["resting on the seventh day of pesach", "Pesach Rest"],
  ["work on the first day of pesach", "Pesach Work"],
  ["work on the seventh day of pesach", "Pesach Work"],
  ["additional sacrifices all of the seven days of pesach", "Pesach Offerings"],
  ["counting the omer", "Count Omer"],
  ["new grain", "New Grain"],
  ["resting from work on the day of shavuot", "Shavuot Rest"],
  ["work on the day of the holiday of shavuot", "Shavuot Work"],
  ["resting on the day of rosh hashanah", "Rosh Hashanah"],
  ["additional sacrifice on the day of rosh hashanah", "Rosh Offering"],
  ["work on the tenth of tishrei", "Yom Kippur"],
  ["eat and drink on yom kippur", "Yom Kippur"],
  ["resting from work on yom kippur", "Yom Kippur"],
  ["resting on the first day of the holiday of sukkot", "Sukkot Rest"],
  ["work on the first day of the holiday of sukkot", "Sukkot Work"],
  ["additional sacrifice on each day of the seven days of sukkot", "Sukkot Offerings"],
  ["resting from work on the eighth day of sukkot", "Atzeret Rest"],
  ["work on the day of the holiday of shemini atseret", "Atzeret Work"],
  ["taking the lulav", "Take Lulav"],
  ["sitting in a sukkah", "Dwell Sukkah"],
  ["fast on the tenth", "Yom Kippur"],
  ["shofar on rosh", "Hear Shofar"],
  ["regular sacrifices daily", "Daily Offering"],
  ["additional sacrifice of shabbat", "Shabbat Offering"],
  ["write a torah scroll", "Write Torah"],
  ["walk in the ways", "Imitate God"],
  ["charity", "Give Charity"],
  ["return a lost", "Return Lost"],
  ["honor father", "Honor Parents"],
  ["reverence of father", "Revere Parents"],
  ["love of israel", "Love Others"],
  ["fringes", "Wear Tzitzit"],
  ["parapet", "Build Guardrail"],
  ["jubilee", "Jubilee"],
  ["seventh year", "Shemitah"],
  ["gather all of israel", "Hakhel"],
  ["first fruits", "First Fruits"],
  ["poor tithe", "Poor Tithe"],
  ["first tithe", "First Tithe"],
  ["second tithe", "Second Tithe"],
];

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "of",
  "to",
  "not",
  "that",
  "we",
  "one",
  "our",
  "his",
  "her",
  "their",
  "from",
  "with",
  "and",
  "or",
  "in",
  "on",
  "for",
  "be",
  "is",
  "it",
  "this",
  "all",
  "commandment",
  "command",
  "law",
  "matter",
  "practice",
]);

function includesAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

export function assignRhythm(mitzvah) {
  const text = mitzvah.text.toLowerCase();
  let rhythmId = "life";

  if (includesAny(text, MULTI_YEAR)) rhythmId = "cycles";
  else if (includesAny(text, YEARLY)) rhythmId = "yearly";
  else if (includesAny(text, WEEKLY)) rhythmId = "weekly";
  else if (includesAny(text, MONTHLY)) rhythmId = "monthly";
  else if (includesAny(text, LIFE)) rhythmId = "life";
  else if (includesAny(text, DAILY)) rhythmId = "daily";
  else if (includesAny(text, RARE_CASES)) rhythmId = "occasion";
  else if (includesAny(text, YEARLY_LAND)) rhythmId = "yearly";
  else if (includesAny(text, DAILY_SERVICE)) rhythmId = "daily";
  else if (includesAny(text, DAILY_COMMERCE)) rhythmId = "daily";
  else if (includesAny(text, LIFE_JUSTICE)) rhythmId = "life";
  else if (includesAny(text, LIFE_PURITY)) rhythmId = "life";
  else if (includesAny(text, LIFE_SERVICE)) rhythmId = "life";
  else if (includesAny(text, LIFE_LEADERSHIP)) rhythmId = "life";
  else if (includesAny(text, LIFE_EVENTS)) rhythmId = "life";

  const groups = GROUP_RULES[rhythmId];
  const group = groups.find(([, terms]) => terms.length === 0 || includesAny(text, terms));
  return { rhythmId, rhythmGroup: group[0] };
}

export function makeShortName(text) {
  const lower = text.toLowerCase();
  const special = LABEL_RULES.find(([needle]) => lower.includes(needle));
  if (special) return special[1];

  const cleaned = lower
    .replace(/^the (negative )?commandment (of|to) /, "")
    .replace(/^(that|to) (we )?(should )?not /, "")
    .replace(/^not to /, "")
    .replace(/^the law of /, "")
    .replace(/[“”"'.,:;()[\]]/g, " ");

  const words = cleaned
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !STOP_WORDS.has(word))
    .slice(0, 2);

  return words.map((word) => word[0].toUpperCase() + word.slice(1)).join(" ") || "Mitzvah";
}

export function enrichWithRhythm(mitzvot) {
  return mitzvot.map((mitzvah) => ({
    ...mitzvah,
    ...assignRhythm(mitzvah),
    shortName: makeShortName(mitzvah.text),
  }));
}

export function groupByRhythm(mitzvot) {
  return RHYTHMS.map((rhythm) => ({
    ...rhythm,
    groups: GROUP_RULES[rhythm.id]
      .map(([name]) => ({
        name,
        items: mitzvot
          .filter((mitzvah) => mitzvah.rhythmId === rhythm.id && mitzvah.rhythmGroup === name)
          .sort((a, b) => a.id - b.id),
      }))
      .filter((group) => group.items.length),
  }));
}
