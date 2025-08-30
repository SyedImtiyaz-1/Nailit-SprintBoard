'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Task, Status, CreateTaskData, UpdateTaskData } from '@/types';
import { useTasks } from '@/contexts/TaskContext';
import { useAuth } from '@/contexts/AuthContext';
import TaskCard from './TaskCard';
import CreateTaskModal from './CreateTaskModal';
import EditTaskModal from './EditTaskModal';
import UndoToast from './UndoToast';
import DarkModeToggle from './DarkModeToggle';
import LoadingSpinner from './LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Plus, LogOut, ArrowDown } from 'lucide-react';

const columns: { id: Status; title: string; color: string }[] = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-400' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-yellow-400' },
  { id: 'done', title: 'Done', color: 'bg-green-400' },
];

export default function KanbanBoard() {
  const { tasks, loading, error, updateTaskStatus, createTask, updateTask, deleteTask, undoLastMove, retryLoadTasks, retryCount, clearError } = useTasks();
  const { logout } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<Status | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const columnRefs = useRef<{ [key in Status]: HTMLDivElement | null }>({
    todo: null,
    'in-progress': null,
    done: null
  });

  // Check connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setConnectionStatus('checking');
        const response = await fetch('http://localhost:3002/tasks');
        if (response.ok) {
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('disconnected');
        }
      } catch (error) {
        setConnectionStatus('disconnected');
      }
    };

    checkConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // Clear drag states when tasks change
  useEffect(() => {
    setDraggedTask(null);
    setDragOverColumn(null);
  }, [tasks]);

  const tasksByStatus = useMemo(() => {
    const grouped = { todo: [], inProgress: [], done: [] } as Record<string, Task[]>;
    
    // Helper function to sort tasks by priority (High -> Medium -> Low)
    const sortByPriority = (taskList: Task[]) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return taskList.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    };
    
    tasks.forEach(task => {
      if (task.status === 'todo') grouped.todo.push(task);
      else if (task.status === 'in-progress') grouped.inProgress.push(task);
      else if (task.status === 'done') grouped.done.push(task);
    });
    
    // Sort each group by priority
    grouped.todo = sortByPriority(grouped.todo);
    grouped.inProgress = sortByPriority(grouped.inProgress);
    grouped.done = sortByPriority(grouped.done);
    
    return grouped;
  }, [tasks]);

  const handleStatusChange = async (id: string, newStatus: Status) => {
    try {
      await updateTaskStatus(id, newStatus);
      setShowUndoToast(true);
    } catch {
      // Error is handled in the context
    }
  };

  const handleCreateTask = async (data: CreateTaskData) => {
    try {
      await createTask(data);
    } catch {
      // Error is handled in the modal
    }
  };

  const handleEditTask = async (id: string, data: UpdateTaskData) => {
    try {
      await updateTask(id, data);
    } catch {
      // Error is handled in the modal
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask(id);
    } catch {
      // Error is handled in the context
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTask(null);
  };

  const handleUndo = () => {
    undoLastMove();
    setShowUndoToast(false);
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    setDraggedTask(task);
    
    // Safety timeout to clear drag states if something goes wrong
    setTimeout(() => {
      setDraggedTask(null);
      setDragOverColumn(null);
    }, 10000); // 10 seconds timeout
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: Status) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDrop = async (e: React.DragEvent, columnId: Status) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    const task = tasks.find(t => t.id === taskId);
    
    // Always clear drag states, regardless of success
    setDragOverColumn(null);
    setDraggedTask(null);
    
    if (task && task.status !== columnId) {
      try {
        await updateTaskStatus(task.id, columnId);
        setShowUndoToast(true);
      } catch {
        // Error is handled in the context
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading tasks..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Tasks</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          
          {/* Retry Information */}
          {retryCount > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                Attempt {retryCount} of 3
              </p>
              {retryCount < 3 && (
                <p className="text-yellow-600 dark:text-yellow-300 text-xs mt-1">
                  Auto-retrying in a few seconds...
                </p>
              )}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={retryLoadTasks}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading ? 'Retrying...' : 'Retry Now'}
            </Button>
            
            <Button
              variant="outline"
              onClick={clearError}
              className="px-6 py-2"
            >
              Clear Error
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="px-6 py-2"
            >
              Refresh Page
            </Button>
          </div>
          
          {/* Additional Help */}
          <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
            <p>If the problem persists, please check your connection and try again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-4 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sprint Board</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Manage your tasks efficiently</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Connection Status Indicator */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' :
                connectionStatus === 'disconnected' ? 'bg-red-500' :
                'bg-yellow-500 animate-pulse'
              }`}></div>
              <span className={`text-xs font-medium ${
                connectionStatus === 'connected' ? 'text-green-600 dark:text-green-400' :
                connectionStatus === 'disconnected' ? 'text-red-600 dark:text-red-400' :
                'text-yellow-600 dark:text-yellow-400'
              }`}>
                {connectionStatus === 'connected' ? 'Connected' :
                 connectionStatus === 'disconnected' ? 'Disconnected' :
                 'Checking...'}
              </span>
            </div>
            
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
            
            <DarkModeToggle />
            
            <Button
              variant="ghost"
              onClick={logout}
              className="font-medium cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Board */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {columns.map((column, index) => (
            <motion.div 
              key={column.id} 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${column.color}`}></div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {column.title}
                  </h2>
                  <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm px-2 py-1 rounded-full">
                    {tasksByStatus[column.id === 'in-progress' ? 'inProgress' : column.id]?.length || 0}
                  </span>
                </div>
                
                {/* Drop Zone Indicator */}
                {draggedTask && draggedTask.status !== column.id && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center space-x-1 text-blue-500 dark:text-blue-400"
                  >
                    <ArrowDown className="w-4 h-4" />
                    <span className="text-xs font-medium">Drag here</span>
                  </motion.div>
                )}
              </div>

              {/* Column Content */}
              <div 
                ref={(el) => {
                  columnRefs.current[column.id] = el;
                }}
                className={`bg-gray-50 dark:bg-gray-900 rounded-lg p-4 min-h-[400px] border-2 border-dashed transition-all duration-200 ${
                  dragOverColumn === column.id 
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 scale-[1.02] shadow-lg' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDrop={(e) => handleDrop(e, column.id)}
                onDragLeave={() => setDragOverColumn(null)}
              >
                <div className="space-y-3">
                  {(tasksByStatus[column.id === 'in-progress' ? 'inProgress' : column.id] || []).map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <TaskCard
                        task={task}
                        onStatusChange={handleStatusChange}
                        onEdit={openEditModal}
                        onDelete={handleDeleteTask}
                        onDragStart={(e) => handleDragStart(e, task)}
                        onDragEnd={handleDragEnd}
                      />
                    </motion.div>
                  ))}
                  
                  {/* Show "Drag Here" when dragging over columns with tasks */}
                  {draggedTask && draggedTask.status !== column.id && (tasksByStatus[column.id === 'in-progress' ? 'inProgress' : column.id] || []).length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-4 border-2 border-dashed border-blue-400 rounded-lg bg-blue-50 dark:bg-blue-900/20"
                    >
                      <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                        Drag here
                      </p>
                    </motion.div>
                  )}
                </div>

                {(tasksByStatus[column.id === 'in-progress' ? 'inProgress' : column.id] || []).length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-gray-400 dark:text-gray-500 mb-2">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 00-2 2v2h2V5z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No tasks yet</p>
                    {draggedTask && draggedTask.status !== column.id && (
                      <p className="text-blue-500 dark:text-blue-400 text-xs mt-2 font-medium">
                        Drag here
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Modals and Toasts */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTask}
      />

      <EditTaskModal
        isOpen={isEditModalOpen}
        task={editingTask}
        onClose={closeEditModal}
        onSubmit={handleEditTask}
      />

      <UndoToast
        isVisible={showUndoToast}
        onUndo={handleUndo}
        onHide={() => setShowUndoToast(false)}
      />
    </div>
  );
}
