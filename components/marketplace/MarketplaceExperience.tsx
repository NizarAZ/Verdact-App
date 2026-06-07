"use client";

import { useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, BadgeDollarSign, Eye, FileText, Image as ImageIcon, LockKeyhole, Play, Search, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PublicNav } from "@/components/marketplace/PublicNav";
import { ShelbyBlobImage } from "@/components/shared/ShelbyBlobImage";
import { ShelbyLogo } from "@/components/shelby-logo";
import { formatAmount, truncateMiddle } from "@/lib/format";
import { categories } from "@/lib/constants";
import type { CategoryStat, CreatorCard } from "@/lib/supabase-server";

type MarketplaceExperienceProps = {
  creators: CreatorCard[];
  latestDropCreators: CreatorCard[];
  categoryStats: CategoryStat[];
  filters: {
    access: "all" | "free" | "paid";
    category: string;
    sort: "newest" | "subscribers" | "content" | "price_low" | "price_high";
    q: string;
  };
};

const contentFormats = ["Video drops", "Education notes", "Research logs", "Image sets", "PDF vaults", "Course packs", "Data drops", "Creator notes"];

const runway = [
  { category: "Research", note: "papers, datasets, field notebooks" },
  { category: "Art", note: "process files, editions, source packs" },
  { category: "Education", note: "classes, decks, working documents" },
  { category: "Finance", note: "models, reports, member updates" },
  { category: "Lifestyle", note: "guides, behind-scenes, member posts" }
];

const featuredLanes = [
  {
    category: "Art",
    title: "Art lane",
    note: "process files, editions, source packs",
    cover: "/images/lane-art.svg"
  },
  {
    category: "Education",
    title: "Education lane",
    note: "classes, decks, working documents",
    cover: "/images/lane-education.svg"
  },
  {
    category: "Finance",
    title: "Finance lane",
    note: "models, reports, member updates",
    cover: "/images/lane-finance.svg"
  }
];

const trustBadges: Array<{ label: string; icon: LucideIcon }> = [
  { label: "Stored on Shelby", icon: ShieldCheck },
  { label: "Paid with ShelbyUSD", icon: BadgeDollarSign },
  { label: "Wallet-owned access", icon: Wallet },
  { label: "No wallet needed to browse", icon: Search }
];

function PreviewIcon({ type }: { type?: string | null }) {
  const Icon = type?.startsWith("video/")
    ? Play
    : type?.startsWith("image/")
        ? ImageIcon
        : FileText;
  return <Icon className="h-4 w-4 text-[color:var(--market-accent)]" />;
}

function MarketplaceCard({ creator, featured = false }: { creator: CreatorCard; featured?: boolean }) {
  const initials = (creator.display_name || creator.wallet_address || "V").slice(0, 1);
  const latestPreview = creator.latest_preview_content[0];
  const hasPreviews = creator.latest_preview_content.length > 0;
  const previewThumbnail = creator.latest_preview_content.find((item) => item.thumbnail_blob_id)?.thumbnail_blob_id;

  return (
    <Link
      href={`/creator/${creator.wallet_address}`}
      data-reveal
      className={`market-card group block overflow-hidden ${featured ? "min-h-[560px]" : ""}`}
    >
      <div className={`${featured ? "h-[300px]" : "h-[210px]"} relative border-b border-[color:var(--market-border)] bg-[color:var(--market-surface-strong)]`}>
        {creator.cover_blob_id || previewThumbnail ? (
          <ShelbyBlobImage
            walletAddress={creator.wallet_address}
            blobId={creator.cover_blob_id || previewThumbnail}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-85 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(var(--market-grid)_1px,transparent_1px),linear-gradient(90deg,var(--market-grid)_1px,transparent_1px)] bg-[length:32px_32px]" />
        )}
        {!creator.cover_blob_id && !previewThumbnail ? (
          <div className="absolute inset-4 overflow-hidden border border-[color:var(--market-border)] bg-[color:var(--market-bg)]">
            <div className="pointer-events-none absolute inset-0 opacity-80 transition-transform duration-500 group-hover:scale-105">
              <div className="absolute left-5 top-5 h-20 w-[58%] border border-[color:var(--market-line)] bg-[linear-gradient(135deg,var(--market-bg),var(--market-surface))]" />
              <div className="absolute bottom-6 left-5 h-16 w-[72%] border border-[color:var(--market-line)] bg-[linear-gradient(90deg,transparent_0_7%,var(--market-accent)_7%_9%,transparent_9%_18%,var(--market-accent)_18%_22%,transparent_22%)] opacity-80" />
              <div className="absolute right-6 top-7 h-28 w-20 border border-[color:var(--market-line)] bg-[color:var(--market-paper)]">
                <div className="m-3 h-2 bg-[color:var(--market-accent)]" />
                <div className="mx-3 mt-3 h-1 bg-[color:var(--market-ink)] opacity-30" />
                <div className="mx-3 mt-2 h-1 bg-[color:var(--market-ink)] opacity-25" />
                <div className="mx-3 mt-2 h-8 border border-[color:var(--market-accent)]" />
              </div>
            </div>
          </div>
        ) : null}
        <div className="pointer-events-none absolute bottom-5 left-5 flex h-16 w-16 items-center justify-center overflow-hidden border border-[color:var(--market-border-strong)] bg-[color:var(--market-bg)] font-display text-5xl leading-none text-[color:var(--market-text)]">
          <ShelbyBlobImage
            walletAddress={creator.wallet_address}
            blobId={creator.avatar_blob_id}
            alt=""
            className="h-full w-full object-cover"
            fallback={initials}
          />
        </div>
        <span className="pointer-events-none absolute right-5 top-5 border border-[color:var(--market-border)] bg-[color:var(--market-bg)] px-3 py-2 font-mono text-[11px] text-[color:var(--market-accent)]">
          {creator.is_paid ? `${formatAmount(creator.price_monthly)} ShelbyUSD/month` : "FREE + DONATIONS"}
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className={`${featured ? "text-6xl" : "text-4xl"} truncate font-display leading-none text-[color:var(--market-text)]`}>
              {creator.display_name || "Untitled creator"}
            </h2>
            <p className="mt-2 font-mono text-xs text-[color:var(--market-muted)]">wallet / {truncateMiddle(creator.wallet_address)}</p>
          </div>
          <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-[color:var(--market-muted)] transition-colors group-hover:text-[color:var(--market-accent)]" />
        </div>
        <p className={`${featured ? "min-h-[72px] text-base leading-6" : "min-h-[64px] text-sm leading-5"} mt-5 line-clamp-3 text-[color:var(--market-muted)]`}>
          {creator.bio || "Public Shelby storefront waiting for its first creator note."}
        </p>
        <div className="mt-5 grid grid-cols-2 border border-[color:var(--market-border)] font-mono text-[11px] text-[color:var(--market-muted)] sm:grid-cols-4">
          <span className="border-b border-r border-[color:var(--market-border)] px-2 py-2 sm:border-b-0">{creator.category || "Other"}</span>
          <span className="border-b border-r border-[color:var(--market-border)] px-2 py-2 sm:border-b-0">{creator.is_paid ? "paid vault" : "free storefront"}</span>
          <span className="border-r border-[color:var(--market-border)] px-2 py-2">{creator.content_count} files</span>
          <span className="px-2 py-2">{creator.subscriber_count} subscribers</span>
        </div>
        <div className="mt-5 border-t border-[color:var(--market-border)] pt-4">
          {hasPreviews ? (
            <div className="grid gap-2">
              {creator.latest_preview_content.slice(0, featured ? 4 : 3).map((item) => (
                <div key={item.id} className="flex items-center gap-2 font-mono text-xs text-[color:var(--market-muted)]">
                  <PreviewIcon type={item.file_type} />
                  <span className="truncate">{item.title}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-mono text-xs text-[color:var(--market-muted)]">
              {creator.content_count > 0
                ? `${creator.content_count} files uploaded. Public previews coming soon.`
                : "Private vault active. First public preview coming soon."}
            </p>
          )}
        </div>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-[color:var(--market-border)] pt-4">
          <span className="truncate font-mono text-xs text-[color:var(--market-muted)]">
            {latestPreview ? `Latest / ${latestPreview.title}` : creator.is_paid ? "Subscribe to unlock full vault" : "Open public storefront"}
          </span>
          <span className="shrink-0 font-mono text-xs text-[color:var(--market-accent)]">View storefront</span>
        </div>
      </div>
    </Link>
  );
}

function FeedRow({ creator, index }: { creator: CreatorCard; index: number }) {
  const preview = creator.latest_preview_content[0];
  return (
    <Link href={`/creator/${creator.wallet_address}`} data-reveal className="market-panel group grid gap-4 p-4 transition-colors hover:border-[color:var(--market-accent)] md:grid-cols-[auto_1fr_auto] md:items-center">
      <span className="font-display text-5xl leading-none text-[color:var(--market-muted)]">{String(index + 1).padStart(2, "0")}</span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display text-3xl leading-none text-[color:var(--market-text)]">{creator.display_name || "Untitled creator"}</p>
          <span className="border border-[color:var(--market-border)] px-2 py-1 font-mono text-[10px] text-[color:var(--market-muted)]">{creator.category || "Other"}</span>
          <span className="border border-[color:var(--market-border)] px-2 py-1 font-mono text-[10px] text-[color:var(--market-accent)]">{creator.is_paid ? `${formatAmount(creator.price_monthly)} / month` : "FREE"}</span>
        </div>
        <p className="mt-2 truncate font-mono text-xs text-[color:var(--market-muted)]">
          {preview ? `Recent public preview / ${preview.title}` : creator.content_count > 0 ? `${creator.content_count} vault files / public preview not published yet` : `Storefront open / ${truncateMiddle(creator.wallet_address)}`}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-[color:var(--market-muted)]">
        <span className="inline-flex items-center gap-1" title="Published files"><FileText className="h-3.5 w-3.5 text-[color:var(--market-accent)]" />{creator.content_count} files</span>
        <span className="inline-flex items-center gap-1" title="Active subscribers"><Eye className="h-3.5 w-3.5 text-[color:var(--market-accent)]" />{creator.subscriber_count} subscribers</span>
        <span className="inline-flex items-center gap-1" title={creator.is_paid ? "Paid vault" : "Free storefront"}>
          {creator.is_paid ? <LockKeyhole className="h-4 w-4 text-[color:var(--market-accent)]" /> : <Wallet className="h-4 w-4 text-[color:var(--market-accent)]" />}
          {creator.is_paid ? "paid" : "free"}
        </span>
        <ArrowUpRight className="h-4 w-4 text-[color:var(--market-muted)] transition-colors group-hover:text-[color:var(--market-accent)]" />
      </div>
    </Link>
  );
}

function OpenLaneRow({ item, index }: { item: (typeof runway)[number]; index: number }) {
  return (
    <Link href={`/?category=${encodeURIComponent(item.category)}`} data-reveal className="market-panel grid gap-4 p-4 transition-colors hover:border-[color:var(--market-accent)] md:grid-cols-[auto_1fr_auto] md:items-center">
      <span className="font-display text-5xl leading-none text-[color:var(--market-muted)]">{String(index + 1).padStart(2, "0")}</span>
      <div>
        <p className="font-display text-3xl leading-none text-[color:var(--market-text)]">{item.category} lane</p>
        <p className="mt-2 font-mono text-xs text-[color:var(--market-muted)]">{item.note}</p>
      </div>
      <span className="font-mono text-xs text-[color:var(--market-accent)]">open lane</span>
    </Link>
  );
}

function LatestDropCard({ creator, item, index }: { creator: CreatorCard; item: CreatorCard["latest_preview_content"][number]; index: number }) {
  return (
    <Link href={`/creator/${creator.wallet_address}`} data-reveal className="market-card grid min-h-[220px] overflow-hidden md:grid-cols-[0.7fr_1fr]">
      <div className="relative border-b border-[color:var(--market-border)] bg-[color:var(--market-surface-strong)] md:border-b-0 md:border-r">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(var(--market-grid)_1px,transparent_1px),linear-gradient(90deg,var(--market-grid)_1px,transparent_1px)] bg-[length:26px_26px]" />
        {item.thumbnail_blob_id ? (
          <ShelbyBlobImage
            walletAddress={item.wallet_address || creator.wallet_address}
            blobId={item.thumbnail_blob_id}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            fallback={null}
          />
        ) : null}
        {item.thumbnail_blob_id ? <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_52%,rgba(23,18,13,0.22))]" /> : null}
        <div className="pointer-events-none absolute left-5 top-5 font-display text-6xl leading-none text-[color:var(--market-muted)]">{String(index + 1).padStart(2, "0")}</div>
        <div className="pointer-events-none absolute bottom-5 right-5 flex h-11 w-11 items-center justify-center border border-[color:var(--market-border)] bg-[color:var(--market-bg)]">
          <PreviewIcon type={item.file_type} />
        </div>
      </div>
      <div className="p-5">
        <div className="flex flex-wrap gap-2 font-mono text-[10px] text-[color:var(--market-muted)]">
          <span className="border border-[color:var(--market-border)] px-2 py-1">{creator.category || "Other"}</span>
          <span className="border border-[color:var(--market-border)] px-2 py-1">{item.file_type || "file"}</span>
          <span className="border border-[color:var(--market-border)] px-2 py-1 text-[color:var(--market-accent)]">preview</span>
        </div>
        <p className="mt-9 font-display text-4xl leading-none text-[color:var(--market-text)]">{item.title}</p>
        <p className="mt-3 font-mono text-xs text-[color:var(--market-muted)]">{creator.display_name || truncateMiddle(creator.wallet_address)}</p>
        {item.description ? <p className="mt-3 line-clamp-2 text-sm leading-5 text-[color:var(--market-muted)]">{item.description}</p> : null}
      </div>
    </Link>
  );
}

function LaneFeatureCard({ lane, index, creatorCount, fileCount }: { lane: (typeof featuredLanes)[number]; index: number; creatorCount: number; fileCount: number }) {
  return (
    <Link
      href={`/?category=${encodeURIComponent(lane.category)}`}
      data-stack-card
      data-reveal
      className="interactive-control market-lane-card group"
    >
      <div className="market-lane-cover">
        <img src={lane.cover} alt="" aria-hidden="true" />
        <span className="market-lane-index">{String(index + 1).padStart(2, "0")}</span>
      </div>
      <div className="market-lane-body">
        <div className="flex items-start justify-between gap-4">
          <p className="font-display text-5xl leading-none text-[color:var(--market-text)]">{lane.title}</p>
          <ArrowUpRight className="h-5 w-5 shrink-0 text-[color:var(--market-muted)] transition-colors group-hover:text-[color:var(--market-accent)]" />
        </div>
        <p className="mt-4 text-sm leading-6 text-[color:var(--market-muted)]">{lane.note}</p>
        <div className="mt-6 grid grid-cols-2 border border-[color:var(--market-border)] font-mono text-xs text-[color:var(--market-muted)]">
          <span className="border-r border-[color:var(--market-border)] p-3">{creatorCount} creators</span>
          <span className="p-3">{fileCount} files</span>
        </div>
        <p className="mt-5 border-t border-[color:var(--market-border)] pt-4 font-mono text-xs text-[color:var(--market-accent)]">
          Filter {lane.category}
        </p>
      </div>
    </Link>
  );
}

export function MarketplaceExperience({ creators, latestDropCreators, categoryStats, filters }: MarketplaceExperienceProps) {
  const spotlight = creators[0];
  const gridCreators = creators;
  const feedCreators = creators.slice(0, 7);
  const latestDrops = useMemo(() => latestDropCreators.flatMap((creator) => creator.latest_preview_content.map((item) => ({ creator, item }))).slice(0, 6), [latestDropCreators]);
  const categorySummary = useMemo(() => {
    const counts = new Map<string, number>();
    for (const stat of categoryStats) counts.set(stat.category || "Other", stat.creators);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [categoryStats]);
  const categoryStatsMap = useMemo(() => {
    const stats = new Map<string, { creators: number; files: number }>();
    for (const stat of categoryStats) stats.set(stat.category || "Other", { creators: stat.creators, files: stat.files });
    return stats;
  }, [categoryStats]);
  const totals = useMemo(() => ({
    creators: creators.length,
    files: creators.reduce((total, creator) => total + creator.content_count, 0),
    paid: creators.filter((creator) => creator.is_paid).length,
    previews: creators.reduce((total, creator) => total + creator.latest_preview_content.length, 0)
  }), [creators]);

  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cleanup = () => {};
    let active = true;

    Promise.all([import("gsap"), import("gsap/ScrollTrigger"), import("@studio-freight/lenis")]).then(([gsapModule, scrollModule, lenisModule]) => {
      if (!active) return;
      const gsap = gsapModule.gsap;
      const ScrollTrigger = scrollModule.ScrollTrigger;
      const Lenis = lenisModule.default;
      gsap.registerPlugin(ScrollTrigger);

      const lenis = new Lenis({ duration: 1.08, smoothWheel: true });
      let rafId = 0;
      const raf = (time: number) => {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);
      lenis.on("scroll", ScrollTrigger.update);

      gsap.fromTo("[data-hero-copy]", { y: 48, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.08, ease: "power3.out" });
      gsap.to("[data-hero-art]", {
        y: -70,
        rotate: -1.5,
        scrollTrigger: { trigger: "[data-hero]", start: "top top", end: "bottom top", scrub: 0.8 }
      });
      gsap.to("[data-horizontal-strip]", {
        xPercent: -16,
        ease: "none",
        scrollTrigger: { trigger: "[data-runway]", start: "top bottom", end: "bottom top", scrub: 1 }
      });
      gsap.utils.toArray<HTMLElement>("[data-stack-card]").forEach((card, index) => {
        gsap.to(card, {
          y: index * -18,
          scale: 1 - index * 0.018,
          scrollTrigger: { trigger: card, start: "top 72%", end: "bottom 30%", scrub: 0.7 }
        });
      });
      ScrollTrigger.batch("[data-reveal]", {
        start: "top 86%",
        interval: 0.08,
        batchMax: 6,
        onEnter: (batch) => gsap.fromTo(batch, { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: 0.65, stagger: 0.06, ease: "power3.out", overwrite: true })
      });
      ScrollTrigger.refresh();

      cleanup = () => {
        cancelAnimationFrame(rafId);
        lenis.destroy();
        ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      };
    });

    return () => {
      active = false;
      cleanup();
    };
  }, []);

  return (
    <main className="shelby-page market-page min-h-screen overflow-hidden">
      <PublicNav />

      <section data-hero className="market-hero-shell grid min-h-[calc(100vh-92px)] items-center gap-10 pb-20 pt-10 lg:grid-cols-[0.82fr_1.18fr] xl:gap-16">
        <div>
          <p data-hero-copy className="mb-5 font-mono text-sm text-[color:var(--market-accent)]">PUBLIC CREATOR MARKETPLACE</p>
          <h1 data-hero-copy className="market-hero-title max-w-[760px]">
            Creator storefronts with no platform in the middle.
          </h1>
          <p data-hero-copy className="mt-8 max-w-2xl text-xl leading-8 text-[color:var(--market-muted)]">
            Creator storefronts with no platform in the middle. Browse public previews, discover paid vaults, and support creators directly from wallet to wallet on Shelby.
          </p>
          <div data-hero-copy className="market-hero-stats mt-8">
            <div><strong>{totals.creators}</strong><span>storefronts</span></div>
            <div><strong>{totals.previews}</strong><span>public previews</span></div>
            <div><strong>{totals.paid}</strong><span>paid vaults</span></div>
          </div>
          <div data-hero-copy className="mt-9 flex flex-wrap gap-3">
            <Link href="#creator-grid" className="interactive-control inline-flex min-h-12 items-center gap-3 bg-[color:var(--market-action)] px-5 font-mono text-sm text-[color:var(--market-text)]">
              Explore creators <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link href="/vault" className="interactive-control inline-flex min-h-12 items-center border border-[color:var(--market-border)] px-5 font-mono text-sm text-[color:var(--market-text)]">
              Start creator vault
            </Link>
          </div>
        </div>

        <motion.div
          data-hero-art
          className="market-poster-wrap"
          initial={{ opacity: 0, y: 34, rotate: 1.5 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.7, delay: 0.18, ease: "easeOut" }}
        >
          <Image
            src="/images/verdact-marketplace-hero-gemini.png"
            alt="Premium creator marketplace shelf with storefront cards, vault access, and wallet receipt modules"
            fill
            priority
            sizes="(min-width: 1024px) 44vw, 100vw"
            className="object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(13,12,10,0.42))]" />
        </motion.div>
      </section>

      <section className="border-y border-[color:var(--market-border)] py-4" data-pattern="marquee-rail">
        <div className="market-marquee">
          {[...contentFormats, ...contentFormats].map((item, index) => (
            <span key={`${item}-${index}`} className="mx-6 inline-flex items-center gap-3 font-display text-5xl leading-none text-[color:var(--market-text)]">
              {item}
              <Sparkles className="h-5 w-5 text-[color:var(--market-accent)]" />
            </span>
          ))}
        </div>
      </section>

      <section className="container-shell py-14" data-pattern="latest-drops">
        <div className="mb-8">
          <h2 className="max-w-3xl font-display text-7xl leading-none text-[color:var(--market-text)]">Latest public drops</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {latestDrops.length > 0 ? latestDrops.map(({ creator, item }, index) => (
            <LatestDropCard key={`${creator.id}-${item.id}`} creator={creator} item={item} index={index} />
          )) : runway.slice(0, 3).map((item, index) => (
            <div key={item.category} data-reveal className="market-panel min-h-[220px] p-5">
              <p className="font-display text-5xl leading-none text-[color:var(--market-text)]">{item.category} previews</p>
              <p className="mt-5 text-sm leading-6 text-[color:var(--market-muted)]">{item.note}</p>
              <p className="mt-10 border-t border-[color:var(--market-border)] pt-4 font-mono text-xs text-[color:var(--market-accent)]">Private vault active. Public previews coming soon.</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-shell py-8" data-pattern="filters">
        <form action="/explore" className="market-filter-grid">
          <label>
            <span>Search</span>
            <input
              name="q"
              defaultValue={filters.q}
              placeholder="Search creators by name, category, or description..."
              className="market-filter-input"
            />
          </label>
          <label>
            <span>Category</span>
            <select name="category" defaultValue={filters.category} className="market-filter-input">
              <option value="">All categories</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <label>
            <span>Access</span>
            <select name="access" defaultValue={filters.access} className="market-filter-input">
              <option value="all">All access</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </label>
          <label>
            <span>Sort</span>
            <select name="sort" defaultValue={filters.sort} className="market-filter-input">
              <option value="newest">Newest</option>
              <option value="subscribers">Most subscribers</option>
              <option value="price_low">Price: low to high</option>
              <option value="price_high">Price: high to low</option>
              <option value="content">Most content</option>
            </select>
          </label>
          <button type="submit" className="interactive-control market-filter-button">Apply filters</button>
        </form>
      </section>

      <section className="container-shell grid gap-8 py-16 lg:grid-cols-[0.72fr_1.28fr]" data-pattern="sticky-stack">
        <div className="lg:sticky lg:top-8 lg:h-fit">
          <h2 className="font-display text-7xl leading-none text-[color:var(--market-text)]">Find the vault that fits your feed.</h2>
          <p className="mt-6 max-w-md text-base leading-7 text-[color:var(--market-muted)]">
            Browse by creative lane: public previews first, creator storefronts second, wallet actions only when you are ready.
          </p>
        </div>
        <div className="market-lane-showcase">
          {featuredLanes.map((lane, index) => (
            <LaneFeatureCard
              key={lane.category}
              lane={lane}
              index={index}
              creatorCount={categoryStatsMap.get(lane.category)?.creators ?? 0}
              fileCount={categoryStatsMap.get(lane.category)?.files ?? 0}
            />
          ))}
        </div>
      </section>

      <section data-runway className="py-14" data-pattern="horizontal-drift">
        <div data-horizontal-strip className="flex w-max gap-5 px-[max(20px,calc((100vw-var(--max))/2))]">
          {[...runway, ...runway].map((item, index) => (
            <Link
              key={`${item.category}-${index}`}
              href={`/?category=${encodeURIComponent(item.category)}`}
              className="interactive-control market-runway-card"
            >
              <span className="font-mono text-xs text-[color:var(--market-accent)]">{String(index + 1).padStart(2, "0")}</span>
              <span className="mt-10 block font-display text-6xl leading-none text-[color:var(--market-text)]">{item.category}</span>
              <span className="mt-5 block max-w-[250px] text-sm leading-5 text-[color:var(--market-muted)]">{item.note}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-shell grid gap-6 py-14 lg:grid-cols-[0.8fr_1.2fr]" data-pattern="feed-board">
        <div className="market-panel p-6">
          <h2 className="font-display text-6xl leading-none text-[color:var(--market-text)]">Content feed</h2>
          <p className="mt-5 max-w-md text-sm leading-6 text-[color:var(--market-muted)]">
            A tighter pulse of what is live: creators, latest previews, access cues, and open category lanes when the marketplace is still early.
          </p>
          <div className="mt-8 grid gap-2">
            {(categorySummary.length > 0 ? categorySummary : runway.slice(0, 5).map((item) => [item.category, 0] as [string, number])).map(([categoryName, count]) => (
              <div key={categoryName} className="flex items-center justify-between border border-[color:var(--market-border)] px-3 py-2 font-mono text-xs text-[color:var(--market-muted)]">
                <span>{categoryName}</span>
                <span className="text-[color:var(--market-accent)]">{count} storefronts</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-3">
          {feedCreators.length > 0
            ? feedCreators.map((creator, index) => <FeedRow key={creator.id} creator={creator} index={index} />)
            : runway.slice(0, 7).map((item, index) => <OpenLaneRow key={item.category} item={item} index={index} />)}
        </div>
      </section>

      <section className="container-shell grid gap-6 py-16 lg:grid-cols-[1.05fr_0.95fr]" data-pattern="pinned-scrub">
        {spotlight ? (
          <MarketplaceCard creator={spotlight} featured />
        ) : (
          <div data-reveal className="market-card min-h-[560px] p-6">
            <Wallet className="h-8 w-8 text-[color:var(--market-accent)]" />
            <h2 className="mt-24 max-w-xl font-display text-7xl leading-none text-[color:var(--market-text)]">The first creator gets the front window.</h2>
            <p className="mt-6 max-w-md text-base leading-7 text-[color:var(--market-muted)]">
              Once a vault exists in Supabase, this area becomes the featured storefront instead of a placeholder.
            </p>
          </div>
        )}
        <div className="grid gap-5">
          <div data-reveal className="market-panel min-h-[260px] p-6">
            <p className="font-display text-6xl leading-none text-[color:var(--market-text)]">Wallet payments. Shelby storage. Public discovery.</p>
            <p className="mt-6 max-w-lg text-base leading-7 text-[color:var(--market-muted)]">
              Verdact lists metadata for browsing while media stays in creator-owned Shelby blobs. Public pages never require wallet connection until the visitor acts.
            </p>
            <div className="market-trust-grid mt-6">
              {trustBadges.map(({ label, icon: Icon }) => (
                <div key={label} className="market-trust-badge">
                  <Icon className="h-4 w-4 text-[color:var(--market-accent)]" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div data-reveal className="grid gap-5 md:grid-cols-2">
            <div className="market-panel p-5">
              <p className="font-mono text-xs text-[color:var(--market-accent)]">FREE STOREFRONTS</p>
              <p className="mt-10 text-sm leading-6 text-[color:var(--market-muted)]">Free storefronts are public content plus direct donations. Visitors can browse without a wallet and support when they choose.</p>
            </div>
            <div className="market-panel p-5">
              <p className="font-mono text-xs text-[color:var(--market-accent)]">PAID VAULTS</p>
              <p className="mt-10 text-sm leading-6 text-[color:var(--market-muted)]">Paid vaults are public previews plus subscription-gated Shelby blobs. Full content only loads after access is verified.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="creator-grid" className="container-shell py-16" data-pattern="batch-reveal">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <h2 className="max-w-3xl font-display text-7xl leading-none text-[color:var(--market-text)]">New creators</h2>
          <p className="max-w-md text-sm leading-6 text-[color:var(--market-muted)]">
            Creator cards expose enough context to browse without a wallet: access type, category, preview activity, and the creator address.
          </p>
        </div>
        <div className="grid auto-rows-fr gap-5 md:grid-cols-2 xl:grid-cols-3">
          {gridCreators.length > 0 ? (
            gridCreators.map((creator, index) => (
              <div key={creator.id} className={gridCreators.length <= 2 || index === 0 ? "xl:col-span-2" : ""}>
                <MarketplaceCard creator={creator} featured={gridCreators.length <= 2 || index === 0} />
              </div>
            ))
          ) : (
            <div data-reveal className="market-panel min-h-[260px] p-6 md:col-span-2 xl:col-span-3">
              <p className="font-display text-6xl leading-none text-[color:var(--market-text)]">No storefronts match this view yet.</p>
              <p className="mt-5 max-w-xl text-sm leading-6 text-[color:var(--market-muted)]">
                Try another category, reset filters, or start the first public creator vault for this lane.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/" className="interactive-control inline-flex min-h-12 items-center border border-[color:var(--market-border)] px-5 font-mono text-sm text-[color:var(--market-text)]">
                Reset filters
              </Link>
              <Link href="/vault" className="interactive-control inline-flex min-h-12 items-center bg-[color:var(--market-action)] px-5 font-mono text-sm text-[color:var(--market-text)]">
                Create a storefront
              </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="container-shell pb-24 pt-12" data-pattern="fade-lift">
        <div data-reveal className="market-closer">
          <h2 className="max-w-5xl font-display text-7xl leading-none text-[color:var(--market-text)]">A marketplace first. A creator vault when you need one.</h2>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/" className="interactive-control inline-flex min-h-12 items-center border border-[color:var(--market-border)] px-5 font-mono text-sm text-[color:var(--market-text)]">
              Reset filters
            </Link>
            <Link href="/vault" className="interactive-control inline-flex min-h-12 items-center bg-[color:var(--market-action)] px-5 font-mono text-sm text-[color:var(--market-text)]">
              Create a storefront
            </Link>
          </div>
        </div>
      </section>
      <footer className="container-shell flex flex-wrap items-center gap-2 border-t border-[color:var(--market-border)] py-8 font-mono text-xs text-[color:var(--market-muted)]">
        <span>Built on</span>
        <ShelbyLogo className="h-5 w-5" />
        <span>Shelby Protocol and Aptos</span>
      </footer>
    </main>
  );
}
