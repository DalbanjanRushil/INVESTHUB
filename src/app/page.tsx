import Link from "next/link";
import { ArrowRight, BarChart2, ShieldCheck, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <BarChart2 className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight">InvestHub</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/signin"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="hidden sm:flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg hover:shadow-primary/25"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 lg:py-32">
          {/* Background Elements */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,var(--primary)/0.1,transparent)]" />
          <div className="absolute top-0 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />

          <div className="container mx-auto px-4 text-center sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl space-y-8">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                Smart Investing for the <br />
                <span className="gradient-text">Academic Future</span>
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
                Experience a state-of-the-art simulation of profit distribution and portfolio management.
                Learn, track, and analyze financial flows in a risk-free environment.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Link
                  href="/register"
                  className="flex h-12 items-center justify-center rounded-full bg-primary px-8 text-base font-medium text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all hover:scale-105"
                >
                  Start Simulation
                </Link>
                <Link
                  href="/auth/signin"
                  className="flex h-12 items-center justify-center rounded-full border border-input bg-background px-8 text-base font-medium hover:bg-accent hover:text-accent-foreground transition-all"
                >
                  View Demo
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-muted/30 border-y border-border/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="glass-card p-8 rounded-2xl space-y-4 hover:border-primary/50 transition-colors bg-card/50">
                <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold">Secure Simulation</h3>
                <p className="text-muted-foreground">
                  Educational sandbox environment ensuring safe learning without real financial risk.
                </p>
              </div>

              <div className="glass-card p-8 rounded-2xl space-y-4 hover:border-purple-500/50 transition-colors bg-card/50">
                <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <BarChart2 className="h-6 w-6 text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold">Real-time Analytics</h3>
                <p className="text-muted-foreground">
                  Track performance, calculate profit shares, and visualize growth with precision.
                </p>
              </div>

              <div className="glass-card p-8 rounded-2xl space-y-4 hover:border-green-500/50 transition-colors bg-card/50">
                <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold">Community Driven</h3>
                <p className="text-muted-foreground">
                  Collaborative platform designed for admin oversight and user transparency.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background py-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} InvestHub. All rights reserved.</p>
          <p className="mt-2 text-xs">For educational and simulation purposes only.</p>
        </div>
      </footer>
    </div>
  );
}
