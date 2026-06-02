"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, Eye, Gift, LineChart as LineChartIcon, Radio, Users } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { useWallet } from "@/components/WalletProvider";
import { WalletButton } from "@/components/wallet/WalletButton";
import { BackLink } from "@/components/ui/BackLink";
import { formatAmount, truncateMiddle } from "@/lib/format";

type ChartDatum = { date?: string; name?: string; value?: number; views?: number };

const chartStroke = "rgba(102,76,35,0.18)";
const mutedStroke = "rgba(74,54,24,0.62)";
const axisTick = { fontSize: 11, fill: mutedStroke };

function hasValues(items?: ChartDatum[], key: "value" | "views" = "value") {
  return Boolean(items?.some((item) => Number(item[key] ?? 0) > 0));
}

function AnalyticsEmpty({ title, body, actionHref, action }: { title: string; body: string; actionHref: string; action: string }) {
  return (
    <div className="vault-chart-empty p-6 text-center">
      <div>
        <Radio className="mx-auto h-7 w-7 text-brand" />
        <p className="mt-5 font-display text-4xl leading-none text-text-primary">{title}</p>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-text-tertiary">{body}</p>
        <Link href={actionHref} className="interactive-control mt-5 inline-flex min-h-10 items-center bg-brand px-4 font-mono text-xs text-brand-dark">
          {action}
        </Link>
      </div>
    </div>
  );
}

function ChartPanel({
  title,
  note,
  hasData,
  children
}: {
  title: string;
  note: string;
  hasData: boolean;
  children: React.ReactElement;
}) {
  return (
    <section className="vault-panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-4xl leading-none text-text-primary">{title}</h2>
          <p className="mt-2 text-sm text-text-tertiary">{note}</p>
        </div>
        <LineChartIcon className="h-5 w-5 text-brand" />
      </div>
      <div className="mt-5 h-72">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        ) : (
          <AnalyticsEmpty
            title="No signal yet"
            body="This chart activates after visitors open content, subscribe, or send ShelbyUSD through the storefront."
            actionHref="/vault/upload"
            action="Publish a preview"
          />
        )}
      </div>
    </section>
  );
}

export function VaultAnalyticsClient() {
  const { isConnected, walletFetch } = useWallet();
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    if (!isConnected) return;
    walletFetch("/api/vault/analytics", { cache: "no-store" })
      .then((response) => response.json())
      .then(setData)
      .catch(() => undefined);
  }, [isConnected, walletFetch]);

  const totals = useMemo(() => {
    const views = (data?.viewsPerContent ?? []).reduce((total: number, item: any) => total + Number(item.views ?? 0), 0);
    const earnings = (data?.earningsOverTime ?? []).reduce((total: number, item: any) => total + Number(item.value ?? 0), 0);
    const subscribers = (data?.subscribersOverTime ?? []).reduce((total: number, item: any) => total + Number(item.value ?? 0), 0);
    const activeContent = (data?.topContent ?? []).filter((item: any) => Number(item.view_count ?? 0) > 0).length;
    return { views, earnings, subscribers, activeContent };
  }, [data]);

  if (!isConnected) {
    return (
      <main className="vault-page min-h-screen">
        <section className="container-shell py-8">
          <BackLink href="/vault" label="Back to vault" className="mb-8" />
          <div className="vault-empty p-8">
            <h1 className="font-display text-6xl leading-none">Connect Petra to view creator intelligence.</h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-text-tertiary">Analytics belongs to the vault owner. Public marketplace browsing remains open without a wallet.</p>
            <div className="relative z-10 mt-6">
              <WalletButton />
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!data) {
    return <main className="vault-page min-h-screen"><section className="container-shell py-8"><BackLink href="/vault" label="Back to vault" className="mb-8" /><p className="font-mono text-sm text-text-tertiary">Loading creator intelligence</p></section></main>;
  }

  return (
    <main className="vault-page min-h-screen">
      <section className="container-shell py-8">
        <BackLink href="/vault" label="Back to vault" className="mb-8" />

        <section className="vault-panel overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="border-b border-base p-6 lg:border-b-0 lg:border-r">
              <p className="font-mono text-xs text-brand">CREATOR INTELLIGENCE</p>
              <h1 className="mt-5 max-w-4xl font-display text-7xl leading-none text-text-primary">Revenue, audience, and content signals in one view.</h1>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-text-tertiary">Track which files earn attention, where subscriptions are forming, and whether preview content is doing its job.</p>
            </div>
            <div className="grid grid-cols-2">
              {[
                { label: "Views", value: totals.views, icon: Eye },
                { label: "Earnings", value: formatAmount(totals.earnings), icon: Gift },
                { label: "Subscribers", value: totals.subscribers, icon: Users },
                { label: "Viewed files", value: totals.activeContent, icon: BarChart3 }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="border-b border-r border-base p-5 last:border-r-0">
                    <Icon className="h-5 w-5 text-brand" />
                    <p className="mt-10 font-display text-5xl leading-none">{item.value}</p>
                    <p className="mt-2 font-mono text-xs text-text-tertiary">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <ChartPanel title="Earnings curve" note="Subscriptions and donations grouped by day." hasData={hasValues(data.earningsOverTime)}>
            <AreaChart data={data.earningsOverTime ?? []} margin={{ top: 10, right: 10, bottom: 4, left: 0 }}>
              <defs>
                <linearGradient id="earningsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-pink)" stopOpacity={0.34} />
                  <stop offset="100%" stopColor="var(--color-pink)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={chartStroke} vertical={false} />
              <XAxis dataKey="date" stroke={mutedStroke} tickLine={false} tick={axisTick} />
              <YAxis stroke={mutedStroke} tickLine={false} tick={axisTick} width={44} />
              <Tooltip contentStyle={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text)" }} />
              <Area type="monotone" dataKey="value" stroke="var(--color-pink)" fill="url(#earningsFill)" strokeWidth={2} />
            </AreaChart>
          </ChartPanel>

          <ChartPanel title="Subscriber starts" note="New subscriptions grouped by start date." hasData={hasValues(data.subscribersOverTime)}>
            <LineChart data={data.subscribersOverTime ?? []} margin={{ top: 10, right: 10, bottom: 4, left: 0 }}>
              <CartesianGrid stroke={chartStroke} vertical={false} />
              <XAxis dataKey="date" stroke={mutedStroke} tickLine={false} tick={axisTick} />
              <YAxis stroke={mutedStroke} tickLine={false} tick={axisTick} width={34} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text)" }} />
              <Line type="monotone" dataKey="value" stroke="var(--color-teal)" strokeWidth={2} dot={{ r: 3, fill: "var(--color-teal)" }} />
            </LineChart>
          </ChartPanel>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <ChartPanel title="Views by content" note="Which published files are pulling attention." hasData={hasValues(data.viewsPerContent, "views")}>
            <BarChart data={data.viewsPerContent ?? []} margin={{ top: 10, right: 10, bottom: 4, left: 0 }}>
              <CartesianGrid stroke={chartStroke} vertical={false} />
              <XAxis dataKey="name" stroke={mutedStroke} tickLine={false} tick={axisTick} interval={0} height={54} />
              <YAxis stroke={mutedStroke} tickLine={false} tick={axisTick} width={34} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text)" }} />
              <Bar dataKey="views" fill="var(--color-pink)" radius={[0, 0, 0, 0]} />
            </BarChart>
          </ChartPanel>

          <ChartPanel title="Views over time" note="Daily content opens recorded from creator profiles." hasData={hasValues(data.viewsOverTime)}>
            <AreaChart data={data.viewsOverTime ?? []} margin={{ top: 10, right: 10, bottom: 4, left: 0 }}>
              <defs>
                <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-teal)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--color-teal)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={chartStroke} vertical={false} />
              <XAxis dataKey="date" stroke={mutedStroke} tickLine={false} tick={axisTick} />
              <YAxis stroke={mutedStroke} tickLine={false} tick={axisTick} width={34} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text)" }} />
              <Area type="monotone" dataKey="value" stroke="var(--color-teal)" fill="url(#viewsFill)" strokeWidth={2} />
            </AreaChart>
          </ChartPanel>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <section className="vault-panel p-5">
            <h2 className="font-display text-4xl leading-none">Top content</h2>
            <div className="mt-5 grid gap-3">
              {(data.topContent ?? []).length === 0 ? (
                <AnalyticsEmpty title="No ranked files" body="Upload content and open it from the public storefront to build a ranked list." actionHref="/vault/upload" action="Upload content" />
              ) : (data.topContent ?? []).map((item: any, index: number) => (
                <div key={item.id} className="vault-file-row grid grid-cols-[auto_1fr_auto] items-center gap-3 p-3">
                  <span className="font-display text-3xl text-text-tertiary">{String(index + 1).padStart(2, "0")}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm text-text-primary">{item.title}</p>
                    <p className="mt-1 font-mono text-[10px] text-text-tertiary">{item.file_type || "file"}</p>
                  </div>
                  <span className="font-mono text-xs text-brand">{item.view_count} views</span>
                </div>
              ))}
            </div>
          </section>

          <section className="vault-panel p-5">
            <h2 className="font-display text-4xl leading-none">Recent supporter activity</h2>
            <div className="mt-5 grid gap-3">
              {(data.recentSubscribers ?? []).map((item: any) => (
                <div key={`${item.wallet}-${item.expires_at}`} className="vault-activity-row p-3">
                  <div className="flex justify-between gap-3">
                    <span className="font-mono text-xs text-text-secondary">{item.label}</span>
                    <span className="font-mono text-xs text-brand">{formatAmount(item.amount)} ShelbyUSD</span>
                  </div>
                  <p className="mt-2 text-xs text-text-tertiary">Subscription active until {item.expires_at?.slice(0, 10)}</p>
                </div>
              ))}
              {(data.recentDonations ?? []).map((item: any) => (
                <div key={item.id} className="vault-activity-row p-3">
                  <div className="flex justify-between gap-3">
                    <span className="font-mono text-xs text-text-secondary">{truncateMiddle(item.donor_wallet)}</span>
                    <span className="font-mono text-xs text-brand">{formatAmount(item.amount)} ShelbyUSD</span>
                  </div>
                  {item.message ? <p className="mt-2 text-sm text-text-tertiary">{item.message}</p> : null}
                </div>
              ))}
              {(data.recentSubscribers ?? []).length === 0 && (data.recentDonations ?? []).length === 0 ? (
                <AnalyticsEmpty title="No supporter activity" body="Subscriptions and donations will appear here after public visitors support the storefront." actionHref="/" action="View marketplace" />
              ) : null}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
