"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { IconButton } from '../atoms/IconButton';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'md' }) => {
  const maxWidthClasses = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full ${maxWidthClasses[maxWidth]} my-auto border border-slate-100 dark:border-slate-700/50 flex flex-col max-h-[88vh] overflow-hidden`}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-5 sm:px-8 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/70 dark:bg-slate-900/60 shrink-0">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex-1">{title}</h3>
              <IconButton 
                icon={<X className="w-5 h-5" />} 
                onClick={onClose} 
                variant="secondary"
                size="sm"
                className="rounded-full shrink-0 ml-4 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              />
            </div>

            {/* Modal Body with proper rounded edges and scroll padding */}
            <div className="p-6 sm:p-8 pb-8 overflow-y-auto overflow-x-hidden flex-1 space-y-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
