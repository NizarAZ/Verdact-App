import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackToDashboard() {
  return (
    <Link
      href="/app"
      className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-md)] border border-base px-3 font-mono text-sm text-text-secondary transition-colors duration-150 ease-in hover:border-strong hover:text-text-primary"
    >
      <ArrowLeft className="h-4 w-4" />
      Dashboard
    </Link>
  );
}
