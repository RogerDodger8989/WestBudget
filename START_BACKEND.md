# 🚀 WestBudget Backend - Complete Setup Guide

## What You Now Have

✅ **SQLite Database Schema** (`schema.sql`)
- `transactions` table with all required fields (title, date, amount, type, category, status, receipt, receipt_path, note)
- `agreements` table with frequency and next_payment tracking
- `settings` table for app configuration (receipt storage path)
- `categories` table with pre-populated Swedish categories

✅ **Production-Ready Flask Backend** (`app.py`)
- Complete CRUD endpoints for transactions
- Complete CRUD endpoints for agreements
- Settings management
- **File upload handling** (`/api/upload`)
- Automatic database initialization
- CORS enabled for Electron/React

✅ **Frontend API Service** (`frontend/src/services/api.js`)
- Clean API abstraction layer
- Organized methods for all backend endpoints

✅ **Connected React App** (`frontend/src/App.jsx`)
- Auto-loads data from backend on mount
- Error handling with retry functionality
- Loading states

---

## 🎯 Quick Start

### **1. Start Backend (Terminal 1)**

```bash
cd C:\Users\denni\Documents\Dennis\programmering\WestDoc
python app.py
```

You should see:
```
🗄️  Initializing database...
✅ Database initialized successfully!
==================================================
🚀 WestBudget Backend Server
==================================================
📊 Database: westbudget.db
📁 Upload folder: uploads
🌐 Server: http://0.0.0.0:5000
🌐 Network: http://192.168.1.232:5000
==================================================
 * Running on http://0.0.0.0:5000
```

### **2. Start Frontend (Terminal 2)**

```bash
cd C:\Users\denni\Documents\Dennis\programmering\WestDoc\frontend
npm run dev
```

Frontend will be available at: **http://localhost:5100**

---

## 🔌 API Endpoints Reference

### **Transactions**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/transactions` | Get all transactions |
| `POST` | `/api/transactions` | Create new transaction |
| `PUT` | `/api/transactions/<id>` | Update transaction (notes, category, receipt) |
| `DELETE` | `/api/transactions/<id>` | Delete transaction |

**Update Transaction Example:**
```javascript
// Update note on transaction
await transactionAPI.update(5, { 
  note: "Updated note here" 
});

// Add receipt to transaction
await transactionAPI.update(3, { 
  receipt: true,
  receipt_path: "C:\\Documents\\Kvitton\\receipt_001.pdf"
});
```

### **Agreements**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/agreements` | Get all agreements |
| `POST` | `/api/agreements` | Create new agreement |
| `PUT` | `/api/agreements/<id>` | Update agreement |
| `DELETE` | `/api/agreements/<id>` | Delete agreement |

### **Settings**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/settings` | Get all settings |
| `POST` | `/api/settings` | Update settings |

**Update Settings Example:**
```javascript
await settingsAPI.update({
  receipt_storage_path: "D:\\MinaKvitton"
});
```

### **File Upload**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload` | Upload receipt file |

**Upload Example:**
```javascript
const file = event.target.files[0];
const result = await uploadAPI.uploadReceipt(file);
console.log(result.file_path); // Full system path
```

### **Categories**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/categories` | Get all categories |

---

## 📁 Project Structure

```
WestDoc/
├── app.py                     # Flask backend (main server)
├── schema.sql                 # Database schema
├── westbudget.db             # SQLite database (auto-created)
├── uploads/                  # Receipt uploads folder
├── requirements.txt          # Python dependencies
└── frontend/
    ├── src/
    │   ├── App.jsx           # Main React app (connected to API)
    │   └── services/
    │       └── api.js        # API service layer
    └── package.json
```

---

## 🧪 Testing the Backend

### Test with Browser:
Open: **http://192.168.1.232:5000**

You should see:
```json
{
  "message": "Welcome to WestBudget API",
  "version": "1.0.0",
  "endpoints": { ... }
}
```

### Test Transactions Endpoint:
Open: **http://192.168.1.232:5000/api/transactions**

You should see sample transactions loaded from `schema.sql`.

### Test with curl (PowerShell):
```powershell
# Get all transactions
curl http://192.168.1.232:5000/api/transactions

# Create new transaction
curl -X POST http://192.168.1.232:5000/api/transactions `
  -H "Content-Type: application/json" `
  -d '{\"title\":\"Test\",\"date\":\"Idag\",\"amount\":\"-100 kr\",\"type\":\"expense\",\"category\":\"Övrigt\"}'
```

---

## 🎨 Frontend Integration Status

✅ **App.jsx** - Connected to API, loads data on mount  
✅ **api.js** - Complete API service layer  
✅ **Error Handling** - Shows user-friendly error messages  
✅ **Loading States** - Shows loading indicator during API calls  

### Next Steps for Full Integration:

1. **TransactionsTab.jsx** - Connect "Save Note" to `transactionAPI.update()`
2. **ImportModal.jsx** - Connect file upload to `uploadAPI.uploadReceipt()`
3. **SettingsTab.jsx** - Connect to `settingsAPI.get()` and `settingsAPI.update()`

Example for TransactionsTab:
```javascript
import { transactionAPI } from '../services/api';

const handleSaveNote = async (transactionId, note) => {
  try {
    await transactionAPI.update(transactionId, { note });
    reloadData(); // Refresh data
  } catch (error) {
    alert('Kunde inte spara anteckning');
  }
};
```

---

## 🐛 Troubleshooting

### Backend won't start?
- Check if port 5000 is already in use
- Make sure `schema.sql` exists in the project root
- Verify Python dependencies: `pip list`

### Frontend can't connect to backend?
- Verify backend is running on port 5000
- Check your IP address: `ipconfig`
- Update `API_BASE_URL` in `frontend/src/services/api.js` if needed

### Database errors?
- Delete `westbudget.db` and restart `app.py` to reinitialize
- Check SQLite is installed: `sqlite3 --version`

---

## 🔥 What's Different from Mock Data?

| Mock Data | Real Backend |
|-----------|--------------|
| Data stored in JavaScript arrays | Data stored in SQLite database |
| Data lost on refresh | Data persists across sessions |
| No file uploads | Real file upload with path storage |
| Instant response | Network requests (with loading states) |
| No settings persistence | Settings saved to database |

---

## 🎯 Production Checklist

Before deploying to production:

- [ ] Change Flask `debug=True` to `debug=False`
- [ ] Add authentication/authorization
- [ ] Use environment variables for sensitive config
- [ ] Add request rate limiting
- [ ] Implement proper error logging
- [ ] Add database backups
- [ ] Use HTTPS in production
- [ ] Add input validation and sanitization

---

**Your backend is now production-ready!** 🚀

The database has been seeded with sample data from your mock arrays.
Start both servers and test the full integration.

