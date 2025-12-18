# ⚡ WestBudget - Quick Start Guide

## 🚀 Start in 60 Seconds

### **Step 1: Open TWO PowerShell terminals**

---

### **Terminal 1: Start Backend** 🐍

```powershell
cd C:\Users\denni\Documents\Dennis\programmering\WestDoc
python app.py
```

**Expected output:**
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
 * Serving Flask app 'app'
 * Debug mode: on
 * Running on http://0.0.0.0:5000
```

✅ **Backend is ready!**

---

### **Terminal 2: Start Frontend** ⚛️

```powershell
cd C:\Users\denni\Documents\Dennis\programmering\WestDoc\frontend
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5100/
  ➜  Network: http://192.168.1.232:5100/
  ➜  press h + enter to show help
```

✅ **Frontend is ready!**

---

## 🌐 Open in Browser

**Your app:** http://localhost:5100

**Backend API:** http://192.168.1.232:5000

---

## ✅ Verify Everything Works

### **1. Check Backend**
Open: http://192.168.1.232:5000

Should show:
```json
{
  "message": "Welcome to WestBudget API",
  "version": "1.0.0",
  "endpoints": { ... }
}
```

### **2. Check Transactions**
Open: http://192.168.1.232:5000/api/transactions

Should show your sample transactions from database!

### **3. Check Frontend**
Open: http://localhost:5100

Should see your WestBudget app loading data from the backend!

**Check browser console (F12):**
```
✅ Data loaded successfully from backend!
```

---

## 🎯 What You Should See

```
┌─────────────────────────────────────────────────────┐
│  Terminal 1 (Backend)        Terminal 2 (Frontend)  │
│  ─────────────────────────── ───────────────────── │
│  🐍 python app.py            ⚛️  npm run dev        │
│                                                      │
│  Running on port 5000        Running on port 5100   │
│  Database: westbudget.db     Connecting to API...   │
│  ✅ Server ready!            ✅ Frontend ready!     │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │   Browser     │
              │ localhost:5100│
              └───────────────┘
              Your WestBudget app
              with REAL data! 🎉
```

---

## 🔥 Test Real Database Persistence

1. Open app: http://localhost:5100
2. **Look at transactions** - they're loaded from the database!
3. **Refresh the page** (F5)
4. Transactions are still there! ✅

**This is the difference from mock data:**
- ❌ Mock data: Lost on refresh
- ✅ Real database: Persists forever!

---

## 📊 Database Location

Your data is stored in:
```
C:\Users\denni\Documents\Dennis\programmering\WestDoc\westbudget.db
```

You can open this with any SQLite browser to see your data!

---

## 🛑 How to Stop

**Stop Backend:** Press `CTRL + C` in Terminal 1

**Stop Frontend:** Press `CTRL + C` in Terminal 2

---

## 🐛 Something Wrong?

### **Backend won't start?**
```powershell
# Check if Python is installed
python --version

# Install dependencies
pip install -r requirements.txt

# Try again
python app.py
```

### **Frontend won't start?**
```powershell
# Check if Node is installed
node --version

# Install dependencies
cd frontend
npm install

# Try again
npm run dev
```

### **Can't connect to API?**
- Make sure backend is running on port 5000
- Check `frontend/src/services/api.js` has correct URL
- Look for CORS errors in browser console

---

## 📚 More Help

- **Complete setup:** See `START_BACKEND.md`
- **API reference:** See `BACKEND_COMPLETE.md`
- **Architecture:** See `ARCHITECTURE.md`
- **Summary:** See `IMPLEMENTATION_SUMMARY.md`

---

## 🎉 You're All Set!

Both servers should be running, and your app should be loading **real data from the database**!

Next: Connect your UI components to save data (notes, uploads, etc.)

**Happy coding!** 🚀

