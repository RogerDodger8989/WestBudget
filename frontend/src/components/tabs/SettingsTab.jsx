import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Settings, FolderOpen, Save, CheckCircle, Image as ImageIcon, Tag, Plus, Edit2, Trash2, X, Merge, AlertCircle, Loader2, Download, Upload, Database, Search, Filter, Calendar, FileText, Grid3x3, List, User, Mail, Phone, MapPin, Palette, History, Folder } from 'lucide-react';
import { api } from '../../api';
import { useToast } from '../../contexts/ToastContext';
import CategoryEditForm from '../CategoryEditForm';
import MergeCategoryModal from '../MergeCategoryModal';
import ThemeCustomizer from '../ThemeCustomizer';
import HistoryTab from './HistoryTab';
import LicenseStatus from '../LicenseStatus';
import AdminPanel from './AdminPanel';
import { useAuth } from '../../contexts/AuthContext';
import { applyTheme, getCurrentTheme } from '../../utils/themes';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeButtonClass, getThemeBgClass, getThemeTextClass, getThemeBorderClass } from '../../utils/getThemeClasses';
import ImageLightbox from '../ImageLightbox';
import { useImageLightbox } from '../../hooks/useImageLightbox';

const SettingsTab = ({ getTitle, reloadData, isDarkMode, toggleTheme, transactions = [], userName: externalUserName, setUserName: setExternalUserName, setActiveTab, setSelectedTransaction }) => {
  const { showToast } = useToast();
  const { colorTheme, changeTheme } = useTheme();
  const { user } = useAuth();
  const { lightboxImages, lightboxIndex, openLightbox, closeLightbox, setLightboxIndex } = useImageLightbox();
  const [activeSubTab, setActiveSubTab] = useState('general'); // 'general', 'categories', 'images', 'history'
  const [localColorTheme, setLocalColorTheme] = useState(colorTheme || 'indigo');
  const [receiptPath, setReceiptPath] = useState('C:\\Users\\Documents\\Kvitton');
  const [agreementImagesPath, setAgreementImagesPath] = useState('C:\\Users\\Documents\\Avtal\\Bilder');
  const [defaultTheme, setDefaultTheme] = useState('dark'); // 'dark' or 'light'
  const [isThemeCustomizerOpen, setIsThemeCustomizerOpen] = useState(false);
  const [userName, setUserName] = useState(externalUserName || '');
  const [userAddress, setUserAddress] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [categoryRules, setCategoryRules] = useState([]);
  const [newRulePatterns, setNewRulePatterns] = useState(['']); // Array of patterns
  const [newRuleCategory, setNewRuleCategory] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState('categories'); // 'categories' or 'rules'
  
  // Media library states
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaSearchQuery, setMediaSearchQuery] = useState('');
  const [mediaSortBy, setMediaSortBy] = useState('date'); // 'date', 'name', 'size'
  const [mediaSortOrder, setMediaSortOrder] = useState('desc'); // 'asc', 'desc'
  const [mediaFilterType, setMediaFilterType] = useState('all'); // 'all', 'receipts', 'agreements'
  const [mediaViewMode, setMediaViewMode] = useState('grid'); // 'grid', 'list'
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [selectedMediaFiles, setSelectedMediaFiles] = useState(new Set());
  
  // Inline editing states for category rules
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [editingPatterns, setEditingPatterns] = useState([]);
  const [editingRuleCategory, setEditingRuleCategory] = useState('');
  const [isSavingRule, setIsSavingRule] = useState(null);
  const editingPatternsRef = useRef([]);
  const editingCategoryRef = useRef('');
  
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

  // Sync external userName when it changes
  useEffect(() => {
    if (externalUserName && externalUserName !== userName) {
      setUserName(externalUserName);
    }
  }, [externalUserName]);

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
      
      if (settings.default_theme) {
        setDefaultTheme(settings.default_theme);
      } else {
        // Om ingen inställning finns, använd nuvarande tema
        const currentTheme = isDarkMode ? 'dark' : 'light';
        setDefaultTheme(currentTheme);
      }
      
      // Load color theme
      if (settings.color_theme) {
        setLocalColorTheme(settings.color_theme);
        changeTheme(settings.color_theme);
      } else if (colorTheme) {
        setLocalColorTheme(colorTheme);
      }
      
      // Load user information
      if (settings.user_name) {
        setUserName(settings.user_name);
        // Update external userName if setter is provided
        if (setExternalUserName) {
          setExternalUserName(settings.user_name);
        }
      }
      if (settings.user_address) {
        setUserAddress(settings.user_address);
      }
      if (settings.user_phone) {
        setUserPhone(settings.user_phone);
      }
      if (settings.user_email) {
        setUserEmail(settings.user_email);
      }
    } catch (error) {
      console.error('Kunde inte ladda inställningar:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Uppdatera defaultTheme när isDarkMode ändras (om det ändras via sidofältet)
  useEffect(() => {
    if (!loading) {
      const currentTheme = isDarkMode ? 'dark' : 'light';
      // Uppdatera bara om det inte redan är korrekt
      if (defaultTheme !== currentTheme) {
        setDefaultTheme(currentTheme);
      }
    }
  }, [isDarkMode]);

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

  // Save category rule (inline editing)
  const saveRule = useCallback(async (ruleId, patterns, category) => {
    const validPatterns = patterns.map(p => p.trim()).filter(p => p);
    
    if (validPatterns.length === 0) {
      return; // Don't save if no valid patterns
    }

    if (!category) {
      return; // Don't save if no category
    }

    setIsSavingRule(ruleId);
    try {
      const savedRule = await api.updateCategoryRule(ruleId, {
        description_patterns: validPatterns,
        category: category
      });
      
      // Parse the saved rule to get the correct format
      const savedPatterns = savedRule.description_patterns || [savedRule.description_pattern].filter(p => p);
      
      // Update local rules
      setCategoryRules(prevRules => 
        prevRules.map(r => 
          r.id === ruleId 
            ? { ...r, description_patterns: savedPatterns, category: savedRule.category }
            : r
        )
      );
      
      // Update editing state - keep empty patterns for adding more
      const currentPatterns = editingPatternsRef.current;
      const emptyPatterns = currentPatterns.filter(p => !p.trim());
      const savedPatternsArray = savedPatterns.length > 0 ? [...savedPatterns, ...emptyPatterns] : [...emptyPatterns];
      
      if (savedPatternsArray.length === 0) {
        savedPatternsArray.push(''); // Always have at least one empty field
      }
      
      setEditingPatterns(savedPatternsArray);
      editingPatternsRef.current = savedPatternsArray;
      setEditingRuleCategory(savedRule.category);
      editingCategoryRef.current = savedRule.category;
      
      showToast('Regel uppdaterad!', { type: 'success' });
    } catch (err) {
      console.error('Kunde inte spara regel:', err);
      showToast('Kunde inte spara regel: ' + (err.message || 'Okänt fel'), { type: 'error' });
    } finally {
      setIsSavingRule(null);
    }
  }, []);

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

  const handleSelectFolder = async (type) => {
    try {
      const response = await api.selectFolder();
      if (response.path) {
        if (type === 'receipt') {
          setReceiptPath(response.path);
        } else if (type === 'agreement') {
          setAgreementImagesPath(response.path);
        }
        showToast('Mapp vald!', { type: 'success' });
      }
    } catch (error) {
      console.error('Kunde inte välja mapp:', error);
      showToast(error.message || 'Kunde inte välja mapp. Ange sökväg manuellt.', { type: 'error' });
    }
  };

  const handleSave = async () => {
    try {
      await api.saveSettings({
        receipt_storage_path: receiptPath,
        agreement_images_path: agreementImagesPath,
        default_theme: defaultTheme,
        user_name: userName,
        user_address: userAddress,
        user_phone: userPhone,
        user_email: userEmail
      });
      
      // Update external userName if setter is provided
      if (setExternalUserName) {
        setExternalUserName(userName);
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      showToast('Inställningar sparade!', { type: 'success' });
    } catch (error) {
      console.error('❌ Kunde inte spara inställningar:', error);
      showToast('Kunde inte spara inställningar. Kontrollera att servern körs.', { type: 'error' });
    }
  };

  // Load media files
  const loadMediaFiles = async () => {
    setLoadingMedia(true);
    try {
      const files = await api.getMediaFiles();
      setMediaFiles(files);
    } catch (error) {
      console.error('Kunde inte ladda mediafiler:', error);
      showToast('Kunde inte ladda mediafiler', { type: 'error' });
    } finally {
      setLoadingMedia(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'images') {
      loadMediaFiles();
    }
  }, [activeSubTab]);

  // Filter and sort media files
  const filteredAndSortedMedia = useMemo(() => {
    let filtered = [...mediaFiles];

    // Filter by type
    if (mediaFilterType !== 'all') {
      filtered = filtered.filter(file => {
        if (mediaFilterType === 'receipts') {
          return file.type === 'receipt';
        } else if (mediaFilterType === 'agreements') {
          return file.type === 'agreement';
        }
        return true;
      });
    }

    // Filter by search query
    if (mediaSearchQuery) {
      const query = mediaSearchQuery.toLowerCase();
      filtered = filtered.filter(file => 
        file.filename.toLowerCase().includes(query) ||
        file.path.toLowerCase().includes(query) ||
        (file.transaction_title && file.transaction_title.toLowerCase().includes(query)) ||
        (file.agreement_name && file.agreement_name.toLowerCase().includes(query))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (mediaSortBy === 'date') {
        comparison = new Date(a.date || 0) - new Date(b.date || 0);
      } else if (mediaSortBy === 'name') {
        comparison = a.filename.localeCompare(b.filename);
      } else if (mediaSortBy === 'size') {
        comparison = (a.size || 0) - (b.size || 0);
      }
      return mediaSortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [mediaFiles, mediaSearchQuery, mediaSortBy, mediaSortOrder, mediaFilterType]);

  // Handle media file selection
  const handleToggleMediaFile = (filePath) => {
    const newSelected = new Set(selectedMediaFiles);
    if (newSelected.has(filePath)) {
      newSelected.delete(filePath);
    } else {
      newSelected.add(filePath);
    }
    setSelectedMediaFiles(newSelected);
  };

  const handleSelectAllMedia = (checked) => {
    if (checked) {
      const allPaths = new Set(filteredAndSortedMedia.map(f => f.path));
      setSelectedMediaFiles(allPaths);
    } else {
      setSelectedMediaFiles(new Set());
    }
  };

  const handleDeleteSelectedMedia = async () => {
    const filesToDelete = filteredAndSortedMedia.filter(f => selectedMediaFiles.has(f.path));
    const deletedFiles = [];
    
    try {
      for (const file of filesToDelete) {
        if (file.transaction_id) {
          // Delete receipt
          try {
            const result = await api.deleteTransactionReceipt(file.transaction_id, file.path);
            deletedFiles.push({
              type: 'receipt',
              transactionId: file.transaction_id,
              path: file.path,
              deletedPath: result.deleted_path,
              transactionTitle: file.transaction_title
            });
          } catch (error) {
            console.error(`Kunde inte radera kvitto ${file.path}:`, error);
          }
        } else if (file.agreement_id) {
          // Delete agreement image
          try {
            const result = await api.deleteAgreementImage(file.agreement_id, file.path);
            deletedFiles.push({
              type: 'agreement',
              agreementId: file.agreement_id,
              path: file.path,
              deletedPath: result.deleted_path || result.moved_path,
              agreementName: file.agreement_name
            });
          } catch (error) {
            console.error(`Kunde inte radera avtalsbild ${file.path}:`, error);
          }
        }
      }
      
      await loadMediaFiles();
      if (reloadData) await reloadData();
      setSelectedMediaFiles(new Set());
      
      showToast(`${filesToDelete.length} fil(er) raderade!`, { 
        type: 'success',
        undo: true,
        undoAction: async () => {
          try {
            for (const deletedFile of deletedFiles) {
              if (!deletedFile.deletedPath) continue;
              
              const deletedFileUrl = `http://192.168.1.232:5000/api/files/${encodeURIComponent(deletedFile.deletedPath.replace(/\\/g, '/'))}`;
              const response = await fetch(deletedFileUrl);
              if (!response.ok) continue;
              
              const blob = await response.blob();
              const filename = deletedFile.deletedPath.split(/[/\\]/).pop();
              const fileToUpload = new File([blob], filename, { type: blob.type });
              
              if (deletedFile.type === 'receipt') {
                await api.uploadReceipt(fileToUpload, deletedFile.transactionId);
              } else if (deletedFile.type === 'agreement') {
                await api.uploadAgreementImage(deletedFile.agreementId, fileToUpload);
              }
            }
            
            await loadMediaFiles();
            if (reloadData) await reloadData();
            showToast('Filer återställda!', { type: 'success' });
          } catch (err) {
            console.error('Kunde inte ångra radering:', err);
            showToast('Kunde inte ångra: ' + (err.message || 'Okänt fel'), { type: 'error' });
          }
        }
      });
    } catch (error) {
      console.error('Kunde inte radera filer:', error);
      showToast('Kunde inte radera filer: ' + (error.message || 'Okänt fel'), { type: 'error' });
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

      {/* Sub-menu Tabs */}
      <div className="flex items-center gap-1 bg-zinc-200 dark:bg-zinc-900/50 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveSubTab('general')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            activeSubTab === 'general'
              ? `${getThemeBgClass(colorTheme, false)} dark:${getThemeBgClass(colorTheme, true)} ${getThemeTextClass(colorTheme, false)} dark:${getThemeTextClass(colorTheme, true)} shadow-sm`
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Settings size={16} />
          Allmänna inställningar
        </button>
        <button
          onClick={() => setActiveSubTab('categories')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            activeSubTab === 'categories'
              ? `${getThemeBgClass(colorTheme, false)} dark:${getThemeBgClass(colorTheme, true)} ${getThemeTextClass(colorTheme, false)} dark:${getThemeTextClass(colorTheme, true)} shadow-sm`
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Tag size={16} />
          Kategorier & Regler
        </button>
        <button
          onClick={() => setActiveSubTab('images')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            activeSubTab === 'images'
              ? `${getThemeBgClass(colorTheme, false)} dark:${getThemeBgClass(colorTheme, true)} ${getThemeTextClass(colorTheme, false)} dark:${getThemeTextClass(colorTheme, true)} shadow-sm`
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <ImageIcon size={16} />
          Bilder
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            activeSubTab === 'history'
              ? `${getThemeBgClass(colorTheme, false)} dark:${getThemeBgClass(colorTheme, true)} ${getThemeTextClass(colorTheme, false)} dark:${getThemeTextClass(colorTheme, true)} shadow-sm`
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <History size={16} />
          Historik
        </button>
        {user?.role === 'admin' && (
          <button
            onClick={() => setActiveSubTab('admin')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeSubTab === 'admin'
                ? `${getThemeBgClass(colorTheme, false)} dark:${getThemeBgClass(colorTheme, true)} ${getThemeTextClass(colorTheme, false)} dark:${getThemeTextClass(colorTheme, true)} shadow-sm`
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Settings size={16} />
            Admin
          </button>
        )}
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Allmänna inställningar Tab */}
        {activeSubTab === 'general' && (
          <>
        
        {/* License Status */}
        <LicenseStatus />
        
        {/* User Information */}
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
              <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Personlig information</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Uppdatera din kontaktinformation</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                <User size={16} />
                Namn
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Ditt namn"
                disabled={loading}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                <MapPin size={16} />
                Adress
              </label>
              <input
                type="text"
                value={userAddress}
                onChange={(e) => setUserAddress(e.target.value)}
                placeholder="Din adress"
                disabled={loading}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                <Phone size={16} />
                Telefon
              </label>
              <input
                type="tel"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                placeholder="Ditt telefonnummer"
                disabled={loading}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                <Mail size={16} />
                E-post
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="din@epost.se"
                disabled={loading}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
              />
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button 
                onClick={handleSave}
                disabled={loading}
                className={`w-full px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  saved 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                    : `${getThemeButtonClass(colorTheme, 'primary')} disabled:opacity-50 disabled:cursor-not-allowed`
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
                    Spara ändringar
                  </>
                )}
              </button>
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
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Applikationsinställningar</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Systeminställningar</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Color Theme */}
            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Färgtema</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Välj primärfärg för applikationen</p>
              </div>
              <button
                onClick={() => setIsThemeCustomizerOpen(true)}
                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${getThemeButtonClass(colorTheme, 'primary')}`}
              >
                <Palette size={16} />
                Anpassa
              </button>
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

        {/* Backup & Restore Section */}
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm dark:shadow-none">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <Database size={18} className="text-indigo-500 dark:text-indigo-400" />
            Backup & Återställning
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Skapa en säkerhetskopia av all din data inklusive transaktioner, avtal, fordon och bilder.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={async () => {
                try {
                  showToast('Skapar backup...', { type: 'info' });
                  await api.createBackup();
                  showToast('Backup skapad och nedladdad!', { type: 'success' });
                } catch (error) {
                  console.error('Backup error:', error);
                  showToast(`Kunde inte skapa backup: ${error.message}`, { type: 'error' });
                }
              }}
              className={`w-full flex items-center justify-center gap-2 text-white px-4 py-3 rounded-xl text-sm font-medium transition-all shadow-sm ${getThemeButtonClass(colorTheme, 'primary')}`}
            >
              <Download size={16} />
              Skapa Backup
            </button>

            <div className="relative">
              <input
                type="file"
                accept=".zip"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  if (!file.name.endsWith('.zip')) {
                    showToast('Ogiltig fil. Välj en ZIP-fil.', { type: 'error' });
                    return;
                  }

                  if (!confirm('VARNING: Detta kommer att ersätta all nuvarande data med data från backup-filen. Är du säker?')) {
                    e.target.value = '';
                    return;
                  }

                  try {
                    showToast('Återställer backup...', { type: 'info' });
                    const result = await api.restoreBackup(file);
                    showToast('Backup återställd! Ladda om sidan för att se ändringarna.', { 
                      type: 'success',
                      description: result.warning
                    });
                    // Reload data after restore
                    setTimeout(() => {
                      window.location.reload();
                    }, 2000);
                  } catch (error) {
                    console.error('Restore error:', error);
                    showToast(`Kunde inte återställa backup: ${error.message}`, { type: 'error' });
                  } finally {
                    e.target.value = '';
                  }
                }}
                className="hidden"
                id="restore-backup-input"
              />
              <label
                htmlFor="restore-backup-input"
                className="w-full flex items-center justify-center gap-2 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 px-4 py-3 rounded-xl text-sm font-medium transition-all shadow-sm cursor-pointer"
              >
                <Upload size={16} />
                Återställ från Backup
              </label>
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <p className="text-xs text-amber-800 dark:text-amber-300">
              <strong>Tips:</strong> Backup-filen innehåller databasen och alla bilder. Spara den på en säker plats.
            </p>
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
          </>
        )}

        {/* Categories Management Tab */}
        {activeSubTab === 'categories' && (
          <>
        {/* Categories Management */}
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                <Tag className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Kategorier & Regler</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Hantera transaktions- och avtalskategorier</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-6 bg-zinc-200 dark:bg-zinc-900/50 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveCategoryTab('categories')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeCategoryTab === 'categories'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Kategorier
            </button>
            <button
              onClick={() => setActiveCategoryTab('rules')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeCategoryTab === 'rules'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Kategoriregler
            </button>
          </div>

          {/* Categories Tab Content */}
          {activeCategoryTab === 'categories' && (
            <>
              <div className="flex items-center justify-end mb-4">
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
                    className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium transition-all ${getThemeButtonClass(colorTheme, 'primary')}`}
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
                    className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition-all ${getThemeButtonClass(colorTheme, 'primary')}`}
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
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => setEditingCategory(category.id)}
                      >
                        <span className="text-zinc-900 dark:text-white font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{category.name}</span>
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCategory(category.id);
                          }}
                          className="p-2 text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-all"
                          title="Redigera"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategory(category.id, category.name);
                          }}
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
            </>
          )}

          {/* Category Rules Tab Content */}
          {activeCategoryTab === 'rules' && (
            <div className="space-y-4">
              {/* Add new rule */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Lägg till ny regel</h4>
              <div className="space-y-3">
                {/* Multiple pattern fields */}
                <div className="space-y-2">
                  {newRulePatterns.map((pattern, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={pattern}
                        onChange={(e) => {
                          const updated = [...newRulePatterns];
                          updated[index] = e.target.value;
                          setNewRulePatterns(updated);
                        }}
                        placeholder="Beskrivning innehåller..."
                        className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      {newRulePatterns.length > 1 && (
                        <button
                          onClick={() => {
                            setNewRulePatterns(newRulePatterns.filter((_, i) => i !== index));
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
                    onClick={() => setNewRulePatterns([...newRulePatterns, ''])}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Plus size={14} />
                    Lägg till mönster
                  </button>
                </div>
                
                {/* Category select */}
                <select
                  value={newRuleCategory}
                  onChange={(e) => setNewRuleCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Välj kategori...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={async () => {
                  const validPatterns = newRulePatterns.map(p => p.trim()).filter(p => p);
                  if (validPatterns.length === 0 || !newRuleCategory) {
                    showToast('Fyll i minst ett mönster och kategori', { type: 'error' });
                    return;
                  }
                  try {
                    await api.createCategoryRule({
                      description_patterns: validPatterns,
                      category: newRuleCategory,
                      is_active: true
                    });
                    setNewRulePatterns(['']);
                    setNewRuleCategory('');
                    await loadCategoryRules();
                    showToast('Regel skapad!', { type: 'success' });
                  } catch (err) {
                    showToast('Kunde inte skapa regel: ' + (err.message || 'Okänt fel'), { type: 'error' });
                  }
                }}
                disabled={newRulePatterns.every(p => !p.trim()) || !newRuleCategory}
                className={`mt-3 px-4 py-2 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${getThemeButtonClass(colorTheme, 'primary')}`}
              >
                Lägg till regel
              </button>
            </div>

            {/* Existing rules */}
            <div className="space-y-2">
              {categoryRules.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-4">Inga regler skapade än</p>
              ) : (
                categoryRules.map(rule => {
                  const isEditing = editingRuleId === rule.id;
                  const patterns = rule.description_patterns || [rule.description_pattern].filter(p => p);
                  
                  return (
                    <div
                      key={rule.id}
                      className={`p-3 rounded-lg border ${
                        rule.is_active
                          ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700'
                          : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 opacity-60'
                      }`}
                    >
                      {isEditing ? (
                        <div className="space-y-3">
                          {/* Patterns editing */}
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                              Mönster (beskrivning innehåller):
                            </label>
                            <div className="space-y-2">
                              {editingPatterns.map((pattern, idx) => (
                                <div key={`pattern-${rule.id}-${idx}`} className="flex gap-2">
                                  <input
                                    type="text"
                                    value={pattern}
                                    onChange={(e) => {
                                      const updated = [...editingPatterns];
                                      updated[idx] = e.target.value;
                                      setEditingPatterns(updated);
                                      editingPatternsRef.current = updated;
                                    }}
                                    onBlur={() => {
                                      setTimeout(() => {
                                        if (editingRuleId === rule.id) {
                                          saveRule(rule.id, editingPatternsRef.current, editingCategoryRef.current);
                                        }
                                      }, 50);
                                    }}
                                    placeholder="Beskrivning innehåller..."
                                    className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                  />
                                  {editingPatterns.length > 1 && (
                                    <button
                                      onClick={() => {
                                        const updated = editingPatterns.filter((_, i) => i !== idx);
                                        setEditingPatterns(updated);
                                        editingPatternsRef.current = updated;
                                      }}
                                      className="px-2 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                                    >
                                      <X size={16} />
                                    </button>
                                  )}
                                </div>
                              ))}
                              <button
                                onClick={() => {
                                  const updated = [...editingPatterns, ''];
                                  setEditingPatterns(updated);
                                  editingPatternsRef.current = updated;
                                }}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
                              >
                                <Plus size={14} />
                                Lägg till mönster
                              </button>
                            </div>
                          </div>
                          
                          {/* Category editing */}
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                              Kategori:
                            </label>
                            <select
                              value={editingRuleCategory}
                              onChange={(e) => {
                                setEditingRuleCategory(e.target.value);
                                editingCategoryRef.current = e.target.value;
                              }}
                              onBlur={() => {
                                if (editingRuleId === rule.id) {
                                  saveRule(rule.id, editingPatternsRef.current, editingCategoryRef.current);
                                }
                              }}
                              className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                              <option value="">Välj kategori...</option>
                              {categories.map(cat => (
                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                              ))}
                            </select>
                          </div>
                          
                          {/* Action buttons */}
                          <div className="flex items-center gap-2 pt-2">
                            {isSavingRule === rule.id && (
                              <Loader2 size={16} className="animate-spin text-indigo-600 dark:text-indigo-400" />
                            )}
                            <button
                              onClick={() => {
                                setEditingRuleId(null);
                                setEditingPatterns([]);
                                setEditingRuleCategory('');
                                editingPatternsRef.current = [];
                                editingCategoryRef.current = '';
                              }}
                              className="text-xs px-3 py-1.5 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors"
                            >
                              Avbryt
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div 
                            className="flex-1 cursor-pointer"
                            onClick={() => {
                              const patterns = rule.description_patterns || [rule.description_pattern].filter(p => p);
                              setEditingRuleId(rule.id);
                              setEditingPatterns(patterns.length > 0 ? [...patterns, ''] : ['']);
                              setEditingRuleCategory(rule.category || '');
                              editingPatternsRef.current = patterns.length > 0 ? [...patterns, ''] : [''];
                              editingCategoryRef.current = rule.category || '';
                            }}
                          >
                            <p className="text-sm font-medium text-zinc-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                              Om beskrivning innehåller{' '}
                              <span className="font-mono text-indigo-600 dark:text-indigo-400">
                                "{patterns.length > 0 ? patterns.join('", "') : rule.description_pattern}"
                              </span>
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">
                              → Sätt kategori: <span className="font-semibold">{rule.category}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
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
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!confirm(`Är du säker på att du vill ta bort regeln?\n\n"${patterns.join('", "') || rule.description_pattern}" → ${rule.category}`)) {
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
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
          )}
        </div>
          </>
        )}

        {/* Bilder Tab */}
        {activeSubTab === 'images' && (
          <>
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
                  onClick={() => handleSelectFolder('receipt')}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Folder size={18} />
                  Välj plats
                </button>
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
                  onClick={() => handleSelectFolder('agreement')}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Folder size={18} />
                  Välj plats
                </button>
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
          </div>
        </div>

        {/* Media Library */}
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Media Bibliotek</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Sök, sortera och filtrera alla kvitton och bilder</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMediaViewMode(mediaViewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                title={mediaViewMode === 'grid' ? 'Listvy' : 'Rutnätsvy'}
              >
                {mediaViewMode === 'grid' ? <List size={18} /> : <Grid3x3 size={18} />}
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4 mb-6">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="text"
                  value={mediaSearchQuery}
                  onChange={(e) => setMediaSearchQuery(e.target.value)}
                  placeholder="Sök efter filnamn, transaktion eller avtal..."
                  className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-zinc-500" />
                <select
                  value={mediaFilterType}
                  onChange={(e) => setMediaFilterType(e.target.value)}
                  className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Alla filer</option>
                  <option value="receipts">Kvitton</option>
                  <option value="agreements">Avtalsbilder</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-zinc-500" />
                <select
                  value={mediaSortBy}
                  onChange={(e) => setMediaSortBy(e.target.value)}
                  className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="date">Datum</option>
                  <option value="name">Namn</option>
                  <option value="size">Storlek</option>
                </select>
                <button
                  onClick={() => setMediaSortOrder(mediaSortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 transition-colors"
                  title={mediaSortOrder === 'asc' ? 'Stigande' : 'Fallande'}
                >
                  {mediaSortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>

          {/* Media Files Display */}
          {loadingMedia ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={24} />
            </div>
          ) : filteredAndSortedMedia.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <FileText size={48} className="mx-auto mb-4 text-zinc-400" />
              <p>Inga filer hittades</p>
              {mediaSearchQuery && (
                <p className="text-sm mt-2">Försök med en annan sökterm</p>
              )}
            </div>
          ) : mediaViewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredAndSortedMedia.map((file, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer group"
                  onClick={(e) => {
                    // Only open in new tab if not double-clicking on image
                    if (e.detail === 1 && !e.target.closest('img')) {
                      window.open(`http://192.168.1.232:5000/api/files/${encodeURIComponent(file.path)}`, '_blank');
                    }
                  }}
                >
                  <div className="aspect-square bg-white dark:bg-zinc-900 rounded-lg mb-2 flex items-center justify-center overflow-hidden relative">
                    {file.filename.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                      <>
                        <img
                          src={`http://192.168.1.232:5000/api/files/${encodeURIComponent(file.path)}`}
                          alt={file.filename}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onDoubleClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const imageFiles = filteredAndSortedMedia.filter(f => 
                              f.filename.match(/\.(jpg|jpeg|png|gif)$/i)
                            );
                            const imageIndex = imageFiles.findIndex(f => f.path === file.path);
                            if (imageIndex !== -1) {
                              openLightbox(imageFiles.map(f => f.path), imageIndex);
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        />
                        {file.transaction_id && (
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (window.confirm(`Är du säker på att du vill ta bort detta kvitto från transaktionen "${file.transaction_title}"?`)) {
                                // Spara kvittodata för undo
                                const receiptPath = file.path;
                                const transactionId = file.transaction_id;
                                const transactionTitle = file.transaction_title;
                                
                                try {
                                  const result = await api.deleteTransactionReceipt(transactionId, receiptPath);
                                  const deletedPath = result.deleted_path;
                                  
                                  await loadMediaFiles();
                                  if (reloadData) await reloadData();
                                  
                                  // Visa toast med undo-funktionalitet
                                  showToast('Kvitto borttaget!', { 
                                    type: 'success',
                                    undo: true,
                                    undoAction: async () => {
                                      try {
                                        if (!deletedPath) {
                                          throw new Error('Kunde inte hitta filen i deleted-mappen');
                                        }
                                        
                                        // Hämta filen från deleted-mappen
                                        const deletedFileUrl = `http://192.168.1.232:5000/api/files/${encodeURIComponent(deletedPath.replace(/\\/g, '/'))}`;
                                        
                                        // Hämta filen som blob
                                        const response = await fetch(deletedFileUrl);
                                        if (!response.ok) {
                                          throw new Error('Kunde inte hitta filen i deleted-mappen');
                                        }
                                        
                                        const blob = await response.blob();
                                        const filename = deletedPath.split(/[/\\]/).pop();
                                        const fileToUpload = new File([blob], filename, { type: blob.type });
                                        
                                        // Ladda upp filen igen
                                        await api.uploadReceipt(fileToUpload, transactionId);
                                        
                                        await loadMediaFiles();
                                        if (reloadData) await reloadData();
                                        
                                        showToast('Kvitto återställt!', { type: 'success' });
                                      } catch (err) {
                                        console.error('Kunde inte ångra radering av kvitto:', err);
                                        showToast('Kunde inte ångra: ' + (err.message || 'Okänt fel'), { type: 'error' });
                                      }
                                    }
                                  });
                                } catch (error) {
                                  console.error('Kunde inte ta bort kvitto:', error);
                                  showToast('Kunde inte ta bort kvitto: ' + (error.message || 'Okänt fel'), { type: 'error' });
                                }
                              }
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 z-10"
                            title="Ta bort kvitto"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </>
                    ) : (
                      <FileText className="w-12 h-12 text-zinc-400" />
                    )}
                  </div>
                  <p className="text-xs font-medium text-zinc-900 dark:text-white truncate mb-1" title={file.filename}>
                    {file.filename}
                  </p>
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span className={`px-2 py-0.5 rounded ${
                      file.type === 'receipt' 
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                    }`}>
                      {file.type === 'receipt' ? 'Kvitto' : 'Avtal'}
                    </span>
                    <span>{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                  {file.transaction_title && (
                    <p 
                      className="text-xs text-zinc-400 mt-1 truncate hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer transition-colors"
                      title={`Klicka för att öppna transaktion: ${file.transaction_title}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (file.transaction_id && setActiveTab && setSelectedTransaction) {
                          // Hitta transaktionen
                          const transaction = transactions.find(t => t.id === file.transaction_id);
                          if (transaction) {
                            setActiveTab('transactions');
                            // Vänta lite så att tabben hinner bytas
                            setTimeout(() => {
                              setSelectedTransaction(transaction);
                            }, 100);
                          }
                        }
                      }}
                    >
                      {file.transaction_title}
                    </p>
                  )}
                  {file.agreement_name && (
                    <p className="text-xs text-zinc-400 mt-1 truncate" title={file.agreement_name}>
                      {file.agreement_name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <>
              {filteredAndSortedMedia.length > 0 && (
                <div className="mb-4 flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={filteredAndSortedMedia.length > 0 && filteredAndSortedMedia.every(f => selectedMediaFiles.has(f.path))}
                    onChange={(e) => handleSelectAllMedia(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-zinc-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Markera alla ({selectedMediaFiles.size} markerade)
                  </span>
                </div>
              )}
              <div className="space-y-2">
                {filteredAndSortedMedia.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer group"
                    onClick={(e) => {
                      // Only open in new tab if not clicking on checkbox or double-clicking on image
                      if (e.detail === 1 && !e.target.closest('input[type="checkbox"]') && !e.target.closest('img')) {
                        window.open(`http://192.168.1.232:5000/api/files/${encodeURIComponent(file.path)}`, '_blank');
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMediaFiles.has(file.path)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleToggleMediaFile(file.path);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-5 h-5 text-indigo-600 border-zinc-300 rounded focus:ring-indigo-500 flex-shrink-0"
                    />
                    <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                    {file.filename.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                      <>
                        <img
                          src={`http://192.168.1.232:5000/api/files/${encodeURIComponent(file.path)}`}
                          alt={file.filename}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onDoubleClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const imageFiles = filteredAndSortedMedia.filter(f => 
                              f.filename.match(/\.(jpg|jpeg|png|gif)$/i)
                            );
                            const imageIndex = imageFiles.findIndex(f => f.path === file.path);
                            if (imageIndex !== -1) {
                              openLightbox(imageFiles.map(f => f.path), imageIndex);
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        />
                        {file.transaction_id && (
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (window.confirm(`Är du säker på att du vill ta bort detta kvitto från transaktionen "${file.transaction_title}"?`)) {
                                // Spara kvittodata för undo
                                const receiptPath = file.path;
                                const transactionId = file.transaction_id;
                                const transactionTitle = file.transaction_title;
                                
                                try {
                                  const result = await api.deleteTransactionReceipt(transactionId, receiptPath);
                                  const deletedPath = result.deleted_path;
                                  
                                  await loadMediaFiles();
                                  if (reloadData) await reloadData();
                                  
                                  // Visa toast med undo-funktionalitet
                                  showToast('Kvitto borttaget!', { 
                                    type: 'success',
                                    undo: true,
                                    undoAction: async () => {
                                      try {
                                        if (!deletedPath) {
                                          throw new Error('Kunde inte hitta filen i deleted-mappen');
                                        }
                                        
                                        // Hämta filen från deleted-mappen
                                        const deletedFileUrl = `http://192.168.1.232:5000/api/files/${encodeURIComponent(deletedPath.replace(/\\/g, '/'))}`;
                                        
                                        // Hämta filen som blob
                                        const response = await fetch(deletedFileUrl);
                                        if (!response.ok) {
                                          throw new Error('Kunde inte hitta filen i deleted-mappen');
                                        }
                                        
                                        const blob = await response.blob();
                                        const filename = deletedPath.split(/[/\\]/).pop();
                                        const fileToUpload = new File([blob], filename, { type: blob.type });
                                        
                                        // Ladda upp filen igen
                                        await api.uploadReceipt(fileToUpload, transactionId);
                                        
                                        await loadMediaFiles();
                                        if (reloadData) await reloadData();
                                        
                                        showToast('Kvitto återställt!', { type: 'success' });
                                      } catch (err) {
                                        console.error('Kunde inte ångra radering av kvitto:', err);
                                        showToast('Kunde inte ångra: ' + (err.message || 'Okänt fel'), { type: 'error' });
                                      }
                                    }
                                  });
                                } catch (error) {
                                  console.error('Kunde inte ta bort kvitto:', error);
                                  showToast('Kunde inte ta bort kvitto: ' + (error.message || 'Okänt fel'), { type: 'error' });
                                }
                              }
                            }}
                            className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 z-10"
                            title="Ta bort kvitto"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </>
                    ) : (
                      <FileText className="w-8 h-8 text-zinc-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                      {file.filename}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                      <span className={`px-2 py-0.5 rounded ${
                        file.type === 'receipt' 
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                      }`}>
                        {file.type === 'receipt' ? 'Kvitto' : 'Avtal'}
                      </span>
                      {file.transaction_title && (
                        <span 
                          className="truncate hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer transition-colors"
                          title={`Klicka för att öppna transaktion: ${file.transaction_title}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (file.transaction_id && setActiveTab && setSelectedTransaction) {
                              // Hitta transaktionen
                              const transaction = transactions.find(t => t.id === file.transaction_id);
                              if (transaction) {
                                setActiveTab('transactions');
                                // Vänta lite så att tabben hinner bytas
                                setTimeout(() => {
                                  setSelectedTransaction(transaction);
                                }, 100);
                              }
                            }
                          }}
                        >
                          {file.transaction_title}
                        </span>
                      )}
                      {file.agreement_name && (
                        <span className="truncate">{file.agreement_name}</span>
                      )}
                      {file.date && (
                        <span>{new Date(file.date).toLocaleDateString('sv-SE')}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xs text-zinc-500">
                    <p>{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
              ))}
              </div>
            </>
          )}
        </div>
      </>
        )}

        {/* History Tab */}
        {activeSubTab === 'history' && (
          <HistoryTab reloadData={reloadData} />
        )}

        {/* Admin Tab */}
        {activeSubTab === 'admin' && user?.role === 'admin' && (
          <AdminPanel />
        )}

      </div>

      {/* Merge Category Modal */}
      <MergeCategoryModal
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        categories={categories}
        onMerge={handleMergeCategories}
      />
      
      {/* Theme Customizer Modal */}
      <ThemeCustomizer
        isOpen={isThemeCustomizerOpen}
        onClose={() => setIsThemeCustomizerOpen(false)}
        currentTheme={localColorTheme}
        onThemeChange={async (newTheme) => {
          setLocalColorTheme(newTheme);
          changeTheme(newTheme);
          // Save to backend
          try {
            await api.saveSettings({
              receipt_storage_path: receiptPath,
              agreement_images_path: agreementImagesPath,
              default_theme: defaultTheme,
              color_theme: newTheme,
              user_name: userName,
              user_address: userAddress,
              user_phone: userPhone,
              user_email: userEmail
            });
            showToast('Tema sparad!', { type: 'success' });
          } catch (error) {
            console.error('Kunde inte spara tema:', error);
            showToast('Kunde inte spara tema.', { type: 'error' });
          }
        }}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        defaultTheme={defaultTheme}
        onSave={async ({ colorTheme: newTheme, darkMode: newDarkMode }) => {
          // Update local state
          setLocalColorTheme(newTheme);
          const newDefaultTheme = newDarkMode ? 'dark' : 'light';
          setDefaultTheme(newDefaultTheme);
          
          // Save to backend
          try {
            await api.saveSettings({
              receipt_storage_path: receiptPath,
              agreement_images_path: agreementImagesPath,
              default_theme: newDefaultTheme,
              color_theme: newTheme,
              user_name: userName,
              user_address: userAddress,
              user_phone: userPhone,
              user_email: userEmail
            });
            showToast('Tema sparad!', { type: 'success' });
          } catch (error) {
            console.error('Kunde inte spara tema:', error);
            showToast('Kunde inte spara tema.', { type: 'error' });
          }
        }}
      />
      
      {/* Image Lightbox */}
      {lightboxImages && lightboxImages.length > 0 && (
        <ImageLightbox
          images={lightboxImages}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
        />
      )}
    </div>
  );
};

export default SettingsTab;

