import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const convexConfigured = Boolean(import.meta.env.VITE_CONVEX_URL);

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-mono tracking-widest text-neutral-400 uppercase">
          Phase 1 — MVP scaffold
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          PKM VGC Companion
        </h1>
        <p className="text-neutral-400">
          Mobile-first companion for Pokémon Champions and Pokémon VGC.
        </p>
      </header>

      <section className="flex flex-col gap-4 rounded-lg border border-neutral-800 bg-neutral-900 p-5">
        <h2 className="text-lg font-medium">Stack check</h2>
        <ul className="flex flex-col gap-1 text-sm text-neutral-300">
          <li>Vite + React 19 + TypeScript</li>
          <li>Tailwind CSS v4</li>
          <li>TanStack Router (file-based)</li>
          <li>TanStack Query</li>
          <li>shadcn/ui primitives</li>
          <li>vite-plugin-pwa (Workbox)</li>
          <li>
            Convex:{" "}
            <span
              className={
                convexConfigured ? "text-emerald-400" : "text-amber-400"
              }
            >
              {convexConfigured
                ? "configured"
                : "run `pnpm convex:dev` to create a deployment"}
            </span>
          </li>
        </ul>
        <div className="flex gap-2">
          <Button>Primary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </section>
    </main>
  );
}
