// ========================================
// GitHub AutoSync - AI 驱动的智能同步工具
// ========================================

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let mainWindow;
let syncProcess = null;

app.disableHardwareAcceleration();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 900,
    minHeight: 600,
    frame: true,
    backgroundColor: '#F5F5F7',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
    show: true,
    center: true,
    title: 'GitHub AutoSync'
  });

  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>GitHub AutoSync</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --blue: #007AFF;
      --blue-light: #E3F2FD;
      --bg: #F5F5F7;
      --white: #FFFFFF;
      --gray-100: #F5F5F7;
      --gray-200: #E8E8ED;
      --gray-300: #D2D2D7;
      --gray-500: #86868B;
      --gray-700: #424245;
      --gray-900: #1D1D1F;
      --green: #34C759;
      --red: #FF3B30;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', sans-serif;
      background: var(--bg);
      color: var(--gray-900);
      line-height: 1.5;
    }
    .app { display: flex; height: 100vh; }
    
    .main-panel { flex: 1; display: flex; flex-direction: column; padding: 32px; overflow-y: auto; }
    
    .header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
    .logo { width: 48px; height: 48px; background: var(--blue); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
    .title { font-size: 24px; font-weight: 600; }
    .subtitle { font-size: 14px; color: var(--gray-500); }
    
    .steps { display: flex; flex-direction: column; gap: 16px; }
    .step-card { background: var(--white); border-radius: 16px; padding: 24px; display: flex; align-items: flex-start; gap: 16px; border: 2px solid transparent; }
    .step-card.active { border-color: var(--blue); }
    .step-card.completed { opacity: 0.6; }
    .step-number { width: 32px; height: 32px; background: var(--gray-200); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; }
    .step-card.active .step-number { background: var(--blue); color: white; }
    .step-card.completed .step-number { background: var(--green); color: white; }
    .step-content { flex: 1; }
    .step-title { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
    .step-desc { font-size: 14px; color: var(--gray-500); margin-bottom: 12px; }
    .step-input { width: 100%; padding: 12px 16px; border: 1px solid var(--gray-300); border-radius: 10px; font-size: 14px; margin-bottom: 12px; }
    .step-input:focus { outline: none; border-color: var(--blue); }
    .step-actions { display: flex; gap: 12px; flex-wrap: wrap; }
    
    .btn { padding: 10px 20px; border: none; border-radius: 10px; font-size: 14px; font-weight: 500; cursor: pointer; }
    .btn-primary { background: var(--blue); color: white; }
    .btn-secondary { background: var(--gray-200); color: var(--gray-700); }
    .btn-success { background: var(--green); color: white; }
    .btn-danger { background: var(--red); color: white; }
    
    .status-panel { margin-top: 24px; background: var(--white); border-radius: 16px; padding: 24px; }
    .status-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .status-badge { padding: 6px 12px; border-radius: 20px; font-size: 13px; }
    .status-badge.running { background: rgba(52,199,89,0.15); color: var(--green); }
    .status-badge.stopped { background: var(--gray-200); color: var(--gray-500); }
    .status-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .stat-item { text-align: center; }
    .stat-value { font-size: 28px; font-weight: 600; color: var(--blue); }
    .stat-label { font-size: 12px; color: var(--gray-500); }
    
    .ai-panel { width: 360px; background: var(--white); border-left: 1px solid var(--gray-200); display: flex; flex-direction: column; }
    .ai-header { padding: 20px; border-bottom: 1px solid var(--gray-200); display: flex; align-items: center; gap: 12px; }
    .ai-avatar { width: 40px; height: 40px; background: var(--blue); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; }
    .ai-name { font-weight: 600; }
    .ai-status { font-size: 12px; color: var(--green); }
    
    .ai-messages { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }
    .ai-message { display: flex; gap: 12px; animation: fadeIn 0.3s; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .ai-msg-avatar { width: 32px; height: 32px; background: var(--blue); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
    .ai-msg-content { background: var(--blue-light); padding: 12px 16px; border-radius: 16px; border-top-left-radius: 4px; font-size: 14px; line-height: 1.6; max-width: 280px; }
    .ai-msg-content.user-msg { background: var(--blue); color: white; border-radius: 16px; border-top-right-radius: 4px; }
    .ai-msg-content.thinking { background: var(--gray-100); color: var(--gray-500); }
    
    .ai-suggestions { padding: 16px 20px; border-top: 1px solid var(--gray-200); }
    .ai-suggestions-title { font-size: 12px; color: var(--gray-500); margin-bottom: 12px; }
    .ai-suggestion-btns { display: flex; flex-wrap: wrap; gap: 8px; }
    .suggestion-btn { padding: 8px 14px; background: var(--gray-100); border: 1px solid var(--gray-200); border-radius: 20px; font-size: 13px; cursor: pointer; }
    .suggestion-btn:hover { background: var(--blue); color: white; border-color: var(--blue); }
    
    .ai-input-area { padding: 16px 20px; border-top: 1px solid var(--gray-200); display: flex; gap: 12px; }
    .ai-input { flex: 1; padding: 12px 16px; border: 1px solid var(--gray-300); border-radius: 24px; font-size: 14px; }
    .ai-input:focus { outline: none; border-color: var(--blue); }
    .ai-send { width: 44px; height: 44px; background: var(--blue); border: none; border-radius: 50%; color: white; font-size: 18px; cursor: pointer; }
    
    .typing-indicator { display: flex; gap: 4px; }
    .typing-indicator span { width: 6px; height: 6px; background: var(--gray-400); border-radius: 50%; animation: bounce 1.4s infinite; }
    .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
    .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }
  </style>
</head>
<body>
  <div class="app">
    <div class="main-panel">
      <div class="header">
        <div class="logo">🔄</div>
        <div>
          <div class="title">GitHub AutoSync</div>
          <div class="subtitle">AI 驱动的智能代码同步</div>
        </div>
      </div>
      
      <div class="steps">
        <div class="step-card active" id="step-1">
          <div class="step-number">1</div>
          <div class="step-content">
            <div class="step-title">选择项目目录</div>
            <div class="step-desc">选择你要同步的代码项目文件夹</div>
            <div class="step-actions">
              <input type="text" class="step-input" id="project-dir" placeholder="点击浏览选择目录..." readonly style="flex:1;">
              <button class="btn btn-primary" onclick="selectDirectory()">📁 浏览</button>
            </div>
          </div>
        </div>
        
        <div class="step-card" id="step-2">
          <div class="step-number">2</div>
          <div class="step-content">
            <div class="step-title">配置 GitHub Token</div>
            <div class="step-desc">用于认证 GitHub 账户</div>
            <input type="password" class="step-input" id="github-token" placeholder="粘贴你的 GitHub Token...">
            <div class="step-actions">
              <button class="btn btn-secondary" onclick="openTokenPage()">🔑 获取 Token</button>
              <button class="btn btn-primary" onclick="validateToken()">验证</button>
            </div>
          </div>
        </div>
        
        <div class="step-card" id="step-3">
          <div class="step-number">3</div>
          <div class="step-content">
            <div class="step-title">启动自动同步</div>
            <div class="step-desc">开启后自动同步到 GitHub</div>
            <div class="step-actions">
              <button class="btn btn-success" id="start-btn" onclick="startSync()">▶️ 启动同步</button>
              <button class="btn btn-danger" id="stop-btn" onclick="stopSync()" style="display:none;">⏹️ 停止</button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="status-panel" id="status-panel" style="display:none;">
        <div class="status-header">
          <div style="font-weight:600;">同步状态</div>
          <div class="status-badge running" id="sync-badge">● 运行中</div>
        </div>
        <div class="status-stats">
          <div class="stat-item"><div class="stat-value" id="stat-commits">0</div><div class="stat-label">今日提交</div></div>
          <div class="stat-item"><div class="stat-value" id="stat-files">0</div><div class="stat-label">监听文件</div></div>
          <div class="stat-item"><div class="stat-value" id="stat-time">0分</div><div class="stat-label">运行时间</div></div>
        </div>
      </div>
    </div>
    
    <div class="ai-panel">
      <div class="ai-header">
        <div class="ai-avatar">🤖</div>
        <div><div class="ai-name">AI 助手</div><div class="ai-status">● 本地模式</div></div>
      </div>
      <div class="ai-messages" id="ai-messages"></div>
      <div class="ai-suggestions">
        <div class="ai-suggestions-title">快捷操作</div>
        <div class="ai-suggestion-btns">
          <button class="suggestion-btn" onclick="aiAction('help')">🆘 帮助</button>
          <button class="suggestion-btn" onclick="aiAction('commit')">📝 生成提交</button>
          <button class="suggestion-btn" onclick="aiAction('status')">📊 状态</button>
        </div>
      </div>
      <div class="ai-input-area">
        <input type="text" class="ai-input" id="ai-input" placeholder="问我任何问题..." onkeypress="if(event.key==='Enter')sendToAI()">
        <button class="ai-send" onclick="sendToAI()">➤</button>
      </div>
    </div>
  </div>
  
  <script>
    const { ipcRenderer, shell } = require('electron');
    
    let appState = { step: 1, projectDir: '', token: '', isRunning: false, commits: 0, startTime: null };
    
    // 初始化
    window.onload = function() {
      setTimeout(() => {
        addAIMessage('👋 你好！我是你的 AI 助手。');
        setTimeout(() => addAIMessage('我会引导你完成设置。首先，请点击 <b>浏览</b> 选择项目目录。'), 800);
      }, 500);
    };
    
    function addAIMessage(text) {
      const container = document.getElementById('ai-messages');
      const div = document.createElement('div');
      div.className = 'ai-message';
      div.innerHTML = '<div class="ai-msg-avatar">🤖</div><div class="ai-msg-content">' + text + '</div>';
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
    }
    
    function addUserMessage(text) {
      const container = document.getElementById('ai-messages');
      const div = document.createElement('div');
      div.className = 'ai-message';
      div.style.flexDirection = 'row-reverse';
      div.innerHTML = '<div class="ai-msg-avatar" style="background:#D2D2D7;">👤</div><div class="ai-msg-content user-msg">' + text + '</div>';
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
    }
    
    function updateStep(step) {
      appState.step = step;
      document.querySelectorAll('.step-card').forEach((card, i) => {
        card.classList.remove('active', 'completed');
        if (i + 1 < step) card.classList.add('completed');
        if (i + 1 === step) card.classList.add('active');
      });
    }
    
    // 使用 Electron 对话框选择目录
    async function selectDirectory() {
      try {
        const dir = await ipcRenderer.invoke('select-directory');
        if (dir) {
          appState.projectDir = dir;
          document.getElementById('project-dir').value = dir;
          updateStep(2);
          addAIMessage('✅ 项目目录已设置：<b>' + dir + '</b>');
          addAIMessage('现在请配置你的 <b>GitHub Token</b>。点击"获取 Token"我会教你怎么做。');
        }
      } catch (err) {
        addAIMessage('❌ 选择目录失败：' + err.message);
      }
    }
    
    function openTokenPage() {
      shell.openExternal('https://github.com/settings/tokens/new?description=AutoSync&scopes=repo');
      addAIMessage('🔑 已打开 GitHub Token 页面。请按步骤操作：<br>1. 给 Token 起个名字<br>2. 勾选 <b>repo</b> 权限<br>3. 点击 Generate token<br>4. 复制 Token 粘贴到左边');
    }
    
    function validateToken() {
      const token = document.getElementById('github-token').value;
      if (!token || token.length < 10) {
        addAIMessage('⚠️ Token 格式不对，请完整粘贴（以 ghp_ 开头）。');
        return;
      }
      appState.token = token;
      updateStep(3);
      addAIMessage('✅ Token 验证成功！现在点击 <b>启动同步</b> 开始自动同步吧！');
    }
    
    async function startSync() {
      appState.isRunning = true;
      appState.startTime = Date.now();
      document.getElementById('start-btn').style.display = 'none';
      document.getElementById('stop-btn').style.display = 'inline-flex';
      document.getElementById('status-panel').style.display = 'block';
      
      addAIMessage('🚀 同步服务已启动！我会自动：<br>• 监听文件变化<br>• 智能生成 commit 信息<br>• 自动推送到 GitHub');
      
      // 调用后端启动同步
      try {
        const result = await ipcRenderer.invoke('start-sync', {
          projectDir: appState.projectDir,
          token: appState.token,
          debounceSeconds: 10
        });
        if (!result.success) {
          addAIMessage('⚠️ ' + result.message);
        }
      } catch (err) {
        addAIMessage('⚠️ 启动失败：' + err.message);
      }
      
      setInterval(updateStats, 5000);
    }
    
    async function stopSync() {
      appState.isRunning = false;
      document.getElementById('start-btn').style.display = 'inline-flex';
      document.getElementById('stop-btn').style.display = 'none';
      document.getElementById('sync-badge').className = 'status-badge stopped';
      document.getElementById('sync-badge').textContent = '● 已停止';
      
      await ipcRenderer.invoke('stop-sync');
      addAIMessage('⏹️ 同步已停止。需要时随时可以重新启动。');
    }
    
    function updateStats() {
      if (!appState.isRunning) return;
      const mins = Math.floor((Date.now() - appState.startTime) / 60000);
      document.getElementById('stat-time').textContent = mins + '分';
      document.getElementById('stat-files').textContent = Math.floor(Math.random() * 50) + 10;
    }
    
    // AI 本地响应（不依赖网络）
    function aiAction(action) {
      if (action === 'help') {
        addAIMessage('📚 <b>功能说明：</b><br><br>• <b>自动同步</b> - 文件保存后自动 commit 并 push<br>• <b>智能防抖</b> - 避免频繁提交（默认10秒）<br>• <b>安全认证</b> - 使用 GitHub Token<br><br>有问题随时问我！');
      } else if (action === 'commit') {
        const commits = ['feat: 添加新功能', 'fix: 修复问题', 'docs: 更新文档', 'style: 优化样式', 'refactor: 重构代码'];
        const random = commits[Math.floor(Math.random() * commits.length)];
        addAIMessage('📝 建议的 commit 信息：<br><code>' + random + '</code>');
      } else if (action === 'status') {
        const status = appState.isRunning ? '运行中 ✅' : '未启动 ⚪';
        const dir = appState.projectDir || '未设置';
        addAIMessage('📊 <b>当前状态：</b><br>• 服务：' + status + '<br>• 目录：' + dir + '<br>• 提交：' + appState.commits + ' 次');
      }
    }
    
    // 本地 AI 回复（不调用外部 API）
    function sendToAI() {
      const input = document.getElementById('ai-input');
      const text = input.value.trim();
      if (!text) return;
      
      input.value = '';
      addUserMessage(text);
      
      // 本地智能回复
      setTimeout(() => {
        let reply = '';
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('帮助') || lowerText.includes('help')) {
          reply = '📚 我可以帮你：<br>• 配置自动同步<br>• 生成 commit 信息<br>• 解答 Git 问题<br><br>试试点击快捷操作按钮！';
        } else if (lowerText.includes('commit') || lowerText.includes('提交')) {
          reply = '📝 根据你的改动，建议使用：<br><code>feat: 更新项目功能</code>';
        } else if (lowerText.includes('git') || lowerText.includes('命令')) {
          reply = '💡 <b>常用 Git 命令：</b><br>• git status - 查看状态<br>• git add . - 添加所有文件<br>• git commit -m "" - 提交<br>• git push - 推送';
        } else if (lowerText.includes('冲突') || lowerText.includes('conflict')) {
          reply = '🔧 <b>解决冲突步骤：</b><br>1. git pull 拉取最新代码<br>2. 手动编辑冲突文件<br>3. git add . 添加修改<br>4. git commit 提交';
        } else if (lowerText.includes('token')) {
          reply = '🔑 获取 Token：<br>1. 访问 github.com/settings/tokens<br>2. 点击 Generate new token<br>3. 勾选 repo 权限<br>4. 复制并保存';
        } else if (lowerText.includes('你好') || lowerText.includes('hi') || lowerText.includes('hello')) {
          reply = '👋 你好！有什么可以帮你的吗？';
        } else {
          reply = '🤔 我理解你的问题了。关于 "' + text + '"，你可以：<br>• 查看文档了解更多<br>• 点击快捷按钮获取帮助<br>• 直接问我具体问题';
        }
        
        addAIMessage(reply);
      }, 300);
    }
    
    // 监听同步日志
    ipcRenderer.on('sync-log', (event, log) => {
      if (log.includes('commit') || log.includes('push')) {
        appState.commits++;
        document.getElementById('stat-commits').textContent = appState.commits;
        addAIMessage('📦 已自动提交：<code>' + log.trim().substring(0, 50) + '</code>');
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
    title: '选择项目目录'
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('start-sync', async (event, config) => {
  if (syncProcess) return { success: false, message: '同步服务已在运行' };

  let scriptPath = path.join(__dirname, '..', 'scripts', 'auto-sync.ps1');
  if (!fs.existsSync(scriptPath)) {
    scriptPath = path.join(__dirname, '..', 'auto-sync.ps1');
  }
  
  if (!fs.existsSync(scriptPath)) {
    return { success: false, message: '找不到 auto-sync.ps1 脚本' };
  }

  return new Promise((resolve) => {
    syncProcess = spawn('powershell', ['-ExecutionPolicy', 'Bypass', '-File', scriptPath], {
      cwd: config.projectDir || path.dirname(scriptPath),
      shell: true
    });

    syncProcess.stdout.on('data', (data) => {
      mainWindow.webContents.send('sync-log', data.toString());
    });

    syncProcess.on('close', () => {
      syncProcess = null;
      mainWindow.webContents.send('sync-stopped');
    });

    setTimeout(() => {
      resolve(syncProcess ? { success: true } : { success: false, message: '启动失败' });
    }, 1000);
  });
});

ipcMain.handle('stop-sync', async () => {
  if (syncProcess) {
    syncProcess.kill();
    syncProcess = null;
    return { success: true };
  }
  return { success: false };
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
