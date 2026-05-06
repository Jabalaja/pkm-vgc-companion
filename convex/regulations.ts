import { ConvexError } from "convex/values";

import { query } from "./_generated/server";

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const activeRegulations = await ctx.db
      .query("regulations")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .take(2);

    if (activeRegulations.length > 1) {
      throw new ConvexError("Multiple active regulations found");
    }

    return activeRegulations[0] ?? null;
  },
});
