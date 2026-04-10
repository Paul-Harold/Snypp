// features/boards/TaskModal.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface Subtask { id: string; title: string; completed: boolean; }
export interface Task { 
  id: string; list_id: string; content: string; position: number; 
  assignee_id?: string; description?: string; due_date?: string; 
  story_points?: number; labels?: string[]; subtasks?: Subtask[]; 
}

interface TaskModalProps {
  task: Task | null;
  canEditTasks: boolean; 
  boardId: string; 
  onClose: () => void;
  onSave: (taskId: string, updates: Partial<Task>) => void;
}

const FIBONACCI = [1, 2, 3, 5, 8];
const AVAILABLE_LABELS = [
  { name: 'Bug', style: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' },
  { name: 'Feature', style: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
  { name: 'Design', style: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' },
  { name: 'Frontend', style: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
  { name: 'Backend', style: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
  { name: 'Urgent', style: 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200 font-extrabold' }
];

export default function TaskModal({ task, canEditTasks, boardId, onClose, onSave }: TaskModalProps) {
  const modalRef = useRef<HTMLDialogElement>(null);
  
  const [description, setDescription] = useState('');
  const [storyPoints, setStoryPoints] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [labels, setLabels] = useState<string[]>([]);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const dialog = modalRef.current;
    if (!dialog) return;

    if (task && !dialog.open) {
      setDescription(task.description || '');
      setStoryPoints(task.story_points || null);
      setDueDate(task.due_date || '');
      setLabels(task.labels || []);
      setSubtasks(task.subtasks || []);
      
      supabase.auth.getSession().then(({ data }) => setCurrentUserId(data.session?.user.id || null));
      fetchComments(task.id);
      
      const channel = supabase.channel(`task-comments-${task.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `task_id=eq.${task.id}` }, () => {
          fetchComments(task.id);
        }).subscribe();

      dialog.showModal();
      return () => { supabase.removeChannel(channel); };
    } else if (!task && dialog.open) {
      dialog.close();
    }
  }, [task]);

  const fetchComments = async (taskId: string) => {
    const { data } = await supabase.from('comments').select('*, profiles(email)').eq('task_id', taskId).order('created_at', { ascending: true });
    if (data) setComments(data);
  };

  const handlePostComment = async () => {
    if (!canEditTasks || !newComment.trim() || !currentUserId || !task) return;
    const commentText = newComment;
    setNewComment(''); 
    
    // 1. Save the comment
    await supabase.from('comments').insert([{ task_id: task.id, user_id: currentUserId, content: commentText }]);

    // 2. NEW: Notify the Assignee!
    if (task.assignee_id && task.assignee_id !== currentUserId) {
      await supabase.from('notifications').insert([{
        user_id: task.assignee_id,
        board_id: boardId,
        sender_id: currentUserId,
        type: 'comment',
        content: `commented on your task "${task.content}" in`
      }]);
    }
  };

  if (!task) return null;

  // Protect all actions
  const toggleLabel = (labelName: string) => { if (canEditTasks) setLabels(prev => prev.includes(labelName) ? prev.filter(l => l !== labelName) : [...prev, labelName]); };
  const handleAddSubtask = () => { if (canEditTasks && newSubtaskTitle.trim()) { setSubtasks([...subtasks, { id: crypto.randomUUID(), title: newSubtaskTitle, completed: false }]); setNewSubtaskTitle(''); } };
  const toggleSubtask = (id: string) => { if (canEditTasks) setSubtasks(subtasks.map(st => st.id === id ? { ...st, completed: !st.completed } : st)); };
  const deleteSubtask = (id: string) => { if (canEditTasks) setSubtasks(subtasks.filter(st => st.id !== id)); };

  const handleSave = async () => {
    if (!canEditTasks) return onClose();
    setIsSaving(true);
    await onSave(task.id, { description, story_points: storyPoints || undefined, due_date: dueDate || undefined, labels, subtasks });
    setIsSaving(false);
    onClose();
  };

  const completedSubtasks = subtasks.filter(st => st.completed).length;
  const progressPercent = subtasks.length === 0 ? 0 : Math.round((completedSubtasks / subtasks.length) * 100);

  return (
    <dialog ref={modalRef} onClose={onClose} className="p-0 m-auto w-full max-w-2xl bg-white rounded-[32px] shadow-2xl backdrop:bg-slate-900/40 backdrop:backdrop-blur-md border-0 open:animate-in open:fade-in open:zoom-in-95 duration-300 text-slate-900">
      <div className="flex flex-col w-full h-full max-h-[85vh]">
        <div className="px-8 py-6 border-b border-slate-100 bg-white flex justify-between items-start sticky top-0 z-10 rounded-t-[32px]">
          <div className="pr-8">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">
              {canEditTasks ? 'Edit Task' : 'View Task'}
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 leading-tight">{task.content}</h3>
          </div>
          <button onClick={onClose} className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-800 text-xl font-bold leading-none outline-none">&times;</button>
        </div>

        <div className="p-8 flex flex-col gap-8 overflow-y-auto bg-slate-50/50">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3 ml-1 uppercase tracking-wider">Labels</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_LABELS.map((lbl) => (
                <button key={lbl.name} onClick={() => toggleLabel(lbl.name)} disabled={!canEditTasks} className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all outline-none ${!canEditTasks ? 'cursor-not-allowed' : ''} ${labels.includes(lbl.name) ? lbl.style + ' shadow-sm ring-2 ring-offset-1 ring-blue-400/30' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100 opacity-60'}`}>
                  {lbl.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3 ml-1 uppercase tracking-wider">Story Points</label>
              <div className="flex gap-2">
                {FIBONACCI.map((points) => (
                  <button key={points} onClick={() => { if (canEditTasks) setStoryPoints(points === storyPoints ? null : points); }} disabled={!canEditTasks} className={`w-11 h-11 rounded-2xl font-bold text-base transition-all outline-none ${!canEditTasks ? 'cursor-not-allowed' : ''} ${storyPoints === points ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105' : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-400 hover:bg-blue-50'}`}>
                    {points}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3 ml-1 uppercase tracking-wider">Target Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} disabled={!canEditTasks} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-900 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-50" />
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-bold text-slate-700 mb-3 ml-1 uppercase tracking-wider">Acceptance Criteria</label>
            <textarea placeholder={canEditTasks ? "Add details, links, or requirements..." : "No description provided."} value={description} onChange={(e) => setDescription(e.target.value)} disabled={!canEditTasks} className="w-full h-32 px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-900 placeholder-slate-400 shadow-sm resize-none disabled:opacity-70 disabled:bg-slate-50 disabled:cursor-not-allowed" />
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Checklist</label>
              {subtasks.length > 0 && <span className="text-xs font-bold text-slate-500">{progressPercent}%</span>}
            </div>
            {subtasks.length > 0 && (
              <div className="w-full bg-slate-100 rounded-full h-2 mb-6 overflow-hidden">
                <div className={`h-2 rounded-full transition-all duration-500 ${progressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${progressPercent}%` }}></div>
              </div>
            )}
            <div className="flex flex-col gap-2 mb-4">
              {subtasks.length === 0 && !canEditTasks && <p className="text-sm text-slate-400 italic">No checklist items.</p>}
              {subtasks.map((st) => (
                <div key={st.id} className="flex items-center justify-between group p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <label className="flex items-center gap-3 cursor-pointer w-full">
                    <input type="checkbox" checked={st.completed} onChange={() => toggleSubtask(st.id)} disabled={!canEditTasks} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed" />
                    <span className={`font-medium transition-all ${st.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{st.title}</span>
                  </label>
                  {canEditTasks && <button onClick={() => deleteSubtask(st.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition px-2">✕</button>}
                </div>
              ))}
            </div>
            {canEditTasks && (
              <div className="flex gap-2">
                <input type="text" placeholder="Add an item..." value={newSubtaskTitle} onChange={(e) => setNewSubtaskTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()} className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm font-medium transition" />
                <button onClick={handleAddSubtask} disabled={!newSubtaskTitle.trim()} className="bg-slate-800 text-white px-4 py-2 rounded-xl font-bold text-sm disabled:opacity-50 hover:bg-slate-900 transition shadow-sm">Add</button>
              </div>
            )}
          </div>

          {/* Comments stay active for everyone */}
          <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200 shadow-inner flex flex-col gap-4">
            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Team Comments</label>
            <div className="flex flex-col gap-3">
              {comments.length === 0 ? (
                <p className="text-sm text-slate-500 font-medium italic text-center py-4">No comments yet. Start the conversation!</p>
              ) : (
                comments.map(c => {
                  const isMe = c.user_id === currentUserId;
                  return (
                    <div key={c.id} className={`flex flex-col gap-1 p-3.5 rounded-2xl max-w-[85%] shadow-sm ${isMe ? 'bg-blue-600 text-white self-end rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 self-start rounded-tl-sm'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>{isMe ? 'Me' : c.profiles?.email.split('@')[0] || 'User'}</span>
                        <span className={`text-[9px] ${isMe ? 'text-blue-300' : 'text-slate-300'}`}>{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-sm font-medium leading-relaxed">{c.content}</p>
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex flex-col gap-2 mt-2">
              <input type="text" placeholder={canEditTasks ? "Write a comment..." : "Viewers cannot post comments."} value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePostComment()} disabled={!canEditTasks} className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium transition shadow-sm disabled:cursor-not-allowed disabled:opacity-60" />
              <button onClick={handlePostComment} disabled={!canEditTasks || !newComment.trim() || !currentUserId} className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold text-sm disabled:opacity-50 hover:bg-blue-700 transition shadow-sm active:scale-95">Post</button>
            </div>
          </div>
        </div>

        <div className="px-8 py-5 border-t border-slate-100 bg-white flex justify-end gap-3 sticky bottom-0 rounded-b-[32px]">
          {canEditTasks ? (
            <>
              <button onClick={onClose} className="px-6 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-colors outline-none">Cancel</button>
              <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20 active:scale-95 outline-none">
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button onClick={onClose} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 outline-none">Close</button>
          )}
        </div>
      </div>
    </dialog>
  );
}