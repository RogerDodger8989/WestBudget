import React, { useState } from 'react';
import { api } from '../api';
import { useToast } from '../contexts/ToastContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import OverviewTab from './tabs/OverviewTab';
import TransactionsTab from './tabs/TransactionsTab';
import AgreementsTab from './tabs/AgreementsTab';
import VehiclesTab from './tabs/VehiclesTab';
import ReportsTab from './tabs/ReportsTab';
import SettingsTab from './tabs/SettingsTab';
import TransactionDrawer from './TransactionDrawer';
import AgreementDrawer from './AgreementDrawer';
import NoteModal from './NoteModal';
import AgreementNoteModal from './AgreementNoteModal';
import ImportModal from './ImportModal';
import AddAgreementModal from './AddAgreementModal';
import CustomDateRangeModal from './CustomDateRangeModal';

const DashboardLayout = ({ 
  onLogout, 
  isDarkMode, 
  toggleTheme, 
  transactions, 
  setTransactions,
  agreements,
  categories,
  loading,
  reloadData
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [dateRange, setDateRange] = useState('month');
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [isCustomDateModalOpen, setIsCustomDateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingNoteTransactionId, setEditingNoteTransactionId] = useState(null);
  const [editingNoteAgreementId, setEditingNoteAgreementId] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedAgreement, setSelectedAgreement] = useState(null);
  const [isAddAgreementModalOpen, setIsAddAgreementModalOpen] = useState(false);
  const [lastImportIds, setLastImportIds] = useState([]);
  
  // Toast system
  const { showToast } = useToast();

  const handleCategoryChange = async (id, newCategory) => {
    // Spara gamla kategorin för undo
    const oldTransaction = transactions.find(t => t.id === id);
    const oldCategory = oldTransaction?.category || '';
    
    try {
      // Uppdatera i backend
      await api.updateTransaction(id, { category: newCategory });
      
      // Uppdatera lokalt state
      setTransactions(transactions.map(t => 
        t.id === id ? { ...t, category: newCategory } : t
      ));
      if (selectedTransaction && selectedTransaction.id === id) {
        setSelectedTransaction({ ...selectedTransaction, category: newCategory });
      }
      
      showToast('Kategori uppdaterad!', {
        type: 'success',
        undo: true,
        undoAction: async () => {
          try {
            await api.updateTransaction(id, { category: oldCategory });
            setTransactions(transactions.map(t => 
              t.id === id ? { ...t, category: oldCategory } : t
            ));
            if (selectedTransaction && selectedTransaction.id === id) {
              setSelectedTransaction({ ...selectedTransaction, category: oldCategory });
            }
          } catch (err) {
            console.error('Kunde inte ångra:', err);
          }
        }
      });
    } catch (error) {
      console.error('Kunde inte uppdatera kategori:', error);
      showToast('Kunde inte uppdatera kategori.', { type: 'error' });
    }
  };

  const handleNoteSave = async (id, newNote) => {
    try {
      // Spara gamla noteringen för undo
      const oldTransaction = transactions.find(t => t.id === id);
      const oldNote = oldTransaction?.note || '';
      
      // Spara notering till backend
      await api.updateTransaction(id, { note: newNote });
      
      // Uppdatera lokalt state
      setTransactions(transactions.map(t => 
        t.id === id ? { ...t, note: newNote } : t
      ));
      setEditingNoteTransactionId(null);
      
      showToast('Notering sparad!', { 
        type: 'success',
        undo: true,
        undoAction: async () => {
          try {
            await api.updateTransaction(id, { note: oldNote });
            setTransactions(transactions.map(t => 
              t.id === id ? { ...t, note: oldNote } : t
            ));
          } catch (err) {
            console.error('Kunde inte ångra:', err);
          }
        }
      });
    } catch (error) {
      console.error('❌ Kunde inte spara notering:', error);
      showToast('Kunde inte spara notering. Försök igen.', { type: 'error' });
    }
  };

  // Ny funktion för kvittohantering
  const handleReceiptUpload = async (transactionId, file) => {
    try {
      console.log('📤 Laddar upp kvitto för transaktion:', transactionId);
      
      // Ladda upp filen till backend
      const result = await api.uploadReceipt(file);
      
      // Uppdatera transaktionen med kvittosökväg
      await api.updateTransaction(transactionId, {
        receipt: true,
        receipt_path: result.file_path
      });
      
      // Uppdatera lokalt state
      setTransactions(transactions.map(t => 
        t.id === transactionId 
          ? { ...t, receipt: true, receipt_path: result.file_path } 
          : t
      ));
      
      console.log('✅ Kvitto uppladdat:', result.file_path);
      showToast(`Kvitto sparat: ${result.filename}`, { type: 'success' });
      
      // Ladda om data för att säkerställa synkronisering
      if (reloadData) reloadData();
    } catch (error) {
      console.error('❌ Kunde inte ladda upp kvitto:', error);
      showToast('Kunde inte ladda upp kvitto. Kontrollera att servern körs.', { type: 'error' });
    }
  };

  const handleImportTransactions = async (newTransactions) => {
    try {
      setIsImportModalOpen(false);
      
      // Create transactions via API - stop at first error
      const createdTransactions = [];
      for (let i = 0; i < newTransactions.length; i++) {
        const transaction = newTransactions[i];
        
        // Convert amount display to numeric value for API
        // Remove "kr", spaces, and convert to number
        let amountValue = transaction.amount.replace(/[^\d.,-]/g, '');
        // Handle comma as decimal separator
        if (amountValue.includes(',') && !amountValue.includes('.')) {
          amountValue = amountValue.replace(',', '.');
        }
        const numericAmount = parseFloat(amountValue);
        
        if (isNaN(numericAmount)) {
          const errorMsg = `Ogiltigt belopp för transaktion "${transaction.title}" (rad ${i + 1})`;
          showToast(errorMsg, { type: 'error', description: 'Importen stoppades.' });
          throw new Error(errorMsg);
        }
        
        const transactionData = {
          title: transaction.title,
          date: transaction.date,
          amount: numericAmount.toString(),
          type: transaction.type,
          category: transaction.category,
          status: transaction.status || 'Bokförd',
          note: transaction.note || '',
          receipt: false
        };
        
        try {
          const created = await api.createTransaction(transactionData);
          createdTransactions.push(created);
        } catch (err) {
          // Stop at first error and show detailed message
          const errorMsg = err.message || 'Okänt fel';
          const detailedMsg = `Kunde inte importera transaktion "${transaction.title}" (rad ${i + 1}): ${errorMsg}`;
          showToast(detailedMsg, { type: 'error', description: 'Importen stoppades vid första felet.' });
          throw new Error(detailedMsg);
        }
      }
      
      // Save IDs of imported transactions for undo functionality
      const importedIds = createdTransactions.map(t => t.id);
      setLastImportIds(importedIds);
      
      // Reload data to get all transactions with IDs
      if (reloadData) {
        await reloadData();
      }
      
      // Show toast with undo functionality
      showToast(`${createdTransactions.length} transaktion${createdTransactions.length !== 1 ? 'er' : ''} importerade!`, {
        type: 'success',
        undo: true,
        undoAction: async () => {
          await handleUndoLastImport(importedIds);
        }
      });
    } catch (error) {
      console.error('❌ Kunde inte importera transaktioner:', error);
      showToast('Kunde inte importera transaktioner. Försök igen.', { type: 'error' });
      // Clear last import IDs on error
      setLastImportIds([]);
    }
  };

  const handleUndoLastImport = async (idsToDelete = null) => {
    const ids = idsToDelete || lastImportIds;
    
    if (!ids || ids.length === 0) {
      showToast('Inga transaktioner att ångra', { type: 'error' });
      return;
    }

    try {
      // Delete all transactions
      const deletePromises = ids.map(id => api.deleteTransaction(id));
      await Promise.all(deletePromises);
      
      // Clear last import IDs
      setLastImportIds([]);
      
      // Reload data
      if (reloadData) {
        await reloadData();
      }
      
      showToast(`${ids.length} transaktion${ids.length !== 1 ? 'er' : ''} borttagna!`, {
        type: 'success',
        description: 'Importen har ångrats'
      });
    } catch (err) {
      console.error('❌ Kunde inte ångra import:', err);
      showToast('Kunde inte ångra import: ' + (err.message || 'Okänt fel'), {
        type: 'error'
      });
    }
  };

  const handleAddAgreement = async (agreementData) => {
    try {
      console.log('💾 Sparar nytt avtal:', agreementData);
      
      // Spara till backend
      const newAgreement = await api.createAgreement(agreementData);
      
      console.log('✅ Avtal sparat:', newAgreement);
      
      // Ladda om data för att få det nya avtalet med ID
      if (reloadData) {
        await reloadData();
      }
      
      // Stäng modalen
      setIsAddAgreementModalOpen(false);
      
      // Visa toast med undo
      showToast('Avtal sparat!', {
        type: 'success',
        undo: true,
        undoAction: async () => {
          try {
            await api.deleteAgreement(newAgreement.id);
            if (reloadData) await reloadData();
            showToast('Avtal ångrat', { type: 'info' });
          } catch (err) {
            console.error('Kunde inte ångra:', err);
            showToast('Kunde inte ångra avtal', { type: 'error' });
          }
        }
      });
    } catch (error) {
      console.error('❌ Kunde inte spara avtal:', error);
      showToast('Kunde inte spara avtal. Kontrollera att servern körs.', { type: 'error' });
    }
  };

  const handleUpdateAgreement = async (agreementId, updates) => {
    try {
      console.log('💾 Uppdaterar avtal:', agreementId, updates);
      
      // Spara gamla data för undo
      const oldAgreement = agreements.find(a => a.id === agreementId);
      const oldData = oldAgreement ? { ...oldAgreement } : null;
      
      // Uppdatera i backend
      await api.updateAgreement(agreementId, updates);
      
      console.log('✅ Avtal uppdaterat!');
      
      // Ladda om data
      if (reloadData) {
        await reloadData();
      }
      
      // Stäng drawer eller modal
      setSelectedAgreement(null);
      setEditingNoteAgreementId(null);
      
      showToast('Ändringar sparade!', { 
        type: 'success',
        undo: true,
        undoAction: async () => {
          try {
            if (oldData) {
              // Återställ alla fält som ändrades
              const restoreData = {};
              Object.keys(updates).forEach(key => {
                if (oldData[key] !== undefined) {
                  restoreData[key] = oldData[key];
                }
              });
              await api.updateAgreement(agreementId, restoreData);
              if (reloadData) await reloadData();
            }
          } catch (err) {
            console.error('Kunde inte ångra:', err);
          }
        }
      });
    } catch (error) {
      console.error('❌ Kunde inte uppdatera avtal:', error);
      showToast('Kunde inte spara ändringar. Kontrollera att servern körs.', { type: 'error' });
    }
  };

  const handleAgreementNoteSave = async (agreementId, updates) => {
    try {
      // Spara gamla noteringen för undo
      const oldAgreement = agreements.find(a => a.id === agreementId);
      const oldNotice = oldAgreement?.notice || '';
      
      await api.updateAgreement(agreementId, updates);
      
      // Ladda om data
      if (reloadData) {
        await reloadData();
      }
      
      setEditingNoteAgreementId(null);
      showToast('Notering sparad!', { 
        type: 'success',
        undo: true,
        undoAction: async () => {
          try {
            await api.updateAgreement(agreementId, { notice: oldNotice });
            if (reloadData) await reloadData();
          } catch (err) {
            console.error('Kunde inte ångra:', err);
          }
        }
      });
    } catch (error) {
      console.error('❌ Kunde inte spara notering:', error);
      showToast('Kunde inte spara notering. Försök igen.', { type: 'error' });
    }
  };

  const getAgreementForNote = () => {
    return agreements.find(a => a.id === editingNoteAgreementId);
  };

  const handleAgreementImageUpload = async (agreementId, file) => {
    try {
      console.log('📤 [DashboardLayout] Laddar upp bild för avtal:', agreementId, 'Fil:', file.name, 'Storlek:', file.size);
      
      const result = await api.uploadAgreementImage(agreementId, file);
      
      console.log('✅ [DashboardLayout] Bild uppladdat, resultat:', result);
      
      // Ladda om data för att få uppdaterad bildlista
      if (reloadData) {
        console.log('🔄 Laddar om data...');
        await reloadData();
      }
      
      return result;
    } catch (error) {
      console.error('❌ [DashboardLayout] Kunde inte ladda upp bild:', error);
      console.error('❌ Error details:', error.message, error.stack);
      throw error;
    }
  };

  const getTitle = () => {
    switch(activeTab) {
      case 'vehicles': return 'Fordon & Transport';
      case 'reports': return 'Finansiella Rapporter';
      case 'transactions': return 'Transaktionshistorik';
      case 'agreements': return 'Avtal & Abonnemang';
      case 'settings': return 'Inställningar';
      default: return 'Ekonomisk Översikt';
    }
  };

  const getTransactionForNote = () => {
    return transactions.find(t => t.id === editingNoteTransactionId);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-100 dark:bg-black transition-colors duration-500">
      {isImportModalOpen && (
        <ImportModal 
          onClose={() => setIsImportModalOpen(false)} 
          onImport={handleImportTransactions}
          categories={categories.map(c => c.name || c)}
          existingTransactions={transactions}
          onCategoriesChange={async () => {
            // Reload categories if needed
            if (reloadData) {
              await reloadData();
            }
          }}
        />
      )}

      {editingNoteTransactionId && (
        <NoteModal 
          transaction={getTransactionForNote()}
          onClose={() => setEditingNoteTransactionId(null)}
          onSave={handleNoteSave}
        />
      )}

      {editingNoteAgreementId && (
        <AgreementNoteModal
          agreement={getAgreementForNote()}
          onClose={() => setEditingNoteAgreementId(null)}
          onSave={handleAgreementNoteSave}
        />
      )}

      {isAddAgreementModalOpen && (
        <AddAgreementModal
          onClose={() => setIsAddAgreementModalOpen(false)}
          onSave={handleAddAgreement}
          categories={categories}
        />
      )}

      {isCustomDateModalOpen && (
        <CustomDateRangeModal
          isOpen={isCustomDateModalOpen}
          onClose={() => setIsCustomDateModalOpen(false)}
          onApply={(startDate, endDate) => {
            setCustomStartDate(startDate);
            setCustomEndDate(endDate);
            setDateRange('custom');
          }}
          currentStartDate={customStartDate}
          currentEndDate={customEndDate}
        />
      )}

      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          (selectedTransaction || selectedAgreement) ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => {
          setSelectedTransaction(null);
          setSelectedAgreement(null);
        }}
      />
      
      <div 
        className={`fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white dark:bg-zinc-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-zinc-200 dark:border-zinc-800 ${
          (selectedTransaction || selectedAgreement) ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedTransaction && (
          <TransactionDrawer 
            transaction={selectedTransaction} 
            onClose={() => setSelectedTransaction(null)} 
            onCategoryChange={handleCategoryChange}
            onReceiptUpload={handleReceiptUpload}
            categories={categories}
          />
        )}
        {selectedAgreement && (
          <AgreementDrawer
            agreement={selectedAgreement}
            onClose={() => setSelectedAgreement(null)}
            onSave={handleUpdateAgreement}
            onImageUpload={handleAgreementImageUpload}
            categories={categories}
          />
        )}
      </div>

      <Sidebar 
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        onLogout={onLogout}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/50 transition-colors duration-500">
        <Topbar agreements={agreements} />

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {activeTab === 'overview' && (
              <OverviewTab 
                transactions={transactions}
                setSelectedTransaction={setSelectedTransaction}
                setEditingNoteTransactionId={setEditingNoteTransactionId}
                setActiveTab={setActiveTab}
                dateRange={dateRange}
                setDateRange={setDateRange}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
                setIsCustomDateModalOpen={setIsCustomDateModalOpen}
                loading={loading}
              />
            )}

            {activeTab === 'transactions' && (
              <TransactionsTab 
                transactions={transactions}
                categories={categories}
                setSelectedTransaction={setSelectedTransaction}
                setEditingNoteTransactionId={setEditingNoteTransactionId}
                setIsImportModalOpen={setIsImportModalOpen}
                dateRange={dateRange}
                setDateRange={setDateRange}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
                setIsCustomDateModalOpen={setIsCustomDateModalOpen}
                getTitle={getTitle}
                loading={loading}
                lastImportIds={lastImportIds}
                onUndoLastImport={handleUndoLastImport}
                reloadData={reloadData}
              />
            )}

            {activeTab === 'agreements' && (
              <AgreementsTab 
                agreements={agreements}
                getTitle={getTitle}
                loading={loading}
                categories={categories}
                onAddAgreement={() => setIsAddAgreementModalOpen(true)}
                setSelectedAgreement={setSelectedAgreement}
                setEditingNoteAgreementId={setEditingNoteAgreementId}
              />
            )}

            {activeTab === 'vehicles' && (
              <VehiclesTab 
                transactions={transactions}
                setSelectedTransaction={setSelectedTransaction}
                setEditingNoteTransactionId={setEditingNoteTransactionId}
                dateRange={dateRange}
                setDateRange={setDateRange}
                getTitle={getTitle}
                loading={loading}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsTab 
                dateRange={dateRange}
                setDateRange={setDateRange}
                getTitle={getTitle}
                loading={loading}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsTab 
                getTitle={getTitle}
                reloadData={reloadData}
              />
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

