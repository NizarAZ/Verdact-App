export function truncateMiddle(value?: string | null, start = 8, end = 6) {
  if (!value) return "";
  if (value.length <= start + end + 3) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

export function formatDate(value?: string | null) {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function formatAmount(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en", { maximumFractionDigits: 6 }).format(amount);
}

export function daysRemaining(value: string) {
  return Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000));
}
