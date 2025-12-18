// API Service Layer for WestBudget
// Handles all HTTP requests to Flask backend

const API_BASE_URL = 'http://192.168.1.232:5000/api';

// Helper function for handling API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };
  
  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// ============================================================================
// TRANSACTION API
// ============================================================================

export const transactionAPI = {
  // Get all transactions
  getAll: () => apiRequest('/transactions'),
  
  // Get single transaction
  getById: (id) => apiRequest(`/transactions/${id}`),
  
  // Create new transaction
  create: (transaction) => apiRequest('/transactions', {
    method: 'POST',
    body: JSON.stringify(transaction),
  }),
  
  // Update transaction (CRUCIAL for notes, category, receipt_path)
  update: (id, updates) => apiRequest(`/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  
  // Delete transaction
  delete: (id) => apiRequest(`/transactions/${id}`, {
    method: 'DELETE',
  }),
};

// ============================================================================
// AGREEMENT API
// ============================================================================

export const agreementAPI = {
  // Get all agreements
  getAll: () => apiRequest('/agreements'),
  
  // Get single agreement
  getById: (id) => apiRequest(`/agreements/${id}`),
  
  // Create new agreement
  create: (agreement) => apiRequest('/agreements', {
    method: 'POST',
    body: JSON.stringify(agreement),
  }),
  
  // Update agreement
  update: (id, updates) => apiRequest(`/agreements/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  
  // Delete agreement
  delete: (id) => apiRequest(`/agreements/${id}`, {
    method: 'DELETE',
  }),
};

// ============================================================================
// SETTINGS API
// ============================================================================

export const settingsAPI = {
  // Get all settings
  get: () => apiRequest('/settings'),
  
  // Update settings
  update: (settings) => apiRequest('/settings', {
    method: 'POST',
    body: JSON.stringify(settings),
  }),
};

// ============================================================================
// FILE UPLOAD API
// ============================================================================

export const uploadAPI = {
  // Upload a receipt file
  uploadReceipt: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },
};

// ============================================================================
// CATEGORIES API
// ============================================================================

export const categoriesAPI = {
  // Get all categories
  getAll: () => apiRequest('/categories'),
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  transactions: transactionAPI,
  agreements: agreementAPI,
  settings: settingsAPI,
  upload: uploadAPI,
  categories: categoriesAPI,
};
