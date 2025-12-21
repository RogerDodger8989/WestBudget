import React, { useState, useEffect } from 'react';
import { Users, CreditCard, BarChart3, DollarSign, Plus, Edit2, Trash2, Save, X, Eye, EyeOff, Mail } from 'lucide-react';
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
        setPayments(paymentsData.payments || []);
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
      await api.deleteAdminUser(userId);
      showToast('Användare raderad', { type: 'success' });
      await loadData();
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
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            activeTab === 'users'
              ? `${getThemeBgClass(colorTheme, false)} dark:${getThemeBgClass(colorTheme, true)} ${getThemeTextClass(colorTheme, false)} dark:${getThemeTextClass(colorTheme, true)} shadow-sm`
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Users size={16} />
          Användare
        </button>
        <button
          onClick={() => setActiveTab('licenses')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            activeTab === 'licenses'
              ? `${getThemeBgClass(colorTheme, false)} dark:${getThemeBgClass(colorTheme, true)} ${getThemeTextClass(colorTheme, false)} dark:${getThemeTextClass(colorTheme, true)} shadow-sm`
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <CreditCard size={16} />
          Licenser
        </button>
        <button
          onClick={() => setActiveTab('statistics')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            activeTab === 'statistics'
              ? `${getThemeBgClass(colorTheme, false)} dark:${getThemeBgClass(colorTheme, true)} ${getThemeTextClass(colorTheme, false)} dark:${getThemeTextClass(colorTheme, true)} shadow-sm`
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <BarChart3 size={16} />
          Statistik
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            activeTab === 'payments'
              ? `${getThemeBgClass(colorTheme, false)} dark:${getThemeBgClass(colorTheme, true)} ${getThemeTextClass(colorTheme, false)} dark:${getThemeTextClass(colorTheme, true)} shadow-sm`
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <DollarSign size={16} />
          Betalningar
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
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          u.role === 'admin' 
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
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            license.license_type === 'premium'
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                          }`}>
                            {license.license_type === 'premium' ? 'Premium' : 'Trial'}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            license.status === 'active'
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Totalt antal användare</h4>
                <p className="text-3xl font-bold text-zinc-900 dark:text-white">{statistics.users.total}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                  {statistics.users.by_role?.admin || 0} admin, {statistics.users.by_role?.user || 0} användare
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Nya användare denna månad</h4>
                <p className="text-3xl font-bold text-zinc-900 dark:text-white">{statistics.users.new_this_month}</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Aktiva licenser</h4>
                <p className="text-3xl font-bold text-zinc-900 dark:text-white">{statistics.licenses.active}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                  {statistics.licenses.by_type?.premium || 0} premium, {statistics.licenses.by_type?.trial || 0} trial
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Totalt antal transaktioner</h4>
                <p className="text-3xl font-bold text-zinc-900 dark:text-white">{statistics.usage.transactions}</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Totalt antal avtal</h4>
                <p className="text-3xl font-bold text-zinc-900 dark:text-white">{statistics.usage.agreements}</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Totalt antal lån</h4>
                <p className="text-3xl font-bold text-zinc-900 dark:text-white">{statistics.usage.loans}</p>
              </div>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-6">Betalningar</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Betalningshistorik kommer att vara tillgänglig efter Stripe-integration.
              </p>
            </div>
          )}
        </>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={(userData) => handleUpdateUser(editingUser.id, userData)}
        />
      )}

      {/* Edit License Modal */}
      {editingLicense && (
        <EditLicenseModal
          license={editingLicense}
          onClose={() => setEditingLicense(null)}
          onSave={(licenseData) => handleUpdateLicense(editingLicense.id, licenseData)}
        />
      )}
    </div>
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

