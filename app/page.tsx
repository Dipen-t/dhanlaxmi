import Image from "next/image";
import { Package, Calendar, BarChart2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { NavTile } from "@/components/nav-tile";
import { homeTiles } from "@/lib/nav-config";

export default function HomePage() {
  return (
    <div className="relative flex min-h-dvh w-full flex-col px-5 py-8 sm:px-8 sm:py-10 md:px-10 md:py-12 bg-[#F8FAF9] overflow-hidden">
      {/* Background Bottom Right */}
      <div className="fixed bottom-0 right-0 z-0 pointer-events-none w-[300px] h-[300px] md:w-[450px] md:h-[450px] opacity-20 translate-x-4 translate-y-4">
        <Image 
          src="/bottom-right.jpeg"
          alt=""
          fill
          className="object-contain mix-blend-multiply" 
          style={{ objectPosition: 'bottom right' }}
        />
      </div>
      
      <div className="relative z-10 w-full flex flex-col h-full flex-1">
        <PageHeader />

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 md:mb-8">
          <div className="flex-1 max-w-2xl">
            <h1 className="text-4xl md:text-5xl leading-tight font-serif font-bold text-slate-800 mb-2 md:mb-3">
              Welcome back!
            </h1>
            <p className="text-base md:text-lg text-muted">
              Manage your operations, events, and finances seamlessly.
            </p>
          </div>
          <div className="mt-6 md:mt-0 md:ml-8 w-full md:w-[280px] lg:w-[340px] shrink-0">
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Main Content: Primary Tasks */}
          <div className="lg:col-span-8 flex flex-col gap-10">
            <section aria-labelledby="events-heading">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex size-8 items-center justify-center rounded-xl bg-[#1c6434] text-white">
                  <Calendar className="size-4" strokeWidth={2.5} />
                </div>
                <h2 id="events-heading" className="text-xl font-semibold text-slate-800">
                  Events & Menus
                </h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="sm:col-span-2">
                  {homeTiles.filter(t => t.href === '/orders').map((tile) => (
                    <NavTile key={tile.href} {...tile} variant="featured" />
                  ))}
                </div>
                {homeTiles.filter(t => ['/menus', '/kitchen-menus'].includes(t.href)).map((tile) => (
                  <NavTile key={tile.href} {...tile} variant="featured" />
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar: Secondary Tasks */}
          <div className="lg:col-span-4 flex flex-col gap-10">
            <section aria-labelledby="ops-heading">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex size-8 items-center justify-center rounded-xl bg-[#1c6434]/10 text-[#1c6434]">
                  <Package className="size-4" strokeWidth={2.5} />
                </div>
                <h2 id="ops-heading" className="text-xl font-semibold text-slate-800">
                  Operations
                </h2>
              </div>
              <div className="flex flex-col gap-3">
                {homeTiles.filter(t => ['/raw-materials', '/vendors'].includes(t.href)).map((tile) => (
                  <NavTile key={tile.href} {...tile} variant="compact" />
                ))}
              </div>
            </section>

            <section aria-labelledby="finance-heading">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex size-8 items-center justify-center rounded-xl bg-[#1c6434]/10 text-[#1c6434]">
                  <BarChart2 className="size-4" strokeWidth={2.5} />
                </div>
                <h2 id="finance-heading" className="text-xl font-semibold text-slate-800">
                  Finance
                </h2>
              </div>
              <div className="flex flex-col gap-3">
                {homeTiles.filter(t => ['/reports'].includes(t.href)).map((tile) => (
                  <NavTile key={tile.href} {...tile} variant="compact" />
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
