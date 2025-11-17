import { app, BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import fs from 'fs/promises';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Load renderer
  const isDev = process.argv.includes('--dev');

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
  }

  // Check for updates in production
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle directory listing requests with confirmation
  ipcMain.on('request-list-directory', (event) => {
    const PROJECT_DIR =
      '/Users/chencheng/Documents/Code/github.com/neovateai/neovate-code-desktop';
    // Send confirmation request back to renderer
    event.sender.send('confirm-list-directory', { path: PROJECT_DIR });
  });

  ipcMain.on('confirm-response', async (event, { confirmed }) => {
    const PROJECT_DIR =
      '/Users/chencheng/Documents/Code/github.com/neovateai/neovate-code-desktop';
    let result: { success: boolean; files?: string[]; message?: string };

    if (confirmed) {
      try {
        const files = await fs.readdir(PROJECT_DIR);
        result = { success: true, files };
      } catch (error) {
        console.error('Error reading directory:', error);
        result = { success: false, message: (error as Error).message };
      }
    } else {
      result = { success: false, message: 'Directory listing cancelled' };
    }

    // Send result back to renderer
    event.sender.send('directory-result', result);
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
