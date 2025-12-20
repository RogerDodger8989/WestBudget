import React, { useState, useRef, useEffect, useCallback } from 'react';
import { formatAmount, getAmountClassName } from '../utils/formatAmount';
import { X, FileSpreadsheet, CheckCircle, AlertCircle, Settings, Edit2, Plus, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../api';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeButtonClass, getThemeTextClass, getThemeBgClass, getThemeBorderClass, getThemeRingClass } from '../utils/getThemeClasses';

const ImportModal = ({ onClose, onImport, categories = [], existingTransactions = [], onCategoriesChange }) => {
  const { showToast } = useToast();
  const { colorTheme } = useTheme();
  const [step, setStep] = useState(1);
  const [bank, setBank] = useState('swedbank');
  const [isDragging, setIsDragging] = useState(false);
  const [importedData, setImportedData] = useState([]);
  const [selectedTransactions, setSelectedTransactions] = useState(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [categoryRules, setCategoryRules] = useState([]);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [editingCategoryIndex, setEditingCategoryIndex] = useState(null);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkCategory, setBulkCategory] = useState('');
  const [localCategories, setLocalCategories] = useState(categories);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategoryLoading, setIsCreatingCategoryLoading] = useState(false);
  const [isQuickCategorizing, setIsQuickCategorizing] = useState(null);
  const [isBulkChanging, setIsBulkChanging] = useState(false);
  const [manuallyChangedCategories, setManuallyChangedCategories] = useState(new Set());
  const fileInputRef = useRef(null);

  // Update local categories when prop changes
  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  // Load category rules on mount
  useEffect(() => {
    loadCategoryRules();
  }, []);

  const loadCategoryRules = async () => {
    try {
      const rules = await api.getCategoryRules();
      setCategoryRules(rules);
    } catch (err) {
      console.error('Kunde inte ladda regler:', err);
    }
  };

  // Helper function to read file with encoding detection
  const readFileWithEncoding = async (file) => {
    // Try different encodings in order
    const encodings = ['windows-1252', 'iso-8859-1', 'utf-8'];
    
    for (const encoding of encodings) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const decoder = new TextDecoder(encoding);
        const text = decoder.decode(arrayBuffer);
        
        // Check if text contains Swedish characters properly
        // If we see proper Swedish characters, this encoding is likely correct
        if (text.includes('å') || text.includes('ä') || text.includes('ö') || 
            text.includes('Å') || text.includes('Ä') || text.includes('Ö')) {
          return text;
        }
        
        // If no Swedish chars but no encoding errors, still return it
        // (might be a file without Swedish characters)
        if (encoding === 'windows-1252') {
          return text; // Default to windows-1252 for Swedbank files
        }
      } catch (err) {
        // Try next encoding
        continue;
      }
    }
    
    // Fallback to UTF-8
    const arrayBuffer = await file.arrayBuffer();
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(arrayBuffer);
  };

  // Apply category rules to description
  const applyCategoryRules = (description, rules = categoryRules) => {
    const descLower = description.toLowerCase();
    for (const rule of rules) {
      if (!rule.is_active) continue;
      
      // Support both old format (single pattern) and new format (array of patterns)
      const patterns = rule.description_patterns || [rule.description_pattern].filter(p => p);
      
      // Check if any pattern matches
      for (const pattern of patterns) {
        if (pattern && typeof pattern === 'string' && descLower.includes(pattern.toLowerCase())) {
          return rule.category;
        }
      }
    }
    return null; // No rule matched
  };

  // Re-apply category rules to all imported transactions
  // Skips transactions with manually changed categories
  const reapplyCategoryRules = (newRules) => {
    if (importedData.length === 0) return;
    
    const updated = importedData.map((transaction, index) => {
      // Skip if this transaction's category was manually changed
      if (manuallyChangedCategories.has(index)) {
        return transaction;
      }
      
      // Try to apply rules first
      let category = applyCategoryRules(transaction.title, newRules);
      
      // If no rule matched, use auto-categorize
      if (!category) {
        category = autoCategorize(transaction.title);
      }
      
      return {
        ...transaction,
        category: category
      };
    });
    
    setImportedData(updated);
  };

  // Auto-categorize based on description (fallback if no rule matches)
  const autoCategorize = (description) => {
    const descLower = description.toLowerCase();
    
    if (descLower.includes('swish') || descLower.includes('klarna')) {
      return 'Övrigt';
    } else if (descLower.includes('försäkring') || descLower.includes('forsakring')) {
      return 'Försäkring';
    } else if (descLower.includes('mat') || descLower.includes('ica') || descLower.includes('coop')) {
      return 'Övrigt';
    } else if (descLower.includes('lön') || descLower.includes('lon') || descLower.includes('csn') || descLower.includes('barnbidrag')) {
      return 'Försäljning Tjänst';
    } else if (descLower.includes('el') || descLower.includes('tibber') || descLower.includes('energi')) {
      return 'Övrigt';
    } else if (descLower.includes('transport') || descLower.includes('skånetrafiken')) {
      return 'Resor';
    } else if (descLower.includes('utbildning') || descLower.includes('studier')) {
      return 'Övrigt';
    }
    
    return 'Övrigt';
  };

  // Check for duplicates (summa + datum)
  const checkDuplicate = (amount, date) => {
    return existingTransactions.some(t => {
      // Compare amounts (handle both string and number formats)
      const existingAmount = parseFloat(t.amount.toString().replace(/[^\d.,-]/g, '').replace(',', '.'));
      const newAmount = parseFloat(amount.toString().replace(/[^\d.,-]/g, '').replace(',', '.'));
      
      // Compare dates
      const existingDate = t.date || '';
      const newDate = date || '';
      
      return Math.abs(existingAmount - newAmount) < 0.01 && existingDate === newDate;
    });
  };

  // Parse CSV text to array of objects
  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    
    // Skip first line (metadata) and second line (headers)
    if (lines.length < 3) {
      throw new Error('Filen innehåller inte tillräckligt med data');
    }

    // Parse header row to find column indices
    const headerLine = lines[1];
    const headers = headerLine.split(',').map(h => h.trim());
    
    const descriptionIndex = headers.indexOf('Beskrivning');
    const dateIndex = headers.indexOf('Transaktionsdag');
    const amountIndex = headers.indexOf('Belopp');
    const referenceIndex = headers.indexOf('Referens');

    if (descriptionIndex === -1 || dateIndex === -1 || amountIndex === -1) {
      throw new Error('Kunde inte hitta nödvändiga kolumner i filen. Kontrollera att det är en Swedbank CSV-fil.');
    }

    // Parse data rows (skip first 2 lines)
    const transactions = [];
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      // Simple CSV parsing (handles quoted fields)
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim()); // Add last value

      if (values.length <= Math.max(descriptionIndex, dateIndex, amountIndex)) {
        continue; // Skip malformed rows
      }

      const description = values[descriptionIndex] || '';
      const dateStr = values[dateIndex] || '';
      const amountStr = values[amountIndex] || '0';
      const reference = values[referenceIndex] || '';

      // Parse amount (remove spaces, handle both comma and dot as decimal separator)
      let amountStrClean = amountStr.replace(/\s/g, '');
      // Replace comma with dot if it's used as decimal separator
      if (amountStrClean.includes(',') && !amountStrClean.includes('.')) {
        amountStrClean = amountStrClean.replace(',', '.');
      }
      const amount = parseFloat(amountStrClean);
      if (isNaN(amount) || amount === 0) continue;

      // Determine type based on amount sign
      const type = amount < 0 ? 'expense' : 'income';
      // Format amount for display according to WestBudget standards
      // Both positive and negative: use space as thousand separator and "kr" suffix
      const formatted = new Intl.NumberFormat('sv-SE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(Math.abs(amount));
      const amountDisplay = amount < 0 ? `-${formatted} kr` : `${formatted} kr`;

      // Format date (YYYY-MM-DD)
      let formattedDate = dateStr;
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        formattedDate = dateStr;
      } else {
        // Try to parse other date formats
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          formattedDate = date.toISOString().split('T')[0];
        }
      }

      // Apply category rules first, then fallback to auto-categorize
      let category = applyCategoryRules(description);
      if (!category) {
        category = autoCategorize(description);
      }

      // Check for duplicate
      const isDuplicate = checkDuplicate(amount, formattedDate);

      transactions.push({
        title: description || 'Namnlös transaktion',
        date: formattedDate,
        amount: amountDisplay,
        amountValue: amount, // Store numeric value for duplicate check
        type: type,
        category: category,
        status: 'Bokförd',
        note: '',
        receipt: false,
        isDuplicate: isDuplicate,
        originalIndex: transactions.length // For tracking in UI
      });
    }

    return transactions;
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Endast CSV-filer stöds');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const text = await readFileWithEncoding(file);
      const transactions = parseCSV(text);
      
      if (transactions.length === 0) {
        setError('Inga transaktioner hittades i filen');
        setIsProcessing(false);
        return;
      }

      // Auto-select all non-duplicates
      const nonDuplicates = new Set();
      transactions.forEach((t, index) => {
        if (!t.isDuplicate) {
          nonDuplicates.add(index);
        }
      });
      setSelectedTransactions(nonDuplicates);

      setImportedData(transactions);
      // Reset manually changed categories when new file is loaded
      setManuallyChangedCategories(new Set());
      setStep(2);
    } catch (err) {
      console.error('Fel vid parsing:', err);
      setError(err.message || 'Kunde inte läsa filen. Kontrollera att det är en giltig Swedbank CSV-fil.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && fileInputRef.current) {
      fileInputRef.current.files = e.dataTransfer.files;
      handleFileSelect({ target: { files: [file] } });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      // Select all non-duplicates
      const nonDuplicates = new Set();
      importedData.forEach((t, index) => {
        if (!t.isDuplicate) {
          nonDuplicates.add(index);
        }
      });
      setSelectedTransactions(nonDuplicates);
    } else {
      setSelectedTransactions(new Set());
    }
  };

  const handleToggleTransaction = (index) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTransactions(newSelected);
  };

  const handleCategoryChange = (index, newCategory) => {
    const updated = [...importedData];
    updated[index].category = newCategory;
    setImportedData(updated);
    setEditingCategoryIndex(null);
    
    // Mark this transaction as manually changed
    const newManuallyChanged = new Set(manuallyChangedCategories);
    newManuallyChanged.add(index);
    setManuallyChangedCategories(newManuallyChanged);
  };

  // Bulk category change
  const handleBulkCategoryChange = async () => {
    if (!bulkCategory) return;
    
    setIsBulkChanging(true);
    try {
      const updated = [...importedData];
      const selectedIndices = Array.from(selectedTransactions);
      const newManuallyChanged = new Set(manuallyChangedCategories);
      let changedCount = 0;
      
      selectedIndices.forEach(index => {
        if (!updated[index].isDuplicate) {
          updated[index].category = bulkCategory;
          newManuallyChanged.add(index); // Mark as manually changed
          changedCount++;
        }
      });
      
      setImportedData(updated);
      setManuallyChangedCategories(newManuallyChanged);
      setBulkEditMode(false);
      setBulkCategory('');
      
      showToast(`${changedCount} transaktion${changedCount !== 1 ? 'er' : ''} uppdaterade!`, {
        type: 'success',
        description: `Kategori ändrad till "${bulkCategory}"`
      });
    } catch (err) {
      showToast('Kunde inte uppdatera kategorier: ' + err.message, {
        type: 'error'
      });
    } finally {
      setIsBulkChanging(false);
    }
  };

  // Quick categorize: Create rule from description
  const handleQuickCategorize = async (index, category) => {
    const transaction = importedData[index];
    if (!transaction) return;

    setIsQuickCategorizing(index);
    
    // Extract a meaningful pattern from description (first few words)
    const words = transaction.title.split(' ').filter(w => w.length > 2).slice(0, 3);
    const pattern = words.join(' ').toLowerCase();

    if (!pattern) {
      setIsQuickCategorizing(null);
      showToast('Kunde inte extrahera mönster från beskrivningen', {
        type: 'error'
      });
      return;
    }

    try {
      // Create rule with single pattern (can be expanded later)
      await api.createCategoryRule({
        description_patterns: [pattern],
        category: category,
        is_active: true
      });

      // Reload rules
      await loadCategoryRules();

      // Apply to all similar transactions
      const updated = [...importedData];
      let matchedCount = 0;
      updated.forEach((t, i) => {
        if (t.title.toLowerCase().includes(pattern)) {
          updated[i].category = category;
          matchedCount++;
        }
      });
      setImportedData(updated);
      
      showToast(`Regel skapad! ${matchedCount} transaktion${matchedCount !== 1 ? 'er' : ''} uppdaterade.`, {
        type: 'success',
        description: `Mönster: "${pattern}" → ${category}`
      });
    } catch (err) {
      console.error('Kunde inte skapa regel:', err);
      showToast('Kunde inte skapa regel: ' + (err.message || 'Okänt fel'), {
        type: 'error'
      });
    } finally {
      setIsQuickCategorizing(null);
    }
  };

  // Create new category
  const handleCreateCategory = async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      showToast('Kategorinamn kan inte vara tomt', {
        type: 'error'
      });
      return;
    }

    // Check for duplicates
    if (localCategories.some(c => c.toLowerCase() === trimmedName.toLowerCase())) {
      showToast('En kategori med detta namn finns redan', {
        type: 'error'
      });
      return;
    }

    setIsCreatingCategoryLoading(true);
    try {
      await api.createCategory(trimmedName);
      const updated = [...localCategories, trimmedName];
      setLocalCategories(updated);
      if (onCategoriesChange) {
        onCategoriesChange(updated);
      }
      setNewCategoryName('');
      setIsCreatingCategory(false);
      
      showToast(`Kategori "${trimmedName}" skapad!`, {
        type: 'success',
        description: 'Kategorin är nu tillgänglig i alla dropdown-menyer'
      });
    } catch (err) {
      const errorMsg = err.message || 'Okänt fel';
      showToast('Kunde inte skapa kategori: ' + errorMsg, {
        type: 'error',
        description: 'Kontrollera att kategorin inte redan finns.'
      });
    } finally {
      setIsCreatingCategoryLoading(false);
    }
  };

  const handleImport = async () => {
    const toImport = importedData.filter((_, index) => selectedTransactions.has(index));
    
    if (toImport.length === 0) {
      setError('Välj minst en transaktion att importera');
      return;
    }

    try {
      await onImport(toImport);
    } catch (err) {
      setError(err.message || 'Kunde inte importera transaktioner');
      throw err; // Re-throw to stop at first error
    }
  };

  const allNonDuplicatesSelected = importedData.length > 0 && 
    importedData.every((t, index) => t.isDuplicate || selectedTransactions.has(index));

  const selectedCount = selectedTransactions.size;
  const hasSelected = selectedCount > 0;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
          
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              {step === 1 ? 'Importera Transaktioner' : 'Granska Import'}
            </h2>
            <div className="flex items-center gap-2">
              {step === 2 && (
                <>
                  {hasSelected && (
                    <button
                      onClick={() => setBulkEditMode(!bulkEditMode)}
                      className={`px-3 py-1.5 text-sm ${getThemeButtonClass(colorTheme, 'primary')} rounded-lg transition-colors`}
                    >
                      {bulkEditMode ? 'Avbryt' : 'Ändra alla valda'}
                    </button>
                  )}
                  <button
                    onClick={() => setIsRulesModalOpen(true)}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Hantera kategoriregler"
                  >
                    <Settings size={18} className="text-zinc-500" />
                  </button>
                </>
              )}
              <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                <X size={20} className="text-zinc-500" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            {step === 1 ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Välj Bank / Källa</label>
                  <select 
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    className={`w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none focus:ring-2 ${getThemeRingClass(colorTheme)}`}
                  >
                    <option value="swedbank">Swedbank (CSV)</option>
                    <option value="seb">SEB (Excel/CSV)</option>
                    <option value="nordea">Nordea</option>
                    <option value="handelsbanken">Handelsbanken</option>
                    <option value="revolut">Revolut Business</option>
                  </select>
                  <p className="text-xs text-zinc-500">Vi anpassar formatet automatiskt efter din bank.</p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {error && (
                  <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-800 dark:text-rose-200 rounded-xl border border-rose-100 dark:border-rose-800">
                    <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Fel vid import</p>
                      <p className="text-xs opacity-80 mt-1">{error}</p>
                    </div>
                  </div>
                )}

                <div 
                  className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    isDragging 
                      ? `${getThemeBorderClass(colorTheme)} ${getThemeBgClass(colorTheme, false)} dark:${getThemeBgClass(colorTheme, true)}/10` 
                      : `border-zinc-300 dark:border-zinc-700 hover:${getThemeBorderClass(colorTheme)} hover:bg-zinc-50 dark:hover:bg-zinc-800`
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className={`w-16 h-16 ${getThemeBgClass(colorTheme, false)} dark:${getThemeBgClass(colorTheme, true)}/30 rounded-full flex items-center justify-center mb-4 ${getThemeTextClass(colorTheme, false)} dark:${getThemeTextClass(colorTheme, true)}`}>
                    {isProcessing ? (
                      <div className={`w-8 h-8 border-2 ${getThemeBorderClass(colorTheme)} border-t-transparent rounded-full animate-spin`} />
                    ) : (
                      <FileSpreadsheet size={32} />
                    )}
                  </div>
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-white">
                    {isProcessing ? 'Bearbetar fil...' : 'Klicka eller dra fil hit'}
                  </h3>
                  <p className="text-sm text-zinc-500 mt-2 max-w-xs mx-auto">
                    Stöder .CSV filer exporterade direkt från Swedbank.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Bulk edit mode */}
                {bulkEditMode && hasSelected && (
                  <div className={`p-4 ${getThemeBgClass(colorTheme, false)} dark:${getThemeBgClass(colorTheme, true)}/20 border ${getThemeBorderClass(colorTheme)}/30 dark:${getThemeBorderClass(colorTheme)}/50 rounded-xl`}>
                    <div className="flex items-center gap-3">
                      <Sparkles size={18} className={`${getThemeTextClass(colorTheme, false)} dark:${getThemeTextClass(colorTheme, true)}`} />
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${getThemeTextClass(colorTheme, false)} dark:${getThemeTextClass(colorTheme, true)}`}>
                          Ändra kategori för {selectedCount} valda transaktion{selectedCount !== 1 ? 'er' : ''}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <select
                            value={bulkCategory}
                            onChange={(e) => setBulkCategory(e.target.value)}
                            className={`flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border ${getThemeBorderClass(colorTheme)}/40 dark:${getThemeBorderClass(colorTheme)}/50 rounded-lg text-sm focus:ring-2 ${getThemeRingClass(colorTheme)} outline-none`}
                          >
                            <option value="">Välj kategori...</option>
                            {localCategories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                          <button
                            onClick={handleBulkCategoryChange}
                            disabled={!bulkCategory || isBulkChanging}
                            className={`px-4 py-2 ${getThemeButtonClass(colorTheme, 'primary')} text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2`}
                          >
                            {isBulkChanging ? (
                              <>
                                <Loader2 size={14} className="animate-spin" />
                                Uppdaterar...
                              </>
                            ) : (
                              'Tillämpa'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 rounded-xl border border-emerald-100 dark:border-emerald-800">
                  <CheckCircle size={20} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Filen analyserad!</p>
                    <p className="text-xs opacity-80">
                      Vi hittade {importedData.length} transaktion{importedData.length !== 1 ? 'er' : ''}.
                      {importedData.filter(t => t.isDuplicate).length > 0 && (
                        <span className="ml-2 text-rose-600 dark:text-rose-400">
                          {importedData.filter(t => t.isDuplicate).length} dubblett{importedData.filter(t => t.isDuplicate).length !== 1 ? 'er' : ''} markerade.
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 font-medium">
                      <tr>
                        <th className="px-4 py-3 w-12">
                          <input
                            type="checkbox"
                            checked={allNonDuplicatesSelected}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className={`w-4 h-4 ${getThemeTextClass(colorTheme, false)} border-zinc-300 rounded ${getThemeRingClass(colorTheme)}`}
                          />
                        </th>
                        <th className="px-4 py-3">Datum</th>
                        <th className="px-4 py-3">Beskrivning</th>
                        <th className="px-4 py-3">Belopp</th>
                        <th className="px-4 py-3">Kategori</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                      {importedData.map((row, i) => (
                        <tr 
                          key={i} 
                          className={`${
                            row.isDuplicate 
                              ? 'bg-rose-50 dark:bg-rose-900/20' 
                              : 'bg-white dark:bg-zinc-900'
                          } ${selectedTransactions.has(i) ? `ring-2 ${getThemeRingClass(colorTheme)}` : ''}`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedTransactions.has(i)}
                              onChange={() => handleToggleTransaction(i)}
                              disabled={row.isDuplicate}
                              className={`w-4 h-4 ${getThemeTextClass(colorTheme, false)} border-zinc-300 rounded ${getThemeRingClass(colorTheme)} disabled:opacity-50`}
                            />
                          </td>
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{row.date}</td>
                          <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">
                            {row.title}
                            {row.isDuplicate && (
                              <span className="ml-2 text-xs text-rose-600 dark:text-rose-400">(Dublett)</span>
                            )}
                          </td>
                          <td className={`px-4 py-3 font-mono ${getAmountClassName(row.amountValue)}`}>
                            {row.amount}
                          </td>
                          <td className="px-4 py-3">
                            {editingCategoryIndex === i ? (
                              <div className="flex items-center gap-1">
                                <select
                                  value={row.category}
                                  onChange={(e) => {
                                    if (e.target.value === '__CREATE__') {
                                      setIsCreatingCategory(true);
                                      setEditingCategoryIndex(i);
                                    } else {
                                      handleCategoryChange(i, e.target.value);
                                    }
                                  }}
                                  onBlur={() => {
                                    if (row.category !== '__CREATE__') {
                                      setEditingCategoryIndex(null);
                                    }
                                  }}
                                  autoFocus
                                  className={`px-2 py-1 bg-white dark:bg-zinc-800 border ${getThemeBorderClass(colorTheme)} rounded text-xs focus:ring-2 ${getThemeRingClass(colorTheme)} outline-none`}
                                >
                                  {localCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                  ))}
                                  <option value="__CREATE__">+ Skapa ny kategori</option>
                                </select>
                                {isCreatingCategory && editingCategoryIndex === i && (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={newCategoryName}
                                      onChange={(e) => setNewCategoryName(e.target.value)}
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                          handleCreateCategory().then(() => {
                                            handleCategoryChange(i, newCategoryName);
                                          });
                                        }
                                      }}
                                      placeholder="Kategorinamn"
                                      autoFocus
                                      className={`px-2 py-1 bg-white dark:bg-zinc-800 border ${getThemeBorderClass(colorTheme)} rounded text-xs w-32 focus:ring-2 ${getThemeRingClass(colorTheme)} outline-none`}
                                    />
                                    <button
                                      onClick={() => {
                                        handleCreateCategory().then(() => {
                                          handleCategoryChange(i, newCategoryName);
                                        });
                                      }}
                                      className={`p-1 ${getThemeButtonClass(colorTheme, 'primary')} rounded`}
                                    >
                                      <CheckCircle size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setEditingCategoryIndex(i)}
                                  className={`px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-xs border border-zinc-200 dark:border-zinc-700 hover:${getThemeBorderClass(colorTheme)} transition-colors flex items-center gap-1`}
                                >
                                  <span>{row.category}</span>
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  onClick={() => handleQuickCategorize(i, row.category)}
                                  className={`p-1 ${getThemeTextClass(colorTheme, false)} dark:${getThemeTextClass(colorTheme, true)} ${getThemeBgClass(colorTheme, false)} dark:${getThemeBgClass(colorTheme, true)}/30 rounded transition-colors hover:opacity-80`}
                                  title="Använd denna kategori för alla liknande"
                                >
                                  <Sparkles size={12} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-zinc-600 dark:text-zinc-300 font-medium hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Avbryt
            </button>
            {step === 1 ? (
              <button 
                disabled={true} 
                className="px-6 py-2 bg-zinc-300 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed font-semibold rounded-lg"
              >
                Ladda upp fil först
              </button>
            ) : (
              <button 
                onClick={handleImport}
                disabled={selectedTransactions.size === 0}
                className={`px-6 py-2 ${getThemeButtonClass(colorTheme, 'primary')} font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Importera {selectedTransactions.size} transaktion{selectedTransactions.size !== 1 ? 'er' : ''}
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Category Rules Modal */}
      {isRulesModalOpen && (
        <CategoryRulesModal
          onClose={() => setIsRulesModalOpen(false)}
          rules={categoryRules}
          onRulesChange={async (newRules) => {
            console.log('onRulesChange called with:', newRules.length, 'rules');
            // Use the rules passed from CategoryRulesModal directly (they're already updated from server response)
            // Don't reload from server here - it causes the editing state to be overwritten
            setCategoryRules(newRules);
            // Re-apply rules to imported transactions (respects manually changed categories)
            reapplyCategoryRules(newRules);
          }}
          onRuleCreated={(newRule) => {
            // When a new rule is created, immediately re-apply to transactions
            const updatedRules = [...categoryRules, newRule];
            setCategoryRules(updatedRules);
            reapplyCategoryRules(updatedRules);
          }}
          categories={localCategories}
          onCategoriesChange={(newCategories) => {
            setLocalCategories(newCategories);
            if (onCategoriesChange) {
              onCategoriesChange(newCategories);
            }
          }}
        />
      )}
    </>
  );
};

// Category Rules Modal Component
const CategoryRulesModal = ({ onClose, rules, onRulesChange, categories, onCategoriesChange, onRuleCreated }) => {
  const { showToast } = useToast();
  const [localRules, setLocalRules] = useState(rules);
  const [newPatterns, setNewPatterns] = useState(['']); // Array of patterns
  const [newCategory, setNewCategory] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [localCategories, setLocalCategories] = useState(categories);
  const [isCreatingCategoryLoading, setIsCreatingCategoryLoading] = useState(false);
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [isDeletingRule, setIsDeletingRule] = useState(null);
  const [isTogglingRule, setIsTogglingRule] = useState(null);
  
  // Inline editing states
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [editingPatterns, setEditingPatterns] = useState([]);
  const [editingCategory, setEditingCategory] = useState('');
  const [isSavingRule, setIsSavingRule] = useState(null);
  const pendingRulesUpdateRef = useRef(null);
  const [rulesUpdateTrigger, setRulesUpdateTrigger] = useState(0);
  // Refs to track latest values without causing re-renders
  const editingPatternsRef = useRef([]);
  const editingCategoryRef = useRef('');

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  // Sync localRules with parent when rules prop changes
  // BUT: Don't update editing state if we're currently editing (to prevent losing user input)
  useEffect(() => {
    // If we're editing, only update the rule in localRules, but DON'T touch editingPatterns/editingCategory
    // This prevents the user's input from being overwritten when rules reload from server
    if (editingRuleId) {
      const updatedRule = rules.find(r => r.id === editingRuleId);
      if (updatedRule) {
        // Update the rule in localRules
        setLocalRules(prevRules => 
          prevRules.map(r => r.id === editingRuleId ? updatedRule : r)
        );
        
        // Don't update editingPatterns from server - we manage it in saveRule
        // This prevents overwriting user input while they're typing
        // The saveRule function already updates editingPatterns correctly
      }
    } else {
      // Not editing, sync all rules
      // BUT: Only sync if rules prop actually changed (not just a re-render)
      // This prevents overwriting localRules when we just updated it ourselves
      setLocalRules(prevRules => {
        // Only update if the rules are actually different
        if (prevRules.length !== rules.length || 
            prevRules.some((r, i) => r.id !== rules[i]?.id)) {
          return rules;
        }
        return prevRules;
      });
    }
  }, [rules, editingRuleId, isSavingRule]);

  // Sync pending rules update to parent after state update
  useEffect(() => {
    if (pendingRulesUpdateRef.current) {
      const { updated, ruleId } = pendingRulesUpdateRef.current;
      pendingRulesUpdateRef.current = null;
      
      console.log('Syncing rules to parent:', updated.length, 'rules, ruleId:', ruleId);
      console.log('Updated rule:', updated.find(r => r.id === ruleId));
      
      // Use setTimeout to ensure this runs after render
      setTimeout(() => {
        // Pass the updated rules to parent
        onRulesChange(updated);
        
        // Don't call onRuleCreated for updates - that's only for new rules
        // onRuleCreated is only called when creating a new rule, not when updating
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localRules, rulesUpdateTrigger]);

  const handleCreateCategory = async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      showToast('Kategorinamn kan inte vara tomt', {
        type: 'error'
      });
      return;
    }

    // Check for duplicates
    if (localCategories.some(c => c.toLowerCase() === trimmedName.toLowerCase())) {
      showToast('En kategori med detta namn finns redan', {
        type: 'error'
      });
      return;
    }

    setIsCreatingCategoryLoading(true);
    try {
      await api.createCategory(trimmedName);
      const updated = [...localCategories, trimmedName];
      setLocalCategories(updated);
      if (onCategoriesChange) {
        onCategoriesChange(updated);
      }
      setNewCategoryName('');
      setIsCreatingCategory(false);
      setNewCategory(trimmedName); // Auto-select the new category
      
      showToast(`Kategori "${trimmedName}" skapad!`, {
        type: 'success'
      });
    } catch (err) {
      const errorMsg = err.message || 'Okänt fel';
      showToast('Kunde inte skapa kategori: ' + errorMsg, {
        type: 'error',
        description: 'Kontrollera att kategorin inte redan finns.'
      });
    } finally {
      setIsCreatingCategoryLoading(false);
    }
  };

  const handleAddPattern = () => {
    setNewPatterns([...newPatterns, '']);
  };

  const handleRemovePattern = (index) => {
    if (newPatterns.length > 1) {
      setNewPatterns(newPatterns.filter((_, i) => i !== index));
    }
  };

  const handlePatternChange = (index, value) => {
    const updated = [...newPatterns];
    updated[index] = value;
    setNewPatterns(updated);
  };

  const handleAddRule = async () => {
    // Filter out empty patterns
    const validPatterns = newPatterns.map(p => p.trim()).filter(p => p);
    
    if (validPatterns.length === 0 || !newCategory) {
      showToast('Fyll i minst ett mönster och kategori', {
        type: 'error'
      });
      return;
    }

    setIsCreatingRule(true);
    try {
      const newRule = await api.createCategoryRule({
        description_patterns: validPatterns,
        category: newCategory,
        is_active: true
      });
      const updated = [...localRules, newRule];
      const patternsText = validPatterns.join(', ');
      const categoryText = newCategory;
      setLocalRules(updated);
      onRulesChange(updated);
      setNewPatterns(['']); // Reset to one empty field
      setNewCategory('');
      
      // Notify parent that a rule was created (for re-applying to transactions)
      if (onRuleCreated) {
        onRuleCreated(newRule);
      }
      
      showToast('Regel skapad!', {
        type: 'success',
        description: `"${patternsText}" → ${categoryText}`
      });
    } catch (err) {
      console.error('Kunde inte skapa regel:', err);
      showToast('Kunde inte skapa regel: ' + (err.message || 'Okänt fel'), {
        type: 'error'
      });
    } finally {
      setIsCreatingRule(false);
    }
  };

  const handleDeleteRule = async (id) => {
    const rule = localRules.find(r => r.id === id);
    if (!rule) return;

    setIsDeletingRule(id);
    try {
      await api.deleteCategoryRule(id);
      const updated = localRules.filter(r => r.id !== id);
      setLocalRules(updated);
      
      // Store update to be synced with parent in useEffect
      pendingRulesUpdateRef.current = { updated, ruleId: null };
      setRulesUpdateTrigger(prev => prev + 1);
      
      const patterns = rule.description_patterns || [rule.description_pattern].filter(p => p);
      const patternsText = patterns.join(', ');
      showToast('Regel borttagen', {
        type: 'success',
        description: `Regel för "${patternsText}" har tagits bort`
      });
    } catch (err) {
      console.error('Kunde inte ta bort regel:', err);
      showToast('Kunde inte ta bort regel: ' + (err.message || 'Okänt fel'), {
        type: 'error'
      });
    } finally {
      setIsDeletingRule(null);
    }
  };

  const handleToggleRule = async (id, isActive, e) => {
    // Stop event propagation to prevent triggering edit mode
    if (e) e.stopPropagation();
    
    setIsTogglingRule(id);
    const rule = localRules.find(r => r.id === id);
    try {
      await api.updateCategoryRule(id, { is_active: !isActive });
      const updated = localRules.map(r => 
        r.id === id ? { ...r, is_active: !isActive } : r
      );
      setLocalRules(updated);
      // Reload rules from server and re-apply to transactions
      onRulesChange(updated);
      
      const patterns = rule ? (rule.description_patterns || [rule.description_pattern].filter(p => p)) : [];
      const patternsText = patterns.join(', ');
      showToast(`Regel ${!isActive ? 'aktiverad' : 'inaktiverad'}`, {
        type: 'success',
        description: rule ? `"${patternsText}" → ${rule.category}` : ''
      });
    } catch (err) {
      console.error('Kunde inte uppdatera regel:', err);
      showToast('Kunde inte uppdatera regel: ' + (err.message || 'Okänt fel'), {
        type: 'error'
      });
    } finally {
      setIsTogglingRule(null);
    }
  };

  // Save function (no auto-save, called on blur or modal close)
  const saveRule = useCallback(async (ruleId, patterns, category) => {
    const validPatterns = patterns.map(p => p.trim()).filter(p => p);
    
    if (validPatterns.length === 0) {
      // Don't show error if no patterns - just return silently
      return;
    }

    if (!category) {
      // Don't show error if no category - just return silently
      return;
    }

    setIsSavingRule(ruleId);
    try {
      const savedRule = await api.updateCategoryRule(ruleId, {
        description_patterns: validPatterns,
        category: category
      });
      
      console.log('Rule saved successfully:', savedRule);
      
      // Parse the saved rule to get the correct format
      const savedPatterns = savedRule.description_patterns || [savedRule.description_pattern].filter(p => p);
      console.log('Saved patterns:', savedPatterns);
      
      // Update local rules with the response from server (this is the source of truth)
      setLocalRules(prevRules => {
        const updated = prevRules.map(r => 
          r.id === ruleId 
            ? { ...r, description_patterns: savedPatterns, category: savedRule.category }
            : r
        );
        
        console.log('Updated localRules, rule:', updated.find(r => r.id === ruleId));
        
        // Store update to be synced with parent in useEffect
        pendingRulesUpdateRef.current = { updated, ruleId };
        
        // Force useEffect to trigger
        setRulesUpdateTrigger(prev => prev + 1);
        
        return updated;
      });
      
      // Update editing state to match what was actually saved on server
      // BUT: Keep any empty patterns that the user might be typing in
      // Also add an empty field at the end so user can continue adding patterns
      const currentPatterns = editingPatternsRef.current;
      const emptyPatterns = currentPatterns.filter(p => !p.trim());
      const savedPatternsArray = savedPatterns.length > 0 ? [...savedPatterns, ...emptyPatterns] : [...emptyPatterns];
      
      // Always add one empty field at the end if there isn't one already
      if (savedPatternsArray.length === 0 || savedPatternsArray[savedPatternsArray.length - 1].trim()) {
        savedPatternsArray.push('');
      }
      
      setEditingPatterns(savedPatternsArray);
      editingPatternsRef.current = savedPatternsArray;
      setEditingCategory(savedRule.category);
      editingCategoryRef.current = savedRule.category;
      
      console.log('Updated editingPatterns to:', savedPatternsArray);
      
      // Set isSavingRule to null AFTER a small delay to allow useEffect to see it
      // This ensures the useEffect that syncs rules prop can update editingPatterns correctly
      setTimeout(() => {
        setIsSavingRule(null);
      }, 100);
    } catch (err) {
      console.error('Kunde inte spara regel:', err);
      showToast('Kunde inte spara regel: ' + (err.message || 'Okänt fel'), {
        type: 'error'
      });
      setIsSavingRule(null);
    }
  }, [onRulesChange, onRuleCreated, showToast]);

  const handleEditRule = (rule) => {
    const patterns = rule.description_patterns || [rule.description_pattern].filter(p => p);
    const patternsArray = patterns.length > 0 ? [...patterns] : [''];
    setEditingRuleId(rule.id);
    setEditingPatterns(patternsArray);
    editingPatternsRef.current = patternsArray;
    const category = rule.category || '';
    setEditingCategory(category);
    editingCategoryRef.current = category;
  };

  const handleCancelEdit = () => {
    // Don't save when canceling - just reset editing state
    setEditingRuleId(null);
    setEditingPatterns([]);
    editingPatternsRef.current = [];
    setEditingCategory('');
    editingCategoryRef.current = '';
    setIsSavingRule(null);
  };

  const handleClose = () => {
    // Save before closing if there are unsaved changes
    if (editingRuleId) {
      saveRule(editingRuleId, editingPatternsRef.current, editingCategoryRef.current);
    }
    onClose();
  };

  const handleEditingPatternChange = (index, value) => {
    const updated = [...editingPatterns];
    updated[index] = value;
    setEditingPatterns(updated);
    editingPatternsRef.current = updated; // Update ref immediately
    // Don't auto-save - wait for blur or modal close
  };

  const handleEditingPatternBlur = () => {
    // Save when user clicks outside the input field
    // Use a small delay to ensure the onChange has finished updating the state
    setTimeout(() => {
      if (editingRuleId) {
        // Get the latest patterns from ref (which is updated immediately in onChange)
        saveRule(editingRuleId, editingPatternsRef.current, editingCategoryRef.current);
      }
    }, 50);
  };

  const handleEditingCategoryChange = (value) => {
    setEditingCategory(value);
    editingCategoryRef.current = value; // Update ref immediately
    // Don't auto-save - wait for blur or modal close
  };

  const handleEditingCategoryBlur = () => {
    // Save when user clicks outside the select field
    if (editingRuleId) {
      saveRule(editingRuleId, editingPatternsRef.current, editingCategoryRef.current);
    }
  };

  const handleAddEditingPattern = () => {
    const updated = [...editingPatterns, ''];
    setEditingPatterns(updated);
    editingPatternsRef.current = updated; // Update ref
    // Don't trigger auto-save when adding empty pattern - wait for user to type
  };

  const handleRemoveEditingPattern = (index) => {
    if (editingPatterns.length > 1) {
      const updated = editingPatterns.filter((_, i) => i !== index);
      setEditingPatterns(updated);
      editingPatternsRef.current = updated; // Update ref
      
      // Trigger auto-save
      if (editingRuleId) {
        saveRule(editingRuleId, updated, editingCategoryRef.current);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Kategoriregler</h2>
          <button onClick={handleClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
          {/* Add new rule */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Lägg till ny regel</h3>
            <div className="space-y-3">
              {/* Multiple pattern fields */}
              <div className="space-y-2">
                {newPatterns.map((pattern, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={pattern}
                      onChange={(e) => handlePatternChange(index, e.target.value)}
                      placeholder="Beskrivning innehåller..."
                      className={`flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 ${getThemeRingClass(colorTheme)} outline-none`}
                    />
                    {newPatterns.length > 1 && (
                      <button
                        onClick={() => handleRemovePattern(index)}
                        className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                        title="Ta bort mönster"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={handleAddPattern}
                  className={`w-full px-3 py-2 text-sm ${getThemeTextClass(colorTheme, false)} dark:${getThemeTextClass(colorTheme, true)} ${getThemeBgClass(colorTheme, false)} dark:${getThemeBgClass(colorTheme, true)}/30 border ${getThemeBorderClass(colorTheme)}/30 dark:${getThemeBorderClass(colorTheme)}/50 rounded-lg transition-colors flex items-center justify-center gap-2 hover:opacity-80`}
                >
                  <Plus size={16} />
                  Lägg till mönster
                </button>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={newCategory}
                  onChange={(e) => {
                    if (e.target.value === '__CREATE__') {
                      setIsCreatingCategory(true);
                    } else {
                      setNewCategory(e.target.value);
                    }
                  }}
                  className={`flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 ${getThemeRingClass(colorTheme)} outline-none`}
                >
                  <option value="">Välj kategori...</option>
                  {localCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__CREATE__">+ Skapa ny kategori</option>
                </select>
                {isCreatingCategory && (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateCategory();
                        }
                      }}
                      placeholder="Kategorinamn"
                      autoFocus
                      className={`px-3 py-2 bg-white dark:bg-zinc-900 border ${getThemeBorderClass(colorTheme)} rounded-lg text-sm w-40 focus:ring-2 ${getThemeRingClass(colorTheme)} outline-none`}
                    />
                    <button
                      onClick={handleCreateCategory}
                      disabled={isCreatingCategoryLoading || !newCategoryName.trim()}
                      className={`p-2 ${getThemeButtonClass(colorTheme, 'primary')} rounded-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isCreatingCategoryLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <CheckCircle size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setIsCreatingCategory(false);
                        setNewCategoryName('');
                      }}
                      className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleAddRule}
              disabled={newPatterns.every(p => !p.trim()) || !newCategory || isCreatingRule}
              className={`mt-3 px-4 py-2 ${getThemeButtonClass(colorTheme, 'primary')} text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2`}
            >
              {isCreatingRule ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Skapar...
                </>
              ) : (
                'Lägg till regel'
              )}
            </button>
          </div>

          {/* Existing rules */}
          <div className="space-y-2">
            {localRules.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">Inga regler skapade än</p>
            ) : (
              localRules.map(rule => {
                const isEditing = editingRuleId === rule.id;
                const patterns = rule.description_patterns || [rule.description_pattern].filter(p => p);
                
                return (
                  <div
                    key={rule.id}
                    className={`p-3 rounded-lg border ${
                      rule.is_active
                        ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700'
                        : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 opacity-60'
                    } ${isEditing ? `${getThemeBorderClass(colorTheme)}/60 dark:${getThemeBorderClass(colorTheme)}/60 ring-2 ${getThemeRingClass(colorTheme)}/30 dark:${getThemeRingClass(colorTheme)}/30` : `cursor-pointer hover:${getThemeBorderClass(colorTheme)}/40 dark:hover:${getThemeBorderClass(colorTheme)}/40`}`}
                    onClick={() => !isEditing && handleEditRule(rule)}
                  >
                    {isEditing ? (
                      // Editing mode
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">
                            Redigerar regel
                          </p>
                          <div className="flex items-center gap-2">
                            {isSavingRule === rule.id && (
                              <span className={`text-xs ${getThemeTextClass(colorTheme, false)} dark:${getThemeTextClass(colorTheme, true)} flex items-center gap-1`}>
                                <Loader2 size={12} className="animate-spin" />
                                Sparar...
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelEdit();
                              }}
                              className="p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                              title="Avbryt"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                        
                        {/* Editable patterns */}
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            Mönster:
                          </label>
                          {editingPatterns.map((pattern, idx) => (
                            <div key={`pattern-${editingRuleId}-${idx}`} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={pattern}
                                onChange={(e) => handleEditingPatternChange(idx, e.target.value)}
                                onBlur={handleEditingPatternBlur}
                                onClick={(e) => e.stopPropagation()}
                                placeholder="Beskrivning innehåller..."
                                className={`flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 ${getThemeRingClass(colorTheme)} outline-none`}
                              />
                              {editingPatterns.length > 1 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveEditingPattern(idx);
                                  }}
                                  className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                                  title="Ta bort mönster"
                                >
                                  <X size={16} />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddEditingPattern();
                            }}
                            className={`w-full px-3 py-2 text-sm ${getThemeTextClass(colorTheme, false)} dark:${getThemeTextClass(colorTheme, true)} ${getThemeBgClass(colorTheme, false)} dark:${getThemeBgClass(colorTheme, true)}/30 border ${getThemeBorderClass(colorTheme)}/30 dark:${getThemeBorderClass(colorTheme)}/50 rounded-lg transition-colors flex items-center justify-center gap-2 hover:opacity-80`}
                          >
                            <Plus size={16} />
                            Lägg till mönster
                          </button>
                        </div>
                        
                        {/* Editable category */}
                        <div>
                          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">
                            Kategori:
                          </label>
                          <select
                            value={editingCategory}
                            onChange={(e) => {
                              if (e.target.value === '__CREATE__') {
                                setIsCreatingCategory(true);
                              } else {
                                handleEditingCategoryChange(e.target.value);
                              }
                            }}
                            onBlur={handleEditingCategoryBlur}
                            onClick={(e) => e.stopPropagation()}
                            className={`w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 ${getThemeRingClass(colorTheme)} outline-none`}
                          >
                            <option value="">Välj kategori...</option>
                            {localCategories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                            <option value="__CREATE__">+ Skapa ny kategori</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">
                            Om beskrivning innehåller:
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {patterns.map((pattern, idx) => (
                              <span
                                key={`view-pattern-${rule.id}-${idx}-${pattern}`}
                                className={`px-2 py-0.5 ${getThemeBgClass(colorTheme, false)} dark:${getThemeBgClass(colorTheme, true)}/30 ${getThemeTextClass(colorTheme, false)} dark:${getThemeTextClass(colorTheme, true)} font-mono text-xs rounded`}
                              >
                                "{pattern}"
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-zinc-500 mt-1.5">
                            → Sätt kategori: <span className="font-semibold">{rule.category}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleToggleRule(rule.id, rule.is_active, e)}
                            disabled={isTogglingRule === rule.id}
                            className={`px-3 py-1 text-xs rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 ${
                              rule.is_active
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                            }`}
                          >
                            {isTogglingRule === rule.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              rule.is_active ? 'Aktiv' : 'Inaktiv'
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRule(rule.id);
                            }}
                            disabled={isDeletingRule === rule.id}
                            className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isDeletingRule === rule.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <X size={16} />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 ${getThemeButtonClass(colorTheme, 'primary')} font-semibold rounded-lg transition-colors`}
          >
            Klar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
