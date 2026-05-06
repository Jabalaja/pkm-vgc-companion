const POKEAPI_BASE = (
  import.meta.env.VITE_POKEAPI_BASE_URL ?? "https://pokeapi.co/api/v2"
).replace(/\/+$/, "");

type PokeApiSpriteSet = {
  front_default: string | null;
  other?: {
    "official-artwork"?: {
      front_default: string | null;
    };
  };
};

export type PokeApiPokemon = {
  id: number;
  name: string;
  sprites: PokeApiSpriteSet;
  types: Array<{ type: { name: string } }>;
  abilities: Array<{ ability: { name: string }; is_hidden: boolean }>;
  stats: Array<{ base_stat: number; stat: { name: string } }>;
};

const specialCases: Record<string, string> = {
  charizardmegax: "charizard-mega-x",
  charizardmegay: "charizard-mega-y",
  urshifurapidstrike: "urshifu-rapid-strike",
  mrmime: "mr-mime",
  mimejr: "mime-jr",
  porygonz: "porygon-z",
  hooh: "ho-oh",
  typenull: "type-null",
};

export function showdownToPokeapiSlug(input: string): string {
  const normalized = input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]/g, "");

  const specialCase = specialCases[normalized];
  if (specialCase) {
    return specialCase;
  }

  if (normalized.endsWith("megax")) {
    return `${normalized.slice(0, -5)}-mega-x`;
  }

  if (normalized.endsWith("megay")) {
    return `${normalized.slice(0, -5)}-mega-y`;
  }

  if (normalized.endsWith("mega")) {
    return `${normalized.slice(0, -4)}-mega`;
  }

  if (normalized.endsWith("rapidstrike")) {
    return `${normalized.slice(0, -11)}-rapid-strike`;
  }

  for (const region of ["alola", "galar", "hisui", "paldea"]) {
    if (normalized.endsWith(region) && normalized.length > region.length) {
      return `${normalized.slice(0, -region.length)}-${region}`;
    }
  }

  return normalized.replace(/([a-z])(\d)/g, "$1-$2");
}

const pokemonCache = new Map<string, Promise<PokeApiPokemon>>();

export async function fetchPokemonBySlug(
  slug: string,
): Promise<PokeApiPokemon> {
  const normalized = showdownToPokeapiSlug(slug);
  const cached = pokemonCache.get(normalized);
  if (cached) {
    return cached;
  }

  const request = fetch(`${POKEAPI_BASE}/pokemon/${normalized}`).then(
    async (response) => {
      if (!response.ok) {
        throw new Error(
          `Failed to load Pokémon data for "${slug}" (${response.status} ${response.statusText})`,
        );
      }
      return (await response.json()) as PokeApiPokemon;
    },
  );

  pokemonCache.set(normalized, request);

  try {
    return await request;
  } catch (error) {
    pokemonCache.delete(normalized);
    throw error;
  }
}
