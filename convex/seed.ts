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
    let existingChampionsId: Id<"regulations"> | null = null;

    for await (const regulation of ctx.db.query("regulations")) {
      if (regulation.code === "champions-mega") {
        existingChampionsId ??= regulation._id;
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
    };

    if (existingChampionsId) {
      await ctx.db.patch(existingChampionsId, championsRegulation);
      return existingChampionsId;
    }

    return await ctx.db.insert("regulations", {
      ...championsRegulation,
    });
  },
});
