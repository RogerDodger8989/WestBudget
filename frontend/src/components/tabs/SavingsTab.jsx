import React, { useState, useEffect, useMemo } from 'react';
import { PiggyBank, Target, Wallet, Plus, Edit2, Trash2, ArrowUp, ArrowDown, TrendingUp, Calendar, X } from 'lucide-react';
import { api } from '../../api';
import { useToast } from '../../contexts/ToastContext';
import { formatAmount, getAmountClassName } from '../../utils/formatAmount';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeButtonClass, getThemeRingClass } from '../../utils/getThemeClasses';

const SavingsTab = ({ getTitle, reloadData }) => {
  const { showToast } = useToast();
  const { colorTheme } = useTheme();
  const [goals, setGoals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('goals'); // 'goals' or 'accounts'
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);
  const [transferData, setTransferData] = useState({ type: 'deposit', account_id: null, goal_id: null, amount: '', date: new Date().toISOString().split('T')[0], notes: '' });

  // Form states
  const [goalForm, setGoalForm] = useState({ name: '', target_amount: '', deadline: '', category: '', description: '', status: 'Aktiv' });
  const [accountForm, setAccountForm] = useState({ name: '', description: '', category: '', status: 'Aktiv' });

  useEffect(() => {
    loadSavingsData();
  }, []);

  const loadSavingsData = async () => {
    try {
      setLoading(true);
      const [goalsData, accountsData] = await Promise.all([
        api.getSavingsGoals(),
        api.getSavingsAccounts()
      ]);
      setGoals(goalsData);
      setAccounts(accountsData);
    } catch (error) {
      console.error('Error loading savings data:', error);
      showToast('Kunde inte ladda sparande-data', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalGoals = useMemo(() => {
    return goals.reduce((sum, goal) => sum + (parseFloat(goal.current_amount) || 0), 0);
  }, [goals]);

  const totalAccounts = useMemo(() => {
    return accounts.reduce((sum, account) => sum + (parseFloat(account.balance) || 0), 0);
  }, [accounts]);

  const totalSavings = totalGoals + totalAccounts;

  // Handle goal operations
  const handleCreateGoal = async () => {
    try {
      if (!goalForm.name || !goalForm.target_amount) {
        showToast('Fyll i namn och målbelopp', { type: 'error' });
        return;
      }
      await api.createSavingsGoal({
        ...goalForm,
        target_amount: parseFloat(goalForm.target_amount),
        current_amount: 0
      });
      showToast('Sparmål skapat!', { type: 'success' });
      setIsGoalModalOpen(false);
      setGoalForm({ name: '', target_amount: '', deadline: '', category: '', description: '', status: 'Aktiv' });
      loadSavingsData();
    } catch (error) {
      showToast(`Kunde inte skapa mål: ${error.message}`, { type: 'error' });
    }
  };

  const handleUpdateGoal = async () => {
    try {
      if (!editingGoal) return;
      await api.updateSavingsGoal(editingGoal.id, {
        ...goalForm,
        target_amount: parseFloat(goalForm.target_amount)
      });
      showToast('Sparmål uppdaterat!', { type: 'success' });
      setIsGoalModalOpen(false);
      setEditingGoal(null);
      setGoalForm({ name: '', target_amount: '', deadline: '', category: '', description: '', status: 'Aktiv' });
      loadSavingsData();
    } catch (error) {
      showToast(`Kunde inte uppdatera mål: ${error.message}`, { type: 'error' });
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!confirm('Är du säker på att du vill radera detta spar-mål?')) return;
    try {
      await api.deleteSavingsGoal(id);
      showToast('Sparmål raderat!', { type: 'success' });
      loadSavingsData();
    } catch (error) {
      showToast(`Kunde inte radera mål: ${error.message}`, { type: 'error' });
    }
  };

  // Handle account operations
  const handleCreateAccount = async () => {
    try {
      if (!accountForm.name) {
        showToast('Fyll i namn', { type: 'error' });
        return;
      }
      await api.createSavingsAccount({
        ...accountForm,
        balance: 0
      });
      showToast('Spar-konto skapat!', { type: 'success' });
      setIsAccountModalOpen(false);
      setAccountForm({ name: '', description: '', category: '', status: 'Aktiv' });
      loadSavingsData();
    } catch (error) {
      showToast(`Kunde inte skapa konto: ${error.message}`, { type: 'error' });
    }
  };

  const handleUpdateAccount = async () => {
    try {
      if (!editingAccount) return;
      await api.updateSavingsAccount(editingAccount.id, accountForm);
      showToast('Spar-konto uppdaterat!', { type: 'success' });
      setIsAccountModalOpen(false);
      setEditingAccount(null);
      setAccountForm({ name: '', description: '', category: '', status: 'Aktiv' });
      loadSavingsData();
    } catch (error) {
      showToast(`Kunde inte uppdatera konto: ${error.message}`, { type: 'error' });
    }
  };

  const handleDeleteAccount = async (id) => {
    if (!confirm('Är du säker på att du vill radera detta spar-konto?')) return;
    try {
      await api.deleteSavingsAccount(id);
      showToast('Spar-konto raderat!', { type: 'success' });
      loadSavingsData();
    } catch (error) {
      showToast(`Kunde inte radera konto: ${error.message}`, { type: 'error' });
    }
  };

  // Handle transfer
  const handleTransfer = async () => {
    try {
      if (!transferData.amount || (!transferData.account_id && !transferData.goal_id)) {
        showToast('Fyll i belopp och välj konto/mål', { type: 'error' });
        return;
      }
      await api.transferSavings({
        ...transferData,
        amount: parseFloat(transferData.amount)
      });
      showToast('Överföring genomförd!', { type: 'success' });
      setIsTransferModalOpen(false);
      setTransferData({ type: 'deposit', account_id: null, goal_id: null, amount: '', date: new Date().toISOString().split('T')[0], notes: '' });
      loadSavingsData();
    } catch (error) {
      showToast(`Kunde inte genomföra överföring: ${error.message}`, { type: 'error' });
    }
  };

  // Open edit modals
  const openEditGoal = (goal) => {
    setEditingGoal(goal);
    setGoalForm({
      name: goal.name || '',
      target_amount: goal.target_amount || '',
      deadline: goal.deadline || '',
      category: goal.category || '',
      description: goal.description || '',
      status: goal.status || 'Aktiv'
    });
    setIsGoalModalOpen(true);
  };

  const openEditAccount = (account) => {
    setEditingAccount(account);
    setAccountForm({
      name: account.name || '',
      description: account.description || '',
      category: account.category || '',
      status: account.status || 'Aktiv'
    });
    setIsAccountModalOpen(true);
  };

  if (loading) {
    return <div className="text-center py-12">Laddar data...</div>;
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
            {getTitle()}
          </h2>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setActiveView('goals');
              setEditingGoal(null);
              setGoalForm({ name: '', target_amount: '', deadline: '', category: '', description: '', status: 'Aktiv' });
              setIsGoalModalOpen(true);
            }}
            className={`flex items-center gap-2 ${getThemeButtonClass(colorTheme, 'primary')} px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm`}
          >
            <Plus size={16} /> Nytt Sparmål
          </button>
          <button
            onClick={() => {
              setActiveView('accounts');
              setEditingAccount(null);
              setAccountForm({ name: '', description: '', category: '', status: 'Aktiv' });
              setIsAccountModalOpen(true);
            }}
            className={`flex items-center gap-2 ${getThemeButtonClass(colorTheme, 'primary')} px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm`}
          >
            <Plus size={16} /> Nytt Spar-konto
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl">
              <Target className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            </div>
          </div>
          <div>
            <h3 className="text-zinc-500 dark:text-zinc-500 text-sm font-medium mb-1">Sparmål</h3>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">{formatAmount(totalGoals)}</p>
            <p className="text-xs text-zinc-400 mt-1">{goals.length} mål</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl">
              <Wallet className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            </div>
          </div>
          <div>
            <h3 className="text-zinc-500 dark:text-zinc-500 text-sm font-medium mb-1">Spar-konton</h3>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">{formatAmount(totalAccounts)}</p>
            <p className="text-xs text-zinc-400 mt-1">{accounts.length} konton</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl">
              <PiggyBank className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
            </div>
          </div>
          <div>
            <h3 className="text-zinc-500 dark:text-zinc-500 text-sm font-medium mb-1">Totalt Sparat</h3>
            <p className={`text-2xl font-bold tracking-tight ${getAmountClassName(totalSavings)}`}>{formatAmount(totalSavings)}</p>
            <p className="text-xs text-zinc-400 mt-1">Alla sparanden</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-zinc-200 dark:bg-zinc-900/50 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveView('goals')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeView === 'goals'
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          Sparmål
        </button>
        <button
          onClick={() => setActiveView('accounts')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeView === 'accounts'
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          Spar-konton
        </button>
      </div>

      {/* Goals View */}
      {activeView === 'goals' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
            const isComplete = goal.current_amount >= goal.target_amount;
            return (
              <div key={goal.id} className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm dark:shadow-none hover:border-indigo-500/30 dark:hover:border-zinc-700/50 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{goal.name}</h3>
                    {goal.deadline && (
                      <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                        <Calendar size={12} className="text-indigo-500 dark:text-indigo-400" />
                        {new Date(goal.deadline).toLocaleDateString('sv-SE')}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditGoal(goal)}
                      className="p-1.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-zinc-500 dark:text-zinc-400">Framsteg</span>
                    <span className="font-semibold text-zinc-900 dark:text-white">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isComplete ? 'bg-emerald-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Nuvarande</span>
                    <span className={`font-semibold ${getAmountClassName(goal.current_amount)}`}>
                      {formatAmount(goal.current_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Mål</span>
                    <span className="font-semibold text-zinc-900 dark:text-white">
                      {formatAmount(goal.target_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500 dark:text-zinc-400">Kvar</span>
                    <span className={getAmountClassName(goal.target_amount - goal.current_amount)}>
                      {formatAmount(goal.target_amount - goal.current_amount)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setTransferData({ ...transferData, goal_id: goal.id, account_id: null });
                    setIsTransferModalOpen(true);
                  }}
                  className="w-full mt-4 flex items-center justify-center gap-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                >
                  <ArrowUp size={16} /> Sätta in
                </button>
                {goal.current_amount > 0 && (
                  <button
                    onClick={() => {
                      setTransferData({ ...transferData, type: 'withdrawal', goal_id: goal.id, account_id: null });
                      setIsTransferModalOpen(true);
                    }}
                    className="w-full mt-2 flex items-center justify-center gap-2 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  >
                    <ArrowDown size={16} /> Ta ut
                  </button>
                )}
              </div>
            );
          })}
          {goals.length === 0 && (
            <div className="col-span-full text-center py-12 text-zinc-500 dark:text-zinc-400">
              Inga spar-mål ännu. Skapa ditt första mål!
            </div>
          )}
        </div>
      )}

      {/* Accounts View */}
      {activeView === 'accounts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <div key={account.id} className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 shadow-sm dark:shadow-none hover:border-emerald-500/30 dark:hover:border-zinc-700/50 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{account.name}</h3>
                  {account.description && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{account.description}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditAccount(account)}
                    className="p-1.5 text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteAccount(account.id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-3xl font-bold mb-2">
                  <span className={getAmountClassName(account.balance)}>
                    {formatAmount(account.balance)}
                  </span>
                </div>
                {account.category && (
                  <span className="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg">
                    {account.category}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setTransferData({ ...transferData, account_id: account.id, goal_id: null });
                    setIsTransferModalOpen(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                >
                  <ArrowUp size={16} /> Sätta in
                </button>
                {account.balance > 0 && (
                  <button
                    onClick={() => {
                      setTransferData({ ...transferData, type: 'withdrawal', account_id: account.id, goal_id: null });
                      setIsTransferModalOpen(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  >
                    <ArrowDown size={16} /> Ta ut
                  </button>
                )}
              </div>
            </div>
          ))}
          {accounts.length === 0 && (
            <div className="col-span-full text-center py-12 text-zinc-500 dark:text-zinc-400">
              Inga spar-konton ännu. Skapa ditt första konto!
            </div>
          )}
        </div>
      )}

      {/* Goal Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                {editingGoal ? 'Redigera Sparmål' : 'Nytt Sparmål'}
              </h3>
              <button
                onClick={() => {
                  setIsGoalModalOpen(false);
                  setEditingGoal(null);
                  setGoalForm({ name: '', target_amount: '', deadline: '', category: '', description: '', status: 'Aktiv' });
                }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Namn *</label>
                <input
                  type="text"
                  value={goalForm.name}
                  onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
                  className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 ${getThemeRingClass(colorTheme)}`}
                  placeholder="T.ex. Resekassa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Målbelopp (kr) *</label>
                <input
                  type="number"
                  value={goalForm.target_amount}
                  onChange={(e) => setGoalForm({ ...goalForm, target_amount: e.target.value })}
                  className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 ${getThemeRingClass(colorTheme)}`}
                  placeholder="50000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Deadline</label>
                <input
                  type="date"
                  value={goalForm.deadline}
                  onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })}
                  className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 ${getThemeRingClass(colorTheme)}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Beskrivning</label>
                <textarea
                  value={goalForm.description}
                  onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                  className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 ${getThemeRingClass(colorTheme)}`}
                  rows={3}
                  placeholder="Beskrivning av målet..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={editingGoal ? handleUpdateGoal : handleCreateGoal}
                  className={`flex-1 ${getThemeButtonClass(colorTheme, 'primary')} px-4 py-2.5 rounded-xl text-sm font-medium transition-all`}
                >
                  {editingGoal ? 'Spara ändringar' : 'Skapa mål'}
                </button>
                <button
                  onClick={() => {
                    setIsGoalModalOpen(false);
                    setEditingGoal(null);
                    setGoalForm({ name: '', target_amount: '', deadline: '', category: '', description: '', status: 'Aktiv' });
                  }}
                  className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl text-sm font-medium transition-all"
                >
                  Avbryt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Modal */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                {editingAccount ? 'Redigera Spar-konto' : 'Nytt Spar-konto'}
              </h3>
              <button
                onClick={() => {
                  setIsAccountModalOpen(false);
                  setEditingAccount(null);
                  setAccountForm({ name: '', description: '', category: '', status: 'Aktiv' });
                }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Namn *</label>
                <input
                  type="text"
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="T.ex. Nödkassa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Beskrivning</label>
                <textarea
                  value={accountForm.description}
                  onChange={(e) => setAccountForm({ ...accountForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                  placeholder="Beskrivning av kontot..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={editingAccount ? handleUpdateAccount : handleCreateAccount}
                  className={`flex-1 ${getThemeButtonClass(colorTheme, 'primary')} px-4 py-2.5 rounded-xl text-sm font-medium transition-all`}
                >
                  {editingAccount ? 'Spara ändringar' : 'Skapa konto'}
                </button>
                <button
                  onClick={() => {
                    setIsAccountModalOpen(false);
                    setEditingAccount(null);
                    setAccountForm({ name: '', description: '', category: '', status: 'Aktiv' });
                  }}
                  className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl text-sm font-medium transition-all"
                >
                  Avbryt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                {transferData.type === 'deposit' ? 'Sätta in pengar' : 'Ta ut pengar'}
              </h3>
              <button
                onClick={() => {
                  setIsTransferModalOpen(false);
                  setTransferData({ type: 'deposit', account_id: null, goal_id: null, amount: '', date: new Date().toISOString().split('T')[0], notes: '' });
                }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Typ</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTransferData({ ...transferData, type: 'deposit' })}
                    className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      transferData.type === 'deposit'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200'
                    }`}
                  >
                    Sätta in
                  </button>
                  <button
                    onClick={() => setTransferData({ ...transferData, type: 'withdrawal' })}
                    className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      transferData.type === 'withdrawal'
                        ? 'bg-rose-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200'
                    }`}
                  >
                    Ta ut
                  </button>
                </div>
              </div>

              {!transferData.account_id && !transferData.goal_id && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Välj konto eller mål</label>
                  <div className="space-y-2">
                    <select
                      value={transferData.account_id || transferData.goal_id || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.startsWith('account_')) {
                          setTransferData({ ...transferData, account_id: parseInt(value.replace('account_', '')), goal_id: null });
                        } else if (value.startsWith('goal_')) {
                          setTransferData({ ...transferData, goal_id: parseInt(value.replace('goal_', '')), account_id: null });
                        }
                      }}
                      className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 ${getThemeRingClass(colorTheme)}`}
                    >
                      <option value="">Välj...</option>
                      <optgroup label="Spar-konton">
                        {accounts.map(acc => (
                          <option key={`account_${acc.id}`} value={`account_${acc.id}`}>{acc.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Sparmål">
                        {goals.map(goal => (
                          <option key={`goal_${goal.id}`} value={`goal_${goal.id}`}>{goal.name}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Belopp (kr) *</label>
                <input
                  type="number"
                  value={transferData.amount}
                  onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                  className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 ${getThemeRingClass(colorTheme)}`}
                  placeholder="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Datum *</label>
                <input
                  type="date"
                  value={transferData.date}
                  onChange={(e) => setTransferData({ ...transferData, date: e.target.value })}
                  className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 ${getThemeRingClass(colorTheme)}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Notering</label>
                <textarea
                  value={transferData.notes}
                  onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
                  className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 ${getThemeRingClass(colorTheme)}`}
                  rows={2}
                  placeholder="Notering..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleTransfer}
                  className={`flex-1 ${getThemeButtonClass(colorTheme, 'primary')} px-4 py-2.5 rounded-xl text-sm font-medium transition-all`}
                >
                  Genomför överföring
                </button>
                <button
                  onClick={() => {
                    setIsTransferModalOpen(false);
                    setTransferData({ type: 'deposit', account_id: null, goal_id: null, amount: '', date: new Date().toISOString().split('T')[0], notes: '' });
                  }}
                  className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl text-sm font-medium transition-all"
                >
                  Avbryt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavingsTab;

