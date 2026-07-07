import { UtensilsCrossed } from "lucide-react";

type PageHeaderProps = {
  title?: string;
};

export function PageHeader({ title = "Home" }: PageHeaderProps) {
  return (
    <header className="mb-8">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <UtensilsCrossed className="size-5" strokeWidth={2} aria-hidden />
        </div>
        <div>
          <p className="text-xl font-semibold tracking-[-0.02em] text-foreground [text-wrap:balance]">
            Dhan Laxmi Catering Service
          </p>
          <h1 className="text-sm font-normal text-muted">{title}</h1>
        </div>
      </div>
    </header>
  );
}
