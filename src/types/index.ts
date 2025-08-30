export type Priority = 'low' | 'medium' | 'high';
export type Status = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  createdAt: string;
}

export interface CreateTaskData {
  title: string;
  description: string;
  priority: Priority;
}

export interface UpdateTaskData {
  status?: Status;
  title?: string;
  description?: string;
  priority?: Priority;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export interface TaskContextType {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  createTask: (data: CreateTaskData) => Promise<void>;
  updateTaskStatus: (id: string, status: Status) => Promise<void>;
  updateTask: (id: string, data: UpdateTaskData) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

