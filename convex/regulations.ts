import { ConvexError, v } from "convex/values";

import { query } from "./_generated/server";

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const activeRegulations = [];
    for await (const regulation of ctx.db.query("regulations")) {
      if (regulation.isActive === true) {
        activeRegulations.push(regulation);
      }
    }

    if (activeRegulations.length > 1) {
      throw new ConvexError("Multiple active regulations found");
    }

    return activeRegulations[0] ?? null;
  },
});
