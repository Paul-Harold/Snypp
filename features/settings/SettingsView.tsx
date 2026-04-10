// features/settings/SettingsView.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function SettingsView() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      
      if (user) {
        setEmail(user.email || '');
      }
    };
    getUser();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 6) {
      return setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
    }
    if (newPassword !== confirmPassword) {
      return setMessage({ type: 'error', text: 'Passwords do not match.' });
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setNewPassword('');
      setConfirmPassword('');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 p-8 flex justify-center items-start">
      <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-2 mb-4">
            <span className="text-lg leading-none">←</span> Back to Workspaces
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Account Settings</h1>
          <p className="text-slate-500 font-medium mt-1">Manage your profile and security preferences.</p>
        </div>

        {/* Global Messages */}
        {message && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-bold border flex items-center gap-2 ${message.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
            <span>{message.type === 'error' ? '!' : '✓'}</span> {message.text}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-8 mb-8">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Profile Information</h3>
          
          <div className="flex items-center gap-6">
            
            {/* Simple static initial box restored */}
            <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl uppercase shadow-inner">
              {email ? email.substring(0, 2) : 'ME'}
            </div>

            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-700 mb-1 ml-1 uppercase tracking-wider">Email Address</label>
              <input 
                type="text" 
                disabled 
                value={email || 'Loading...'} 
                className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed"
              />
              <p className="text-xs text-slate-400 mt-2 font-medium ml-1">
                To change your email address, please contact support.
              </p>
            </div>
          </div>
        </div>

        {/* Security / Password Card */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-8">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Security</h3>
          
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 ml-1 uppercase tracking-wider">New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium placeholder-slate-400 text-slate-900"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 ml-1 uppercase tracking-wider">Confirm New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium placeholder-slate-400 text-slate-900"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading || !newPassword || !confirmPassword}
              className="mt-4 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-[0.98] outline-none"
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}