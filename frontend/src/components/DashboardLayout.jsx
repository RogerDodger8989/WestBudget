import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import OverviewTab from './tabs/OverviewTab';
import TransactionsTab from './tabs/TransactionsTab';
import AgreementsTab from './tabs/AgreementsTab';
import VehiclesTab from './tabs/VehiclesTab';
import ReportsTab from './tabs/ReportsTab';
import SettingsTab from './tabs/SettingsTab';
import TransactionDrawer from './TransactionDrawer';
import NoteModal from './NoteModal';
import ImportModal from './ImportModal';

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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingNoteTransactionId, setEditingNoteTransactionId] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const handleCategoryChange = (id, newCategory) => {
    setTransactions(transactions.map(t => 
      t.id === id ? { ...t, category: newCategory } : t
    ));
    if (selectedTransaction && selectedTransaction.id === id) {
      setSelectedTransaction({ ...selectedTransaction, category: newCategory });
    }
  };

  const handleNoteSave = (id, newNote) => {
    setTransactions(transactions.map(t => 
      t.id === id ? { ...t, note: newNote } : t
    ));
    setEditingNoteTransactionId(null);
  };

  const handleImportTransactions = (newTransactions) => {
    const startId = Math.max(...transactions.map(t => t.id)) + 1;
    const transactionsWithIds = newTransactions.map((t, index) => ({
      ...t,
      id: startId + index
    }));
    setTransactions([...transactionsWithIds, ...transactions]);
    setIsImportModalOpen(false);
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
        />
      )}

      {editingNoteTransactionId && (
        <NoteModal 
          transaction={getTransactionForNote()}
          onClose={() => setEditingNoteTransactionId(null)}
          onSave={handleNoteSave}
        />
      )}

      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          selectedTransaction ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSelectedTransaction(null)}
      />
      
      <div 
        className={`fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white dark:bg-zinc-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-zinc-200 dark:border-zinc-800 ${
          selectedTransaction ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedTransaction && (
          <TransactionDrawer 
            transaction={selectedTransaction} 
            onClose={() => setSelectedTransaction(null)} 
            onCategoryChange={handleCategoryChange}
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
        <Topbar />

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {activeTab === 'overview' && (
              <OverviewTab 
                transactions={transactions}
                setSelectedTransaction={setSelectedTransaction}
                setEditingNoteTransactionId={setEditingNoteTransactionId}
                setActiveTab={setActiveTab}
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
                getTitle={getTitle}
                loading={loading}
              />
            )}

            {activeTab === 'agreements' && (
              <AgreementsTab 
                agreements={agreements}
                getTitle={getTitle}
                loading={loading}
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
              />
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

