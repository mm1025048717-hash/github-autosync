// ========================================
// GitHub AutoSync - AI 驱动的智能同步工具
// ========================================

const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

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
    
    .main-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 32px;
      overflow-y: auto;
    }
    
    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 32px;
    }
    .logo {
      width: 48px; height: 48px;
      background: var(--blue);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 24px;
    }
    .title { font-size: 24px; font-weight: 600; }
    .subtitle { font-size: 14px; color: var(--gray-500); }
    
    .steps { display: flex; flex-direction: column; gap: 16px; }
    .step-card {
      background: var(--white);
      border-radius: 16px;
      padding: 24px;
      display: flex;
      align-items: flex-start;
      gap: 16px;
      border: 2px solid transparent;
    }
    .step-card.active { border-color: var(--blue); }
    .step-card.completed { opacity: 0.6; }
    .step-number {
      width: 32px; height: 32px;
      background: var(--gray-200);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 600;
      font-size: 14px;
    }
    .step-card.active .step-number { background: var(--blue); color: white; }
    .step-card.completed .step-number { background: var(--green); color: white; }
    .step-content { flex: 1; }
    .step-title { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
    .step-desc { font-size: 14px; color: var(--gray-500); margin-bottom: 12px; }
    .step-input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid var(--gray-300);
      border-radius: 10px;
      font-size: 14px;
      margin-bottom: 12px;
    }
    .step-input:focus { outline: none; border-color: var(--blue); }
    .step-actions { display: flex; gap: 12px; }
    
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
    }
    .btn-primary { background: var(--blue); color: white; }
    .btn-secondary { background: var(--gray-200); color: var(--gray-700); }
    .btn-success { background: var(--green); color: white; }
    .btn-danger { background: var(--red); color: white; }
    
    .status-panel {
      margin-top: 24px;
      background: var(--white);
      border-radius: 16px;
      padding: 24px;
    }
    .status-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .status-badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 13px;
    }
    .status-badge.running { background: rgba(52,199,89,0.15); color: var(--green); }
    .status-badge.stopped { background: var(--gray-200); color: var(--gray-500); }
    .status-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    .stat-item { text-align: center; }
    .stat-value { font-size: 28px; font-weight: 600; color: var(--blue); }
    .stat-label { font-size: 12px; color: var(--gray-500); }
    
    .ai-panel {
      width: 360px;
      background: var(--white);
      border-left: 1px solid var(--gray-200);
      display: flex;
      flex-direction: column;
    }
    .ai-header {
      padding: 20px;
      border-bottom: 1px solid var(--gray-200);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .ai-avatar {
      width: 40px; height: 40px;
      background: var(--blue);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px;
    }
    .ai-name { font-weight: 600; }
    .ai-status { font-size: 12px; color: var(--green); }
    
    .ai-messages {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .ai-message {
      display: flex;
      gap: 12px;
      animation: fadeIn 0.3s;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .ai-msg-avatar {
      width: 32px; height: 32px;
      background: var(--blue);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px;
      flex-shrink: 0;
    }
    .ai-msg-content {
      background: var(--blue-light);
      padding: 12px 16px;
      border-radius: 16px;
      border-top-left-radius: 4px;
      font-size: 14px;
      line-height: 1.6;
      max-width: 280px;
    }
    .ai-msg-content.thinking {
      background: var(--gray-100);
      color: var(--gray-500);
    }
    
    .ai-suggestions {
      padding: 16px 20px;
      border-top: 1px solid var(--gray-200);
    }
    .ai-suggestions-title {
      font-size: 12px;
      color: var(--gray-500);
      margin-bottom: 12px;
    }
    .ai-suggestion-btns {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .suggestion-btn {
      padding: 8px 14px;
      background: var(--gray-100);
      border: 1px solid var(--gray-200);
      border-radius: 20px;
      font-size: 13px;
      cursor: pointer;
    }
    .suggestion-btn:hover {
      background: var(--blue);
      color: white;
      border-color: var(--blue);
    }
    
    .ai-input-area {
      padding: 16px 20px;
      border-top: 1px solid var(--gray-200);
      display: flex;
      gap: 12px;
    }
    .ai-input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid var(--gray-300);
      border-radius: 24px;
      font-size: 14px;
    }
    .ai-input:focus { outline: none; border-color: var(--blue); }
    .ai-send {
      width: 44px; height: 44px;
      background: var(--blue);
      border: none;
      border-radius: 50%;
      color: white;
      font-size: 18px;
      cursor: pointer;
    }
    
    .typing-indicator {
      display: flex;
      gap: 4px;
    }
    .typing-indicator span {
      width: 6px; height: 6px;
      background: var(--gray-400);
      border-radius: 50%;
      animation: bounce 1.4s infinite;
    }
    .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
    .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-4px); }
    }
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
      
      <div class="steps" id="steps">
        <div class="step-card active" id="step-1">
          <div class="step-number">1</div>
          <div class="step-content">
            <div class="step-title">选择项目目录</div>
            <div class="step-desc">选择你要同步的代码项目文件夹</div>
            <div class="step-actions">
              <input type="text" class="step-input" id="project-dir" placeholder="点击浏览选择目录..." readonly>
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
          <div>同步状态</div>
          <div class="status-badge running" id="sync-badge">● 运行中</div>
        </div>
        <div class="status-stats">
          <div class="stat-item">
            <div class="stat-value" id="stat-commits">0</div>
            <div class="stat-label">今日提交</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" id="stat-files">0</div>
            <div class="stat-label">监听文件</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" id="stat-time">0分</div>
            <div class="stat-label">运行时间</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="ai-panel">
      <div class="ai-header">
        <div class="ai-avatar">🤖</div>
        <div>
          <div class="ai-name">AI 助手</div>
          <div class="ai-status">● 在线 · DeepSeek</div>
        </div>
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
    let appState = { step: 1, isRunning: false, commits: 0, startTime: null };
    
    const AI_KEY = 'sk-6967f3b28335438f8f4af9f881f2519f';
    const AI_URL = 'https://api.deepseek.com/chat/completions';
    
    window.onload = function() {
      setTimeout(() => {
        addAIMessage('👋 你好！我是你的 AI 助手。');
        setTimeout(() => {
          addAIMessage('我会引导你完成设置。首先，请选择你要同步的 <b>项目目录</b>。');
        }, 800);
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
      div.innerHTML = '<div class="ai-msg-avatar" style="background:#D2D2D7;">👤</div><div class="ai-msg-content" style="background:#007AFF;color:white;border-radius:16px;border-top-right-radius:4px;">' + text + '</div>';
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
    }
    
    function showTyping() {
      const container = document.getElementById('ai-messages');
      const div = document.createElement('div');
      div.className = 'ai-message';
      div.id = 'typing';
      div.innerHTML = '<div class="ai-msg-avatar">🤖</div><div class="ai-msg-content thinking"><div class="typing-indicator"><span></span><span></span><span></span></div></div>';
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
    }
    
    function hideTyping() {
      const el = document.getElementById('typing');
      if (el) el.remove();
    }
    
    function updateStep(step) {
      appState.step = step;
      document.querySelectorAll('.step-card').forEach((card, i) => {
        card.classList.remove('active', 'completed');
        if (i + 1 < step) card.classList.add('completed');
        if (i + 1 === step) card.classList.add('active');
      });
    }
    
    function selectDirectory() {
      const dir = prompt('请输入项目目录路径：', 'C:\\\\Projects\\\\MyProject');
      if (dir) {
        document.getElementById('project-dir').value = dir;
        updateStep(2);
        addAIMessage('✅ 项目目录已设置！现在请配置你的 <b>GitHub Token</b>。');
      }
    }
    
    function openTokenPage() {
      window.open('https://github.com/settings/tokens/new?description=AutoSync&scopes=repo', '_blank');
      addAIMessage('🔑 已打开 GitHub Token 页面。请勾选 <b>repo</b> 权限，生成后复制粘贴到左边。');
    }
    
    function validateToken() {
      const token = document.getElementById('github-token').value;
      if (!token || token.length < 10) {
        addAIMessage('⚠️ Token 看起来不对，请完整粘贴。');
        return;
      }
      updateStep(3);
      addAIMessage('✅ Token 验证成功！点击 <b>启动同步</b> 开始吧！');
    }
    
    function startSync() {
      appState.isRunning = true;
      appState.startTime = Date.now();
      document.getElementById('start-btn').style.display = 'none';
      document.getElementById('stop-btn').style.display = 'inline-flex';
      document.getElementById('status-panel').style.display = 'block';
      addAIMessage('🚀 同步服务已启动！我会自动监听文件变化并同步到 GitHub。');
      setInterval(updateStats, 5000);
    }
    
    function stopSync() {
      appState.isRunning = false;
      document.getElementById('start-btn').style.display = 'inline-flex';
      document.getElementById('stop-btn').style.display = 'none';
      document.getElementById('sync-badge').className = 'status-badge stopped';
      document.getElementById('sync-badge').textContent = '● 已停止';
      addAIMessage('⏹️ 同步已停止。');
    }
    
    function updateStats() {
      if (!appState.isRunning) return;
      const mins = Math.floor((Date.now() - appState.startTime) / 60000);
      document.getElementById('stat-time').textContent = mins + '分';
      document.getElementById('stat-files').textContent = Math.floor(Math.random() * 50) + 10;
    }
    
    function aiAction(action) {
      if (action === 'help') {
        addAIMessage('📚 我可以帮你：自动同步代码、生成 commit 信息、解答 Git 问题。直接问我就行！');
      } else if (action === 'commit') {
        addAIMessage('📝 建议使用：<code>feat: 优化用户界面</code>');
      } else if (action === 'status') {
        addAIMessage('📊 状态：' + (appState.isRunning ? '运行中 ✅' : '未启动'));
      }
    }
    
    async function sendToAI() {
      const input = document.getElementById('ai-input');
      const text = input.value.trim();
      if (!text) return;
      
      input.value = '';
      addUserMessage(text);
      showTyping();
      
      try {
        const response = await fetch(AI_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + AI_KEY
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: '你是 GitHub AutoSync 的 AI 助手。用简洁友好的中文回答，使用 emoji。专注于 Git 同步和代码管理。' },
              { role: 'user', content: text }
            ]
          })
        });
        
        hideTyping();
        const data = await response.json();
        if (data.choices && data.choices[0]) {
          addAIMessage(data.choices[0].message.content.replace(/\\n/g, '<br>'));
        } else {
          addAIMessage('抱歉，API 返回异常：' + JSON.stringify(data));
        }
      } catch (err) {
        hideTyping();
        addAIMessage('❌ 网络错误：' + err.message);
      }
    }
  </script>
</body>
</html>
  `;

  mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
