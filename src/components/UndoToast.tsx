'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Undo2 } from 'lucide-react';

interface UndoToastProps {
  isVisible: boolean;
  onUndo: () => void;
  onHide: () => void;
}

export default function UndoToast({ isVisible, onUndo, onHide }: UndoToastProps) {
  const [timeLeft, setTimeLeft] = useState(5);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onHideRef = useRef(onHide);

  // Update ref when onHide changes
  useEffect(() => {
    onHideRef.current = onHide;
  }, [onHide]);

  // Safe hide function that schedules the call for the next tick
  const safeHide = useCallback(() => {
    // Use setTimeout to ensure this runs after the current render cycle
    setTimeout(() => {
      onHideRef.current();
    }, 0);
  }, []);

  useEffect(() => {
    if (!isVisible) {
      // Clear any existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    setTimeLeft(5);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Clear timer first
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          // Use safe hide to avoid React state update conflicts
          safeHide();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isVisible, safeHide]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-4 sm:bottom-6 left-2 sm:left-1/2 right-2 sm:right-auto transform sm:-translate-x-1/2 z-50"
      >
        <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg shadow-lg px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 dark:text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium text-sm sm:text-base">Task moved successfully</span>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Button
                onClick={onUndo}
                size="sm"
                className="text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4 cursor-pointer"
              >
                <Undo2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Undo
              </Button>
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-sm text-gray-300 dark:text-gray-600">{timeLeft}s</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

