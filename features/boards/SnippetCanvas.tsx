// features/boards/SnippetCanvas.tsx
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Snippet { id: string; title: string; content: string; color: string; }

// Using full standard Tailwind classes so the JIT compiler definitely catches them
const COLORS = [
  'bg-yellow-200', 
  'bg-blue-200', 
  'bg-pink-200', 
  'bg-emerald-200', 
  'bg-purple-200', 
  'bg-orange-200'
];

export default function SnippetCanvas({ boardId, canEdit, currentUserId }: { boardId: string, canEdit: boolean, currentUserId: string | null }) {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});

  useEffect(() => {
    fetchSnippets();
    const channel = supabase.channel(`snippets-${boardId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'snippets', filter: `board_id=eq.${boardId}` }, () => {
        fetchSnippets();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [boardId]);

  // Auto-resize textareas when content changes
  useEffect(() => {
    snippets.forEach(snippet => {
      const textarea = textareaRefs.current[snippet.id];
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      }
    });
  }, [snippets]);

  const fetchSnippets = async () => {
    const { data, error } = await supabase.from('snippets').select('*').eq('board_id', boardId).order('created_at', { ascending: false });
    if (error) console.error("Fetch error:", error);
    if (data) setSnippets(data);
  };

  const handleAddSnippet = async () => {
    if (!canEdit || !currentUserId) return;

    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const newSnippet = {
      board_id: boardId,
      user_id: currentUserId,
      title: 'New Snypp',
      content: '',
      color: randomColor
    };

    const { error } = await supabase.from('snippets').insert([newSnippet]);

    if (error) {
      alert(`Database Error: ${error.message}`);
      console.error(error);
    }
  };

  const handleUpdateSnippet = async (id: string, updates: Partial<Snippet>) => {
    if (!canEdit) return;
    setSnippets(snippets.map(s => s.id === id ? { ...s, ...updates } : s));
    await supabase.from('snippets').update(updates).eq('id', id);
  };

  const handleDeleteSnippet = async (id: string) => {
    if (!canEdit) return;
    if (!window.confirm("Delete this snippet?")) return;
    setSnippets(snippets.filter(s => s.id !== id));
    await supabase.from('snippets').delete().eq('id', id);
  };

  const handleCopy = (content: string, id: string) => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full h-full pb-12">
      {canEdit && (
        <button onClick={handleAddSnippet} className="mb-8 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95">
          + Add New Snypp
        </button>
      )}

      {/* Masonry-style Grid for Sticky Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
        {snippets.map((snippet) => (
          <div 
            key={snippet.id} 
            // Auto-sizing card that grows with content
            className={`${snippet.color || 'bg-yellow-200'} p-5 rounded-2xl shadow-md hover:shadow-xl transition-shadow relative group transform hover:-rotate-1 duration-300 flex flex-col`}
          >
            
            {/* Header (Title & Buttons) - shrink-0 prevents it from getting squished */}
            <div className="flex justify-between items-start mb-4 gap-2 shrink-0">
              <input 
                type="text" 
                value={snippet.title} 
                onChange={(e) => handleUpdateSnippet(snippet.id, { title: e.target.value })}
                readOnly={!canEdit}
                placeholder="Title..."
                className="font-extrabold text-slate-800 bg-transparent outline-none w-full border-b border-transparent focus:border-slate-800/20"
              />
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button 
                  onClick={() => handleCopy(snippet.content, snippet.id)} 
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/40 hover:bg-white/80 text-slate-800 transition-colors"
                  title="Copy Content"
                >
                  {copiedId === snippet.id ? '✓' : '📋'}
                </button>
                {canEdit && (
                  <button 
                    onClick={() => handleDeleteSnippet(snippet.id)} 
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-400/40 hover:bg-red-500/80 text-red-900 transition-colors"
                    title="Delete"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Auto-resizing textarea that expands to fit all content */}
            <textarea 
              ref={(el) => { textareaRefs.current[snippet.id] = el; }}
              value={snippet.content || ''}
              onChange={(e) => handleUpdateSnippet(snippet.id, { content: e.target.value })}
              readOnly={!canEdit}
              placeholder="Paste your code snippet, text, or clues here..."
              className="w-full bg-black/5 text-slate-800 p-4 rounded-xl outline-none resize-none focus:ring-2 focus:ring-black/10 font-mono text-sm leading-relaxed min-h-[100px]"
              style={{ height: 'auto', overflow: 'hidden' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}