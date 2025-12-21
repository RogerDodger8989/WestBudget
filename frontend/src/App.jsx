import React, { useState, useEffect } from 'react';
import { api } from './api';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LicenseProvider } from './contexts/LicenseContext';
import DashboardLayout from './components/DashboardLayout';
import LicenseGate from './components/LicenseGate';
import { useLicense } from './contexts/LicenseContext';
import LoginModal from './components/LoginModal';
import RegisterModal from './components/RegisterModal';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import ToastContainer from './components/ToastContainer';
import { useToast } from './contexts/ToastContext';
import './App.css';

function AppContent() {
  const { isAuthenticated, user, logout } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleExpenses, setVehicleExpenses] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('');

  // Load default theme and user name from settings on mount
  useEffect(() => {
    const loadDefaultTheme = async () => {
      try {
        const settings = await api.getSettings();
        if (settings.default_theme) {
          setIsDarkMode(settings.default_theme === 'dark');
        }
        if (settings.user_name) {
          setUserName(settings.user_name);
        }
        // Load and apply color theme
        if (settings.color_theme) {
          const { applyTheme } = await import('./utils/themes');
          applyTheme(settings.color_theme);
          // Also update ThemeContext
          const { ThemeProvider } = await import('./contexts/ThemeContext');
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
      const [transData, agrData, catData, vehData, vehExpData, loansData] = await Promise.all([
        api.getTransactions(),
        api.getAgreements(),
        api.getCategories(),
        api.getVehicles(),
        api.getVehicleExpenses(),
        api.getLoans()
      ]);
      
      setTransactions(transData);
      setAgreements(agrData);
      setCategories(catData);
      setVehicles(vehData);
      setVehicleExpenses(vehExpData);
      setLoans(loansData);
      
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

  const { toasts, removeToast, handleUndo } = useToast();

  // Show login modal if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !isLoginModalOpen && !isRegisterModalOpen && !isForgotPasswordModalOpen) {
      setIsLoginModalOpen(true);
    }
  }, [isAuthenticated, isLoginModalOpen, isRegisterModalOpen, isForgotPasswordModalOpen]);

  return (
    <div className={`${isDarkMode ? 'dark' : ''}`}>
      <div className="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen font-sans selection:bg-indigo-500/30 transition-colors duration-500 ease-in-out">
        {/* Toast Container */}
        <ToastContainer
          toasts={toasts}
          onClose={removeToast}
          onUndo={handleUndo}
        />

        {/* Auth Modals */}
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onSwitchToRegister={() => {
            setIsLoginModalOpen(false);
            setIsRegisterModalOpen(true);
          }}
          onSwitchToForgotPassword={() => {
            setIsLoginModalOpen(false);
            setIsForgotPasswordModalOpen(true);
          }}
        />
        <RegisterModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          onSwitchToLogin={() => {
            setIsRegisterModalOpen(false);
            setIsLoginModalOpen(true);
          }}
        />
        <ForgotPasswordModal
          isOpen={isForgotPasswordModalOpen}
          onClose={() => setIsForgotPasswordModalOpen(false)}
          onSwitchToLogin={() => {
            setIsForgotPasswordModalOpen(false);
            setIsLoginModalOpen(true);
          }}
        />

        {isAuthenticated ? (
          <LicenseGate>
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
              onLogout={async () => {
                await logout();
              }} 
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
              loans={loans}
              loading={loading}
              reloadData={loadData}
              userName={userName}
              setUserName={setUserName}
            />
            </>
          </LicenseGate>
        ) : (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
                Välkommen till WestBudget
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Logga in för att fortsätta
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <LicenseProvider>
            <AppContent />
          </LicenseProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

