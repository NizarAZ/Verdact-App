import { MarketplaceExperience } from "@/components/marketplace/MarketplaceExperience";
import { categories } from "@/lib/constants";
import { getCategoryStats, listCreators } from "@/lib/supabase-server";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function ExplorePage({
  searchParams
}: {
  searchParams: { access?: string; category?: string; sort?: string; q?: string };
}) {
  noStore();
  const access = searchParams.access === "free" || searchParams.access === "paid" ? searchParams.access : "all";
  const category = typeof searchParams.category === "string" && categories.includes(searchParams.category as any) ? searchParams.category : "";
  const sort = searchParams.sort === "subscribers" || searchParams.sort === "content" || searchParams.sort === "price_low" || searchParams.sort === "price_high" ? searchParams.sort : "newest";
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const [creators, latestDropCreators, categoryStats] = await Promise.all([
    listCreators({ access, category, sort, q }),
    listCreators({ sort: "newest" }),
    getCategoryStats()
  ]);

  return <MarketplaceExperience creators={creators} latestDropCreators={latestDropCreators} categoryStats={categoryStats} filters={{ access, category, sort, q }} />;
}
