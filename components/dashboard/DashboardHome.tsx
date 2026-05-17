"use client";

import { FileUp, MessageSquare, ScrollText, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { ActionCard } from "@/components/dashboard/ActionCard";
import { RecentDocuments } from "@/components/dashboard/RecentDocuments";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { StatsPanel } from "@/components/dashboard/StatsPanel";

const actions = [
  {
    href: "/app/upload",
    icon: FileUp,
    title: "Upload",
    description: "Store documents as verifiable Shelby blobs."
  },
  {
    href: "/app/query",
    icon: MessageSquare,
    title: "Ask",
    description: "Query your documents. Get answers with source proof."
  },
  {
    href: "/app/receipts",
    icon: ScrollText,
    title: "Receipts",
    description: "Browse your full answer audit trail."
  },
  {
    href: "/app/receipts",
    icon: ShieldCheck,
    title: "Verify",
    description: "Open receipts and share public proof links."
  }
];

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07
    }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 }
};

export function DashboardHome() {
  return (
    <motion.section className="mx-auto grid max-w-[1100px] gap-8" variants={container} initial="hidden" animate="show">
      <motion.div variants={fadeUp} transition={{ duration: 0.3, ease: "easeOut" }}>
        <StatsPanel />
      </motion.div>

      <motion.div className="grid gap-4 md:grid-cols-2" variants={container}>
        {actions.map((action, index) => (
          <motion.div key={`${action.href}-${action.title}`} variants={fadeUp} transition={{ delay: index * 0.06, duration: 0.3, ease: "easeOut" }}>
            <ActionCard {...action} />
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={fadeUp} transition={{ delay: 0.3, duration: 0.3, ease: "easeOut" }}>
        <RecentDocuments />
      </motion.div>

      <motion.div variants={fadeUp} transition={{ delay: 0.34, duration: 0.3, ease: "easeOut" }}>
        <RecentActivity />
      </motion.div>
    </motion.section>
  );
}
