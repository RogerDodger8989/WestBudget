// API Service Layer for WestBudget
// Handles all HTTP requests to Flask backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
      const error = await response.json();
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
  
  // Create multiple transactions (bulk import)
  createBulk: (transactions) => apiRequest('/transactions/bulk', {
    method: 'POST',
    body: JSON.stringify({ transactions }),
  }),
  
  // Update transaction
  update: (id, transaction) => apiRequest(`/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(transaction),
  }),
  
  // Delete transaction
  delete: (id) => apiRequest(`/transactions/${id}`, {
    method: 'DELETE',
  }),
  
  // Get transactions by category
  getByCategory: (category) => apiRequest(`/transactions/category/${encodeURIComponent(category)}`),
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
  update: (id, agreement) => apiRequest(`/agreements/${id}`, {
    method: 'PUT',
    body: JSON.stringify(agreement),
  }),
  
  // Delete agreement
  delete: (id) => apiRequest(`/agreements/${id}`, {
    method: 'DELETE',
  }),
};

// ============================================================================
// CATEGORY API
// ============================================================================

export const categoryAPI = {
  // Get all categories
  getAll: () => apiRequest('/categories'),
  
  // Create new category
  create: (name) => apiRequest('/categories', {
    method: 'POST',
    body: JSON.stringify({ name }),
  }),
  
  // Delete category
  delete: (id) => apiRequest(`/categories/${id}`, {
    method: 'DELETE',
  }),
};

// ============================================================================
// STATISTICS API
// ============================================================================

export const statsAPI = {
  // Get overview statistics
  getOverview: () => apiRequest('/stats/overview'),
  
  // Get category breakdown
  getCategoryStats: () => apiRequest('/stats/categories'),
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Helper to format amount for display
export function formatAmount(amount, type = 'expense') {
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('sv-SE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  const sign = type === 'income' ? '+' : '-';
  return `${sign}${formatted} kr`;
}

// Helper to parse amount from string (e.g., "-1,234 kr" -> -1234)
export function parseAmount(amountString) {
  const cleaned = amountString.replace(/[^\d,-]/g, '').replace(',', '');
  return parseFloat(cleaned);
}

// Convert transaction for API (from app format to backend format)
export function prepareTransactionForAPI(transaction) {
  const amountValue = typeof transaction.amount === 'string' 
    ? parseAmount(transaction.amount) 
    : transaction.amount;
  
  return {
    title: transaction.title,
    date: transaction.date,
    amount: amountValue,
    amount_display: transaction.amount,
    type: transaction.type,
    category: transaction.category,
    status: transaction.status || 'Väntar',
    receipt: transaction.receipt || false,
    note: transaction.note || '',
  };
}

export default {
  transactions: transactionAPI,
  agreements: agreementAPI,
  categories: categoryAPI,
  stats: statsAPI,
};

