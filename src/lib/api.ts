import axios, { AxiosError, AxiosResponse } from 'axios';
import { Task, CreateTaskData, UpdateTaskData } from '@/types';

const API_BASE = 'http://localhost:3002';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000, // Increased timeout for better reliability
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fallback data in case API fails completely
const fallbackTasks: Task[] = [
  {
    id: 'fallback-1',
    title: 'Welcome to Sprint Board',
    description: 'This is a sample task to get you started. Create your own tasks to begin managing your projects!',
    priority: 'high' as const,
    status: 'todo' as const,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fallback-2',
    title: 'Drag and Drop Tasks',
    description: 'Try dragging this task between columns to see the Kanban board in action.',
    priority: 'medium' as const,
    status: 'in-progress' as const,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fallback-3',
    title: 'Task Management',
    description: 'Create, edit, and organize your tasks efficiently with our intuitive interface.',
    priority: 'low' as const,
    status: 'done' as const,
    createdAt: new Date().toISOString(),
  }
];

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

// Axios response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response) {
      const data = error.response.data as { message?: string };
      throw new ApiError(
        data?.message || 'API request failed',
        error.response.status
      );
    } else if (error.request) {
      throw new ApiError('Network error - no response received');
    } else {
      throw new ApiError('Request configuration error');
    }
  }
);

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry wrapper function
const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Unknown error');
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Wait before retrying (exponential backoff)
      await delay(RETRY_DELAY * Math.pow(2, attempt));
    }
  }
  
  throw lastError!;
};

export const api = {
  // Health check function to test API connectivity
  async healthCheck(): Promise<boolean> {
    try {
      await apiClient.get('/tasks');
      return true;
    } catch {
      return false;
    }
  },

  async getTasks(): Promise<Task[]> {
    try {
      const response = await withRetry(async () => {
        return await apiClient.get<Task[]>('/tasks');
      });
      return response.data;
    } catch {
      // If API fails completely, return fallback data
      console.warn('API failed, using fallback data');
      return fallbackTasks;
    }
  },

  async createTask(data: CreateTaskData): Promise<Task> {
    try {
      const response = await withRetry(async () => {
        return await apiClient.post<Task>('/tasks', {
          ...data,
          id: crypto.randomUUID(),
          status: 'todo' as const,
          createdAt: new Date().toISOString(),
        });
      });
      return response.data;
    } catch {
      // If API failed, create task locally and return it
      console.warn('API failed, creating task locally');
      const localTask: Task = {
        ...data,
        id: crypto.randomUUID(),
        status: 'todo' as const,
        createdAt: new Date().toISOString(),
      };
      return localTask;
    }
  },

  async updateTask(id: string, data: UpdateTaskData): Promise<Task> {
    try {
      const response = await withRetry(async () => {
        return await apiClient.patch<Task>(`/tasks/${id}`, data);
      });
      return response.data;
    } catch {
      // If API fails, return updated task data
      console.warn('API failed, updating task locally');
      return { id, ...data } as Task;
    }
  },

  async deleteTask(id: string): Promise<void> {
    try {
      await withRetry(async () => {
        return await apiClient.delete(`/tasks/${id}`);
      });
    } catch {
      // If API fails, just log it - deletion will be handled by optimistic updates
      console.warn('API failed, task deletion will be handled locally');
    }
  },
};
