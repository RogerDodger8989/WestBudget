-- WestBudget Database Schema
-- SQLite database for finance management application

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    amount TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Väntar' CHECK(status IN ('Bokförd', 'Väntar', 'Granskas')),
    receipt BOOLEAN NOT NULL DEFAULT 0,
    receipt_path TEXT,
    note TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agreements table
CREATE TABLE IF NOT EXISTS agreements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    cost REAL NOT NULL,
    frequency TEXT NOT NULL CHECK(frequency IN ('Månadsvis', 'Kvartalsvis', 'Årligen')),
    next_payment TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Aktiv' CHECK(status IN ('Aktiv', 'Uppsagd', 'Väntar på motpart')),
    category TEXT NOT NULL,
    icon TEXT DEFAULT '📄',
    notice TEXT DEFAULT '',
    images TEXT DEFAULT '[]',
    start_date TEXT,
    end_date TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Category rules table for auto-categorization
CREATE TABLE IF NOT EXISTS category_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description_pattern TEXT NOT NULL,
    category TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registration_number TEXT UNIQUE NOT NULL,
    make_model TEXT NOT NULL,
    odometer INTEGER DEFAULT 0,
    next_inspection TEXT,
    insurance_company TEXT,
    insurance_type TEXT,
    status TEXT NOT NULL DEFAULT 'Aktiv' CHECK(status IN ('Aktiv', 'Inaktiv', 'Såld')),
    category TEXT DEFAULT 'Personbil',
    note TEXT DEFAULT '',
    images TEXT DEFAULT '[]',
    agreement_id INTEGER, -- Link to agreements table for insurance
    next_service_odometer INTEGER, -- Next service at this odometer reading
    next_service_date TEXT, -- Next service date
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agreement_id) REFERENCES agreements(id)
);

-- Vehicle expenses table
CREATE TABLE IF NOT EXISTS vehicle_expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    description TEXT DEFAULT '',
    receipt_path TEXT,
    note TEXT DEFAULT '',
    odometer_at_purchase INTEGER, -- Odometer reading when expense was made
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_agreements_status ON agreements(status);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_registration ON vehicles(registration_number);
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_vehicle_id ON vehicle_expenses(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_category ON vehicle_expenses(category);
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_date ON vehicle_expenses(date);

-- Insert default categories
INSERT OR IGNORE INTO categories (name) VALUES 
    ('Nöje & Kultur'),
    ('IT & Programvara'),
    ('Inventarier'),
    ('Resor'),
    ('Kontorsmaterial'),
    ('Försäljning Tjänst'),
    ('Drivmedel'),
    ('Underhåll'),
    ('Försäkring'),
    ('Övrigt'),
    ('Representation');

-- Insert default settings
INSERT OR IGNORE INTO settings (key, value) VALUES 
    ('receipt_storage_path', 'C:\Users\Documents\Kvitton');

-- Seed sample transactions (optional - for development)
INSERT OR IGNORE INTO transactions (id, title, date, amount, type, category, status, receipt, note) VALUES 
    (1, 'Spotify Premium', 'Idag, 10:42', '-119 kr', 'expense', 'Nöje & Kultur', 'Bokförd', 0, ''),
    (2, 'Inbetalning Faktura #402', 'Igår, 15:30', '+12,500 kr', 'income', 'Försäljning Tjänst', 'Bokförd', 1, 'Projekt X slutfakturering'),
    (3, 'AWS Cloud Services', '15 Dec, 09:00', '-450 kr', 'expense', 'IT & Programvara', 'Väntar', 0, '');

-- Seed sample agreements (optional - for development)
INSERT OR IGNORE INTO agreements (id, name, provider, cost, frequency, next_payment, status, category, icon, notice) VALUES 
    (1, 'SBAB Bolån', 'SBAB', 8400, 'Månadsvis', '2024-12-28', 'Aktiv', 'Boende & Lån', '🏠', '3 mån rörlig'),
    (2, 'If Bilförsäkring', 'If Skadeförsäkring', 549, 'Månadsvis', '2024-12-28', 'Aktiv', 'Försäkring', '🚗', 'Förnyas 2025-04-01'),
    (3, 'Spotify Premium', 'Spotify', 119, 'Månadsvis', '2024-12-20', 'Aktiv', 'Nöje', '🎵', '');

