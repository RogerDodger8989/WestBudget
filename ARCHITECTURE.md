# 🏗️ WestBudget Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     ELECTRON / REACT FRONTEND                    │
│                     (http://localhost:5100)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────┐      ┌──────────────────┐                       │
│  │  App.jsx   │◄─────│  DashboardLayout │                       │
│  │            │      │                  │                       │
│  │ • useState │      │ ┌──────────────┐ │                       │
│  │ • useEffect│◄─────┤ │ OverviewTab  │ │                       │
│  │ • loadData │      │ ├──────────────┤ │                       │
│  └──────┬─────┘      │ │TransactionsTab│ │                       │
│         │            │ ├──────────────┤ │                       │
│         │            │ │ AgreementsTab│ │                       │
│         │            │ ├──────────────┤ │                       │
│         │            │ │  VehiclesTab │ │                       │
│         │            │ ├──────────────┤ │                       │
│         │            │ │  ReportsTab  │ │                       │
│         │            │ ├──────────────┤ │                       │
│         │            │ │ SettingsTab  │ │                       │
│         │            │ └──────────────┘ │                       │
│         │            └──────────────────┘                       │
│         │                                                        │
│         ▼                                                        │
│  ┌────────────────────────────────────────────┐                 │
│  │          services/api.js                   │                 │
│  │                                            │                 │
│  │  • transactionAPI.getAll()                 │                 │
│  │  • transactionAPI.update(id, data)         │                 │
│  │  • agreementAPI.getAll()                   │                 │
│  │  • settingsAPI.get/update()                │                 │
│  │  • uploadAPI.uploadReceipt(file)           │                 │
│  │  • categoriesAPI.getAll()                  │                 │
│  └────────────────┬───────────────────────────┘                 │
│                   │                                             │
└───────────────────┼─────────────────────────────────────────────┘
                    │
                    │ HTTP / fetch()
                    │ CORS Enabled
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FLASK BACKEND API                           │
│                  (http://192.168.1.232:5000)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  app.py                                                          │
│  ┌───────────────────────────────────────────────────────┐      │
│  │  API ROUTES                                           │      │
│  │                                                       │      │
│  │  GET    /api/transactions          ──┐               │      │
│  │  POST   /api/transactions            │               │      │
│  │  PUT    /api/transactions/<id>       │               │      │
│  │  DELETE /api/transactions/<id>       │               │      │
│  │                                      │               │      │
│  │  GET    /api/agreements              │               │      │
│  │  POST   /api/agreements              ├───► get_db()  │      │
│  │  PUT    /api/agreements/<id>         │      │        │      │
│  │  DELETE /api/agreements/<id>         │      │        │      │
│  │                                      │      │        │      │
│  │  GET    /api/settings                │      │        │      │
│  │  POST   /api/settings                │      │        │      │
│  │                                      │      │        │      │
│  │  POST   /api/upload                  │      │        │      │
│  │  GET    /api/categories            ──┘      │        │      │
│  └─────────────────────────────────────────────┼────────┘      │
│                                                │                │
│  ┌─────────────────────────────────────────────▼─────────┐      │
│  │  Database Functions                                   │      │
│  │  • init_db() ─► Creates DB from schema.sql           │      │
│  │  • get_db()  ─► Returns SQLite connection            │      │
│  └───────────────────────────────┬───────────────────────┘      │
│                                  │                              │
└──────────────────────────────────┼──────────────────────────────┘
                                   │
                                   │ sqlite3
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SQLite DATABASE                             │
│                      westbudget.db                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  transactions   │  │   agreements    │  │   settings      │ │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤ │
│  │ • id            │  │ • id            │  │ • id            │ │
│  │ • title         │  │ • name          │  │ • key           │ │
│  │ • date          │  │ • provider      │  │ • value         │ │
│  │ • amount        │  │ • cost          │  │ • updated_at    │ │
│  │ • type          │  │ • frequency     │  └─────────────────┘ │
│  │ • category      │  │ • next_payment  │                      │
│  │ • status        │  │ • status        │  ┌─────────────────┐ │
│  │ • receipt       │  │ • category      │  │   categories    │ │
│  │ • receipt_path  │  │ • icon          │  ├─────────────────┤ │
│  │ • note          │  │ • notice        │  │ • id            │ │
│  │ • created_at    │  │ • created_at    │  │ • name          │ │
│  │ • updated_at    │  │ • updated_at    │  │ • created_at    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Examples

### 📝 **1. Loading Transactions on App Start**

```javascript
// 1. User opens app → App.jsx useEffect triggers
useEffect(() => {
  loadData();
}, []);

// 2. loadData() calls API service
const loadData = async () => {
  const transData = await transactionAPI.getAll();  // ─┐
  setTransactions(transData);                       //  │
};                                                   //  │
                                                     //  │
// 3. API service makes HTTP request                //  │
export const transactionAPI = {                     //  │
  getAll: () => apiRequest('/transactions'),  // ◄───┘
};

// 4. Flask receives GET /api/transactions
@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    conn = get_db()  // ─► Open SQLite connection
    cursor.execute('SELECT * FROM transactions')
    return jsonify(transactions)

// 5. Data flows back to React
Frontend ◄── JSON ◄── Flask ◄── SQLite
```

---

### ✏️ **2. Updating Transaction Note**

```javascript
// 1. User types note in NoteModal → clicks Save
const handleSaveNote = async () => {
  await transactionAPI.update(transactionId, { note: newNote }); // ─┐
};                                                                 //  │
                                                                   //  │
// 2. API service sends PUT request                               //  │
export const transactionAPI = {                                   //  │
  update: (id, updates) =>                                        //  │
    apiRequest(`/transactions/${id}`, {                           //  │
      method: 'PUT',                                              //  │
      body: JSON.stringify(updates),  // ◄────────────────────────┘
    }),
};

// 3. Flask processes PUT /api/transactions/5
@app.route('/api/transactions/<int:transaction_id>', methods=['PUT'])
def update_transaction(transaction_id):
    data = request.get_json()  // { note: "New note here" }
    
    cursor.execute(
      "UPDATE transactions SET note = ? WHERE id = ?",
      (data['note'], transaction_id)
    )
    
    conn.commit()  // ─► Persist to SQLite
    return jsonify(updated_transaction)

// 4. Frontend receives updated transaction
Frontend.setState(updatedTransaction) ◄── JSON ◄── Flask
```

---

### 📤 **3. Uploading Receipt File**

```javascript
// 1. User selects file in ImportModal
const handleFileSelect = async (file) => {
  const result = await uploadAPI.uploadReceipt(file); // ─┐
  console.log(result.file_path);  // Full system path    │
};                                                        │
                                                          │
// 2. API creates FormData and sends POST                │
export const uploadAPI = {                                │
  uploadReceipt: async (file) => {                        │
    const formData = new FormData();                      │
    formData.append('file', file);  // ◄──────────────────┘
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,  // multipart/form-data
    });
    return response.json();
  },
};

// 3. Flask receives file
@app.route('/api/upload', methods=['POST'])
def upload_file():
    file = request.files['file']
    
    # Get storage path from settings
    cursor.execute("SELECT value FROM settings WHERE key = 'receipt_storage_path'")
    storage_path = cursor.fetchone()['value']
    
    # Save file
    filename = f"{timestamp}_{secure_filename(file.filename)}"
    file_path = os.path.join(storage_path, filename)
    file.save(file_path)  // ─► Save to disk
    
    return jsonify({
      'file_path': file_path,  // ─► Return path to frontend
      'filename': filename
    })

// 4. Frontend updates transaction with receipt path
await transactionAPI.update(transactionId, {
  receipt: true,
  receipt_path: result.file_path
});
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React + Vite | UI Components & State Management |
| **Styling** | Tailwind CSS | Utility-first styling system |
| **Icons** | Lucide React | Icon library |
| **Runtime** | Electron (planned) | Desktop application wrapper |
| **Backend** | Flask 3.0 | RESTful API server |
| **Database** | SQLite 3 | Embedded SQL database |
| **File Handling** | Werkzeug | Secure file uploads |
| **CORS** | Flask-CORS | Cross-origin requests |

---

## Key Features Implemented

✅ **Full CRUD Operations** - Create, Read, Update, Delete for all entities  
✅ **File Upload System** - Secure receipt file uploads with path storage  
✅ **Settings Persistence** - User preferences saved to database  
✅ **Error Handling** - Graceful error messages in UI  
✅ **Loading States** - Visual feedback during API calls  
✅ **Database Seeding** - Sample data for development  
✅ **CORS Support** - Allows Electron/React to communicate with Flask  
✅ **Swedish UI** - All user-facing text in Swedish  

---

## Security Considerations

🔒 **Current Implementation** (Development)
- No authentication (anyone can access)
- Debug mode enabled
- Simple file validation

🔐 **Production Recommendations**
- Add JWT/session-based authentication
- Implement role-based access control
- Add request rate limiting
- Use HTTPS/TLS encryption
- Validate and sanitize all inputs
- Implement CSRF protection
- Add audit logging
- Store sensitive config in environment variables

---

**This architecture allows for:**
- Easy testing (frontend and backend can run independently)
- Scalability (can replace SQLite with PostgreSQL later)
- Maintainability (clear separation of concerns)
- Flexibility (can add more endpoints without touching frontend)

