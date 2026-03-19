'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Zap, Shield, Users, BarChart3,
  ArrowRight, Star, Upload, Search,
  Sparkles, RefreshCw, X, Menu, Check, ArrowDown,
  ScanLine, GitCompare, ClipboardCheck, Chrome, Flag, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Marquee } from '@/components/ui/marquee';
import { NumberTicker } from '@/components/ui/number-ticker';
import { BorderBeam } from '@/components/ui/border-beam';
import { ShimmerButton } from '@/components/ui/shimmer-button';

/* ── Kyriq inline SVG icon ── */
function KyriqIcon({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
      <defs>
        <linearGradient id="kStem" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="22" fill="#1a1a2e" />
      <rect x="22" y="20" width="11" height="60" rx="5.5" fill="url(#kStem)" />
      <line x1="33" y1="50" x2="68" y2="20" stroke="#10b981" strokeWidth="11" strokeLinecap="round" />
      <line x1="33" y1="50" x2="68" y2="80" stroke="#6366f1" strokeWidth="11" strokeLinecap="round" />
    </svg>
  );
}

function KyriqIconWhite({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="kStemW" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="22" fill="rgba(255,255,255,0.07)" />
      <rect x="22" y="20" width="11" height="60" rx="5.5" fill="url(#kStemW)" />
      <line x1="33" y1="50" x2="68" y2="20" stroke="#34d399" strokeWidth="11" strokeLinecap="round" />
      <line x1="33" y1="50" x2="68" y2="80" stroke="#818cf8" strokeWidth="11" strokeLinecap="round" />
    </svg>
  );
}

function FadeIn({ children, className, delay = 0, direction = 'up' }: {
  children: ReactNode; className?: string; delay?: number; direction?: 'up' | 'down' | 'left' | 'right';
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const axis = direction === 'left' || direction === 'right' ? 'x' : 'y';
  const offset = direction === 'down' || direction === 'right' ? -40 : 40;
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, [axis]: offset }}
      animate={isInView ? { opacity: 1, [axis]: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >{children}</motion.div>
  );
}

function GradientBg() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute top-[-50%] left-[-20%] w-[70%] h-[100%] rounded-full opacity-30 blur-3xl animate-float" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-30%] right-[-10%] w-[60%] h-[80%] rounded-full opacity-20 blur-3xl animate-float" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)', animationDelay: '-3s' }} />
      <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full opacity-10 blur-3xl animate-glow-pulse" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)' }} />
      <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
    </div>
  );
}

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);
  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how' },
    { label: 'Extension', href: '#extension' },
    { label: 'Pricing', href: '#pricing' },
  ];
  return (
    <motion.nav initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}
      className={cn('fixed top-0 inset-x-0 z-50 transition-all duration-500', scrolled ? 'bg-white/82 backdrop-blur-xl saturate-[1.8] shadow-[0_1px_3px_rgba(0,0,0,0.06)] border-b border-gray-200/50' : 'bg-transparent')}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14 lg:h-[56px]">
        <Link href="/" className="flex items-center gap-2.5 group">
          <KyriqIcon size={30} className="rounded-lg" />
          <span className="text-[20px] font-extrabold tracking-[-0.8px] text-[#1a1a2e]">kyriq</span>
        </Link>
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors">{l.label}</a>
          ))}
        </div>
        <div className="hidden lg:flex items-center gap-3">
          <Link href="/login" className="text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors">Sign in</Link>
          <Link href="/signup" className="px-[18px] py-2 text-[13px] font-semibold text-white bg-[#1a1a2e] hover:bg-[#2d2d4a] rounded-full hover:scale-[1.02] transition-all">
            Get started free
          </Link>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors" aria-label="Toggle menu">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="lg:hidden overflow-hidden bg-white/95 backdrop-blur-xl border-t border-gray-100">
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">{l.label}</a>
              ))}
              <div className="pt-4 mt-2 border-t border-gray-100 grid grid-cols-2 gap-3">
                <Link href="/login" onClick={() => setMobileOpen(false)} className="text-center py-3 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">Sign in</Link>
                <Link href="/signup" onClick={() => setMobileOpen(false)} className="text-center py-3 text-sm font-semibold text-white bg-[#1a1a2e] rounded-xl">Get started free</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

function Hero() {
  return (
    <section className="relative pt-28 sm:pt-36 lg:pt-44 pb-16 sm:pb-24 px-4 sm:px-6 overflow-hidden">
      <GradientBg />
      <div className="max-w-5xl mx-auto text-center relative">
        <FadeIn>
          <motion.div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50/80 backdrop-blur-sm border border-indigo-200/60 rounded-full text-[12px] font-semibold text-indigo-700 mb-6 sm:mb-8 tracking-wide" whileHover={{ scale: 1.03 }}>
            <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" /></span>
            Now with Chrome extension for QuickBooks
          </motion.div>
        </FadeIn>
        <FadeIn delay={0.1}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[80px] font-extrabold tracking-[-3px] leading-[1.02] text-[#1d1d1f] mb-6">
            Check reconciliation<br />
            <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-500 bg-clip-text text-transparent">finally automated.</span>
          </h1>
        </FadeIn>
        <FadeIn delay={0.2}>
          <p className="text-base sm:text-lg md:text-[21px] text-[#6e6e73] max-w-[560px] mx-auto mb-10 sm:mb-12 leading-relaxed tracking-[-0.2px] px-4">
            Kyriq matches your checks against QuickBooks in seconds — with AI confidence scoring, one-click approval, and automatic clearing.
          </p>
        </FadeIn>
        <FadeIn delay={0.3}>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-16 sm:mb-20 px-4">
            <Link href="/signup" className="px-7 sm:px-8 py-3.5 text-[15px] font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full shadow-xl shadow-indigo-500/35 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
              Start free trial <ArrowRight size={16} />
            </Link>
            <motion.a href="#how" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-7 sm:px-8 py-3.5 text-[15px] font-medium text-[#1d1d1f] bg-transparent border-[1.5px] border-gray-200 rounded-full hover:border-gray-300 hover:bg-[#f5f5f7] transition-all flex items-center justify-center gap-2">
              Watch demo
            </motion.a>
          </div>
        </FadeIn>
        <FadeIn delay={0.5}>
          <div className="max-w-[960px] mx-auto relative">
            <BorderBeam size={300} duration={12} colorFrom="#6366f1" colorTo="#10b981" />
            <div className="rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.14),0_8px_24px_rgba(99,102,241,0.1)] border border-gray-200/50">
              {/* Browser chrome */}
              <div className="bg-[#f0f0f0] px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 border-b border-gray-200/50">
                <div className="flex gap-1.5"><span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#ff5f57]" /><span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#ffbd2e]" /><span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#28c840]" /></div>
                <div className="ml-2 flex-1 bg-white rounded-md px-3 py-1 text-[10px] sm:text-xs text-gray-400 font-mono truncate flex items-center gap-1.5 border border-gray-100">
                  <KyriqIcon size={10} /><span>app.kyriq.com/matches</span>
                </div>
              </div>
              {/* Mini app */}
              <div className="flex min-h-[320px] sm:min-h-[380px]">
                {/* Sidebar */}
                <div className="hidden sm:flex flex-col w-[180px] md:w-[200px] bg-[#1a1a2e] p-3 gap-1">
                  <div className="flex items-center gap-2 px-3 py-2 mb-3">
                    <KyriqIconWhite size={22} />
                    <span className="text-[14px] font-extrabold text-white tracking-[-0.5px]">kyriq</span>
                  </div>
                  {['Dashboard','Upload','QB Match','Analytics','Settings'].map((item, i) => (
                    <div key={item} className={cn('px-3 py-2 rounded-lg text-[12px] font-medium flex items-center gap-2', i === 2 ? 'bg-indigo-500/25 text-white' : 'text-white/50')}>
                      <span className="w-4 h-4 rounded bg-white/10 text-[9px] flex items-center justify-center">
                        {['📊','⬆️','🔗','📈','⚙️'][i]}
                      </span>
                      {item}
                    </div>
                  ))}
                </div>
                {/* Content */}
                <div className="flex-1 bg-[#f8f7ff] p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[13px] font-bold text-[#1e2235]">QB Match</span>
                    <div className="flex gap-1.5">
                      <span className="bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">Sync QB</span>
                      <span className="bg-indigo-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">Approve All</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 mb-3">
                    {[{l:'All 24',a:true},{l:'Matched 18',a:false},{l:'Pending 4',a:false},{l:'Discrepancy 2',a:false}].map(p => (
                      <span key={p.l} className={cn('text-[10px] font-semibold px-2.5 py-1 rounded-full border', p.a ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-gray-500 border-gray-200')}>{p.l}</span>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    {[
                      {am:'$2,450.00',py:'Acme Supply Co.',dt:'Check #1042 · Mar 12',st:'approved',sc:'98'},
                      {am:'$870.50',py:'Metro Office Solutions',dt:'Check #1043 · Mar 13',st:'matched',sc:'94'},
                      {am:'$3,100.00',py:'Riverside Contractors',dt:'Check #1044 · Mar 14',st:'pending',sc:'72'},
                      {am:'$560.25',py:'City Utilities LLC',dt:'Check #1045 · Mar 15',st:'matched',sc:'97'},
                    ].map(r => (
                      <motion.div key={r.am} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}
                        className="flex items-center gap-2.5 bg-white rounded-[10px] px-3 py-2.5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                        <span className="text-[12px] font-bold text-[#1d1d1f] min-w-[72px]">{r.am}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-semibold text-[#334155] truncate">{r.py}</div>
                          <div className="text-[10px] text-[#94a3b8]">{r.dt}</div>
                        </div>
                        <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide',
                          r.st === 'approved' ? 'bg-violet-100 text-violet-700' :
                          r.st === 'matched' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-amber-100 text-amber-700'
                        )}>{r.st === 'approved' ? '✓ Approved' : r.st === 'matched' ? 'Matched' : 'Pending'}</span>
                        <span className={cn('text-[10px] font-bold min-w-[24px] text-right', Number(r.sc) >= 90 ? 'text-emerald-500' : 'text-amber-500')}>{r.sc}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ── Stats Bar ── */
function StatsBar() {
  const stats = [
    { value: 98, suffix: '%', label: 'Average match accuracy', color: 'text-emerald-400' },
    { value: 4, suffix: 'min', label: 'Average reconciliation time', color: 'text-emerald-400' },
    { value: 10, suffix: 'x', label: 'Faster than manual review', color: 'text-emerald-400' },
    { value: 0, suffix: '', label: 'Missed checks per month', color: 'text-emerald-400' },
  ];
  return (
    <section className="bg-[#1a1a2e] py-10 sm:py-12">
      <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-0 px-6">
        {stats.map((s, i) => (
          <FadeIn key={s.label} delay={i * 0.1}>
            <div className={cn('text-center', i < 3 && 'sm:border-r sm:border-white/[0.08]')}>
              <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-[-1.5px] mb-1">
                <span className={s.color}><NumberTicker value={s.value} /></span>{s.suffix}
              </div>
              <div className="text-[13px] text-white/45">{s.label}</div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

const firmLogos = ['Rodriguez & Associates','Thompson Tax Group','Pacific Bookkeeping','Summit Financial','Cascade Accounting','Pinnacle CPA Group','Harbor Tax Services','Evergreen Advisors','Atlas Bookkeeping','NorthStar Financial','Clearview Accounting','Redwood Tax Partners'];

function LogoMarquee() {
  return (
    <section className="py-10 sm:py-16 border-y border-gray-100 bg-gray-50/40">
      <FadeIn><p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 mb-6 sm:mb-8 px-4">Trusted by 500+ accounting firms worldwide</p></FadeIn>
      <Marquee pauseOnHover className="[--duration:35s]" gap="1rem">
        {firmLogos.map((name) => (
          <div key={name} className="flex items-center gap-2 px-4 sm:px-5 py-2 bg-white rounded-lg border border-gray-100 shadow-sm whitespace-nowrap">
            <div className="w-6 h-6 bg-gradient-to-br from-gray-200 to-gray-300 rounded-md flex items-center justify-center text-[8px] font-bold text-gray-500">{name.split(' ').map(w => w[0]).join('').slice(0, 2)}</div>
            <span className="text-xs sm:text-sm font-semibold text-gray-600">{name}</span>
          </div>
        ))}
      </Marquee>
    </section>
  );
}

function Features() {
  const features = [
    { icon: <Search className="w-5 h-5" />, title: 'AI Confidence Scoring', desc: 'Every match is scored by amount, check number, date, and payee — so you know exactly how confident the system is before you approve.', color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50' },
    { icon: <Zap className="w-5 h-5" />, title: 'One-Click Approval', desc: 'Approve a single check or bulk-approve an entire batch. Kyriq automatically sets ClearingStatus in QuickBooks.', color: 'from-indigo-500 to-violet-500', bg: 'bg-indigo-50' },
    { icon: <Users className="w-5 h-5" />, title: 'Multi-Company Support', desc: 'Switch between all your QuickBooks companies from one dashboard. Each company has its own token and reconciliation history.', color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50' },
    { icon: <Eye className="w-5 h-5" />, title: 'OCR Check Extraction', desc: 'Upload check images and Kyriq automatically extracts the check number, date, payee, and amount — even from handwritten amounts.', color: 'from-sky-500 to-sky-600', bg: 'bg-sky-50' },
    { icon: <Flag className="w-5 h-5" />, title: 'Flag & Resolve Discrepancies', desc: 'Flag suspicious matches with preset or custom reasons. Resolve with write-off, split, or remap options.', color: 'from-red-500 to-red-600', bg: 'bg-red-50' },
    { icon: <ClipboardCheck className="w-5 h-5" />, title: 'Full Audit Trail', desc: 'Every approval, flag, note, and remap is logged with a timestamp and user. Complete compliance for your review processes.', color: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50' },
  ];
  return (
    <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 bg-[#f5f5f7]">
      <div className="max-w-[1100px] mx-auto">
        <FadeIn>
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-[12px] font-bold tracking-[0.12em] uppercase text-indigo-500 mb-3 block">Features</span>
            <h2 className="text-3xl sm:text-4xl md:text-[52px] font-extrabold tracking-[-2px] leading-[1.08] text-[#1d1d1f] mb-5">Everything your team needs to reconcile faster</h2>
            <p className="text-[17px] text-[#6e6e73] max-w-[520px] mx-auto leading-relaxed">Built for accounting firms handling multiple QuickBooks companies at once.</p>
          </div>
        </FadeIn>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-[2px] rounded-[20px] overflow-hidden bg-gray-200/60">
          {features.map((f, i) => (
            <FadeIn key={f.title} delay={i * 0.08}>
              <motion.div whileHover={{ y: -2 }} className="bg-white p-8 sm:p-10 h-full transition-transform duration-200">
                <div className={cn('w-12 h-12 rounded-[14px] flex items-center justify-center text-white mb-5', `bg-gradient-to-br ${f.color}`)}>{f.icon}</div>
                <h3 className="text-[17px] font-bold tracking-[-0.3px] text-[#1d1d1f] mb-2.5">{f.title}</h3>
                <p className="text-[14px] text-[#6e6e73] leading-[1.65]">{f.desc}</p>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { num: 1, icon: <Upload className="w-6 h-6" />, title: 'Upload checks', desc: 'Drag and drop check images. OCR extracts all fields automatically.', color: 'from-indigo-500 to-violet-500' },
    { num: 2, icon: <ScanLine className="w-6 h-6" />, title: 'Kyriq matches', desc: 'AI compares your checks against live QuickBooks data with a confidence score per match.', color: 'from-violet-500 to-purple-500' },
    { num: 3, icon: <Check className="w-6 h-6" />, title: 'Review & approve', desc: 'Approve matches one by one or in bulk. Flag anything that looks off.', color: 'from-purple-500 to-indigo-500' },
    { num: 4, icon: <GitCompare className="w-6 h-6" />, title: 'Auto-cleared in QB', desc: 'Approved checks are automatically marked Cleared in QuickBooks — ready for reconciliation.', color: 'from-emerald-500 to-emerald-600' },
  ];
  return (
    <section id="how" className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="max-w-[1000px] mx-auto">
        <FadeIn>
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-[12px] font-bold tracking-[0.12em] uppercase text-indigo-500 mb-3 block">How it works</span>
            <h2 className="text-3xl sm:text-4xl md:text-[52px] font-extrabold tracking-[-2px] leading-[1.08] text-[#1d1d1f] mb-5">From check to cleared in 4 steps</h2>
            <p className="text-[17px] text-[#6e6e73] max-w-[520px] mx-auto leading-relaxed">No more manual cross-referencing. Kyriq does the matching — you just review and approve.</p>
          </div>
        </FadeIn>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 relative">
          <div className="hidden md:block absolute top-7 left-[12%] w-[76%] h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-30" />
          {steps.map((s, i) => (
            <FadeIn key={s.num} delay={i * 0.12}>
              <motion.div whileHover={{ y: -4 }} className="text-center relative">
                <div className={cn('w-14 h-14 rounded-full bg-gradient-to-br flex items-center justify-center text-white mx-auto mb-5 shadow-lg shadow-indigo-500/30 relative z-10', s.color)}>
                  <span className="text-[18px] font-extrabold">{s.num}</span>
                </div>
                <h3 className="text-[15px] font-bold tracking-[-0.3px] text-[#1d1d1f] mb-2">{s.title}</h3>
                <p className="text-[13px] text-[#6e6e73] leading-relaxed">{s.desc}</p>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Combined Carousel Section (Extension + Comparison) ── */
function CarouselSection() {
  const [activeSlide, setActiveSlide] = useState(0);
  
  const slides = [
    {
      id: 'extension',
      badge: 'Chrome Extension',
      badgeColor: 'text-emerald-400',
      title: 'Works right inside QuickBooks',
      desc: 'The Kyriq extension lives inside your QB tab — no switching apps, no copy-paste.',
      content: <ExtensionSlide />
    },
    {
      id: 'comparison',
      badge: 'Time Saving',
      badgeColor: 'text-indigo-400',
      title: 'Manual vs. Kyriq',
      desc: 'See how much time you\'re wasting on manual reconciliation.',
      content: <ComparisonSlide />
    }
  ];

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000); // Change slide every 6 seconds
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <section id="extension" className="py-16 sm:py-24 px-4 sm:px-6 bg-[#0f0f1a] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)' }} />
      <div className="max-w-[1000px] mx-auto relative">
        <FadeIn>
          <div className="text-center mb-12 sm:mb-16">
            <span className={cn('text-[12px] font-bold tracking-[0.12em] uppercase mb-3 block transition-colors duration-300', slides[activeSlide].badgeColor)}>{slides[activeSlide].badge}</span>
            <h2 className="text-3xl sm:text-4xl md:text-[52px] font-extrabold tracking-[-2px] leading-[1.08] text-white mb-5">{slides[activeSlide].title}</h2>
            <p className="text-[17px] text-white/50 max-w-[520px] mx-auto leading-relaxed">{slides[activeSlide].desc}</p>
          </div>
        </FadeIn>
        
        {/* Carousel Content */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              {slides[activeSlide].content}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Carousel Controls */}
        <div className="flex items-center justify-center gap-4 mt-10">
          <button
            onClick={() => setActiveSlide((activeSlide - 1 + slides.length) % slides.length)}
            className="w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/[0.15] flex items-center justify-center text-white transition-colors"
            aria-label="Previous slide"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className={cn('h-1.5 rounded-full transition-all duration-300', i === activeSlide ? 'w-8 bg-white' : 'w-1.5 bg-white/20')}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
          <button
            onClick={() => setActiveSlide((activeSlide + 1) % slides.length)}
            className="w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/[0.15] flex items-center justify-center text-white transition-colors"
            aria-label="Next slide"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
    </section>
  );
}

function ExtensionSlide() {
  const qboRows = [
    { am: '$2,450.00', name: 'Acme Supply Co.', date: 'Mar 12', badge: 'high', score: '98' },
    { am: '$870.50', name: 'Metro Office Solutions', date: 'Mar 13', badge: 'high', score: '94' },
    { am: '$3,100.00', name: 'Riverside Contractors', date: 'Mar 14', badge: 'med', score: '72' },
    { am: '$215.00', name: 'Office Depot', date: 'Mar 15', badge: '', score: '' },
    { am: '$560.25', name: 'City Utilities LLC', date: 'Mar 16', badge: 'high', score: '97' },
  ];
  const extCards = [
    { am: '$2,450.00', py: 'Acme Supply Co. · Check #1042', sc: '98', scColor: 'text-emerald-400', warn: false },
    { am: '$870.50', py: 'Metro Office Solutions · Check #1043', sc: '94', scColor: 'text-emerald-400', warn: false },
    { am: '$3,100.00', py: 'Riverside Contractors · Check #1044', sc: '72', scColor: 'text-amber-400', warn: true },
  ];
  
  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
      {/* QBO Mock */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.4)]">
        <div className="bg-[#2ca01c] px-4 py-2.5 flex items-center gap-2">
          <span className="text-[13px] font-bold text-white tracking-[-0.3px]">QuickBooks</span>
          <span className="text-[10px] text-white/60 ml-auto">Acme Corp</span>
        </div>
        <div className="px-3 py-2.5 bg-[#f8fafc] border-b border-gray-200 text-[11px] font-semibold text-[#475569]">Banking · For Review (24)</div>
        <div className="p-3 space-y-1">
          {qboRows.map((r, i) => (
            <div key={i} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-[12px] border transition-colors',
              r.badge === 'high' ? 'bg-emerald-50 border-emerald-200' :
              r.badge === 'med' ? 'bg-amber-50 border-amber-200' :
              'border-transparent hover:bg-gray-50'
            )}>
              <span className="font-bold text-[#1e293b] min-w-[72px]">{r.am}</span>
              <span className="flex-1 text-[#475569]">{r.name}</span>
              <span className="text-[11px] text-[#94a3b8]">{r.date}</span>
              {r.badge && (
                <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full text-white', r.badge === 'high' ? 'bg-emerald-500' : 'bg-amber-500')}>
                  kyriq {r.score}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Extension Sidebar */}
      <div className="bg-[#1e2235] rounded-2xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
        <div className="bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-3 flex items-center gap-2">
          <KyriqIconWhite size={22} />
          <span className="text-[14px] font-extrabold text-white tracking-[-0.4px]">kyriq</span>
          <span className="ml-auto bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">4 pending</span>
        </div>
        <div className="flex gap-1 px-3 pt-2.5">
          {['All','Pending','Matched'].map((t, i) => (
            <span key={t} className={cn('text-[10px] font-semibold px-2.5 py-1 rounded-t-md', i === 0 ? 'bg-white/[0.07] text-white' : 'text-white/40')}>{t}</span>
          ))}
        </div>
        <div className="p-2 space-y-1.5">
          {extCards.map((c, i) => (
            <div key={i} className={cn('bg-white/[0.06] rounded-[10px] p-3 border', c.warn ? 'border-amber-500/30' : 'border-white/[0.06]')}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] font-extrabold text-white tracking-[-0.5px]">{c.am}</span>
                <span className={cn('text-[10px] font-bold', c.scColor)}>{c.sc} {c.warn ? '⚠' : '✓'}</span>
              </div>
              <div className="text-[11px] text-white/60 mb-2">{c.py}</div>
              <div className="flex gap-1.5">
                <button className="text-[10px] font-semibold bg-emerald-500 text-white px-2.5 py-1 rounded-full">✓ Approve</button>
                <button className="text-[10px] font-semibold bg-white/[0.08] text-white/60 px-2.5 py-1 rounded-full">Flag</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ComparisonSlide() {
  const rows = [
    { task: 'Extract data from 100 checks', manual: '3-4 hours', cs: '45 seconds' },
    { task: 'Match checks to QuickBooks', manual: '2-3 hours', cs: 'Instant' },
    { task: 'Identify mismatches', manual: '1-2 hours', cs: 'Instant' },
    { task: 'Switch between companies', manual: 'Logout/Login', cs: 'One click' },
    { task: 'Generate reconciliation report', manual: '30-60 min', cs: 'One click' },
    { task: 'Detect duplicate entries', manual: 'Often missed', cs: 'Automatic' },
  ];
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur overflow-hidden">
        <div className="hidden sm:flex items-center py-4 px-4 sm:px-6 border-b border-white/[0.06]">
          <div className="flex-1 text-xs font-bold uppercase tracking-wider text-white/30">Task</div>
          <div className="w-28 sm:w-36 text-center text-xs font-bold uppercase tracking-wider text-white/20">Manual</div>
          <div className="w-28 sm:w-36 text-center text-xs font-bold uppercase tracking-wider text-indigo-400">Kyriq</div>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="border-b border-white/[0.03] last:border-0">
            <div className="hidden sm:flex items-center py-4 px-4 sm:px-6 hover:bg-white/[0.02] transition-colors">
              <div className="flex-1 text-sm text-white/60 font-medium">{r.task}</div>
              <div className="w-28 sm:w-36 text-center text-sm text-white/25 line-through decoration-white/10">{r.manual}</div>
              <div className="w-28 sm:w-36 text-center text-sm text-indigo-400 font-semibold">{r.cs}</div>
            </div>
            <div className="sm:hidden px-4 py-3 space-y-1.5">
              <div className="text-sm text-white/60 font-medium">{r.task}</div>
              <div className="flex justify-between text-xs"><span className="text-white/25 line-through">Manual: {r.manual}</span><span className="text-indigo-400 font-semibold">{r.cs}</span></div>
            </div>
          </div>
        ))}
        <div className="flex flex-col sm:flex-row items-start sm:items-center py-4 sm:py-5 px-4 sm:px-6 bg-white/[0.03]">
          <div className="flex-1 text-sm text-white font-bold mb-2 sm:mb-0">Total per 100 checks</div>
          <div className="flex gap-4 sm:gap-0"><div className="sm:w-28 md:w-36 text-center text-sm text-red-400 font-bold">6-9 hours</div><div className="sm:w-28 md:w-36 text-center text-sm sm:text-base text-emerald-400 font-extrabold">Under 2 min</div></div>
        </div>
      </div>
    </div>
  );
}

function Pricing() {
  const plans = [
    { tier: 'starter', displayName: 'Starter', price: 29, checks: '250 checks / month', popular: false, features: ['Unlimited QB companies','AI confidence matching','Chrome extension','Audit trail','Email support'] },
    { tier: 'growth', displayName: 'Growth', price: 59, checks: '750 checks / month', popular: true, features: ['Everything in Starter','Bulk approve & export','Client portal access','Priority support','Usage analytics'] },
    { tier: 'pro', displayName: 'Pro', price: 99, checks: '2,000 checks / month', popular: false, features: ['Everything in Growth','Custom integrations','Dedicated onboarding','SLA guarantee','White-label portal'] },
  ];
  return (
    <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6 bg-[#f5f5f7]">
      <div className="max-w-[900px] mx-auto">
        <FadeIn>
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-[12px] font-bold tracking-[0.12em] uppercase text-indigo-500 mb-3 block">Pricing</span>
            <h2 className="text-3xl sm:text-4xl md:text-[52px] font-extrabold tracking-[-2px] leading-[1.08] text-[#1d1d1f] mb-5">Pay for what you process</h2>
            <p className="text-[17px] text-[#6e6e73] max-w-[520px] mx-auto leading-relaxed">No per-client fees. No seat licenses. Just a simple per-check model that scales with your volume.</p>
          </div>
        </FadeIn>
        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((p, i) => (
            <FadeIn key={p.tier} delay={i * 0.12}>
              <motion.div whileHover={{ y: -4, boxShadow: '0 16px 48px rgba(0,0,0,0.1)' }} className={cn('relative rounded-[20px] p-8 sm:p-9 transition-all duration-300 h-full flex flex-col', p.popular ? 'bg-[#1a1a2e] text-white border-transparent shadow-[0_8px_40px_rgba(99,102,241,0.3)]' : 'bg-white border-[1.5px] border-gray-100')}>
                {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1 rounded-full">Most Popular</div>}
                <div className={cn('text-[12px] font-bold tracking-[0.1em] uppercase mb-2', p.popular ? 'text-white/50' : 'text-indigo-500')}>{p.displayName}</div>
                <div className={cn('text-[44px] font-extrabold tracking-[-2px] leading-none mb-1', p.popular ? 'text-white' : 'text-[#1d1d1f]')}><sup className="text-[20px] font-bold tracking-[-0.5px] align-super">$</sup>{p.price}</div>
                <div className={cn('text-[13px] mb-2', p.popular ? 'text-white/35' : 'text-[#a1a1a6]')}>per month</div>
                <div className={cn('text-[12px] font-semibold mb-6 pb-6 border-b', p.popular ? 'text-emerald-400 border-white/10' : 'text-emerald-500 border-gray-100')}>{p.checks}</div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className={cn('flex items-center gap-2.5 text-[13px]', p.popular ? 'text-white/65' : 'text-[#6e6e73]')}>
                      <span className={cn('w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0', p.popular ? 'bg-white/10' : 'bg-indigo-50')}>
                        <Check size={10} className={p.popular ? 'text-emerald-400' : 'text-indigo-500'} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={`/signup?plan=${p.tier}`} className={cn('block w-full py-3.5 rounded-full text-center text-[14px] font-semibold transition-all', p.popular ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/40 hover:-translate-y-0.5 hover:shadow-indigo-500/50' : 'border-[1.5px] border-gray-200 text-[#1d1d1f] hover:border-indigo-500 hover:text-indigo-500')}>
                  Get started
                </Link>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ text, name, role, initials }: { text: string; name: string; role: string; initials: string }) {
  return (
    <div className="w-[280px] sm:w-[360px] bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex gap-0.5 text-amber-400 mb-3">{[...Array(5)].map((_, j) => <Star key={j} size={14} fill="currentColor" />)}</div>
      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-5">&ldquo;{text}&rdquo;</p>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold">{initials}</div>
        <div><div className="text-xs sm:text-sm font-bold text-gray-900">{name}</div><div className="text-[10px] sm:text-xs text-gray-400">{role}</div></div>
      </div>
    </div>
  );
}

function Testimonials() {
  const testimonials = [
    { text: 'We used to spend 8 hours a week reconciling checks for our farm service clients. Kyriq cut that down to 20 minutes.', name: 'Maria Rodriguez', role: 'CPA, Rodriguez & Associates', initials: 'MR' },
    { text: 'The QuickBooks integration is seamless. We manage 30+ companies and can switch between them instantly.', name: 'James Thompson', role: 'Partner, Thompson Tax Group', initials: 'JT' },
    { text: 'The fuzzy name matching saved us from so many false mismatches. It knows that "FERNANDO L ORTEGA" and "FERNANDO LOPEZ ORTEGA" are the same person.', name: 'Sarah Kim', role: 'Staff Accountant, Pacific Bookkeeping', initials: 'SK' },
    { text: 'Our tax season went from chaos to calm. We process 2,000+ checks per month now with zero errors. The ROI was obvious within the first week.', name: 'David Chen', role: 'Managing Partner, Chen & Associates', initials: 'DC' },
    { text: 'The Chrome extension is a game-changer. We can reconcile checks right inside QuickBooks Online without switching tabs.', name: 'Lisa Patel', role: 'Senior Accountant, Patel Tax Services', initials: 'LP' },
    { text: 'Customer support is amazing. They helped us migrate in one afternoon. The duplicate detection alone saves us hours every week.', name: 'Robert Nakamura', role: 'Controller, Cascade Financial', initials: 'RN' },
  ];
  return (
    <section className="py-16 sm:py-24 overflow-hidden">
      <FadeIn><div className="text-center mb-10 sm:mb-14 px-4">
        <span className="text-[12px] font-bold tracking-[0.12em] uppercase text-indigo-500 mb-3 block">Testimonials</span>
        <h2 className="text-3xl sm:text-4xl md:text-[52px] font-extrabold tracking-[-2px] leading-[1.08] text-[#1d1d1f] mb-5">Trusted by firms like yours</h2>
        <p className="text-[17px] text-[#6e6e73] max-w-[520px] mx-auto leading-relaxed">See why accounting professionals are switching to Kyriq.</p>
      </div></FadeIn>
      <Marquee pauseOnHover className="[--duration:30s] mb-4" gap="1rem">
        {testimonials.slice(0, 3).map((t) => <TestimonialCard key={t.name} {...t} />)}
      </Marquee>
      <Marquee pauseOnHover reverse className="[--duration:30s]" gap="1rem">
        {testimonials.slice(3).map((t) => <TestimonialCard key={t.name} {...t} />)}
      </Marquee>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6">
      <FadeIn>
        <div className="max-w-4xl mx-auto relative rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-br from-[#1a1a2e] via-[#1e2040] to-[#0f1a2e] p-8 sm:p-12 md:p-16 text-center relative">
            <div className="absolute top-[-80px] right-[-80px] w-[300px] h-[300px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)' }} />
            <div className="absolute bottom-[-60px] left-[-60px] w-[250px] h-[250px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)' }} />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-[-1.5px] mb-4">Ready to automate your reconciliation?</h2>
              <p className="text-sm sm:text-lg text-white/50 mb-8 max-w-xl mx-auto">Join hundreds of accounting firms saving 15+ hours per week. Start your free trial today.</p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Link href="/signup" className="px-7 sm:px-8 py-3.5 text-[15px] font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                  Start free trial <ArrowRight size={16} />
                </Link>
                <Link href="/login" className="px-7 sm:px-8 py-3.5 text-[15px] font-medium text-white border-[1.5px] border-white/15 rounded-full hover:border-white/30 transition-all flex items-center justify-center gap-2">Sign in</Link>
              </div>
            </div>
          </div>
          <BorderBeam size={250} duration={10} colorFrom="#6366f1" colorTo="#10b981" />
        </div>
      </FadeIn>
    </section>
  );
}

function Footer() {
  const footerCols: Record<string, { label: string; href: string }[]> = {
    Product: [{ label: 'Features', href: '#features' },{ label: 'How it works', href: '#how' },{ label: 'Chrome Extension', href: '#extension' },{ label: 'Pricing', href: '#pricing' }],
    Company: [{ label: 'About', href: '#' },{ label: 'Blog', href: '#' },{ label: 'Contact', href: '#' }],
    Legal: [{ label: 'Privacy Policy', href: '/privacy' },{ label: 'Terms of Service', href: '/terms' },{ label: 'Security', href: '#' }],
  };
  return (
    <footer className="bg-[#0f0f1a] px-6 sm:px-12">
      <div className="max-w-7xl mx-auto pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-[260px_1fr_1fr_1fr] gap-8 sm:gap-12 pb-12 border-b border-white/[0.06]">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <KyriqIconWhite size={32} />
              <span className="text-[18px] font-extrabold text-white tracking-[-0.7px]">kyriq</span>
            </div>
            <p className="text-[13px] text-white/35 leading-[1.65]">QuickBooks check reconciliation, automated for modern accounting firms.</p>
          </div>
          {Object.entries(footerCols).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/40 mb-4">{title}</h4>
              <div className="space-y-2.5">{links.map((l) => (<a key={l.label} href={l.href} className="block text-[13px] text-white/50 hover:text-white/85 transition-colors">{l.label}</a>))}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row justify-between gap-2 pt-8 text-[12px] text-white/25">
          <span>&copy; 2026 Kyriq. All rights reserved.</span>
          <div className="flex gap-5">
            <a href="/privacy" className="hover:text-white/50 transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-white/50 transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      <Nav />
      <Hero />
      <StatsBar />
      <LogoMarquee />
      <Features />
      <HowItWorks />
      <CarouselSection />
      <Pricing />
      <Testimonials />
      <CTASection />
      <Footer />
    </div>
  );
}
