import React from 'react';
import { Check, Plus, FileText } from 'lucide-react';

const TransactionItem = ({ data, onClick, onEditNote, isSelected = false, onToggleSelect }) => {
  const { title, date, amount, type, note, category, status, receipt } = data;
  
  return (
    <div className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors group items-center ${
      isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-500' : 'cursor-pointer'
    }`}>
      <div className="col-span-1 flex items-center" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            if (onToggleSelect) onToggleSelect();
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 text-indigo-600 border-zinc-300 rounded focus:ring-indigo-500"
        />
      </div>
      <div onClick={onClick} className="col-span-2 font-medium text-zinc-900 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate cursor-pointer">
        {title}
      </div>
      <div onClick={onClick} className="col-span-2 text-sm text-zinc-500 cursor-pointer">{date}</div>
      <div onClick={onClick} className="col-span-2 hidden sm:block text-sm cursor-pointer">
        <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-400 text-xs">
          {category}
        </span>
      </div>
      
      <div className="col-span-1 hidden sm:flex justify-center" onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={(e) => { e.stopPropagation(); onEditNote(); }}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
            note 
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:scale-110' 
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-500'
          }`}
          title={note || "Lägg till notering"}
        >
          {note ? <Check size={14} /> : <Plus size={14} />}
        </button>
      </div>

      <div onClick={onClick} className={`col-span-2 text-right font-medium cursor-pointer ${type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-zinc-300'}`}>
        {amount}
      </div>
      <div onClick={onClick} className="col-span-1 hidden sm:block text-center cursor-pointer">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
          status === 'Bokförd' 
            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-500/20' 
            : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/10 dark:text-amber-400 dark:border-amber-500/20'
        }`}>
          {status}
        </span>
      </div>
      <div onClick={onClick} className="col-span-1 hidden sm:flex justify-center cursor-pointer">
        {receipt ? <FileText size={16} className="text-emerald-500" /> : <div className="w-4 h-4 rounded-full border border-dashed border-zinc-300 dark:border-zinc-700"></div>}
      </div>
    </div>
  );
};

export default TransactionItem;
