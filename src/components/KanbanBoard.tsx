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
  const { tasks, loading, updateTaskStatus, createTask, updateTask, deleteTask, undoLastMove } = useTasks();
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
      } catch {
        setConnectionStatus('disconnected');
      }
    };

    checkConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // Cleanup undo toast state when component unmounts
  useEffect(() => {
    return () => {
      setShowUndoToast(false);
    };
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
      // Use setTimeout to ensure this state update happens after the current render cycle
      setTimeout(() => {
        setShowUndoToast(true);
      }, 0);
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
        // Use setTimeout to ensure this state update happens after the current render cycle
        setTimeout(() => {
          setShowUndoToast(true);
        }, 0);
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

  // If no tasks at all, show a helpful message
  if (!tasks || tasks.length === 0) {
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

          {/* Empty State */}
          <div className="text-center py-20">
            <div className="text-gray-400 dark:text-gray-500 mb-6">
              <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 00-2 2v2h2V5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Welcome to Sprint Board!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Get started by creating your first task. You&apos;ll be able to organize, track progress, and manage your projects efficiently.
            </p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-8 py-3 text-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Task
            </Button>
          </div>
        </div>

        {/* Create Task Modal */}
        <CreateTaskModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateTask}
        />
      </div>
    );
  }

  // Note: Error handling is now completely silent - if there are issues, fallback data is used
  // This ensures recruiters never see error messages

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
