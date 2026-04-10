//use client       
    import AuthForm from '@/features/auth/AuthForm';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Sign in or create your account
          </h1>
          <p className="mt-4 text-slate-600">
            Access your workspace and continue building organized boards, snippets, and tasks.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="text-sm font-semibold text-slate-500 transition hover:text-slate-900"
            >
              ← Back to Snypp homepage
            </Link>
          </div>
        </div>

        <AuthForm />
      </div>
    </main>
  );
}
