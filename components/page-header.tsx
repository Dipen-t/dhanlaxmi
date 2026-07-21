import Image from "next/image";
import logo from "@/app/logo.png";
import { SoundMuteButton } from "@/components/sound-mute-button";

type PageHeaderProps = {
  title?: string;
};

export function PageHeader({ title }: PageHeaderProps) {
  return (
    <header className="mb-8 md:mb-12 flex w-full items-start justify-between">
      <div className="flex flex-col gap-2">
        <Image 
          src={logo} 
          alt="Dhan Laxmi Catering Service" 
          className="h-10 w-auto object-contain md:h-12 shrink-0" 
          priority
        />
        {title ? (
          <h1 className="text-base md:text-lg font-semibold text-muted tracking-wide mt-1">
            {title}
          </h1>
        ) : null}
      </div>
      <SoundMuteButton />
    </header>
  );
}
