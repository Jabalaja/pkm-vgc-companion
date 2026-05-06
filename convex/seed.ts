import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { internalMutation } from "./_generated/server";

export const seedChampionsRegulation = internalMutation({
  args: {
    legalSpecies: v.array(v.string()),
    legalItems: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const legalSpecies = Array.from(new Set(args.legalSpecies));
    const legalItems = Array.from(new Set(args.legalItems));
    const championsRegulations: Id<"regulations">[] = [];

    for await (const regulation of ctx.db.query("regulations")) {
      if (regulation.code === "champions-mega") {
        championsRegulations.push(regulation._id);
        if (regulation.isActive) {
          await ctx.db.patch(regulation._id, { isActive: false });
        }
      } else if (regulation.isActive) {
        await ctx.db.patch(regulation._id, { isActive: false });
      }
    }

    const championsRegulation = {
      code: "champions-mega",
      name: "Champions — Set M-A",
      startsAt: Date.UTC(2026, 3, 8),
      endsAt: Date.UTC(2026, 5, 17),
      isActive: true,
      activeGimmicks: ["mega"],
      legalSpecies,
      legalItems,
      restrictedAllowance: 1,
    } as const;

    if (championsRegulations[0]) {
      await ctx.db.patch(championsRegulations[0], championsRegulation);
      return championsRegulations[0];
    }

    return await ctx.db.insert("regulations", {
      ...championsRegulation,
    });
  },
});
