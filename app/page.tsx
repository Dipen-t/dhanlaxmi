import { PageHeader } from "@/components/page-header";
import { NavTile } from "@/components/nav-tile";
import { homeTiles } from "@/lib/nav-config";

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-5 py-8 sm:px-8 sm:py-10 md:justify-center md:px-10 md:py-12 lg:max-w-6xl">
      <PageHeader />

      <section aria-labelledby="home-heading" className="mt-2 md:mt-4">
        <div className="mb-6 max-w-2xl md:mb-8">
          <h1
            id="home-heading"
            className="text-2xl font-semibold tracking-[-0.02em] text-foreground [text-wrap:balance]"
          >
            Where do you want to go?
          </h1>
          <p className="mt-2 text-base text-muted [text-wrap:pretty]">
            Open a section to manage materials, vendors, orders, or menus.
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:gap-5">
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
