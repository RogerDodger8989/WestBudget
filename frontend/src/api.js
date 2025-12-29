// Determine API base URL based on environment
const getApiBaseUrl = () => {
  // Check if we're in Electron
  if (window.electronAPI) {
    // In Electron, use localhost (backend runs locally)
    return 'http://localhost:5000';
  }
  // In browser, use the configured IP or localhost
  // Note: Vite proxy handles /api -> localhost:5000 in dev
  return import.meta.env.VITE_API_URL || '';
};

const API_BASE_URL = getApiBaseUrl();

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Helper för felhantering
async function handleResponse(res) {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Serverfel' }));
    // Use message if available, otherwise use error field
    let errorMessage = error.message || error.error || `HTTP error! status: ${res.status}`;

    // Provide more helpful error messages for common errors
    if (res.status === 403 && errorMessage.includes('SendGrid')) {
      errorMessage = 'SendGrid API key saknar behörighet eller avsändaradressen är inte verifierad. Kontrollera SendGrid Dashboard.';
    } else if (res.status === 401 && errorMessage.includes('SendGrid')) {
      errorMessage = 'SendGrid API key är ogiltig. Kontrollera att API key är korrekt.';
    }

    const errorObj = new Error(errorMessage);
    errorObj.originalError = error; // Store original error object for more details
    errorObj.status = res.status; // Store status code
    throw errorObj;
  }
  return res.json();
}

export const api = {
  // --- Transaktioner ---
  getTransactions: async () => {
    const res = await fetch(`${API_BASE_URL}/transactions`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  createTransaction: async (data) => {
    const res = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateTransaction: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  deleteTransaction: async (id) => {
    const res = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  deleteTransactionReceipt: async (transactionId, receiptPathToDelete) => {
    const res = await fetch(`${API_BASE_URL}/transactions/${transactionId}/receipt?path=${encodeURIComponent(receiptPathToDelete)}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // --- Filuppladdning (Kvitton) ---
  uploadReceipt: async (file, transactionId = null) => {
    const formData = new FormData();
    formData.append('file', file);

    // Use new endpoint with transaction ID if provided, otherwise use legacy endpoint
    const endpoint = transactionId
      ? `${API_BASE_URL}/transactions/${transactionId}/upload-receipt`
      : `${API_BASE_URL}/upload`;

    const res = await fetch(endpoint, {
      method: 'POST',
      body: formData, // Låt webbläsaren sätta Content-Type för multipart
    });
    return handleResponse(res); // Returnerar { file_path: "...", filename: "..." }
  },

  // --- Avtal ---
  getAgreements: async () => {
    const res = await fetch(`${API_BASE_URL}/agreements`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  createAgreement: async (data) => {
    const res = await fetch(`${API_BASE_URL}/agreements`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateAgreement: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/agreements/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  deleteAgreement: async (id) => {
    const res = await fetch(`${API_BASE_URL}/agreements/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  uploadAgreementImage: async (agreementId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_BASE_URL}/agreements/${agreementId}/upload-image`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: formData,
    });
    return handleResponse(res);
  },

  deleteAgreementImage: async (agreementId, imagePath) => {
    const res = await fetch(`${API_BASE_URL}/agreements/${agreementId}/images/${encodeURIComponent(imagePath)}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // --- Kategorier ---
  getCategories: async () => {
    const res = await fetch(`${API_BASE_URL}/categories`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  getCategoriesWithIds: async () => {
    const res = await fetch(`${API_BASE_URL}/categories/with-ids`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  createCategory: async (name) => {
    const res = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    return handleResponse(res);
  },

  // --- Media Files ---
  getMediaFiles: async () => {
    const res = await fetch(`${API_BASE_URL}/media-files`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  updateCategory: async (id, name) => {
    const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    return handleResponse(res);
  },

  deleteCategory: async (id) => {
    const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  mergeCategories: async (sourceId, targetId, newName) => {
    const res = await fetch(`${API_BASE_URL}/categories/merge`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ source_id: sourceId, target_id: targetId, new_name: newName }),
    });
    return handleResponse(res);
  },

  // --- Inställningar ---
  getSettings: async () => {
    const res = await fetch(`${API_BASE_URL}/settings`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  saveSettings: async (settings) => {
    const res = await fetch(`${API_BASE_URL}/settings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings),
    });
    return handleResponse(res);
  },

  selectFolder: async () => {
    const res = await fetch(`${API_BASE_URL}/select-folder`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // --- Category Rules ---
  getCategoryRules: async () => {
    const res = await fetch(`${API_BASE_URL}/category-rules`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  createCategoryRule: async (data) => {
    const res = await fetch(`${API_BASE_URL}/category-rules`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateCategoryRule: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/category-rules/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  deleteCategoryRule: async (id) => {
    const res = await fetch(`${API_BASE_URL}/category-rules/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // --- Vehicles ---
  getVehicles: async () => {
    const res = await fetch(`${API_BASE_URL}/vehicles`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  getVehicle: async (id) => {
    const res = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  createVehicle: async (data) => {
    const res = await fetch(`${API_BASE_URL}/vehicles`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateVehicle: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  deleteVehicle: async (id) => {
    const res = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  uploadVehicleImage: async (vehicleId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}/upload-image`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: formData,
    });
    return handleResponse(res);
  },

  // --- Vehicle Expenses ---
  getVehicleExpenses: async (vehicleId = null) => {
    const url = vehicleId
      ? `${API_BASE_URL}/vehicle-expenses?vehicle_id=${vehicleId}`
      : `${API_BASE_URL}/vehicle-expenses`;
    const res = await fetch(url, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  getVehicleExpense: async (id) => {
    const res = await fetch(`${API_BASE_URL}/vehicle-expenses/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  createVehicleExpense: async (data) => {
    const res = await fetch(`${API_BASE_URL}/vehicle-expenses`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateVehicleExpense: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/vehicle-expenses/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  deleteVehicleExpense: async (id) => {
    const res = await fetch(`${API_BASE_URL}/vehicle-expenses/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // --- Backup & Restore ---
  createBackup: async () => {
    const response = await fetch(`${API_BASE_URL}/backup/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create backup');
    }

    // Download the ZIP file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    a.href = url;
    a.download = `westbudget_backup_${timestamp}.zip`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return { success: true };
  },

  restoreBackup: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/backup/restore`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to restore backup');
    }

    return await response.json();
  },

  // --- Savings Goals ---
  getSavingsGoals: async () => {
    const res = await fetch(`${API_BASE_URL}/savings/goals`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  createSavingsGoal: async (data) => {
    const res = await fetch(`${API_BASE_URL}/savings/goals`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateSavingsGoal: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/savings/goals/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  deleteSavingsGoal: async (id) => {
    const res = await fetch(`${API_BASE_URL}/savings/goals/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // --- Savings Accounts ---
  getSavingsAccounts: async () => {
    const res = await fetch(`${API_BASE_URL}/savings/accounts`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  createSavingsAccount: async (data) => {
    const res = await fetch(`${API_BASE_URL}/savings/accounts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateSavingsAccount: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/savings/accounts/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  deleteSavingsAccount: async (id) => {
    const res = await fetch(`${API_BASE_URL}/savings/accounts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // --- Savings Transactions ---
  transferSavings: async (data) => {
    const res = await fetch(`${API_BASE_URL}/savings/transfer`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  linkTransactionToSavings: async (data) => {
    const res = await fetch(`${API_BASE_URL}/savings/link-transaction`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  getSavingsTransactions: async (accountId = null, goalId = null) => {
    const params = new URLSearchParams();
    if (accountId) params.append('account_id', accountId);
    if (goalId) params.append('goal_id', goalId);
    const query = params.toString();
    const res = await fetch(`${API_BASE_URL}/savings/transactions${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // --- Link Transaction to Vehicle ---
  linkTransactionToVehicle: async (data) => {
    const res = await fetch(`${API_BASE_URL}/vehicles/link-transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // --- Loans ---
  getLoans: async () => {
    const res = await fetch(`${API_BASE_URL}/loans`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  createLoan: async (data) => {
    const res = await fetch(`${API_BASE_URL}/loans`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateLoan: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/loans/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  deleteLoan: async (id) => {
    const res = await fetch(`${API_BASE_URL}/loans/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  getLoanPayments: async (loanId) => {
    const res = await fetch(`${API_BASE_URL}/loans/${loanId}/payments`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  createLoanPayment: async (loanId, data) => {
    const res = await fetch(`${API_BASE_URL}/loans/${loanId}/payments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  getLoanInterestPeriods: async (loanId) => {
    const res = await fetch(`${API_BASE_URL}/loans/${loanId}/interest-periods`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  createLoanInterestPeriod: async (loanId, data) => {
    const res = await fetch(`${API_BASE_URL}/loans/${loanId}/interest-periods`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  getAmortizationPlan: async (loanId) => {
    const res = await fetch(`${API_BASE_URL}/loans/${loanId}/amortization-plan`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  linkTransactionToLoan: async (data) => {
    const res = await fetch(`${API_BASE_URL}/loans/link-transaction`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // --- Sparade Sökningar ---
  getSavedSearches: async () => {
    const res = await fetch(`${API_BASE_URL}/saved-searches`);
    return handleResponse(res);
  },

  saveSearch: async (searchData) => {
    const res = await fetch(`${API_BASE_URL}/saved-searches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(searchData),
    });
    return handleResponse(res);
  },

  deleteSavedSearch: async (id) => {
    const res = await fetch(`${API_BASE_URL}/saved-searches/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  deleteSearch: async (id) => {
    const res = await fetch(`${API_BASE_URL}/saved-searches/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  // --- Dashboard Layout ---
  getDashboardLayout: async () => {
    const res = await fetch(`${API_BASE_URL}/dashboard-layout`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  saveDashboardLayout: async (widgets) => {
    const res = await fetch(`${API_BASE_URL}/dashboard-layout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ widgets }),
    });
    return handleResponse(res);
  },

  // --- History ---
  getHistory: async (limit = 100, entityType = null) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    if (entityType) params.append('entity_type', entityType);

    const res = await fetch(`${API_BASE_URL}/history?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  undoHistoryAction: async (historyId) => {
    const res = await fetch(`${API_BASE_URL}/history/${historyId}/undo`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  clearHistory: async () => {
    const res = await fetch(`${API_BASE_URL}/history/clear`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // --- Custom Themes ---
  getCustomThemes: async () => {
    const res = await fetch(`${API_BASE_URL}/custom-themes`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  createCustomTheme: async (themeData) => {
    const res = await fetch(`${API_BASE_URL}/custom-themes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(themeData),
    });
    return handleResponse(res);
  },

  updateCustomTheme: async (id, themeData) => {
    const res = await fetch(`${API_BASE_URL}/custom-themes/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(themeData),
    });
    return handleResponse(res);
  },

  deleteCustomTheme: async (id) => {
    const res = await fetch(`${API_BASE_URL}/custom-themes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // --- Report Templates ---
  getReportTemplates: async () => {
    const res = await fetch(`${API_BASE_URL}/report-templates`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  saveReportTemplate: async (templateData) => {
    const res = await fetch(`${API_BASE_URL}/report-templates`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(templateData),
    });
    return handleResponse(res);
  },

  updateReportTemplate: async (id, templateData) => {
    const res = await fetch(`${API_BASE_URL}/report-templates/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(templateData),
    });
    return handleResponse(res);
  },

  deleteReportTemplate: async (id) => {
    const res = await fetch(`${API_BASE_URL}/report-templates/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // --- Authentication ---
  register: async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  login: async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  logout: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    return handleResponse(res);
  },

  getCurrentUser: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    return handleResponse(res);
  },

  forgotPassword: async (email) => {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(res);
  },

  resetPassword: async (token, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    return handleResponse(res);
  },

  updateProfile: async (data) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // --- License ---
  getCurrentLicense: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/licenses/current`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    return handleResponse(res);
  },

  getLicenseStatus: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/licenses/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    return handleResponse(res);
  },

  validateLicense: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/licenses/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    return handleResponse(res);
  },

  // --- Admin ---
  getAdminUsers: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    return handleResponse(res);
  },

  createAdminUser: async (userData) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  updateAdminUser: async (userId, userData) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  getEmailLogs: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/email-logs`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  deleteAdminUser: async (userId) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    return handleResponse(res);
  },

  sendUserCredentials: async (userId, password) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/send-credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ password }),
    });
    return handleResponse(res);
  },

  getAdminLicenses: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/admin/licenses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    return handleResponse(res);
  },

  updateAdminLicense: async (licenseId, licenseData) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/admin/licenses/${licenseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(licenseData),
    });
    return handleResponse(res);
  },

  getAdminStatistics: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/admin/statistics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    return handleResponse(res);
  },

  getAdminPayments: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/admin/payments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    return handleResponse(res);
  },

  createRefund: async (paymentId, amount, reason) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/admin/refunds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ payment_id: paymentId, amount, reason })
    });
    return handleResponse(res);
  },

  getAdminSystemSettings: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/admin/system-settings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    return handleResponse(res);
  },

  // --- Payments (Stripe) ---
  createCheckoutSession: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/payments/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    return handleResponse(res);
  },

  getPaymentHistory: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/payments/history`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    return handleResponse(res);
  },

  cancelSubscription: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/payments/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    return handleResponse(res);
  },

  resumeSubscription: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/payments/resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    return handleResponse(res);
  },

  getCurrentSubscription: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/payments/subscription`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    return handleResponse(res);
  },
};