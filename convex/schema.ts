import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const gimmickKind = v.union(
  v.literal("mega"),
  v.literal("tera"),
  v.literal("z"),
  v.literal("dynamax"),
);

export const stats = v.object({
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
    isActive: v.optional(v.boolean()),
    activeGimmicks: v.array(gimmickKind),
    // Canonical identifiers are Showdown IDs (e.g. "pikachu", "charizardmegax").
    legalSpecies: v.array(v.string()),
    // Canonical identifiers are Showdown IDs (e.g. "lightball", "choicescarf").
    legalItems: v.array(v.string()),
    restrictedAllowance: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_isActive", ["isActive"]),

  teams: defineTable({
    name: v.string(),
    regulationId: v.id("regulations"),
    members: v.array(
      v.object({
        // Canonical identifier is a Showdown species ID.
        species: v.string(),
        ability: v.string(),
        // Canonical identifier is a Showdown item ID.
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
