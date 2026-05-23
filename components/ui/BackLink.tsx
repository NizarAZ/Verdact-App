"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type BackLinkProps = {
  href?: string;
  label?: string;
  className?: string;
};

export function BackLink({ href = "/", label = "Back", className = "" }: BackLinkProps) {
  return (
    <Link
      href={href}
      className={`interactive-control inline-flex min-h-10 items-center gap-2 border border-base px-3 font-mono text-xs text-text-tertiary hover:text-text-primary ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}
