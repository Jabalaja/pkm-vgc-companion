import { Button } from "@/components/ui/button";
import {
  type PokeApiPokemon,
  fetchPokemonBySlug,
  showdownToPokeapiSlug,
} from "@/lib/pokeapi";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "convex/react";
import { useMemo, useState } from "react";

type PokemonDetailCardProps = {
  slug: string;
  regulationId: string;
};

const defaultEvs = {
  hp: 0,
  atk: 0,
  def: 0,
  spa: 0,
  spd: 0,
  spe: 0,
};

const defaultIvs = {
  hp: 31,
  atk: 31,
  def: 31,
  spa: 31,
  spd: 31,
  spe: 31,
};
const defaultNature = "Hardy";

function toLabel(value: string) {
  return value
    .split("-")
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getSprite(pokemon: PokeApiPokemon) {
  return (
    pokemon.sprites.other?.["official-artwork"]?.front_default ??
    pokemon.sprites.front_default
  );
}

type GetOrCreateForRegulation = (args: {
  regulationId: string;
}) => Promise<string>;
type AddMember = (args: {
  teamId: string;
  member: {
    species: string;
    ability: string;
    nature: string;
    moves: string[];
    evs: typeof defaultEvs;
    ivs: typeof defaultIvs;
  };
}) => Promise<unknown>;

function useGetOrCreateForRegulationMutation() {
  // Convex generated client types are not committed; use a localized cast.
  return useMutation(
    "teams:getOrCreateForRegulation" as never,
  ) as unknown as GetOrCreateForRegulation;
}

function useAddMemberMutation() {
  // Convex generated client types are not committed; use a localized cast.
  return useMutation("teams:addMember" as never) as unknown as AddMember;
}

export function PokemonDetailCard({
  slug,
  regulationId,
}: PokemonDetailCardProps) {
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [addedName, setAddedName] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const getOrCreateForRegulation = useGetOrCreateForRegulationMutation();
  const addMember = useAddMemberMutation();

  const normalizedSlug = showdownToPokeapiSlug(slug);
  const { data, isLoading, error } = useQuery({
    queryKey: ["pokemon", normalizedSlug],
    queryFn: () => fetchPokemonBySlug(slug),
    staleTime: Number.POSITIVE_INFINITY,
  });

  const name = useMemo(() => {
    if (!data) {
      return toLabel(slug);
    }
    return toLabel(data.name);
  }, [data, slug]);

  async function handleAddToTeam() {
    if (!data) {
      return;
    }

    setMutationError(null);
    setAddedName(null);
    setIsAdding(true);

    try {
      const firstAbility = data.abilities[0]?.ability.name;
      if (!firstAbility) {
        throw new Error(`No ability data available for "${slug}"`);
      }

      const teamId = await getOrCreateForRegulation({ regulationId });
      await addMember({
        teamId,
        member: {
          species: slug,
          ability: firstAbility,
          nature: defaultNature,
          moves: ["", "", "", ""],
          evs: defaultEvs,
          ivs: defaultIvs,
        },
      });
      setAddedName(name);
    } catch (unknownError) {
      const message =
        unknownError instanceof Error
          ? unknownError.message
          : "Could not add Pokémon to team";
      setMutationError(message);
    } finally {
      setIsAdding(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-lg border border-neutral-200 bg-brand-cream p-4 text-brand-navy">
        Loading Pokémon details…
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
        {error.message}
      </section>
    );
  }

  if (!data) {
    return null;
  }

  const sprite = getSprite(data);

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-brand-cream p-4 text-brand-navy">
      <div className="flex items-center gap-4">
        {sprite ? (
          <img src={sprite} alt={name} className="h-28 w-28 object-contain" />
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded-md bg-white text-xs text-neutral-500">
            No sprite
          </div>
        )}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">{name}</h3>
          <ul className="flex flex-wrap gap-2">
            {data.types.map((entry) => (
              <li
                key={entry.type.name}
                className="rounded-full border border-brand-navy/30 px-2 py-0.5 text-xs"
              >
                {toLabel(entry.type.name)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <h4 className="mb-1 text-sm font-semibold">Abilities</h4>
        <ul className="space-y-1 text-sm">
          {data.abilities.map((entry) => (
            <li key={entry.ability.name}>
              {toLabel(entry.ability.name)}
              {entry.is_hidden ? " (Hidden)" : ""}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="mb-1 text-sm font-semibold">Base stats</h4>
        <table className="w-full text-sm">
          <tbody>
            {data.stats.map((entry) => (
              <tr key={entry.stat.name}>
                <th className="py-0.5 pr-2 text-left font-medium">
                  {toLabel(entry.stat.name)}
                </th>
                <td className="py-0.5 text-right">{entry.base_stat}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-1">
        <Button
          type="button"
          className="bg-brand-navy text-brand-cream hover:bg-brand-navy/90"
          onClick={handleAddToTeam}
          disabled={isAdding}
        >
          {isAdding ? "Adding…" : "Add to team"}
        </Button>
        {addedName ? (
          <p className="text-sm text-emerald-700">{`Added ${addedName} to team`}</p>
        ) : null}
        {mutationError ? (
          <p className="text-sm text-red-700">{mutationError}</p>
        ) : null}
      </div>
    </section>
  );
}
