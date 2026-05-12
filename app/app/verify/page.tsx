import { VerifyFlow } from "@/components/dashboard/VerifyFlow";
import { Suspense } from "react";

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyFlow />
    </Suspense>
  );
}
