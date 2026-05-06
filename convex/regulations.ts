import { ConvexError, v } from "convex/values";

import { query } from "./_generated/server";

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const regulations = await ctx.db.query("regulations").take(100);
    const activeRegulations = regulations.filter(
      (regulation) => regulation.isActive === true,
    );

    if (activeRegulations.length > 1) {
      throw new ConvexError("Multiple active regulations found");
    }

    return activeRegulations[0] ?? null;
  },
});
