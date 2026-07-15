import { UtensilsCrossed } from "lucide-react";

import { SoundMuteButton } from "@/components/sound-mute-button";

type PageHeaderProps = {
  title?: string;
};

export function PageHeader({ title }: PageHeaderProps) {
  return (
    <header className="mb-6 md:mb-8">
      <div className="flex items-center gap-3 md:gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground md:size-12 shadow-sm shadow-primary/20">
          <UtensilsCrossed className="size-5 md:size-6" strokeWidth={2.5} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-2xl font-bold tracking-[-0.03em] text-foreground [text-wrap:balance] md:text-3xl">
            Dhan Laxmi Catering Service
          </p>
          {title ? (
            <h1 className="mt-0.5 text-sm font-normal text-muted md:text-base">
              {title}
            </h1>
          ) : null}
        </div>
        <SoundMuteButton />
      </div>
    </header>
  );
}
