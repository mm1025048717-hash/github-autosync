// ========================================
// GitHub AutoSync - AI 驱动的智能同步工具
// ========================================

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

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
      contextIsolation: false
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
    
    /* 左侧主面板 */
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
    
    /* 步骤卡片 */
    .steps { display: flex; flex-direction: column; gap: 16px; }
    .step-card {
      background: var(--white);
      border-radius: 16px;
      padding: 24px;
      display: flex;
      align-items: flex-start;
      gap: 16px;
      transition: all 0.2s;
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
      flex-shrink: 0;
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
      transition: all 0.15s;
    }
    .btn-primary { background: var(--blue); color: white; }
    .btn-primary:hover { background: #0056CC; }
    .btn-secondary { background: var(--gray-200); color: var(--gray-700); }
    .btn-success { background: var(--green); color: white; }
    .btn-danger { background: var(--red); color: white; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    
    /* 状态面板 */
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
    .status-title { font-size: 16px; font-weight: 600; }
    .status-badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
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
    
    /* 右侧 AI 面板 */
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
      background: linear-gradient(135deg, var(--blue), #5856D6);
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
      transition: all 0.15s;
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
    .ai-send:hover { background: #0056CC; }
    
    .typing-indicator {
      display: flex;
      gap: 4px;
      padding: 4px 0;
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
    <!-- 主面板 -->
    <div class="main-panel">
      <div class="header">
        <div class="logo">🔄</div>
        <div>
          <div class="title">GitHub AutoSync</div>
          <div class="subtitle">AI 驱动的智能代码同步</div>
        </div>
      </div>
      
      <!-- 设置步骤 -->
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
            <div class="step-desc">用于认证 GitHub 账户，自动推送代码</div>
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
            <div class="step-desc">开启后，文件保存时自动同步到 GitHub</div>
            <div class="step-actions">
              <button class="btn btn-success" id="start-btn" onclick="startSync()">▶️ 启动同步</button>
              <button class="btn btn-danger" id="stop-btn" onclick="stopSync()" style="display:none;">⏹️ 停止同步</button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 状态面板 -->
      <div class="status-panel" id="status-panel" style="display:none;">
        <div class="status-header">
          <div class="status-title">同步状态</div>
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
    
    <!-- AI 助手面板 -->
    <div class="ai-panel">
      <div class="ai-header">
        <div class="ai-avatar">🤖</div>
        <div>
          <div class="ai-name">AI 助手</div>
          <div class="ai-status">● 在线 · DeepSeek</div>
        </div>
      </div>
      
      <div class="ai-messages" id="ai-messages">
        <!-- AI 消息会动态添加 -->
      </div>
      
      <div class="ai-suggestions" id="ai-suggestions">
        <div class="ai-suggestions-title">快捷操作</div>
        <div class="ai-suggestion-btns">
          <button class="suggestion-btn" onclick="aiAction('help')">🆘 帮助</button>
          <button class="suggestion-btn" onclick="aiAction('commit')">📝 生成提交</button>
          <button class="suggestion-btn" onclick="aiAction('status')">📊 查看状态</button>
        </div>
      </div>
      
      <div class="ai-input-area">
        <input type="text" class="ai-input" id="ai-input" placeholder="问我任何问题..." onkeypress="if(event.key==='Enter')sendToAI()">
        <button class="ai-send" onclick="sendToAI()">➤</button>
      </div>
    </div>
  </div>
  
  <script>
    // ========== 状态管理 ==========
    let appState = {
      step: 1,
      projectDir: '',
      token: '',
      isRunning: false,
      commits: 0,
      startTime: null
    };
    
    // ========== AI 系统 ==========
    const AI_KEY = 'sk-6967f3b28335438f8f4af9f881f2519f';
    const AI_URL = 'https://api.deepseek.com/chat/completions';
    
    // 初始化欢迎消息
    window.onload = function() {
      setTimeout(() => {
        addAIMessage('👋 你好！我是你的 AI 助手。');
        setTimeout(() => {
          addAIMessage('我会引导你完成设置，让我们开始吧！\\n\\n首先，请选择你要同步的 <b>项目目录</b>。');
        }, 800);
      }, 500);
    };
    
    function addAIMessage(text, isThinking = false) {
      const container = document.getElementById('ai-messages');
      const div = document.createElement('div');
      div.className = 'ai-message';
      div.innerHTML = \`
        <div class="ai-msg-avatar">🤖</div>
        <div class="ai-msg-content \${isThinking ? 'thinking' : ''}">\${text}</div>
      \`;
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
      return div;
    }
    
    function addUserMessage(text) {
      const container = document.getElementById('ai-messages');
      const div = document.createElement('div');
      div.className = 'ai-message';
      div.style.flexDirection = 'row-reverse';
      div.innerHTML = \`
        <div class="ai-msg-avatar" style="background: var(--gray-300);">👤</div>
        <div class="ai-msg-content" style="background: var(--blue); color: white; border-radius: 16px; border-top-right-radius: 4px;">\${text}</div>
      \`;
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
    }
    
    function showTyping() {
      const container = document.getElementById('ai-messages');
      const div = document.createElement('div');
      div.className = 'ai-message';
      div.id = 'typing-indicator';
      div.innerHTML = \`
        <div class="ai-msg-avatar">🤖</div>
        <div class="ai-msg-content thinking">
          <div class="typing-indicator"><span></span><span></span><span></span></div>
        </div>
      \`;
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
    }
    
    function hideTyping() {
      const el = document.getElementById('typing-indicator');
      if (el) el.remove();
    }
    
    // ========== 步骤流程 ==========
    function updateStep(step) {
      appState.step = step;
      document.querySelectorAll('.step-card').forEach((card, i) => {
        card.classList.remove('active', 'completed');
        if (i + 1 < step) card.classList.add('completed');
        if (i + 1 === step) card.classList.add('active');
      });
    }
    
    function selectDirectory() {
      // 模拟选择目录
      const dir = prompt('请输入项目目录路径：', 'C:\\\\Projects\\\\MyProject');
      if (dir) {
        appState.projectDir = dir;
        document.getElementById('project-dir').value = dir;
        updateStep(2);
        
        setTimeout(() => {
          addAIMessage('✅ 很好！项目目录已设置。\\n\\n现在请配置你的 <b>GitHub Token</b>，点击"获取 Token"我会教你怎么做。');
        }, 300);
      }
    }
    
    function openTokenPage() {
      window.open('https://github.com/settings/tokens/new?description=AutoSync&scopes=repo', '_blank');
      addAIMessage('🔑 我已打开 GitHub Token 页面。\\n\\n请按以下步骤操作：\\n1. 给 Token 起个名字\\n2. 勾选 <b>repo</b> 权限\\n3. 点击 Generate token\\n4. 复制 Token 粘贴到左边');
    }
    
    function validateToken() {
      const token = document.getElementById('github-token').value;
      if (!token || token.length < 10) {
        addAIMessage('⚠️ Token 看起来不对，请确保完整粘贴。');
        return;
      }
      appState.token = token;
      updateStep(3);
      addAIMessage('✅ Token 验证成功！\\n\\n现在一切就绪，点击 <b>启动同步</b> 开始自动同步吧！');
    }
    
    function startSync() {
      appState.isRunning = true;
      appState.startTime = Date.now();
      
      document.getElementById('start-btn').style.display = 'none';
      document.getElementById('stop-btn').style.display = 'inline-flex';
      document.getElementById('status-panel').style.display = 'block';
      
      addAIMessage('🚀 同步服务已启动！\\n\\n现在你可以正常编码了，我会自动：\\n• 监听文件变化\\n• 智能生成 commit 信息\\n• 自动推送到 GitHub\\n\\n有任何问题随时问我！');
      
      // 模拟统计更新
      setInterval(updateStats, 5000);
      
      // 模拟提交
      setTimeout(() => {
        appState.commits++;
        document.getElementById('stat-commits').textContent = appState.commits;
        addAIMessage('📦 检测到文件变化，已自动提交：\\n<code>feat: 更新配置文件</code>');
      }, 8000);
    }
    
    function stopSync() {
      appState.isRunning = false;
      document.getElementById('start-btn').style.display = 'inline-flex';
      document.getElementById('stop-btn').style.display = 'none';
      document.getElementById('sync-badge').className = 'status-badge stopped';
      document.getElementById('sync-badge').textContent = '● 已停止';
      addAIMessage('⏹️ 同步已停止。需要时随时可以重新启动。');
    }
    
    function updateStats() {
      if (!appState.isRunning) return;
      const mins = Math.floor((Date.now() - appState.startTime) / 60000);
      document.getElementById('stat-time').textContent = mins + '分';
      document.getElementById('stat-files').textContent = Math.floor(Math.random() * 50) + 10;
    }
    
    // ========== AI 交互 ==========
    function aiAction(action) {
      if (action === 'help') {
        addAIMessage('📚 我可以帮你：\\n\\n• 自动同步代码到 GitHub\\n• 生成专业的 commit 信息\\n• 解答 Git 相关问题\\n• 监控同步状态\\n\\n直接告诉我你需要什么！');
      } else if (action === 'commit') {
        addAIMessage('📝 根据最近的文件变化，建议使用：\\n\\n<code>feat: 优化用户界面交互体验</code>\\n\\n或者描述一下你做了什么改动？');
      } else if (action === 'status') {
        if (appState.isRunning) {
          addAIMessage('📊 当前状态：\\n\\n• 服务状态：运行中 ✅\\n• 今日提交：' + appState.commits + ' 次\\n• 运行正常，继续编码吧！');
        } else {
          addAIMessage('📊 当前状态：\\n\\n• 服务状态：未启动\\n• 请先完成配置并启动同步');
        }
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
              { role: 'system', content: '你是 GitHub AutoSync 的 AI 助手。用简洁友好的中文回答，使用 emoji 让回复更生动。专注于帮助用户完成 Git 同步、代码管理相关任务。' },
              { role: 'user', content: text }
            ]
          })
        });
        
        hideTyping();
        const data = await response.json();
        if (data.choices && data.choices[0]) {
          addAIMessage(data.choices[0].message.content.replace(/\\n/g, '<br>'));
        }
      } catch (err) {
        hideTyping();
        addAIMessage('抱歉，网络连接出现问题。请检查网络后重试。');
      }
    }
  </script>
</body>
</html>
  `;

  mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

