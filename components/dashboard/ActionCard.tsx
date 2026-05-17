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
      className="group relative flex min-h-[148px] cursor-pointer flex-col justify-between rounded-[var(--radius-md)] border border-base border-l-[3px] border-l-brand bg-[color:var(--color-surface)] p-5 transition-[background,border-color,box-shadow,transform] duration-150 ease-out hover:-translate-y-0.5 hover:border-strong hover:border-l-brand hover:bg-white/[0.035] hover:shadow-[-8px_0_24px_var(--color-pink-soft)]"
    >
      <Icon className="h-5 w-5 text-brand transition-colors duration-150 ease-in group-hover:text-brand" />

      <div>
        <h2 className="font-display text-[26px] leading-none text-text-primary">{title}</h2>
        <p className="mt-3 max-w-[40ch] font-body text-[13px] leading-5 text-text-secondary">{description}</p>
      </div>

      <ArrowRight className="absolute right-5 top-5 h-3.5 w-3.5 text-text-tertiary opacity-0 transition-opacity duration-150 ease-in group-hover:opacity-100" />
    </Link>
  );
}
