import { describe, expect, it } from "vitest";

import { deriveLegalItems, deriveLegalSpecies } from "./seed-champions";

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
});
