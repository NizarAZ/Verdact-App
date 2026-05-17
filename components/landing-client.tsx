"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform
} from "motion/react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowDown,
  ArrowRight,
  CheckCircle,
  Database,
  FileCheck,
  Hash,
  Lock,
  ShieldCheck
} from "lucide-react";
import { ShelbyLogo } from "@/components/shelby-logo";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const marqueeItems = [
  { icon: Lock, label: "Petra wallet identity" },
  { icon: ShieldCheck, label: "Onchain upload tx" },
  { icon: Database, label: "Shelby blob ID" },
  { icon: Hash, label: "File hash" },
  { icon: FileCheck, label: "Answer receipt hash" },
  { icon: CheckCircle, label: "Public verify link" }
];

const steps = [
  {
    number: "01",
    title: "Connect Petra",
    body: "Your Aptos wallet is the account. No passwords, app-only identities, or disconnected user IDs."
  },
  {
    number: "02",
    title: "Register documents",
    body: "Verdact uploads bytes to Shelby, signs the blob registration, and waits for Shelbynet confirmation before indexing."
  },
  {
    number: "03",
    title: "Ask confirmed blobs",
    body: "Only onchain documents become queryable. Answers keep the blob paths and chunks used for retrieval."
  },
  {
    number: "04",
    title: "Share the receipt",
    body: "Every answer saves the question, answer, blob references, wallet address, and receipt hash for public verification.",
    proof: true
  }
];

const proofCurveNodes = [
  { number: 1, label: "Upload doc", x: 8, y: 72 },
  { number: 2, label: "Chunk & index", x: 21, y: 35 },
  { number: 3, label: "Shelby stores blob", x: 36, y: 51 },
  { number: 4, label: "Aptos registers tx", x: 50, y: 74, teal: true },
  { number: 5, label: "AI retrieves chunks", x: 64, y: 48 },
  { number: 6, label: "Answer generated", x: 78, y: 24 },
  { number: 7, label: "Receipt saved", x: 92, y: 37 }
];

const receiptFields = [
  ["receipt_id", "8f1a1b97-5d4a-46f2-b71f-5e92"],
  ["wallet_address", "0x840343...9300"],
  ["receipt_hash", "91af7d2c5e90b6fb...c1e4429a"],
  ["source_tx_hash", "0x85fdb9a176ab...bb4988e6"],
  ["blob_name", "prompt-for-codex.pdf"],
  ["verify_url", "/verify/8f1a1b97-5d4a"]
];

const cases = [
  ["REGULATED OPS", "Evidence reviews", "Prove which uploaded file and answer payload existed when the wallet signed."],
  ["PUBLIC PROOF", "Shareable verification", "Send a receipt link to anyone. They can verify the hash without connecting a wallet."],
  ["REPORTING", "Filing traceability", "Tie each answer back to the upload transaction, file hash, and Shelby blob registration."],
  ["KNOWLEDGE", "Wallet-owned data", "Keep documents, receipts, and query history scoped to the connected wallet address."]
];

export function LandingPage() {
  return (
    <main className="shelby-page overflow-hidden">
      <HeroSection />
      <CredibilityMarquee />
      <ProofGraphSection />
      <HowItWorks />
      <ReceiptAnatomy />
      <VerificationPulse />
      <UseCasesGrid />
      <FinalCta />
    </main>
  );
}

function RollingButton({ href, children }: { href: string; children: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <Link href={href} className="rolling-button inline-flex items-center justify-center px-6 font-mono text-sm font-medium">
      <span className="relative inline-grid h-5 overflow-hidden">
        <motion.span whileHover={reduceMotion ? undefined : { y: "-100%" }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
          {children}
        </motion.span>
        <motion.span
          className="absolute inset-0 translate-y-full"
          whileHover={reduceMotion ? undefined : { y: "0%" }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.span>
      </span>
      <ArrowRight className="ml-3 h-4 w-4" />
    </Link>
  );
}

function HeroSection() {
  const root = useRef<HTMLElement>(null);
  const mockup = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: root, offset: ["start start", "end start"] });
  const mockupY = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const reduceMotion = useReducedMotion();
  const headlineWords = "AI answers you can verify onchain.".split(" ");

  return (
    <section ref={root} className="relative min-h-screen px-5 pb-20 pt-6">
      <nav className="container-shell flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <ShelbyLogo className="h-11 w-11" />
          <span className="font-display text-3xl">Verdact</span>
        </Link>
      </nav>

      <div className="container-shell grid min-h-[calc(100vh-88px)] items-center gap-12 py-16 lg:grid-cols-[0.85fr_1.25fr]">
        <div>
          <div className="proof-badge proof-pill mb-7 inline-flex items-center gap-3 rounded-full px-4 py-2 font-mono text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-teal)]" />
            <span>1,247 wallet-signed receipts verified on Shelbynet today</span>
          </div>
          <h1 className="text-display-xl max-w-[760px]">
            {headlineWords.map((word, index) => (
              <motion.span
                key={`${word}-${index}`}
                className="mr-[0.18em] inline-block"
                initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: reduceMotion ? 0 : index * 0.05, ease: "easeOut" }}
              >
                {word}
              </motion.span>
            ))}
          </h1>
          <p className="mt-8 max-w-xl text-lg text-[color:var(--color-text-muted)]">
            Verdact indexes a document only after its Shelby blob registration is confirmed onchain. Every answer carries a receipt hash, wallet address, and public verification link.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <RollingButton href="/app">Launch app</RollingButton>
            <a href="#verification" className="inline-flex min-h-12 items-center justify-center rounded-sm border border-[color:var(--color-border)] px-6 font-mono text-sm">
              See proof flow
            </a>
          </div>
        </div>

        <motion.div ref={mockup} style={{ y: reduceMotion ? 0 : mockupY }} className="relative lg:w-[112%]">
          <div className="section-surface overflow-hidden rounded-sm p-3">
            <Image
              src="/images/hero-mockup.png"
              width={1800}
              height={1125}
              priority
              alt="Verdact app showing wallet-owned documents, receipts, and public verification"
              className="h-auto w-full rounded-sm"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function CredibilityMarquee() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const duration = window.innerWidth < 768 ? 42 : 30;
      const tween = gsap.to(".marquee-track", { x: "-50%", duration, repeat: -1, ease: "none" });
      const el = root.current;
      const pause = () => gsap.globalTimeline.pause();
      const play = () => gsap.globalTimeline.play();
      el?.addEventListener("mouseenter", pause);
      el?.addEventListener("mouseleave", play);
      document.fonts.ready.then(() => ScrollTrigger.refresh());
      return () => {
        el?.removeEventListener("mouseenter", pause);
        el?.removeEventListener("mouseleave", play);
        tween.kill();
      };
    },
    { scope: root }
  );

  return (
    <section ref={root} className="marquee-proof-rail border-y border-[color:var(--color-border)] py-5">
      <div className="marquee-track flex w-max gap-10">
        {[...marqueeItems, ...marqueeItems].map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={`${item.label}-${index}`} className="flex items-center gap-10 font-mono text-[13px] text-[color:var(--color-text-muted)]">
              <span className={`proof-rail-item flex items-center gap-3 ${index % marqueeItems.length === 0 ? "is-active" : ""}`}>
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
              <span className="text-[color:var(--color-border)]">/</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ProofGraphSection() {
  const root = useRef<HTMLElement>(null);
  const inView = useInView(root, { once: true, amount: 0.35 });
  const reduceMotion = useReducedMotion();

  return (
    <section ref={root} className="pipeline-section">
      <div className="pipeline-inner">
        <div className="section-surface overflow-hidden rounded-sm p-5 md:p-7">
          <div className="mb-6 flex flex-col gap-2 border-b border-[color:var(--color-border)] pb-5 md:flex-row md:items-center md:justify-between">
            <h2 className="pipeline-heading mb-0">Verifiable RAG pipeline</h2>
            <div className="font-mono text-[13px] text-[color:var(--color-text-muted)]">
              document <span className="text-[color:var(--color-pink)]">→</span> chunk <span className="text-[color:var(--color-pink)]">→</span> answer <span className="text-[color:var(--color-pink)]">→</span> receipt
            </div>
          </div>
          <div className="relative h-[360px] md:h-[430px]">
            <svg viewBox="0 0 1000 360" className="absolute inset-0 h-full w-full" role="img" aria-label="Verdact document to receipt pipeline curve">
              <motion.path
                d="M80 260 C 150 110, 255 80, 360 180 S 515 320, 620 170 S 785 45, 920 135"
                fill="none"
                stroke="var(--color-pink)"
                strokeWidth="3"
                strokeLinecap="round"
                initial={reduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
                animate={inView ? { pathLength: 1 } : undefined}
                transition={{ duration: reduceMotion ? 0 : 1.2, ease: "easeOut" }}
              />
            </svg>

            {proofCurveNodes.map((node, index) => (
              <motion.div
                key={node.number}
                className="group absolute"
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
                animate={inView ? { opacity: 1, scale: 1 } : undefined}
                transition={{ duration: 0.32, delay: reduceMotion ? 0 : 1.2 + index * 0.06, ease: "easeOut" }}
              >
                <div
                  className={`flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border font-mono text-sm ${
                    node.teal
                      ? "border-[color:var(--color-teal)] bg-[color:var(--color-teal)] text-[color:var(--color-bg)]"
                      : "border-[color:var(--color-pink)] bg-[color:var(--color-pink)] text-[color:var(--color-bg)]"
                  }`}
                >
                  {node.number}
                </div>
                <div className="pointer-events-none absolute left-1/2 top-12 min-w-28 -translate-x-1/2 rounded-sm border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2 text-center font-mono text-[11px] text-[color:var(--color-text)] opacity-100 transition-opacity duration-200 md:-top-12 md:top-auto md:opacity-0 md:group-hover:opacity-100">
                  {node.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const root = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  return (
    <section ref={root} className="container-shell py-20">
      <div className="grid gap-4 md:grid-cols-2">
        {steps.map((step, index) => (
          <motion.article
            key={step.title}
            className={`step-card section-surface-2 flex min-h-[220px] flex-col justify-between rounded-sm p-6 md:min-h-[260px] ${
              step.proof ? "shadow-[0_0_40px_var(--color-teal-shadow)]" : ""
            }`}
            initial={reduceMotion ? false : { opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ duration: 0.4, delay: reduceMotion ? 0 : index * 0.08, ease: "easeOut" }}
          >
            <div>
              <h2 className="font-display text-5xl">
                <span className="font-mono text-3xl text-[color:var(--color-pink)]">{step.number}</span>
                <span className="mx-3 font-mono text-3xl text-[color:var(--color-text-muted)]">/</span>
                {step.title}
              </h2>
              <p className="mt-5 max-w-xl text-lg text-[color:var(--color-text-muted)]">{step.body}</p>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function ReceiptAnatomy() {
  const root = useRef<HTMLElement>(null);
  const inView = useInView(root, { once: true, amount: 0.25 });
  const reduceMotion = useReducedMotion();

  return (
    <section ref={root} id="receipt" className="container-shell grid min-h-screen items-center gap-10 py-20 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="top-24 h-fit lg:sticky">
        <h2 className="text-display-lg">A receipt built for public verification.</h2>
      </div>
      <div className="section-surface rounded-sm p-6">
        <div className="mb-8 flex items-center justify-between">
          <span className="font-display text-4xl">AnswerReceipt.json</span>
          <FileCheck className="h-6 w-6 text-[color:var(--color-teal)]" />
        </div>
        <div className="space-y-1">
          {receiptFields.map(([label, value], index) => (
            <motion.div
              key={label}
              className="receipt-field grid gap-3 border-t border-[color:var(--color-border)] py-5 md:grid-cols-[180px_1fr_auto]"
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.4, delay: reduceMotion ? 0 : index * 0.04, ease: "easeOut" }}
            >
              <span className="font-mono text-sm text-[color:var(--color-text-muted)]">{label}</span>
              <span className="truncate font-mono text-sm text-[color:var(--color-text)]">{value}</span>
              <Lock className="h-4 w-4 text-[color:var(--color-teal)]" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function VerificationPulse() {
  const root = useRef<HTMLElement>(null);
  const inView = useInView(root, { once: true, amount: 0.45 });
  const reduceMotion = useReducedMotion();

  return (
    <section ref={root} id="verification" className="container-shell grid items-center gap-12 py-20 lg:grid-cols-2">
      <div>
        <h2 className="text-display-lg">Verification needs no login.</h2>
        <p className="mt-6 max-w-xl text-lg text-[color:var(--color-text-muted)]">
          Open a receipt link, recompute the hash, and inspect the source blob's Shelbynet transaction. Proof comes from the chain and hash, not an app session.
        </p>
      </div>
      <div className="section-surface relative overflow-hidden rounded-sm p-8">
        <div className="mb-8 flex items-center gap-4">
          <div className="relative flex h-14 w-14 items-center justify-center">
            <span className="teal-pulse-ring absolute inset-0 rounded-full" />
            <span className="teal-pulse-ring absolute inset-0 rounded-full" />
            <span className="teal-pulse-ring absolute inset-0 rounded-full" />
            <svg viewBox="0 0 100 100" className="relative h-14 w-14">
              <circle cx="50" cy="50" r="42" fill="var(--color-teal-soft)" stroke="var(--color-teal)" />
              <motion.path
                d="M34 52 45 63 68 38"
                fill="none"
                stroke="var(--color-teal)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.4, ease: "easeOut" }}
              />
            </svg>
          </div>
          <span className="font-display text-4xl">Verified</span>
        </div>
        {["Receipt hash matches", "Wallet address recorded", "Source transaction linked"].map((item, index) => (
          <motion.div
            key={item}
            className="flex items-center justify-between border-t border-[color:var(--color-border)] py-5 font-mono"
            initial={reduceMotion ? false : { opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : undefined}
            transition={{ delay: 0.7 + index * 0.12 }}
          >
            <span>{item}</span>
            <Lock className="h-4 w-4 text-[color:var(--color-teal)]" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function UseCasesGrid() {
  const reduceMotion = useReducedMotion();
  const container = {
    hidden: {},
    show: { transition: { staggerChildren: reduceMotion ? 0 : 0.08 } }
  };
  const item = {
    hidden: { opacity: 0, y: 22 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <section className="container-shell py-20">
      <h2 className="text-display-lg max-w-4xl">For teams that need answers to survive handoff.</h2>
      <motion.div
        className="mt-12 grid gap-4 md:grid-cols-2"
        variants={container}
        initial={reduceMotion ? false : "hidden"}
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        {cases.map(([label, title, body]) => (
          <motion.article
            key={title}
            variants={item}
            whileHover={reduceMotion ? undefined : { y: -4, borderColor: "var(--color-pink-border)" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="section-surface-2 flex min-h-[260px] flex-col justify-between rounded-sm p-7"
          >
            <p className="mb-10 font-mono text-xs uppercase tracking-widest text-[color:var(--color-pink)]">{label}</p>
            <h3 className="font-display text-5xl">{title}</h3>
            <p className="mt-7 max-w-2xl text-lg text-[color:var(--color-text-muted)]">{body}</p>
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}

function FinalCta() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (typeof window !== "undefined" && window.innerWidth >= 768) {
        gsap.from(".cta-bg-text", {
          x: 60,
          duration: 0.4,
          ease: "power2.out",
          scrollTrigger: {
            trigger: root.current,
            start: "top 70%",
            toggleActions: "play none none reverse"
          }
        });
        document.fonts.ready.then(() => ScrollTrigger.refresh());
      }
    },
    { scope: root }
  );

  return (
    <section ref={root} className="px-5 pb-8 pt-20">
      <div className="container-shell relative overflow-hidden rounded-sm bg-[color:var(--color-pink)] p-8 text-[color:var(--color-bg)] md:p-14">
        <div className="absolute inset-0 bg-[url('/images/grain.png')] bg-repeat opacity-[0.04]" />
        <div className="relative grid items-end gap-8 lg:grid-cols-[1fr_auto]">
          <h2 className="cta-bg-text font-display text-[clamp(64px,9vw,150px)] leading-[0.82]">
            Ship answers with proof.
          </h2>
          <div className="flex flex-col items-start gap-5">
            <Link href="/app" className="inline-flex min-h-12 items-center justify-center rounded-sm bg-[color:var(--color-bg)] px-6 font-mono text-sm font-medium text-[color:var(--color-text)]">
              Launch app
              <ArrowRight className="ml-3 h-4 w-4" />
            </Link>
            <a href="#verification" className="inline-flex items-center gap-2 font-mono text-[14px]">
              <ArrowDown className="h-4 w-4" />
              See proof flow
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
