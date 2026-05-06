import { ConvexError, v } from "convex/values";

import { mutation } from "./_generated/server";
import { gimmickKind, stats } from "./schema";

const memberInput = v.object({
  species: v.string(),
  ability: v.string(),
  item: v.optional(v.string()),
  nature: v.optional(v.string()),
  moves: v.optional(v.array(v.string())),
  evs: v.optional(stats),
  ivs: v.optional(stats),
  gimmick: v.optional(
    v.object({
      kind: gimmickKind,
      details: v.optional(v.string()),
    }),
  ),
});

const defaultEvs = {
  hp: 0,
  atk: 0,
  def: 0,
  spa: 0,
  spd: 0,
  spe: 0,
};

const defaultIvs = {
  hp: 31,
  atk: 31,
  def: 31,
  spa: 31,
  spd: 31,
  spe: 31,
};

const defaultMoves: string[] = [];

export const getOrCreateForRegulation = mutation({
  args: {
    regulationId: v.id("regulations"),
  },
  handler: async (ctx, args) => {
    const regulation = await ctx.db.get(args.regulationId);
    if (!regulation) {
      throw new ConvexError("Regulation not found");
    }

    const existing = await ctx.db
      .query("teams")
      .withIndex("by_regulation", (q) =>
        q.eq("regulationId", args.regulationId),
      )
      .take(1);

    if (existing[0]) {
      return existing[0]._id;
    }

    return await ctx.db.insert("teams", {
      name: "New Team",
      regulationId: args.regulationId,
      members: [],
    });
  },
});

export const addMember = mutation({
  args: {
    teamId: v.id("teams"),
    member: memberInput,
  },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new ConvexError("Team not found");
    }

    const regulation = await ctx.db.get(team.regulationId);
    if (!regulation) {
      throw new ConvexError("Regulation not found");
    }

    if (!regulation.legalSpecies.includes(args.member.species)) {
      throw new ConvexError(
        `Species "${args.member.species}" is not legal for regulation "${regulation.code}"`,
      );
    }

    if (
      args.member.gimmick &&
      !regulation.activeGimmicks.includes(args.member.gimmick.kind)
    ) {
      throw new ConvexError(
        `Gimmick "${args.member.gimmick.kind}" is not active for regulation "${regulation.code}"`,
      );
    }

    if (args.member.item && !regulation.legalItems.includes(args.member.item)) {
      throw new ConvexError(
        `Item "${args.member.item}" is not legal for regulation "${regulation.code}"`,
      );
    }

    if (team.members.length >= 6) {
      throw new ConvexError("Team already has the maximum of 6 members");
    }

    const moves = args.member.moves ?? defaultMoves;
    // Strict move validation is deferred to the Phase 2 move-picker flow.

    await ctx.db.patch(team._id, {
      members: [
        ...team.members,
        {
          species: args.member.species,
          ability: args.member.ability,
          item: args.member.item,
          nature: args.member.nature ?? "Hardy",
          moves,
          evs: args.member.evs ?? defaultEvs,
          ivs: args.member.ivs ?? defaultIvs,
          gimmick: args.member.gimmick,
        },
      ],
    });

    return team._id;
  },
});
