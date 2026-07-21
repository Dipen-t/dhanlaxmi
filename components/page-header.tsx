import Image from "next/image";
import logo from "@/app/logo.png";
import { SoundMuteButton } from "@/components/sound-mute-button";

type PageHeaderProps = {
  title?: string;
};

export function PageHeader({ title }: PageHeaderProps) {
  return (
    <header className="relative flex w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2 md:gap-3">
        <Image 
          src={logo} 
          alt="Dhan Laxmi Catering Service" 
          className="h-24 w-auto object-contain md:h-32 shrink-0" 
          priority
        />
        {title ? (
          <h1 className="text-lg font-semibold text-muted uppercase tracking-widest">
            {title}
          </h1>
        ) : null}
      </div>
      <div className="absolute right-0 top-0">
        <SoundMuteButton />
      </div>
    </header>
  );
}
