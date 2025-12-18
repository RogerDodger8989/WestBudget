import { useState, useCallback } from 'react';

let toastIdCounter = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, options = {}) => {
    const id = ++toastIdCounter;
    const toast = {
      id,
      message,
      type: options.type || 'success',
      description: options.description,
      undo: options.undo || false,
      undoAction: options.undoAction,
      duration: options.duration || 5000,
    };

    setToasts((prev) => [...prev, toast]);

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const handleUndo = useCallback((id) => {
    const toast = toasts.find((t) => t.id === id);
    if (toast && toast.undoAction) {
      toast.undoAction();
    }
    removeToast(id);
  }, [toasts, removeToast]);

  return {
    toasts,
    showToast,
    removeToast,
    handleUndo,
  };
};

