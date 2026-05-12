type VerifiedBadgeProps = {
  verified: boolean;
};

export function VerifiedBadge({ verified }: VerifiedBadgeProps) {
  return (
    <span className="inline-flex items-center gap-2 font-body text-xs text-text-secondary">
      <span className={verified ? "h-2 w-2 rounded-full bg-[var(--success)]" : "h-2 w-2 rounded-full bg-text-tertiary"} />
      {verified ? "Verified" : "Unverified"}
    </span>
  );
}
