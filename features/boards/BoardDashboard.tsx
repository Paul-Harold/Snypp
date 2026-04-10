// features/boards/BoardDashboard.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

// Added 'role' to the interface so we can lock down Edit/Delete
interface Board { id: string; title: string; created_at: string; role?: string; }

const BOARD_TEMPLATES = {
  agile: ['Backlog', 'To Do', 'In Progress', 'In Review', 'Done'],
  personal: ['To Do', 'Doing', 'Waiting', 'Done'],
  crm: ['New Lead', 'Contacted', 'Demo Scheduled', 'Proposal Sent', 'Won/Lost'],
  empty: [],
  snippets: []
};

type TemplateKey = keyof typeof BOARD_TEMPLATES;

export default function BoardDashboard({ userId }: { userId: string }) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [searchQuery, setSearchQuery] = useState(''); // NEW: Search state
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>('agile');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // NEW: Edit states
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    fetchBoards();
  }, [userId]);

  useEffect(() => {
    const dialog = modalRef.current;
    if (!dialog) return;

    if (isModalOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isModalOpen && dialog.open) {
      dialog.close();
    }
  }, [isModalOpen]);

  const fetchBoards = async () => {
    // 1. Fetch memberships WITH roles, and only where status is accepted
    const { data: memberships } = await supabase
      .from('board_members')
      .select('board_id, role, status')
      .eq('user_id', userId)
      .eq('status', 'accepted'); 
      
    if (!memberships || memberships.length === 0) { 
      setBoards([]); 
      return; 
    }
    
    // 2. Fetch the actual boards
    const boardIds = memberships.map(m => m.board_id);
    const { data: boardsData } = await supabase
      .from('boards')
      .select('*')
      .in('id', boardIds)
      .order('created_at', { ascending: false });
      
    if (boardsData) {
      // 3. Merge the role into the board object so the UI knows who is an owner
      const mergedBoards = boardsData.map(board => {
        const membership = memberships.find(m => m.board_id === board.id);
        return { ...board, role: membership?.role || 'viewer' };
      });
      setBoards(mergedBoards);
    }
  };

  const handleCreateBoard = async () => {
    if (!newBoardTitle.trim()) return;
    setIsLoading(true);

    // NEW: Determine if it's a kanban or snippets board
    const boardType = selectedTemplate === 'snippets' ? 'snippets' : 'kanban';

    const { data: newBoard, error } = await supabase
      .from('boards')
      .insert([{ title: newBoardTitle, user_id: userId, board_type: boardType }]) // <-- NEW: Added board_type
      .select()
      .single();

    if (newBoard && !error) {
      // Create owner with 'accepted' status so it shows up immediately
      await supabase.from('board_members').insert([{ 
        board_id: newBoard.id, 
        user_id: userId, 
        role: 'owner',
        status: 'accepted'
      }]);
        
      const templateLists = BOARD_TEMPLATES[selectedTemplate];
      if (templateLists.length > 0) {
        const listsToInsert = templateLists.map((title, index) => ({ board_id: newBoard.id, title, position: index }));
        await supabase.from('lists').insert(listsToInsert);
      }

      setNewBoardTitle('');
      setIsModalOpen(false); 
      fetchBoards();
    }
    setIsLoading(false);
  };

  // --- NEW: EDIT & DELETE HANDLERS ---
  const handleDeleteBoard = async (e: React.MouseEvent, boardId: string, title: string) => {
    e.preventDefault(); // Prevents the Link from opening the board
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to completely delete "${title}"? This cannot be undone.`)) return;

    const { error } = await supabase.from('boards').delete().eq('id', boardId);
    if (!error) {
      setBoards(boards.filter(b => b.id !== boardId));
    } else {
      alert("Failed to delete. Ensure ON DELETE CASCADE is set up in your database.");
    }
  };

  const startEditing = (e: React.MouseEvent, board: Board) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingBoardId(board.id);
    setEditTitle(board.title);
  };

  const saveEdit = async (e: React.FormEvent | React.KeyboardEvent, boardId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editTitle.trim()) {
      setEditingBoardId(null);
      return;
    }

    // Optimistic UI update
    setBoards(boards.map(b => b.id === boardId ? { ...b, title: editTitle } : b));
    setEditingBoardId(null);
    
    // Database update
    await supabase.from('boards').update({ title: editTitle }).eq('id', boardId);
  };

  // --- NEW: FILTER LOGIC ---
  const filteredBoards = boards.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="py-10 text-slate-900 bg-white min-h-[80vh]">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">Workspaces</h2>
          <p className="text-slate-500 mt-1 font-medium">Manage your projects and team collaborations.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          {/* SEARCH BAR */}
          <div className="relative w-full sm:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input 
              type="text" 
              placeholder="Search boards..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-full outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
            />
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto group relative flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-full font-semibold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200 whitespace-nowrap"
          >
            <span className="text-lg leading-none">+</span> Create New Board
          </button>
        </div>
      </div>

      {/* BOARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {boards.length === 0 ? (
          <div className="col-span-full py-20 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center bg-slate-50/50">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-2xl mb-4">📂</div>
            <p className="text-slate-500 font-medium text-lg">No boards found</p>
            <button onClick={() => setIsModalOpen(true)} className="text-blue-600 font-bold hover:underline mt-2">Create your first one</button>
          </div>
        ) : filteredBoards.length === 0 ? (
          <div className="col-span-full py-12 text-center">
            <p className="text-slate-500 font-medium text-lg">No workspaces match your search.</p>
          </div>
        ) : (
          filteredBoards.map((board) => (
            <Link href={`/dashboard/${board.id}`} key={board.id} className="group relative block">
              <div className="h-48 p-8 bg-white border border-slate-200 rounded-3xl shadow-sm group-hover:shadow-xl group-hover:border-blue-500/50 transition-all duration-300 flex flex-col justify-between overflow-hidden relative">
                
                {/* Arrow Icon */}
                <div className="absolute top-0 right-0 p-5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">→</div>
                </div>

                <div className="z-10">
                  {/* EDIT MODE vs DISPLAY MODE */}
                  {editingBoardId === board.id ? (
                    <input 
                      autoFocus
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={(e) => saveEdit(e, board.id)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit(e, board.id)}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      className="text-2xl font-bold text-slate-900 border-b-2 border-blue-500 outline-none bg-transparent w-[90%]"
                    />
                  ) : (
                    <h3 className="text-2xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors pr-10 leading-tight truncate">
                      {board.title}
                    </h3>
                  )}
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    {board.role}
                  </div>

                  {/* ONLY OWNERS SEE EDIT & DELETE BUTTONS */}
                  {board.role === 'owner' && editingBoardId !== board.id && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => startEditing(e, board)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Rename"
                      >
                        ✎
                      </button>
                      <button 
                        onClick={(e) => handleDeleteBoard(e, board.id, board.title)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* --- NATIVE HTML5 DIALOG (Premium Design) --- */}
      <dialog 
        ref={modalRef}
        onClose={() => setIsModalOpen(false)}
        className="p-0 m-auto w-full max-w-md bg-white rounded-[32px] shadow-2xl backdrop:bg-slate-900/40 backdrop:backdrop-blur-md border-0 open:animate-in open:fade-in open:zoom-in-95 duration-300 text-slate-900"
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold text-slate-900">New Project</h3>
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-800 text-2xl outline-none font-medium leading-none"
            >
              &times;
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 ml-1 uppercase tracking-wider">Board Name <span className="text-blue-500">*</span></label>
              <input
                type="text"
                autoFocus
                placeholder="E.g. Mobile App Redesign"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-medium text-slate-900 placeholder-slate-400"
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 ml-1 uppercase tracking-wider">Workflow Type</label>
              <select 
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value as TemplateKey)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-medium text-slate-900 appearance-none cursor-pointer"
              >
                <option value="agile">Agile / Sprint</option>
                <option value="crm">CRM / Sales</option>
                <option value="personal">Personal To-Do</option>
                <option value="empty">Blank Slate</option>
                <option value="snippets">📋 Snippet / Detective Board</option> {/* <-- NEW */}
              </select>
            </div>

            <div className="bg-slate-900 rounded-2xl p-4 text-white">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Preview Columns</p>
              <p className="text-sm font-medium truncate italic text-slate-100">
                {selectedTemplate === 'empty' ? 'Clean Slate' : BOARD_TEMPLATES[selectedTemplate].join(' • ')}
              </p>
            </div>
          </div>

          <div className="mt-10 flex gap-3">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors outline-none"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateBoard}
              disabled={isLoading || !newBoardTitle.trim()}
              className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20 active:scale-95 outline-none"
            >
              {isLoading ? 'Creating...' : 'Launch Project'}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}