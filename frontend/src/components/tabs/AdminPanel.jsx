import React, { useState, useEffect } from 'react';
import { Users, CreditCard, BarChart3, DollarSign, Plus, Edit2, Trash2, Save, X, Eye, EyeOff, Mail, Settings, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeButtonClass, getThemeBgClass, getThemeTextClass, getThemeBorderClass } from '../../utils/getThemeClasses';

const AdminPanel = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { colorTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);

  // Users tab
  const [users, setUsers] = useState([]);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'user', license_type: 'trial' });
  const [showPassword, setShowPassword] = useState(false);

  // Licenses tab
  const [licenses, setLicenses] = useState([]);
  const [editingLicense, setEditingLicense] = useState(null);

  // Statistics tab
  const [statistics, setStatistics] = useState(null);

  // Payments tab
  const [payments, setPayments] = useState([]);

  // System settings tab
  const [systemSettings, setSystemSettings] = useState(null);

  // Email logs tab
  const [emailLogs, setEmailLogs] = useState([]);


  useEffect(() => {
    if (user?.role === 'admin') {
      loadData();
    }
  }, [user, activeTab]);

  const loadData = async () => {
    if (user?.role !== 'admin') return;

    setLoading(true);
    try {
      if (activeTab === 'users') {
        const usersData = await api.getAdminUsers();
        setUsers(usersData);
      } else if (activeTab === 'licenses') {
        const licensesData = await api.getAdminLicenses();
        setLicenses(licensesData);
      } else if (activeTab === 'statistics') {
        const stats = await api.getAdminStatistics();
        setStatistics(stats);
      } else if (activeTab === 'payments') {
        const paymentsData = await api.getAdminPayments();
        setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      } else if (activeTab === 'settings') {
        const settingsData = await api.getAdminSystemSettings();
        setSystemSettings(settingsData);
      } else if (activeTab === 'email_logs') {
        const logs = await api.getEmailLogs();
        setEmailLogs(logs);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.originalError?.error,
        activeTab: activeTab
      });

      // Show error message
      const errorMsg = error.message || 'Okänt fel';
      if (errorMsg.includes('401') || errorMsg.includes('403')) {
        showToast('Du har inte behörighet att visa denna data. Logga ut och logga in igen.', { type: 'error' });
      } else {
        showToast('Kunde inte ladda data: ' + errorMsg, { type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      await api.createAdminUser(newUser);
      showToast('Användare skapad', { type: 'success' });
      setIsCreatingUser(false);
      setNewUser({ email: '', password: '', role: 'user', license_type: 'trial' });
      await loadData();
    } catch (error) {
      showToast(error.message || 'Kunde inte skapa användare', { type: 'error' });
    }
  };

  const handleUpdateUser = async (userId, userData) => {
    try {
      await api.updateAdminUser(userId, userData);
      showToast('Användare uppdaterad', { type: 'success' });
      setEditingUser(null);
      await loadData();
    } catch (error) {
      showToast(error.message || 'Kunde inte uppdatera användare', { type: 'error' });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Är du säker på att du vill radera denna användare?')) return;

    try {
      // Get user data before deletion for undo
      const userToDelete = users.find(u => u.id === userId);
      if (!userToDelete) {
        showToast('Användare hittades inte', { type: 'error' });
        return;
      }

      const result = await api.deleteAdminUser(userId);
      const userData = result.user_data || userToDelete;

      await loadData();

      // Show toast with undo functionality
      showToast('Användare raderad', {
        type: 'success',
        undo: true,
        undoAction: async () => {
          try {
            // Get history to find the delete entry
            const history = await api.getHistory();
            const deleteEntry = history.find(h =>
              h.entity_type === 'user' &&
              h.entity_id === userId &&
              h.action_type === 'delete'
            );

            if (deleteEntry) {
              await api.undoHistoryAction(deleteEntry.id);
              await loadData();
              showToast('Användare återställd!', { type: 'success' });
            } else {
              showToast('Kunde inte hitta raderingshistorik', { type: 'error' });
            }
          } catch (err) {
            showToast('Kunde inte ångra: ' + (err.message || 'Okänt fel'), { type: 'error' });
          }
        },
        description: 'Klicka på Ångra för att återställa användaren'
      });
    } catch (error) {
      showToast(error.message || 'Kunde inte radera användare', { type: 'error' });
    }
  };

  const handleUpdateLicense = async (licenseId, licenseData) => {
    try {
      await api.updateAdminLicense(licenseId, licenseData);
      showToast('Licens uppdaterad', { type: 'success' });
      setEditingLicense(null);
      await loadData();
    } catch (error) {
      showToast(error.message || 'Kunde inte uppdatera licens', { type: 'error' });
    }
  };

  const handleRefund = async (paymentId, amount) => {
    if (!confirm(`Är du säker på att du vill återbetala ${amount?.toLocaleString('sv-SE', { maximumFractionDigits: 2 }) || 0} SEK?`)) {
      return;
    }

    try {
      await api.createRefund(paymentId, null, 'requested_by_customer');
      showToast('Återbetalning genomförd', { type: 'success' });
      await loadData();
    } catch (error) {
      showToast(error.message || 'Kunde inte genomföra återbetalning', { type: 'error' });
    }
  };

  const handleSendCredentials = async (userId, userEmail) => {
    const password = prompt(`Ange lösenord att skicka till ${userEmail}:`);
    if (!password) return;

    if (password.length < 8) {
      showToast('Lösenordet måste vara minst 8 tecken', { type: 'error' });
      return;
    }

    try {
      const result = await api.sendUserCredentials(userId, password);
      showToast(`Loginuppgifter skickade till ${userEmail}`, { type: 'success' });
      // Update user password in database
      await api.updateAdminUser(userId, { password });
      await loadData();
    } catch (error) {
      showToast(error.message || 'Kunde inte skicka loginuppgifter', { type: 'error' });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Aldrig';
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
        <p className="text-zinc-600 dark:text-zinc-400">Du har inte behörighet att visa admin-panelen.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-zinc-200 dark:bg-zinc-900/50 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'users'
            ? `${getThemeBgClass(colorTheme, false)} dark:${getThemeBgClass(colorTheme, true)} ${getThemeTextClass(colorTheme, false)} dark:${getThemeTextClass(colorTheme, true)} shadow-sm`
            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
        >
          <Users size={16} />
          Användare
        </button>
        <button
          onClick={() => setActiveTab('licenses')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'licenses'
            ? `${getThemeBgClass(colorTheme, false)} dark:${getThemeBgClass(colorTheme, true)} ${getThemeTextClass(colorTheme, false)} dark:${getThemeTextClass(colorTheme, true)} shadow-sm`
            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
        >
          <CreditCard size={16} />
          Licenser
        </button>
        <button
          onClick={() => setActiveTab('statistics')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'statistics'
            ? `${getThemeBgClass(colorTheme, false)} dark:${getThemeBgClass(colorTheme, true)} ${getThemeTextClass(colorTheme, false)} dark:${getThemeTextClass(colorTheme, true)} shadow-sm`
            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
        >
          <BarChart3 size={16} />
          Statistik
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'payments'
            ? `${getThemeBgClass(colorTheme, false)} dark:${getThemeBgClass(colorTheme, true)} ${getThemeTextClass(colorTheme, false)} dark:${getThemeTextClass(colorTheme, true)} shadow-sm`
            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
        >
          <DollarSign size={16} />
          Betalningar
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'settings'
            ? `${getThemeBgClass(colorTheme, false)} dark:${getThemeBgClass(colorTheme, true)} ${getThemeTextClass(colorTheme, false)} dark:${getThemeTextClass(colorTheme, true)} shadow-sm`
            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
        >
          <Settings size={16} />
          Systeminställningar
        </button>
        <button
          onClick={() => setActiveTab('email_logs')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'email_logs'
            ? `${getThemeBgClass(colorTheme, false)} dark:${getThemeBgClass(colorTheme, true)} ${getThemeTextClass(colorTheme, false)} dark:${getThemeTextClass(colorTheme, true)} shadow-sm`
            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
        >
          <Mail size={16} />
          E-postloggar
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/4"></div>
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2"></div>
          </div>
        </div>
      ) : (
        <>
          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Användare</h3>
                <button
                  onClick={() => setIsCreatingUser(true)}
                  className={`px-4 py-2 ${getThemeButtonClass(colorTheme, 'primary')} rounded-lg text-sm font-medium flex items-center gap-2`}
                >
                  <Plus size={16} />
                  Skapa användare
                </button>
              </div>

              {/* Create User Modal */}
              {isCreatingUser && (
                <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                  <h4 className="font-semibold text-zinc-900 dark:text-white mb-4">Skapa ny användare</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">E-post</label>
                      <input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 text-zinc-900 dark:text-white"
                        placeholder="användare@exempel.se"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">Lösenord</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 pr-10 text-zinc-900 dark:text-white"
                          placeholder="Minst 8 tecken"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">Roll</label>
                        <select
                          value={newUser.role}
                          onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 text-zinc-900 dark:text-white"
                        >
                          <option value="user">Användare</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">Licenstyp</label>
                        <select
                          value={newUser.license_type}
                          onChange={(e) => setNewUser({ ...newUser, license_type: e.target.value })}
                          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 text-zinc-900 dark:text-white"
                        >
                          <option value="trial">Trial (30 dagar)</option>
                          <option value="premium">Premium</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateUser}
                        className={`px-4 py-2 ${getThemeButtonClass(colorTheme, 'primary')} rounded-lg text-sm font-medium`}
                      >
                        Skapa
                      </button>
                      <button
                        onClick={() => {
                          setIsCreatingUser(false);
                          setNewUser({ email: '', password: '', role: 'user', license_type: 'trial' });
                        }}
                        className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg text-sm font-medium"
                      >
                        Avbryt
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Users List */}
              <div className="space-y-2">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-medium text-zinc-900 dark:text-white">{u.email}</p>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${u.role === 'admin'
                          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                          : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                          }`}>
                          {u.role === 'admin' ? 'Admin' : 'Användare'}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Skapad: {formatDate(u.created_at)}
                        {u.last_login && ` • Senast inloggad: ${formatDate(u.last_login)}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSendCredentials(u.id, u.email)}
                        className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                        title="Skicka loginuppgifter"
                      >
                        <Mail size={18} className="text-indigo-600 dark:text-indigo-400" />
                      </button>
                      <button
                        onClick={() => setEditingUser(u)}
                        className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                        title="Redigera"
                      >
                        <Edit2 size={18} className="text-zinc-600 dark:text-zinc-400" />
                      </button>
                      {u.id !== user.id && (
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-2 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                          title="Radera"
                        >
                          <Trash2 size={18} className="text-rose-600 dark:text-rose-400" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Licenses Tab */}
          {activeTab === 'licenses' && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-6">Licenser</h3>
              <div className="space-y-2">
                {licenses.map((license) => (
                  <div
                    key={license.id}
                    className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-medium text-zinc-900 dark:text-white">{license.user_email}</p>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${license.license_type === 'premium'
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                            }`}>
                            {license.license_type === 'premium' ? 'Premium' : 'Trial'}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${license.status === 'active'
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                            : license.status === 'expired'
                              ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'
                              : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                            }`}>
                            {license.status === 'active' ? 'Aktiv' : license.status === 'expired' ? 'Utgången' : 'Avbruten'}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          Startade: {formatDate(license.starts_at)}
                          {license.expires_at && ` • Går ut: ${formatDate(license.expires_at)}`}
                        </p>
                      </div>
                      <button
                        onClick={() => setEditingLicense(license)}
                        className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                        title="Redigera"
                      >
                        <Edit2 size={18} className="text-zinc-600 dark:text-zinc-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'statistics' && statistics && (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`${getThemeBgClass(colorTheme)} ${getThemeBorderClass(colorTheme)} border rounded-xl p-6`}>
                  <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Totalt antal användare</h4>
                  <p className={`text-3xl font-bold ${getThemeTextClass(colorTheme)}`}>{statistics.users?.total || 0}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                    {statistics.users?.by_role?.admin || 0} admin, {statistics.users?.by_role?.user || 0} användare
                  </p>
                </div>
                <div className={`${getThemeBgClass(colorTheme)} ${getThemeBorderClass(colorTheme)} border rounded-xl p-6`}>
                  <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Aktiva prenumerationer</h4>
                  <p className={`text-3xl font-bold ${getThemeTextClass(colorTheme)}`}>{statistics.subscriptions?.active || 0}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                    {statistics.subscriptions?.users_with_subscriptions || 0} användare med prenumeration
                  </p>
                </div>
                <div className={`${getThemeBgClass(colorTheme)} ${getThemeBorderClass(colorTheme)} border rounded-xl p-6`}>
                  <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">MRR (Månadsintäkter)</h4>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {statistics.revenue?.mrr?.toLocaleString('sv-SE', { maximumFractionDigits: 0 }) || 0} kr
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                    Denna månad: {statistics.revenue?.this_month?.toLocaleString('sv-SE', { maximumFractionDigits: 0 }) || 0} kr
                  </p>
                </div>
                <div className={`${getThemeBgClass(colorTheme)} ${getThemeBorderClass(colorTheme)} border rounded-xl p-6`}>
                  <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Churn Rate</h4>
                  <p className={`text-3xl font-bold ${(statistics.churn?.rate || 0) > 5 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {statistics.churn?.rate || 0}%
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                    {statistics.churn?.cancelled_this_month || 0} avbokningar denna månad
                  </p>
                </div>
              </div>

              {/* Second Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`${getThemeBgClass(colorTheme)} ${getThemeBorderClass(colorTheme)} border rounded-xl p-6`}>
                  <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Nya användare denna månad</h4>
                  <p className={`text-3xl font-bold ${getThemeTextClass(colorTheme)}`}>{statistics.users?.new_this_month || 0}</p>
                </div>
                <div className={`${getThemeBgClass(colorTheme)} ${getThemeBorderClass(colorTheme)} border rounded-xl p-6`}>
                  <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Aktiva licenser</h4>
                  <p className={`text-3xl font-bold ${getThemeTextClass(colorTheme)}`}>{statistics.licenses?.active || 0}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                    {statistics.licenses?.by_type?.premium || 0} premium, {statistics.licenses?.by_type?.trial || 0} trial
                  </p>
                </div>
                <div className={`${getThemeBgClass(colorTheme)} ${getThemeBorderClass(colorTheme)} border rounded-xl p-6`}>
                  <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Totalt intäkter</h4>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {statistics.revenue?.total?.toLocaleString('sv-SE', { maximumFractionDigits: 0 }) || 0} kr
                  </p>
                </div>
                <div className={`${getThemeBgClass(colorTheme)} ${getThemeBorderClass(colorTheme)} border rounded-xl p-6`}>
                  <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Trial som går ut snart</h4>
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                    {statistics.licenses?.trials_expiring_soon || 0}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                    Inom 7 dagar
                  </p>
                </div>
              </div>

              {/* Usage Statistics */}
              <div className={`${getThemeBgClass(colorTheme)} ${getThemeBorderClass(colorTheme)} border rounded-xl p-6`}>
                <h3 className={`text-lg font-semibold ${getThemeTextClass(colorTheme)} mb-4`}>Användningsstatistik</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Transaktioner</h4>
                    <p className={`text-2xl font-bold ${getThemeTextClass(colorTheme)}`}>{statistics.usage?.transactions || 0}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Avtal</h4>
                    <p className={`text-2xl font-bold ${getThemeTextClass(colorTheme)}`}>{statistics.usage?.agreements || 0}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Lån</h4>
                    <p className={`text-2xl font-bold ${getThemeTextClass(colorTheme)}`}>{statistics.usage?.loans || 0}</p>
                  </div>
                </div>
              </div>

              {/* New Users Chart */}
              {statistics.users?.new_by_month && statistics.users.new_by_month.length > 0 && (
                <div className={`${getThemeBgClass(colorTheme)} ${getThemeBorderClass(colorTheme)} border rounded-xl p-6`}>
                  <h3 className={`text-lg font-semibold ${getThemeTextClass(colorTheme)} mb-4`}>Nya användare (senaste 6 månaderna)</h3>
                  <div className="h-64 w-full min-h-[256px]">
                    <ResponsiveContainer width="100%" height={256}>
                      <BarChart data={statistics.users.new_by_month}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                        <XAxis
                          dataKey="month"
                          stroke="#71717a"
                          tick={{ fill: '#71717a' }}
                        />
                        <YAxis
                          stroke="#71717a"
                          tick={{ fill: '#71717a' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#18181b',
                            border: '1px solid #3f3f46',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className={`${getThemeBgClass(colorTheme)} ${getThemeBorderClass(colorTheme)} border rounded-xl p-6`}>
                <h3 className={`text-xl font-semibold ${getThemeTextClass(colorTheme)} mb-6`}>Betalningar</h3>
                {loading ? (
                  <p className="text-zinc-600 dark:text-zinc-400">Laddar betalningar...</p>
                ) : payments && payments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={`border-b ${getThemeBorderClass(colorTheme)}`}>
                          <th className={`text-left py-3 px-4 ${getThemeTextClass(colorTheme, 'zinc-500', 'zinc-400')} font-medium`}>Användare</th>
                          <th className={`text-left py-3 px-4 ${getThemeTextClass(colorTheme, 'zinc-500', 'zinc-400')} font-medium`}>Belopp</th>
                          <th className={`text-left py-3 px-4 ${getThemeTextClass(colorTheme, 'zinc-500', 'zinc-400')} font-medium`}>Status</th>
                          <th className={`text-left py-3 px-4 ${getThemeTextClass(colorTheme, 'zinc-500', 'zinc-400')} font-medium`}>Datum</th>
                          <th className={`text-left py-3 px-4 ${getThemeTextClass(colorTheme, 'zinc-500', 'zinc-400')} font-medium`}>Åtgärder</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((payment) => (
                          <tr key={payment.id} className={`border-b ${getThemeBorderClass(colorTheme)}`}>
                            <td className="py-3 px-4">
                              <p className={`${getThemeTextClass(colorTheme)}`}>{payment.user_email || 'Okänd'}</p>
                            </td>
                            <td className="py-3 px-4">
                              <p className={`font-medium ${getThemeTextClass(colorTheme)}`}>
                                {payment.amount?.toLocaleString('sv-SE', { maximumFractionDigits: 2 }) || 0} {payment.currency?.toUpperCase() || 'SEK'}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${payment.status === 'succeeded' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                payment.status === 'refunded' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                                  payment.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                    'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                                }`}>
                                {payment.status === 'succeeded' ? 'Lyckades' :
                                  payment.status === 'refunded' ? 'Återbetalad' :
                                    payment.status === 'failed' ? 'Misslyckades' :
                                      payment.status === 'pending' ? 'Väntar' : payment.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <p className={`text-sm ${getThemeTextClass(colorTheme, 'zinc-500', 'zinc-400')}`}>
                                {payment.created_at ? new Date(payment.created_at).toLocaleDateString('sv-SE') : '-'}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              {payment.status === 'succeeded' && (
                                <button
                                  onClick={() => handleRefund(payment.id, payment.amount)}
                                  className={`px-3 py-1.5 ${getThemeButtonClass(colorTheme, 'secondary')} rounded-lg text-sm font-medium transition-colors`}
                                  title="Återbetalning"
                                >
                                  Återbetal
                                </button>
                              )}
                              {payment.status === 'refunded' && (
                                <span className="text-sm text-zinc-500 dark:text-zinc-400">Redan återbetalad</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-zinc-600 dark:text-zinc-400">Inga betalningar hittades.</p>
                )}
              </div>
            </div>
          )}

          {/* System Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className={`${getThemeBgClass(colorTheme)} ${getThemeBorderClass(colorTheme)} border rounded-xl p-6`}>
                <h3 className={`text-xl font-semibold ${getThemeTextClass(colorTheme)} mb-6`}>Systeminställningar</h3>

                {loading ? (
                  <p className="text-zinc-600 dark:text-zinc-400">Laddar inställningar...</p>
                ) : systemSettings ? (
                  <div className="space-y-6">
                    {/* Stripe Configuration */}
                    <div className="space-y-4">
                      <h4 className={`text-lg font-medium ${getThemeTextClass(colorTheme)}`}>Stripe Konfiguration</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={`p-4 rounded-lg border ${getThemeBorderClass(colorTheme)}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-medium ${getThemeTextClass(colorTheme)}`}>Stripe Secret Key</span>
                            {systemSettings.stripe?.secret_key_configured ? (
                              <CheckCircle className="text-emerald-500" size={20} />
                            ) : (
                              <XCircle className="text-rose-500" size={20} />
                            )}
                          </div>
                          <p className={`text-xs ${getThemeTextClass(colorTheme, 'zinc-500', 'zinc-400')}`}>
                            {systemSettings.stripe?.secret_key_configured ? 'Konfigurerad' : 'Ej konfigurerad'}
                          </p>
                        </div>
                        <div className={`p-4 rounded-lg border ${getThemeBorderClass(colorTheme)}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-medium ${getThemeTextClass(colorTheme)}`}>Stripe Publishable Key</span>
                            {systemSettings.stripe?.publishable_key_configured ? (
                              <CheckCircle className="text-emerald-500" size={20} />
                            ) : (
                              <XCircle className="text-rose-500" size={20} />
                            )}
                          </div>
                          <p className={`text-xs ${getThemeTextClass(colorTheme, 'zinc-500', 'zinc-400')}`}>
                            {systemSettings.stripe?.publishable_key_configured ? 'Konfigurerad' : 'Ej konfigurerad'}
                          </p>
                        </div>
                        <div className={`p-4 rounded-lg border ${getThemeBorderClass(colorTheme)}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-medium ${getThemeTextClass(colorTheme)}`}>Webhook Secret</span>
                            {systemSettings.stripe?.webhook_secret_configured ? (
                              <CheckCircle className="text-emerald-500" size={20} />
                            ) : (
                              <XCircle className="text-rose-500" size={20} />
                            )}
                          </div>
                          <p className={`text-xs ${getThemeTextClass(colorTheme, 'zinc-500', 'zinc-400')}`}>
                            {systemSettings.stripe?.webhook_secret_configured ? 'Konfigurerad' : 'Ej konfigurerad'}
                          </p>
                        </div>
                        <div className={`p-4 rounded-lg border ${getThemeBorderClass(colorTheme)}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-medium ${getThemeTextClass(colorTheme)}`}>Price ID</span>
                            {systemSettings.stripe?.price_id_configured ? (
                              <CheckCircle className="text-emerald-500" size={20} />
                            ) : (
                              <XCircle className="text-rose-500" size={20} />
                            )}
                          </div>
                          <p className={`text-xs ${getThemeTextClass(colorTheme, 'zinc-500', 'zinc-400')}`}>
                            {systemSettings.stripe?.price_id || 'Ej konfigurerad'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* SendGrid Configuration */}
                    <div className="space-y-4">
                      <h4 className={`text-lg font-medium ${getThemeTextClass(colorTheme)}`}>SendGrid Konfiguration</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={`p-4 rounded-lg border ${getThemeBorderClass(colorTheme)}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-medium ${getThemeTextClass(colorTheme)}`}>API Key</span>
                            {systemSettings.sendgrid?.api_key_configured ? (
                              <CheckCircle className="text-emerald-500" size={20} />
                            ) : (
                              <XCircle className="text-rose-500" size={20} />
                            )}
                          </div>
                          <p className={`text-xs ${getThemeTextClass(colorTheme, 'zinc-500', 'zinc-400')}`}>
                            {systemSettings.sendgrid?.api_key_configured ? 'Konfigurerad' : 'Ej konfigurerad'}
                          </p>
                        </div>
                        <div className={`p-4 rounded-lg border ${getThemeBorderClass(colorTheme)}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-medium ${getThemeTextClass(colorTheme)}`}>From Email</span>
                            {systemSettings.sendgrid?.from_email ? (
                              <CheckCircle className="text-emerald-500" size={20} />
                            ) : (
                              <XCircle className="text-rose-500" size={20} />
                            )}
                          </div>
                          <p className={`text-xs ${getThemeTextClass(colorTheme, 'zinc-500', 'zinc-400')}`}>
                            {systemSettings.sendgrid?.from_email || 'Ej konfigurerad'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Rate Limiting */}
                    <div className="space-y-4">
                      <h4 className={`text-lg font-medium ${getThemeTextClass(colorTheme)}`}>Rate Limiting</h4>
                      <div className={`p-4 rounded-lg border ${getThemeBorderClass(colorTheme)}`}>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-medium ${getThemeTextClass(colorTheme)}`}>Globala gränser</span>
                          </div>
                          <p className={`text-sm ${getThemeTextClass(colorTheme, 'zinc-500', 'zinc-400')}`}>
                            200 förfrågningar per dag, 50 per timme
                          </p>
                          <div className="mt-3 space-y-1">
                            <p className={`text-xs ${getThemeTextClass(colorTheme, 'zinc-500', 'zinc-400')}`}>
                              • Register: 5 per minut
                            </p>
                            <p className={`text-xs ${getThemeTextClass(colorTheme, 'zinc-500', 'zinc-400')}`}>
                              • Login: 10 per minut
                            </p>
                            <p className={`text-xs ${getThemeTextClass(colorTheme, 'zinc-500', 'zinc-400')}`}>
                              • Forgot Password: 3 per timme
                            </p>
                            <p className={`text-xs ${getThemeTextClass(colorTheme, 'zinc-500', 'zinc-400')}`}>
                              • Reset Password: 5 per timme
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* System Information */}
                    <div className="space-y-4">
                      <h4 className={`text-lg font-medium ${getThemeTextClass(colorTheme)}`}>Systeminformation</h4>
                      <div className={`p-4 rounded-lg border ${getThemeBorderClass(colorTheme)}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className={`text-sm font-medium ${getThemeTextClass(colorTheme)}`}>Databas</span>
                            <p className={`text-sm ${getThemeTextClass(colorTheme, 'zinc-500', 'zinc-400')}`}>
                              {systemSettings.database?.type || 'SQLite'}
                            </p>
                          </div>
                          <div>
                            <span className={`text-sm font-medium ${getThemeTextClass(colorTheme)}`}>Upload Folder</span>
                            <p className={`text-sm ${getThemeTextClass(colorTheme, 'zinc-500', 'zinc-400')}`}>
                              {systemSettings.database?.upload_folder || 'uploads'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-zinc-600 dark:text-zinc-400">Kunde inte ladda systeminställningar.</p>
                )}
              </div>
            </div>

          )}

          {/* Email Logs Tab */}
          {activeTab === 'email_logs' && (
            <div className="space-y-4">
              <div className={`${getThemeBgClass(colorTheme)} ${getThemeBorderClass(colorTheme)} border rounded-xl p-6`}>
                <h3 className={`text-xl font-semibold ${getThemeTextClass(colorTheme)} mb-6`}>Loggade E-postutskick</h3>
                {loading ? (
                  <p className="text-zinc-600 dark:text-zinc-400">Laddar loggar...</p>
                ) : emailLogs && emailLogs.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={`border-b ${getThemeBorderClass(colorTheme)}`}>
                          <th className={`text-left py-3 px-4 ${getThemeTextClass(colorTheme, 'zinc-500', 'zinc-400')} font-medium`}>Datum</th>
                          <th className={`text-left py-3 px-4 ${getThemeTextClass(colorTheme, 'zinc-500', 'zinc-400')} font-medium`}>Mottagare</th>
                          <th className={`text-left py-3 px-4 ${getThemeTextClass(colorTheme, 'zinc-500', 'zinc-400')} font-medium`}>Ämne</th>
                          <th className={`text-left py-3 px-4 ${getThemeTextClass(colorTheme, 'zinc-500', 'zinc-400')} font-medium`}>Status</th>
                          <th className={`text-left py-3 px-4 ${getThemeTextClass(colorTheme, 'zinc-500', 'zinc-400')} font-medium`}>Felmeddelande</th>
                        </tr>
                      </thead>
                      <tbody>
                        {emailLogs.map((log) => (
                          <tr key={log.id} className={`border-b ${getThemeBorderClass(colorTheme)}`}>
                            <td className="py-3 px-4">
                              <p className={`text-sm ${getThemeTextClass(colorTheme, 'zinc-500', 'zinc-400')}`}>
                                {formatDate(log.created_at)}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <p className={`${getThemeTextClass(colorTheme)}`}>{log.recipient_email}</p>
                              {log.user_email && <p className="text-xs text-zinc-500">Till: {log.user_email}</p>}
                            </td>
                            <td className="py-3 px-4">
                              <p className={`${getThemeTextClass(colorTheme)}`}>{log.subject}</p>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${log.status === 'sent'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                }`}>
                                {log.status === 'sent' ? 'Skickat' : 'Misslyckades'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-xs text-red-500 max-w-xs truncate" title={log.error_message}>
                                {log.error_message || '-'}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-zinc-600 dark:text-zinc-400">Inga e-postloggar hittades.</p>
                )}
              </div>
            </div>
          )}
        </>
      )}
      {
        editingUser && (
          <EditUserModal
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onSave={(userData) => handleUpdateUser(editingUser.id, userData)}
          />
        )
      }

      {/* Edit License Modal */}
      {
        editingLicense && (
          <EditLicenseModal
            license={editingLicense}
            onClose={() => setEditingLicense(null)}
            onSave={(licenseData) => handleUpdateLicense(editingLicense.id, licenseData)}
          />
        )
      }
    </div >
  );
};

// Edit User Modal Component
const EditUserModal = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    email: user.email,
    password: '',
    role: user.role
  });
  const [showPassword, setShowPassword] = useState(false);
  const { colorTheme } = useTheme();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6">
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Redigera användare</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">E-post</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 text-zinc-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">Nytt lösenord (lämna tomt för att behålla)</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 pr-10 text-zinc-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">Roll</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 text-zinc-900 dark:text-white"
            >
              <option value="user">Användare</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-2 pt-4">
            <button
              onClick={() => onSave(formData)}
              className={`flex-1 px-4 py-2 ${getThemeButtonClass(colorTheme, 'primary')} rounded-lg text-sm font-medium`}
            >
              Spara
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg text-sm font-medium"
            >
              Avbryt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Edit License Modal Component
const EditLicenseModal = ({ license, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    license_type: license.license_type,
    status: license.status,
    expires_at: license.expires_at ? license.expires_at.split('T')[0] : ''
  });
  const { colorTheme } = useTheme();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6">
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Redigera licens</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">Licenstyp</label>
            <select
              value={formData.license_type}
              onChange={(e) => setFormData({ ...formData, license_type: e.target.value })}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 text-zinc-900 dark:text-white"
            >
              <option value="trial">Trial</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 text-zinc-900 dark:text-white"
            >
              <option value="active">Aktiv</option>
              <option value="expired">Utgången</option>
              <option value="cancelled">Avbruten</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">Går ut (lämna tomt för premium)</label>
            <input
              type="date"
              value={formData.expires_at}
              onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 text-zinc-900 dark:text-white"
            />
          </div>
          <div className="flex gap-2 pt-4">
            <button
              onClick={() => onSave({
                license_type: formData.license_type,
                status: formData.status,
                expires_at: formData.expires_at || null
              })}
              className={`flex-1 px-4 py-2 ${getThemeButtonClass(colorTheme, 'primary')} rounded-lg text-sm font-medium`}
            >
              Spara
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg text-sm font-medium"
            >
              Avbryt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;

