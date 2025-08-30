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
  | { type: 'REMOVE_LAST_MOVE' };

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
      return { ...state, tasks: action.payload, loading: false, error: null };
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
    default:
      return state;
  }
}

export function TaskProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(taskReducer, {
    tasks: [],
    loading: true,
    error: null,
    moveHistory: []
  });

  const loadTasks = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const fetchedTasks = await api.getTasks();
      dispatch({ type: 'SET_TASKS', payload: fetchedTasks });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to load tasks' });
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const createTask = useCallback(async (data: CreateTaskData) => {
    try {
      const newTask = await api.createTask(data);
      dispatch({ type: 'ADD_TASK', payload: newTask });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to create task' });
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
    } catch (err) {
      // Rollback on failure
      dispatch({ type: 'UPDATE_TASK', payload: { id, updates: { status: oldStatus } } });
      dispatch({ type: 'REMOVE_LAST_MOVE' });
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to update task status' });
      throw err;
    }
  }, [state.tasks]);

  const updateTask = useCallback(async (id: string, data: UpdateTaskData) => {
    try {
      const updatedTask = await api.updateTask(id, data);
      dispatch({ type: 'UPDATE_TASK', payload: { id, updates: updatedTask } });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to update task' });
      throw err;
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    try {
      await api.deleteTask(id);
      dispatch({ type: 'DELETE_TASK', payload: id });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to delete task' });
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

