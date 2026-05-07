/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { makeFunctionReference } from "convex/server";
import { describe, expect, it } from "vitest";

import type { Id } from "./_generated/dataModel";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");
const seedChampionsRegulation = makeFunctionReference<"mutation">(
  "seed:seedChampionsRegulation",
);

function makeRegulation(code: string, isActive: boolean) {
  return {
    code,
    name: code,
    startsAt: 1,
    endsAt: 2,
    isActive,
    activeGimmicks: ["mega"] satisfies Array<"mega" | "tera" | "z" | "dynamax">,
    legalSpecies: ["pikachu"],
    legalItems: ["lightball"],
    restrictedAllowance: 1,
  };
}

describe("seed.seedChampionsRegulation", () => {
  it("inserts champions regulation when missing", async () => {
    const t = convexTest({ schema, modules });

    const regulationId: Id<"regulations"> = await t.mutation(
      seedChampionsRegulation,
      {
        legalSpecies: ["pikachu"],
        legalItems: ["lightball"],
      },
    );
    const stored = await t.query(async (ctx) => await ctx.db.get(regulationId));

    expect(stored?.code).toBe("M-A");
    expect(stored?.isActive).toBe(true);
  });

  it("is idempotent and updates same champions row", async () => {
    const t = convexTest({ schema, modules });

    const firstId: Id<"regulations"> = await t.mutation(
      seedChampionsRegulation,
      {
        legalSpecies: ["pikachu", "pikachu"],
        legalItems: ["lightball", "lightball"],
      },
    );

    const secondId: Id<"regulations"> = await t.mutation(
      seedChampionsRegulation,
      {
        legalSpecies: ["bulbasaur", "bulbasaur", "pikachu"],
        legalItems: ["sitrusberry", "sitrusberry"],
      },
    );

    const stored = await t.query(async (ctx) => await ctx.db.get(secondId));
    expect(secondId).toBe(firstId);
    expect(stored?.legalSpecies).toEqual(["bulbasaur", "pikachu"]);
    expect(stored?.legalItems).toEqual(["sitrusberry"]);
  });

  it("demotes other active regulations", async () => {
    const t = convexTest({ schema, modules });
    const activeOtherId: Id<"regulations"> = await t.mutation(async (ctx) => {
      return await ctx.db.insert("regulations", makeRegulation("other", true));
    });

    await t.mutation(seedChampionsRegulation, {
      legalSpecies: ["pikachu"],
      legalItems: ["lightball"],
    });

    const other = await t.query(async (ctx) => await ctx.db.get(activeOtherId));
    expect(other?.isActive).toBe(false);
  });

  it("throws when duplicate champions rows exist", async () => {
    const t = convexTest({ schema, modules });
    await t.mutation(async (ctx) => {
      await ctx.db.insert("regulations", makeRegulation("M-A", false));
      await ctx.db.insert("regulations", makeRegulation("M-A", false));
    });

    await expect(
      t.mutation(seedChampionsRegulation, {
        legalSpecies: ["pikachu"],
        legalItems: ["lightball"],
      }),
    ).rejects.toThrowError("Multiple M-A regulations found");
  });
});
