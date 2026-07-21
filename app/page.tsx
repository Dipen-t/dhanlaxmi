import Image from "next/image";
import { Package, Calendar, BarChart2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { NavTile } from "@/components/nav-tile";
import { homeTiles } from "@/lib/nav-config";

export default function HomePage() {
  return (
    <div className="relative flex min-h-dvh w-full flex-col px-5 py-8 sm:px-8 sm:py-10 md:px-10 md:py-12 bg-[#F8FAF9] overflow-hidden">
      {/* Background Bottom Right */}
      <div className="fixed bottom-0 right-0 z-0 pointer-events-none w-[500px] h-[500px] md:w-[800px] md:h-[800px] opacity-80">
        <Image 
          src="/bottom-right.jpeg"
          alt=""
          fill
          className="object-contain object-bottom-right mix-blend-multiply" 
          style={{ objectPosition: 'bottom right' }}
        />
      </div>
      
      <div className="relative z-10 w-full flex flex-col h-full flex-1">
        <PageHeader />

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row items-center justify-between mt-2 md:mt-4 mb-12 md:mb-16">
          <div className="flex-1 max-w-2xl">
            <h1 className="text-4xl md:text-[3.25rem] leading-tight font-serif font-bold text-slate-800 mb-3 md:mb-4">
              Welcome back!
            </h1>
            <p className="text-base md:text-lg text-muted">
              Manage your operations, events, and finances seamlessly.
            </p>
          </div>
          <div className="mt-8 md:mt-0 md:ml-12 w-full md:w-[400px] lg:w-[480px] shrink-0">
            <div className="relative aspect-[16/9] w-full">
              <Image 
                src="/Hero-image.jpeg" 
                alt="" 
                fill 
                className="object-contain object-right" 
                priority
              />
            </div>
          </div>
        </div>

        <div className="space-y-12 md:space-y-16">
          <section aria-labelledby="ops-heading">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex size-7 items-center justify-center rounded-full bg-[#1c6434] text-white">
                <Package className="size-3.5" strokeWidth={2.5} />
              </div>
              <h2 id="ops-heading" className="text-xs font-bold uppercase tracking-[0.15em] text-slate-800">
                Operations
              </h2>
            </div>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
              {homeTiles.filter(t => ['/raw-materials', '/vendors'].includes(t.href)).map((tile) => (
                <li key={tile.href}>
                  <NavTile {...tile} />
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="events-heading">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex size-7 items-center justify-center rounded-full bg-[#1c6434] text-white">
                <Calendar className="size-3.5" strokeWidth={2.5} />
              </div>
              <h2 id="events-heading" className="text-xs font-bold uppercase tracking-[0.15em] text-slate-800">
                Events
              </h2>
            </div>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
              {homeTiles.filter(t => ['/orders', '/menus', '/kitchen-menus'].includes(t.href)).map((tile) => (
                <li key={tile.href}>
                  <NavTile {...tile} />
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="finance-heading">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex size-7 items-center justify-center rounded-full bg-[#1c6434] text-white">
                <BarChart2 className="size-3.5" strokeWidth={2.5} />
              </div>
              <h2 id="finance-heading" className="text-xs font-bold uppercase tracking-[0.15em] text-slate-800">
                Finance
              </h2>
            </div>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
              {homeTiles.filter(t => ['/reports'].includes(t.href)).map((tile) => (
                <li key={tile.href}>
                  <NavTile {...tile} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
