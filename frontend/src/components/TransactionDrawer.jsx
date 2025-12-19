import React, { useRef, useState, useEffect } from 'react';
import { X, Tag, FileText, CheckCircle, UploadCloud, Trash2, ChevronRight, PiggyBank, Car } from 'lucide-react';
import { formatAmount, getAmountClassName } from '../utils/formatAmount';
import { api } from '../api';
import { useToast } from '../contexts/ToastContext';

const TransactionDrawer = ({ transaction, onClose, onCategoryChange, onReceiptUpload, categories, onSave, reloadData, vehicles = [] }) => {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [savingsAccounts, setSavingsAccounts] = useState([]);
  const [selectedSavings, setSelectedSavings] = useState({ type: null, id: null }); // 'goal' or 'account', and id
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isLinking, setIsLinking] = useState(false);
  const [isLinkingVehicle, setIsLinkingVehicle] = useState(false);
  
  // Parse amount to determine formatting
  const amountValue = typeof transaction.amount === 'string' 
    ? parseFloat(transaction.amount.replace(/[^\d.-]/g, '')) 
    : transaction.amount;
  const formattedAmount = formatAmount(amountValue);
  const amountClass = getAmountClassName(amountValue);

  useEffect(() => {
    // Load savings goals and accounts
    const loadSavings = async () => {
      try {
        const [goals, accounts] = await Promise.all([
          api.getSavingsGoals(),
          api.getSavingsAccounts()
        ]);
        setSavingsGoals(goals.filter(g => g.status === 'Aktiv'));
        setSavingsAccounts(accounts.filter(a => a.status === 'Aktiv'));
      } catch (error) {
        console.error('Error loading savings:', error);
      }
    };
    loadSavings();

    // Check if transaction is already linked to savings
    const checkExistingLink = async () => {
      try {
        const savingsTransactions = await api.getSavingsTransactions();
        const existingLink = savingsTransactions.find(st => st.transaction_id === transaction.id);
        if (existingLink) {
          if (existingLink.goal_id) {
            setSelectedSavings({ type: 'goal', id: existingLink.goal_id });
          } else if (existingLink.account_id) {
            setSelectedSavings({ type: 'account', id: existingLink.account_id });
          }
        }
      } catch (error) {
        console.error('Error checking savings link:', error);
      }
    };
    checkExistingLink();

    // Check if transaction is already linked to a vehicle
    const checkVehicleLink = async () => {
      try {
        const vehicleExpenses = await api.getVehicleExpenses();
        const existingVehicleExpense = vehicleExpenses.find(ve => ve.transaction_id === transaction.id);
        if (existingVehicleExpense) {
          setSelectedVehicle(existingVehicleExpense.vehicle_id);
        }
      } catch (error) {
        console.error('Error checking vehicle link:', error);
      }
    };
    checkVehicleLink();
  }, [transaction.id]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && onReceiptUpload) {
      onReceiptUpload(transaction.id, file);
    }
  };

  const handleLinkToVehicle = async () => {
    if (isLinkingVehicle) {
      return;
    }

    if (!selectedVehicle) {
      showToast('Välj ett fordon först', { type: 'info' });
      return;
    }

    setIsLinkingVehicle(true);
    try {
      const amountStr = transaction.amount?.replace(/[^\d,.-]/g, '').replace(',', '') || '0';
      const amount = Math.abs(parseFloat(amountStr) || 0);

      await api.linkTransactionToVehicle({
        transaction_id: transaction.id,
        vehicle_id: selectedVehicle,
        amount: amount,
        date: transaction.date,
        category: transaction.category || 'Övrigt',
        description: transaction.title,
        note: `Kopplad från transaktion: ${transaction.title}`
      });

      showToast('Transaktion kopplad till fordon!', { type: 'success' });
      
      if (reloadData) {
        await reloadData();
      }
    } catch (error) {
      console.error('Error linking to vehicle:', error);
      showToast(`Kunde inte koppla till fordon: ${error.message}`, { type: 'error' });
    } finally {
      setIsLinkingVehicle(false);
    }
  };

  const handleLinkToSavings = async (isWithdrawal = false) => {
    // Prevent double-clicks
    if (isLinking) {
      return;
    }

    if (!selectedSavings.type || !selectedSavings.id) {
      showToast('Välj ett spar-konto eller mål först', { type: 'info' });
      return;
    }

    const amountStr = transaction.amount?.replace(/[^\d,.-]/g, '').replace(',', '') || '0';
    const amount = Math.abs(parseFloat(amountStr) || 0);

    // Validate balance if withdrawal
    if (isWithdrawal) {
      const selectedAccount = selectedSavings.type === 'account' 
        ? savingsAccounts.find(acc => Number(acc.id) === Number(selectedSavings.id)) 
        : null;
      const selectedGoal = selectedSavings.type === 'goal' 
        ? savingsGoals.find(goal => Number(goal.id) === Number(selectedSavings.id)) 
        : null;
      
      if (selectedSavings.type === 'account') {
        if (!selectedAccount) {
          showToast('Kontot kunde inte hittas', { type: 'error' });
          return;
        }
        const balance = parseFloat(selectedAccount.balance) || 0;
        if (balance < amount) {
          showToast(
            `Otillräckligt saldo! Kontot har ${formatAmount(balance)} men du försöker ta ut ${formatAmount(amount)}.`,
            { type: 'error', description: 'Kontot har inte tillräckligt med pengar.' }
          );
          return;
        }
      } else if (selectedSavings.type === 'goal') {
        if (!selectedGoal) {
          showToast('Målet kunde inte hittas', { type: 'error' });
          return;
        }
        const currentAmount = parseFloat(selectedGoal.current_amount) || 0;
        if (currentAmount < amount) {
          showToast(
            `Otillräckligt belopp i målet! Målet har ${formatAmount(currentAmount)} men du försöker ta ut ${formatAmount(amount)}.`,
            { type: 'error', description: 'Målet har inte tillräckligt med pengar.' }
          );
          return;
        }
      }
    }

    setIsLinking(true);
    try {
      await api.linkTransactionToSavings({
        transaction_id: transaction.id,
        account_id: selectedSavings.type === 'account' ? selectedSavings.id : null,
        goal_id: selectedSavings.type === 'goal' ? selectedSavings.id : null,
        amount: amount,
        date: transaction.date,
        notes: `Kopplad från transaktion: ${transaction.title}`,
        is_withdrawal: isWithdrawal // Tell backend if this is a withdrawal
      });

      showToast(
        isWithdrawal 
          ? 'Pengarna har tagits ut från sparande!' 
          : 'Transaktion kopplad till sparande!', 
        { type: 'success' }
      );
      
      // Reload data if callback provided
      if (reloadData) {
        await reloadData();
      }
    } catch (error) {
      console.error('Error linking to savings:', error);
      
      // Better error messages - use the message from backend if available
      let errorMessage = error.message || 'Kunde inte koppla till sparande';
      let errorDescription = isWithdrawal
        ? 'Kontot eller målet har inte tillräckligt med pengar.'
        : 'Ett fel uppstod vid koppling till sparande.';
      
      // If backend provided a detailed message, use it
      if (error.originalError && error.originalError.message) {
        errorMessage = error.originalError.message;
      } else if (error.message.includes('Insufficient balance')) {
        errorMessage = 'Otillräckligt saldo på kontot';
      } else if (error.message.includes('Insufficient amount')) {
        errorMessage = 'Otillräckligt belopp i målet';
      }
      
      showToast(errorMessage, { 
        type: 'error',
        description: errorDescription
      });
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between bg-zinc-50 dark:bg-zinc-900/50">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">{transaction.title}</h2>
          <p className="text-sm text-zinc-500">{transaction.date}</p>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        <div className="text-center py-4">
          <span className={`text-4xl font-bold tracking-tight ${amountClass}`}>
            {formattedAmount}
          </span>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
              transaction.status === 'Bokförd' 
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
            }`}>
              {transaction.status}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <Tag size={14} /> Kategori
          </label>
          <div className="relative">
            <select 
              value={transaction.category}
              onChange={(e) => onCategoryChange(transaction.id, e.target.value)}
              className="w-full appearance-none bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 pr-10 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all cursor-pointer"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 rotate-90 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <FileText size={14} /> Underlag & Kvitto
            </label>
            {transaction.receipt && (
              <span className="text-xs text-emerald-500 flex items-center gap-1 font-medium">
                <CheckCircle size={12} /> Kvitto finns
              </span>
            )}
          </div>
          
          <input 
            ref={fileInputRef}
            type="file" 
            accept=".pdf,.png,.jpg,.jpeg,.gif"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-zinc-50 dark:bg-zinc-800/30 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 group"
          >
            <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
              <UploadCloud className="w-6 h-6 text-zinc-400 group-hover:text-indigo-500" />
            </div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Klicka för att ladda upp</p>
            <p className="text-xs text-zinc-500 mt-1">PDF, PNG, JPG (max 16MB)</p>
          </div>
          
          {transaction.receipt_path && (
            <div className="mt-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Kvitto sparat:</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-mono truncate">{transaction.receipt_path}</p>
            </div>
          )}
        </div>

        {/* Link to Savings */}
        {(savingsGoals.length > 0 || savingsAccounts.length > 0) && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <PiggyBank size={14} /> Koppla till Sparande
            </label>
            <div className="relative">
              <select 
                value={selectedSavings.type && selectedSavings.id ? `${selectedSavings.type}_${selectedSavings.id}` : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    setSelectedSavings({ type: null, id: null });
                  } else {
                    const [type, id] = value.split('_');
                    setSelectedSavings({ type, id: parseInt(id) });
                  }
                }}
                className="w-full appearance-none bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 pr-10 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all cursor-pointer"
              >
                <option value="">Ingen koppling</option>
                {savingsAccounts.length > 0 && (
                  <optgroup label="Spar-konton">
                    {savingsAccounts.map(acc => (
                      <option key={`account_${acc.id}`} value={`account_${acc.id}`}>
                        {acc.name} ({formatAmount(acc.balance)})
                      </option>
                    ))}
                  </optgroup>
                )}
                {savingsGoals.length > 0 && (
                  <optgroup label="Sparmål">
                    {savingsGoals.map(goal => (
                      <option key={`goal_${goal.id}`} value={`goal_${goal.id}`}>
                        {goal.name} ({formatAmount(goal.current_amount)} / {formatAmount(goal.target_amount)})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 rotate-90 pointer-events-none" />
            </div>
            {selectedSavings.type && selectedSavings.id && (
              <div className="space-y-2">
                <button
                  onClick={() => handleLinkToSavings(false)}
                  disabled={isLinking}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-400 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
                >
                  {isLinking ? 'Kopplar...' : 'Sätta in som sparande'}
                </button>
                <button
                  onClick={() => handleLinkToSavings(true)}
                  disabled={isLinking}
                  className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-400 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
                >
                  {isLinking ? 'Kopplar...' : 'Ta ut från sparande'}
                </button>
              </div>
            )}
            {selectedSavings.type && selectedSavings.id && (
              <p className="text-xs text-zinc-400 mt-1">
                {transaction.type === 'income' 
                  ? 'Inkomsten kan sättas in i eller tas ut från valt spar-mål eller konto'
                  : 'Utgiften kan kopplas till sparande för att spara eller ta ut motsvarande belopp'}
              </p>
            )}
          </div>
        )}

        {/* Link to Vehicle */}
        {vehicles.length > 0 && transaction.type === 'expense' && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <Car size={14} /> Koppla till Fordon
            </label>
            <div className="relative">
              <select 
                value={selectedVehicle || ''}
                onChange={(e) => setSelectedVehicle(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full appearance-none bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 pr-10 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all cursor-pointer"
              >
                <option value="">Ingen koppling</option>
                {vehicles.filter(v => v.status === 'Aktiv').map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.registration_number} - {vehicle.make_model}
                  </option>
                ))}
              </select>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 rotate-90 pointer-events-none" />
            </div>
            {selectedVehicle && (
              <button
                onClick={handleLinkToVehicle}
                disabled={isLinkingVehicle}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-400 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
              >
                {isLinkingVehicle ? 'Kopplar...' : 'Koppla till Fordon'}
              </button>
            )}
            <p className="text-xs text-zinc-400 mt-1">
              Utgifter kan kopplas till fordon för att skapa fordonskostnader
            </p>
          </div>
        )}

        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 space-y-3 border border-zinc-100 dark:border-zinc-800">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Transaktions-ID</span>
            <span className="font-mono text-zinc-700 dark:text-zinc-300">#{transaction.id.toString().padStart(6, '0')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Bokföringskonto</span>
            <span className="font-mono text-zinc-700 dark:text-zinc-300">
              {transaction.type === 'income' ? '3001' : '4000'}
            </span>
          </div>
        </div>

      </div>

      <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex gap-3">
        {onSave ? (
          <button 
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (selectedSavings.type && selectedSavings.id) {
                await handleLinkToSavings();
              }
              if (onSave) {
                onSave(transaction);
              }
            }}
            className="flex-1 bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            Spara Ändringar
          </button>
        ) : (
          <button 
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (selectedSavings.type && selectedSavings.id) {
                await handleLinkToSavings();
              } else {
                showToast('Välj ett spar-konto eller mål först', { type: 'info' });
              }
            }}
            disabled={!selectedSavings.type || !selectedSavings.id || isLinking}
            className="flex-1 bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLinking ? 'Kopplar...' : selectedSavings.type && selectedSavings.id ? 'Koppla till Sparande' : 'Välj sparande först'}
          </button>
        )}
        <button className="p-3 bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-200 dark:hover:bg-rose-900/40 transition-colors">
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
};

export default TransactionDrawer;

