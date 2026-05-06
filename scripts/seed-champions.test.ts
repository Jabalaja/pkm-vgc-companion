import { describe, expect, it } from "vitest";

import {
  deriveLegalItems,
  deriveLegalSpecies,
  parseShowdownItems,
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
    const parsed = parseShowdownItems(`exports.BattleItems = {
      abilityshield: {name: "Ability Shield"},
      leftovers: {name: "Leftovers", isNonstandard: "Past"},
      testitem: {name: "Test Item", flags: {nonsense: true}},
    };`);

    expect(parsed.abilityshield?.isNonstandard).toBeUndefined();
    expect(parsed.leftovers?.isNonstandard).toBe("Past");
    expect(parsed.testitem?.isNonstandard).toBeUndefined();
  });

  it("parses escaped quotes in quoted keys and values", () => {
    const parsed = parseShowdownItems(`exports.BattleItems = {
      "king\\'srock": {isNonstandard: "Pa\\"st"},
    };`);

    expect(parsed.kingsrock?.isNonstandard).toBe('Pa"st');
  });
});
