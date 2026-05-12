"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
import { SplitText } from "gsap/SplitText";
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

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

const marqueeItems = [
  { icon: Hash, label: "Source chunks" },
  { icon: Lock, label: "Context hash" },
  { icon: ShieldCheck, label: "Merkle root" },
  { icon: FileCheck, label: "Answer receipt" },
  { icon: Database, label: "Verified blobs" },
  { icon: CheckCircle, label: "Merkle proof" }
];

const steps = [
  {
    number: "01",
    title: "Upload documents",
    body: "PDF, text, and markdown enter Verdact as evidence, backed by Shelby provenance.",
    image: "/images/proof-graph.png"
  },
  {
    number: "02",
    title: "Store chunks",
    body: "Every chunk keeps a blob path, index, embedding, and retrievable text window.",
    image: "/images/hero-mockup.png"
  },
  {
    number: "03",
    title: "Answer with sources",
    body: "The model responds with the selected chunks still visible in the retrieval trail.",
    image: "/images/hero-mockup.png"
  },
  {
    number: "04",
    title: "Store the receipt",
    body: "The answer receipt saves the question, model, sources, Merkle roots, and context hash.",
    image: "/images/receipt-visual.png",
    proof: true
  }
];

const receiptFields = [
  ["receipt_id", "8f1a1b97-5d4a-46f2-b71f-5e92"],
  ["model", "gpt-4o"],
  ["context_hash", "91af7d2c5e90b6fb...c1e4429a"],
  ["source_blob", "rag/chunks/q2-risk/chunk-03.json"],
  ["merkle_root", "0xf7a0b6d92017...9e44c0aa"]
];

const cases = [
  ["REGULATED OPS", "Compliance", "Show exactly which policy text supported an answer before it reaches review."],
  ["FEATURED", "Legal", "Preserve the question, response, source chunks, and receipt trail for later inspection."],
  ["REPORTING", "Finance", "Trace answers against filings, reports, and dated internal documents."],
  ["KNOWLEDGE", "Internal knowledge", "Ask across team documents without losing provenance or source identity."]
];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return isMobile;
}

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
  const headline = useRef<HTMLHeadingElement>(null);
  const mockup = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: root, offset: ["start start", "end start"] });
  const mockupY = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const reduceMotion = useReducedMotion();

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !headline.current) return;
      const split = new SplitText(headline.current, { type: "words", wordsClass: "hero-word" });
      gsap.set(split.words, { overflow: "hidden" });
      gsap.from(split.words, {
        y: 60,
        opacity: 0,
        stagger: 0.08,
        duration: 0.9,
        ease: "power3.out",
      });
      gsap.from(".proof-badge", { opacity: 0, y: 10, duration: 0.35, delay: 0.95 });
      document.fonts.ready.then(() => ScrollTrigger.refresh());
      return () => split.revert();
    },
    { scope: root }
  );

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
            <span>●</span>
            <span>1,247 Verdact receipts verified on Shelby today</span>
          </div>
          <h1 ref={headline} className="text-display-xl max-w-[760px]">
            AI answers with evidence attached.
          </h1>
          <p className="mt-8 max-w-xl text-lg text-[color:var(--color-text-muted)]">
            Verdact turns Shelby-backed retrieval into a verifiable surface: source chunks, context hashes, Merkle roots, and answer receipts.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <RollingButton href="/app">Launch app</RollingButton>
            <a href="#verification" className="inline-flex min-h-12 items-center justify-center rounded-sm border border-[color:var(--color-border)] px-6 font-mono text-sm">
              See verification
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
              alt="Verdact dashboard mockup showing a document RAG query interface and receipt panel"
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
            <div key={`${item.label}-${index}`} className="flex items-center gap-10 font-mono text-sm text-[color:var(--color-text-muted)]">
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
              <span className="text-[color:var(--color-border)]">·</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ProofGraphSection() {
  return (
    <section className="pipeline-section">
      <div className="pipeline-inner">
        <h2 className="pipeline-heading">Verifiable RAG pipeline</h2>
        <img
          src="/images/proof-graph.png"
          alt="Verifiable RAG pipeline"
          width={900}
          height={500}
          loading="lazy"
          style={{ width: "100%", height: "auto", borderRadius: "0.5rem" }}
        />
      </div>
    </section>
  );
}

function HowItWorks() {
  const root = useRef<HTMLElement>(null);

  return (
    <section ref={root} className="container-shell py-20">
      <div className="grid gap-4 md:grid-cols-2">
        {steps.map((step, index) => (
          <motion.article
            key={step.title}
            className={`step-card section-surface-2 flex min-h-[220px] flex-col justify-between rounded-sm p-6 md:min-h-[260px] ${
              step.proof ? "shadow-[0_0_40px_var(--color-teal-shadow)]" : ""
            }`}
            initial={false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ duration: 0.45 }}
          >
            <p className="font-mono text-5xl text-[color:var(--color-pink)]">{step.number}</p>
            <div>
              <h2 className="flex items-center gap-3 font-display text-5xl">
                {step.proof && <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--color-teal)] animate-[pulse_1.3s_ease-out_infinite]" />}
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
  const mobileInView = useInView(root, { once: true, amount: 0.25 });
  const reduceMotion = useReducedMotion();
  const isMobile = useIsMobile();

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (typeof window !== "undefined" && window.innerWidth >= 768) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "+=120%",
            pin: true,
            scrub: true
          }
        });
        tl.fromTo(".receipt-field", { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", stagger: 0.25, ease: "none" });
        document.fonts.ready.then(() => ScrollTrigger.refresh());
        return () => tl.kill();
      }
    },
    { scope: root }
  );

  return (
    <section ref={root} id="receipt" className="container-shell grid min-h-screen items-center gap-10 py-20 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="top-24 h-fit lg:sticky">
        <h2 className="text-display-lg">A receipt you can interrogate.</h2>
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
              initial={false}
              animate={!isMobile || mobileInView ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: index * 0.08 }}
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
  const isMobile = useIsMobile();

  return (
    <section ref={root} id="verification" className="container-shell grid items-center gap-12 py-20 lg:grid-cols-2">
      <div>
        <h2 className="text-display-lg">Verification is the product moment.</h2>
        <p className="mt-6 max-w-xl text-lg text-[color:var(--color-text-muted)]">
          Re-download chunks, hash the context again, compare the receipt, and check current blob metadata.
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
                transition={{ duration: reduceMotion ? 0 : 0.6, ease: "easeOut" }}
              />
            </svg>
          </div>
          <span className="font-display text-4xl">Verified</span>
        </div>
        {["Context hash matches", "Merkle root unchanged", "Receipt blob found"].map((item, index) => (
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
  const isMobile = useIsMobile();
  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } }
  };
  const item = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <section className="container-shell py-20">
      <h2 className="text-display-lg max-w-4xl">Built for teams who need answers to hold up later.</h2>
      <motion.div
        className="mt-12 grid gap-4 md:grid-cols-2"
        variants={container}
        initial={false}
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        {cases.map(([label, title, body], index) => (
          <motion.article
            key={title}
            variants={item}
            whileHover={reduceMotion ? undefined : { y: -4, borderColor: "var(--color-pink-border)" }}
            transition={{ duration: 0.2 }}
            className={`section-surface-2 rounded-sm p-7 ${index === 1 ? "md:col-span-2" : ""}`}
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
          duration: 0.75,
          ease: "power3.out",
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
            Make every answer accountable.
          </h2>
          <div className="flex flex-col items-start gap-5">
            <RollingButton href="/app">Launch app</RollingButton>
            <a href="#verification" className="inline-flex items-center gap-2 font-mono text-sm">
              <ArrowDown className="h-4 w-4" />
              See how verification works
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
