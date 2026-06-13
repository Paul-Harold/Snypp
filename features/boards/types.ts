// features/boards/types.ts
// Shared task shapes. Nullable fields use `null` (not undefined) because
// supabase-js strips undefined keys from update payloads — sending null is
// the only way to clear a column.

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  list_id: string;
  content: string;
  position: number;
  assignee_id?: string | null;
  description?: string | null;
  due_date?: string | null;
  story_points?: number | null;
  labels?: string[] | null;
  subtasks?: Subtask[] | null;
}
