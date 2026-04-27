// components/Navbar.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Logo from './Logo';

export default function Navbar() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null); // NEW: State for the public profile
  const [notifications, setNotifications] = useState<any[]>([]);
  
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const initNav = async () => {
      await supabase.auth.refreshSession();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setCurrentUser(user);
        fetchUserProfile(user.id); // Fetch the profile to match the boards!
        fetchNotifications(user.id);

        const channel = supabase.channel(`nav-notifications-${user.id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
            fetchNotifications(user.id);
          })
          // Also listen to the profiles table so the navbar instantly updates if you change it in settings!
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, () => {
            fetchUserProfile(user.id);
          }).subscribe();

        return () => { supabase.removeChannel(channel); };
      }
    };
    initNav();

    // Listen for Auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        fetchUserProfile(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setUserProfile(data);
  };

  const fetchNotifications = async (userId: string) => {
    const { data } = await supabase
      .from('notifications')
      .select('*, sender:sender_id(email), board:board_id(title)')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });
    if (data) setNotifications(data);
  };

  const handleAccept = async (notification: any) => {
    await supabase.from('board_members').update({ status: 'accepted' }).eq('board_id', notification.board_id).eq('user_id', currentUser.id);
    await supabase.from('notifications').update({ is_read: true }).eq('id', notification.id);
    setShowNotifMenu(false);
    window.location.href = '/dashboard';
  };

  const handleDecline = async (notification: any) => {
    await supabase.from('board_members').delete().eq('board_id', notification.board_id).eq('user_id', currentUser.id);
    await supabase.from('notifications').update({ is_read: true }).eq('id', notification.id);
    setNotifications(prev => prev.filter(n => n.id !== notification.id));
  };

  const handleDismiss = async (notificationId: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/'; 
  };

  // The email initial to use as a fallback
  const fallbackInitial = userProfile?.email?.charAt(0) || currentUser?.email?.charAt(0) || 'M';

  return (
    <nav className="flex items-center justify-between px-8 py-4 border-b border-slate-200 bg-white text-slate-900 h-16 relative z-50">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Logo className="w-8 h-8" />
          <span className="text-xl font-extrabold tracking-tight">Snypp</span>
        </Link>
      </div>
      
      <div className="flex items-center gap-5">
        <Link href="/dashboard" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Workspaces</Link>
        
        {/* NOTIFICATION BELL */}
        <div className="relative">
          <button 
            onClick={() => { setShowNotifMenu(!showNotifMenu); setShowProfileMenu(false); }}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors relative outline-none"
          >
            <span className="text-lg">🔔</span>
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm animate-pulse"></span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col origin-top-right animate-in fade-in zoom-in-95">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Notifications</span>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{notifications.length} New</span>
              </div>
              <div className="max-h-[24rem] overflow-y-auto flex flex-col">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm font-medium text-slate-400 italic">No new notifications.</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex flex-col gap-3">
                      <div className="text-sm text-slate-700 leading-snug">
                        <span className="font-bold text-slate-900">{n.sender?.email?.split('@')[0]}</span> {n.content} <span className="font-bold text-slate-900">{n.board?.title}</span>.
                      </div>
                      {n.type === 'invite' ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleAccept(n)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg transition-colors shadow-sm">Accept</button>
                          <button onClick={() => handleDecline(n)} className="flex-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold py-2 rounded-lg transition-colors">Decline</button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => handleDismiss(n.id)} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 rounded-lg transition-colors">Dismiss</button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* --- PROFILE MENU --- */}
        <div className="relative">
          <button 
            onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifMenu(false); }}
            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs cursor-pointer transition-colors shadow-sm uppercase outline-none overflow-hidden shrink-0 relative ${showProfileMenu ? 'ring-2 ring-blue-500 border-transparent bg-slate-100' : 'bg-slate-100 text-slate-600 border border-slate-300 hover:border-blue-500'}`}
          >
            {/* 1. Bulletproof Background Text (Always there) */}
            <span className="absolute inset-0 flex items-center justify-center bg-slate-100">
              {fallbackInitial}
            </span>

            {/* 2. Public Profile Avatar (Only shows if valid) */}
            {userProfile?.avatar_url && userProfile.avatar_url.startsWith('http') && (
              <img 
                src={userProfile.avatar_url} 
                alt="Profile" 
                className="absolute inset-0 w-full h-full object-cover z-10 bg-white" 
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col origin-top-right animate-in fade-in zoom-in-95">
              <div className="px-4 py-4 border-b border-slate-100 bg-slate-50/50">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Signed in as</p>
                <p className="text-sm font-bold text-slate-900 truncate" title={currentUser?.email}>{currentUser?.email}</p>
              </div>
              <div className="p-2">
                <Link 
                  href="/dashboard/settings" 
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-700 transition-colors"
                >
                  <span className="text-slate-400">⚙️</span> Account Settings
                </Link>
                <div className="h-px bg-slate-100 my-1 mx-2"></div>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 rounded-xl text-sm font-bold text-red-600 transition-colors outline-none"
                >
                  <span className="text-red-400">🚪</span> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}