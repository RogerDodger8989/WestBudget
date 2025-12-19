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

-- Loans table
CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    lender TEXT NOT NULL,
    principal_amount REAL NOT NULL,
    current_balance REAL NOT NULL,
    interest_rate REAL NOT NULL, -- Annual interest rate in %
    monthly_payment REAL NOT NULL, -- Total monthly payment (amortization + interest)
    amortization_amount REAL NOT NULL, -- Monthly amortization
    interest_amount REAL NOT NULL, -- Monthly interest
    start_date TEXT NOT NULL,
    end_date TEXT, -- Optional: if fixed term loan
    status TEXT NOT NULL DEFAULT 'Aktiv' CHECK(status IN ('Aktiv', 'Avslutat', 'Pausad')),
    category TEXT DEFAULT 'Bolån',
    note TEXT DEFAULT '',
    agreement_id INTEGER, -- Link to agreements table
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agreement_id) REFERENCES agreements(id) ON DELETE SET NULL
);

-- Loan payments table
CREATE TABLE IF NOT EXISTS loan_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER NOT NULL,
    transaction_id INTEGER, -- Link to transactions table
    payment_date TEXT NOT NULL,
    amount REAL NOT NULL, -- Total payment amount
    principal_paid REAL NOT NULL, -- Amortization portion
    interest_paid REAL NOT NULL, -- Interest portion
    extra_payment REAL DEFAULT 0, -- Extra amortization (optional)
    note TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
);

-- Loan interest periods table (for variable interest rates)
CREATE TABLE IF NOT EXISTS loan_interest_periods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT, -- NULL means current period
    interest_rate REAL NOT NULL, -- Interest rate for this period
    note TEXT DEFAULT '', -- Reason for change (e.g., "Räntesänkning", "Kampanj")
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
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
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_agreement_id ON loans(agreement_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_loan_id ON loan_payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_transaction_id ON loan_payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_date ON loan_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_loan_interest_periods_loan_id ON loan_interest_periods(loan_id);

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

-- Savings Goals table (Sparmål)
CREATE TABLE IF NOT EXISTS savings_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    target_amount REAL NOT NULL,
    current_amount REAL DEFAULT 0,
    deadline TEXT,
    category TEXT,
    status TEXT DEFAULT 'Aktiv' CHECK(status IN ('Aktiv', 'Pausad', 'Uppnådd', 'Avbruten')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Savings Accounts table (Spar-konton)
CREATE TABLE IF NOT EXISTS savings_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    balance REAL DEFAULT 0,
    description TEXT,
    category TEXT,
    status TEXT DEFAULT 'Aktiv' CHECK(status IN ('Aktiv', 'Pausad', 'Stängd')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Savings Transactions table (Kopplar transaktioner till sparande)
CREATE TABLE IF NOT EXISTS savings_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER,
    goal_id INTEGER,
    account_id INTEGER,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('deposit', 'withdrawal', 'transfer')),
    date TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (goal_id) REFERENCES savings_goals(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES savings_accounts(id) ON DELETE CASCADE
);

-- Indexes for savings
CREATE INDEX IF NOT EXISTS idx_savings_goals_status ON savings_goals(status);
CREATE INDEX IF NOT EXISTS idx_savings_accounts_status ON savings_accounts(status);
CREATE INDEX IF NOT EXISTS idx_savings_transactions_goal_id ON savings_transactions(goal_id);
CREATE INDEX IF NOT EXISTS idx_savings_transactions_account_id ON savings_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_savings_transactions_transaction_id ON savings_transactions(transaction_id);

