// features/boards/ListColumn.tsx
'use client';

import { useState } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';

export interface Task { 
  id: string; 
  list_id: string; 
  content: string; 
  position: number; 
  assignee_id?: string;
  description?: string; 
  due_date?: string; 
  story_points?: number; 
  labels?: string[]; 
  subtasks?: { id: string; title: string; completed: boolean; }[];
}

interface List { id: string; title: string; position: number; }
interface BoardMember { user_id: string; profiles: { email: string } | null; }

interface ListColumnProps {
  list: List;
  tasks: Task[];
  index: number;
  members: BoardMember[];
  canEditTasks: boolean; // Required for Role-Based Access
  onAssignTask: (taskId: string, assigneeId: string | null) => void;
  onAddTask: (listId: string, content: string) => void;
  onDeleteList: (listId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateList: (listId: string, newTitle: string) => void;
  onUpdateTask: (taskId: string, newContent: string) => void;
  onTaskClick: (task: Task) => void; 
}

const LABEL_COLORS: Record<string, string> = {
  'Bug': 'bg-red-100 text-red-700',
  'Feature': 'bg-blue-100 text-blue-700',
  'Design': 'bg-purple-100 text-purple-700',
  'Frontend': 'bg-emerald-100 text-emerald-700',
  'Backend': 'bg-amber-100 text-amber-700',
  'Urgent': 'bg-orange-100 text-orange-800 border border-orange-200'
};

export default function ListColumn({ 
  list, tasks, index, members = [], canEditTasks, onAssignTask, onAddTask, onDeleteList, onDeleteTask, onUpdateList, onUpdateTask, onTaskClick 
}: ListColumnProps) {
  
  const [newTaskContent, setNewTaskContent] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState(list.title);

  const handleCreateTask = () => {
    if (!newTaskContent.trim()) return;
    onAddTask(list.id, newTaskContent);
    setNewTaskContent('');
  };

  const submitListEdit = () => {
    setIsEditingTitle(false);
    if (editTitleValue.trim() && editTitleValue !== list.title) onUpdateList(list.id, editTitleValue);
    else setEditTitleValue(list.title); 
  };

  return (
    <Draggable draggableId={list.id} index={index} isDragDisabled={!canEditTasks}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={provided.draggableProps.style}
          className={`bg-gray-100 p-4 rounded-xl w-full md:w-80 flex-shrink-0 shadow-sm border flex flex-col max-h-[75vh] transition ${
            snapshot.isDragging ? 'border-blue-500 shadow-xl scale-[1.02]' : 'border-gray-200'
          }`}
        >
          
          <div {...provided.dragHandleProps} className="flex justify-between items-center mb-4 group cursor-grab active:cursor-grabbing min-h-[32px]">
            {isEditingTitle ? (
              <input
                autoFocus
                value={editTitleValue}
                onChange={(e) => setEditTitleValue(e.target.value)}
                onBlur={submitListEdit}
                onKeyDown={(e) => e.key === 'Enter' && submitListEdit()}
                className="font-bold text-black border-blue-500 border rounded px-2 py-1 w-full mr-2 outline-none"
              />
            ) : (
              <h3 
                onClick={() => { if (canEditTasks) setIsEditingTitle(true); }} 
                className={`font-bold text-slate-800 px-1 rounded transition w-full ${canEditTasks ? 'cursor-text hover:bg-gray-200' : ''}`}
              >
                {list.title} <span className="text-gray-400 font-normal text-sm ml-1">({tasks.length})</span>
              </h3>
            )}
            {canEditTasks && (
              <button onClick={() => onDeleteList(list.id)} className="text-gray-400 hover:text-red-500 text-sm px-2 opacity-0 group-hover:opacity-100 transition">
                🗑️
              </button>
            )}
          </div>
          
          <Droppable droppableId={list.id} type="task">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="flex-1 overflow-y-auto flex flex-col gap-3 mb-4 pr-1 min-h-[10px]">
                {tasks.map((task, taskIndex) => {
                  const assignee = members.find(m => m.user_id === task.assignee_id); 

                  return (
                    <Draggable key={task.id} draggableId={task.id} index={taskIndex} isDragDisabled={!canEditTasks}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={provided.draggableProps.style}
                          className={`bg-white p-3.5 rounded-lg shadow-sm border transition group flex flex-col min-h-[44px] hover:border-blue-300 ${
                            snapshot.isDragging ? 'border-blue-500 shadow-lg rotate-2' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex flex-col w-full">
                            
                            {/* Labels */}
                            {task.labels && task.labels.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {task.labels.map(label => {
                                  const colorClass = LABEL_COLORS[label] || 'bg-gray-100 text-gray-700';
                                  return (
                                    <span key={label} className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${colorClass}`}>
                                      {label}
                                    </span>
                                  );
                                })}
                              </div>
                            )}

                            <div className="flex justify-between items-start w-full">
                              <span 
                                onClick={() => onTaskClick(task)} 
                                className="text-slate-800 break-words pr-2 w-full cursor-pointer hover:text-blue-600 transition-colors font-medium leading-snug"
                              >
                                {task.content}
                              </span>
                              {canEditTasks && (
                                <button onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition px-1 shrink-0">
                                  ✕
                                </button>
                              )}
                            </div>

                            {/* Task Badges (Story Points, Dates, Subtasks) */}
                            {(task.story_points || task.due_date || task.description || (task.subtasks && task.subtasks.length > 0)) && (
                              <div className="flex flex-wrap gap-2 mt-2.5 items-center">
                                {task.story_points && (
                                  <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <span className="text-blue-500">❖</span> {task.story_points}
                                  </span>
                                )}
                                {task.due_date && (
                                  <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                    📅 {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </span>
                                )}
                                {task.subtasks && task.subtasks.length > 0 && (
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                    task.subtasks.filter(st => st.completed).length === task.subtasks.length 
                                    ? 'bg-emerald-100 text-emerald-700' 
                                    : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    ☑ {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                                  </span>
                                )}
                                {task.description && (
                                  <span className="text-gray-400 text-xs" title="Has description">
                                    ≡
                                  </span>
                                )}
                              </div>
                            )}
                            
                            <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-50 w-full">
                              <select 
                                value={task.assignee_id || ''} 
                                onChange={(e) => onAssignTask(task.id, e.target.value || null)}
                                disabled={!canEditTasks}
                                className={`text-[11px] font-medium text-gray-400 bg-transparent outline-none max-w-[120px] truncate ${
                                  canEditTasks ? 'cursor-pointer hover:bg-gray-50 rounded p-1' : 'cursor-not-allowed appearance-none'
                                }`}
                              >
                                <option value="">Unassigned</option>
                                {members.map(m => (
                                  <option key={m.user_id} value={m.user_id}>
                                    {m.profiles?.email}
                                  </option>
                                ))}
                              </select>

                              {assignee && (
                                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm" title={assignee.profiles?.email}>
                                  {assignee.profiles?.email.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {canEditTasks && (
            <div className="mt-auto pt-2 border-t border-gray-200">
              <input 
                type="text"
                placeholder="+ Add a card..."
                value={newTaskContent}
                onChange={(e) => setNewTaskContent(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
                className="w-full p-2.5 text-sm font-medium border text-black rounded-lg mb-2 outline-none focus:border-blue-400 transition-colors bg-white shadow-inner"
              />
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}