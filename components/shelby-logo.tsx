import { cn } from "@/lib/utils";

export function ShelbyLogo({ className }: { className?: string }) {
  return (
    <img
      src="/images/verdact-logo-800.png"
      alt="Verdact"
      className={cn("h-10 w-10 object-contain", className)}
      width={40}
      height={40}
    />
  );
}
