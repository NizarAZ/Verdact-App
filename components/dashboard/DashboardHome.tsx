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
    href: "/app/verify",
    icon: ShieldCheck,
    title: "Verify",
    description: "Re-check source integrity against Shelby blobs."
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
    <motion.section className="grid gap-5 lg:grid-cols-12" variants={container} initial="hidden" animate="show">
      <motion.div className="lg:col-span-5" variants={fadeUp} transition={{ duration: 0.28, ease: "easeOut" }}>
        <StatsPanel />
      </motion.div>

      <motion.div className="grid gap-4 md:grid-cols-2 lg:col-span-7" variants={container}>
        {actions.map((action) => (
          <motion.div key={action.href} variants={fadeUp} transition={{ duration: 0.28, ease: "easeOut" }}>
            <ActionCard {...action} />
          </motion.div>
        ))}
      </motion.div>

      <motion.div className="lg:col-span-12" variants={fadeUp} transition={{ delay: 0.35, duration: 0.28, ease: "easeOut" }}>
        <RecentDocuments />
      </motion.div>

      <motion.div className="lg:col-span-12" variants={fadeUp} transition={{ delay: 0.42, duration: 0.28, ease: "easeOut" }}>
        <RecentActivity />
      </motion.div>
    </motion.section>
  );
}
