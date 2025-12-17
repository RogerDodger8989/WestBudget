import React, { useState } from 'react';
import DashboardLayout from './components/DashboardLayout';
import LicenseGate from './components/LicenseGate';
import './App.css';

// --- Mock Data ---
const MOCK_TRANSACTIONS = [
  { id: 1, title: "Spotify Premium", date: "Idag, 10:42", amount: "-119 kr", type: "expense", category: "Nöje & Kultur", status: "Bokförd", receipt: false, note: "" },
  { id: 2, title: "Inbetalning Faktura #402", date: "Igår, 15:30", amount: "+12,500 kr", type: "income", category: "Försäljning Tjänst", status: "Bokförd", receipt: true, note: "Projekt X slutfakturering" },
  { id: 3, title: "AWS Cloud Services", date: "15 Dec, 09:00", amount: "-450 kr", type: "expense", category: "IT & Programvara", status: "Väntar", receipt: false, note: "" },
  { id: 4, title: "Apple Store", date: "14 Dec, 12:20", amount: "-24,990 kr", type: "expense", category: "Inventarier", status: "Bokförd", receipt: true, note: "Ny MacBook Pro till Anna" },
  { id: 5, title: "Uber Business", date: "12 Dec, 21:15", amount: "-345 kr", type: "expense", category: "Resor", status: "Granskas", receipt: false, note: "Taxiresa efter kundmiddag" },
  { id: 6, title: "Circle K - Tankning", date: "Idag, 07:30", amount: "-845 kr", type: "expense", category: "Drivmedel", status: "Bokförd", receipt: true, note: "" },
  { id: 7, title: "Mekonomen Service", date: "10 Dec, 14:00", amount: "-4,200 kr", type: "expense", category: "Underhåll", status: "Bokförd", receipt: true, note: "Årsservice Volvo" },
  { id: 8, title: "If Skadeförsäkring", date: "28 Nov, 00:01", amount: "-549 kr", type: "expense", category: "Försäkring", status: "Bokförd", receipt: false, note: "" },
  { id: 9, title: "Adobe Creative Cloud", date: "27 Nov, 10:00", amount: "-625 kr", type: "expense", category: "IT & Programvara", status: "Bokförd", receipt: true, note: "" },
  { id: 10, title: "Inbetalning Faktura #401", date: "25 Nov, 14:20", amount: "+8,500 kr", type: "income", category: "Försäljning Tjänst", status: "Bokförd", receipt: true, note: "" },
  { id: 11, title: "Lunch representation", date: "24 Nov, 12:30", amount: "-1,240 kr", type: "expense", category: "Representation", status: "Granskas", receipt: true, note: "Lunch med Nisse på Tech AB" },
];

const MOCK_AGREEMENTS = [
  { id: 1, name: "SBAB Bolån", provider: "SBAB", cost: 8400, frequency: "Månadsvis", nextPayment: "2024-12-28", status: "Aktiv", category: "Boende & Lån", icon: "🏠", notice: "3 mån rörlig" },
  { id: 2, name: "If Bilförsäkring", provider: "If Skadeförsäkring", cost: 549, frequency: "Månadsvis", nextPayment: "2024-12-28", status: "Aktiv", category: "Försäkring", icon: "🚗", notice: "Förnyas 2025-04-01" },
  { id: 3, name: "Telia Företag", provider: "Telia", cost: 399, frequency: "Månadsvis", nextPayment: "2024-12-30", status: "Aktiv", category: "Mobil & Bredband", icon: "📱", notice: "Bindningstid slut" },
  { id: 4, name: "Adobe CC", provider: "Adobe", cost: 625, frequency: "Månadsvis", nextPayment: "2024-12-27", status: "Aktiv", category: "IT & Licenser", icon: "💻", notice: "" },
  { id: 5, name: "Sats Gym", provider: "Sats", cost: 649, frequency: "Månadsvis", nextPayment: "2024-12-28", status: "Uppsagd", category: "Hälsa", icon: "💪", notice: "Slutar 2025-01-31" },
  { id: 6, name: "Spotify Premium", provider: "Spotify", cost: 119, frequency: "Månadsvis", nextPayment: "2024-12-20", status: "Aktiv", category: "Nöje", icon: "🎵", notice: "" },
  { id: 7, name: "Lokalförsäkring", provider: "Länsförsäkringar", cost: 2400, frequency: "Kvartalsvis", nextPayment: "2025-01-01", status: "Väntar på motpart", category: "Försäkring", icon: "🏢", notice: "Offert granskas" },
  { id: 8, name: "Visma eEkonomi", provider: "Visma", cost: 1800, frequency: "Årligen", nextPayment: "2025-06-15", status: "Aktiv", category: "IT & Licenser", icon: "📊", notice: "Årsfaktura" },
];

const CATEGORIES = [
  "Nöje & Kultur", 
  "IT & Programvara", 
  "Inventarier", 
  "Resor", 
  "Kontorsmaterial", 
  "Försäljning Tjänst",
  "Drivmedel",
  "Underhåll",
  "Försäkring",
  "Övrigt",
  "Representation"
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);
  const [agreements] = useState(MOCK_AGREEMENTS);
  const [categories] = useState(CATEGORIES);

  const handleLogin = () => setIsAuthenticated(true);

  return (
    <div className={`${isDarkMode ? 'dark' : ''}`}>
      <div className="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen font-sans selection:bg-indigo-500/30 transition-colors duration-500 ease-in-out">
        {isAuthenticated ? (
          <DashboardLayout 
            onLogout={() => setIsAuthenticated(false)} 
            isDarkMode={isDarkMode}
            toggleTheme={() => setIsDarkMode(!isDarkMode)}
            transactions={transactions}
            setTransactions={setTransactions}
            agreements={agreements}
            categories={categories}
            loading={false}
          />
        ) : (
          <LicenseGate 
            onUnlock={handleLogin} 
            isDarkMode={isDarkMode}
            toggleTheme={() => setIsDarkMode(!isDarkMode)}
          />
        )}
      </div>
    </div>
  );
}

