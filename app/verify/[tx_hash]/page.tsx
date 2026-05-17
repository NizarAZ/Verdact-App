import { PublicVerify } from "@/components/verify/PublicVerify";

export default function VerifyTxPage({ params }: { params: { tx_hash: string } }) {
  return <PublicVerify id={params.tx_hash} />;
}
