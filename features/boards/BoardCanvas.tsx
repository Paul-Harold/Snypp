// features/boards/BoardCanvas.tsx
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import ListColumn from './ListColumn';


interface BoardCanvasProps {
  lists: any[];
  tasks: any[];
  members: any[];
  searchQuery: string;
  filterLabel: string | null;
  canEditTasks: boolean;
  onDragEnd: (result: DropResult) => void;
  handleAssignTask: (taskId: string, assigneeId: string | null) => void;
  handleAddTask: (listId: string, content: string) => void;
  handleDeleteList: (listId: string) => void;
  handleDeleteTask: (taskId: string) => void;
  handleUpdateList: (listId: string, newTitle: string) => void;
  handleUpdateTask: (taskId: string, newContent: string) => void;
  setSelectedTask: (task: any) => void;
  newListTitle: string;
  setNewListTitle: (title: string) => void;
  handleCreateList: () => void;
  isDarkBg: boolean;
}

export default function BoardCanvas({
  lists, tasks, members, searchQuery, filterLabel, canEditTasks, onDragEnd, handleAssignTask,
  handleAddTask, handleDeleteList, handleDeleteTask, handleUpdateList, handleUpdateTask,
  setSelectedTask, newListTitle, setNewListTitle, handleCreateList, isDarkBg
}: BoardCanvasProps) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="pb-12 h-full w-full"> 
        <Droppable droppableId="board" type="list" direction="horizontal"> 
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-col md:flex-row md:flex-wrap gap-6 items-start w-full">
              {lists.map((list, index) => {
                const filteredTasks = tasks.filter(t => {
                  if (t.list_id !== list.id) return false;
                  if (searchQuery) {
                    const query = searchQuery.toLowerCase();
                    if (!t.content.toLowerCase().includes(query) && !t.description?.toLowerCase().includes(query)) return false;
                  }
                  if (filterLabel && (!t.labels || !t.labels.includes(filterLabel))) return false;
                  return true;
                });

                return (
                  <ListColumn 
                    key={list.id} list={list} index={index} tasks={filteredTasks} members={members} 
                    canEditTasks={canEditTasks} onAssignTask={handleAssignTask} onAddTask={handleAddTask}
                    onDeleteList={handleDeleteList} onDeleteTask={handleDeleteTask}
                    onUpdateList={handleUpdateList} onUpdateTask={handleUpdateTask} onTaskClick={setSelectedTask} 
                  />
                );
              })}
              {provided.placeholder}

              {canEditTasks && (
                <div className={`p-4 rounded-xl border-2 border-dashed w-full md:w-80 flex-shrink-0 backdrop-blur-sm ${isDarkBg ? 'bg-black/20 border-white/20' : 'bg-slate-50/80 border-slate-300'}`}>
                  <input type="text" placeholder="+ New list title..." value={newListTitle} onChange={(e) => setNewListTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateList()} className={`w-full p-2.5 rounded-lg mb-3 outline-none focus:ring-2 font-medium ${isDarkBg ? 'bg-black/40 text-white border-white/10' : 'bg-white border-slate-200'}`} />
                  <button onClick={handleCreateList} className={`w-full p-2.5 rounded-lg font-bold shadow-sm ${isDarkBg ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-800 text-white'}`}>Add List</button>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </div>
    </DragDropContext>
  );
}