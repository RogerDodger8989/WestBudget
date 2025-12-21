import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { api } from '../api';
import { useAuth } from './AuthContext';

const LicenseContext = createContext(null);

// Store last validation in localStorage for offline fallback
const STORAGE_KEY = 'westbudget_license_validation';
const GRACE_PERIOD_DAYS = 7;

export const LicenseProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [license, setLicense] = useState(null);
  const [licenseStatus, setLicenseStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canUse, setCanUse] = useState(true); // Default to true to avoid blocking
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const validationIntervalRef = useRef(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load license status on mount and when auth changes
  useEffect(() => {
    if (isAuthenticated) {
      loadLicenseStatus();
      // Validate license periodically (every 5 minutes) when online
      validationIntervalRef.current = setInterval(() => {
        if (isOnline) {
          validateLicense(true); // Silent validation
        } else {
          // Check offline grace period
          checkOfflineGracePeriod();
        }
      }, 5 * 60 * 1000);
      return () => {
        if (validationIntervalRef.current) {
          clearInterval(validationIntervalRef.current);
        }
      };
    } else {
      setLicense(null);
      setLicenseStatus(null);
      setCanUse(true);
      setLoading(false);
    }
  }, [isAuthenticated, isOnline]);

  // Check offline grace period
  const checkOfflineGracePeriod = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      
      const { timestamp, canUse: storedCanUse } = JSON.parse(stored);
      const daysSinceValidation = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
      
      if (daysSinceValidation > GRACE_PERIOD_DAYS) {
        // Grace period expired
        setCanUse(false);
        if (licenseStatus) {
          setLicenseStatus({
            ...licenseStatus,
            grace_period_expired: true,
            can_use: false
          });
        }
      } else {
        // Still within grace period
        setCanUse(storedCanUse);
      }
    } catch (error) {
      console.error('Error checking offline grace period:', error);
    }
  };

  // Load license status (works offline with cached data)
  const loadLicenseStatus = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      
      if (isOnline) {
        // Try online first
        try {
          const status = await api.getLicenseStatus();
          setLicenseStatus(status);
          setLicense(status.license || null);
          setCanUse(status.can_use !== false);
          
          // Store validation for offline use
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            timestamp: Date.now(),
            canUse: status.can_use !== false,
            status: status
          }));
        } catch (error) {
          console.error('Error loading license status online:', error);
          // Fall back to offline cache
          loadOfflineCache();
        }
      } else {
        // Use offline cache
        loadOfflineCache();
      }
    } catch (error) {
      console.error('Error loading license status:', error);
      // On error, try offline cache
      loadOfflineCache();
    } finally {
      setLoading(false);
    }
  };

  // Load from offline cache
  const loadOfflineCache = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const { status, canUse: storedCanUse } = JSON.parse(stored);
        setLicenseStatus(status);
        setLicense(status?.license || null);
        
        // Check if grace period is still valid
        const daysSinceValidation = (Date.now() - JSON.parse(stored).timestamp) / (1000 * 60 * 60 * 24);
        if (daysSinceValidation > GRACE_PERIOD_DAYS) {
          setCanUse(false);
          if (status) {
            setLicenseStatus({
              ...status,
              grace_period_expired: true,
              can_use: false
            });
          }
        } else {
          setCanUse(storedCanUse);
        }
      } else {
        // No cache, allow usage (graceful degradation)
        setCanUse(true);
      }
    } catch (error) {
      console.error('Error loading offline cache:', error);
      setCanUse(true); // Default to allowing usage
    }
  };

  // Validate license (online validation)
  const validateLicense = async (silent = false) => {
    if (!isAuthenticated || !isOnline) {
      if (!silent) {
        checkOfflineGracePeriod();
      }
      return;
    }
    
    try {
      const result = await api.validateLicense();
      
      // Update status
      if (result.license) {
        setLicense(result.license);
      }
      
      // Reload full status after validation
      await loadLicenseStatus();
      
      return result;
    } catch (error) {
      console.error('Error validating license:', error);
      // On validation error, check offline cache
      if (!silent) {
        loadOfflineCache();
      }
      throw error;
    }
  };

  const value = {
    license,
    licenseStatus,
    loading,
    canUse,
    isOnline,
    loadLicenseStatus,
    validateLicense
  };

  return <LicenseContext.Provider value={value}>{children}</LicenseContext.Provider>;
};

export const useLicense = () => {
  const context = useContext(LicenseContext);
  if (!context) {
    throw new Error('useLicense must be used within LicenseProvider');
  }
  return context;
};

