// components/Navbar.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Logo from './Logo';

export default function Navbar() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Menu states
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    // The channel is created inside an async init, so the cleanup must come
    // from the effect itself — a return value inside initNav is discarded.
    const initNav = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) return null;

      setCurrentUser(user);
      fetchNotifications(user.id);

      // Sync auth avatar (e.g. Google OAuth) → profiles table so team icons match
      const metaAvatar = user.user_metadata?.avatar_url;
      if (metaAvatar) {
        const { data: profile } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).single();
        if (profile && profile.avatar_url !== metaAvatar) {
          await supabase.from('profiles').update({ avatar_url: metaAvatar }).eq('id', user.id);
        }
      }

      return supabase.channel(`nav-notifications-${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
          fetchNotifications(user.id);
        }).subscribe();
    };
    const channelPromise = initNav();

    return () => {
      channelPromise.then(channel => {
        if (channel) supabase.removeChannel(channel);
      });
    };
  }, []);

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

  return (
    <nav className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 border-b border-slate-200 bg-white text-slate-900 h-14 sm:h-16 relative z-50">
      
      {/* 1. Adjusted Logo Section for Mobile */}
      <div className="flex items-center gap-2 sm:gap-6 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Logo className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" />
          <span className="text-lg sm:text-xl font-extrabold tracking-tight hidden sm:block">Snypp</span>
        </Link>
      </div>
      
      {/* 2. Adjusted Right Side Gaps for Mobile */}
      <div className="flex items-center gap-3 sm:gap-5">
        
        {/* Hide Workspaces text on small phones to save space */}
        <Link href="/dashboard" className="hidden sm:block text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
          Workspaces
        </Link>
        
        {/* NOTIFICATION BELL */}
        <div className="relative">
          <button 
            onClick={() => { setShowNotifMenu(!showNotifMenu); setShowProfileMenu(false); }}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors relative outline-none"
          >
            <span className="text-base sm:text-lg">🔔</span>
            {notifications.length > 0 && (
              <span className="absolute top-0 right-0 sm:top-1 sm:right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm animate-pulse"></span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col origin-top-right animate-in fade-in zoom-in-95">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Notifications</span>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{notifications.length} New</span>
              </div>
              <div className="max-h-[20rem] sm:max-h-[24rem] overflow-y-auto flex flex-col">
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
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs cursor-pointer transition-colors shadow-sm uppercase outline-none overflow-hidden shrink-0 ${showProfileMenu ? 'ring-2 ring-blue-500 border-transparent bg-slate-100' : 'bg-slate-100 text-slate-600 border border-slate-300 hover:border-blue-500'}`}
          >
            {currentUser?.user_metadata?.avatar_url ? (
              <img 
                src={currentUser.user_metadata.avatar_url} 
                alt="Profile" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-bold">
                {currentUser?.email?.substring(0, 2) || 'ME'}
              </div>
            )}
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col origin-top-right animate-in fade-in zoom-in-95">
              
              {/* Profile Header */}
              <div className="px-4 py-4 border-b border-slate-100 bg-slate-50/50">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Signed in as</p>
                <p className="text-sm font-bold text-slate-900 truncate" title={currentUser?.email}>{currentUser?.email}</p>
              </div>

              {/* Menu Links */}
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