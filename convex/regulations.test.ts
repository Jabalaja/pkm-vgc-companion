/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { makeFunctionReference } from "convex/server";
import { describe, expect, it } from "vitest";

import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");
const getActive = makeFunctionReference<"query">("regulations:getActive");

function regulation(overrides?: Partial<{ code: string; isActive: boolean }>) {
  return {
    code: overrides?.code ?? "reg-a",
    name: "Regulation A",
    startsAt: 1,
    endsAt: 2,
    isActive: overrides?.isActive,
    activeGimmicks: ["mega"] as const,
    legalSpecies: ["pikachu"],
    legalItems: ["lightball"],
    restrictedAllowance: 1,
  };
}

describe("regulations.getActive", () => {
  it("returns null when no regulation is active", async () => {
    const t = convexTest({ schema, modules });
    await t.mutation(async (ctx) => {
      await ctx.db.insert("regulations", regulation({ isActive: false }));
    });

    await expect(t.query(getActive, {})).resolves.toBeNull();
  });

  it("returns the single active regulation", async () => {
    const t = convexTest({ schema, modules });
    await t.mutation(async (ctx) => {
      await ctx.db.insert(
        "regulations",
        regulation({ code: "inactive", isActive: false }),
      );
      await ctx.db.insert(
        "regulations",
        regulation({ code: "active", isActive: true }),
      );
    });

    const active = await t.query(getActive, {});
    expect(active?.code).toBe("active");
  });

  it("throws when multiple active regulations exist", async () => {
    const t = convexTest({ schema, modules });
    await t.mutation(async (ctx) => {
      await ctx.db.insert(
        "regulations",
        regulation({ code: "a", isActive: true }),
      );
      await ctx.db.insert(
        "regulations",
        regulation({ code: "b", isActive: true }),
      );
    });

    await expect(t.query(getActive, {})).rejects.toThrowError(
      "Multiple active regulations found",
    );
  });
});
