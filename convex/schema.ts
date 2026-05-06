import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const gimmickKind = v.union(
  v.literal("mega"),
  v.literal("tera"),
  v.literal("z"),
  v.literal("dynamax"),
);

const stats = v.object({
  hp: v.number(),
  atk: v.number(),
  def: v.number(),
  spa: v.number(),
  spd: v.number(),
  spe: v.number(),
});

export default defineSchema({
  regulations: defineTable({
    code: v.string(),
    name: v.string(),
    startsAt: v.number(),
    endsAt: v.number(),
    activeGimmicks: v.array(gimmickKind),
    legalSpecies: v.array(v.string()),
    legalItems: v.array(v.string()),
    restrictedAllowance: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_code", ["name"]),

  teams: defineTable({
    name: v.string(),
    regulationId: v.id("regulations"),
    members: v.array(
      v.object({
        species: v.string(),
        ability: v.string(),
        item: v.optional(v.string()),
        nature: v.string(),
        moves: v.array(v.string()),
        evs: stats,
        ivs: stats,
        gimmick: v.optional(
          v.object({
            kind: gimmickKind,
            details: v.optional(v.string()),
          }),
        ),
      }),
    ),
  }).index("by_regulation", ["regulationId"]),
});
