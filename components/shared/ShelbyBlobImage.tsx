"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createBlobObjectUrl, readShelbyBlob } from "@/lib/shelby-browser";

type ShelbyBlobImageProps = {
  walletAddress?: string | null;
  blobId?: string | null;
  alt: string;
  className?: string;
  fallback?: ReactNode;
};

export function ShelbyBlobImage({ walletAddress, blobId, alt, className, fallback }: ShelbyBlobImageProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let active = true;
    setUrl(null);
    setFailed(false);

    async function load() {
      if (!walletAddress || !blobId) return;
      try {
        const bytes = await readShelbyBlob({ walletAddress, blobName: blobId });
        objectUrl = createBlobObjectUrl(bytes, "image/*");
        if (active) setUrl(objectUrl);
      } catch {
        if (active) setFailed(true);
      }
    }

    void load();
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [walletAddress, blobId]);

  if (!url || failed) return <>{fallback ?? null}</>;
  return <img src={url} alt={alt} className={className} />;
}
