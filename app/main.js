// GitHub AutoSync - 极简设计版

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, exec } = require('child_process');

let mainWindow;
let syncProcess = null;

app.disableHardwareAcceleration();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 520,
    height: 640,
    resizable: false,
    frame: true,
    backgroundColor: '#FFFFFF',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
    show: true,
    center: true,
    title: 'AutoSync'
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    @font-face {
      font-family: 'SF Pro';
      src: local('-apple-system'), local('BlinkMacSystemFont'), local('Segoe UI');
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
      background: #FFFFFF;
      color: #1D1D1F;
      line-height: 1.47059;
      font-weight: 400;
      letter-spacing: -0.022em;
      -webkit-font-smoothing: antialiased;
    }
    
    .container {
      padding: 48px 40px;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .brand {
      font-size: 13px;
      font-weight: 600;
      color: #86868B;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    
    .headline {
      font-size: 32px;
      font-weight: 600;
      line-height: 1.125;
      letter-spacing: -0.003em;
      margin-bottom: 12px;
    }
    
    .subhead {
      font-size: 17px;
      color: #86868B;
      margin-bottom: 40px;
    }
    
    .status-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 40px 0;
    }
    
    .status-indicator {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #F5F5F7;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
      transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .status-indicator.active {
      background: #34C759;
    }
    
    .status-indicator.active::after {
      content: '';
      width: 24px;
      height: 24px;
      background: white;
      border-radius: 50%;
    }
    
    .status-indicator.loading {
      background: conic-gradient(#007AFF 0deg, #F5F5F7 60deg);
      animation: rotate 1s linear infinite;
    }
    
    @keyframes rotate {
      to { transform: rotate(360deg); }
    }
    
    .status-text {
      font-size: 22px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .status-detail {
      font-size: 15px;
      color: #86868B;
      max-width: 280px;
    }
    
    .ai-message {
      background: #F5F5F7;
      border-radius: 18px;
      padding: 16px 20px;
      margin-top: 32px;
      font-size: 15px;
      line-height: 1.5;
      color: #1D1D1F;
      max-width: 360px;
      text-align: left;
      animation: fadeUp 0.4s ease;
    }
    
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .action-area {
      padding-top: 32px;
    }
    
    .btn-primary {
      width: 100%;
      padding: 17px 24px;
      font-size: 17px;
      font-weight: 500;
      background: #007AFF;
      color: white;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn-primary:hover {
      background: #0066D6;
      transform: scale(0.98);
    }
    
    .btn-primary:disabled {
      background: #D2D2D7;
      cursor: not-allowed;
      transform: none;
    }
    
    .btn-secondary {
      width: 100%;
      padding: 17px 24px;
      font-size: 17px;
      font-weight: 500;
      background: transparent;
      color: #007AFF;
      border: none;
      cursor: pointer;
      margin-top: 12px;
    }
    
    .btn-secondary:hover {
      color: #0066D6;
    }
    
    .input-group {
      margin-bottom: 20px;
      text-align: left;
    }
    
    .input-label {
      font-size: 13px;
      font-weight: 500;
      color: #86868B;
      margin-bottom: 8px;
      display: block;
    }
    
    .input-field {
      width: 100%;
      padding: 14px 16px;
      font-size: 17px;
      border: 1px solid #D2D2D7;
      border-radius: 10px;
      background: #FFFFFF;
      transition: border-color 0.2s;
    }
    
    .input-field:focus {
      outline: none;
      border-color: #007AFF;
    }
    
    .input-field::placeholder {
      color: #C7C7CC;
    }
    
    .stats-row {
      display: flex;
      justify-content: center;
      gap: 48px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #F5F5F7;
    }
    
    .stat {
      text-align: center;
    }
    
    .stat-value {
      font-size: 28px;
      font-weight: 600;
      color: #1D1D1F;
    }
    
    .stat-label {
      font-size: 13px;
      color: #86868B;
      margin-top: 4px;
    }
    
    .hidden { display: none !important; }
    
    .link {
      color: #007AFF;
      text-decoration: none;
      cursor: pointer;
    }
    
    .link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">AutoSync</div>
    <h1 class="headline" id="headline">准备开始</h1>
    <p class="subhead" id="subhead">自动同步你的代码到 GitHub</p>
    
    <div class="status-area" id="status-area">
      <div class="status-indicator" id="indicator"></div>
      <div class="status-text" id="status-text">正在检测环境</div>
      <div class="status-detail" id="status-detail">请稍候，AI 正在分析你的开发环境</div>
      <div class="ai-message hidden" id="ai-message"></div>
    </div>
    
    <div class="action-area" id="action-area">
      <div class="input-group hidden" id="token-group">
        <label class="input-label">GitHub Token</label>
        <input type="password" class="input-field" id="token-input" placeholder="粘贴你的 Token">
      </div>
      <button class="btn-primary" id="main-btn" disabled>检测中</button>
      <button class="btn-secondary hidden" id="secondary-btn">获取 Token</button>
    </div>
  </div>

  <script>
    const { ipcRenderer, shell } = require('electron');
    
    const state = {
      phase: 'init', // init, need-token, ready, running
      projectDir: '',
      token: '',
      commits: 0,
      startTime: null
    };
    
    const $ = id => document.getElementById(id);
    
    // 启动时自动检测
    window.onload = async () => {
      await autoDetect();
    };
    
    async function autoDetect() {
      showLoading('正在检测', '分析开发环境中');
      
      // 1. 检测 Git
      await delay(500);
      const hasGit = await checkGit();
      if (!hasGit) {
        showError('未安装 Git', '请先安装 Git 后重试');
        return;
      }
      
      // 2. 尝试自动获取项目目录（从 Cursor 工作区或当前目录）
      await delay(300);
      state.projectDir = await detectProject();
      
      if (!state.projectDir) {
        // 需要用户选择
        showMessage('点击下方按钮选择你的项目文件夹');
        setButton('选择项目', selectProject);
        return;
      }
      
      // 3. 检测是否有 Token
      await delay(300);
      state.token = await loadToken();
      
      if (!state.token) {
        showNeedToken();
        return;
      }
      
      // 4. 一切就绪
      showReady();
    }
    
    async function checkGit() {
      return new Promise(resolve => {
        require('child_process').exec('git --version', (err) => {
          resolve(!err);
        });
      });
    }
    
    async function detectProject() {
      // 尝试从多个来源检测项目
      const cwd = process.cwd();
      const home = require('os').homedir();
      
      // 检查常见位置
      const possiblePaths = [
        cwd,
        require('path').join(home, 'Desktop'),
        require('path').join(home, 'Projects'),
        require('path').join(home, 'Documents')
      ];
      
      for (const p of possiblePaths) {
        if (await isGitRepo(p)) {
          return p;
        }
      }
      
      return null;
    }
    
    async function isGitRepo(dir) {
      return new Promise(resolve => {
        require('child_process').exec('git rev-parse --git-dir', { cwd: dir }, (err) => {
          resolve(!err);
        });
      });
    }
    
    async function loadToken() {
      try {
        const configPath = require('path').join(require('os').homedir(), '.autosync-token');
        if (require('fs').existsSync(configPath)) {
          return require('fs').readFileSync(configPath, 'utf8').trim();
        }
      } catch (e) {}
      return null;
    }
    
    async function saveToken(token) {
      try {
        const configPath = require('path').join(require('os').homedir(), '.autosync-token');
        require('fs').writeFileSync(configPath, token, 'utf8');
      } catch (e) {}
    }
    
    async function selectProject() {
      const dir = await ipcRenderer.invoke('select-directory');
      if (dir) {
        state.projectDir = dir;
        showMessage('项目目录：' + shortenPath(dir));
        await delay(500);
        
        state.token = await loadToken();
        if (!state.token) {
          showNeedToken();
        } else {
          showReady();
        }
      }
    }
    
    function showNeedToken() {
      state.phase = 'need-token';
      $('headline').textContent = '需要授权';
      $('subhead').textContent = '连接你的 GitHub 账户';
      
      $('indicator').className = 'status-indicator';
      $('status-text').textContent = '输入 Token';
      $('status-detail').textContent = '用于安全地推送代码到 GitHub';
      
      $('token-group').classList.remove('hidden');
      $('secondary-btn').classList.remove('hidden');
      
      setButton('继续', validateAndSaveToken);
      $('secondary-btn').onclick = () => {
        shell.openExternal('https://github.com/settings/tokens/new?description=AutoSync&scopes=repo');
        showMessage('在 GitHub 页面生成 Token 后，粘贴到上方输入框');
      };
    }
    
    async function validateAndSaveToken() {
      const token = $('token-input').value.trim();
      if (!token || token.length < 20) {
        showMessage('请输入有效的 Token');
        return;
      }
      
      state.token = token;
      await saveToken(token);
      
      $('token-group').classList.add('hidden');
      $('secondary-btn').classList.add('hidden');
      
      showReady();
    }
    
    function showReady() {
      state.phase = 'ready';
      $('headline').textContent = '准备就绪';
      $('subhead').textContent = shortenPath(state.projectDir);
      
      $('indicator').className = 'status-indicator';
      $('status-text').textContent = '一键启动';
      $('status-detail').textContent = '文件保存后自动同步到 GitHub';
      
      hideMessage();
      setButton('开始同步', startSync);
    }
    
    async function startSync() {
      state.phase = 'running';
      state.startTime = Date.now();
      
      $('headline').textContent = '同步中';
      $('subhead').textContent = '实时监听文件变化';
      
      $('indicator').className = 'status-indicator active';
      $('status-text').textContent = '运行中';
      $('status-detail').textContent = '修改代码后会自动提交并推送';
      
      showStats();
      setButton('停止', stopSync);
      $('main-btn').style.background = '#FF3B30';
      
      // 调用后端启动
      try {
        await ipcRenderer.invoke('start-sync', {
          projectDir: state.projectDir,
          token: state.token
        });
      } catch (e) {
        showMessage('启动失败：' + e.message);
      }
      
      // 定时更新统计
      updateStatsInterval = setInterval(updateStats, 1000);
    }
    
    let updateStatsInterval;
    
    async function stopSync() {
      clearInterval(updateStatsInterval);
      await ipcRenderer.invoke('stop-sync');
      
      $('main-btn').style.background = '#007AFF';
      hideStats();
      showReady();
    }
    
    function showStats() {
      let statsDiv = $('stats-div');
      if (!statsDiv) {
        statsDiv = document.createElement('div');
        statsDiv.id = 'stats-div';
        statsDiv.className = 'stats-row';
        statsDiv.innerHTML = \`
          <div class="stat"><div class="stat-value" id="stat-commits">0</div><div class="stat-label">提交</div></div>
          <div class="stat"><div class="stat-value" id="stat-time">0:00</div><div class="stat-label">运行时长</div></div>
        \`;
        $('status-area').appendChild(statsDiv);
      }
      statsDiv.classList.remove('hidden');
    }
    
    function hideStats() {
      const statsDiv = $('stats-div');
      if (statsDiv) statsDiv.classList.add('hidden');
    }
    
    function updateStats() {
      if (!state.startTime) return;
      const secs = Math.floor((Date.now() - state.startTime) / 1000);
      const mins = Math.floor(secs / 60);
      const s = secs % 60;
      $('stat-time').textContent = mins + ':' + (s < 10 ? '0' : '') + s;
      $('stat-commits').textContent = state.commits;
    }
    
    // UI Helpers
    function showLoading(title, detail) {
      $('indicator').className = 'status-indicator loading';
      $('status-text').textContent = title;
      $('status-detail').textContent = detail;
      $('main-btn').disabled = true;
      $('main-btn').textContent = '检测中';
    }
    
    function showError(title, detail) {
      $('indicator').className = 'status-indicator';
      $('indicator').style.background = '#FF3B30';
      $('status-text').textContent = title;
      $('status-detail').textContent = detail;
      setButton('重试', autoDetect);
    }
    
    function showMessage(text) {
      $('ai-message').textContent = text;
      $('ai-message').classList.remove('hidden');
    }
    
    function hideMessage() {
      $('ai-message').classList.add('hidden');
    }
    
    function setButton(text, onClick) {
      const btn = $('main-btn');
      btn.disabled = false;
      btn.textContent = text;
      btn.onclick = onClick;
    }
    
    function shortenPath(p) {
      if (!p) return '';
      const parts = p.split(/[\\\\/]/);
      if (parts.length > 3) {
        return '...' + require('path').sep + parts.slice(-2).join(require('path').sep);
      }
      return p;
    }
    
    function delay(ms) {
      return new Promise(r => setTimeout(r, ms));
    }
    
    // 监听同步日志
    ipcRenderer.on('sync-log', (event, log) => {
      if (log.includes('push') || log.includes('commit')) {
        state.commits++;
        updateStats();
      }
    });
  </script>
</body>
</html>
  `;

  mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  mainWindow.on('closed', () => { mainWindow = null; });
}

// IPC 处理
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: '选择项目'
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('start-sync', async (event, config) => {
  if (syncProcess) return { success: false };
  
  let scriptPath = path.join(__dirname, '..', 'scripts', 'auto-sync.ps1');
  if (!fs.existsSync(scriptPath)) {
    scriptPath = path.join(__dirname, '..', 'auto-sync.ps1');
  }
  
  if (!fs.existsSync(scriptPath)) {
    return { success: false, message: 'Script not found' };
  }

  syncProcess = spawn('powershell', ['-ExecutionPolicy', 'Bypass', '-File', scriptPath], {
    cwd: config.projectDir,
    shell: true,
    env: { ...process.env, GITHUB_TOKEN: config.token }
  });

  syncProcess.stdout.on('data', d => mainWindow?.webContents.send('sync-log', d.toString()));
  syncProcess.stderr.on('data', d => mainWindow?.webContents.send('sync-log', d.toString()));
  syncProcess.on('close', () => { syncProcess = null; });

  return { success: true };
});

ipcMain.handle('stop-sync', () => {
  if (syncProcess) {
    syncProcess.kill();
    syncProcess = null;
  }
  return { success: true };
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
