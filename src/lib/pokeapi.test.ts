import {
  type PokeApiPokemon,
  fetchPokemonBySlug,
  showdownToPokeapiSlug,
} from "@/lib/pokeapi";
import { afterEach, describe, expect, it, vi } from "vitest";

const pokemonFixture: PokeApiPokemon = {
  id: 6,
  name: "charizard",
  sprites: {
    front_default: "https://example.com/front.png",
  },
  types: [{ type: { name: "fire" } }],
  abilities: [{ ability: { name: "blaze" }, is_hidden: false }],
  stats: [{ base_stat: 78, stat: { name: "hp" } }],
};

describe("showdownToPokeapiSlug", () => {
  it("maps known special forms", () => {
    expect(showdownToPokeapiSlug("charizardmegax")).toBe("charizard-mega-x");
    expect(showdownToPokeapiSlug("urshifurapidstrike")).toBe(
      "urshifu-rapid-strike",
    );
    expect(showdownToPokeapiSlug("raichualola")).toBe("raichu-alola");
  });
});

describe("fetchPokemonBySlug", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("caches in-flight and resolved requests by normalized slug", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify(pokemonFixture), { status: 200 }),
      );

    const [first, second] = await Promise.all([
      fetchPokemonBySlug("charizardmegax"),
      fetchPokemonBySlug("charizardmegax"),
    ]);

    expect(first.name).toBe("charizard");
    expect(second.name).toBe("charizard");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws a clear error on non-OK responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Not Found", {
        status: 404,
        statusText: "Not Found",
      }),
    );

    await expect(fetchPokemonBySlug("missingno")).rejects.toThrowError(
      'Failed to load Pokémon data for "missingno" (404 Not Found)',
    );
  });
});
