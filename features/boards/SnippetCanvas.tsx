// features/boards/SnippetCanvas.tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import FocusLockedInput from '@/components/FocusLockedInput';
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

export default function SnippetCanvas({ boardId, canEdit, currentUserId, searchQuery = '' }: { boardId: string, canEdit: boolean, currentUserId: string | null, searchQuery?: string }) {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [paletteId, setPaletteId] = useState<string | null>(null);

  useEffect(() => {
    fetchSnippets();
    const channel = supabase.channel(`snippets-${boardId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'snippets', filter: `board_id=eq.${boardId}` }, () => {
        fetchSnippets();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [boardId]);

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

  const query = searchQuery.trim().toLowerCase();
  const visibleSnippets = query
    ? snippets.filter(s =>
        s.title?.toLowerCase().includes(query) ||
        s.content?.toLowerCase().includes(query)
      )
    : snippets;

  return (
    <div className="w-full h-full pb-12">
      {canEdit && (
        <button onClick={handleAddSnippet} className="mb-8 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95">
          + Add New Snypp
        </button>
      )}

      {snippets.length === 0 ? (
        <div className="py-20 border-2 border-dashed border-slate-300/50 rounded-3xl flex flex-col items-center justify-center text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="font-bold text-lg opacity-80">No snypps yet</p>
          <p className="text-sm opacity-60 font-medium mt-1">
            {canEdit ? 'Click "+ Add New Snypp" to save your first snippet.' : 'Nothing has been added to this board yet.'}
          </p>
        </div>
      ) : visibleSnippets.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-bold text-lg opacity-80">No snypps match your search.</p>
          <p className="text-sm opacity-60 font-medium mt-1">Try a different keyword or clear the search.</p>
        </div>
      ) : (

      // Masonry-style Grid for Sticky Notes
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
        {visibleSnippets.map((snippet) => (
          <div 
            key={snippet.id} 
            // Auto-sizing card that grows with content
            className={`${snippet.color || 'bg-yellow-200'} p-5 rounded-2xl shadow-md hover:shadow-xl transition-shadow relative group transform hover:-rotate-1 duration-300 flex flex-col`}
          >
            
            {/* Header (Title & Buttons) - shrink-0 prevents it from getting squished */}
            <div className="flex justify-between items-start mb-4 gap-2 shrink-0">
              <FocusLockedInput
                initialValue={snippet.title}
                onSave={(newTitle) => handleUpdateSnippet(snippet.id, { title: newTitle })}
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
                    onClick={() => setPaletteId(paletteId === snippet.id ? null : snippet.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/40 hover:bg-white/80 text-slate-800 transition-colors"
                    title="Change Color"
                  >
                    🎨
                  </button>
                )}
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

            {/* Color palette — swatches reuse the full COLORS class names so JIT keeps them */}
            {paletteId === snippet.id && (
              <div className="flex gap-2 mb-4 shrink-0">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => { handleUpdateSnippet(snippet.id, { color: c }); setPaletteId(null); }}
                    className={`w-6 h-6 rounded-full ${c} border-2 shadow-sm hover:scale-110 transition-transform ${snippet.color === c ? 'border-slate-800' : 'border-white/70'}`}
                    title={c.replace('bg-', '').replace('-200', '')}
                  />
                ))}
              </div>
            )}

            {/* Auto-resizing textarea that expands to fit all content */}
            <FocusLockedInput 
          isTextarea={true}
          initialValue={snippet.content || ''}
          onSave={(newText) => handleUpdateSnippet(snippet.id, { content: newText })}
          readOnly={!canEdit}
          placeholder="Paste your code snippet, text, or clues here..."
          className="w-full bg-black/5 text-slate-800 p-4 rounded-xl outline-none resize-none focus:ring-2 focus:ring-black/10 font-mono text-sm leading-relaxed min-h-[100px]"
        />
          </div>
        ))}
      </div>
      )}
    </div>
  );
}