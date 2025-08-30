'use client';

import { createContext, useContext, useEffect, ReactNode, useCallback, useReducer } from 'react';
import { Task, CreateTaskData, UpdateTaskData, Status } from '@/types';
import { api } from '@/lib/api';

// State management with reducer for better performance
interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  moveHistory: MoveHistory[];
  retryCount: number;
  lastErrorTime: number | null;
}

interface MoveHistory {
  taskId: string;
  fromStatus: Status;
  toStatus: Status;
  timestamp: number;
}

type TaskAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'ADD_MOVE_HISTORY'; payload: MoveHistory }
  | { type: 'REMOVE_LAST_MOVE' }
  | { type: 'INCREMENT_RETRY_COUNT' }
  | { type: 'RESET_RETRY_COUNT' }
  | { type: 'SET_LAST_ERROR_TIME'; payload: number };

interface TaskContextType {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  createTask: (data: CreateTaskData) => Promise<void>;
  updateTaskStatus: (id: string, status: Status) => Promise<void>;
  updateTask: (id: string, data: UpdateTaskData) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  undoLastMove: () => void;
  canUndo: boolean;
  clearError: () => void;
  retryLoadTasks: () => Promise<void>;
  retryCount: number;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

// Reducer function for state management
function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_TASKS':
      return { ...state, tasks: action.payload, loading: false, error: null, retryCount: 0 };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? { ...task, ...action.payload.updates } : task
        )
      };
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(task => task.id !== action.payload) };
    case 'ADD_MOVE_HISTORY':
      return { ...state, moveHistory: [...state.moveHistory, action.payload] };
    case 'REMOVE_LAST_MOVE':
      return { ...state, moveHistory: state.moveHistory.slice(0, -1) };
    case 'INCREMENT_RETRY_COUNT':
      return { ...state, retryCount: state.retryCount + 1 };
    case 'RESET_RETRY_COUNT':
      return { ...state, retryCount: 0 };
    case 'SET_LAST_ERROR_TIME':
      return { ...state, lastErrorTime: action.payload };
    default:
      return state;
  }
}

export function TaskProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(taskReducer, {
    tasks: [],
    loading: true,
    error: null,
    moveHistory: [],
    retryCount: 0,
    lastErrorTime: null
  });

  const loadTasks = useCallback(async (isRetry: boolean = false) => {
    try {
      if (isRetry) {
        dispatch({ type: 'INCREMENT_RETRY_COUNT' });
      }
      
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const fetchedTasks = await api.getTasks();
      dispatch({ type: 'SET_TASKS', payload: fetchedTasks });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tasks';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_LAST_ERROR_TIME', payload: Date.now() });
    }
  }, []);

  const retryLoadTasks = useCallback(async () => {
    await loadTasks(true);
  }, [loadTasks]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Auto-retry mechanism for failed loads
  useEffect(() => {
    if (state.error && state.retryCount < 3 && !state.loading) {
      const timeSinceLastError = state.lastErrorTime ? Date.now() - state.lastErrorTime : 0;
      
      // Wait 5 seconds before auto-retry
      if (timeSinceLastError > 5000) {
        const timer = setTimeout(() => {
          loadTasks(true);
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [state.error, state.retryCount, state.loading, state.lastErrorTime, loadTasks]);

  const createTask = useCallback(async (data: CreateTaskData) => {
    try {
      const newTask = await api.createTask(data);
      dispatch({ type: 'ADD_TASK', payload: newTask });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create task';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw err;
    }
  }, []);

  const updateTaskStatus = useCallback(async (id: string, newStatus: Status) => {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    const oldStatus = task.status;
    
    // Optimistic update
    dispatch({ type: 'UPDATE_TASK', payload: { id, updates: { status: newStatus } } });

    // Add to move history for undo
    const moveRecord: MoveHistory = {
      taskId: id,
      fromStatus: oldStatus,
      toStatus: newStatus,
      timestamp: Date.now(),
    };
    dispatch({ type: 'ADD_MOVE_HISTORY', payload: moveRecord });

    try {
      await api.updateTask(id, { status: newStatus });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (err) {
      // Rollback on failure
      dispatch({ type: 'UPDATE_TASK', payload: { id, updates: { status: oldStatus } } });
      dispatch({ type: 'REMOVE_LAST_MOVE' });
      const errorMessage = err instanceof Error ? err.message : 'Failed to update task status';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw err;
    }
  }, [state.tasks]);

  const updateTask = useCallback(async (id: string, data: UpdateTaskData) => {
    try {
      const updatedTask = await api.updateTask(id, data);
      dispatch({ type: 'UPDATE_TASK', payload: { id, updates: updatedTask } });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update task';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw err;
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    try {
      await api.deleteTask(id);
      dispatch({ type: 'DELETE_TASK', payload: id });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete task';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw err;
    }
  }, []);

  const undoLastMove = useCallback(() => {
    if (state.moveHistory.length === 0) return;

    const lastMove = state.moveHistory[state.moveHistory.length - 1];
    
    // Optimistic rollback
    dispatch({ type: 'UPDATE_TASK', payload: { id: lastMove.taskId, updates: { status: lastMove.fromStatus } } });

    // Remove from history
    dispatch({ type: 'REMOVE_LAST_MOVE' });

    // Update server
    api.updateTask(lastMove.taskId, { status: lastMove.fromStatus }).catch(() => {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to undo move on server' });
    });
  }, [state.moveHistory]);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'RESET_RETRY_COUNT' });
  }, []);

  const canUndo = state.moveHistory.length > 0;

  return (
    <TaskContext.Provider value={{
      tasks: state.tasks,
      loading: state.loading,
      error: state.error,
      createTask,
      updateTaskStatus,
      updateTask,
      deleteTask,
      undoLastMove,
      canUndo,
      clearError,
      retryLoadTasks,
      retryCount: state.retryCount,
    }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}

