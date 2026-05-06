/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { makeFunctionReference } from "convex/server";
import { describe, expect, it } from "vitest";

import type { Id } from "./_generated/dataModel";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");
const getOrCreateForRegulation = makeFunctionReference<"mutation">(
  "teams:getOrCreateForRegulation",
);
const addMember = makeFunctionReference<"mutation">("teams:addMember");

function regulationDoc() {
  return {
    code: "champions-mega",
    name: "Champions — Set M-A",
    startsAt: 1,
    endsAt: 2,
    isActive: true,
    activeGimmicks: ["mega"] satisfies Array<"mega" | "tera" | "z" | "dynamax">,
    legalSpecies: ["pikachu"],
    legalItems: ["lightball"],
    restrictedAllowance: 1,
  };
}

describe("teams.getOrCreateForRegulation", () => {
  it("returns existing team for a regulation", async () => {
    const t = convexTest({ schema, modules });
    const {
      regulationId,
      teamId,
    }: {
      regulationId: Id<"regulations">;
      teamId: Id<"teams">;
    } = await t.mutation(async (ctx) => {
      const regulationId = await ctx.db.insert("regulations", regulationDoc());
      const teamId = await ctx.db.insert("teams", {
        name: "Existing Team",
        regulationId,
        members: [],
      });
      return { regulationId, teamId };
    });

    await expect(
      t.mutation(getOrCreateForRegulation, { regulationId }),
    ).resolves.toBe(teamId);
  });

  it("creates a team when none exists", async () => {
    const t = convexTest({ schema, modules });
    const regulationId: Id<"regulations"> = await t.mutation(async (ctx) => {
      return await ctx.db.insert("regulations", regulationDoc());
    });

    const teamId: Id<"teams"> = await t.mutation(getOrCreateForRegulation, {
      regulationId,
    });
    const team = await t.query(async (ctx) => await ctx.db.get(teamId));
    expect(team?.name).toBe("New Team");
  });

  it("throws for an unknown regulation id", async () => {
    const t = convexTest({ schema, modules });
    const deletedRegulationId: Id<"regulations"> = await t.mutation(
      async (ctx) => {
        const regulationId = await ctx.db.insert(
          "regulations",
          regulationDoc(),
        );
        await ctx.db.delete(regulationId);
        return regulationId;
      },
    );

    await expect(
      t.mutation(getOrCreateForRegulation, {
        regulationId: deletedRegulationId,
      }),
    ).rejects.toThrowError("Regulation not found");
  });
});

describe("teams.addMember", () => {
  async function createTeam(t: ReturnType<typeof convexTest>) {
    const regulationId: Id<"regulations"> = await t.mutation(async (ctx) => {
      return await ctx.db.insert("regulations", regulationDoc());
    });
    const teamId: Id<"teams"> = await t.mutation(getOrCreateForRegulation, {
      regulationId,
    });
    return teamId;
  }

  it("adds a member with full input", async () => {
    const t = convexTest({ schema, modules });
    const teamId = await createTeam(t);

    await t.mutation(addMember, {
      teamId,
      member: {
        species: "pikachu",
        ability: "static",
        item: "lightball",
        nature: "Jolly",
        moves: ["thunderbolt"],
        evs: { hp: 1, atk: 2, def: 3, spa: 4, spd: 5, spe: 6 },
        ivs: { hp: 31, atk: 30, def: 29, spa: 28, spd: 27, spe: 26 },
        gimmick: { kind: "mega", details: "charizarditex" },
      },
    });

    const team = await t.query(async (ctx) => await ctx.db.get(teamId));
    expect(team?.members).toHaveLength(1);
    expect(team?.members[0]?.nature).toBe("Jolly");
    expect(team?.members[0]?.moves).toEqual(["thunderbolt"]);
  });

  it("rejects illegal species", async () => {
    const t = convexTest({ schema, modules });
    const teamId = await createTeam(t);

    await expect(
      t.mutation(addMember, {
        teamId,
        member: {
          species: "bulbasaur",
          ability: "overgrow",
          moves: ["tackle"],
        },
      }),
    ).rejects.toThrowError('Species "bulbasaur" is not legal');
  });

  it("rejects illegal item", async () => {
    const t = convexTest({ schema, modules });
    const teamId = await createTeam(t);

    await expect(
      t.mutation(addMember, {
        teamId,
        member: {
          species: "pikachu",
          ability: "static",
          item: "leftovers",
          moves: ["thunderbolt"],
        },
      }),
    ).rejects.toThrowError('Item "leftovers" is not legal');
  });

  it("rejects illegal gimmick", async () => {
    const t = convexTest({ schema, modules });
    const teamId = await createTeam(t);

    await expect(
      t.mutation(addMember, {
        teamId,
        member: {
          species: "pikachu",
          ability: "static",
          item: "lightball",
          moves: ["thunderbolt"],
          gimmick: { kind: "tera" },
        },
      }),
    ).rejects.toThrowError('Gimmick "tera" is not active');
  });

  it("applies defaults for omitted optional stat fields", async () => {
    const t = convexTest({ schema, modules });
    const teamId = await createTeam(t);

    await t.mutation(addMember, {
      teamId,
      member: {
        species: "pikachu",
        ability: "static",
        item: "lightball",
        moves: ["thunderbolt"],
      },
    });

    const team = await t.query(async (ctx) => await ctx.db.get(teamId));
    expect(team?.members[0]?.nature).toBe("Hardy");
    expect(team?.members[0]?.evs).toEqual({
      hp: 0,
      atk: 0,
      def: 0,
      spa: 0,
      spd: 0,
      spe: 0,
    });
    expect(team?.members[0]?.ivs).toEqual({
      hp: 31,
      atk: 31,
      def: 31,
      spa: 31,
      spd: 31,
      spe: 31,
    });
  });

  it("rejects members without at least one move", async () => {
    const t = convexTest({ schema, modules });
    const teamId = await createTeam(t);

    await expect(
      t.mutation(addMember, {
        teamId,
        member: {
          species: "pikachu",
          ability: "static",
          item: "lightball",
        },
      }),
    ).rejects.toThrowError("Member must have at least one move");
  });

  it("rejects empty move names", async () => {
    const t = convexTest({ schema, modules });
    const teamId = await createTeam(t);

    await expect(
      t.mutation(addMember, {
        teamId,
        member: {
          species: "pikachu",
          ability: "static",
          item: "lightball",
          moves: [""],
        },
      }),
    ).rejects.toThrowError("Move names cannot be empty");
  });
});
