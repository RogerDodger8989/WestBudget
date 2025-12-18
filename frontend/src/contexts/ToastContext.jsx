import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let toastIdCounter = 0;

export const ToastProvider = ({ children }) => {
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
    setToasts((prev) => {
      const toast = prev.find((t) => t.id === id);
      if (toast && toast.undoAction) {
        toast.undoAction();
      }
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, handleUndo }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

