import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { X, Sparkles, CheckCircle, AlertCircle, Loader2, Settings, Plus } from 'lucide-react';
import { api } from '../api';
import { useToast } from '../contexts/ToastContext';
import { formatAmount } from '../utils/formatAmount';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeButtonClass, getThemeTextClass, getThemeBgClass, getThemeBorderClass, getThemeRingClass } from '../utils/getThemeClasses';

const ApplyRulesModal = ({ transactions, categories = [], onClose, onApply, reloadData }) => {
  const { showToast } = useToast();
  const { colorTheme } = useTheme();
  const [categoryRules, setCategoryRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [preview, setPreview] = useState(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [localCategories, setLocalCategories] = useState(categories.map(c => c.name || c));
  const [excludedTransactionIds, setExcludedTransactionIds] = useState(new Set());

  useEffect(() => {
    loadCategoryRules();
  }, []);

  // Update local categories when prop changes
  useEffect(() => {
    if (categories) {
      setLocalCategories(categories.map(c => c.name || c));
    }
  }, [categories]);

  const loadCategoryRules = async () => {
    try {
      setLoading(true);
      const rules = await api.getCategoryRules();
      setCategoryRules(rules);
      calculatePreview(rules);
    } catch (err) {
      console.error('Kunde inte ladda regler:', err);
      showToast('Kunde inte ladda kategoriregler', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Apply category rules to description (same logic as ImportModal)
  const applyCategoryRules = (description, rules) => {
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

  // Calculate preview of what would change
  const calculatePreview = (rules = categoryRules) => {
    if (!transactions || transactions.length === 0) {
      setPreview({ changes: [], summary: {} });
      return;
    }

    const changes = [];
    const summary = {};

    transactions.forEach(transaction => {
      if (!transaction || !transaction.id) return; // Skip invalid transactions
      
      const currentCategory = typeof transaction.category === 'string' 
        ? transaction.category 
        : transaction.category?.name || 'Övrigt';
      
      // Use title or description field
      const title = transaction.title || transaction.description || '';
      if (!title || title.trim() === '') return; // Skip transactions without title/description
      
      const newCategory = applyCategoryRules(title, rules);

      if (newCategory && newCategory !== currentCategory) {
        changes.push({
          id: transaction.id,
          title: title,
          date: transaction.date || '',
          amount: transaction.amount || 0,
          currentCategory: currentCategory,
          newCategory: newCategory
        });
      }
    });

    // Calculate summary for all changes (exclusions handled separately)
    changes.forEach(change => {
      const key = `${change.currentCategory} → ${change.newCategory}`;
      if (!summary[key]) {
        summary[key] = { count: 0, amount: 0 };
      }
      summary[key].count++;
      const amountValue = parseFloat(change.amount?.toString().replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
      summary[key].amount += Math.abs(amountValue);
    });

    setPreview({ changes, summary });
  };

  const handleApply = async () => {
    if (!preview || preview.changes.length === 0) {
      showToast('Inga ändringar att tillämpa', { type: 'info' });
      return;
    }

    // Filter out excluded transactions
    const changesToApply = preview.changes.filter(change => !excludedTransactionIds.has(change.id));
    
    if (changesToApply.length === 0) {
      showToast('Inga ändringar att tillämpa (alla transaktioner är exkluderade)', { type: 'info' });
      return;
    }

    setIsApplying(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const change of changesToApply) {
        try {
          await api.updateTransaction(change.id, { category: change.newCategory });
          successCount++;
        } catch (err) {
          console.error(`Kunde inte uppdatera transaktion ${change.id}:`, err);
          errorCount++;
        }
      }

      if (successCount > 0) {
        showToast(`${successCount} transaktion(er) uppdaterade!`, { 
          type: 'success',
          description: errorCount > 0 ? `${errorCount} misslyckades` : undefined
        });
      }

      if (errorCount > 0 && successCount === 0) {
        showToast('Kunde inte uppdatera transaktioner', { type: 'error' });
      }

      if (onApply) {
        onApply();
      }
      if (reloadData) {
        await reloadData();
      }
      onClose();
    } catch (err) {
      console.error('Fel vid tillämpning av regler:', err);
      showToast('Ett fel uppstod vid tillämpning av regler', { type: 'error' });
    } finally {
      setIsApplying(false);
    }
  };

  useEffect(() => {
    if (categoryRules.length > 0) {
      calculatePreview(categoryRules);
    }
  }, [categoryRules, transactions]);

  // Recalculate summary when excludedTransactionIds changes
  useEffect(() => {
    if (preview && preview.changes.length > 0) {
      // Recalculate summary based on current exclusions
      const newSummary = {};
      preview.changes
        .filter(c => !excludedTransactionIds.has(c.id))
        .forEach(change => {
          const key = `${change.currentCategory} → ${change.newCategory}`;
          if (!newSummary[key]) {
            newSummary[key] = { count: 0, amount: 0 };
          }
          newSummary[key].count++;
          const amountValue = parseFloat(change.amount?.toString().replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
          newSummary[key].amount += Math.abs(amountValue);
        });
      setPreview({ ...preview, summary: newSummary });
    }
  }, [excludedTransactionIds]);

  const activeRulesCount = categoryRules.filter(r => r.is_active).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className={`w-6 h-6 ${getThemeTextClass(colorTheme, false)} dark:${getThemeTextClass(colorTheme, true)}`} />
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Tillämpa Kategoriregler
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className={`w-8 h-8 animate-spin ${getThemeTextClass(colorTheme, false)}`} />
            <span className="ml-3 text-zinc-600 dark:text-zinc-400">Laddar regler...</span>
          </div>
        ) : (
          <>
            <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  <strong>{activeRulesCount}</strong> aktiv(a) regel(n) kommer att tillämpas på <strong>{transactions?.length || 0}</strong> transaktion(er).
                </p>
                <button
                  onClick={() => setIsRulesModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                  title="Hantera kategoriregler"
                >
                  <Settings size={16} />
                  Hantera Regler
                </button>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Regler matchas mot transaktionens beskrivning/titel. Endast transaktioner som matchar en regel och har en annan kategori kommer att ändras.
              </p>
            </div>

            {preview && preview.changes.length > 0 ? (
              <>
                {/* Summary */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                    Sammanfattning
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(preview.summary).map(([key, data]) => {
                      // Recalculate summary based on non-excluded changes
                      const nonExcludedForCategory = preview.changes.filter(c => 
                        !excludedTransactionIds.has(c.id) && 
                        `${c.currentCategory} → ${c.newCategory}` === key
                      );
                      const actualCount = nonExcludedForCategory.length;
                      const actualAmount = nonExcludedForCategory.reduce((sum, c) => {
                        const amountValue = parseFloat(c.amount?.toString().replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
                        return sum + Math.abs(amountValue);
                      }, 0);
                      
                      if (actualCount === 0) return null; // Don't show if all are excluded
                      
                      return (
                        <div key={key} className={`flex items-center justify-between p-3 ${getThemeBgClass(colorTheme, false)} dark:${getThemeBgClass(colorTheme, true)}/20 rounded-lg border ${getThemeBorderClass(colorTheme)}/30 dark:${getThemeBorderClass(colorTheme)}/50`}>
                          <div className="flex items-center gap-2">
                            <CheckCircle className={`w-4 h-4 ${getThemeTextClass(colorTheme, false)}`} />
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{key}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                              {actualCount} transaktion(er)
                            </div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">
                              {formatAmount(actualAmount)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Changes List */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      Transaktioner som kommer att ändras ({preview.changes.filter(c => !excludedTransactionIds.has(c.id)).length} av {preview.changes.length})
                    </h3>
                    {preview.changes.length > 0 && (
                      <button
                        onClick={() => {
                          if (excludedTransactionIds.size === preview.changes.length) {
                            // Alla är exkluderade, inkludera alla
                            setExcludedTransactionIds(new Set());
                          } else {
                            // Exkludera alla
                            setExcludedTransactionIds(new Set(preview.changes.map(c => c.id)));
                          }
                        }}
                        className={`text-xs px-3 py-1.5 ${getThemeTextClass(colorTheme, false)} dark:${getThemeTextClass(colorTheme, true)} ${getThemeBgClass(colorTheme, false)} dark:${getThemeBgClass(colorTheme, true)}/30 rounded-lg transition-colors border ${getThemeBorderClass(colorTheme)}/30 dark:${getThemeBorderClass(colorTheme)}/50 hover:opacity-80`}
                      >
                        {excludedTransactionIds.size === preview.changes.length ? 'Välj alla' : 'Avmarkera alla'}
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3">
                    {preview.changes.map((change) => {
                      const isExcluded = excludedTransactionIds.has(change.id);
                      return (
                        <div 
                          key={change.id} 
                          className={`flex items-center gap-3 p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded transition-opacity ${isExcluded ? 'opacity-50' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={!isExcluded}
                            onChange={(e) => {
                              const newExcluded = new Set(excludedTransactionIds);
                              if (e.target.checked) {
                                newExcluded.delete(change.id);
                              } else {
                                newExcluded.add(change.id);
                              }
                              setExcludedTransactionIds(newExcluded);
                            }}
                            className={`w-4 h-4 ${getThemeTextClass(colorTheme, false)} bg-white border-zinc-300 rounded ${getThemeRingClass(colorTheme)} dark:bg-zinc-800 dark:border-zinc-600 cursor-pointer`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                              {change.title}
                            </div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">
                              {change.date} • {formatAmount(change.amount)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">{change.currentCategory}</span>
                            <span className="text-xs text-zinc-400">→</span>
                            <span className={`text-xs font-medium ${getThemeTextClass(colorTheme, false)} dark:${getThemeTextClass(colorTheme, true)}`}>{change.newCategory}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
                <p className="text-zinc-600 dark:text-zinc-400">
                  {activeRulesCount === 0 
                    ? 'Inga aktiva regler hittades. Skapa regler i Inställningar först.'
                    : 'Inga transaktioner matchar reglerna eller behöver ändras.'}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={onClose}
                disabled={isApplying}
                className="px-4 py-2 text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                Avbryt
              </button>
              <button
                onClick={handleApply}
                disabled={isApplying || !preview || preview.changes.filter(c => !excludedTransactionIds.has(c.id)).length === 0}
                className={`px-4 py-2 ${getThemeButtonClass(colorTheme, 'primary')} rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              >
                {isApplying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Tillämpar...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Tillämpa Regler ({preview?.changes.filter(c => !excludedTransactionIds.has(c.id)).length || 0})
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* Category Rules Modal */}
        {isRulesModalOpen && (
          <CategoryRulesModal
            onClose={() => setIsRulesModalOpen(false)}
            rules={categoryRules}
            onRulesChange={async (newRules) => {
              setCategoryRules(newRules);
              calculatePreview(newRules);
            }}
            onRuleCreated={(newRule) => {
              const updatedRules = [...categoryRules, newRule];
              setCategoryRules(updatedRules);
              calculatePreview(updatedRules);
            }}
            categories={localCategories}
            onCategoriesChange={(newCategories) => {
              setLocalCategories(newCategories);
            }}
          />
        )}
      </div>
    </div>
  );
};

// Category Rules Modal Component (copied from ImportModal.jsx)
const CategoryRulesModal = ({ onClose, rules, onRulesChange, categories, onCategoriesChange, onRuleCreated }) => {
  const { showToast } = useToast();
  const [localRules, setLocalRules] = useState(rules);
  const [newPatterns, setNewPatterns] = useState(['']);
  const [newCategory, setNewCategory] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [localCategories, setLocalCategories] = useState(categories);
  const [isCreatingCategoryLoading, setIsCreatingCategoryLoading] = useState(false);
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [isDeletingRule, setIsDeletingRule] = useState(null);
  const [isTogglingRule, setIsTogglingRule] = useState(null);
  
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [editingPatterns, setEditingPatterns] = useState([]);
  const [editingCategory, setEditingCategory] = useState('');
  const [isSavingRule, setIsSavingRule] = useState(null);
  const pendingRulesUpdateRef = useRef(null);
  const [rulesUpdateTrigger, setRulesUpdateTrigger] = useState(0);
  const editingPatternsRef = useRef([]);
  const editingCategoryRef = useRef('');

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  useEffect(() => {
    if (editingRuleId) {
      const updatedRule = rules.find(r => r.id === editingRuleId);
      if (updatedRule) {
        setLocalRules(prevRules => 
          prevRules.map(r => r.id === editingRuleId ? updatedRule : r)
        );
      }
    } else {
      setLocalRules(prevRules => {
        if (prevRules.length !== rules.length || 
            prevRules.some((r, i) => r.id !== rules[i]?.id)) {
          return rules;
        }
        return prevRules;
      });
    }
  }, [rules, editingRuleId, isSavingRule]);

  useEffect(() => {
    if (pendingRulesUpdateRef.current) {
      const { updated } = pendingRulesUpdateRef.current;
      pendingRulesUpdateRef.current = null;
      setTimeout(() => {
        onRulesChange(updated);
      }, 0);
    }
  }, [localRules, rulesUpdateTrigger, onRulesChange]);

  const handleCreateCategory = async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      showToast('Kategorinamn kan inte vara tomt', { type: 'error' });
      return;
    }

    if (localCategories.some(c => c.toLowerCase() === trimmedName.toLowerCase())) {
      showToast('En kategori med detta namn finns redan', { type: 'error' });
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
      setNewCategory(trimmedName);
      showToast(`Kategori "${trimmedName}" skapad!`, { type: 'success' });
    } catch (err) {
      showToast('Kunde inte skapa kategori: ' + (err.message || 'Okänt fel'), { type: 'error' });
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
    const validPatterns = newPatterns.map(p => p.trim()).filter(p => p);
    
    if (validPatterns.length === 0 || !newCategory) {
      showToast('Fyll i minst ett mönster och kategori', { type: 'error' });
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
      setLocalRules(updated);
      onRulesChange(updated);
      setNewPatterns(['']);
      setNewCategory('');
      
      if (onRuleCreated) {
        onRuleCreated(newRule);
      }
      
      showToast('Regel skapad!', { type: 'success' });
    } catch (err) {
      showToast('Kunde inte skapa regel: ' + (err.message || 'Okänt fel'), { type: 'error' });
    } finally {
      setIsCreatingRule(false);
    }
  };

  const handleDeleteRule = async (id) => {
    setIsDeletingRule(id);
    try {
      await api.deleteCategoryRule(id);
      const updated = localRules.filter(r => r.id !== id);
      setLocalRules(updated);
      pendingRulesUpdateRef.current = { updated, ruleId: null };
      setRulesUpdateTrigger(prev => prev + 1);
      showToast('Regel borttagen', { type: 'success' });
    } catch (err) {
      showToast('Kunde inte ta bort regel: ' + (err.message || 'Okänt fel'), { type: 'error' });
    } finally {
      setIsDeletingRule(null);
    }
  };

  const handleToggleRule = async (id, isActive, e) => {
    if (e) e.stopPropagation();
    setIsTogglingRule(id);
    try {
      await api.updateCategoryRule(id, { is_active: !isActive });
      const updated = localRules.map(r => 
        r.id === id ? { ...r, is_active: !isActive } : r
      );
      setLocalRules(updated);
      onRulesChange(updated);
      showToast(`Regel ${!isActive ? 'aktiverad' : 'inaktiverad'}`, { type: 'success' });
    } catch (err) {
      showToast('Kunde inte uppdatera regel: ' + (err.message || 'Okänt fel'), { type: 'error' });
    } finally {
      setIsTogglingRule(null);
    }
  };

  const saveRule = useCallback(async (ruleId, patterns, category) => {
    const validPatterns = patterns.map(p => p.trim()).filter(p => p);
    if (validPatterns.length === 0 || !category) return;

    setIsSavingRule(ruleId);
    try {
      const savedRule = await api.updateCategoryRule(ruleId, {
        description_patterns: validPatterns,
        category: category
      });
      
      const savedPatterns = savedRule.description_patterns || [savedRule.description_pattern].filter(p => p);
      
      setLocalRules(prevRules => {
        const updated = prevRules.map(r => 
          r.id === ruleId 
            ? { ...r, description_patterns: savedPatterns, category: savedRule.category }
            : r
        );
        pendingRulesUpdateRef.current = { updated, ruleId };
        setRulesUpdateTrigger(prev => prev + 1);
        return updated;
      });
      
      const currentPatterns = editingPatternsRef.current;
      const emptyPatterns = currentPatterns.filter(p => !p.trim());
      const savedPatternsArray = savedPatterns.length > 0 ? [...savedPatterns, ...emptyPatterns] : [...emptyPatterns];
      if (savedPatternsArray.length === 0 || savedPatternsArray[savedPatternsArray.length - 1].trim()) {
        savedPatternsArray.push('');
      }
      
      setEditingPatterns(savedPatternsArray);
      editingPatternsRef.current = savedPatternsArray;
      setEditingCategory(savedRule.category);
      editingCategoryRef.current = savedRule.category;
      
      setTimeout(() => setIsSavingRule(null), 100);
    } catch (err) {
      showToast('Kunde inte spara regel: ' + (err.message || 'Okänt fel'), { type: 'error' });
      setIsSavingRule(null);
    }
  }, [onRulesChange, showToast]);

  const handleEditRule = (rule) => {
    const patterns = rule.description_patterns || [rule.description_pattern].filter(p => p);
    const patternsArray = patterns.length > 0 ? [...patterns] : [''];
    setEditingRuleId(rule.id);
    setEditingPatterns(patternsArray);
    editingPatternsRef.current = patternsArray;
    setEditingCategory(rule.category || '');
    editingCategoryRef.current = rule.category || '';
  };

  const handleCancelEdit = () => {
    setEditingRuleId(null);
    setEditingPatterns([]);
    editingPatternsRef.current = [];
    setEditingCategory('');
    editingCategoryRef.current = '';
    setIsSavingRule(null);
  };

  const handleClose = () => {
    if (editingRuleId) {
      saveRule(editingRuleId, editingPatternsRef.current, editingCategoryRef.current);
    }
    onClose();
  };

  const handleEditingPatternChange = (index, value) => {
    const updated = [...editingPatterns];
    updated[index] = value;
    setEditingPatterns(updated);
    editingPatternsRef.current = updated;
  };

  const handleEditingPatternBlur = () => {
    setTimeout(() => {
      if (editingRuleId) {
        saveRule(editingRuleId, editingPatternsRef.current, editingCategoryRef.current);
      }
    }, 50);
  };

  const handleEditingCategoryChange = (value) => {
    setEditingCategory(value);
    editingCategoryRef.current = value;
  };

  const handleEditingCategoryBlur = () => {
    if (editingRuleId) {
      saveRule(editingRuleId, editingPatternsRef.current, editingCategoryRef.current);
    }
  };

  const handleAddEditingPattern = () => {
    const updated = [...editingPatterns, ''];
    setEditingPatterns(updated);
    editingPatternsRef.current = updated;
  };

  const handleRemoveEditingPattern = (index) => {
    if (editingPatterns.length > 1) {
      const updated = editingPatterns.filter((_, i) => i !== index);
      setEditingPatterns(updated);
      editingPatternsRef.current = updated;
      if (editingRuleId) {
        saveRule(editingRuleId, updated, editingCategoryRef.current);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Kategoriregler</h2>
          <button onClick={handleClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Lägg till ny regel</h3>
            <div className="space-y-3">
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
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">Redigerar regel</p>
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
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Mönster:</label>
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
                        
                        <div>
                          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Kategori:</label>
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
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">Om beskrivning innehåller:</p>
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
            onClick={handleClose}
            className={`px-4 py-2 ${getThemeButtonClass(colorTheme, 'primary')} font-semibold rounded-lg transition-colors`}
          >
            Klar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplyRulesModal;

