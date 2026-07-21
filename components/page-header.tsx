import Image from "next/image";
import logo from "@/app/logo.png";
import { SoundMuteButton } from "@/components/sound-mute-button";

type PageHeaderProps = {
  title?: string;
};

export function PageHeader({ title }: PageHeaderProps) {
  return (
    <header className="mb-6 md:mb-8">
      <div className="flex items-center justify-between gap-3 md:gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Image 
            src={logo} 
            alt="Dhan Laxmi Catering Service" 
            className="h-10 w-auto object-contain md:h-12 shrink-0" 
            priority
          />
          {title ? (
            <>
              <div className="h-6 w-px bg-border hidden sm:block shrink-0"></div>
              <h1 className="text-base font-semibold text-muted truncate">
                {title}
              </h1>
            </>
          ) : null}
        </div>
        <SoundMuteButton />
      </div>
    </header>
  );
}
