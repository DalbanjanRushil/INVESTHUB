import Link from "next/link";
import { BarChart2, ShieldCheck, TrendingUp, Lock, Zap } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import HeroActions from "@/components/landing/HeroActions";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0B1120] text-white overflow-x-hidden font-sans selection:bg-emerald-500/30">

      {/* Navigation */}
      <nav className="fixed w-full z-50 top-0 left-0 border-b border-white/5 bg-[#0B1120]/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between relative">

          {/* Brand (Left) */}
          <div className="flex items-center gap-2">
            <Logo size="md" />
            <span className="text-xl font-bold tracking-tight text-white">InvestHub</span>
          </div>

          {/* Information (Center) */}
          <div className="hidden md:flex items-center gap-10 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Link href="/about" className="text-sm font-medium text-slate-400 hover:text-white transition-all duration-300 relative group">
              About
              <span className="absolute -bottom-1 left-1/2 w-0 h-px bg-emerald-500 group-hover:w-full group-hover:left-0 transition-all duration-300 shadow-lg shadow-emerald-500/50"></span>
            </Link>
            <Link href="/strategies" className="text-sm font-medium text-slate-400 hover:text-white transition-all duration-300 relative group">
              Strategies
              <span className="absolute -bottom-1 left-1/2 w-0 h-px bg-emerald-500 group-hover:w-full group-hover:left-0 transition-all duration-300 shadow-lg shadow-emerald-500/50"></span>
            </Link>
            <Link href="/contact" className="text-sm font-medium text-slate-400 hover:text-white transition-all duration-300 relative group">
              Contact
              <span className="absolute -bottom-1 left-1/2 w-0 h-px bg-emerald-500 group-hover:w-full group-hover:left-0 transition-all duration-300 shadow-lg shadow-emerald-500/50"></span>
            </Link>
          </div>

          {/* Action (Right) */}
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-full shadow-lg shadow-emerald-500/30 transition-all transform hover:scale-105">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-20">
        {/* HERO SECTION */}
        <section className="relative w-full min-h-[90vh] flex items-center justify-center overflow-hidden">

          {/* Background Effects */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            {/* Top Left Blob */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
            {/* Bottom Right Blob */}
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-500/20 rounded-full mix-blend-screen filter blur-[120px] animate-bounce-slow"></div>
            {/* Center Glow */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,#0B1120_70%)]"></div>

            {/* Grid Overlay */}
            <div className="absolute inset-0 opacity-[0.05]"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='currentColor' stroke-width='0.5'/%3E%3C/svg%3E")` }}>
            </div>
          </div>

          <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className="text-emerald-400 text-sm font-medium tracking-wide flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                The Future of Simulation Investing
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-8 leading-tight animate-in fade-in slide-in-from-bottom-8 duration-1000">
              Grow Your Wealth in <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-cyan-300 to-emerald-500">Real-Time Logic.</span>
            </h1>

            {/* Subtext */}
            <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
              Experience dynamic market mechanics, compound interest simulations, and instant analytics with InvestHub's premium dashboard.
            </p>

            {/* CTA Buttons */}
            {/* CTA Buttons */}
            <HeroActions />

            {/* Stats strip */}
            <div className="mt-20 pt-10 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              {[
                { label: "Active Users", value: "2.4k+" },
                { label: "Total Volume", value: "$4.2M" },
                { label: "Uptime", value: "99.9%" },
                { label: "Security", value: "AES-256" }
              ].map((stat, i) => (
                <div key={i}>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-slate-500 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section className="relative py-32 bg-[#0B1120] overflow-hidden">
          {/* Noise Texture */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
          </div>

          <div className="relative z-10 container mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-3">Why InvestHub?</h2>
              <h3 className="text-3xl md:text-5xl font-bold text-white">Advanced Financial Simulation</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="group p-8 rounded-3xl bg-[#1E293B]/50 border border-white/10 hover:border-emerald-500/50 hover:bg-[#1E293B] transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 relative">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <Zap className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Real-Time Sockets</h3>
                <p className="text-slate-400 leading-relaxed">
                  Monitor your simulated growth curve with millisecond-precision socket updates directly from the admin control center.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="group p-8 rounded-3xl bg-[#1E293B]/50 border border-white/10 hover:border-cyan-500/50 hover:bg-[#1E293B] transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 relative">
                <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6 text-cyan-500 group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                  <TrendingUp className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Compound Logic</h3>
                <p className="text-slate-400 leading-relaxed">
                  Advanced algorithms handle daily compound interest calculations with configurable payout preferences.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="group p-8 rounded-3xl bg-[#1E293B]/50 border border-white/10 hover:border-emerald-500/50 hover:bg-[#1E293B] transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 relative">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <Lock className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Secure & Role-Based</h3>
                <p className="text-slate-400 leading-relaxed">
                  Strict separation of concerns between Admin and User scopes with JWT authentication and middleware protection.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="relative bg-[#0B1120] pt-20 pb-10 border-t border-white/5">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Logo size="sm" />
            <span className="text-lg font-bold text-white">InvestHub</span>
          </div>
          <p className="text-slate-400 text-sm mb-8 max-w-md mx-auto">
            A next-generation simulation platform for financial literacy and portfolio management testing.
          </p>
          <div className="flex justify-center gap-8 text-slate-400 text-sm font-medium">
            <Link href="#" className="hover:text-emerald-500 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-emerald-500 transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-emerald-500 transition-colors">Documentation</Link>
          </div>
          <p className="text-slate-500 text-xs mt-12">&copy; {new Date().getFullYear()} InvestHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
