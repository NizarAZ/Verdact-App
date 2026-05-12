import { ReceiptDetail } from "@/components/dashboard/ReceiptDetail";

export default function ReceiptDetailPage({ params }: { params: { id: string } }) {
  return <ReceiptDetail id={params.id} />;
}
