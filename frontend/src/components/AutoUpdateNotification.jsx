import React, { useEffect, useState } from 'react';
import { Download, CheckCircle, XCircle, RefreshCw, X } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeButtonClass } from '../utils/getThemeClasses';

const AutoUpdateNotification = () => {
  const { showToast } = useToast();
  const { colorTheme } = useTheme();
  const [updateInfo, setUpdateInfo] = useState(null);
  const [updateProgress, setUpdateProgress] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Only run in Electron
    if (!window.electronAPI) return;

    const handleUpdateAvailable = (info) => {
      setUpdateInfo(info);
      setIsDownloading(true);
      showToast('Ny uppdatering tillgänglig! Laddar ner...', { 
        type: 'info',
        duration: 0 // Don't auto-dismiss
      });
    };

    const handleUpdateProgress = (progress) => {
      setUpdateProgress(progress);
    };

    const handleUpdateDownloaded = (info) => {
      setIsDownloading(false);
      setIsInstalling(true);
      setUpdateInfo(info);
      showToast('Uppdatering nedladdad! Startar om appen...', { 
        type: 'success',
        duration: 0
      });
      
      // Auto-restart after 3 seconds
      setTimeout(() => {
        if (window.electronAPI.restartApp) {
          window.electronAPI.restartApp();
        }
      }, 3000);
    };

    const handleUpdateError = (error) => {
      setIsDownloading(false);
      setIsInstalling(false);
      showToast('Fel vid uppdatering: ' + error.message, { type: 'error' });
    };

    // Register event listeners
    window.electronAPI.onUpdateAvailable(handleUpdateAvailable);
    window.electronAPI.onUpdateProgress(handleUpdateProgress);
    window.electronAPI.onUpdateDownloaded(handleUpdateDownloaded);
    window.electronAPI.onUpdateError(handleUpdateError);

    // Cleanup
    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('update-available');
        window.electronAPI.removeAllListeners('update-progress');
        window.electronAPI.removeAllListeners('update-downloaded');
        window.electronAPI.removeAllListeners('update-error');
      }
    };
  }, [showToast]);

  if (!window.electronAPI || !updateInfo) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {isDownloading && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <Download className="text-indigo-500 animate-pulse" size={20} />
            <div className="flex-1">
              <h4 className="font-semibold text-zinc-900 dark:text-white text-sm">
                Laddar ner uppdatering...
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Version {updateInfo.version}
              </p>
            </div>
          </div>
          {updateProgress && (
            <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 mb-2">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${updateProgress.percent}%` }}
              />
            </div>
          )}
          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
            {updateProgress ? `${Math.round(updateProgress.percent)}%` : 'Förbereder...'}
          </p>
        </div>
      )}

      {isInstalling && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg p-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="text-emerald-500 animate-spin" size={20} />
            <div className="flex-1">
              <h4 className="font-semibold text-zinc-900 dark:text-white text-sm">
                Installerar uppdatering...
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Appen startar om om några sekunder
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoUpdateNotification;

