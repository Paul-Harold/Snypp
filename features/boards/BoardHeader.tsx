// features/boards/BoardHeader.tsx
import Link from 'next/link';
import { useState } from 'react';

// Define the props we need from the parent
interface BoardHeaderProps {
  boardTitle: string;
  boardBg: string;
  currentUserRole: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterLabel: string | null;
  setFilterLabel: (l: string | null) => void;
  members: any[];
  currentUserId: string | null;
  canManageBoard: boolean;
  inviteEmail: string;
  setInviteEmail: (e: string) => void;
  inviteRole: string;
  setInviteRole: (r: string) => void;
  handleInvite: () => void;
  handleUpdateMemberRole: (uid: string, role: string) => void;
  handleRemoveMember: (uid: string) => void;
  handleUpdateBackground: (css: string) => void;
  handleLeaveBoard: () => void; // <-- NEW PROP HERE
  BACKGROUND_OPTIONS: any[];
  ALL_LABELS: string[];
}

export default function BoardHeader({
  boardTitle, boardBg, currentUserRole, searchQuery, setSearchQuery, filterLabel, setFilterLabel,
  members, currentUserId, canManageBoard, inviteEmail, setInviteEmail, inviteRole, setInviteRole,
  handleInvite, handleUpdateMemberRole, handleRemoveMember, handleUpdateBackground, handleLeaveBoard, BACKGROUND_OPTIONS, ALL_LABELS
}: BoardHeaderProps) {
  
  // Local UI state (dropdowns)
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showTeamMenu, setShowTeamMenu] = useState(false);

  const isDarkBg = boardBg !== 'bg-slate-50';
  const glassPanelClass = isDarkBg ? 'bg-black/20 border-white/10 backdrop-blur-md' : 'bg-white border-slate-200 shadow-sm';

  return (
    <div className="flex flex-col mb-8 gap-4">
      <Link href="/dashboard" className={`flex items-center gap-2 text-sm font-bold w-fit hover:opacity-70 transition-opacity ${isDarkBg ? 'text-white/80' : 'text-slate-500'}`}>
        <span className="text-lg leading-none">←</span> Back to Workspaces
      </Link>

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-extrabold tracking-tight drop-shadow-sm">{boardTitle || 'Loading...'}</h2>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isDarkBg ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {currentUserRole}
          </span>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${glassPanelClass} focus-within:ring-2 focus-within:ring-blue-500`}>
            <span className="text-sm opacity-60">🔍</span>
            <input type="text" placeholder="Search cards..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`bg-transparent outline-none text-sm w-32 md:w-40 transition-all font-medium ${isDarkBg ? 'text-white placeholder-white/50' : 'text-slate-900'}`} />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="opacity-50 hover:opacity-100 text-sm outline-none">✕</button>}
          </div>

          {/* Filter */}
          <div className="relative">
            <button onClick={() => { setShowFilterMenu(!showFilterMenu); setShowThemeMenu(false); setShowTeamMenu(false); }} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold border transition shadow-sm ${filterLabel ? 'bg-blue-600 text-white border-blue-600' : glassPanelClass + ' hover:bg-black/30'}`}>
              🏷️ {filterLabel || 'Filter'}
              {filterLabel && <span onClick={(e) => { e.stopPropagation(); setFilterLabel(null); }} className="ml-1 hover:text-blue-200 outline-none">✕</span>}
            </button>
            {showFilterMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 text-slate-800 animate-in fade-in zoom-in-95">
                <button onClick={() => { setFilterLabel(null); setShowFilterMenu(false); }} className="flex items-center gap-2 w-full p-2 hover:bg-slate-50 rounded-xl text-left text-sm font-bold transition text-slate-600">Show All</button>
                {ALL_LABELS.map(lbl => (
                  <button key={lbl} onClick={() => { setFilterLabel(lbl); setShowFilterMenu(false); }} className="flex items-center gap-2 w-full p-2 hover:bg-slate-50 rounded-xl text-left text-sm font-bold transition">
                    {lbl}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme */}
          {canManageBoard && (
            <div className="relative hidden sm:block">
              <button onClick={() => { setShowThemeMenu(!showThemeMenu); setShowFilterMenu(false); setShowTeamMenu(false); }} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold border transition ${glassPanelClass} hover:bg-black/30`}>
                🎨 Theme
              </button>
              {showThemeMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 text-slate-800 animate-in fade-in zoom-in-95">
                  {BACKGROUND_OPTIONS.map(bg => (
                    <button key={bg.id} onClick={() => handleUpdateBackground(bg.css)} className="flex items-center gap-3 w-full p-2.5 hover:bg-slate-50 rounded-xl text-left text-sm font-bold transition">
                      <div className={`w-6 h-6 rounded-full shadow-inner ${bg.css}`}></div>
                      {bg.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Team / Invite */}
          <div className={`flex items-center gap-4 p-2 px-4 rounded-xl border hidden md:flex ${glassPanelClass}`}>
            <div className="relative">
              {/* The clickable avatar stack */}
              <div className="flex -space-x-2 cursor-pointer hover:scale-105 transition-transform" onClick={() => { setShowTeamMenu(!showTeamMenu); setShowThemeMenu(false); setShowFilterMenu(false); }}>
                {members.map(m => (
                  <div 
                    key={m.user_id} 
                    className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs border-2 border-white font-bold overflow-hidden shadow-sm shrink-0"
                    title={m.profiles?.email}
                  >
                    {m.profiles?.avatar_url ? (
                      <img src={m.profiles.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      m.profiles?.email?.charAt(0).toUpperCase() || '?'
                    )}
                  </div>
                ))}
              </div>

              {/* TEAM MENU DROPDOWN */}
              {showTeamMenu && (
                <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 text-slate-800 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-100 mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Team Members ({members.length})</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto flex flex-col gap-1">
                    {members.map(m => (
                      <div key={m.user_id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors">
                        <div className="flex items-center gap-2 truncate">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0 border border-slate-200">
                            {m.profiles?.avatar_url ? (
                              <img src={m.profiles.avatar_url} className="w-full h-full object-cover" />
                            ) : (
                              m.profiles?.email?.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span className="text-sm font-bold text-slate-700 truncate max-w-[100px]" title={m.profiles?.email}>
                            {m.profiles?.email?.split('@')[0]}
                          </span>
                        </div>
                        
                        {/* ROLE LOGIC & LEAVE BUTTON */}
                        {m.user_id !== currentUserId ? (
                          <div className="flex items-center gap-1 shrink-0">
                            {canManageBoard ? (
                              <>
                                <select 
                                  value={m.role} 
                                  onChange={(e) => handleUpdateMemberRole(m.user_id, e.target.value)}
                                  className="text-[10px] font-bold bg-slate-100 text-slate-600 rounded-md px-1.5 py-1.5 outline-none cursor-pointer hover:bg-slate-200 transition-colors border border-transparent hover:border-slate-300"
                                >
                                  <option value="owner">OWNER</option>
                                  <option value="member">MEMBER</option>
                                  <option value="viewer">VIEWER</option>
                                </select>
                                <button onClick={() => handleRemoveMember(m.user_id)} className="text-slate-300 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors" title="Remove Member">
                                  ✕
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 rounded-md px-2 py-1.5 shrink-0 uppercase">
                                {m.role}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200 rounded-md px-2 py-1.5 uppercase">
                              {m.role} (YOU)
                            </span>
                            {/* THE LEAVE BUTTON! Only shows if you are not the owner */}
                            {m.role !== 'owner' && (
                              <button 
                                onClick={handleLeaveBoard} 
                                className="text-[10px] font-bold bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-md px-2 py-1.5 transition-colors shadow-sm"
                              >
                                Leave
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* END TEAM MENU */}
            </div>
            
            {canManageBoard && (
              <div className={`flex gap-2 border-l pl-4 ${isDarkBg ? 'border-white/20' : 'border-slate-200'}`}>
                <input type="email" placeholder="Email..." value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className={`p-1.5 px-3 text-sm rounded-lg w-32 outline-none font-medium ${isDarkBg ? 'bg-black/30 text-white placeholder-white/50 border-transparent' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                <button onClick={handleInvite} className={`font-bold px-4 py-1.5 rounded-lg text-sm transition shadow-sm ${isDarkBg ? 'bg-white text-slate-900' : 'bg-slate-800 text-white'}`}>Invite</button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}