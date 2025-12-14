// ========================================
// GitHub AutoSync - Electron 主进程
// ========================================
// 【中文说明】
//   Electron 应用主进程，负责创建窗口和管理应用生命周期
//   蓝白配色，苹果质感界面
// ========================================

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let syncProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    frame: false, // 无边框，实现苹果质感
    backgroundColor: '#F5F7FA', // 浅蓝白色背景
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false
    },
    titleBarStyle: 'hiddenInset', // macOS 风格标题栏
    vibrancy: 'ultra-dark', // macOS 毛玻璃效果
    transparent: true, // 透明窗口
    show: false // 先不显示，等加载完成
  });

  // 加载界面
  mainWindow.loadFile('index.html').catch(err => {
    console.error('Failed to load index.html:', err);
  });

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // 开发模式下打开开发者工具
    if (process.argv.includes('--dev')) {
      mainWindow.webContents.openDevTools();
    }
  });

  // 窗口关闭
  mainWindow.on('closed', () => {
    mainWindow = null;
    // 停止同步服务
    if (syncProcess) {
      syncProcess.kill();
      syncProcess = null;
    }
  });
}

// 应用准备就绪
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC 通信处理
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// 选择项目目录
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: '选择项目目录'
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// 检查 Git 是否安装
ipcMain.handle('check-git', async () => {
  return new Promise((resolve) => {
    const gitProcess = spawn('git', ['--version'], { shell: true });
    gitProcess.on('close', (code) => {
      resolve(code === 0);
    });
    gitProcess.on('error', () => {
      resolve(false);
    });
  });
});

// 检查是否在 Git 仓库中
ipcMain.handle('check-git-repo', async (event, dir) => {
  return new Promise((resolve) => {
    const gitProcess = spawn('git', ['rev-parse', '--git-dir'], {
      cwd: dir,
      shell: true
    });
    gitProcess.on('close', (code) => {
      resolve(code === 0);
    });
    gitProcess.on('error', () => {
      resolve(false);
    });
  });
});

// 获取远程仓库 URL
ipcMain.handle('get-remote-url', async (event, dir) => {
  return new Promise((resolve) => {
    const gitProcess = spawn('git', ['remote', 'get-url', 'origin'], {
      cwd: dir,
      shell: true
    });
    let output = '';
    gitProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    gitProcess.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        resolve(null);
      }
    });
    gitProcess.on('error', () => {
      resolve(null);
    });
  });
});

// 启动自动同步
ipcMain.handle('start-sync', async (event, config) => {
  if (syncProcess) {
    return { success: false, message: '同步服务已在运行' };
  }

  // 查找 auto-sync.ps1（支持多个位置）
  let scriptPath = path.join(__dirname, '..', 'scripts', 'auto-sync.ps1');
  if (!fs.existsSync(scriptPath)) {
    scriptPath = path.join(__dirname, '..', 'auto-sync.ps1');
  }
  if (!fs.existsSync(scriptPath)) {
    // 尝试从项目根目录查找
    const projectRoot = path.resolve(__dirname, '..', '..');
    scriptPath = path.join(projectRoot, 'scripts', 'auto-sync.ps1');
    if (!fs.existsSync(scriptPath)) {
      scriptPath = path.join(projectRoot, 'auto-sync.ps1');
    }
  }
  
  if (!fs.existsSync(scriptPath)) {
    return { success: false, message: '找不到 auto-sync.ps1 脚本，请确保脚本文件存在' };
  }

  return new Promise((resolve) => {
    const args = [];
    if (config.token) {
      args.push('-Token', config.token);
    }
    if (config.debounceSeconds) {
      args.push('-DebounceSeconds', config.debounceSeconds.toString());
    }
    if (config.background) {
      args.push('-Background');
    }

    syncProcess = spawn('powershell', [
      '-ExecutionPolicy', 'Bypass',
      '-File', scriptPath,
      ...args
    ], {
      cwd: config.projectDir || path.dirname(scriptPath),
      shell: true
    });

    let output = '';
    syncProcess.stdout.on('data', (data) => {
      output += data.toString();
      // 发送实时日志到渲染进程
      mainWindow.webContents.send('sync-log', data.toString());
    });

    syncProcess.stderr.on('data', (data) => {
      output += data.toString();
      mainWindow.webContents.send('sync-log', data.toString());
    });

    syncProcess.on('close', (code) => {
      syncProcess = null;
      mainWindow.webContents.send('sync-stopped', code);
    });

    syncProcess.on('error', (error) => {
      syncProcess = null;
      resolve({ success: false, message: error.message });
    });

    // 等待一下确认启动成功
    setTimeout(() => {
      if (syncProcess && syncProcess.pid) {
        resolve({ success: true, message: '同步服务已启动' });
      } else {
        resolve({ success: false, message: '启动失败' });
      }
    }, 1000);
  });
});

// 停止自动同步
ipcMain.handle('stop-sync', async () => {
  if (syncProcess) {
    syncProcess.kill();
    syncProcess = null;
    return { success: true, message: '已停止同步服务' };
  }
  return { success: false, message: '没有运行中的同步服务' };
});

// 检查同步状态
ipcMain.handle('check-sync-status', async () => {
  return syncProcess !== null && syncProcess.pid !== undefined;
});

// 打开外部链接
ipcMain.handle('open-external', async (event, url) => {
  await shell.openExternal(url);
});

// 保存配置
ipcMain.handle('save-config', async (event, config) => {
  // 支持多个配置路径
  let configPath = path.join(__dirname, '..', 'config', 'config.json');
  if (!fs.existsSync(path.dirname(configPath))) {
    configPath = path.join(__dirname, '..', 'config.json');
  }
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// 读取配置
ipcMain.handle('load-config', async () => {
  // 支持多个配置路径
  let configPath = path.join(__dirname, '..', 'config', 'config.json');
  if (!fs.existsSync(configPath)) {
    configPath = path.join(__dirname, '..', 'config.json');
  }
  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      return { success: true, config: JSON.parse(content) };
    }
    return { success: true, config: null };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// 与 Cursor 联动 - 检测 Cursor 是否运行
ipcMain.handle('check-cursor', async () => {
  return new Promise((resolve) => {
    const process = spawn('tasklist', ['/FI', 'IMAGENAME eq Cursor.exe'], { shell: true });
    let output = '';
    process.stdout.on('data', (data) => {
      output += data.toString();
    });
    process.on('close', () => {
      resolve(output.includes('Cursor.exe'));
    });
    process.on('error', () => {
      resolve(false);
    });
  });
});

// 窗口控制
ipcMain.handle('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('window-close', () => {
  if (mainWindow) mainWindow.close();
});