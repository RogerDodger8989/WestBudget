import React, { useState, useRef, useEffect } from 'react';
import { X, FileSpreadsheet, CheckCircle, AlertCircle, Settings, Edit2 } from 'lucide-react';
import { api } from '../api';

const ImportModal = ({ onClose, onImport, categories = [], existingTransactions = [] }) => {
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
  const fileInputRef = useRef(null);

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

  // Apply category rules to description
  const applyCategoryRules = (description) => {
    const descLower = description.toLowerCase();
    for (const rule of categoryRules) {
      if (rule.is_active && descLower.includes(rule.description_pattern.toLowerCase())) {
        return rule.category;
      }
    }
    return null; // No rule matched
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
      // Format amount for display (keep 2 decimals, remove trailing zeros)
      const absAmount = Math.abs(amount);
      const amountDisplay = amount < 0 
        ? `-${absAmount.toFixed(2).replace(/\.?0+$/, '')} kr`
        : `+${absAmount.toFixed(2).replace(/\.?0+$/, '')} kr`;

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
        note: reference ? `Referens: ${reference}` : '',
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
      const text = await file.text();
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

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
          
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              {step === 1 ? 'Importera Transaktioner' : 'Granska Import'}
            </h2>
            <div className="flex items-center gap-2">
              {step === 2 && (
                <button
                  onClick={() => setIsRulesModalOpen(true)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Hantera kategoriregler"
                >
                  <Settings size={18} className="text-zinc-500" />
                </button>
              )}
              <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                <X size={20} className="text-zinc-500" />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto">
            {step === 1 ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Välj Bank / Källa</label>
                  <select 
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
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
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' 
                      : 'border-zinc-300 dark:border-zinc-700 hover:border-indigo-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
                    {isProcessing ? (
                      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
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
                            className="w-4 h-4 text-indigo-600 border-zinc-300 rounded focus:ring-indigo-500"
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
                          } ${selectedTransactions.has(i) ? 'ring-2 ring-indigo-500' : ''}`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedTransactions.has(i)}
                              onChange={() => handleToggleTransaction(i)}
                              disabled={row.isDuplicate}
                              className="w-4 h-4 text-indigo-600 border-zinc-300 rounded focus:ring-indigo-500 disabled:opacity-50"
                            />
                          </td>
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{row.date}</td>
                          <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">
                            {row.title}
                            {row.isDuplicate && (
                              <span className="ml-2 text-xs text-rose-600 dark:text-rose-400">(Dublett)</span>
                            )}
                          </td>
                          <td className={`px-4 py-3 font-mono ${row.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-zinc-300'}`}>
                            {row.amount}
                          </td>
                          <td className="px-4 py-3">
                            {editingCategoryIndex === i ? (
                              <select
                                value={row.category}
                                onChange={(e) => handleCategoryChange(i, e.target.value)}
                                onBlur={() => setEditingCategoryIndex(null)}
                                autoFocus
                                className="px-2 py-1 bg-white dark:bg-zinc-800 border border-indigo-500 rounded text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                              >
                                {categories.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            ) : (
                              <button
                                onClick={() => setEditingCategoryIndex(i)}
                                className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-xs border border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 transition-colors flex items-center gap-1"
                              >
                                <span>{row.category}</span>
                                <Edit2 size={12} />
                              </button>
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
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
          onRulesChange={setCategoryRules}
          categories={categories}
        />
      )}
    </>
  );
};

// Category Rules Modal Component
const CategoryRulesModal = ({ onClose, rules, onRulesChange, categories }) => {
  const [localRules, setLocalRules] = useState(rules);
  const [newPattern, setNewPattern] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const handleAddRule = async () => {
    if (!newPattern.trim() || !newCategory) return;

    try {
      const newRule = await api.createCategoryRule({
        description_pattern: newPattern.trim(),
        category: newCategory,
        is_active: true
      });
      setLocalRules([...localRules, newRule]);
      onRulesChange([...localRules, newRule]);
      setNewPattern('');
      setNewCategory('');
    } catch (err) {
      console.error('Kunde inte skapa regel:', err);
      alert('Kunde inte skapa regel: ' + err.message);
    }
  };

  const handleDeleteRule = async (id) => {
    try {
      await api.deleteCategoryRule(id);
      const updated = localRules.filter(r => r.id !== id);
      setLocalRules(updated);
      onRulesChange(updated);
    } catch (err) {
      console.error('Kunde inte ta bort regel:', err);
      alert('Kunde inte ta bort regel: ' + err.message);
    }
  };

  const handleToggleRule = async (id, isActive) => {
    try {
      await api.updateCategoryRule(id, { is_active: !isActive });
      const updated = localRules.map(r => 
        r.id === id ? { ...r, is_active: !isActive } : r
      );
      setLocalRules(updated);
      onRulesChange(updated);
    } catch (err) {
      console.error('Kunde inte uppdatera regel:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Kategoriregler</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {/* Add new rule */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Lägg till ny regel</h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={newPattern}
                onChange={(e) => setNewPattern(e.target.value)}
                placeholder="Beskrivning innehåller..."
                className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">Välj kategori...</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAddRule}
              disabled={!newPattern.trim() || !newCategory}
              className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Lägg till regel
            </button>
          </div>

          {/* Existing rules */}
          <div className="space-y-2">
            {localRules.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">Inga regler skapade än</p>
            ) : (
              localRules.map(rule => (
                <div
                  key={rule.id}
                  className={`p-3 rounded-lg border flex items-center justify-between ${
                    rule.is_active
                      ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700'
                      : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 opacity-60'
                  }`}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">
                      Om beskrivning innehåller <span className="font-mono text-indigo-600 dark:text-indigo-400">"{rule.description_pattern}"</span>
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      → Sätt kategori: <span className="font-semibold">{rule.category}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleRule(rule.id, rule.is_active)}
                      className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                        rule.is_active
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {rule.is_active ? 'Aktiv' : 'Inaktiv'}
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors"
          >
            Klar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
