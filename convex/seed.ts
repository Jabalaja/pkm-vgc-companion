import { ConvexError, v } from "convex/values";

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
        if (existingChampionsId && existingChampionsId !== regulation._id) {
          throw new ConvexError(
            "Multiple champions-mega regulations found; clean duplicates before seeding",
          );
        }
        if (!existingChampionsId) {
          existingChampionsId = regulation._id;
        }
      } else if (regulation.isActive) {
        await ctx.db.patch(regulation._id, { isActive: false });
      }
    }

    // Source for Regulation M dates (champions-mega): https://www.pokemon.com/us/play-pokemon/about/tournaments-rules-and-resources/
    const championsRegulation = {
      code: "champions-mega",
      name: "Champions — Set M-A",
      startsAt: Date.UTC(2026, 3, 8),
      endsAt: Date.UTC(2026, 5, 17),
      isActive: true,
      activeGimmicks: ["mega"] satisfies Array<
        "mega" | "tera" | "z" | "dynamax"
      >,
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
