import axios, { AxiosError, AxiosResponse } from 'axios';
import { Task, CreateTaskData, UpdateTaskData } from '@/types';

const API_BASE = 'http://localhost:3002';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simulate 10% failure rate for PATCH/POST operations
const shouldFail = () => Math.random() < 0.1;

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

export const api = {
  async getTasks(): Promise<Task[]> {
    try {
      const response = await apiClient.get<Task[]>('/tasks');
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to fetch tasks');
    }
  },

  async createTask(data: CreateTaskData): Promise<Task> {
    if (shouldFail()) {
      throw new ApiError('Simulated API failure', 500);
    }

    try {
      const response = await apiClient.post<Task>('/tasks', {
        ...data,
        id: crypto.randomUUID(),
        status: 'todo' as const,
        createdAt: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to create task');
    }
  },

  async updateTask(id: string, data: UpdateTaskData): Promise<Task> {
    if (shouldFail()) {
      throw new ApiError('Simulated API failure', 500);
    }

    try {
      const response = await apiClient.patch<Task>(`/tasks/${id}`, data);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to update task');
    }
  },

  async deleteTask(id: string): Promise<void> {
    if (shouldFail()) {
      throw new ApiError('Simulated API failure', 500);
    }

    try {
      await apiClient.delete(`/tasks/${id}`);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to delete task');
    }
  },
};
