'use client';

import { useState, useRef, useEffect } from 'react';

import { Task, Status } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onStatusChange: (id: string, status: Status) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

const priorityVariants = {
  low: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  medium: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  high: 'bg-red-100 text-red-800 hover:bg-red-200',
};

const priorityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export default function TaskCard({ task, onStatusChange, onEdit, onDelete, onDragStart, onDragEnd }: TaskCardProps) {
  const [isFocused, setIsFocused] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFocused) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const currentStatus = task.status;
        if (currentStatus === 'in-progress') {
          onStatusChange(task.id, 'todo');
        } else if (currentStatus === 'done') {
          onStatusChange(task.id, 'in-progress');
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const currentStatus = task.status;
        if (currentStatus === 'todo') {
          onStatusChange(task.id, 'in-progress');
        } else if (currentStatus === 'in-progress') {
          onStatusChange(task.id, 'done');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFocused, task, onStatusChange]);

  return (
    <div
      ref={cardRef}
      className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-lg"
      tabIndex={0}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
          {task.title}
        </h3>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className={priorityVariants[task.priority]}>
            <div className={`w-2 h-2 rounded-full ${
              task.priority === 'high' ? 'bg-red-500' : 
              task.priority === 'medium' ? 'bg-yellow-500' : 
              'bg-gray-500'
            } mr-2`}></div>
            {priorityLabels[task.priority]}
          </Badge>
        </div>
      </div>

      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
        {task.description}
      </p>

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          {new Date(task.createdAt).toLocaleDateString()}
        </span>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
                onDelete(task.id);
              }
            }}
            className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {isFocused && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <span>Use ← → arrow keys to move between columns</span>
            <div className="flex space-x-1">
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                ←
              </kbd>
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                →
              </kbd>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

