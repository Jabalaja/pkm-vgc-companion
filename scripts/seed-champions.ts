import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";

type ShowdownFormatsEntry = {
  isNonstandard?: string;
  tier?: string;
};

type ShowdownItemEntry = {
  isNonstandard?: string;
};

type AdminAuthCapableClient = ConvexHttpClient & {
  setAdminAuth?: (token: string) => void;
};

const SHOWDOWN_BASE_URL = "https://play.pokemonshowdown.com/data";

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${SHOWDOWN_BASE_URL}/${path}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`);
  }
  return (await response.json()) as T;
}

function setAdminAuthOrThrow(client: ConvexHttpClient, token: string) {
  const adminClient = client as AdminAuthCapableClient;
  if (typeof adminClient.setAdminAuth !== "function") {
    throw new Error(
      "ConvexHttpClient#setAdminAuth is unavailable; update convex dependency or use supported admin auth setup",
    );
  }
  adminClient.setAdminAuth(token);
}

async function main() {
  const deploymentUrl = process.env.VITE_CONVEX_URL;
  const deployKey = process.env.CONVEX_DEPLOY_KEY;

  if (!deploymentUrl) {
    throw new Error("VITE_CONVEX_URL is required");
  }

  if (!deployKey) {
    throw new Error("CONVEX_DEPLOY_KEY is required for seeding");
  }

  const [pokedex, formatsData, items] = await Promise.all([
    fetchJson<Record<string, unknown>>("pokedex.json"),
    fetchJson<Record<string, ShowdownFormatsEntry>>("formats-data.json"),
    fetchJson<Record<string, ShowdownItemEntry>>("items.json"),
  ]);

  const legalSpecies = Object.entries(formatsData)
    .filter(([, entry]) => {
      return (
        entry.isNonstandard !== "Past" &&
        entry.isNonstandard !== "Unobtainable" &&
        entry.tier !== "Illegal"
      );
    })
    .map(([key]) => key)
    .filter((key) => key in pokedex)
    .sort();

  const legalItems = Object.entries(items)
    .filter(([, entry]) => {
      return (
        entry.isNonstandard !== "Past" && entry.isNonstandard !== "Unobtainable"
      );
    })
    .map(([key]) => key)
    .sort();

  const client = new ConvexHttpClient(deploymentUrl);
  setAdminAuthOrThrow(client, deployKey);

  await client.mutation(
    makeFunctionReference<"mutation">("seed:seedChampionsRegulation"),
    {
      legalSpecies,
      legalItems,
    },
  );

  console.log(
    `Seeded ${legalSpecies.length} legal species, ${legalItems.length} legal items`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
