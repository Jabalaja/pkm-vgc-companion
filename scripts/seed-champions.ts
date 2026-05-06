import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { runInNewContext } from "node:vm";

import { toShowdownId } from "../convex/lib/showdownId";

// Source of truth: Showdown format `gen9vgc2026regulationm` in formats.js.
// Update SHOWDOWN_CHAMPIONS_FORMAT_ID when Champions moves to the next regulation.
const SHOWDOWN_CHAMPIONS_FORMAT_ID = "gen9vgc2026regulationm";

type ShowdownItemEntry = {
  isNonstandard?: string;
};

type ShowdownPokedexEntry = {
  isNonstandard?: string;
};

type ShowdownFormat = {
  id?: string;
  name?: string;
  ruleset?: string[];
  banlist?: string[];
  restricted?: string[];
  unbanlist?: string[];
};

const SHOWDOWN_BASE_URL = "https://play.pokemonshowdown.com/data";

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${SHOWDOWN_BASE_URL}/${path}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`);
  }
  return (await response.json()) as T;
}

async function fetchText(path: string): Promise<string> {
  const response = await fetch(`${SHOWDOWN_BASE_URL}/${path}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`);
  }
  return await response.text();
}

function parseFormats(source: string): ShowdownFormat[] {
  const sandbox = { exports: {} as { Formats?: ShowdownFormat[] } };
  runInNewContext(source, sandbox);
  const formats = sandbox.exports.Formats;
  if (!Array.isArray(formats)) {
    throw new Error("Could not parse formats.js exports.Formats");
  }
  return formats;
}

function isObtainable(value: { isNonstandard?: string }) {
  return (
    value.isNonstandard !== "Past" && value.isNonstandard !== "Unobtainable"
  );
}

function getFormatId(format: ShowdownFormat) {
  if (format.id) {
    return toShowdownId(format.id);
  }
  if (format.name) {
    return toShowdownId(format.name);
  }
  return "";
}

function collectFormatRules(
  allFormats: ShowdownFormat[],
  formatId: string,
): {
  banlist: string[];
  restricted: string[];
} {
  const formatById = new Map(
    allFormats
      .map((format) => [getFormatId(format), format] as const)
      .filter(([id]) => id.length > 0),
  );
  const visited = new Set<string>();
  const banlist = new Set<string>();
  const restricted = new Set<string>();

  function visit(id: string) {
    if (visited.has(id)) {
      return;
    }
    visited.add(id);
    const format = formatById.get(id);
    if (!format) {
      return;
    }
    for (const nestedRule of format.ruleset ?? []) {
      visit(toShowdownId(nestedRule));
    }
    for (const token of format.banlist ?? []) {
      banlist.add(token);
    }
    for (const token of format.restricted ?? []) {
      restricted.add(token);
    }
    for (const token of format.unbanlist ?? []) {
      banlist.delete(token);
    }
  }

  if (!formatById.has(formatId)) {
    throw new Error(`Format "${formatId}" was not found in formats.js`);
  }
  visit(formatId);

  return { banlist: [...banlist], restricted: [...restricted] };
}

function extractTokenId(
  token: string,
  expectedPrefix: "item" | "pokemon",
): string | null {
  const trimmed = token.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const separatorIndex = trimmed.indexOf(":");
  if (separatorIndex < 0) {
    return toShowdownId(trimmed);
  }

  const prefix = trimmed.slice(0, separatorIndex).trim().toLowerCase();
  if (prefix !== expectedPrefix) {
    return null;
  }

  return toShowdownId(trimmed.slice(separatorIndex + 1));
}

export function deriveLegalSpecies(
  pokedex: Record<string, ShowdownPokedexEntry>,
  rules: { banlist: string[]; restricted: string[] },
): string[] {
  const obtainable = new Set(
    Object.entries(pokedex)
      .filter(([, entry]) => isObtainable(entry))
      .map(([speciesId]) => speciesId),
  );

  const banned = new Set(
    rules.banlist
      .map((token) => extractTokenId(token, "pokemon"))
      .filter((speciesId): speciesId is string => {
        return speciesId !== null && obtainable.has(speciesId);
      }),
  );

  const legal = new Set(
    [...obtainable].filter((speciesId) => !banned.has(speciesId)),
  );

  for (const token of rules.restricted) {
    const speciesId = extractTokenId(token, "pokemon");
    if (speciesId && obtainable.has(speciesId)) {
      legal.add(speciesId);
    }
  }

  return [...legal].sort();
}

export function deriveLegalItems(
  items: Record<string, ShowdownItemEntry>,
  rules: { banlist: string[] },
): string[] {
  const obtainable = new Set(
    Object.entries(items)
      .filter(([, entry]) => isObtainable(entry))
      .map(([itemId]) => itemId),
  );
  const banned = new Set(
    rules.banlist
      .map((token) => extractTokenId(token, "item"))
      .filter(
        (itemId): itemId is string => itemId !== null && obtainable.has(itemId),
      ),
  );

  return [...obtainable].filter((itemId) => !banned.has(itemId)).sort();
}

function getDeploymentName(deploymentUrl: string) {
  const hostname = new URL(deploymentUrl).hostname;
  const deployment = hostname.split(".")[0];
  if (!deployment) {
    throw new Error(`Could not infer deployment name from ${deploymentUrl}`);
  }
  return deployment;
}

async function main() {
  const deploymentUrl = process.env.VITE_CONVEX_URL;
  const deployKey = process.env.CONVEX_DEPLOY_KEY;

  if (!deploymentUrl) {
    throw new Error("VITE_CONVEX_URL is required");
  }

  if (!deployKey) {
    throw new Error("CONVEX_DEPLOY_KEY is required for seeding");
  }

  const [pokedex, items, formatsSource] = await Promise.all([
    fetchJson<Record<string, ShowdownPokedexEntry>>("pokedex.json"),
    fetchJson<Record<string, ShowdownItemEntry>>("items.json"),
    fetchText("formats.js"),
  ]);
  const rules = collectFormatRules(
    parseFormats(formatsSource),
    SHOWDOWN_CHAMPIONS_FORMAT_ID,
  );

  const legalSpecies = deriveLegalSpecies(pokedex, rules);
  const legalItems = deriveLegalItems(items, rules);

  execFileSync(
    "pnpm",
    [
      "exec",
      "convex",
      "run",
      "seed:seedChampionsRegulation",
      JSON.stringify({ legalSpecies, legalItems }),
      "--deployment",
      getDeploymentName(deploymentUrl),
    ],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        CONVEX_DEPLOY_KEY: deployKey,
      },
    },
  );

  console.log(
    `Seeded ${legalSpecies.length} legal species, ${legalItems.length} legal items`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
