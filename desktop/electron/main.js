const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const isDev = !app.isPackaged;
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');

let backendProcess = null;

function startBackend() {
  const nodeExec = app.isPackaged
    ? path.join(process.resourcesPath, 'node', 'node.exe')
    : 'node';
  const backendScript = app.isPackaged
    ? path.join(process.resourcesPath, 'backend', 'src', 'server.js')
    : path.join(__dirname, '../../backend/src/server.js');
  const backendCwd = app.isPackaged
    ? path.join(process.resourcesPath, 'backend')
    : path.join(__dirname, '../../backend');

  backendProcess = spawn(nodeExec, [backendScript], {
    cwd: backendCwd,
    env: { ...process.env, PORT: '3001', NODE_ENV: 'production', RESOURCES_PATH: process.resourcesPath, ELECTRON_RUN_AS_NODE: '' },
  });
  backendProcess.on('error', (err) => console.error('[backend error]', err.message));
}

function waitForBackend(ms = 20000) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const iv = setInterval(() => {
      if (Date.now() - t0 > ms) { clearInterval(iv); reject(new Error('Backend timeout')); return; }
      const req = http.get('http://localhost:3001/health', (res) => {
        if (res.statusCode === 200) { clearInterval(iv); resolve(); }
      });
      req.on('error', () => {});
      req.end();
    }, 500);
  });
}

async function createWindow() {
  if (!isDev) startBackend();

  const win = new BrowserWindow({
    width: 1280, height: 800, minWidth: 1024, minHeight: 600,
    webPreferences: { nodeIntegration: false, contextIsolation: true, preload: path.join(__dirname, 'preload.js') },
    show: false, title: 'PriorIX',
  });
  win.setMenuBarVisibility(false);

  try {
    if (!isDev) await waitForBackend();
    isDev ? win.loadURL('http://localhost:5173') : win.loadFile(path.join(__dirname, '../dist/index.html'));
    if (isDev) win.webContents.openDevTools();
  } catch (err) {
    win.loadURL(`data:text/html,<h2 style="font-family:sans-serif;color:red">Error: ${err.message}</h2>`);
  }
  win.once('ready-to-show', () => win.show());
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (backendProcess) backendProcess.kill(); if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
