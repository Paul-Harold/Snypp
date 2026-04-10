// app/page.tsx
import Link from 'next/link';
import Logo from '@/components/Logo';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-200">
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10" />
          <span className="text-2xl font-extrabold tracking-tight">Snypp</span>
        </div>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="px-5 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm active:scale-95"
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 pt-20 pb-32 flex flex-col items-center text-center">
        <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-extrabold uppercase tracking-widest">
          Snypp 1.0 is Live 🚀
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 max-w-4xl leading-tight mb-8 drop-shadow-sm">
          Organize everything{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            in one place
          </span>
        </h1>

        <p className="text-xl text-slate-500 font-medium max-w-2xl mb-12 leading-relaxed">
          Tasks, notes, ideas, snippets —everything stays clear, structured, and easy to manage.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/login"
            className="px-8 py-4 text-lg font-bold bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95"
          >
            Start Building Now
          </Link>
          <a
            href="#features"
            className="px-8 py-4 text-lg font-bold bg-white text-slate-700 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            See Features
          </a>
        </div>

      </main>

      <section id="features" className="bg-white border-t border-slate-100 py-24">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">One place for your workload, personal notes, ideas, and everything in between.</h2>
            <p className="text-slate-500 font-medium max-w-2xl mx-auto">No clutter, no steep learning curve. Just the tools your team needs to get work done.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-2xl mb-6">⚡</div>
              <h3 className="text-xl font-bold mb-2">Real-Time Sync</h3>
              <p className="text-slate-500 font-medium">Watch cards move across the board instantly. No refreshing required when your team updates a task.</p>
            </div>
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center text-2xl mb-6">🔒</div>
              <h3 className="text-xl font-bold mb-2">Bulletproof Security</h3>
              <p className="text-slate-500 font-medium">Strict Role-Based Access Control means viewers can only view, and only owners can manage the workspace.</p>
            </div>
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-2xl mb-6">👥</div>
              <h3 className="text-xl font-bold mb-2">Collaboration</h3>
              <p className="text-slate-500 font-medium">Streamline your team workflow. Receive immediate alerts when invited to boards, assigned tasks, or when card statuses change.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-400 py-12 text-center">
        <div className="flex items-center justify-center gap-2 mb-4 opacity-50 grayscale">
          <Logo className="w-6 h-6" />
          <span className="text-lg font-bold text-white">Snypp</span>
        </div>
        <p className="text-sm font-medium">© {new Date().getFullYear()} Snypp. Built for productivity.</p>
      </footer>
    </div>
  );
}