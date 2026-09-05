/** Nested family / local-tree clustering for the twin-root branching view. */

export const CLUSTER_RULES = {
  god: [
    { id: "faith", label: "Faith & unity", keys: ["belief", "unification", "loving god", "fearing god", "walk in the ways"] },
    { id: "idolatry", label: "Idolatry ban", keys: ["idolatry", "idol", "statue", "molekh", "bow down", "worship"] },
    { id: "speech-god", label: "Oaths & Name", keys: ["swear", "name", "profane", "sanctification of the name"] },
    { id: "prophecy", label: "Prophecy", keys: ["prophet", "prophecy"] },
  ],
  time: [
    { id: "shabbat", label: "Shabbat", keys: ["shabbat"] },
    { id: "pesach", label: "Pesach & matzah", keys: ["pesach", "chamets", "matsah", "exodus"] },
    { id: "sukkot", label: "Sukkot & lulav", keys: ["sukkot", "sukkah", "lulav", "shemini"] },
    { id: "yamim", label: "High holy days", keys: ["rosh hashanah", "yom kippur", "tishrei", "shofar"] },
    { id: "omer", label: "Omer & Shavuot", keys: ["omer", "shavuot"] },
    { id: "calendar", label: "Calendar & jubilee", keys: ["new month", "jubilee", "seventh year", "sabbatical"] },
  ],
  temple: [
    { id: "house", label: "Sanctuary fabric", keys: ["choice house", "temple", "ark", "altar", "sanctuary", "lights"] },
    { id: "offerings", label: "Offerings", keys: ["sacrifice", "offering", "burnt", "sin offering", "guilt", "peace offering", "meal offering"] },
    { id: "priests", label: "Priests & Levites", keys: ["priest", "levite", "breastplate", "anoint", "priestly"] },
    { id: "gifts", label: "Gifts & tithes", keys: ["tithe", "first fruits", "half shekel", "terumah", "shearing", "foreleg"] },
    { id: "purity-service", label: "Service purity", keys: ["impure priest", "enter the temple", "intoxicated", "guard"] },
  ],
  food: [
    { id: "kashrut", label: "Kashrut signs", keys: ["eat", "beast", "fish", "fowl", "swarming", "milk", "blood", "sciatic", "limb"] },
    { id: "tumah", label: "Impurity", keys: ["impure", "impurity", "carcass", "metsora", "tsaraat", "niddah", "zav", "semen", "immer"] },
  ],
  family: [
    { id: "parents", label: "Parents & home", keys: ["father", "mother", "procreation", "circumcise"] },
    { id: "arayot", label: "Forbidden relations", keys: ["nakedness", "intercourse", "lay with", "menstruant"] },
    { id: "marriage", label: "Marriage & divorce", keys: ["marry", "marriage", "divorce", "groom", "levirate", "sotah", "rapist", "mamzer"] },
    { id: "servitude", label: "Bondage & household", keys: ["slave", "bondwoman"] },
  ],
  justice: [
    { id: "courts", label: "Courts & judges", keys: ["court", "judge", "judgment", "bribe", "appoint judges"] },
    { id: "witness", label: "Testimony", keys: ["testify", "witness", "collusive"] },
    { id: "penalties", label: "Penalties", keys: ["death", "stone", "hang", "lash", "flogging", "strangulation", "sword"] },
    { id: "refuge", label: "Refuge & killing", keys: ["refuge", "murder", "kill", "blood"] },
  ],
  people: [
    { id: "charity", label: "Charity & loans", keys: ["charity", "poor", "lend", "interest", "wage", "surety"] },
    { id: "ethics", label: "Neighbor ethics", keys: ["love of israel", "hate", "rebuke", "avenge", "spy", "neighbor", "steal", "rob", "oppress"] },
    { id: "strangers", label: "Stranger & vulnerable", keys: ["convert", "stranger", "orphan", "widow"] },
    { id: "honesty", label: "Honesty in trade", keys: ["measure", "weight", "scales"] },
  ],
  land: [
    { id: "gleanings", label: "Gleanings & gifts", keys: ["corner", "glean", "peret", "forgotten", "field", "vineyard"] },
    { id: "cycles", label: "Sabbatical land", keys: ["seventh year", "jubilee", "aftergrowth", "work the land"] },
    { id: "mixtures", label: "Mixtures & produce", keys: ["mixture", "orlah", "sow", "shaatnez", "challah"] },
    { id: "holding", label: "Land tenure", keys: ["sell a field", "return land", "walled cities", "levites", "landmark"] },
  ],
  nation: [
    { id: "king", label: "Kingship", keys: ["king"] },
    { id: "war", label: "War & siege", keys: ["war", "besiege", "pursuer", "trumpet", "beautiful form"] },
    { id: "nations", label: "Nations & memory", keys: ["amalek", "seven nations", "egypt", "ammonite", "moabite", "edomite"] },
  ],
};

function scoreCluster(text, rule) {
  const t = text.toLowerCase();
  let s = 0;
  for (const k of rule.keys) if (t.includes(k)) s += 1;
  return s;
}

function assignCluster(m, themeId) {
  const rules = CLUSTER_RULES[themeId] || [];
  let best = null;
  let bestScore = 0;
  for (const rule of rules) {
    const s = scoreCluster(m.text, rule);
    if (s > bestScore) {
      bestScore = s;
      best = rule;
    }
  }
  if (best && bestScore > 0) return best;
  return { id: `${themeId}-other`, label: "Related family", keys: [] };
}

/**
 * Split a cluster's leaves into local parsha trees when large.
 */
function localParshaTrees(leaves, parentId) {
  if (leaves.length <= 10) {
    return leaves
      .slice()
      .sort((a, b) => a.id - b.id)
      .map((m) => ({
        id: `m-${m.id}`,
        kind: "leaf",
        label: `#${m.id}`,
        detail: m.text,
        mitzvah: m,
        count: 1,
        children: [],
      }));
  }

  const byParsha = new Map();
  for (const m of leaves) {
    if (!byParsha.has(m.parsha)) byParsha.set(m.parsha, []);
    byParsha.get(m.parsha).push(m);
  }

  const nodes = [];
  for (const [parsha, group] of byParsha) {
    group.sort((a, b) => a.id - b.id);
    if (group.length === 1) {
      const m = group[0];
      nodes.push({
        id: `m-${m.id}`,
        kind: "leaf",
        label: `#${m.id}`,
        detail: m.text,
        mitzvah: m,
        count: 1,
        children: [],
      });
      continue;
    }
    nodes.push({
      id: `${parentId}-p-${parsha}`,
      kind: "local",
      label: parsha,
      detail: `Local tree · ${group.length} mitzvot in ${parsha}`,
      count: group.length,
      children: group.map((m) => ({
        id: `m-${m.id}`,
        kind: "leaf",
        label: `#${m.id}`,
        detail: m.text,
        mitzvah: m,
        count: 1,
        children: [],
      })),
    });
  }
  return nodes.sort((a, b) => {
    const ai = a.mitzvah?.id ?? a.children[0]?.mitzvah?.id ?? 0;
    const bi = b.mitzvah?.id ?? b.children[0]?.mitzvah?.id ?? 0;
    return ai - bi;
  });
}

/**
 * Build the branching tree:
 * Torah → twin trunks (Shabbat / No idolatry) → theme families → clusters → local parsha trees → leaves
 */
export function buildBranchTree(mitzvot, twinRoots, themes) {
  const crown = {
    id: "torah",
    kind: "crown",
    label: "613 Mitzvot",
    detail: "All commandments · branching into one positive and one negative root",
    count: mitzvot.length,
    children: [],
  };

  for (const root of Object.values(twinRoots)) {
    const ofType = mitzvot.filter((m) => m.type === root.type);
    const trunk = {
      id: `trunk-${root.id}`,
      kind: "trunk",
      trunkId: root.id,
      type: root.type,
      label: root.title,
      detail: root.blurb,
      hint: root.hebrewHint,
      rootMitzvahId: root.rootMitzvahId,
      companionIds: root.companionIds,
      count: ofType.length,
      children: [],
    };

    for (const theme of themes) {
      const inTheme = ofType.filter((m) => m.themeId === theme.id);
      if (!inTheme.length) continue;

      const family = {
        id: `fam-${root.id}-${theme.id}`,
        kind: "family",
        label: theme.name,
        detail: theme.blurb,
        color: theme.color,
        count: inTheme.length,
        children: [],
      };

      const buckets = new Map();
      for (const m of inTheme) {
        const cluster = assignCluster(m, theme.id);
        const key = cluster.id;
        if (!buckets.has(key)) {
          buckets.set(key, { ...cluster, items: [] });
        }
        buckets.get(key).items.push(m);
      }

      for (const bucket of buckets.values()) {
        const clusterId = `cl-${root.id}-${theme.id}-${bucket.id}`;
        family.children.push({
          id: clusterId,
          kind: "cluster",
          label: bucket.label,
          detail: `Family cluster · ${bucket.items.length} mitzvot`,
          color: theme.color,
          count: bucket.items.length,
          children: localParshaTrees(bucket.items, clusterId),
        });
      }

      family.children.sort((a, b) => b.count - a.count);
      trunk.children.push(family);
    }

    trunk.children.sort((a, b) => b.count - a.count);
    crown.children.push(trunk);
  }

  return crown;
}

export function countLeaves(node) {
  if (node.kind === "leaf") return 1;
  return (node.children || []).reduce((n, c) => n + countLeaves(c), 0);
}
