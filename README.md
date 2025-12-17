# WestBudget - Professionell Bokföring & Licenshantering

En fullständig ekonomiapplikation med React/Electron frontend och Flask backend med SQLite databas.

## Features

### Backend (Flask)
- RESTful API med Flask
- SQLite databas med SQLAlchemy ORM
- Transaktionshantering (CRUD)
- Avtal & Abonnemangshantering
- Kategorihantering
- Statistik & rapporter
- CORS-stöd för frontend-integration
- Felhantering och validering

### Frontend (React)
- Modern React-app med Vite
- Tailwind CSS för styling
- Dark mode support
- Interaktiv dashboard med flera vyer
- Transaktionsimport
- Noterings- och kategorisystem
- Responsiv design

## Project Structure

```
WestDoc/
├── backend/
│   ├── app.py                  # Flask huvudapplikation
│   ├── models.py               # Databasmodeller
│   ├── backend_routes.py       # API routes
│   ├── routes.py               # (Legacy routes)
│   ├── config.py               # Konfiguration
│   ├── requirements.txt        # Python dependencies
│   └── instance/               # SQLite databas (auto-skapad)
│
├── frontend/
│   ├── src/
│   │   ├── components/         # React komponenter
│   │   │   ├── tabs/          # Tab-komponenter
│   │   │   ├── DashboardLayout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Topbar.jsx
│   │   │   └── ...
│   │   ├── services/
│   │   │   └── api.js         # API service layer
│   │   ├── App.jsx            # Huvudkomponent
│   │   ├── main.jsx           # Entry point
│   │   └── index.css          # Global styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── README.md
└── .gitignore
```

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

## Installation

1. Clone the repository (or navigate to the project directory)

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   - macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Application

### Backend (Flask)

1. Navigera till backend-mappen:
```bash
cd WestDoc
```

2. Skapa och aktivera virtual environment:
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

3. Installera dependencies:
```bash
pip install -r requirements.txt
```

4. Starta Flask-servern:
```bash
python app.py
```

Backend körs nu på `http://localhost:5000`

### Frontend (React)

1. Öppna en ny terminal och navigera till frontend:
```bash
cd frontend
```

2. Installera dependencies:
```bash
npm install
```

3. Starta development server:
```bash
npm run dev
```

Frontend körs nu på `http://localhost:3000`

### Öppna applikationen

Gå till `http://localhost:3000` i din webbläsare för att använda applikationen.

## API Endpoints

### Transactions (Transaktioner)

- `GET /api/transactions` - Hämta alla transaktioner
- `GET /api/transactions/<id>` - Hämta specifik transaktion
- `POST /api/transactions` - Skapa ny transaktion
  ```json
  {
    "title": "Spotify Premium",
    "date": "2024-12-17",
    "amount": -119,
    "amount_display": "-119 kr",
    "type": "expense",
    "category": "Nöje & Kultur",
    "status": "Bokförd",
    "receipt": false,
    "note": ""
  }
  ```
- `POST /api/transactions/bulk` - Importera flera transaktioner
- `PUT /api/transactions/<id>` - Uppdatera transaktion
- `DELETE /api/transactions/<id>` - Ta bort transaktion
- `GET /api/transactions/category/<category>` - Hämta efter kategori

### Agreements (Avtal)

- `GET /api/agreements` - Hämta alla avtal
- `GET /api/agreements/<id>` - Hämta specifikt avtal
- `POST /api/agreements` - Skapa nytt avtal
  ```json
  {
    "name": "Spotify Premium",
    "provider": "Spotify",
    "cost": 119,
    "frequency": "Månadsvis",
    "next_payment": "2024-12-20",
    "category": "Nöje",
    "status": "Aktiv",
    "icon": "🎵",
    "notice": ""
  }
  ```
- `PUT /api/agreements/<id>` - Uppdatera avtal
- `DELETE /api/agreements/<id>` - Ta bort avtal

### Categories (Kategorier)

- `GET /api/categories` - Hämta alla kategorier
- `POST /api/categories` - Skapa ny kategori
- `DELETE /api/categories/<id>` - Ta bort kategori

### Statistics (Statistik)

- `GET /api/stats/overview` - Översiktsstatistik
- `GET /api/stats/categories` - Kategorifördelning

## Testing the API

### Using cURL

```bash
# Skapa en transaktion
curl -X POST http://localhost:5000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Spotify Premium",
    "date": "2024-12-17",
    "amount": -119,
    "amount_display": "-119 kr",
    "type": "expense",
    "category": "Nöje & Kultur",
    "status": "Bokförd",
    "receipt": false
  }'

# Hämta alla transaktioner
curl http://localhost:5000/api/transactions

# Hämta statistik
curl http://localhost:5000/api/stats/overview
```

### Using Postman or Thunder Client

Importera följande bas-URL:
```
http://localhost:5000/api
```

## Database

SQLite-databasen skapas automatiskt i `instance/`-mappen när du startar applikationen första gången. Databasen innehåller följande tabeller:

- **transactions**: Lagrar alla transaktioner (inkomster och utgifter)
- **agreements**: Lagrar avtal och abonnemang
- **categories**: Lagrar kategorier för organisering

Standardkategorier skapas automatiskt vid första körningen.

## Configuration

Configuration settings are in `config.py`. You can set the following environment variables:

- `FLASK_ENV`: Set to `development`, `production`, or `testing`
- `SECRET_KEY`: Secret key for Flask sessions
- `DATABASE_URL`: Custom database URL (optional)

## Development

To run in development mode with debug enabled:

```bash
python app.py
```

The application will automatically reload when you make changes to the code.

## Production Deployment

For production deployment:

1. Set environment variables:
```bash
export FLASK_ENV=production
export SECRET_KEY=your-secret-key-here
```

2. Use a production WSGI server like Gunicorn:
```bash
pip install gunicorn
gunicorn app:app
```

## Error Handling

The API includes error handling for common scenarios:
- 404: Resource not found
- 400: Bad request (missing required fields)
- 409: Conflict (duplicate username/email)
- 500: Internal server error

## License

This project is open source and available for use.

