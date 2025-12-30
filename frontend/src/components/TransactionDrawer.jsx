import React, { useRef, useState, useEffect } from 'react';
import { X, Tag, FileText, CheckCircle, UploadCloud, Trash2, ChevronRight, PiggyBank, Car, Receipt, Plus } from 'lucide-react';
import { formatAmount, getAmountClassName } from '../utils/formatAmount';
import { api } from '../api';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeButtonClass, getThemeTextClass, getThemeBgClass, getThemeBorderClass, getThemeRingClass } from '../utils/getThemeClasses';
import ImageLightbox from './ImageLightbox';

const TransactionDrawer = ({ transaction, onClose, onCategoryChange, onReceiptUpload, categories, onSave, reloadData, vehicles = [] }) => {
  const { showToast } = useToast();
  const { colorTheme } = useTheme();
  const fileInputRef = useRef(null);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [savingsAccounts, setSavingsAccounts] = useState([]);
  const [selectedSavings, setSelectedSavings] = useState({ type: null, id: null }); // 'goal' or 'account', and id
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loans, setLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loanPaymentData, setLoanPaymentData] = useState({ principal_paid: '', interest_paid: '', extra_payment: '' });
  const [isLinking, setIsLinking] = useState(false);
  const [isLinkingVehicle, setIsLinkingVehicle] = useState(false);
  const [isLinkingLoan, setIsLinkingLoan] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [lightboxImages, setLightboxImages] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Parse receipt paths (support both old single path and new JSON array)
  const parseReceiptPaths = (receiptPathData) => {
    if (!receiptPathData) return [];
    try {
      const parsed = JSON.parse(receiptPathData);
      return Array.isArray(parsed) ? parsed : [receiptPathData];
    } catch {
      return [receiptPathData];
    }
  };

  const receiptPaths = parseReceiptPaths(transaction.receipt_path);

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

    // Load loans
    const loadLoans = async () => {
      try {
        const loansData = await api.getLoans();
        const activeLoans = loansData.filter(l => l.status === 'Aktiv');
        setLoans(activeLoans);
        console.log('[TransactionDrawer] Loaded loans:', activeLoans.length, activeLoans);
      } catch (error) {
        console.error('[TransactionDrawer] Error loading loans:', error);
        setLoans([]);
      }
    };
    loadLoans();

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

  const handleCreateCategory = async () => {
    const trimmedName = newCategoryName.trim();

    if (!trimmedName) {
      showToast('Kategorinamn kan inte vara tomt', { type: 'error' });
      return;
    }

    // Kontrollera om kategori redan finns (case-insensitive)
    const exists = categories.some(cat => cat.toLowerCase() === trimmedName.toLowerCase());
    if (exists) {
      showToast('En kategori med detta namn finns redan', { type: 'error' });
      return;
    }

    setIsCreatingCategory(true);
    try {
      await api.createCategory(trimmedName);
      showToast('Kategori skapad!', { type: 'success' });

      // Uppdatera transaktionen med den nya kategorin
      onCategoryChange(transaction.id, trimmedName);

      // Reload data för att få uppdaterad kategorilista
      if (reloadData) {
        await reloadData();
      }

      setIsAddingCategory(false);
      setNewCategoryName('');
    } catch (error) {
      console.error('Error creating category:', error);
      showToast(error.message || 'Kunde inte skapa kategori. Kategorin kanske redan finns.', { type: 'error' });
    } finally {
      setIsCreatingCategory(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between bg-zinc-50 dark:bg-zinc-900/50">
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

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-6">

        <div className="text-center py-4">
          <span className={`text-4xl font-bold tracking-tight ${amountClass}`}>
            {formattedAmount}
          </span>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${transaction.status === 'Bokförd'
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
              }`}>
              {transaction.status}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <Tag size={14} /> Kategori
            </label>
            {!isAddingCategory && (
              <button
                onClick={() => setIsAddingCategory(true)}
                className={`text-xs ${getThemeTextClass(colorTheme, false)} dark:${getThemeTextClass(colorTheme, true)} hover:opacity-80 flex items-center gap-1 shrink-0`}
              >
                <Plus size={12} />
                Lägg till kategori
              </button>
            )}
          </div>

          {isAddingCategory ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateCategory();
                    } else if (e.key === 'Escape') {
                      setIsAddingCategory(false);
                      setNewCategoryName('');
                    }
                  }}
                  placeholder="Nytt kategorinamn"
                  autoFocus
                  className={`flex-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 ${getThemeRingClass(colorTheme)}`}
                />
                <button
                  onClick={handleCreateCategory}
                  disabled={isCreatingCategory || !newCategoryName.trim()}
                  className={`px-4 py-2 disabled:bg-zinc-400 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${getThemeButtonClass(colorTheme, 'primary')}`}
                >
                  {isCreatingCategory ? 'Skapar...' : 'Spara'}
                </button>
                <button
                  onClick={() => {
                    setIsAddingCategory(false);
                    setNewCategoryName('');
                  }}
                  className={getThemeButtonClass(colorTheme, 'outline') + ' px-4 py-2 rounded-xl text-sm font-medium transition-all'}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <select
                value={transaction.category}
                onChange={(e) => onCategoryChange(transaction.id, e.target.value)}
                className={`w-full appearance-none bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 pr-10 text-zinc-900 dark:text-white focus:ring-2 ${getThemeRingClass(colorTheme)} focus:border-transparent outline-none transition-all cursor-pointer`}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 rotate-90 pointer-events-none" />
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <FileText size={14} /> Underlag & Kvitto
            </label>
            {receiptPaths.length > 0 && (
              <span className="text-xs text-emerald-500 flex items-center gap-1 font-medium">
                <CheckCircle size={12} /> {receiptPaths.length} kvitto{receiptPaths.length !== 1 ? 'n' : ''}
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

          {/* Visa alla kvitton som thumbnails */}
          {receiptPaths.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {receiptPaths.map((receiptPath, index) => {
                // Konstruera bild-URL
                let imageUrl;
                const normalizedPath = receiptPath.replace(/\\/g, '/');

                if (receiptPath.startsWith('http://') || receiptPath.startsWith('https://')) {
                  imageUrl = receiptPath;
                } else if (receiptPath.includes(':\\') || (receiptPath.startsWith('/') && !receiptPath.startsWith('/uploads'))) {
                  const filename = normalizedPath.split(/[/\\]/).pop();
                  imageUrl = `/uploads/${filename}`;
                } else {
                  let pathToUse = normalizedPath;
                  if (pathToUse.startsWith('uploads/')) {
                    pathToUse = pathToUse.replace('uploads/', '');
                  }
                  if (pathToUse.startsWith('kvitto/')) {
                    imageUrl = `/uploads/${pathToUse}`;
                  } else {
                    imageUrl = `/uploads/kvitto/${pathToUse}`;
                  }
                }

                const isImage = /\.(png|jpg|jpeg|gif|webp)$/i.test(receiptPath);
                const isPdf = /\.pdf$/i.test(receiptPath);

                return (
                  <div key={index} className="relative group">
                    {isImage ? (
                      <img
                        src={imageUrl}
                        alt={`Kvitto ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:opacity-90 transition-opacity"
                        onDoubleClick={() => {
                          // Filtrera bara bilder för lightbox
                          const imagePaths = receiptPaths.filter(p => /\.(png|jpg|jpeg|gif|webp)$/i.test(p));
                          const imageIndex = imagePaths.indexOf(receiptPath);
                          if (imageIndex !== -1) {
                            setLightboxImages(imagePaths);
                            setLightboxIndex(imageIndex);
                          }
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : isPdf ? (
                      <div className="w-full h-32 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 flex flex-col items-center justify-center">
                        <FileText size={32} className="text-zinc-400 mb-1" />
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">PDF</p>
                        <a
                          href={imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Öppna
                        </a>
                      </div>
                    ) : (
                      <div className="w-full h-32 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 flex flex-col items-center justify-center">
                        <FileText size={32} className="text-zinc-400 mb-1" />
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">Fil</p>
                        <a
                          href={imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Öppna
                        </a>
                      </div>
                    )}

                    {/* Ta bort-knapp */}
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (window.confirm('Är du säker på att du vill ta bort detta kvitto?')) {
                          try {
                            await api.deleteTransactionReceipt(transaction.id, receiptPath);
                            showToast('Kvitto borttaget!', { type: 'success' });
                            if (reloadData) await reloadData();
                          } catch (error) {
                            console.error('Kunde inte ta bort kvitto:', error);
                            showToast('Kunde inte ta bort kvitto', { type: 'error' });
                          }
                        }
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Ta bort kvitto"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Upload-område (visas alltid så man kan lägga till fler) */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-zinc-50 dark:bg-zinc-800/30 group ${colorTheme === 'indigo' ? 'hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10' :
                colorTheme === 'blue' ? 'hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10' :
                  colorTheme === 'emerald' ? 'hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10' :
                    colorTheme === 'purple' ? 'hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/10' :
                      colorTheme === 'rose' ? 'hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10' :
                        'hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10'
              }`}
          >
            <div className={`w-12 h-12 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform`}>
              <UploadCloud className={`w-6 h-6 text-zinc-400 ${colorTheme === 'indigo' ? 'group-hover:text-indigo-500' :
                  colorTheme === 'blue' ? 'group-hover:text-blue-500' :
                    colorTheme === 'emerald' ? 'group-hover:text-emerald-500' :
                      colorTheme === 'purple' ? 'group-hover:text-purple-500' :
                        colorTheme === 'rose' ? 'group-hover:text-rose-500' :
                          'group-hover:text-amber-500'
                }`} />
            </div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 text-center px-2">
              {receiptPaths.length > 0 ? 'Lägg till ytterligare kvitto' : 'Klicka för att ladda upp'}
            </p>
            <p className="text-xs text-zinc-500 mt-1">PDF, PNG, JPG (max 16MB)</p>
          </div>
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
                className={`w-full appearance-none bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 pr-10 text-zinc-900 dark:text-white focus:ring-2 ${getThemeRingClass(colorTheme)} focus:border-transparent outline-none transition-all cursor-pointer`}
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
                className={`w-full appearance-none bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 pr-10 text-zinc-900 dark:text-white focus:ring-2 ${getThemeRingClass(colorTheme)} focus:border-transparent outline-none transition-all cursor-pointer`}
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
                className={`w-full mt-2 flex items-center justify-center gap-2 disabled:bg-zinc-400 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all ${getThemeButtonClass(colorTheme, 'primary')}`}
              >
                {isLinkingVehicle ? 'Kopplar...' : 'Koppla till Fordon'}
              </button>
            )}
            <p className="text-xs text-zinc-400 mt-1">
              Utgifter kan kopplas till fordon för att skapa fordonskostnader
            </p>
          </div>
        )}

        {/* Link to Loan */}
        {transaction.type === 'expense' && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <Receipt size={14} /> Koppla till Lån
            </label>

            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3 mb-2 border border-zinc-200 dark:border-zinc-700">
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                <strong>💡 Tips:</strong> Koppla en utgiftstransaktion till ett lån för att registrera en lånebetalning.
                Lånets skuld uppdateras automatiskt.
              </p>
            </div>

            {loans.length === 0 ? (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  <strong>ℹ️ Ingen koppling möjlig:</strong> Du har inga aktiva lån ännu.
                  Skapa ett lån i fliken "Lån" först.
                </p>
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedLoan || ''}
                  onChange={(e) => setSelectedLoan(e.target.value ? parseInt(e.target.value) : null)}
                  className={`w-full appearance-none bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 pr-10 text-zinc-900 dark:text-white focus:ring-2 ${getThemeRingClass(colorTheme)} focus:border-transparent outline-none transition-all cursor-pointer`}
                >
                  <option value="">Välj lån...</option>
                  {loans.map(loan => (
                    <option key={loan.id} value={loan.id}>
                      {loan.name} - {loan.lender} (Återstående: {formatAmount(-loan.current_balance)})
                    </option>
                  ))}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 rotate-90 pointer-events-none" />
              </div>
            )}
            {selectedLoan && (
              <div className="space-y-2 mt-2">
                <div className={`${getThemeBgClass(colorTheme, false)} dark:${getThemeBgClass(colorTheme, true)} rounded-lg p-3 border ${getThemeBorderClass(colorTheme)}`}>
                  <p className={`text-xs font-medium ${getThemeTextClass(colorTheme, false)} dark:${getThemeTextClass(colorTheme, true)} mb-2`}>
                    Fyll i betalningsdetaljer:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                        Amortering * <span className="text-zinc-400">(betalar av lånet)</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={loanPaymentData.principal_paid}
                        onChange={(e) => setLoanPaymentData({ ...loanPaymentData, principal_paid: e.target.value })}
                        placeholder="0.00"
                        className={`w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 ${getThemeRingClass(colorTheme)}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                        Ränta * <span className="text-zinc-400">(räntekostnad)</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={loanPaymentData.interest_paid}
                        onChange={(e) => setLoanPaymentData({ ...loanPaymentData, interest_paid: e.target.value })}
                        placeholder="0.00"
                        className={`w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 ${getThemeRingClass(colorTheme)}`}
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                      Extra amortering <span className="text-zinc-400">(valfritt)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={loanPaymentData.extra_payment}
                      onChange={(e) => setLoanPaymentData({ ...loanPaymentData, extra_payment: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <button
                  onClick={handleLinkToLoan}
                  disabled={isLinkingLoan || !loanPaymentData.principal_paid || !loanPaymentData.interest_paid}
                  className={`w-full flex items-center justify-center gap-2 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-sm font-medium transition-all ${getThemeButtonClass(colorTheme, 'primary')}`}
                >
                  {isLinkingLoan ? 'Kopplar...' : 'Koppla till Lån'}
                </button>
                {loanPaymentData.principal_paid && loanPaymentData.interest_paid && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                    Totalt: {formatAmount(-(parseFloat(loanPaymentData.principal_paid || 0) + parseFloat(loanPaymentData.interest_paid || 0) + parseFloat(loanPaymentData.extra_payment || 0)))}
                  </p>
                )}
              </div>
            )}
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

      <div className="p-4 sm:p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex gap-2 sm:gap-3">
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
            className={`flex-1 ${getThemeButtonClass(colorTheme, 'primary')} font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity`}
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
            className={`flex-1 ${getThemeButtonClass(colorTheme, 'primary')} font-semibold py-3 px-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm`}
          >
            <span className="block text-center">
              {isLinking ? 'Kopplar...' : selectedSavings.type && selectedSavings.id ? 'Koppla till Sparande' : 'Välj sparande först'}
            </span>
          </button>
        )}
        <button
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (!transaction || !transaction.id) {
              showToast('Kunde inte radera: Transaktion saknar ID', { type: 'error' });
              return;
            }

            // Save transaction data for undo
            const transactionData = { ...transaction };

            try {
              // Delete transaction (backend will move receipt file to deleted folder)
              await api.deleteTransaction(transaction.id);

              // Close drawer
              if (onClose) {
                onClose();
              }

              // Reload data
              if (reloadData) {
                await reloadData();
              }

              // Show toast with undo
              showToast('Transaktion raderad!', {
                type: 'success',
                undo: true,
                undoAction: async () => {
                  try {
                    // Convert amount from display format to numeric string for API
                    let amountValue = transactionData.amount;
                    if (typeof amountValue === 'string') {
                      // Remove "kr", spaces, and convert comma to dot
                      amountValue = amountValue.replace(/[^\d.,-]/g, '').replace(',', '.');
                    }
                    const numericAmount = parseFloat(amountValue);

                    if (isNaN(numericAmount)) {
                      throw new Error(`Ogiltigt belopp för transaktion "${transactionData.title}"`);
                    }

                    // Recreate transaction with original data (backend will restore receipt file)
                    await api.createTransaction({
                      title: transactionData.title,
                      date: transactionData.date,
                      amount: numericAmount.toString(),
                      type: transactionData.type,
                      category: transactionData.category,
                      status: transactionData.status || 'Bokförd',
                      note: transactionData.note || '',
                      receipt: transactionData.receipt || false,
                      receipt_path: transactionData.receipt_path || null
                    });

                    if (reloadData) {
                      await reloadData();
                    }

                    showToast('Transaktion återställd!', { type: 'success' });
                  } catch (err) {
                    console.error('Kunde inte återställa transaktion:', err);
                    showToast('Kunde inte återställa transaktion: ' + (err.message || 'Okänt fel'), {
                      type: 'error'
                    });
                  }
                },
                description: 'Klicka på Ångra för att återställa'
              });
            } catch (error) {
              console.error('❌ Kunde inte radera transaktion:', error);
              showToast('Kunde inte radera transaktion: ' + (error.message || 'Okänt fel'), {
                type: 'error'
              });
            }
          }}
          className="p-3 bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-200 dark:hover:bg-rose-900/40 transition-colors"
          title="Radera transaktion"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Image Lightbox */}
      {lightboxImages && lightboxImages.length > 0 && (
        <ImageLightbox
          images={lightboxImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxImages(null)}
        />
      )}
    </div>
  );
};

export default TransactionDrawer;

