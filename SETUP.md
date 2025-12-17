# WestBudget - Fullständig Installationsguide

## Översikt

Denna guide visar hur du sätter upp och kör WestBudget-applikationen, som består av:
- **Backend**: Flask API (Python) med SQLite databas
- **Frontend**: React-applikation med Vite

## Systemkrav

### Backend
- Python 3.8 eller högre
- pip (Python package manager)

### Frontend
- Node.js 16.x eller högre
- npm eller yarn

## Installation Steg-för-Steg

### 1. Klona eller Ladda ner Projektet

```bash
cd C:\Users\denni\Documents\Dennis\programmering\WestDoc
```

### 2. Backend Setup

#### 2.1 Skapa Virtual Environment

```bash
# Skapa virtual environment
python -m venv venv

# Aktivera virtual environment

# Windows PowerShell:
venv\Scripts\Activate.ps1

# Windows CMD:
venv\Scripts\activate.bat

# macOS/Linux:
source venv/bin/activate
```

#### 2.2 Installera Python Dependencies

```bash
pip install -r requirements.txt
```

#### 2.3 Starta Backend

```bash
python app.py
```

Backend ska nu köra på `http://localhost:5000`

**Verifiera att backend fungerar:**
```bash
# I en ny terminal
curl http://localhost:5000/health
```

### 3. Frontend Setup

#### 3.1 Navigera till Frontend

Öppna en **ny terminal** (låt backend-terminalen köra):

```bash
cd frontend
```

#### 3.2 Installera Node Dependencies

```bash
npm install
```

#### 3.3 Konfigurera Environment (Valfritt)

Kopiera `.env.example` till `.env` om du behöver ändra API-URL:

```bash
# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

Standardinställningar fungerar för lokal utveckling.

#### 3.4 Starta Frontend

```bash
npm run dev
```

Frontend ska nu köra på `http://localhost:3000`

### 4. Öppna Applikationen

Gå till `http://localhost:3000` i din webbläsare.

## Vanliga Problem & Lösningar

### Backend-problem

**Problem: "Module not found" fel**
```bash
# Lösning: Se till att virtual environment är aktiverat
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Installera om dependencies
pip install -r requirements.txt
```

**Problem: Port 5000 redan används**
```bash
# Lösning: Ändra port i app.py
# Ändra sista raden till:
app.run(host='0.0.0.0', port=5001, debug=True)
```

**Problem: CORS-fel**
```bash
# Lösning: Se till att Flask-CORS är installerat
pip install Flask-CORS==4.0.0
```

### Frontend-problem

**Problem: "Cannot find module" eller npm-fel**
```bash
# Lösning: Rensa cache och installera om
rm -rf node_modules package-lock.json  # macOS/Linux
rd /s /q node_modules & del package-lock.json  # Windows

npm install
```

**Problem: Port 3000 redan används**
```bash
# Lösning: Vite kommer automatiskt välja nästa lediga port
# Alternativt, ändra i vite.config.js:
export default defineConfig({
  server: {
    port: 3001
  }
})
```

**Problem: API-anrop fungerar inte**
```bash
# Lösning: Verifiera att backend körs
curl http://localhost:5000/health

# Kontrollera proxy-inställningar i vite.config.js
```

## Development Workflow

### Starta både Backend och Frontend

**Alternativ 1: Två Terminaler (Rekommenderat)**

Terminal 1 (Backend):
```bash
cd WestDoc
venv\Scripts\activate  # Windows
python app.py
```

Terminal 2 (Frontend):
```bash
cd WestDoc/frontend
npm run dev
```

**Alternativ 2: En Terminal med Background Process (macOS/Linux)**

```bash
# Starta backend i bakgrunden
cd WestDoc
source venv/bin/activate
python app.py &

# Starta frontend
cd frontend
npm run dev
```

### Hot Reloading

- **Backend**: Flask's debug mode reloader är aktiverad. Spara ändringar i Python-filer för att automatiskt ladda om.
- **Frontend**: Vite's HMR är aktiverad. Ändringar i React-komponenter uppdateras direkt i webbläsaren.

## Production Build

### Backend

För produktion, använd en WSGI-server som Gunicorn:

```bash
pip install gunicorn
export FLASK_ENV=production
export SECRET_KEY=ditt-säkra-nyckelvärde

gunicorn -w 4 -b 0.0.0.0:5000 app:create_app()
```

### Frontend

Bygg optimerad production-version:

```bash
cd frontend
npm run build
```

Built files finns i `frontend/dist/` mappen.

Serve med en static file server:

```bash
npm install -g serve
serve -s dist -p 3000
```

## Databas-hantering

### Återställ Databas

```bash
# Ta bort befintlig databas
rm instance/app.db  # macOS/Linux
del instance\app.db  # Windows

# Starta om backend för att skapa ny databas
python app.py
```

### Backup Databas

```bash
# Kopiera databas-filen
cp instance/app.db instance/app.db.backup  # macOS/Linux
copy instance\app.db instance\app.db.backup  # Windows
```

## Nästa Steg

- Läs [API-dokumentationen](README.md#api-endpoints) för att förstå tillgängliga endpoints
- Utforska frontend-komponenter i `frontend/src/components/`
- Anpassa styling i `frontend/tailwind.config.js`
- Lägg till nya features genom att uppdatera backend models och frontend components

## Support

Vid problem:
1. Kontrollera denna guide
2. Verifiera att alla dependencies är installerade
3. Granska console logs i både terminal och webbläsare
4. Se till att rätt portar används och inte blockeras av firewall

## Licens

Detta projekt är open source och tillgängligt för användning.

