import { PageHeader } from "@/components/page-header";
import { NavTile } from "@/components/nav-tile";
import { homeTiles } from "@/lib/nav-config";

export default function HomePage() {
  return (
    <div className="flex min-h-dvh w-full flex-col px-5 py-8 sm:px-8 sm:py-10 md:px-10 md:py-12">
      <PageHeader />

      <div className=" space-y-10 md:space-y-12">
        <section aria-labelledby="ops-heading">
          <h2 id="ops-heading" className="mb-4 text-lg font-bold tracking-tight text-foreground md:text-xl">
            Operations
          </h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-5">
            {homeTiles.filter(t => ['/raw-materials', '/vendors'].includes(t.href)).map((tile) => (
              <li key={tile.href}>
                <NavTile {...tile} />
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="events-heading">
          <h2 id="events-heading" className="mb-4 text-lg font-bold tracking-tight text-foreground md:text-xl">
            Events
          </h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-5">
            {homeTiles.filter(t => ['/orders', '/menus', '/kitchen-menus'].includes(t.href)).map((tile) => (
              <li key={tile.href}>
                <NavTile {...tile} />
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="finance-heading">
          <h2 id="finance-heading" className="mb-4 text-lg font-bold tracking-tight text-foreground md:text-xl">
            Finance
          </h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-5">
            {homeTiles.filter(t => ['/reports', '/payments'].includes(t.href)).map((tile) => (
              <li key={tile.href}>
                <NavTile {...tile} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
