import { PageHeader } from "@/components/page-header";
import { NavTile } from "@/components/nav-tile";
import { homeTiles } from "@/lib/nav-config";

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
      <PageHeader title="Home" />

      <section aria-label="Main sections">
        <div className="mb-5">
          <h2 className="text-2xl font-semibold tracking-[-0.02em] text-foreground [text-wrap:balance]">
            Where do you want to go?
          </h2>
          <p className="mt-1 max-w-prose text-sm text-muted [text-wrap:pretty]">
            Pick a section below to manage your catering operations.
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-2 lg:gap-4">
          {homeTiles.map((tile) => (
            <li key={tile.href}>
              <NavTile {...tile} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
