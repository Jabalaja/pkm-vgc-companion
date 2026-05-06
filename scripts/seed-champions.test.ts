import { describe, expect, it } from "vitest";

import {
  deriveLegalItems,
  deriveLegalSpecies,
  parseShowdownExportObject,
} from "./seed-champions";

describe("seed-champions helpers", () => {
  it("derives legal species from banlist and restricted tokens", () => {
    const legalSpecies = deriveLegalSpecies(
      {
        pikachu: {},
        miraidon: {},
        bulbasaur: {},
      },
      {
        banlist: ["Bulbasaur", "Item: Light Ball"],
        restricted: ["Miraidon"],
      },
    );

    expect(legalSpecies).toEqual(["miraidon", "pikachu"]);
  });

  it("derives legal items by applying item bans", () => {
    const legalItems = deriveLegalItems(
      {
        lightball: {},
        leftovers: {},
        olditem: { isNonstandard: "Past" },
      },
      {
        banlist: ["Item: Light Ball"],
      },
    );

    expect(legalItems).toEqual(["leftovers"]);
  });

  it("parses BattleItems export from Showdown items.js source", () => {
    const parsed = parseShowdownExportObject<Record<string, { name: string }>>(
      `exports.BattleItems = {
        abilityshield: {name: "Ability Shield"},
        leftovers: {name: "Leftovers"},
      };`,
      "BattleItems",
    );

    expect(parsed.abilityshield?.name).toBe("Ability Shield");
    expect(parsed.leftovers?.name).toBe("Leftovers");
  });
});
