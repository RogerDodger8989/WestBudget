import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, X } from 'lucide-react';

const CategoryEditForm = ({ category, onSave, onCancel }) => {
  const [editName, setEditName] = useState(category.name);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSave(editName);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="flex items-center gap-2 flex-1">
      <input
        ref={inputRef}
        type="text"
        value={editName}
        onChange={(e) => setEditName(e.target.value)}
        onKeyPress={handleKeyPress}
        className="flex-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <button
        onClick={() => onSave(editName)}
        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all"
        title="Spara"
      >
        <CheckCircle size={16} />
      </button>
      <button
        onClick={onCancel}
        className="px-3 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium transition-all"
        title="Avbryt"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default CategoryEditForm;

