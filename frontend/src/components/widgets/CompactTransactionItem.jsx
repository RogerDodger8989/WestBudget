import React from 'react';
import { Check, Plus, FileText } from 'lucide-react';
import { formatAmount, getAmountClassName } from '../../utils/formatAmount';

const CompactTransactionItem = ({ data, onClick, onEditNote }) => {
  if (!data) {
    return null;
  }
  
  const { title, date, amount, type, note, category, status, receipt } = data;
  
  // Parse amount to determine if it's positive or negative
  const amountValue = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d.-]/g, '')) : amount;
  const formattedAmount = formatAmount(amountValue);
  const amountClass = getAmountClassName(amountValue);
  
  return (
    <div 
      className="flex items-center gap-4 px-3 py-2 border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors group cursor-pointer w-full"
      onClick={onClick}
    >
      {/* Title */}
      <div className="font-medium text-zinc-900 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate flex-shrink-0" style={{ minWidth: '150px', maxWidth: '200px' }}>
        {title}
      </div>
      
      {/* Date */}
      <div className="text-sm text-zinc-500 flex-shrink-0" style={{ minWidth: '100px' }}>
        {date}
      </div>
      
      {/* Category */}
      <div className="text-sm flex-shrink-0" style={{ minWidth: '120px' }}>
        <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-400 text-xs">
          {category || 'Övrigt'}
        </span>
      </div>
      
      {/* Note Button */}
      <div className="flex justify-center flex-shrink-0" style={{ minWidth: '32px' }} onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={(e) => { e.stopPropagation(); onEditNote?.(); }}
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

      {/* Amount */}
      <div className={`text-right font-medium flex-shrink-0 flex-1 ${amountClass}`} style={{ minWidth: '100px' }}>
        {formattedAmount}
      </div>
      
      {/* Status */}
      <div className="text-center flex-shrink-0" style={{ minWidth: '80px' }}>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
          status === 'Bokförd' 
            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-500/20' 
            : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/10 dark:text-amber-400 dark:border-amber-500/20'
        }`}>
          {status || 'Bokförd'}
        </span>
      </div>
      
      {/* Receipt */}
      <div className="flex justify-center flex-shrink-0" style={{ minWidth: '24px' }}>
        {receipt ? <FileText size={16} className="text-emerald-500" /> : <div className="w-4 h-4 rounded-full border border-dashed border-zinc-300 dark:border-zinc-700"></div>}
      </div>
    </div>
  );
};

export default CompactTransactionItem;

