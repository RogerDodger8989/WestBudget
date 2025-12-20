import React from 'react';
import TransactionItem from '../TransactionItem';

const TransactionListWidget = ({ widget, data, onTransactionClick, onNoteClick }) => {
  const { limit = 5, showCategory = true } = widget.config || {};
  const transactions = data?.transactions || [];

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500 dark:text-zinc-400 text-sm">
        Inga transaktioner
      </div>
    );
  }

  return (
    <div className="w-full">
      {transactions.filter(t => t != null && t.id != null).slice(0, limit).map(transaction => (
        <TransactionItem
          key={transaction.id}
          data={transaction}
          onClick={() => onTransactionClick?.(transaction)}
          onEditNote={() => onNoteClick?.(transaction.id)}
        />
      ))}
      {transactions.length > limit && (
        <div className="text-center pt-2 text-xs text-zinc-500 dark:text-zinc-400">
          +{transactions.length - limit} fler...
        </div>
      )}
    </div>
  );
};

export default TransactionListWidget;

