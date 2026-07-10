import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

// ─── Mouse parallax ─────────────────────────────────────────────────────────

function useParallax() {
  const ref = useRef(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width - 0.5
      const y = (e.clientY - r.top) / r.height - 0.5
      setPos({ x, y })
    }
    el.addEventListener('mousemove', onMove)
    return () => el.removeEventListener('mousemove', onMove)
  }, [])

  return [ref, pos]
}

// ─── Scroll reveal ──────────────────────────────────────────────────────────

function useReveal() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); io.disconnect() } },
      { threshold: 0.15 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return [ref, visible]
}

function Reveal({ children, className = '', delay = 0 }) {
  const [ref, visible] = useReveal()
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

// ─── Icons ──────────────────────────────────────────────────────────────────

const Arrow = (props) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 10h12M11 5l5 5-5 5" />
  </svg>
)
const Check = (props) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 10.5l4 4 8-9" />
  </svg>
)
const Building = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 21V5a1 1 0 011-1h9a1 1 0 011 1v16M4 21h16M9 8h.01M9 12h.01M9 16h.01M14 8h.01M14 12h.01M14 16h.01M15 21v-4a1 1 0 011-1h3a1 1 0 011 1v4" />
  </svg>
)
const Inbox = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 12h4l2 3h4l2-3h4M4 12l1.5-6.5A2 2 0 017.44 4h9.12a2 2 0 011.94 1.5L20 12M4 12v6a2 2 0 002 2h12a2 2 0 002-2v-6" />
  </svg>
)
const Users = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M10 11a4 4 0 100-8 4 4 0 000 8z" />
  </svg>
)
const Bell = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
  </svg>
)
const Link2 = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M10 13a5 5 0 007.07 0l2.83-2.83a5 5 0 00-7.07-7.07l-1.5 1.5M14 11a5 5 0 00-7.07 0L4.1 13.83a5 5 0 007.07 7.07l1.49-1.49" />
  </svg>
)
const Sparkle = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />
  </svg>
)
const ChevronDown = (props) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 7.5l5 5 5-5" />
  </svg>
)

// ─── Content ────────────────────────────────────────────────────────────────

const STATS = [
  { value: '5', label: 'connected modules' },
  { value: '0', label: 'spreadsheets required' },
  { value: '24/7', label: 'reminders on watch' },
  { value: '2min', label: 'to your first entry' },
]

const BENTO = [
  {
    icon: Building, name: 'Companies', span: 'lg:col-span-3 lg:row-span-2',
    desc: 'Every employer you’re pursuing, organized by stage — from cold research to signed offer.',
    accent: 'from-[#5B5FEF] to-[#8B5CF6]',
  },
  {
    icon: Inbox, name: 'Applications', span: 'lg:col-span-3',
    desc: 'A living pipeline, not a static list. Watch roles move from applied to interview to offer.',
    accent: 'from-[#8B5CF6] to-[#22D3EE]',
  },
  {
    icon: Bell, name: 'Follow-ups', span: 'lg:col-span-2',
    desc: 'Reminders that surface themselves before a thread goes cold.',
    accent: 'from-[#22D3EE] to-[#5B5FEF]',
  },
  {
    icon: Users, name: 'Recruiters', span: 'lg:col-span-2',
    desc: 'The people behind every opening, one search away.',
    accent: 'from-[#5B5FEF] to-[#22D3EE]',
  },
  {
    icon: Link2, name: 'Referrals', span: 'lg:col-span-2',
    desc: 'Who vouched for you, and where it landed.',
    accent: 'from-[#8B5CF6] to-[#5B5FEF]',
  },
]

const TIMELINE = [
  { stage: 'Researching', day: 'Day 0', text: 'Cobalt Systems added — role, source, and notes logged in seconds.' },
  { stage: 'Applied', day: 'Day 0', text: 'Application tracked with resume version and referral contact attached.' },
  { stage: 'Follow-up due', day: 'Day 6', text: 'No response yet — CareerFlow surfaces a nudge on the dashboard.' },
  { stage: 'Interview', day: 'Day 11', text: 'Recruiter screen confirmed. Prep notes and thread stay linked.' },
  { stage: 'Offer', day: 'Day 19', text: 'Offer received. Full history — every touchpoint — still one click away.' },
]

const TESTIMONIALS = [
  { quote: 'I had eleven tabs open and a spreadsheet that was already out of date. CareerFlow replaced all of it in one afternoon.', name: 'Priya N.', role: 'Landed a PM role at a Series C startup' },
  { quote: 'The follow-up reminders alone are worth it — I stopped losing threads with recruiters I actually liked.', name: 'Marcus T.', role: 'Backend engineer, offer in 6 weeks' },
  { quote: 'It feels like the tool a disciplined person would have built for themselves. Nothing extra, nothing missing.', name: 'Sana K.', role: 'Design lead, career switch' },
]

const PRICING = [
  { name: 'Personal', price: 'Free', tag: 'Forever', desc: 'Everything you need to run one search, start to offer.', features: ['Unlimited companies & applications', 'Recruiter & referral tracking', 'Follow-up reminders', 'Profile & resume storage'], cta: 'Get started', featured: false },
  { name: 'Focused', price: 'Free', tag: 'While in beta', desc: 'The same product, tuned for an active multi-track search.', features: ['Everything in Personal', 'Daily summary digest', 'Deadline & interview alerts', 'Priority support'], cta: 'Get started', featured: true },
]

const FAQS = [
  { q: 'Is CareerFlow free to use?', a: 'Yes. Every core module — companies, applications, recruiters, follow-ups, and referrals — is free, with no card required to start.' },
  { q: 'Do I need to import anything to get started?', a: 'No. Add your first company and application directly; most people are fully set up in under two minutes.' },
  { q: 'Will I get reminded about follow-ups automatically?', a: 'Yes — pending follow-ups, upcoming deadlines, and interview dates surface on your dashboard the moment they’re due.' },
  { q: 'Can I track referrals separately from applications?', a: 'Yes. Referrals link to the application and company they support, so the full chain stays visible.' },
]

// ─── Small building blocks ──────────────────────────────────────────────────

function GlowOrb({ className }) {
  return <div className={`absolute rounded-full blur-3xl pointer-events-none ${className}`} />
}

function StatusPill({ children, tone = 'indigo' }) {
  const tones = {
    indigo: 'bg-[#5B5FEF]/10 text-[#8184F5] ring-[#5B5FEF]/25',
    violet: 'bg-[#8B5CF6]/10 text-[#A78BFA] ring-[#8B5CF6]/25',
    cyan: 'bg-[#22D3EE]/10 text-[#5EEAFB] ring-[#22D3EE]/25',
    emerald: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/25',
    amber: 'bg-amber-400/10 text-amber-300 ring-amber-400/25',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${tones[tone]}`}>
      {children}
    </span>
  )
}

const STAGE_TONE = { Researching: 'indigo', Applied: 'cyan', 'Follow-up due': 'amber', Interview: 'violet', Offer: 'emerald' }

function FaqItem({ q, a, open, onClick }) {
  return (
    <div className="border-b border-white/10">
      <button onClick={onClick} className="flex w-full items-center justify-between gap-6 py-6 text-left group">
        <span className="text-base font-medium text-white/90 group-hover:text-white transition-colors">{q}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-white/40 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`grid transition-all duration-300 ease-out ${open ? 'grid-rows-[1fr] opacity-100 pb-6' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <p className="text-sm leading-relaxed text-white/55 max-w-xl">{a}</p>
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  const [heroRef, heroPos] = useParallax()
  const [openFaq, setOpenFaq] = useState(0)

  return (
    <div className="min-h-screen bg-[#05060B] font-sans text-white antialiased selection:bg-[#5B5FEF]/40">
      <style>{EXTRA_CSS}</style>

      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#05060B]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.5rem] max-w-[80rem] items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#5B5FEF] to-[#8B5CF6] shadow-[0_0_20px_rgba(91,95,239,0.5)]">
              <span className="font-display text-xs font-bold">CF</span>
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">CareerFlow</span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            {['Product', 'Journey', 'Stories', 'Pricing', 'FAQ'].map((l) => (
              <a key={l} href={`#${l.toLowerCase()}`} className="text-sm font-medium text-white/60 transition-colors hover:text-white">
                {l}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden text-sm font-medium text-white/60 transition-colors hover:text-white sm:inline">
              Sign in
            </Link>
            <Link
              to="/signup"
              className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-r from-[#5B5FEF] to-[#8B5CF6] px-5 py-2.5 text-sm font-semibold shadow-[0_0_24px_rgba(91,95,239,0.35)] transition-all hover:shadow-[0_0_32px_rgba(91,95,239,0.55)] hover:scale-[1.03] active:scale-[0.98]"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative overflow-hidden pt-24 pb-32 sm:pt-32 sm:pb-40">
        <GlowOrb className="-top-40 left-1/2 h-[46rem] w-[46rem] -translate-x-1/2 bg-[#5B5FEF]/25 animate-drift" />
        <GlowOrb className="top-20 -right-32 h-[28rem] w-[28rem] bg-[#8B5CF6]/25 animate-drift-slow" />
        <GlowOrb className="bottom-0 -left-32 h-[24rem] w-[24rem] bg-[#22D3EE]/15 animate-drift" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />

        <div className="relative mx-auto max-w-[80rem] px-6">
          <Reveal className="flex justify-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 backdrop-blur-sm">
              <Sparkle className="h-3.5 w-3.5 text-[#8B5CF6]" />
              <span className="text-xs font-semibold tracking-wide text-white/70">The command center for your job search</span>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mx-auto max-w-4xl text-center font-display text-[3rem] font-bold leading-[1.02] tracking-tight text-balance sm:text-[4.5rem] lg:text-[5.5rem]">
              Run your job search
              <br />
              <span className="bg-gradient-to-r from-[#8184F5] via-[#A78BFA] to-[#5EEAFB] bg-clip-text text-transparent">
                like it's your job.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mx-auto mt-7 max-w-xl text-center text-lg leading-relaxed text-white/55">
              Companies, applications, recruiters, follow-ups, and referrals — unified in one
              beautifully organized system that tells you exactly what needs attention today.
            </p>
          </Reveal>

          <Reveal delay={240} className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/signup"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-white px-7 py-3.5 text-sm font-bold text-[#0A0A12] shadow-[0_0_40px_rgba(255,255,255,0.15)] transition-all hover:shadow-[0_0_50px_rgba(255,255,255,0.3)] hover:scale-[1.03] active:scale-[0.98]"
            >
              Start free — no card
              <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-7 py-3.5 text-sm font-semibold text-white/80 backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/[0.08] hover:text-white"
            >
              Sign in
            </Link>
          </Reveal>

          {/* Floating product showcase */}
          <Reveal delay={320} className="relative mt-24 [perspective:2000px]">
            <div
              className="relative mx-auto max-w-4xl transition-transform duration-300 ease-out"
              style={{ transform: `rotateX(${heroPos.y * -4}deg) rotateY(${heroPos.x * 6}deg)` }}
            >
              {/* Floating side cards */}
              <div className="animate-float absolute -left-6 top-10 z-20 hidden w-56 rounded-2xl border border-white/10 bg-[#0B0C14]/90 p-4 shadow-2xl backdrop-blur-xl lg:block" style={{ animationDelay: '0.4s' }}>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-white/40">Today</p>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <span className="text-xs text-white/80">2 follow-ups due</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#8B5CF6]" />
                    <span className="text-xs text-white/80">Interview tomorrow</span>
                  </div>
                </div>
              </div>

              <div className="animate-float absolute -right-8 bottom-16 z-20 hidden w-48 rounded-2xl border border-white/10 bg-[#0B0C14]/90 p-4 shadow-2xl backdrop-blur-xl lg:block" style={{ animationDelay: '1.6s' }}>
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0">
                    <svg width="48" height="48" className="-rotate-90 absolute inset-0">
                      <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
                      <circle cx="24" cy="24" r="20" fill="none" stroke="url(#g1)" strokeWidth="5"
                        strokeDasharray={`${0.78 * 2 * Math.PI * 20} ${2 * Math.PI * 20}`} strokeLinecap="round" />
                      <defs>
                        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#5B5FEF" /><stop offset="100%" stopColor="#22D3EE" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold">78%</div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Profile</p>
                    <p className="text-[10px] text-white/40">strength</p>
                  </div>
                </div>
              </div>

              {/* Main panel */}
              <div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-[#0E0F18] to-[#0A0A12] p-2 shadow-[0_60px_120px_-30px_rgba(91,95,239,0.35)]">
                <div className="rounded-2xl border border-white/[0.06] bg-[#0B0C14] p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
                      <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
                      <span className="h-3 w-3 rounded-full bg-[#28C840]" />
                    </div>
                    <span className="font-mono text-[11px] text-white/30">careerflow.app/applications</span>
                    <div className="w-14" />
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { role: 'Frontend Engineer', company: 'Northwind Labs', tone: 'violet', label: 'Interview' },
                      { role: 'Product Designer', company: 'Cobalt Systems', tone: 'cyan', label: 'Applied' },
                      { role: 'Staff Engineer', company: 'Hearth & Co.', tone: 'emerald', label: 'Offer' },
                      { role: 'Growth Lead', company: 'Fathom Analytics', tone: 'indigo', label: 'Researching' },
                    ].map((r) => (
                      <div key={r.role} className="flex items-center gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-white/[0.03]">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#5B5FEF] to-[#8B5CF6] text-[11px] font-bold">
                          {r.company[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-white">{r.role}</p>
                          <p className="truncate text-xs text-white/40">{r.company}</p>
                        </div>
                        <StatusPill tone={r.tone}>{r.label}</StatusPill>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="relative border-y border-white/[0.06] bg-white/[0.015]">
        <div className="mx-auto grid max-w-[80rem] grid-cols-2 sm:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 80} className={`px-6 py-12 text-center ${i !== 0 ? 'border-l border-white/[0.06]' : ''}`}>
              <p className="font-display bg-gradient-to-br from-white to-white/50 bg-clip-text text-4xl font-bold text-transparent tabular-nums sm:text-5xl">
                {s.value}
              </p>
              <p className="mt-2 text-sm text-white/45">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Bento feature grid ── */}
      <section id="product" className="relative mx-auto max-w-[80rem] px-6 py-28 sm:py-36">
        <Reveal className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#8184F5]">The system</p>
          <h2 className="font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Five modules. One source of truth.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-white/50">
            Every piece of your search lives in the same place, linked, dated, and searchable.
          </p>
        </Reveal>

        <div className="grid gap-4 lg:grid-cols-6">
          {BENTO.map((f, i) => {
            const Icon = f.icon
            return (
              <Reveal key={f.name} delay={i * 90} className={f.span}>
                <div className="group relative h-full overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-7 transition-all duration-300 hover:border-white/20 hover:-translate-y-1">
                  <div className={`absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br ${f.accent} opacity-[0.12] blur-2xl transition-opacity duration-300 group-hover:opacity-25`} />
                  <div className={`relative mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${f.accent} shadow-lg`}>
                    <Icon className="h-5.5 w-5.5 text-white" />
                  </div>
                  <h3 className="relative font-display text-xl font-semibold text-white">{f.name}</h3>
                  <p className="relative mt-2.5 max-w-xs text-sm leading-relaxed text-white/50">{f.desc}</p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </section>

      {/* ── Interactive timeline ── */}
      <section id="journey" className="relative border-y border-white/[0.06] bg-white/[0.015] py-28 sm:py-36">
        <GlowOrb className="left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 bg-[#8B5CF6]/[0.08]" />
        <div className="relative mx-auto max-w-[52rem] px-6">
          <Reveal className="mb-16 text-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#5EEAFB]">The journey</p>
            <h2 className="font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              Nineteen days, one thread.
            </h2>
          </Reveal>

          <div className="relative">
            <div className="absolute left-[27px] top-2 bottom-2 w-px bg-gradient-to-b from-[#5B5FEF] via-[#8B5CF6] to-[#22D3EE] sm:left-[35px]" />
            <div className="space-y-3">
              {TIMELINE.map((t, i) => (
                <Reveal key={t.stage + i} delay={i * 100} className="relative flex gap-6 sm:gap-8">
                  <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#0B0C14] sm:h-[70px] sm:w-[70px]">
                    <span className="font-mono text-[10px] font-semibold text-white/50">{t.day}</span>
                  </div>
                  <div className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-6 py-5 transition-colors hover:bg-white/[0.05]">
                    <div className="mb-2">
                      <StatusPill tone={STAGE_TONE[t.stage]}>{t.stage}</StatusPill>
                    </div>
                    <p className="text-sm leading-relaxed text-white/70">{t.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="stories" className="mx-auto max-w-[80rem] px-6 py-28 sm:py-36">
        <Reveal className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#A78BFA]">Stories</p>
          <h2 className="font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Built for people mid-search.
          </h2>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 100}>
              <div className="flex h-full flex-col rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-7 transition-all hover:border-white/20 hover:-translate-y-1">
                <div className="mb-5 flex gap-0.5 text-[#8B5CF6]">
                  {Array.from({ length: 5 }).map((_, k) => <Sparkle key={k} className="h-3.5 w-3.5" />)}
                </div>
                <p className="flex-1 text-[15px] leading-relaxed text-white/75">"{t.quote}"</p>
                <div className="mt-6 flex items-center gap-3 border-t border-white/[0.08] pt-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#5B5FEF] to-[#22D3EE] text-xs font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-white/40">{t.role}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="relative border-y border-white/[0.06] bg-white/[0.015] py-28 sm:py-36">
        <div className="mx-auto max-w-[64rem] px-6">
          <Reveal className="mx-auto mb-16 max-w-2xl text-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#5EEAFB]">Pricing</p>
            <h2 className="font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              Free to run your whole search.
            </h2>
          </Reveal>

          <div className="grid gap-6 sm:grid-cols-2">
            {PRICING.map((p, i) => (
              <Reveal key={p.name} delay={i * 100}>
                <div className={`relative h-full rounded-3xl border p-8 ${p.featured ? 'border-[#5B5FEF]/40 bg-gradient-to-b from-[#5B5FEF]/[0.08] to-transparent shadow-[0_0_60px_-15px_rgba(91,95,239,0.4)]' : 'border-white/[0.08] bg-white/[0.02]'}`}>
                  {p.featured && (
                    <span className="absolute -top-3 left-8 rounded-full bg-gradient-to-r from-[#5B5FEF] to-[#8B5CF6] px-3 py-1 text-[10px] font-bold uppercase tracking-wide">
                      Recommended
                    </span>
                  )}
                  <h3 className="font-display text-xl font-semibold">{p.name}</h3>
                  <p className="mt-1 text-sm text-white/45">{p.desc}</p>
                  <div className="mt-6 flex items-baseline gap-2">
                    <span className="font-display text-4xl font-bold">{p.price}</span>
                    <span className="text-sm text-white/40">{p.tag}</span>
                  </div>
                  <ul className="mt-7 space-y-3">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-white/70">
                        <Check className="h-4 w-4 shrink-0 text-[#5EEAFB]" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/signup"
                    className={`mt-8 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] ${
                      p.featured
                        ? 'bg-gradient-to-r from-[#5B5FEF] to-[#8B5CF6] text-white shadow-[0_0_24px_rgba(91,95,239,0.35)]'
                        : 'border border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    {p.cta}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="mx-auto max-w-[48rem] px-6 py-28 sm:py-36">
        <Reveal className="mb-14 text-center">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#A78BFA]">FAQ</p>
          <h2 className="font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Questions, answered.
          </h2>
        </Reveal>

        <Reveal delay={100}>
          <div>
            {FAQS.map((f, i) => (
              <FaqItem key={f.q} q={f.q} a={f.a} open={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? -1 : i)} />
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── Closing CTA ── */}
      <section className="relative overflow-hidden px-6 py-28 sm:py-36">
        <GlowOrb className="left-1/2 top-1/2 h-[50rem] w-[50rem] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-[#5B5FEF]/20 via-[#8B5CF6]/20 to-[#22D3EE]/10 animate-spin-slow" />
        <div className="relative mx-auto max-w-2xl text-center">
          <Reveal>
            <h2 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-balance sm:text-6xl">
              Stop running your search
              <br />from memory.
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-white/55">
              Set up your first company and application in under two minutes. Free, forever, for the whole search.
            </p>
          </Reveal>
          <Reveal delay={200} className="mt-10">
            <Link
              to="/signup"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-white px-8 py-4 text-sm font-bold text-[#0A0A12] shadow-[0_0_50px_rgba(255,255,255,0.2)] transition-all hover:shadow-[0_0_60px_rgba(255,255,255,0.35)] hover:scale-[1.03] active:scale-[0.98]"
            >
              Create your account
              <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-[80rem] px-6 py-14">
          <div className="flex flex-col items-start justify-between gap-10 sm:flex-row">
            <div>
              <Link to="/" className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#5B5FEF] to-[#8B5CF6]">
                  <span className="font-display text-xs font-bold">CF</span>
                </div>
                <span className="font-display text-lg font-semibold">CareerFlow</span>
              </Link>
              <p className="mt-3 max-w-xs text-sm text-white/40">The command center for a job search that actually gets tracked.</p>
            </div>
            <div className="grid grid-cols-2 gap-x-16 gap-y-3 text-sm sm:flex sm:gap-16">
              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/30">Product</span>
                <a href="#product" className="text-white/55 hover:text-white transition-colors">Modules</a>
                <a href="#pricing" className="text-white/55 hover:text-white transition-colors">Pricing</a>
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/30">Account</span>
                <Link to="/login" className="text-white/55 hover:text-white transition-colors">Sign in</Link>
                <Link to="/signup" className="text-white/55 hover:text-white transition-colors">Sign up</Link>
              </div>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 text-xs text-white/30 sm:flex-row">
            <span>© {new Date().getFullYear()} CareerFlow. Built for the search.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

const EXTRA_CSS = `
@media (prefers-reduced-motion: reduce) {
  .animate-drift, .animate-drift-slow, .animate-spin-slow, .animate-float { animation: none !important; }
}
`
