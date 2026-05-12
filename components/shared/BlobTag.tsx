type BlobTagProps = {
  value: string;
};

export function BlobTag({ value }: BlobTagProps) {
  return (
    <span className="inline-flex max-w-full items-center truncate rounded-md border border-base bg-bg-elevated px-2 py-1 font-mono text-[11px] text-text-secondary">
      {value}
    </span>
  );
}
