/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

const regulation = {
  code: "CH-I",
  name: "Champions Regulation I",
  startsAt: 1,
  endsAt: 2,
  activeGimmicks: ["mega"] as const,
  legalSpecies: ["Pikachu"],
  legalItems: ["Light Ball"],
  restrictedAllowance: 1,
};

const modules = {
  ...import.meta.glob("./**/*.ts"),
  "./_generated/api.ts": async () => ({}),
};

describe("convex-test pattern", () => {
  it("writes and reads regulation documents", async () => {
    const t = convexTest({ modules });

    const regulationId = await t.mutation(async (ctx) => {
      return await ctx.db.insert("regulations", regulation);
    });

    const storedRegulation = await t.query(async (ctx) => {
      return await ctx.db.get(regulationId);
    });

    expect(storedRegulation?.code).toBe("CH-I");
    expect(storedRegulation?.activeGimmicks).toEqual(["mega"]);
  });

  it("queries inserted regulations", async () => {
    const t = convexTest({ modules });

    await t.mutation(async (ctx) => {
      await ctx.db.insert("regulations", {
        ...regulation,
        code: "CH-I",
        name: "Champions Regulation I",
      });
      await ctx.db.insert("regulations", {
        ...regulation,
        code: "CH-II",
        name: "Champions Regulation II",
      });
    });

    const regulationNames = await t.query(async (ctx) => {
      const rows = await ctx.db.query("regulations").take(10);
      return rows.map((row) => row.name);
    });

    expect(regulationNames).toEqual([
      "Champions Regulation I",
      "Champions Regulation II",
    ]);
    expect(regulationNames).toHaveLength(2);
  });
});
