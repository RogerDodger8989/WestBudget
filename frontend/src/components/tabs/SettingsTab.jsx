import React, { useState, useEffect, useMemo } from 'react';
import { Settings, FolderOpen, Save, CheckCircle, Image as ImageIcon, Tag, Plus, Edit2, Trash2, X, Merge, AlertCircle } from 'lucide-react';
import { api } from '../../api';
import { useToast } from '../../contexts/ToastContext';
import CategoryEditForm from '../CategoryEditForm';
import MergeCategoryModal from '../MergeCategoryModal';

const SettingsTab = ({ getTitle, reloadData }) => {
  const { showToast } = useToast();
  const [receiptPath, setReceiptPath] = useState('C:\\Users\\Documents\\Kvitton');
  const [agreementImagesPath, setAgreementImagesPath] = useState('C:\\Users\\Documents\\Avtal\\Bilder');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [categoryRules, setCategoryRules] = useState([]);
  const [newRulePattern, setNewRulePattern] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState('');
  
  // Hitta dubletter (kategorier med samma namn, case-insensitive)
  const duplicates = useMemo(() => {
    const nameMap = {};
    categories.forEach(cat => {
      const lowerName = cat.name.toLowerCase();
      if (!nameMap[lowerName]) {
        nameMap[lowerName] = [];
      }
      nameMap[lowerName].push(cat);
    });
    
    return Object.values(nameMap).filter(group => group.length > 1);
  }, [categories]);

  // Ladda inställningar och kategorier vid mount
  useEffect(() => {
    loadSettings();
    loadCategories();
    loadCategoryRules();
  }, []);

  const loadCategoryRules = async () => {
    try {
      const rules = await api.getCategoryRules();
      setCategoryRules(rules);
    } catch (error) {
      console.error('Kunde inte ladda kategoriregler:', error);
    }
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await api.getSettings();
      
      if (settings.receipt_storage_path) {
        setReceiptPath(settings.receipt_storage_path);
      }
      
      if (settings.agreement_images_path) {
        setAgreementImagesPath(settings.agreement_images_path);
      }
    } catch (error) {
      console.error('Kunde inte ladda inställningar:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await api.getCategoriesWithIds();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Kunde inte ladda kategorier:', error);
    }
  };

  const handleAddCategory = async () => {
    const trimmedName = newCategoryName.trim();
    
    if (!trimmedName) {
      showToast('Kategorinamn kan inte vara tomt', { type: 'error' });
      return;
    }

    // Kontrollera om kategori redan finns (case-insensitive)
    const exists = categories.some(cat => cat.name.toLowerCase() === trimmedName.toLowerCase());
    if (exists) {
      showToast('En kategori med detta namn finns redan. Använd merge för att slå ihop dem.', { type: 'error' });
      return;
    }

    try {
      await api.createCategory(trimmedName);
      setNewCategoryName('');
      setIsAddingCategory(false);
      await loadCategories();
      if (reloadData) {
        await reloadData();
      }
      showToast('Kategori skapad!', { type: 'success' });
    } catch (error) {
      console.error('Kunde inte skapa kategori:', error);
      showToast(error.message || 'Kunde inte skapa kategori. Kategorin kanske redan finns.', { type: 'error' });
    }
  };

  const handleUpdateCategory = async (id, newName) => {
    const trimmedName = newName.trim();
    
    if (!trimmedName) {
      showToast('Kategorinamn kan inte vara tomt', { type: 'error' });
      return;
    }

    // Kontrollera om kategori redan finns (case-insensitive, exkludera aktuell kategori)
    const exists = categories.some(cat => 
      cat.id !== id && cat.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (exists) {
      showToast('En kategori med detta namn finns redan. Använd merge för att slå ihop dem.', { type: 'error' });
      return;
    }

    // Spara gamla värdet för undo
    const category = categories.find(c => c.id === id);
    const oldName = category?.name;

    try {
      await api.updateCategory(id, trimmedName);
      setEditingCategory(null);
      await loadCategories();
      if (reloadData) {
        await reloadData();
      }
      showToast('Kategori uppdaterad!', { 
        type: 'success',
        undo: true,
        undoAction: async () => {
          try {
            await api.updateCategory(id, oldName);
            await loadCategories();
            if (reloadData) await reloadData();
          } catch (err) {
            console.error('Kunde inte ångra:', err);
          }
        }
      });
    } catch (error) {
      console.error('Kunde inte uppdatera kategori:', error);
      showToast(error.message || 'Kunde inte uppdatera kategori. Kategorin kanske redan finns.', { type: 'error' });
    }
  };

  const handleMergeCategories = async (sourceId, targetId, newName) => {
    try {
      const result = await api.mergeCategories(sourceId, targetId, newName);
      await loadCategories();
      if (reloadData) {
        await reloadData();
      }
      showToast(`Kategorier mergade! ${result.transactions_updated || 0} transaktioner och ${result.agreements_updated || 0} avtal uppdaterade.`, { 
        type: 'success',
        undo: true,
        undoAction: async () => {
          // Note: Merge undo är komplex - skulle kräva att spara all data innan merge
          showToast('Ångra merge stöds inte ännu', { type: 'info' });
        }
      });
    } catch (error) {
      console.error('Kunde inte merga kategorier:', error);
      showToast(error.message || 'Kunde inte merga kategorier.', { type: 'error' });
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!confirm(`Är du säker på att du vill ta bort kategorin "${name}"?\n\nObs: Kategorier som används i transaktioner eller avtal kan inte tas bort.`)) {
      return;
    }

    // Spara kategorin för undo
    const category = categories.find(c => c.id === id);
    const categoryData = category ? { ...category } : null;

    try {
      await api.deleteCategory(id);
      await loadCategories();
      if (reloadData) {
        await reloadData();
      }
      showToast('Kategori borttagen!', { 
        type: 'success',
        undo: true,
        undoAction: async () => {
          try {
            if (categoryData) {
              await api.createCategory(categoryData.name);
              await loadCategories();
              if (reloadData) await reloadData();
            }
          } catch (err) {
            console.error('Kunde inte ångra:', err);
          }
        }
      });
    } catch (error) {
      console.error('Kunde inte ta bort kategori:', error);
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.transactions > 0 || errorData.agreements > 0) {
          showToast(`Kan inte ta bort kategori som används i ${errorData.transactions || 0} transaktioner och ${errorData.agreements || 0} avtal.`, { type: 'error' });
        } else {
          showToast(error.message || 'Kunde inte ta bort kategori.', { type: 'error' });
        }
      } catch {
        showToast(error.message || 'Kunde inte ta bort kategori.', { type: 'error' });
      }
    }
  };

  const handleSave = async () => {
    try {
      await api.saveSettings({
        receipt_storage_path: receiptPath,
        agreement_images_path: agreementImagesPath
      });
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      showToast('Inställningar sparade!', { type: 'success' });
    } catch (error) {
      console.error('❌ Kunde inte spara inställningar:', error);
      alert('Kunde inte spara inställningar. Kontrollera att servern körs.');
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
            {getTitle()}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Konfigurera applikationens inställningar
          </p>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Receipt Storage Section */}
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
              <FolderOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Kvittolagring</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Välj var kvitton ska sparas</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Sökväg för kvitton
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={receiptPath}
                  onChange={(e) => setReceiptPath(e.target.value)}
                  placeholder="C:\Dokument\Kvitton"
                  disabled={loading}
                  className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
                />
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                    saved 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {saved ? (
                    <>
                      <CheckCircle size={18} />
                      Sparad
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Spara
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Kvitton kommer automatiskt att sparas i denna mapp när de laddas upp.
              </p>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Använd en molnsynkad mapp för automatisk backup</li>
                    <li>• Skapa undermappar per år/månad för bättre organisation</li>
                    <li>• Se till att mappen har skrivrättigheter</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Agreement Images Storage Section */}
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
              <ImageIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Avtalsbilder</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Välj var avtalsbilder ska sparas</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Sökväg för avtalsbilder
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={agreementImagesPath}
                  onChange={(e) => setAgreementImagesPath(e.target.value)}
                  placeholder="C:\Dokument\Avtal\Bilder"
                  disabled={loading}
                  className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
                />
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                    saved 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {saved ? (
                    <>
                      <CheckCircle size={18} />
                      Sparad
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Spara
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Avtalsbilder kommer automatiskt att sparas i denna mapp när de laddas upp.
              </p>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Använd en molnsynkad mapp för automatisk backup</li>
                    <li>• Skapa undermappar per avtal för bättre organisation</li>
                    <li>• Se till att mappen har skrivrättigheter</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Management */}
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                <Tag className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Kategorier</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Hantera transaktions- och avtalskategorier</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsMergeModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-all"
              >
                <Merge size={16} />
                Merga
              </button>
              <button
                onClick={() => setIsAddingCategory(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-all"
              >
                <Plus size={16} />
                Lägg till
              </button>
            </div>
          </div>

          {/* Duplicate Warning */}
          {duplicates.length > 0 && (
            <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
                    Dubletter hittade ({duplicates.length} grupper)
                  </p>
                  <div className="space-y-1">
                    {duplicates.map((group, idx) => (
                      <p key={idx} className="text-xs text-amber-700 dark:text-amber-400">
                        • {group.map(c => c.name).join(', ')} - Använd "Merga" för att slå ihop dem
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {/* Add Category Form */}
            {isAddingCategory && (
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                    placeholder="Kategorinamn"
                    autoFocus
                    className="flex-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleAddCategory}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-all"
                  >
                    Spara
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingCategory(false);
                      setNewCategoryName('');
                    }}
                    className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Categories List */}
            {categories.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                Inga kategorier hittades
              </div>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {editingCategory === category.id ? (
                    <CategoryEditForm
                      category={category}
                      onSave={(newName) => {
                        handleUpdateCategory(category.id, newName);
                      }}
                      onCancel={() => setEditingCategory(null)}
                    />
                  ) : (
                    <>
                      <div className="flex-1">
                        <span className="text-zinc-900 dark:text-white font-medium">{category.name}</span>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-zinc-500">
                            {category.transaction_count || 0} transaktioner
                          </span>
                          <span className="text-xs text-zinc-400">•</span>
                          <span className="text-xs text-zinc-500">
                            {category.agreement_count || 0} avtal
                          </span>
                          {(category.total_usage || 0) > 0 && (
                            <>
                              <span className="text-xs text-zinc-400">•</span>
                              <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                {category.total_usage} totalt
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingCategory(category.id)}
                          className="p-2 text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-all"
                          title="Redigera"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id, category.name)}
                          className="p-2 text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-all"
                          title="Ta bort"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Category Rules Section */}
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Kategoriregler</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Automatisk kategorisering vid import</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Add new rule */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Lägg till ny regel</h4>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newRulePattern}
                  onChange={(e) => setNewRulePattern(e.target.value)}
                  placeholder="Beskrivning innehåller..."
                  className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <select
                  value={newRuleCategory}
                  onChange={(e) => setNewRuleCategory(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Välj kategori...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={async () => {
                  if (!newRulePattern.trim() || !newRuleCategory) {
                    showToast('Fyll i både mönster och kategori', { type: 'error' });
                    return;
                  }
                  try {
                    await api.createCategoryRule({
                      description_patterns: [newRulePattern.trim()],
                      category: newRuleCategory,
                      is_active: true
                    });
                    setNewRulePattern('');
                    setNewRuleCategory('');
                    await loadCategoryRules();
                    showToast('Regel skapad!', { type: 'success' });
                  } catch (err) {
                    showToast('Kunde inte skapa regel: ' + (err.message || 'Okänt fel'), { type: 'error' });
                  }
                }}
                disabled={!newRulePattern.trim() || !newRuleCategory}
                className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Lägg till regel
              </button>
            </div>

            {/* Existing rules */}
            <div className="space-y-2">
              {categoryRules.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-4">Inga regler skapade än</p>
              ) : (
                categoryRules.map(rule => (
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
                        onClick={async () => {
                          try {
                            await api.updateCategoryRule(rule.id, { is_active: !rule.is_active });
                            await loadCategoryRules();
                          } catch (err) {
                            showToast('Kunde inte uppdatera regel', { type: 'error' });
                          }
                        }}
                        className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                          rule.is_active
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                            : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {rule.is_active ? 'Aktiv' : 'Inaktiv'}
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm(`Är du säker på att du vill ta bort regeln?\n\n"${rule.description_pattern}" → ${rule.category}`)) {
                            return;
                          }
                          try {
                            await api.deleteCategoryRule(rule.id);
                            await loadCategoryRules();
                            showToast('Regel borttagen', { type: 'success' });
                          } catch (err) {
                            showToast('Kunde inte ta bort regel', { type: 'error' });
                          }
                        }}
                        className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Application Settings */}
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
              <Settings className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Allmänna inställningar</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Applikationsinställningar</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Mörkt tema</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Växla mellan ljust och mörkt läge</p>
              </div>
              <div className="text-xs text-zinc-500">
                (Använd växlaren i sidofältet)
              </div>
            </div>

            {/* Language */}
            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Språk</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Applikationens språk</p>
              </div>
              <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-medium">
                Svenska
              </span>
            </div>

            {/* Currency */}
            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Valuta</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Standard valuta för transaktioner</p>
              </div>
              <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700">
                SEK (kr)
              </span>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm dark:shadow-none">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Om WestBudget</h3>
          <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <div className="flex justify-between">
              <span>Version:</span>
              <span className="font-mono text-zinc-900 dark:text-white">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>Byggd med:</span>
              <span className="text-zinc-900 dark:text-white">React + Flask</span>
            </div>
            <div className="flex justify-between">
              <span>Licens:</span>
              <span className="text-zinc-900 dark:text-white">Premium</span>
            </div>
          </div>
        </div>

      </div>

      {/* Merge Category Modal */}
      <MergeCategoryModal
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        categories={categories}
        onMerge={handleMergeCategories}
      />
    </div>
  );
};

export default SettingsTab;

