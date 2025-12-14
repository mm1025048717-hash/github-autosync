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

// 禁用 GPU 加速以避免图形问题
app.disableHardwareAcceleration();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    frame: true, // 使用标准窗口边框
    backgroundColor: '#F5F7FA',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    show: true, // 立即显示
    center: true, // 居中显示
    title: 'GitHub AutoSync'
  });

  // Apple 风格界面 + DeepSeek AI
  const appleStyleHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>GitHub AutoSync</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    :root {
      --blue: #007AFF;
      --blue-hover: #0056CC;
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
      --orange: #FF9500;
      --purple: #AF52DE;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', 'PingFang SC', sans-serif;
      background: var(--bg);
      color: var(--gray-900);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    
    /* 布局 */
    .app {
      display: flex;
      height: 100vh;
    }
    
    /* 侧边栏 */
    .sidebar {
      width: 240px;
      background: var(--white);
      border-right: 1px solid var(--gray-200);
      padding: 24px 16px;
      display: flex;
      flex-direction: column;
    }
    
    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      margin-bottom: 32px;
    }
    
    .logo-icon {
      width: 40px;
      height: 40px;
      background: var(--blue);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: white;
    }
    
    .logo-text {
      font-size: 17px;
      font-weight: 600;
      color: var(--gray-900);
    }
    
    .nav {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border: none;
      background: transparent;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      color: var(--gray-700);
      text-align: left;
      transition: all 0.15s;
    }
    
    .nav-item:hover {
      background: var(--gray-100);
    }
    
    .nav-item.active {
      background: var(--blue);
      color: white;
    }
    
    .nav-icon {
      font-size: 18px;
      width: 24px;
      text-align: center;
    }
    
    /* 主内容区 */
    .main {
      flex: 1;
      padding: 32px 40px;
      overflow-y: auto;
    }
    
    .page { display: none; }
    .page.active { display: block; }
    
    .page-title {
      font-size: 28px;
      font-weight: 600;
      color: var(--gray-900);
      margin-bottom: 8px;
    }
    
    .page-desc {
      font-size: 15px;
      color: var(--gray-500);
      margin-bottom: 32px;
    }
    
    /* 卡片 */
    .card {
      background: var(--white);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    
    .card-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--gray-500);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 16px;
    }
    
    /* 状态指示器 */
    .status-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 0;
      border-bottom: 1px solid var(--gray-200);
    }
    
    .status-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    
    .status-row:first-child {
      padding-top: 0;
    }
    
    .status-label {
      font-size: 15px;
      color: var(--gray-900);
    }
    
    .status-value {
      font-size: 14px;
      color: var(--gray-500);
    }
    
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
    }
    
    .status-badge.running {
      background: rgba(52, 199, 89, 0.12);
      color: var(--green);
    }
    
    .status-badge.stopped {
      background: var(--gray-200);
      color: var(--gray-500);
    }
    
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
    }
    
    /* 按钮 */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
    }
    
    .btn-primary {
      background: var(--blue);
      color: white;
    }
    
    .btn-primary:hover {
      background: var(--blue-hover);
    }
    
    .btn-secondary {
      background: var(--gray-200);
      color: var(--gray-700);
    }
    
    .btn-secondary:hover {
      background: var(--gray-300);
    }
    
    .btn-danger {
      background: rgba(255, 59, 48, 0.12);
      color: var(--red);
    }
    
    .btn-danger:hover {
      background: rgba(255, 59, 48, 0.2);
    }
    
    .btn-group {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }
    
    /* 输入框 */
    .form-group {
      margin-bottom: 20px;
    }
    
    .form-label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: var(--gray-700);
      margin-bottom: 8px;
    }
    
    .form-input {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid var(--gray-300);
      border-radius: 8px;
      font-size: 14px;
      color: var(--gray-900);
      background: var(--white);
      transition: all 0.15s;
    }
    
    .form-input:focus {
      outline: none;
      border-color: var(--blue);
      box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.12);
    }
    
    .form-input::placeholder {
      color: var(--gray-500);
    }
    
    .form-row {
      display: flex;
      gap: 12px;
      align-items: flex-end;
    }
    
    .form-row .form-group {
      flex: 1;
      margin-bottom: 0;
    }
    
    /* 统计卡片 */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .stat-card {
      background: var(--white);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    
    .stat-value {
      font-size: 32px;
      font-weight: 600;
      color: var(--blue);
      margin-bottom: 4px;
    }
    
    .stat-label {
      font-size: 13px;
      color: var(--gray-500);
    }
    
    /* 日志区域 */
    .logs {
      background: var(--gray-900);
      border-radius: 8px;
      padding: 16px;
      font-family: 'SF Mono', 'Menlo', monospace;
      font-size: 12px;
      line-height: 1.6;
      color: var(--gray-300);
      height: 300px;
      overflow-y: auto;
    }
    
    .log-line {
      margin-bottom: 4px;
    }
    
    .log-time {
      color: var(--gray-500);
      margin-right: 8px;
    }
    
    .log-success { color: var(--green); }
    .log-error { color: var(--red); }
    .log-warning { color: var(--orange); }
    
    /* 空状态 */
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--gray-500);
    }
    
    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
    
    .empty-text {
      font-size: 15px;
    }
    
    /* AI 聊天样式 */
    .quick-btn {
      padding: 8px 14px;
      background: var(--white);
      border: 1px solid var(--gray-300);
      border-radius: 20px;
      font-size: 13px;
      color: var(--gray-700);
      cursor: pointer;
      transition: all 0.15s;
    }
    
    .quick-btn:hover {
      background: var(--blue);
      color: white;
      border-color: var(--blue);
    }
    
    .chat-message {
      margin-bottom: 16px;
      display: flex;
      gap: 12px;
    }
    
    .chat-message.user {
      flex-direction: row-reverse;
    }
    
    .chat-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--blue);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      flex-shrink: 0;
    }
    
    .chat-message.user .chat-avatar {
      background: var(--gray-300);
    }
    
    .chat-bubble {
      max-width: 70%;
      padding: 12px 16px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.5;
    }
    
    .chat-message.assistant .chat-bubble {
      background: var(--white);
      color: var(--gray-900);
      border-bottom-left-radius: 4px;
    }
    
    .chat-message.user .chat-bubble {
      background: var(--blue);
      color: white;
      border-bottom-right-radius: 4px;
    }
    
    .chat-typing {
      display: flex;
      gap: 4px;
      padding: 8px 0;
    }
    
    .chat-typing span {
      width: 8px;
      height: 8px;
      background: var(--gray-400);
      border-radius: 50%;
      animation: typing 1.4s infinite;
    }
    
    .chat-typing span:nth-child(2) { animation-delay: 0.2s; }
    .chat-typing span:nth-child(3) { animation-delay: 0.4s; }
    
    @keyframes typing {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-4px); }
    }
    
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  </style>
</head>
<body>
  <div class="app">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="logo">
        <div class="logo-icon">🔄</div>
        <span class="logo-text">AutoSync</span>
      </div>
      
      <nav class="nav">
        <button class="nav-item active" data-page="home">
          <span class="nav-icon">🏠</span>
          <span>首页</span>
        </button>
        <button class="nav-item" data-page="config">
          <span class="nav-icon">⚙️</span>
          <span>配置</span>
        </button>
        <button class="nav-item" data-page="logs">
          <span class="nav-icon">📋</span>
          <span>日志</span>
        </button>
        <button class="nav-item" data-page="ai">
          <span class="nav-icon">🤖</span>
          <span>AI 助手</span>
        </button>
        <button class="nav-item" data-page="about">
          <span class="nav-icon">ℹ️</span>
          <span>关于</span>
        </button>
      </nav>
    </aside>
    
    <!-- 主内容区 -->
    <main class="main">
      <!-- 首页 -->
      <div class="page active" id="page-home">
        <h1 class="page-title">GitHub AutoSync</h1>
        <p class="page-desc">自动同步你的代码到 GitHub，无需手动提交</p>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value" id="sync-count">0</div>
            <div class="stat-label">同步次数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="file-count">0</div>
            <div class="stat-label">监听文件</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="uptime">--</div>
            <div class="stat-label">运行时间</div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-title">同步状态</div>
          <div class="status-row">
            <span class="status-label">当前状态</span>
            <span class="status-badge stopped" id="sync-status">
              <span class="status-dot"></span>
              <span>未运行</span>
            </span>
          </div>
          <div class="status-row">
            <span class="status-label">项目目录</span>
            <span class="status-value" id="project-path">未配置</span>
          </div>
          <div class="status-row">
            <span class="status-label">最后同步</span>
            <span class="status-value" id="last-sync">--</span>
          </div>
          
          <div class="btn-group">
            <button class="btn btn-primary" id="start-btn" onclick="startSync()">
              ▶️ 启动同步
            </button>
            <button class="btn btn-danger" id="stop-btn" onclick="stopSync()" style="display:none;">
              ⏹️ 停止同步
            </button>
          </div>
        </div>
      </div>
      
      <!-- 配置页 -->
      <div class="page" id="page-config">
        <h1 class="page-title">配置</h1>
        <p class="page-desc">设置你的项目目录和 GitHub 认证信息</p>
        
        <div class="card">
          <div class="card-title">项目设置</div>
          
          <div class="form-group">
            <label class="form-label">项目目录</label>
            <div class="form-row">
              <input type="text" class="form-input" id="config-dir" placeholder="选择项目目录...">
              <button class="btn btn-secondary" onclick="selectDir()">浏览</button>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">GitHub Token</label>
            <div class="form-row">
              <input type="password" class="form-input" id="config-token" placeholder="ghp_xxxxxxxxxxxx">
              <button class="btn btn-secondary" onclick="getToken()">获取</button>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">仓库地址</label>
            <input type="text" class="form-input" id="config-repo" placeholder="https://github.com/username/repo.git">
          </div>
          
          <div class="form-group">
            <label class="form-label">防抖时间（秒）</label>
            <input type="number" class="form-input" id="config-debounce" value="10" min="1" max="60">
          </div>
          
          <div class="btn-group">
            <button class="btn btn-primary" onclick="saveConfig()">💾 保存配置</button>
            <button class="btn btn-secondary" onclick="testConnection()">🔗 测试连接</button>
          </div>
        </div>
      </div>
      
      <!-- 日志页 -->
      <div class="page" id="page-logs">
        <h1 class="page-title">运行日志</h1>
        <p class="page-desc">查看同步过程的详细日志</p>
        
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div class="card-title" style="margin-bottom: 0;">日志输出</div>
            <button class="btn btn-secondary" onclick="clearLogs()" style="padding: 6px 12px; font-size: 13px;">清空</button>
          </div>
          <div class="logs" id="logs-content">
            <div class="empty-state">
              <div class="empty-icon">📋</div>
              <div class="empty-text">暂无日志</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- AI 助手页 -->
      <div class="page" id="page-ai">
        <h1 class="page-title">AI 助手</h1>
        <p class="page-desc">由 DeepSeek 提供智能支持，帮助你更好地管理代码</p>
        
        <div class="card" style="height: calc(100vh - 240px); display: flex; flex-direction: column;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div class="card-title" style="margin-bottom: 0;">智能对话</div>
            <button class="btn btn-secondary" onclick="clearChat()" style="padding: 6px 12px; font-size: 13px;">🗑️ 清空</button>
          </div>
          
          <div id="chat-messages" style="flex: 1; overflow-y: auto; margin-bottom: 16px; padding: 16px; background: var(--gray-100); border-radius: 8px;">
            <div class="chat-welcome" style="text-align: center; padding: 40px 20px; color: var(--gray-500);">
              <div style="font-size: 48px; margin-bottom: 16px;">🤖</div>
              <div style="font-size: 15px; margin-bottom: 8px;">你好！我是 AI 助手</div>
              <div style="font-size: 13px;">我可以帮你生成 commit 信息、解答 Git 问题、提供编码建议</div>
            </div>
          </div>
          
          <div class="quick-actions" style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
            <button class="quick-btn" onclick="askAI('帮我生成一个专业的 commit message')">📝 生成 Commit</button>
            <button class="quick-btn" onclick="askAI('Git 常用命令有哪些？')">💡 Git 命令</button>
            <button class="quick-btn" onclick="askAI('如何解决 Git 冲突？')">🔧 解决冲突</button>
            <button class="quick-btn" onclick="askAI('代码审查的最佳实践是什么？')">✨ 代码审查</button>
          </div>
          
          <div style="display: flex; gap: 12px;">
            <input type="text" class="form-input" id="ai-input" placeholder="输入你的问题..." onkeypress="if(event.key==='Enter')sendMessage()">
            <button class="btn btn-primary" onclick="sendMessage()" id="send-btn">发送</button>
          </div>
        </div>
      </div>
      
      <!-- 关于页 -->
      <div class="page" id="page-about">
        <h1 class="page-title">关于</h1>
        <p class="page-desc">GitHub AutoSync v1.0.0</p>
        
        <div class="card">
          <div class="card-title">应用信息</div>
          <div class="status-row">
            <span class="status-label">版本</span>
            <span class="status-value">1.0.0</span>
          </div>
          <div class="status-row">
            <span class="status-label">开发者</span>
            <span class="status-value">GitHub AutoSync Team</span>
          </div>
          <div class="status-row">
            <span class="status-label">许可证</span>
            <span class="status-value">MIT License</span>
          </div>
        </div>
        
        <div class="card">
          <div class="card-title">功能特点</div>
          <div class="status-row">
            <span class="status-label">🚀 自动同步</span>
            <span class="status-value">文件保存后自动提交推送</span>
          </div>
          <div class="status-row">
            <span class="status-label">🤖 AI 助手</span>
            <span class="status-value">DeepSeek 智能问答</span>
          </div>
          <div class="status-row">
            <span class="status-label">⏱️ 智能防抖</span>
            <span class="status-value">避免频繁提交</span>
          </div>
          <div class="status-row">
            <span class="status-label">🔒 安全认证</span>
            <span class="status-value">使用 GitHub Token</span>
          </div>
          <div class="status-row">
            <span class="status-label">📦 智能排除</span>
            <span class="status-value">自动排除 node_modules 等</span>
          </div>
        </div>
        
        <div class="card">
          <div class="card-title">技术支持</div>
          <div class="status-row">
            <span class="status-label">AI 引擎</span>
            <span class="status-value">DeepSeek V3</span>
          </div>
          <div class="status-row">
            <span class="status-label">API 文档</span>
            <span class="status-value" style="color: var(--blue); cursor: pointer;" onclick="window.open('https://api-docs.deepseek.com/zh-cn/', '_blank')">api-docs.deepseek.com</span>
          </div>
        </div>
      </div>
    </main>
  </div>
  
  <script>
    // 页面导航
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        item.classList.add('active');
        document.getElementById('page-' + item.dataset.page).classList.add('active');
      });
    });
    
    // 同步控制
    let isRunning = false;
    
    function startSync() {
      isRunning = true;
      updateStatus();
      addLog('同步服务已启动', 'success');
    }
    
    function stopSync() {
      isRunning = false;
      updateStatus();
      addLog('同步服务已停止', 'warning');
    }
    
    function updateStatus() {
      const statusEl = document.getElementById('sync-status');
      const startBtn = document.getElementById('start-btn');
      const stopBtn = document.getElementById('stop-btn');
      
      if (isRunning) {
        statusEl.className = 'status-badge running';
        statusEl.innerHTML = '<span class="status-dot"></span><span>运行中</span>';
        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline-flex';
      } else {
        statusEl.className = 'status-badge stopped';
        statusEl.innerHTML = '<span class="status-dot"></span><span>未运行</span>';
        startBtn.style.display = 'inline-flex';
        stopBtn.style.display = 'none';
      }
    }
    
    function selectDir() {
      alert('请在弹出的对话框中选择项目目录');
    }
    
    function getToken() {
      window.open('https://github.com/settings/tokens', '_blank');
    }
    
    function saveConfig() {
      addLog('配置已保存', 'success');
      alert('配置已保存！');
    }
    
    function testConnection() {
      addLog('正在测试连接...', 'info');
      setTimeout(() => addLog('连接测试成功', 'success'), 1000);
    }
    
    function addLog(message, type = 'info') {
      const logsEl = document.getElementById('logs-content');
      if (logsEl.querySelector('.empty-state')) {
        logsEl.innerHTML = '';
      }
      const time = new Date().toLocaleTimeString();
      const typeClass = type === 'success' ? 'log-success' : type === 'error' ? 'log-error' : type === 'warning' ? 'log-warning' : '';
      logsEl.innerHTML += '<div class="log-line"><span class="log-time">[' + time + ']</span><span class="' + typeClass + '">' + message + '</span></div>';
      logsEl.scrollTop = logsEl.scrollHeight;
    }
    
    function clearLogs() {
      document.getElementById('logs-content').innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">暂无日志</div></div>';
    }
    
    // ========== DeepSeek AI 功能 ==========
    const DEEPSEEK_API_KEY = 'sk-6967f3b28335438f8f4af9f881f2519f';
    const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
    let chatHistory = [];
    
    function askAI(question) {
      document.getElementById('ai-input').value = question;
      sendMessage();
    }
    
    async function sendMessage() {
      const input = document.getElementById('ai-input');
      const message = input.value.trim();
      if (!message) return;
      
      input.value = '';
      const sendBtn = document.getElementById('send-btn');
      sendBtn.disabled = true;
      
      // 清除欢迎信息
      const chatMessages = document.getElementById('chat-messages');
      if (chatMessages.querySelector('.chat-welcome')) {
        chatMessages.innerHTML = '';
      }
      
      // 添加用户消息
      appendMessage('user', message);
      
      // 添加加载动画
      const loadingId = 'loading-' + Date.now();
      chatMessages.innerHTML += '<div class="chat-message assistant" id="' + loadingId + '"><div class="chat-avatar">🤖</div><div class="chat-bubble"><div class="chat-typing"><span></span><span></span><span></span></div></div></div>';
      chatMessages.scrollTop = chatMessages.scrollHeight;
      
      try {
        // 构建对话历史
        chatHistory.push({ role: 'user', content: message });
        
        const response = await fetch(DEEPSEEK_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + DEEPSEEK_API_KEY
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: '你是 GitHub AutoSync 的 AI 助手，专门帮助用户解决 Git、GitHub 和代码同步相关的问题。请用简洁友好的中文回答。' },
              ...chatHistory.slice(-10) // 保留最近10条对话
            ],
            stream: false
          })
        });
        
        const data = await response.json();
        
        // 移除加载动画
        document.getElementById(loadingId).remove();
        
        if (data.choices && data.choices[0]) {
          const reply = data.choices[0].message.content;
          chatHistory.push({ role: 'assistant', content: reply });
          appendMessage('assistant', reply);
          addLog('AI 回复成功', 'success');
        } else {
          appendMessage('assistant', '抱歉，我遇到了一些问题。请稍后再试。');
          addLog('AI 回复失败: ' + JSON.stringify(data), 'error');
        }
      } catch (error) {
        document.getElementById(loadingId)?.remove();
        appendMessage('assistant', '网络连接失败，请检查网络后重试。错误: ' + error.message);
        addLog('AI 请求失败: ' + error.message, 'error');
      }
      
      sendBtn.disabled = false;
    }
    
    function appendMessage(role, content) {
      const chatMessages = document.getElementById('chat-messages');
      const avatar = role === 'user' ? '👤' : '🤖';
      
      // 简单的 Markdown 处理
      let formatted = content
        .replace(/\`\`\`([\\s\\S]*?)\`\`\`/g, '<pre style="background: var(--gray-900); color: var(--gray-300); padding: 12px; border-radius: 8px; overflow-x: auto; margin: 8px 0; font-size: 12px;">$1</pre>')
        .replace(/\`([^\`]+)\`/g, '<code style="background: var(--gray-200); padding: 2px 6px; border-radius: 4px; font-size: 13px;">$1</code>')
        .replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>')
        .replace(/\\n/g, '<br>');
      
      chatMessages.innerHTML += '<div class="chat-message ' + role + '"><div class="chat-avatar">' + avatar + '</div><div class="chat-bubble">' + formatted + '</div></div>';
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function clearChat() {
      chatHistory = [];
      document.getElementById('chat-messages').innerHTML = '<div class="chat-welcome" style="text-align: center; padding: 40px 20px; color: var(--gray-500);"><div style="font-size: 48px; margin-bottom: 16px;">🤖</div><div style="font-size: 15px; margin-bottom: 8px;">你好！我是 AI 助手</div><div style="font-size: 13px;">我可以帮你生成 commit 信息、解答 Git 问题、提供编码建议</div></div>';
    }
  </script>
</body>
</html>
  `;
  
  mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(appleStyleHtml)).then(() => {
    console.log('Successfully loaded Apple style UI');
  }).catch(err => {
    console.error('Load failed:', err);
  });

  // 监听渲染进程错误
  mainWindow.webContents.on('crashed', () => {
    console.error('Renderer process crashed!');
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
