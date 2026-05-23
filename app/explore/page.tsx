import { MarketplaceExperience } from "@/components/marketplace/MarketplaceExperience";
import { categories } from "@/lib/constants";
import { listCreators } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function ExplorePage({
  searchParams
}: {
  searchParams: { access?: string; category?: string; sort?: string; q?: string };
}) {
  const access = searchParams.access === "free" || searchParams.access === "paid" ? searchParams.access : "all";
  const category = typeof searchParams.category === "string" && categories.includes(searchParams.category as any) ? searchParams.category : "";
  const sort = searchParams.sort === "subscribers" || searchParams.sort === "content" ? searchParams.sort : "newest";
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const creators = await listCreators({ access, category, sort, q });

  return <MarketplaceExperience creators={creators} filters={{ access, category, sort, q }} />;
}
