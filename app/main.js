// GitHub AutoSync - 极简设计版 v3.0

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let mainWindow;
let syncProcess = null;

app.disableHardwareAcceleration();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 700,
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
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #FFFFFF;
      color: #1D1D1F;
      line-height: 1.5;
    }
    .container {
      padding: 40px 32px;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .brand {
      font-size: 12px;
      font-weight: 600;
      color: #86868B;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .headline {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .subhead {
      font-size: 15px;
      color: #86868B;
      margin-bottom: 32px;
    }
    .status-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 0;
    }
    .indicator {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: #F5F5F7;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      transition: all 0.4s ease;
    }
    .indicator.active { background: #34C759; }
    .indicator.active::after {
      content: '';
      width: 20px;
      height: 20px;
      background: white;
      border-radius: 50%;
    }
    .indicator.loading {
      background: conic-gradient(#007AFF 0deg, #F5F5F7 90deg);
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .status-text {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 6px;
    }
    .status-detail {
      font-size: 14px;
      color: #86868B;
      text-align: center;
      max-width: 300px;
    }
    .activity-log {
      width: 100%;
      margin-top: 24px;
      background: #F5F5F7;
      border-radius: 12px;
      padding: 16px;
      max-height: 180px;
      overflow-y: auto;
    }
    .activity-title {
      font-size: 12px;
      font-weight: 600;
      color: #86868B;
      margin-bottom: 12px;
      text-transform: uppercase;
    }
    .activity-item {
      font-size: 13px;
      padding: 8px 0;
      border-bottom: 1px solid rgba(0,0,0,0.05);
      display: flex;
      align-items: flex-start;
      gap: 8px;
      animation: slideIn 0.3s ease;
    }
    .activity-item:last-child { border-bottom: none; }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .activity-time { color: #86868B; font-size: 11px; white-space: nowrap; }
    .activity-text { flex: 1; word-break: break-word; }
    .activity-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #34C759;
      margin-top: 6px;
      flex-shrink: 0;
    }
    .activity-dot.push { background: #007AFF; }
    .activity-dot.error { background: #FF3B30; }
    .activity-dot.watch { background: #FF9500; }
    .stats-row {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #F5F5F7;
      width: 100%;
    }
    .stat { text-align: center; }
    .stat-value { font-size: 24px; font-weight: 600; }
    .stat-label { font-size: 12px; color: #86868B; margin-top: 2px; }
    
    /* 历史记录时间轴 */
    .history-timeline {
      width: 100%;
      margin-top: 24px;
      background: #F5F5F7;
      border-radius: 12px;
      padding: 16px;
      max-height: 200px;
      overflow-y: auto;
    }
    .history-title {
      font-size: 12px;
      font-weight: 600;
      color: #86868B;
      margin-bottom: 12px;
      text-transform: uppercase;
    }
    .history-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .history-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      background: white;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      border-left: 3px solid transparent;
    }
    .history-item:hover {
      border-left-color: #007AFF;
      transform: translateX(2px);
    }
    .history-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #007AFF;
      flex-shrink: 0;
    }
    .history-content {
      flex: 1;
      min-width: 0;
    }
    .history-message {
      font-size: 13px;
      font-weight: 500;
      color: #1D1D1F;
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .history-meta {
      font-size: 11px;
      color: #86868B;
      display: flex;
      gap: 8px;
    }
    .history-actions {
      display: flex;
      gap: 8px;
    }
    .history-btn {
      padding: 4px 10px;
      font-size: 11px;
      border: 1px solid #D2D2D7;
      border-radius: 6px;
      background: white;
      color: #007AFF;
      cursor: pointer;
    }
    .history-btn:hover {
      background: #007AFF;
      color: white;
      border-color: #007AFF;
    }
    .history-empty {
      text-align: center;
      color: #86868B;
      font-size: 13px;
      padding: 20px;
    }
    
    .action-area { padding-top: 24px; }
    .btn {
      width: 100%;
      padding: 16px;
      font-size: 16px;
      font-weight: 500;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-primary { background: #007AFF; color: white; }
    .btn-primary:hover { background: #0066CC; }
    .btn-primary:disabled { background: #D2D2D7; cursor: not-allowed; }
    .btn-danger { background: #FF3B30; color: white; }
    .btn-secondary { background: transparent; color: #007AFF; margin-top: 12px; }
    .input-group { margin-bottom: 16px; }
    .input-label { font-size: 12px; color: #86868B; margin-bottom: 6px; display: block; }
    .input-field {
      width: 100%;
      padding: 12px 14px;
      font-size: 15px;
      border: 1px solid #D2D2D7;
      border-radius: 8px;
    }
    .input-field:focus { outline: none; border-color: #007AFF; }
    .hidden { display: none !important; }
    .toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: #1D1D1F;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      animation: toastIn 0.3s ease;
      z-index: 100;
    }
    @keyframes toastIn {
      from { opacity: 0; transform: translate(-50%, 20px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">AutoSync</div>
    <h1 class="headline" id="headline">准备开始</h1>
    <p class="subhead" id="subhead">自动同步代码到 GitHub</p>
    
    <div class="status-area">
      <div class="indicator" id="indicator"></div>
      <div class="status-text" id="status-text">检测环境中</div>
      <div class="status-detail" id="status-detail">正在分析开发环境</div>
      
      <div class="activity-log hidden" id="activity-log">
        <div class="activity-title">实时活动</div>
        <div id="activity-list"></div>
      </div>
      
      <div class="stats-row hidden" id="stats-row">
        <div class="stat">
          <div class="stat-value" id="stat-commits">0</div>
          <div class="stat-label">提交</div>
        </div>
        <div class="stat">
          <div class="stat-value" id="stat-time">0:00</div>
          <div class="stat-label">运行时长</div>
        </div>
      </div>
      
      <!-- 历史记录时间轴 -->
      <div class="history-timeline hidden" id="history-timeline">
        <div class="history-title">提交历史</div>
        <div class="history-list" id="history-list">
          <div class="history-empty">暂无历史记录</div>
        </div>
      </div>
    </div>
    
    <div class="action-area">
      <div class="input-group hidden" id="token-group">
        <label class="input-label">GitHub Token</label>
        <input type="password" class="input-field" id="token-input" placeholder="粘贴 Token">
        <label class="input-label" style="margin-top:12px;">DeepSeek API Key (可选)</label>
        <input type="password" class="input-field" id="deepseek-input" placeholder="用于 AI 生成 commit message">
        <small style="font-size:11px;color:#86868B;margin-top:4px;display:block;">留空则使用本地规则生成</small>
      </div>
      <button class="btn btn-primary" id="main-btn" disabled>检测中</button>
      <button class="btn btn-secondary hidden" id="secondary-btn"></button>
    </div>
  </div>

  <script>
    const { ipcRenderer, shell } = require('electron');
    const fs = require('fs');
    const nodePath = require('path');
    const os = require('os');
    
    const state = { projectDir: '', token: '', deepseekApiKey: '', commits: 0, startTime: null, timerInterval: null, historyInterval: null };
    const $ = id => document.getElementById(id);
    
    window.onload = () => setTimeout(autoDetect, 300);
    
    async function autoDetect() {
      showLoading('检测环境', '正在分析开发环境');
      await delay(400);
      
      const hasGit = await checkGit();
      if (!hasGit) { showError('未安装 Git', '请先安装 Git'); return; }
      addActivity('Git 已安装', 'watch');
      
      await delay(300);
      state.projectDir = await detectProject();
      if (!state.projectDir) {
        $('status-text').textContent = '选择项目';
        $('status-detail').textContent = '点击下方按钮选择项目目录';
        $('indicator').className = 'indicator';
        setButton('选择项目目录', selectProject);
        return;
      }
      addActivity('项目: ' + shortenPath(state.projectDir), 'watch');
      
      await delay(300);
      state.token = loadToken();
      state.deepseekApiKey = loadDeepSeekKey();
      if (!state.token) { showNeedToken(); return; }
      addActivity('Token 已配置', 'watch');
      if (state.deepseekApiKey) {
        addActivity('DeepSeek API 已配置', 'watch');
      }
      showReady();
    }
    
    function checkGit() {
      return new Promise(r => require('child_process').exec('git --version', e => r(!e)));
    }
    
    async function detectProject() {
      const cwd = process.cwd();
      if (await isGitRepo(cwd)) return cwd;
      const home = os.homedir();
      for (const p of [nodePath.join(home, 'Desktop'), nodePath.join(home, 'Projects')]) {
        if (await isGitRepo(p)) return p;
  }
  return null;
    }
    
    function isGitRepo(dir) {
      return new Promise(r => require('child_process').exec('git rev-parse --git-dir', { cwd: dir }, e => r(!e)));
    }
    
    function loadToken() {
      try {
        const p = nodePath.join(os.homedir(), '.autosync-token');
        if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8').trim();
      } catch (e) {}
      return null;
    }
    
    function loadDeepSeekKey() {
      try {
        const p = nodePath.join(os.homedir(), '.autosync-deepseek');
        if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8').trim();
      } catch (e) {}
      return null;
    }
    
    function saveToken(token) {
      try { fs.writeFileSync(nodePath.join(os.homedir(), '.autosync-token'), token, 'utf8'); } catch (e) {}
    }
    
    function saveDeepSeekKey(key) {
      try { fs.writeFileSync(nodePath.join(os.homedir(), '.autosync-deepseek'), key, 'utf8'); } catch (e) {}
    }
    
    async function selectProject() {
      const dir = await ipcRenderer.invoke('select-directory');
      if (dir) {
        state.projectDir = dir;
        addActivity('已选择: ' + shortenPath(dir), 'watch');
        await delay(300);
        state.token = loadToken();
        state.token ? showReady() : showNeedToken();
      }
    }
    
    function showNeedToken() {
      $('headline').textContent = '需要授权';
      $('subhead').textContent = '连接 GitHub 账户';
      $('indicator').className = 'indicator';
      $('status-text').textContent = '输入 Token';
      $('status-detail').textContent = '用于推送代码到 GitHub';
      $('token-group').classList.remove('hidden');
      $('secondary-btn').classList.remove('hidden');
      $('secondary-btn').textContent = '获取 Token';
      
      // 加载已保存的 DeepSeek API Key
      const savedKey = loadDeepSeekKey();
      if (savedKey) {
        $('deepseek-input').value = savedKey;
        state.deepseekApiKey = savedKey;
      }
      
      $('secondary-btn').onclick = () => {
        shell.openExternal('https://github.com/settings/tokens/new?description=AutoSync&scopes=repo');
        showToast('请在 GitHub 页面生成 Token');
      };
      setButton('继续', () => {
        const token = $('token-input').value.trim();
        if (!token || token.length < 20) { showToast('请输入有效的 Token'); return; }
        state.token = token;
        saveToken(token);
        
        // 保存 DeepSeek API Key（可选）
        const deepseekKey = $('deepseek-input').value.trim();
        if (deepseekKey) {
          state.deepseekApiKey = deepseekKey;
          saveDeepSeekKey(deepseekKey);
          addActivity('DeepSeek API 已配置', 'watch');
        }
        
        $('token-group').classList.add('hidden');
        $('secondary-btn').classList.add('hidden');
        addActivity('Token 已保存', 'watch');
        showReady();
      });
    }
    
    function showReady() {
      $('headline').textContent = '准备就绪';
      $('subhead').textContent = shortenPath(state.projectDir);
      $('indicator').className = 'indicator';
      $('status-text').textContent = '一键启动';
      $('status-detail').textContent = '保存文件后自动同步到 GitHub';
      setButton('开始同步', startSync);
    }
    
    async function startSync() {
      state.startTime = Date.now();
      state.commits = 0;
      $('headline').textContent = '同步中';
      $('subhead').textContent = '实时监听文件变化';
      $('indicator').className = 'indicator active';
      $('status-text').textContent = '运行中';
      $('status-detail').textContent = '修改代码后会自动提交并推送';
      $('activity-log').classList.remove('hidden');
      $('stats-row').classList.remove('hidden');
      $('history-timeline').classList.remove('hidden');
      setButton('停止', stopSync, true);
      addActivity('同步服务已启动', 'watch');
      addActivity('开始监听文件变化...', 'watch');
      
      // 加载历史记录
      loadHistory();
      
      try {
        const result = await ipcRenderer.invoke('start-sync', { 
          projectDir: state.projectDir, 
          token: state.token,
          deepseekApiKey: state.deepseekApiKey 
        });
        if (!result.success && result.message) addActivity('错误: ' + result.message, 'error');
      } catch (e) { addActivity('启动失败: ' + e.message, 'error'); }
      
      state.timerInterval = setInterval(updateTimer, 1000);
      // 定期刷新历史记录
      state.historyInterval = setInterval(loadHistory, 30000); // 30秒刷新一次
    }
    
    function stopSync() {
      if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; }
      if (state.historyInterval) { clearInterval(state.historyInterval); state.historyInterval = null; }
      ipcRenderer.invoke('stop-sync');
      addActivity('同步已停止', 'watch');
      $('indicator').className = 'indicator';
      showReady();
    }
    
    // 加载 Git 历史记录
    async function loadHistory() {
      if (!state.projectDir) return;
      
      try {
        const history = await ipcRenderer.invoke('get-git-history', state.projectDir);
        if (history && history.length > 0) {
          renderHistory(history);
        } else {
          $('history-list').innerHTML = '<div class="history-empty">暂无历史记录</div>';
        }
      } catch (e) {
        console.error('Failed to load history:', e);
      }
    }
    
    // 渲染历史记录
    function renderHistory(commits) {
      const list = $('history-list');
      list.innerHTML = '';
      
      commits.forEach((commit, index) => {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        const time = new Date(commit.date).toLocaleString('zh-CN', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        item.innerHTML = \`
          <div class="history-dot"></div>
          <div class="history-content">
            <div class="history-message">\${escapeHtml(commit.message)}</div>
            <div class="history-meta">
              <span>\${time}</span>
              <span>•</span>
              <span>\${commit.hash.substring(0, 7)}</span>
            </div>
          </div>
          <div class="history-actions">
            <button class="history-btn" onclick="rollbackToCommit('\${commit.hash}')">恢复</button>
          </div>
        \`;
        
        list.appendChild(item);
      });
    }
    
    // 回滚到指定版本
    async function rollbackToCommit(hash) {
      if (!confirm('确定要恢复到该版本吗？当前未提交的更改可能会丢失。')) {
        return;
      }
      
      try {
        addActivity('正在恢复版本: ' + hash.substring(0, 7), 'watch');
        const result = await ipcRenderer.invoke('rollback-commit', {
          projectDir: state.projectDir,
          hash: hash
        });
        
        if (result.success) {
          addActivity('已恢复到版本: ' + hash.substring(0, 7), 'push');
          showToast('已恢复到指定版本');
          // 刷新历史记录
          setTimeout(loadHistory, 1000);
      } else {
          addActivity('恢复失败: ' + result.message, 'error');
          showToast('恢复失败: ' + result.message);
        }
      } catch (e) {
        addActivity('恢复失败: ' + e.message, 'error');
        showToast('恢复失败');
      }
    }
    
    // 全局暴露 rollbackToCommit
    window.rollbackToCommit = rollbackToCommit;
    
    function updateTimer() {
      if (!state.startTime) return;
      const secs = Math.floor((Date.now() - state.startTime) / 1000);
      $('stat-time').textContent = Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0');
    }
    
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
    
    function addActivity(text, type = 'info') {
      const list = $('activity-list');
      const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const item = document.createElement('div');
      item.className = 'activity-item';
      const dot = document.createElement('div');
      dot.className = 'activity-dot ' + type;
      const timeSpan = document.createElement('span');
      timeSpan.className = 'activity-time';
      timeSpan.textContent = time;
      const textSpan = document.createElement('span');
      textSpan.className = 'activity-text';
      textSpan.textContent = text;
      item.appendChild(dot);
      item.appendChild(timeSpan);
      item.appendChild(textSpan);
      list.insertBefore(item, list.firstChild);
      while (list.children.length > 20) list.removeChild(list.lastChild);
    }
    
    ipcRenderer.on('sync-log', (event, log) => {
      const text = log.trim();
      if (!text) return;
      let type = 'info';
      
      // 识别不同类型的日志
      if (text.includes('[PUSH] Success') || text.includes('Push') && text.includes('Success')) {
        type = 'push';
        state.commits++;
        $('stat-commits').textContent = state.commits;
        showToast('已推送到 GitHub');
      }
      else if (text.includes('[COMMIT]') || text.includes('Commit')) {
        type = 'push';
        // 提取 commit message 显示
        const msgMatch = text.match(/\[COMMIT\]\s*(.+)/);
        if (msgMatch) {
          addActivity('提交: ' + msgMatch[1].substring(0, 60), type);
          return;
        }
      }
      else if (text.includes('[QUALITY]') || text.includes('quality warning')) {
        type = 'error';
        addActivity('代码质量检测: ' + text.substring(0, 70), type);
        return;
      }
      else if (text.includes('[WARN]') || text.includes('Conflict') || text.includes('conflict')) {
        type = 'error';
      }
      else if (text.includes('[FILTER]') || text.includes('Skipping')) {
        type = 'watch';
      }
      else if (text.includes('[ERROR]') || text.includes('Error')) {
        type = 'error';
      }
      else if (text.includes('[WATCH]') || text.includes('Watch') || text.includes('Monitoring')) {
        type = 'watch';
      }
      
      addActivity(text.substring(0, 80), type);
    });
    
    ipcRenderer.on('sync-stopped', () => addActivity('同步进程已结束', 'error'));
    
    function showLoading(title, detail) {
      $('indicator').className = 'indicator loading';
      $('status-text').textContent = title;
      $('status-detail').textContent = detail;
      $('main-btn').disabled = true;
      $('main-btn').textContent = '检测中';
    }
    
    function showError(title, detail) {
      $('indicator').className = 'indicator';
      $('indicator').style.background = '#FF3B30';
      $('status-text').textContent = title;
      $('status-detail').textContent = detail;
      setButton('重试', autoDetect);
    }
    
    function setButton(text, onClick, isDanger = false) {
      const btn = $('main-btn');
      btn.disabled = false;
      btn.textContent = text;
      btn.onclick = onClick;
      btn.className = isDanger ? 'btn btn-danger' : 'btn btn-primary';
    }
    
    function showToast(msg) {
      const existing = document.querySelector('.toast');
      if (existing) existing.remove();
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = msg;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }
    
    function shortenPath(p) {
      if (!p) return '';
      const parts = p.split(/[\\\\/]/);
      return parts.length > 2 ? '../' + parts.slice(-2).join('/') : p;
    }
    
    function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
  </script>
</body>
</html>
  `;

  mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  mainWindow.on('closed', () => { mainWindow = null; });
}

// IPC
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'], title: '选择项目' });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('start-sync', async (event, config) => {
  if (syncProcess) return { success: false, message: '已在运行' };
  
  let scriptPath = path.join(__dirname, '..', 'scripts', 'auto-sync.ps1');
  if (!fs.existsSync(scriptPath)) scriptPath = path.join(__dirname, '..', 'auto-sync.ps1');
  if (!fs.existsSync(scriptPath)) return { success: false, message: '找不到同步脚本' };

  const args = ['-ExecutionPolicy', 'Bypass', '-File', scriptPath];
  if (config.deepseekApiKey) {
    args.push('-DeepSeekApiKey', config.deepseekApiKey);
  }
  
  syncProcess = spawn('powershell', args, {
    cwd: config.projectDir,
    shell: true,
    env: { ...process.env, GITHUB_TOKEN: config.token, DEEPSEEK_API_KEY: config.deepseekApiKey || '' }
  });

  syncProcess.stdout.on('data', d => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('sync-log', d.toString());
  });
  syncProcess.stderr.on('data', d => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('sync-log', d.toString());
  });
  syncProcess.on('close', () => {
    syncProcess = null;
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('sync-stopped');
  });

  return { success: true };
});

ipcMain.handle('stop-sync', () => {
  if (syncProcess) { syncProcess.kill(); syncProcess = null; }
  return { success: true };
});

// 获取 Git 历史记录
ipcMain.handle('get-git-history', async (event, projectDir) => {
  return new Promise((resolve) => {
    const gitProcess = spawn('git', ['log', '--pretty=format:%H|%s|%ad', '--date=iso', '-20'], {
      cwd: projectDir,
      shell: true
    });
    
    let output = '';
    gitProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    gitProcess.on('close', (code) => {
      if (code === 0 && output) {
        const commits = output.trim().split('\n').map(line => {
          const [hash, ...messageParts] = line.split('|');
          const message = messageParts.slice(0, -1).join('|');
          const date = messageParts[messageParts.length - 1];
          return {
            hash: hash,
            message: message || 'No message',
            date: date || new Date().toISOString()
          };
        });
        resolve(commits);
      } else {
        resolve([]);
      }
    });
    
    gitProcess.on('error', () => {
      resolve([]);
    });
  });
});

// 回滚到指定版本
ipcMain.handle('rollback-commit', async (event, config) => {
  return new Promise((resolve) => {
    // 先检查工作区是否干净
    const statusProcess = spawn('git', ['status', '--porcelain'], {
      cwd: config.projectDir,
      shell: true
    });

    let hasChanges = false;
    statusProcess.stdout.on('data', (data) => {
      if (data.toString().trim()) hasChanges = true;
    });
    
    statusProcess.on('close', () => {
      if (hasChanges) {
        // 有未提交的更改，先 stash
        const stashProcess = spawn('git', ['stash', 'push', '-m', 'AutoSync: stash before rollback'], {
          cwd: config.projectDir,
          shell: true
        });
        
        stashProcess.on('close', () => {
          // 执行回滚
          const checkoutProcess = spawn('git', ['checkout', config.hash], {
            cwd: config.projectDir,
            shell: true
          });
          
          checkoutProcess.on('close', (code) => {
            if (code === 0) {
              resolve({ success: true, message: '已恢复到指定版本' });
      } else {
              resolve({ success: false, message: '回滚失败' });
            }
          });
          
          checkoutProcess.on('error', (err) => {
            resolve({ success: false, message: err.message });
          });
        });
      } else {
        // 直接回滚
        const checkoutProcess = spawn('git', ['checkout', config.hash], {
          cwd: config.projectDir,
          shell: true
        });
        
        checkoutProcess.on('close', (code) => {
          if (code === 0) {
            resolve({ success: true, message: '已恢复到指定版本' });
          } else {
            resolve({ success: false, message: '回滚失败' });
          }
        });
        
        checkoutProcess.on('error', (err) => {
          resolve({ success: false, message: err.message });
        });
      }
    });
  });
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
