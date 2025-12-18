import React from 'react';
import Toast from './Toast';

const ToastContainer = ({ toasts, onClose, onUndo }) => {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 pointer-events-none items-center">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            toast={toast}
            onClose={() => onClose(toast.id)}
            onUndo={() => onUndo && onUndo(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;

