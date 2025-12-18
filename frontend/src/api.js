const API_BASE_URL = 'http://192.168.1.232:5000/api';

// Helper för felhantering
async function handleResponse(res) {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Serverfel' }));
    throw new Error(error.error || `HTTP error! status: ${res.status}`);
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
  uploadReceipt: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/upload`, {
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
};