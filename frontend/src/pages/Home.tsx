import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bot,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileCheck2,
  LayoutDashboard,
  Menu,
  Play,
  ScanText,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';

const navItems = [
  { label: 'Home', href: '#home' },
  { label: 'Product', href: '#product' },
  { label: 'About', href: '#about' },
];

const stats = [
  { value: 'Top LLMs', label: 'Multi-model scoring pipelines built for structured and subjective evaluation.' },
  { value: '98%', label: 'Scoring accuracy across AI-assisted evaluation flows and rubric alignment.' },
  { value: 'Fully Automated', label: 'From OCR intake to review, reports, and result-ready mark sheets.' },
  { value: 'Review + Redo', label: 'Human-in-the-loop moderation when an answer needs a second pass.' },
];

const features = [
  {
    icon: Brain,
    title: 'NLP Theory Scoring',
    description: 'Evaluate long-form theory answers against rubrics, concepts, and expected reasoning depth.',
  },
  {
    icon: Bot,
    title: 'LLM Subjective Evaluation',
    description: 'Use advanced LLM orchestration for nuanced marking in non-theory and descriptive exams.',
  },
  {
    icon: ScanText,
    title: 'OCR Handwriting Detection',
    description: 'Digitize handwritten sheets cleanly before scoring, even from messy classroom scans.',
  },
  {
    icon: ShieldAlert,
    title: 'Cheat Pattern Detection',
    description: 'Surface suspicious similarities, answer-sequence overlaps, and behavior anomalies instantly.',
  },
  {
    icon: LayoutDashboard,
    title: 'Smart Dashboards',
    description: 'Give teachers and institutions a live command center for performance and review workflows.',
  },
  {
    icon: FileCheck2,
    title: 'Instant Result Reports',
    description: 'Generate structured score summaries, feedback trails, and export-ready result views fast.',
  },
];

const testimonials = [
  {
    quote:
      'What took our faculty two days now takes under an hour, and the moderation flow feels much more reliable.',
    name: 'Ritika Menon',
    role: 'Examination Controller, Crestline University',
  },
  {
    quote:
      'The handwriting OCR plus subjective scoring combo is the first thing we have used that actually feels production ready.',
    name: 'Arjun Shekhawat',
    role: 'Academic Tech Lead, NorthBridge Schools',
  },
  {
    quote:
      'OmniMark helped us scale semester evaluations without hiring temporary checking staff or compromising consistency.',
    name: 'Daniel Park',
    role: 'Dean of Assessment, Horizon Institute',
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
};

const SectionHeading = ({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) => (
  <div className="mx-auto max-w-3xl text-center">
    <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 shadow-[0_10px_30px_rgba(148,163,184,0.12)] backdrop-blur-xl">
      <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
      {eyebrow}
    </div>
    <h2 className="font-display mt-6 text-3xl font-semibold tracking-[-0.04em] text-slate-950 md:text-5xl">
      {title}
    </h2>
    <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">{description}</p>
  </div>
);

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 px-4 pt-4">
      <div className="mx-auto max-w-7xl rounded-[1.75rem] border border-white/70 bg-white/75 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
        <div className="flex items-center justify-between px-5 py-4 md:px-7">
          <a href="#home" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#dff7ff_0%,#9bd6ff_45%,#d9dbff_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_24px_rgba(56,189,248,0.22)]">
              <Brain className="h-5 w-5 text-slate-900" />
            </div>
            <div>
              <div className="font-display text-lg font-semibold tracking-[-0.04em] text-slate-950">OmniMark AI</div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Evaluation OS</div>
            </div>
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="nav-link-pill text-sm font-medium text-slate-600 transition hover:text-slate-950"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:block">
            <Link
              to="/auth"
              className="button-sheen inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Sign Up
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 md:hidden"
            aria-label="Toggle navigation"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {isOpen ? (
          <div className="border-t border-slate-200/80 px-5 pb-5 pt-4 md:hidden">
            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="interactive-surface rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
                >
                  {item.label}
                </a>
              ))}
              <Link
                to="/auth"
                onClick={() => setIsOpen(false)}
                className="button-sheen inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
              >
                Sign Up
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
};

const HeroPreview = () => (
  <motion.div
    initial={{ opacity: 0, y: 30, scale: 0.96 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    whileHover={{ y: -6, rotateX: 3, rotateY: -5 }}
    transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
    className="relative mx-auto w-full max-w-[38rem]"
    style={{ transformStyle: 'preserve-3d' }}
  >
    <motion.div
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      whileHover={{ scale: 1.04, x: 4 }}
      className="interactive-surface absolute -left-8 top-10 hidden rounded-[1.5rem] border border-white/80 bg-white/80 px-4 py-3 shadow-[0_20px_40px_rgba(56,189,248,0.16)] backdrop-blur-xl lg:block"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-emerald-100 p-2">
          <BadgeCheck className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900">98% rubric match</div>
          <div className="text-xs text-slate-500">Theory grading confidence</div>
        </div>
      </div>
    </motion.div>

    <motion.div
      animate={{ y: [0, 12, 0] }}
      transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
      whileHover={{ scale: 1.04, x: -4 }}
      className="interactive-surface absolute -right-6 bottom-14 hidden rounded-[1.5rem] border border-white/80 bg-white/80 px-4 py-3 shadow-[0_24px_44px_rgba(99,102,241,0.16)] backdrop-blur-xl lg:block"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-rose-100 p-2">
          <ShieldAlert className="h-5 w-5 text-rose-500" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900">12 similarity flags</div>
          <div className="text-xs text-slate-500">Cheat pattern alerts</div>
        </div>
      </div>
    </motion.div>

    <div className="frost-panel hover-panel-glow overflow-hidden rounded-[2rem] p-3 shadow-[0_40px_120px_rgba(15,23,42,0.14)]">
      <div className="overflow-hidden rounded-[1.6rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(239,248,255,0.94)_100%)]">
        <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-4">
          <div>
            <div className="font-display text-lg font-semibold text-slate-950">Teacher Evaluation Console</div>
            <div className="text-sm text-slate-500">Spring exam batch · 482 answer sheets</div>
          </div>
          <div className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">Live AI run</div>
        </div>

        <div className="grid gap-4 p-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div className="interactive-surface rounded-[1.4rem] border border-white/80 bg-white/90 p-4 shadow-[0_18px_40px_rgba(148,163,184,0.16)]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Answer sheet intake</div>
                  <div className="text-xs text-slate-500">OCR + rubric association + evaluation queue</div>
                </div>
                <div className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">Automated</div>
              </div>

              <div className="mt-4 space-y-3">
                {[
                  { label: 'Handwritten pages processed', value: '91%', width: '91%' },
                  { label: 'Subjective answers scored', value: '76%', width: '76%' },
                  { label: 'Ready for faculty review', value: '64%', width: '64%' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                      <span>{item.label}</span>
                      <span className="font-semibold text-slate-700">{item.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-[linear-gradient(90deg,#7dd3fc_0%,#60a5fa_50%,#a78bfa_100%)]"
                        style={{ width: item.width }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="interactive-surface rounded-[1.4rem] border border-white/80 bg-slate-950 p-4 text-white shadow-[0_18px_36px_rgba(15,23,42,0.18)]">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-white/70">Average score</div>
                  <BarChart3 className="h-4 w-4 text-cyan-300" />
                </div>
                <div className="mt-4 font-display text-4xl tracking-[-0.05em]">78.4</div>
                <div className="mt-2 text-xs text-white/70">+11% improvement after rubric calibration</div>
              </div>

              <div className="interactive-surface rounded-[1.4rem] border border-white/80 bg-white/90 p-4 shadow-[0_18px_36px_rgba(148,163,184,0.16)]">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-500">Redo queue</div>
                  <Clock3 className="h-4 w-4 text-amber-500" />
                </div>
                <div className="mt-4 font-display text-4xl tracking-[-0.05em] text-slate-950">14</div>
                <div className="mt-2 text-xs text-slate-500">Answers needing human review or second-pass scoring</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="interactive-surface rounded-[1.4rem] border border-white/80 bg-white/90 p-4 shadow-[0_18px_40px_rgba(148,163,184,0.16)]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Suspicious similarity alerts</div>
                  <div className="text-xs text-slate-500">Clustered by answer overlap and phrasing patterns</div>
                </div>
                <div className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">12 flagged</div>
              </div>

              <div className="mt-4 space-y-3">
                {[
                  { pair: 'A-142 / A-145', score: '94% match' },
                  { pair: 'A-208 / A-211', score: '88% match' },
                  { pair: 'A-301 / A-313', score: '81% match' },
                ].map((item) => (
                  <div
                    key={item.pair}
                    className="interactive-surface flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/90 px-3 py-3"
                  >
                    <span className="text-sm font-medium text-slate-800">{item.pair}</span>
                    <span className="text-xs font-semibold text-rose-500">{item.score}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="interactive-surface rounded-[1.4rem] border border-white/80 bg-[linear-gradient(180deg,rgba(224,242,254,0.8)_0%,rgba(255,255,255,0.94)_100%)] p-4 shadow-[0_18px_40px_rgba(125,211,252,0.16)]">
              <div className="text-sm font-semibold text-slate-900">Mark distribution</div>
              <div className="mt-4 flex h-36 items-end gap-3">
                {['42%', '58%', '74%', '61%', '89%', '68%', '80%'].map((height, index) => (
                  <div key={height} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t-[1rem] bg-[linear-gradient(180deg,#0f172a_0%,#60a5fa_75%,#bfdbfe_100%)]"
                      style={{ height }}
                    />
                    <span className="text-[11px] font-medium text-slate-400">Q{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

const HomeHero = () => (
  <section id="home" className="relative overflow-hidden px-4 pb-20 pt-10 md:pb-28 md:pt-14">
    <div className="hero-orb orb-one" />
    <div className="hero-orb orb-two" />
    <div className="hero-orb orb-three" />

    <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[0.95fr_1.05fr]">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_16px_34px_rgba(148,163,184,0.14)] backdrop-blur-xl">
          <Sparkles className="h-4 w-4 text-cyan-500" />
          Premium AI evaluation platform for institutions
        </div>

        <h1 className="font-display mt-8 max-w-3xl text-5xl font-semibold tracking-[-0.07em] text-slate-950 md:text-7xl xl:text-[5.4rem]">
          AI That Evaluates
          <span className="block bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_40%,#8b5cf6_78%,#0ea5e9_100%)] bg-clip-text text-transparent">
            Papers in Seconds.
          </span>
        </h1>

        <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
          OmniMark AI automates handwritten answer-sheet digitization, theory scoring, subjective assessment,
          cheat detection, and performance analytics in one beautifully intelligent workflow.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            to="/auth"
            className="button-sheen inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-7 py-4 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)] transition hover:-translate-y-1 hover:bg-slate-800"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#product"
            className="button-sheen inline-flex items-center justify-center gap-2 rounded-full border border-white/80 bg-white/75 px-7 py-4 text-sm font-semibold text-slate-700 shadow-[0_16px_40px_rgba(148,163,184,0.14)] backdrop-blur-xl transition hover:-translate-y-1 hover:text-slate-950"
          >
            <Play className="h-4 w-4" />
            Watch Demo
          </a>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            'Handwriting OCR that actually works on exam sheets',
            'LLM-assisted grading aligned to faculty rubrics',
            'Red-flag alerts before results are published',
          ].map((item) => (
            <div key={item} className="interactive-surface flex items-start gap-3 rounded-[1.5rem] border border-white/70 bg-white/70 px-4 py-4 backdrop-blur-xl">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-500" />
              <p className="text-sm leading-6 text-slate-600">{item}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="relative z-10">
        <HeroPreview />
      </div>
    </div>
  </section>
);

const StatsSection = () => (
  <section className="px-4 pb-24">
    <div className="mx-auto max-w-7xl">
      <motion.div
        {...fadeUp}
        className="grid gap-4 rounded-[2rem] border border-white/70 bg-white/70 p-4 shadow-[0_24px_70px_rgba(148,163,184,0.12)] backdrop-blur-xl md:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.value}
            whileHover={{ y: -8, scale: 1.015 }}
            transition={{ duration: 0.24, ease: 'easeOut', delay: index * 0.02 }}
            className="rounded-[1.6rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(239,248,255,0.88)_100%)] p-6"
          >
            <div className="font-display text-3xl font-semibold tracking-[-0.06em] text-slate-950">{stat.value}</div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

const FeaturesSection = () => (
  <section id="features" className="px-4 py-24">
    <div className="mx-auto max-w-7xl">
      <motion.div {...fadeUp}>
        <SectionHeading
          eyebrow="Core capabilities"
          title="Built to replace the entire manual evaluation grind."
          description="Every layer of the workflow is designed to reduce operational load while improving scoring consistency, transparency, and speed."
        />
      </motion.div>

      <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {features.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -10, rotateX: 4, rotateY: -4 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="group frost-panel rounded-[2rem] p-6"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="hover-card-spotlight relative overflow-hidden rounded-[1.6rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(240,249,255,0.88)_100%)] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
                <div className="absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.95),transparent)]" />
                <div className="feature-icon-wrap flex h-14 w-14 items-center justify-center rounded-[1.35rem] bg-[linear-gradient(135deg,rgba(224,242,254,0.9)_0%,rgba(255,255,255,0.9)_100%)] shadow-[0_14px_30px_rgba(125,211,252,0.18)]">
                  <Icon className="h-6 w-6 text-slate-900" />
                </div>
                <h3 className="font-display mt-8 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  {feature.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-slate-600">{feature.description}</p>
                <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition group-hover:text-slate-900">
                  Explore capability
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  </section>
);

const ProductSection = () => (
  <section id="product" className="px-4 py-24">
    <div className="mx-auto max-w-7xl">
      <motion.div {...fadeUp}>
        <SectionHeading
          eyebrow="Product preview"
          title="A teacher dashboard that feels more like mission control."
          description="Upload sheets, monitor AI grading, review suspicious patterns, and publish results from one premium command center."
        />
      </motion.div>

      <motion.div
        {...fadeUp}
        whileHover={{ y: -8 }}
        className="frost-panel hover-panel-glow mt-16 overflow-hidden rounded-[2.4rem] p-4 shadow-[0_36px_120px_rgba(15,23,42,0.12)]"
      >
        <div className="overflow-hidden rounded-[2rem] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.97)_0%,rgba(239,248,255,0.94)_100%)]">
          <div className="flex flex-col gap-4 border-b border-slate-200/70 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-display text-2xl font-semibold tracking-[-0.05em] text-slate-950">
                University Review Board
              </div>
              <div className="mt-1 text-sm text-slate-500">Semester assessment cockpit for faculty and administrators</div>
            </div>
            <div className="flex flex-wrap gap-3">
              {['482 uploads', '142 reviewed', '12 alerts', 'Live analytics'].map((pill) => (
                <span
                  key={pill}
                  className="rounded-full border border-white/80 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-4 p-4 xl:grid-cols-[0.8fr_1.2fr_0.9fr]">
            <div className="space-y-4">
              <div className="interactive-surface rounded-[1.6rem] border border-white/70 bg-white/90 p-5 shadow-[0_18px_40px_rgba(148,163,184,0.14)]">
                <div className="text-sm font-semibold text-slate-900">Uploaded answer sheets</div>
                <div className="mt-4 space-y-3">
                  {[
                    { name: 'B.Tech AI Midterm', status: 'OCR ready' },
                    { name: 'Class 12 Physics', status: 'Scoring live' },
                    { name: 'MBA Case Study', status: 'Review queue' },
                    { name: 'Semester Recheck', status: 'Faculty redo' },
                  ].map((item) => (
                    <div key={item.name} className="interactive-surface rounded-2xl border border-slate-100 bg-slate-50/90 px-4 py-3">
                      <div className="text-sm font-medium text-slate-800">{item.name}</div>
                      <div className="mt-1 text-xs text-slate-500">{item.status}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="interactive-surface rounded-[1.6rem] border border-white/70 bg-slate-950 p-5 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
                <div className="text-sm font-medium text-white/70">Institution confidence index</div>
                <div className="mt-3 font-display text-5xl tracking-[-0.06em]">96.2</div>
                <div className="mt-2 text-sm text-white/70">Stable grading quality across departments</div>
              </div>
            </div>

            <div className="interactive-surface rounded-[1.6rem] border border-white/70 bg-white/90 p-5 shadow-[0_18px_40px_rgba(148,163,184,0.14)]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Marks analytics</div>
                  <div className="mt-1 text-xs text-slate-500">Performance spread across subjects and questions</div>
                </div>
                <div className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">Updated now</div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
                <div className="rounded-[1.4rem] bg-[linear-gradient(180deg,rgba(240,249,255,0.9)_0%,rgba(255,255,255,0.95)_100%)] p-4">
                  <div className="flex h-56 items-end gap-3">
                    {['45%', '58%', '64%', '72%', '81%', '76%', '88%', '69%'].map((height, index) => (
                      <div key={height} className="flex flex-1 flex-col items-center gap-2">
                        <div
                          className="w-full rounded-t-[1rem] bg-[linear-gradient(180deg,#c4b5fd_0%,#60a5fa_55%,#0f172a_100%)]"
                          style={{ height }}
                        />
                        <span className="text-[11px] font-medium text-slate-400">W{index + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'Theory scoring', value: '98%', accent: 'bg-emerald-500' },
                    { label: 'Subjective evaluation', value: '94%', accent: 'bg-cyan-500' },
                    { label: 'OCR certainty', value: '96%', accent: 'bg-violet-500' },
                  ].map((item) => (
                    <div key={item.label} className="interactive-surface rounded-[1.4rem] bg-slate-50 px-4 py-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">{item.label}</span>
                        <span className="font-semibold text-slate-900">{item.value}</span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-slate-200">
                        <div className={`h-2 rounded-full ${item.accent}`} style={{ width: item.value }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="interactive-surface rounded-[1.6rem] border border-white/70 bg-white/90 p-5 shadow-[0_18px_40px_rgba(148,163,184,0.14)]">
                <div className="text-sm font-semibold text-slate-900">Suspicious similarity alerts</div>
                <div className="mt-4 space-y-3">
                  {[
                    'Cross-sheet sentence duplication detected in Section B',
                    'Unusual option patterns surfaced in MCQ cluster 4',
                    'Repeated answer structure flagged across two rooms',
                  ].map((item) => (
                    <div key={item} className="interactive-surface rounded-2xl border border-rose-100 bg-rose-50/70 px-4 py-3 text-sm text-rose-700">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="interactive-surface rounded-[1.6rem] border border-white/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.96)_0%,rgba(30,41,59,0.94)_100%)] p-5 shadow-[0_18px_40px_rgba(15,23,42,0.2)]">
                <div className="text-sm font-medium text-white/70">Teacher actions</div>
                <div className="mt-4 space-y-3">
                  {[
                    'Approve AI scores',
                    'Send 14 answers to redo',
                    'Export final result reports',
                  ].map((item) => (
                    <div key={item} className="interactive-surface flex items-center justify-between rounded-2xl bg-white/6 px-4 py-3 text-sm text-white">
                      <span>{item}</span>
                      <ArrowRight className="h-4 w-4 text-cyan-300" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

const WhySection = () => (
  <section id="about" className="px-4 py-24">
    <div className="mx-auto max-w-7xl">
      <motion.div {...fadeUp}>
        <SectionHeading
          eyebrow="Why OmniMark"
          title="Manual checking was never built to scale with modern assessment."
          description="The difference is not just speed. It is consistency, auditability, and institutional confidence at every step."
        />
      </motion.div>

      <div className="mt-16 grid gap-6 lg:grid-cols-2">
        <motion.div
          {...fadeUp}
          whileHover={{ y: -8, rotateX: 2, rotateY: -2 }}
          className="hover-panel-glow rounded-[2rem] border border-slate-200 bg-white/80 p-8 shadow-[0_24px_60px_rgba(148,163,184,0.12)] backdrop-blur-xl"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Manual checking
          </div>
          <h3 className="font-display mt-6 text-3xl font-semibold tracking-[-0.05em] text-slate-950">Slow. Tiring. Inconsistent.</h3>
          <div className="mt-8 space-y-4">
            {[
              'Stacks of answer sheets create grading bottlenecks during peak exam periods.',
              'Subjective answers get marked differently across evaluators and review rounds.',
              'Cheat detection is reactive and usually discovered after results are compiled.',
            ].map((item) => (
              <div key={item} className="interactive-surface rounded-[1.4rem] border border-slate-100 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-600">
                {item}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          {...fadeUp}
          whileHover={{ y: -8, rotateX: 2, rotateY: 2 }}
          className="hover-panel-glow rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(224,242,254,0.84)_100%)] p-8 shadow-[0_24px_80px_rgba(56,189,248,0.14)] backdrop-blur-xl"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className="inline-flex rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
            OmniMark AI
          </div>
          <h3 className="font-display mt-6 text-3xl font-semibold tracking-[-0.05em] text-slate-950">Fast. Accurate. Scalable.</h3>
          <div className="mt-8 space-y-4">
            {[
              'Digitize, evaluate, review, and report results in one tightly integrated system.',
              'Keep human oversight where needed with review and redo loops for edge cases.',
              'Give faculty and administrators audit trails, analytics, and flagged risk signals before publishing.',
            ].map((item) => (
              <div
                key={item}
                className="interactive-surface rounded-[1.4rem] border border-white/80 bg-white/80 px-5 py-4 text-sm leading-7 text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

const TestimonialsSection = () => (
  <section className="px-4 py-24">
    <div className="mx-auto max-w-7xl">
      <motion.div {...fadeUp}>
        <SectionHeading
          eyebrow="Customer voice"
          title="Built for institutions that cannot afford fragile evaluation systems."
          description="The strongest signal we hear is the same one your users should feel on the homepage: this is serious infrastructure."
        />
      </motion.div>

      <div className="mt-16 grid gap-6 xl:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={testimonial.name}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -10, rotateX: 3, rotateY: index % 2 === 0 ? -3 : 3 }}
            className="hover-panel-glow rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_60px_rgba(148,163,184,0.12)] backdrop-blur-xl"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="inline-flex rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
              Verified client
            </div>
            <p className="mt-6 text-lg leading-8 text-slate-700">“{testimonial.quote}”</p>
            <div className="mt-8">
              <div className="font-display text-xl font-semibold tracking-[-0.04em] text-slate-950">{testimonial.name}</div>
              <div className="mt-1 text-sm text-slate-500">{testimonial.role}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const FinalCta = () => (
  <section className="px-4 pb-24 pt-8">
    <div className="mx-auto max-w-6xl">
      <motion.div
        {...fadeUp}
        whileHover={{ y: -8, scale: 1.01 }}
        className="hover-panel-glow relative overflow-hidden rounded-[2.4rem] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(224,242,254,0.92)_38%,rgba(229,231,255,0.9)_100%)] px-6 py-16 shadow-[0_36px_120px_rgba(15,23,42,0.12)] md:px-12"
      >
        <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="absolute -right-10 bottom-0 h-48 w-48 rounded-full bg-violet-200/40 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
            <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
            Transform evaluation with AI
          </div>
          <h2 className="font-display mt-6 text-4xl font-semibold tracking-[-0.06em] text-slate-950 md:text-6xl">
            The upgrade from paper checking chaos to institutional clarity starts here.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
            Launch a next-gen evaluation experience for teachers, students, and review boards with one powerful platform.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/auth"
              className="button-sheen inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-7 py-4 text-sm font-semibold text-white transition hover:-translate-y-1 hover:bg-slate-800"
            >
              Sign Up
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#home"
              className="button-sheen inline-flex items-center justify-center gap-2 rounded-full border border-white/80 bg-white/80 px-7 py-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-1 hover:text-slate-950"
            >
              Back to top
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="px-4 pb-10">
    <div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-[2rem] border border-white/70 bg-white/70 px-6 py-8 shadow-[0_18px_40px_rgba(148,163,184,0.1)] backdrop-blur-xl md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#dff7ff_0%,#9bd6ff_45%,#d9dbff_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_24px_rgba(56,189,248,0.22)]">
          <Brain className="h-5 w-5 text-slate-900" />
        </div>
        <div>
          <div className="font-display text-lg font-semibold tracking-[-0.04em] text-slate-950">OmniMark AI</div>
          <div className="text-sm text-slate-500">Premium evaluation intelligence for modern institutions.</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-5 text-sm font-medium text-slate-500">
        <a href="#home" className="nav-link-pill transition hover:text-slate-950">
          Home
        </a>
        <a href="#product" className="nav-link-pill transition hover:text-slate-950">
          Product
        </a>
        <a href="#about" className="nav-link-pill transition hover:text-slate-950">
          About
        </a>
        <Link to="/auth" className="nav-link-pill transition hover:text-slate-950">
          Sign Up
        </Link>
      </div>

      <div className="text-sm text-slate-500">© 2026 OmniMark AI. All rights reserved.</div>
    </div>
  </footer>
);

export const Home = () => {
  return (
    <div className="page-shell min-h-screen overflow-x-hidden text-slate-900 selection:bg-cyan-100 selection:text-slate-950">
      <Navbar />
      <main>
        <HomeHero />
        <StatsSection />
        <FeaturesSection />
        <ProductSection />
        <WhySection />
        <TestimonialsSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
};
