import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

import { toShowdownId } from "../convex/lib/showdownId";

// Source of truth: Showdown format `gen9vgc2026regi` in formats.js.
// Update SHOWDOWN_CHAMPIONS_FORMAT_ID when Champions moves to the next regulation.
const SHOWDOWN_CHAMPIONS_FORMAT_ID = "gen9vgc2026regi";
const ENTRY_SEPARATOR_CHARS = new Set([",", " ", "\n", "\r", "\t"]);

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
    throw new Error(
      `Failed to fetch ${path}: ${response.status} ${response.statusText}`,
    );
  }
  return (await response.json()) as T;
}

async function fetchText(path: string): Promise<string> {
  const response = await fetch(`${SHOWDOWN_BASE_URL}/${path}`);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${path}: ${response.status} ${response.statusText}`,
    );
  }
  return await response.text();
}

function unescapeQuotedString(value: string): string {
  return value.replace(/\\'/g, "'").replace(/\\"/g, '"');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractExportObject(source: string, exportName: string): string {
  const assignmentStart = source.search(
    new RegExp(`exports\\.${escapeRegExp(exportName)}\\s*=\\s*\\{`),
  );
  if (assignmentStart < 0) {
    throw new Error(
      `Could not find exports.${exportName} assignment in Showdown source`,
    );
  }

  const openBrace = source.indexOf("{", assignmentStart);
  if (openBrace < 0) {
    throw new Error(`Could not find object opening brace for ${exportName}`);
  }

  let inString: "'" | '"' | null = null;
  let escaped = false;
  let depth = 0;

  for (let i = openBrace; i < source.length; i += 1) {
    const char = source[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === inString) {
        inString = null;
      }
      continue;
    }

    if (char === "'" || char === '"') {
      inString = char;
      continue;
    }
    if (char === "{") {
      depth += 1;
      continue;
    }
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(openBrace, i + 1);
      }
    }
  }

  throw new Error(`Could not find object closing brace for ${exportName}`);
}

function readObjectLiteral(
  source: string,
  startIndex: number,
): {
  value: string;
  endIndex: number;
} {
  if (source[startIndex] !== "{") {
    throw new Error(`Expected object literal at position ${startIndex}`);
  }

  let inString: "'" | '"' | null = null;
  let escaped = false;
  let depth = 0;

  for (let i = startIndex; i < source.length; i += 1) {
    const char = source[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === inString) {
        inString = null;
      }
      continue;
    }

    if (char === "'" || char === '"') {
      inString = char;
      continue;
    }
    if (char === "{") {
      depth += 1;
      continue;
    }
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return {
          value: source.slice(startIndex, i + 1),
          endIndex: i + 1,
        };
      }
    }
  }

  throw new Error("Could not find object literal closing brace");
}

function extractTopLevelObjectEntries(
  objectSource: string,
): Array<{ key: string; valueSource: string }> {
  if (!objectSource.startsWith("{") || !objectSource.endsWith("}")) {
    throw new Error("Expected object source wrapped in braces");
  }

  const entries: Array<{ key: string; valueSource: string }> = [];
  const source = objectSource.slice(1, -1);
  let index = 0;

  while (index < source.length) {
    while (index < source.length && ENTRY_SEPARATOR_CHARS.has(source[index])) {
      index += 1;
    }
    if (index >= source.length) {
      break;
    }

    // Matches either a quoted key (single/double quotes, escaped chars allowed)
    // or an unquoted identifier key.
    const keyMatch = source
      .slice(index)
      .match(
        /^("([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|[A-Za-z0-9_]+)/,
      );
    if (!keyMatch) {
      throw new Error(`Could not parse object key near index ${index}`);
    }
    const rawKey = keyMatch[1];
    const key =
      rawKey.startsWith('"') || rawKey.startsWith("'")
        ? unescapeQuotedString(rawKey.slice(1, -1))
        : rawKey;
    index += rawKey.length;

    while (index < source.length && /\s/.test(source[index])) {
      index += 1;
    }
    if (source[index] !== ":") {
      throw new Error(`Missing ":" after key "${key}"`);
    }
    index += 1;
    while (index < source.length && /\s/.test(source[index])) {
      index += 1;
    }

    const { valueSource, nextIndex } = (() => {
      if (source[index] === "{") {
        const { value, endIndex } = readObjectLiteral(source, index);
        return { valueSource: value, nextIndex: endIndex };
      }

      let endIndex = index;
      let inString: "'" | '"' | null = null;
      let escaped = false;
      while (endIndex < source.length) {
        const char = source[endIndex];
        if (inString) {
          if (escaped) {
            escaped = false;
          } else if (char === "\\") {
            escaped = true;
          } else if (char === inString) {
            inString = null;
          }
          endIndex += 1;
          continue;
        }

        if (char === "'" || char === '"') {
          inString = char;
          endIndex += 1;
          continue;
        }
        if (char === ",") {
          break;
        }
        endIndex += 1;
      }
      return {
        valueSource: source.slice(index, endIndex).trim(),
        nextIndex: endIndex,
      };
    })();

    entries.push({ key: toShowdownId(key), valueSource });
    index = nextIndex;
  }

  return entries;
}

export function parseShowdownItems(
  source: string,
): Record<string, ShowdownItemEntry> {
  const battleItemsObject = extractExportObject(source, "BattleItems");
  const entries = extractTopLevelObjectEntries(battleItemsObject);
  const items: Record<string, ShowdownItemEntry> = {};
  for (const { key, valueSource } of entries) {
    items[key] = {
      isNonstandard: extractStringProperty(valueSource, "isNonstandard"),
    };
  }
  return items;
}

async function fetchShowdownItems(
  path: string,
): Promise<Record<string, ShowdownItemEntry>> {
  const source = await fetchText(path);
  return parseShowdownItems(source);
}

function readQuotedStrings(source: string): string[] {
  const values: string[] = [];
  const pattern = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'/g;
  let match: RegExpExecArray | null = pattern.exec(source);
  while (match) {
    values.push(unescapeQuotedString(match[1] ?? match[2] ?? ""));
    match = pattern.exec(source);
  }
  return values;
}

function extractFormatsArray(source: string): string {
  const assignmentStart = source.search(
    /exports\.(Formats|BattleFormats)\s*=\s*\[/,
  );
  if (assignmentStart < 0) {
    throw new Error("Could not find formats array assignment in formats.js");
  }
  const openBracket = source.indexOf("[", assignmentStart);
  if (openBracket < 0) {
    throw new Error("Could not find formats array opening bracket");
  }

  let inString: "'" | '"' | null = null;
  let escaped = false;
  let depth = 0;
  for (let i = openBracket; i < source.length; i += 1) {
    const char = source[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === inString) {
        inString = null;
      }
      continue;
    }
    if (char === "'" || char === '"') {
      inString = char;
      continue;
    }
    if (char === "[") {
      depth += 1;
      continue;
    }
    if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(openBracket + 1, i);
      }
    }
  }

  throw new Error("Could not find formats array closing bracket");
}

function extractTopLevelObjects(arraySource: string): string[] {
  const objects: string[] = [];
  let inString: "'" | '"' | null = null;
  let escaped = false;
  let depth = 0;
  let objectStart = -1;

  for (let i = 0; i < arraySource.length; i += 1) {
    const char = arraySource[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === inString) {
        inString = null;
      }
      continue;
    }
    if (char === "'" || char === '"') {
      inString = char;
      continue;
    }
    if (char === "{") {
      if (depth === 0) {
        objectStart = i;
      }
      depth += 1;
      continue;
    }
    if (char === "}") {
      depth -= 1;
      if (depth === 0 && objectStart >= 0) {
        objects.push(arraySource.slice(objectStart, i + 1));
        objectStart = -1;
      }
    }
  }

  return objects;
}

function extractStringProperty(
  objectSource: string,
  property: string,
): string | undefined {
  const safeProperty = escapeRegExp(property);
  const pattern = new RegExp(
    `${safeProperty}\\s*:\\s*("([^"\\\\]*(?:\\\\.[^"\\\\]*)*)"|'([^'\\\\]*(?:\\\\.[^'\\\\]*)*)')`,
  );
  const match = objectSource.match(pattern);
  if (!match) {
    return undefined;
  }
  return unescapeQuotedString(match[2] ?? match[3] ?? "");
}

function extractStringArrayProperty(
  objectSource: string,
  property: string,
): string[] | undefined {
  const safeProperty = escapeRegExp(property);
  const pattern = new RegExp(`${safeProperty}\\s*:\\s*\\[([\\s\\S]*?)\\]`);
  const match = objectSource.match(pattern);
  if (!match) {
    return undefined;
  }
  return readQuotedStrings(match[1]);
}

function parseFormats(source: string): ShowdownFormat[] {
  const objects = extractTopLevelObjects(extractFormatsArray(source));
  return objects.map((objectSource) => {
    return {
      id: extractStringProperty(objectSource, "id"),
      name: extractStringProperty(objectSource, "name"),
      ruleset: extractStringArrayProperty(objectSource, "ruleset"),
      banlist: extractStringArrayProperty(objectSource, "banlist"),
      restricted: extractStringArrayProperty(objectSource, "restricted"),
      unbanlist: extractStringArrayProperty(objectSource, "unbanlist"),
    };
  });
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

  const [pokedex, items, formatsSource] = await Promise.all([
    fetchJson<Record<string, ShowdownPokedexEntry>>("pokedex.json"),
    fetchShowdownItems("items.js"),
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
      env: deployKey
        ? {
            ...process.env,
            CONVEX_DEPLOY_KEY: deployKey,
          }
        : process.env,
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
