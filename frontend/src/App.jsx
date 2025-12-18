import React, { useState, useEffect } from 'react';
import { api } from './api';
import { ToastProvider } from './contexts/ToastContext';
import DashboardLayout from './components/DashboardLayout';
import LicenseGate from './components/LicenseGate';
import ToastContainer from './components/ToastContainer';
import { useToast } from './contexts/ToastContext';
import './App.css';

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleExpenses, setVehicleExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load default theme from settings on mount
  useEffect(() => {
    const loadDefaultTheme = async () => {
      try {
        const settings = await api.getSettings();
        if (settings.default_theme) {
          setIsDarkMode(settings.default_theme === 'dark');
        }
      } catch (error) {
        console.error('Kunde inte ladda tema-inställning:', error);
        // Använd dark som default om det misslyckas
        setIsDarkMode(true);
      }
    };
    
    loadDefaultTheme();
  }, []);

  // Load data from API on mount - använder din api.js
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Använder dina API-funktioner från api.js
      const [transData, agrData, catData, vehData, vehExpData] = await Promise.all([
        api.getTransactions(),
        api.getAgreements(),
        api.getCategories(),
        api.getVehicles(),
        api.getVehicleExpenses()
      ]);
      
      setTransactions(transData);
      setAgreements(agrData);
      setCategories(catData);
      setVehicles(vehData);
      setVehicleExpenses(vehExpData);
      
      console.log('✅ Data laddad från backend!');
      console.log('📊 Transaktioner:', transData.length);
      console.log('📋 Avtal:', agrData.length);
      console.log('🏷️ Kategorier:', catData.length);
      
      // Debug: Visa första avtalet för att se strukturen
      if (agrData.length > 0) {
        console.log('🔍 Första avtalet:', agrData[0]);
        console.log('🔍 next_payment:', agrData[0].next_payment);
      }
    } catch (err) {
      console.error('❌ Fel vid laddning av data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => setIsAuthenticated(true);

  const { toasts, removeToast, handleUndo } = useToast();

  return (
    <div className={`${isDarkMode ? 'dark' : ''}`}>
      <div className="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen font-sans selection:bg-indigo-500/30 transition-colors duration-500 ease-in-out">
        {/* Toast Container */}
        <ToastContainer
          toasts={toasts}
          onClose={removeToast}
          onUndo={handleUndo}
        />

        {isAuthenticated ? (
          <>
            {error && (
              <div className="fixed top-4 right-4 z-50 bg-rose-100 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 px-4 py-3 rounded-xl shadow-lg">
                <p className="text-sm font-medium">Anslutningsfel:</p>
                <p className="text-xs">{error}</p>
                <button 
                  onClick={loadData}
                  className="mt-2 text-xs bg-rose-200 dark:bg-rose-800 px-2 py-1 rounded hover:bg-rose-300 dark:hover:bg-rose-700"
                >
                  Försök igen
                </button>
              </div>
            )}
            <DashboardLayout 
              onLogout={() => setIsAuthenticated(false)} 
              isDarkMode={isDarkMode}
              toggleTheme={async () => {
                const newTheme = !isDarkMode;
                setIsDarkMode(newTheme);
                // Spara tema-inställningen
                try {
                  await api.saveSettings({
                    default_theme: newTheme ? 'dark' : 'light'
                  });
                } catch (error) {
                  console.error('Kunde inte spara tema-inställning:', error);
                }
              }}
              transactions={transactions}
              setTransactions={setTransactions}
              agreements={agreements}
              categories={categories}
              vehicles={vehicles}
              setVehicles={setVehicles}
              vehicleExpenses={vehicleExpenses}
              setVehicleExpenses={setVehicleExpenses}
              loading={loading}
              reloadData={loadData}
            />
          </>
        ) : (
          <LicenseGate 
            onUnlock={handleLogin} 
            isDarkMode={isDarkMode}
            toggleTheme={async () => {
              const newTheme = !isDarkMode;
              setIsDarkMode(newTheme);
              // Spara tema-inställningen
              try {
                await api.saveSettings({
                  default_theme: newTheme ? 'dark' : 'light'
                });
              } catch (error) {
                console.error('Kunde inte spara tema-inställning:', error);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

