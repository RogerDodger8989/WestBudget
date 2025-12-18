import React, { useEffect, useState } from 'react';
import { X, Undo2, CheckCircle2, AlertCircle, Info } from 'lucide-react';

const Toast = ({ toast, onClose, onUndo }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Start progress bar animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - (100 / (5000 / 50)); // 5000ms / 50ms updates = 100 steps
      });
    }, 50);

    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onClose]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 size={18} className="text-emerald-500" />;
      case 'error':
        return <AlertCircle size={18} className="text-rose-500" />;
      case 'info':
        return <Info size={18} className="text-indigo-500" />;
      default:
        return <CheckCircle2 size={18} className="text-indigo-500" />;
    }
  };

  const getBgColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
      case 'error':
        return 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800';
      case 'info':
        return 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800';
      default:
        return 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800';
    }
  };

  return (
    <div className={`relative overflow-hidden ${getBgColor()} border rounded-xl shadow-lg min-w-[320px] max-w-md animate-slide-in-right`}>
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full bg-indigo-500 transition-all duration-50 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-4 flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-900 dark:text-white">
            {toast.message}
          </p>
          {toast.description && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {toast.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {toast.undo && (
            <button
              onClick={() => {
                if (onUndo) {
                  onUndo();
                }
                onClose();
              }}
              className="px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Undo2 size={14} />
              Ångra
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;

