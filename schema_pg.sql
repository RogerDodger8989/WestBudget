-- WestBudget Database Schema (PostgreSQL)

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK(role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Category Rules table
CREATE TABLE IF NOT EXISTS category_rules (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    keyword VARCHAR(255) NOT NULL,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_category_rules_category_id ON category_rules(category_id);

-- Agreements table
CREATE TABLE IF NOT EXISTS agreements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    cost DECIMAL(10, 2) NOT NULL,
    frequency VARCHAR(50) NOT NULL CHECK(frequency IN ('Månadsvis', 'Kvartalsvis', 'Årligen')),
    next_payment DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Aktiv' CHECK(status IN ('Aktiv', 'Uppsagd', 'Väntar på motpart')),
    category VARCHAR(255) NOT NULL,
    icon VARCHAR(10) DEFAULT '📄',
    notice TEXT DEFAULT '',
    images TEXT DEFAULT '[]', -- JSON string
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agreements_status ON agreements(status);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK(type IN ('income', 'expense')),
    category VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Väntar' CHECK(status IN ('Bokförd', 'Väntar', 'Granskas')),
    receipt BOOLEAN NOT NULL DEFAULT FALSE,
    receipt_path TEXT,
    note TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    make_model VARCHAR(255) NOT NULL,
    odometer INTEGER DEFAULT 0,
    next_inspection DATE,
    insurance_company VARCHAR(255),
    insurance_type VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'Aktiv' CHECK(status IN ('Aktiv', 'Inaktiv', 'Såld')),
    category VARCHAR(255) DEFAULT 'Personbil',
    note TEXT DEFAULT '',
    images TEXT DEFAULT '[]',
    agreement_id INTEGER REFERENCES agreements(id),
    next_service_odometer INTEGER,
    next_service_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_registration ON vehicles(registration_number);

-- Vehicle expenses table
CREATE TABLE IF NOT EXISTS vehicle_expenses (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    category VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL,
    description TEXT DEFAULT '',
    receipt_path TEXT,
    note TEXT DEFAULT '',
    odometer_at_purchase INTEGER,
    transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_vehicle_id ON vehicle_expenses(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_category ON vehicle_expenses(category);
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_date ON vehicle_expenses(date);
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_transaction_id ON vehicle_expenses(transaction_id);

-- Loans table
CREATE TABLE IF NOT EXISTS loans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    lender VARCHAR(255) NOT NULL,
    principal_amount DECIMAL(15, 2) NOT NULL,
    current_balance DECIMAL(15, 2) NOT NULL,
    interest_rate DECIMAL(5, 2) NOT NULL,
    monthly_payment DECIMAL(10, 2) NOT NULL,
    amortization_amount DECIMAL(10, 2) NOT NULL,
    interest_amount DECIMAL(10, 2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'Aktiv' CHECK(status IN ('Aktiv', 'Avslutat', 'Pausad')),
    category VARCHAR(255) DEFAULT 'Bolån',
    note TEXT DEFAULT '',
    agreement_id INTEGER REFERENCES agreements(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_agreement_id ON loans(agreement_id);

-- Loan payments table
CREATE TABLE IF NOT EXISTS loan_payments (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    principal_paid DECIMAL(10, 2) NOT NULL,
    interest_paid DECIMAL(10, 2) NOT NULL,
    extra_payment DECIMAL(10, 2) DEFAULT 0,
    note TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loan_payments_loan_id ON loan_payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_transaction_id ON loan_payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_date ON loan_payments(payment_date);

-- Loan interest periods table
CREATE TABLE IF NOT EXISTS loan_interest_periods (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    interest_rate DECIMAL(5, 2) NOT NULL,
    note TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loan_interest_periods_loan_id ON loan_interest_periods(loan_id);

-- Savings Goals table
CREATE TABLE IF NOT EXISTS savings_goals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    target_amount DECIMAL(15, 2) NOT NULL,
    current_amount DECIMAL(15, 2) DEFAULT 0,
    deadline DATE,
    category VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Aktiv' CHECK(status IN ('Aktiv', 'Pausad', 'Uppnådd', 'Avbruten')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_savings_goals_status ON savings_goals(status);

-- Savings Accounts table
CREATE TABLE IF NOT EXISTS savings_accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0,
    description TEXT,
    category VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Aktiv' CHECK(status IN ('Aktiv', 'Pausad', 'Stängd')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_savings_accounts_status ON savings_accounts(status);

-- Savings Transactions table
CREATE TABLE IF NOT EXISTS savings_transactions (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
    goal_id INTEGER REFERENCES savings_goals(id) ON DELETE CASCADE,
    account_id INTEGER REFERENCES savings_accounts(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK(type IN ('deposit', 'withdrawal', 'transfer')),
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_savings_transactions_goal_id ON savings_transactions(goal_id);
CREATE INDEX IF NOT EXISTS idx_savings_transactions_account_id ON savings_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_savings_transactions_transaction_id ON savings_transactions(transaction_id);

-- Licenses table
CREATE TABLE IF NOT EXISTS licenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    license_type VARCHAR(50) NOT NULL CHECK(license_type IN ('trial', 'premium')),
    status VARCHAR(50) NOT NULL CHECK(status IN ('active', 'expired', 'cancelled')),
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_validated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_licenses_user_id ON licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),
    status VARCHAR(50) NOT NULL CHECK(status IN ('active', 'cancelled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid')),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE SET NULL,
    stripe_payment_intent_id VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'sek',
    status VARCHAR(50) NOT NULL CHECK(status IN ('succeeded', 'pending', 'failed', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

-- Default data
INSERT INTO categories (name) VALUES 
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
    ('Representation')
ON CONFLICT (name) DO NOTHING;

INSERT INTO settings (key, value) VALUES 
    ('receipt_storage_path', 'default')
ON CONFLICT (key) DO NOTHING;
