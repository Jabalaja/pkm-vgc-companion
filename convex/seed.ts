import { v } from "convex/values";

import { internalMutation } from "./_generated/server";

export const seedChampionsRegulation = internalMutation({
  args: {
    legalSpecies: v.array(v.string()),
    legalItems: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const regulations = await ctx.db.query("regulations").take(100);

    for (const regulation of regulations) {
      if (regulation.code === "champions-mega") {
        await ctx.db.delete(regulation._id);
        continue;
      }

      if (regulation.isActive) {
        await ctx.db.patch(regulation._id, { isActive: false });
      }
    }

    return await ctx.db.insert("regulations", {
      code: "champions-mega",
      name: "Champions — Set M-A",
      startsAt: Date.UTC(2026, 3, 8),
      endsAt: Date.UTC(2026, 5, 17),
      isActive: true,
      activeGimmicks: ["mega"],
      legalSpecies: Array.from(new Set(args.legalSpecies)),
      legalItems: Array.from(new Set(args.legalItems)),
      restrictedAllowance: 1,
    });
  },
});
