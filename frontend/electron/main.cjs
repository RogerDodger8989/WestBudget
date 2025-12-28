const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;
let backendProcess = null;

function getBackendPath() {
  if (isDev) {
    return null; // In dev we run backend manually
  }
  // In production, backend is in resources folder
  const backendName = process.platform === 'win32' ? 'westbudget-backend.exe' : 'westbudget-backend';
  return path.join(process.resourcesPath, backendName);
}

function startBackend() {
  const backendPath = getBackendPath();
  if (!backendPath) {
    console.log('Running in dev mode, skipping backend spawn');
    return;
  }

  const logPath = path.join(app.getPath('userData'), 'backend.log');
  const logStream = fs.createWriteStream(logPath, { flags: 'a' });

  const log = (msg) => {
    const time = new Date().toISOString();
    logStream.write(`[${time}] ${msg}\n`);
    console.log(msg);
  };

  log(`Starting backend from: ${backendPath}`);

  try {
    backendProcess = spawn(backendPath, [], {
      cwd: path.dirname(backendPath)
    });

    backendProcess.stdout.on('data', (data) => {
      log(`[STDOUT] ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
      log(`[STDERR] ${data}`);
    });

    backendProcess.on('close', (code) => {
      log(`Backend process exited with code ${code}`);
    });

    backendProcess.on('error', (err) => {
      log(`Failed to spawn backend: ${err.message}`);
    });

  } catch (err) {
    log(`CRITICAL ERROR starting backend: ${err.message}`);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    icon: path.join(__dirname, isDev ? '../public/logo.png' : 'icon.png'),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false, // Don't show until ready
    backgroundColor: '#18181b' // Zinc-900 background
  });

  // Load the app
  if (isDev) {
    // Development: Load from Vite dev server
    mainWindow.loadURL('http://localhost:5100');
    mainWindow.webContents.openDevTools();
  } else {
    // Production: Load from built files
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    // Focus on window
    if (isDev) {
      mainWindow.focus();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

// App event handlers
app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // Check for updates (only in production)
  if (!isDev && autoUpdater) {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Välj mapp'
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-platform', () => {
  return process.platform;
});

// Auto-updater events
if (!isDev && autoUpdater) {
  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for update...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info);
    mainWindow.webContents.send('update-available', info);
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('Update not available:', info);
  });

  autoUpdater.on('error', (err) => {
    console.error('Error in auto-updater:', err);
    mainWindow.webContents.send('update-error', err);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    mainWindow.webContents.send('update-progress', progressObj);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info);
    mainWindow.webContents.send('update-downloaded', info);
  });

  ipcMain.handle('restart-app', () => {
    if (autoUpdater) {
      autoUpdater.quitAndInstall();
    }
  });
}

