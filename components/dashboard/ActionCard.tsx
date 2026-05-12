import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

type ActionCardProps = {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
};

export function ActionCard({ href, icon: Icon, title, description }: ActionCardProps) {
  return (
    <Link
      href={href}
      className="group relative flex min-h-[220px] cursor-pointer flex-col justify-between rounded-[var(--radius-md)] border border-base bg-bg-surface p-8 transition-[background,border-color] duration-150 ease-in hover:border-strong hover:bg-bg-elevated"
    >
      <Icon className="h-[22px] w-[22px] text-brand transition-colors duration-150 ease-in group-hover:text-brand" />

      <div>
        <h2 className="font-display text-xl text-text-primary">{title}</h2>
        <p className="mt-3 max-w-[30ch] font-body text-[13px] leading-5 text-text-secondary">{description}</p>
      </div>

      <ArrowRight className="absolute bottom-8 right-8 h-3.5 w-3.5 text-text-tertiary opacity-0 transition-opacity duration-150 ease-in group-hover:opacity-100" />
    </Link>
  );
}
