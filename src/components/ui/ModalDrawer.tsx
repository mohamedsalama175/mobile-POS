import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export const ModalDrawer: React.FC<ModalDrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'lg',
  className = '',
}) => {
  // Lock body scroll and listen for Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Sheet / Modal Container (Bottom-sheet on mobile, centered dialog on tablet) */}
      <div
        className={`
          relative w-full ${maxWidthClasses} max-h-[92vh] sm:max-h-[88vh]
          rounded-t-3xl sm:rounded-2xl border-t sm:border border-gray-200 dark:border-[#2D333F]
          bg-white dark:bg-[#16181D] shadow-2xl flex flex-col overflow-hidden
          animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200
          ${className}
        `}
      >
        {/* Mobile Drag Handle */}
        <div className="sm:hidden w-full flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
        </div>

        {/* Header */}
        {(Boolean(title) || Boolean(description)) && (
          <div className="px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between border-b border-gray-100 dark:border-[#2D333F]/70 shrink-0">
            <div className="min-w-0 flex-1 pe-3">
              {title && (
                <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-gray-100 truncate">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                  {description}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Body Content with Scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
};
