import { PokemonSearch } from "@/components/PokemonSearch";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const convexConfigured = Boolean(import.meta.env.VITE_CONVEX_URL);

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-8 bg-brand-cream p-6 text-brand-navy md:my-6 md:rounded-xl">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-mono tracking-widest text-neutral-500 uppercase">
          Phase 1 — Champions team builder
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-brand-navy">
          Build your Champions team
        </h1>
        <p className="text-neutral-600">
          Search legal Pokémon and add them to your team.
        </p>
      </header>

      {convexConfigured ? (
        <PokemonSearch />
      ) : (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Convex is not configured. Run `pnpm convex:dev` to create a
          deployment.
        </p>
      )}
    </main>
  );
}
