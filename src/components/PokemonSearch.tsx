import { PokemonDetailCard } from "@/components/PokemonDetailCard";
import { Input } from "@/components/ui/input";
import { useQuery } from "convex/react";
import { useDeferredValue, useMemo, useState } from "react";

type ActiveRegulation = {
  _id: string;
  legalSpecies: string[];
};

function useActiveRegulation() {
  // Convex generated client types are not committed; use a localized cast.
  return useQuery("regulations:getActive" as never) as
    | ActiveRegulation
    | null
    | undefined;
}

export function PokemonSearch() {
  const regulation = useActiveRegulation();
  const [query, setQuery] = useState("");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    if (!regulation) {
      return [];
    }

    const normalizedQuery = deferredQuery.trim().toLowerCase();
    const candidates = regulation.legalSpecies;
    if (!normalizedQuery) {
      return candidates.slice(0, 30);
    }

    return candidates
      .filter((slug) => slug.toLowerCase().startsWith(normalizedQuery))
      .slice(0, 30);
  }, [deferredQuery, regulation]);

  if (regulation === undefined) {
    return (
      <section className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-brand-cream p-4">
        <div className="h-9 animate-pulse rounded-md bg-neutral-200" />
        <div className="h-32 animate-pulse rounded-md bg-neutral-200" />
      </section>
    );
  }

  if (regulation === null) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        No active regulation. Run `pnpm seed:champions` then refresh.
      </p>
    );
  }

  return (
    <section className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-brand-cream p-4">
        <label
          htmlFor="pokemon-search"
          className="text-sm font-medium text-brand-navy"
        >
          Search legal Pokémon
        </label>
        <Input
          id="pokemon-search"
          value={query}
          placeholder="Type a slug, e.g. charizard"
          onChange={(event) => {
            setQuery(event.target.value);
          }}
        />
        <ul className="max-h-[28rem] space-y-1 overflow-auto pr-1">
          {filtered.map((slug) => (
            <li key={slug}>
              <button
                type="button"
                className="w-full rounded-md px-2 py-1 text-left text-sm text-brand-navy hover:bg-brand-navy/10"
                onClick={() => {
                  setSelectedSlug(slug);
                }}
              >
                {slug}
              </button>
            </li>
          ))}
          {filtered.length === 0 ? (
            <li className="px-2 py-1 text-sm text-neutral-500">No matches.</li>
          ) : null}
        </ul>
      </div>

      {selectedSlug ? (
        <PokemonDetailCard slug={selectedSlug} regulationId={regulation._id} />
      ) : (
        <div className="rounded-lg border border-dashed border-neutral-300 p-4 text-sm text-neutral-500">
          Select a Pokémon to view details.
        </div>
      )}
    </section>
  );
}
