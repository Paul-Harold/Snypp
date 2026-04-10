// features/boards/BoardView.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import TaskModal from './TaskModal';
import { DropResult } from '@hello-pangea/dnd';

import BoardHeader from './BoardHeader';
import BoardCanvas from './BoardCanvas';
import SnippetCanvas from './SnippetCanvas';

export interface Task { 
  id: string; list_id: string; content: string; position: number; 
  assignee_id?: string; description?: string; due_date?: string; 
  story_points?: number; labels?: string[]; subtasks?: { id: string; title: string; completed: boolean; }[];
}
interface List { id: string; title: string; position: number; }
interface BoardMember { user_id: string; role: string; status?: string; profiles: { email: string } | null; }

const BACKGROUND_OPTIONS = [
  { id: 'default', css: 'bg-slate-50', name: 'Clean Light' },
  { id: 'blue', css: 'bg-blue-600', name: 'Trello Blue' },
  { id: 'emerald', css: 'bg-emerald-800', name: 'Forest Green' },
  { id: 'purple', css: 'bg-purple-900', name: 'Midnight Purple' },
  { id: 'gradient', css: 'bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900', name: 'Cosmic Gradient' },
  { id: 'obsidian', css: 'bg-zinc-950', name: 'Obsidian Dark' }
];

const ALL_LABELS = ['Bug', 'Feature', 'Design', 'Frontend', 'Backend', 'Urgent'];

export default function BoardView({ boardId }: { boardId: string }) {

  const [lists, setLists] = useState<List[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [boardTitle, setBoardTitle] = useState('');
  const [newListTitle, setNewListTitle] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [boardBg, setBoardBg] = useState('bg-slate-50');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLabel, setFilterLabel] = useState<string | null>(null);
  const [boardType, setBoardType] = useState('kanban');

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const pollingRef = useRef<number | null>(null);

  useEffect(() => {
    setIsMounted(true);
    
    fetchBoardDetails();
    fetchListsAndTasks();
    fetchMembers(); 

    const channel = supabase.channel(`board-room-${boardId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lists', filter: `board_id=eq.${boardId}` }, () => fetchListsAndTasks())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchListsAndTasks())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'boards', filter: `id=eq.${boardId}` }, () => fetchBoardDetails())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'board_members', filter: `board_id=eq.${boardId}` }, () => {
        fetchMembers();
      })
      .subscribe();

    pollingRef.current = window.setInterval(() => {
      fetchListsAndTasks();
      fetchMembers();
    }, 1000);

    return () => {
      supabase.removeChannel(channel);
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
      }
    };
  }, [boardId]);

  const fetchBoardDetails = async () => {
    const { data } = await supabase.from('boards').select('title, background, board_type').eq('id', boardId).single();
    if (data) {
      setBoardTitle(data.title);
      if (data.background) setBoardBg(data.background);
      if (data.board_type) setBoardType(data.board_type);
    }
  };

  const fetchMembers = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id || null;

    if (uid && uid !== currentUserId) setCurrentUserId(uid);

    const { data } = await supabase.from('board_members').select(`user_id, role, status, profiles ( email, avatar_url )`).eq('board_id', boardId);
    const normalizedMembers = (data ?? []).map((member: any) => ({
      user_id: member.user_id,
      role: typeof member.role === 'string' ? member.role.toLowerCase().trim() : 'viewer',
      status: member.status,
      profiles: Array.isArray(member.profiles) ? member.profiles[0] : member.profiles
    })) as BoardMember[];

    setMembers(normalizedMembers);

    if (uid) {
      const me = normalizedMembers.find(m => m.user_id === uid);
      if (!me || me.status !== 'accepted') {
        alert('You must accept the invitation to view this workspace.');
        window.location.href = '/dashboard';
      }
    }
  };

  const fetchListsAndTasks = async () => {
    const { data: listsData } = await supabase.from('lists').select('*').eq('board_id', boardId).order('position');
    if (listsData) setLists(listsData);
    if (listsData && listsData.length > 0) {
      const listIds = listsData.map(l => l.id);
      const { data: tasksData } = await supabase.from('tasks').select('*').in('list_id', listIds).order('position');
      if (tasksData) setTasks(tasksData);
    } else setTasks([]);
  };

  const currentUserRole = members.find(m => m.user_id === currentUserId)?.role?.toLowerCase() || 'viewer';
  const canManageBoard = currentUserRole === 'owner';
  const canEditTasks = currentUserRole === 'owner' || currentUserRole === 'member';

  useEffect(() => {
    if (!currentUserId || members.length === 0) return;
    const me = members.find(m => m.user_id === currentUserId);
    if (!me || me.status !== 'accepted') {
      alert('Your access to this workspace has been revoked or is pending.');
      window.location.href = '/dashboard';
    }
  }, [currentUserId, members]);

  const handleInvite = async () => {
    if (!canManageBoard) return alert("Only the board owner can invite members.");
    if (!inviteEmail.trim()) return;

    const role = inviteRole.toLowerCase().trim();
    const { data: profile } = await supabase.from('profiles').select('id').eq('email', inviteEmail).single();
    if (!profile) return alert('User not found. Make sure they have a Snypp account!');
    if (profile.id === currentUserId) return alert('You cannot invite yourself.');

    const { error } = await supabase.from('board_members').insert([{ 
      board_id: boardId, 
      user_id: profile.id, 
      role, 
      status: 'pending' 
    }]);

    if (error) return alert('User is already in the workspace or has a pending invite.');

    await supabase.from('notifications').insert([{
      user_id: profile.id,
      board_id: boardId,
      sender_id: currentUserId,
      type: 'invite',
      content: `invited you to join`
    }]);

    setInviteEmail(''); setInviteRole('member'); fetchMembers();
  };

  const handleUpdateMemberRole = async (memberUserId: string, newRole: string) => {
    if (!canManageBoard) return;
    const role = newRole.toLowerCase().trim();
    await supabase.from('board_members').update({ role }).eq('board_id', boardId).eq('user_id', memberUserId);
    fetchMembers();
  };

  const handleRemoveMember = async (memberUserId: string) => {
    if (!canManageBoard) return;
    if (memberUserId === currentUserId) return alert("You cannot remove yourself. Transfer ownership or delete the board.");
    if (!window.confirm("Are you sure you want to remove this user from the board?")) return;

    await supabase.from('board_members').delete().eq('board_id', boardId).eq('user_id', memberUserId);
    fetchMembers();
  };

  const handleUpdateBackground = async (newCss: string) => {
    if (!canManageBoard) return;
    setBoardBg(newCss);
    await supabase.from('boards').update({ background: newCss }).eq('id', boardId);
  };

  const handleCreateList = async () => {
    if (!canEditTasks || !newListTitle.trim()) return;
    const newPosition = lists.length > 0 ? lists[lists.length - 1].position + 1 : 0;
    const tempList = { id: crypto.randomUUID(), title: newListTitle, position: newPosition };
    setLists([...lists, tempList]);
    setNewListTitle('');
    await supabase.from('lists').insert([{ board_id: boardId, title: tempList.title, position: newPosition }]);
  };

  const handleAddTask = async (listId: string, content: string) => {
    if (!canEditTasks) return;
    const listTasks = tasks.filter(t => t.list_id === listId);
    const newPosition = listTasks.length > 0 ? listTasks[listTasks.length - 1].position + 1 : 0;
    const tempTask = { id: crypto.randomUUID(), list_id: listId, content, position: newPosition };
    setTasks([...tasks, tempTask as Task]);
    await supabase.from('tasks').insert([{ list_id: listId, content, position: newPosition }]);
  };

  const handleDeleteList = async (listId: string) => {
    if (!canManageBoard) return alert("Only owners can delete lists.");
    if (!window.confirm('Delete this list and all tasks?')) return;
    setLists(lists.filter(l => l.id !== listId));
    await supabase.from('lists').delete().eq('id', listId);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!canEditTasks) return;
    setTasks(tasks.filter(t => t.id !== taskId));
    await supabase.from('tasks').delete().eq('id', taskId);
  };

  const handleUpdateList = async (listId: string, newTitle: string) => {
    if (!canEditTasks || !newTitle.trim()) return;
    setLists(lists.map(l => l.id === listId ? { ...l, title: newTitle } : l));
    await supabase.from('lists').update({ title: newTitle }).eq('id', listId);
  };

  const handleUpdateTask = async (taskId: string, newContent: string) => {
    if (!canEditTasks || !newContent.trim()) return;
    setTasks(tasks.map(t => t.id === taskId ? { ...t, content: newContent } : t));
    await supabase.from('tasks').update({ content: newContent }).eq('id', taskId);
  };

  const handleAssignTask = async (taskId: string, assigneeId: string | null) => {
    if (!canEditTasks) return;
    setTasks(tasks.map(t => t.id === taskId ? { ...t, assignee_id: assigneeId || undefined } : t));
    await supabase.from('tasks').update({ assignee_id: assigneeId }).eq('id', taskId);

    if (assigneeId && assigneeId !== currentUserId) {
      const assignedTask = tasks.find(t => t.id === taskId);
      await supabase.from('notifications').insert([{
        user_id: assigneeId,
        board_id: boardId,
        sender_id: currentUserId,
        type: 'assignment',
        content: `assigned you to a task: "${assignedTask?.content}" in`
      }]);
    }
  };

  const handleUpdateTaskDetails = async (taskId: string, updates: Partial<Task>) => {
    if (!canEditTasks) return alert("You do not have permission to edit tasks.");
    setTasks(tasks.map(t => t.id === taskId ? { ...t, ...updates } : t));
    await supabase.from('tasks').update(updates).eq('id', taskId);
  };

  const onDragEnd = async (result: DropResult) => {
    if (!canEditTasks) { alert("Viewers cannot move cards."); return; }

    const { destination, source, draggableId, type } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;

    if (type === 'list') {
      const newLists = Array.from(lists);
      const [removed] = newLists.splice(source.index, 1);
      newLists.splice(destination.index, 0, removed);
      const updatedLists = newLists.map((l, index) => ({ ...l, position: index }));
      setLists(updatedLists); 
      await supabase.from('lists').upsert(updatedLists.map(l => ({ id: l.id, board_id: boardId, title: l.title, position: l.position })));
      return;
    }

    const draggedTask = tasks.find(t => t.id === draggableId);
    if (!draggedTask) return;
    const newTasks = Array.from(tasks);
    newTasks.splice(newTasks.findIndex(t => t.id === draggableId), 1);
    const destTasks = newTasks.filter(t => t.list_id === destination.droppableId);
    destTasks.splice(destination.index, 0, { ...draggedTask, list_id: destination.droppableId });
    const updatedDestTasks = destTasks.map((task, index) => ({ ...task, position: index }));
    
    if (draggedTask.assignee_id && draggedTask.assignee_id !== currentUserId && destination.droppableId !== source.droppableId) {
      const destList = lists.find(l => l.id === destination.droppableId);
      await supabase.from('notifications').insert([{
        user_id: draggedTask.assignee_id,
        board_id: boardId,
        sender_id: currentUserId,
        type: 'status',
        content: `moved your task "${draggedTask.content}" into [${destList?.title}] in`
      }]);
    }

    setTasks([...newTasks.filter(t => t.list_id !== destination.droppableId), ...updatedDestTasks]);
    await supabase.from('tasks').upsert(updatedDestTasks.map(t => ({
      id: t.id, list_id: t.list_id, content: t.content, position: t.position, assignee_id: t.assignee_id
    })));
  };

  // --- NEW: Handle Leaving the Board ---
  const handleLeaveBoard = async () => {
    if (!currentUserId) return;
    if (!window.confirm("Are you sure you want to leave this workspace? You will need to be re-invited to join again.")) return;
    
    await supabase
      .from('board_members')
      .delete()
      .eq('board_id', boardId)
      .eq('user_id', currentUserId);
      
    window.location.href = '/dashboard';
  };

  if (!isMounted) return null;

  const isDarkBg = boardBg !== 'bg-slate-50';
  const textColor = isDarkBg ? 'text-white' : 'text-slate-900';

  return (
    <div className={`flex flex-col h-[calc(100vh-6rem)] overflow-y-auto overflow-x-hidden -m-8 p-8 ${boardBg} ${textColor} transition-all duration-500`}>
      
      <BoardHeader 
        boardTitle={boardTitle} boardBg={boardBg} currentUserRole={currentUserRole}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        filterLabel={filterLabel} setFilterLabel={setFilterLabel}
        members={members} currentUserId={currentUserId} canManageBoard={canManageBoard}
        inviteEmail={inviteEmail} setInviteEmail={setInviteEmail}
        inviteRole={inviteRole} setInviteRole={setInviteRole}
        handleInvite={handleInvite} handleUpdateMemberRole={handleUpdateMemberRole}
        handleRemoveMember={handleRemoveMember} handleUpdateBackground={handleUpdateBackground}
        handleLeaveBoard={handleLeaveBoard} /* <-- PASSING IT IN HERE */
        BACKGROUND_OPTIONS={BACKGROUND_OPTIONS} ALL_LABELS={ALL_LABELS}
      />

      {boardType === 'snippets' ? (
        <SnippetCanvas boardId={boardId} canEdit={canEditTasks} currentUserId={currentUserId} />
      ) : (
        <BoardCanvas 
          lists={lists} tasks={tasks} members={members}
          searchQuery={searchQuery} filterLabel={filterLabel} canEditTasks={canEditTasks}
          onDragEnd={onDragEnd} handleAssignTask={handleAssignTask} handleAddTask={handleAddTask}
          handleDeleteList={handleDeleteList} handleDeleteTask={handleDeleteTask}
          handleUpdateList={handleUpdateList} handleUpdateTask={handleUpdateTask}
          setSelectedTask={setSelectedTask} newListTitle={newListTitle}
          setNewListTitle={setNewListTitle} handleCreateList={handleCreateList}
          isDarkBg={isDarkBg}
        />
      )}

      <TaskModal 
        task={selectedTask} 
        canEditTasks={canEditTasks} 
        boardId={boardId}
        onClose={() => setSelectedTask(null)} 
        onSave={handleUpdateTaskDetails} 
      />
    </div>
  );
} 