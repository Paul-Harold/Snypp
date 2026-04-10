// features/auth/AuthForm.tsx
'use client';
import Logo from '@/components/Logo';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [errorMessage, setErrorMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const router = useRouter();

  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setErrorMessage('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address.');
      isValid = false;
    }

    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      isValid = false;
    }

    if (isSignUp && password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      isValid = false;
    }

    return isValid;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return; 

    setIsLoading(true);

    const { error } = isSignUp 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMessage(error.message);
    } else {
      if (isSignUp) {
        alert('Success! Check your email to confirm your account.');
        setIsSignUp(false); 
        setPassword('');
        setConfirmPassword('');
      } else {
        router.push('/dashboard'); 
      }
    }
    
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage('');
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mt-20 p-8 rounded-[32px] shadow-2xl bg-white border border-slate-100 text-slate-900 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="text-center mb-8">
      <div className="flex justify-center mb-4">
        <Logo className="w-20 h-20" />
      </div>
      <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
        {isSignUp ? 'Create an account' : 'Welcome back'}
      </h2>
        <p className="text-slate-500 font-medium mt-2 text-sm">
          {isSignUp ? 'Join Snypp to manage your workspaces' : 'Enter your details to access your workspaces'}
        </p>
      </div>

      <button 
        onClick={handleGoogleLogin}
        disabled={isLoading}
        type="button"
        className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 text-slate-700 p-3.5 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all font-bold disabled:opacity-50 active:scale-[0.98]"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </button>

      <div className="relative flex items-center py-6">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">Or continue with email</span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>

      <form onSubmit={handleEmailAuth} className="flex flex-col gap-4" noValidate>
        {/* EMAIL INPUT */}
        <div>
          <label htmlFor="email" className="block text-xs font-bold text-slate-700 mb-1 ml-1 uppercase tracking-wider">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={`w-full px-4 py-3 bg-slate-50 border ${emailError ? 'border-red-400 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'} rounded-xl outline-none focus:ring-2 focus:bg-white transition-all font-medium placeholder-slate-400 text-slate-900`}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError('');
            }}
          />
          {emailError && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{emailError}</p>}
        </div>
        
        {/* PASSWORD INPUT */}
        <div>
          <label htmlFor="password" className="block text-xs font-bold text-slate-700 mb-1 ml-1 uppercase tracking-wider">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            placeholder="••••••••"
            className={`w-full px-4 py-3 bg-slate-50 border ${passwordError ? 'border-red-400 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'} rounded-xl outline-none focus:ring-2 focus:bg-white transition-all font-medium placeholder-slate-400 text-slate-900`}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError('');
            }}
          />
          {passwordError && passwordError !== 'Passwords do not match.' && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{passwordError}</p>}
        </div>

        {/* CONFIRM PASSWORD (ONLY ON SIGN UP) */}
        {isSignUp && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <label htmlFor="confirmPassword" className="block text-xs font-bold text-slate-700 mb-1 ml-1 uppercase tracking-wider">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className={`w-full px-4 py-3 bg-slate-50 border ${passwordError === 'Passwords do not match.' ? 'border-red-400 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'} rounded-xl outline-none focus:ring-2 focus:bg-white transition-all font-medium placeholder-slate-400 text-slate-900`}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (passwordError) setPasswordError('');
              }}
            />
            {passwordError === 'Passwords do not match.' && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{passwordError}</p>}
          </div>
        )}

        {/* SUPABASE API ERRORS */}
        {errorMessage && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100 flex items-start gap-2 mt-2">
            <span className="text-red-500 font-bold">!</span> {errorMessage}
          </div>
        )}

        <button 
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white p-3.5 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20 mt-2 active:scale-[0.98]"
        >
          {isLoading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
        </button>
      </form>
      
      <div className="mt-8 text-center">
        <button 
          onClick={() => {
            setIsSignUp(!isSignUp);
            setErrorMessage('');
            setEmailError('');
            setPasswordError('');
            setPassword('');
            setConfirmPassword('');
          }}
          disabled={isLoading}
          type="button"
          className="text-slate-500 hover:text-blue-600 text-sm font-bold transition-colors outline-none"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}