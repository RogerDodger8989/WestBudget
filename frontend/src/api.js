const API_BASE_URL = 'http://192.168.1.232:5000/api';

// Helper för felhantering
async function handleResponse(res) {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Serverfel' }));
    // Use message if available, otherwise use error field
    const errorMessage = error.message || error.error || `HTTP error! status: ${res.status}`;
    const errorObj = new Error(errorMessage);
    errorObj.originalError = error; // Store original error object for more details
    throw errorObj;
  }
  return res.json();
}

export const api = {
  // --- Transaktioner ---
  getTransactions: async () => {
    const res = await fetch(`${API_BASE_URL}/transactions`);
    return handleResponse(res);
  },
  
  createTransaction: async (data) => {
    const res = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateTransaction: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  deleteTransaction: async (id) => {
    const res = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: 'DELETE',
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
    const res = await fetch(`${API_BASE_URL}/agreements`);
    return handleResponse(res);
  },

  createAgreement: async (data) => {
    const res = await fetch(`${API_BASE_URL}/agreements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateAgreement: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/agreements/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  deleteAgreement: async (id) => {
    const res = await fetch(`${API_BASE_URL}/agreements/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  uploadAgreementImage: async (agreementId, file) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/agreements/${agreementId}/upload-image`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(res);
  },

  // --- Kategorier ---
  getCategories: async () => {
    const res = await fetch(`${API_BASE_URL}/categories`);
    return handleResponse(res);
  },
  
  getCategoriesWithIds: async () => {
    const res = await fetch(`${API_BASE_URL}/categories/with-ids`);
    return handleResponse(res);
  },
  
  createCategory: async (name) => {
    const res = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    return handleResponse(res);
  },
  
  updateCategory: async (id, name) => {
    const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    return handleResponse(res);
  },
  
  deleteCategory: async (id) => {
    const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },
  
  mergeCategories: async (sourceId, targetId, newName) => {
    const res = await fetch(`${API_BASE_URL}/categories/merge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_id: sourceId, target_id: targetId, new_name: newName }),
    });
    return handleResponse(res);
  },

  // --- Inställningar ---
  getSettings: async () => {
    const res = await fetch(`${API_BASE_URL}/settings`);
    return handleResponse(res);
  },
  
  saveSettings: async (settings) => {
    const res = await fetch(`${API_BASE_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return handleResponse(res);
  },

  // --- Category Rules ---
  getCategoryRules: async () => {
    const res = await fetch(`${API_BASE_URL}/category-rules`);
    return handleResponse(res);
  },

  createCategoryRule: async (data) => {
    const res = await fetch(`${API_BASE_URL}/category-rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateCategoryRule: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/category-rules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  deleteCategoryRule: async (id) => {
    const res = await fetch(`${API_BASE_URL}/category-rules/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  // --- Vehicles ---
  getVehicles: async () => {
    const res = await fetch(`${API_BASE_URL}/vehicles`);
    return handleResponse(res);
  },

  getVehicle: async (id) => {
    const res = await fetch(`${API_BASE_URL}/vehicles/${id}`);
    return handleResponse(res);
  },

  createVehicle: async (data) => {
    const res = await fetch(`${API_BASE_URL}/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateVehicle: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  deleteVehicle: async (id) => {
    const res = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  uploadVehicleImage: async (vehicleId, file) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}/upload-image`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(res);
  },

  // --- Vehicle Expenses ---
  getVehicleExpenses: async (vehicleId = null) => {
    const url = vehicleId 
      ? `${API_BASE_URL}/vehicle-expenses?vehicle_id=${vehicleId}`
      : `${API_BASE_URL}/vehicle-expenses`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  getVehicleExpense: async (id) => {
    const res = await fetch(`${API_BASE_URL}/vehicle-expenses/${id}`);
    return handleResponse(res);
  },

  createVehicleExpense: async (data) => {
    const res = await fetch(`${API_BASE_URL}/vehicle-expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateVehicleExpense: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/vehicle-expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  deleteVehicleExpense: async (id) => {
    const res = await fetch(`${API_BASE_URL}/vehicle-expenses/${id}`, {
      method: 'DELETE',
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
    const res = await fetch(`${API_BASE_URL}/savings/goals`);
    return handleResponse(res);
  },

  createSavingsGoal: async (data) => {
    const res = await fetch(`${API_BASE_URL}/savings/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateSavingsGoal: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/savings/goals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  deleteSavingsGoal: async (id) => {
    const res = await fetch(`${API_BASE_URL}/savings/goals/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  // --- Savings Accounts ---
  getSavingsAccounts: async () => {
    const res = await fetch(`${API_BASE_URL}/savings/accounts`);
    return handleResponse(res);
  },

  createSavingsAccount: async (data) => {
    const res = await fetch(`${API_BASE_URL}/savings/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateSavingsAccount: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/savings/accounts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  deleteSavingsAccount: async (id) => {
    const res = await fetch(`${API_BASE_URL}/savings/accounts/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  // --- Savings Transactions ---
  transferSavings: async (data) => {
    const res = await fetch(`${API_BASE_URL}/savings/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  linkTransactionToSavings: async (data) => {
    const res = await fetch(`${API_BASE_URL}/savings/link-transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  getSavingsTransactions: async (accountId = null, goalId = null) => {
    const params = new URLSearchParams();
    if (accountId) params.append('account_id', accountId);
    if (goalId) params.append('goal_id', goalId);
    const query = params.toString();
    const res = await fetch(`${API_BASE_URL}/savings/transactions${query ? `?${query}` : ''}`);
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
    const res = await fetch(`${API_BASE_URL}/loans`);
    return handleResponse(res);
  },

  createLoan: async (data) => {
    const res = await fetch(`${API_BASE_URL}/loans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateLoan: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/loans/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  deleteLoan: async (id) => {
    const res = await fetch(`${API_BASE_URL}/loans/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  getLoanPayments: async (loanId) => {
    const res = await fetch(`${API_BASE_URL}/loans/${loanId}/payments`);
    return handleResponse(res);
  },

  createLoanPayment: async (loanId, data) => {
    const res = await fetch(`${API_BASE_URL}/loans/${loanId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  getLoanInterestPeriods: async (loanId) => {
    const res = await fetch(`${API_BASE_URL}/loans/${loanId}/interest-periods`);
    return handleResponse(res);
  },

  createLoanInterestPeriod: async (loanId, data) => {
    const res = await fetch(`${API_BASE_URL}/loans/${loanId}/interest-periods`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  getAmortizationPlan: async (loanId) => {
    const res = await fetch(`${API_BASE_URL}/loans/${loanId}/amortization-plan`);
    return handleResponse(res);
  },

  linkTransactionToLoan: async (data) => {
    const res = await fetch(`${API_BASE_URL}/loans/link-transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
};