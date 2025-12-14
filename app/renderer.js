// ========================================
// GitHub AutoSync - 渲染进程逻辑
// ========================================
// 【中文说明】
//   前端交互逻辑，处理用户操作和界面更新
// ========================================

const { ipcRenderer } = require('electron');

// 全局状态
let currentPage = 'home';
let syncStatus = false;
let config = null;
let syncCount = 0;

// DOM 元素
const elements = {
    // 导航
    navItems: document.querySelectorAll('.nav-item'),
    pages: document.querySelectorAll('.page'),
    
    // 首页
    startBtn: document.getElementById('start-btn'),
    stopBtn: document.getElementById('stop-btn'),
    syncStatus: document.getElementById('sync-status'),
    syncCount: document.getElementById('sync-count'),
    fileCount: document.getElementById('file-count'),
    lastSync: document.getElementById('last-sync'),
    
    // 配置页
    projectDir: document.getElementById('project-dir'),
    selectDirBtn: document.getElementById('select-dir-btn'),
    githubToken: document.getElementById('github-token'),
    getTokenBtn: document.getElementById('get-token-btn'),
    repoUrl: document.getElementById('repo-url'),
    debounceSeconds: document.getElementById('debounce-seconds'),
    saveConfigBtn: document.getElementById('save-config-btn'),
    testConnectionBtn: document.getElementById('test-connection-btn'),
    
    // 状态页
    statusSync: document.getElementById('status-sync'),
    statusDir: document.getElementById('status-dir'),
    statusRepo: document.getElementById('status-repo'),
    statusDebounce: document.getElementById('status-debounce'),
    cursorStatus: document.getElementById('cursor-status-text'),
    
    // 日志页
    logsContent: document.getElementById('logs-content'),
    clearLogsBtn: document.getElementById('clear-logs-btn'),
    
    // 标题栏按钮
    minimizeBtn: document.getElementById('minimize-btn'),
    maximizeBtn: document.getElementById('maximize-btn'),
    closeBtn: document.getElementById('close-btn')
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initButtons();
    loadConfig();
    checkCursorStatus();
    updateSyncStatus();
    
    // 定期检查状态
    setInterval(() => {
        checkSyncStatus();
        checkCursorStatus();
    }, 2000);
});

// 导航切换
function initNavigation() {
    elements.navItems.forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            switchPage(page);
        });
    });
}

function switchPage(page) {
    // 更新导航状态
    elements.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });
    
    // 更新页面显示
    elements.pages.forEach(p => {
        p.classList.toggle('active', p.id === `page-${page}`);
    });
    
    currentPage = page;
    
    // 页面特定逻辑
    if (page === 'status') {
        updateStatusPage();
    }
}

// 初始化按钮事件
function initButtons() {
    // 启动/停止按钮
    elements.startBtn.addEventListener('click', startSync);
    elements.stopBtn.addEventListener('click', stopSync);
    
    // 配置相关
    elements.selectDirBtn.addEventListener('click', selectDirectory);
    elements.getTokenBtn.addEventListener('click', () => {
        ipcRenderer.invoke('open-external', 'https://github.com/settings/tokens');
    });
    elements.saveConfigBtn.addEventListener('click', saveConfig);
    elements.testConnectionBtn.addEventListener('click', testConnection);
    
    // 日志
    elements.clearLogsBtn.addEventListener('click', clearLogs);
    
    // 标题栏按钮
    elements.minimizeBtn.addEventListener('click', () => {
        ipcRenderer.invoke('window-minimize');
    });
    elements.maximizeBtn.addEventListener('click', () => {
        ipcRenderer.invoke('window-maximize');
    });
    elements.closeBtn.addEventListener('click', () => {
        ipcRenderer.invoke('window-close');
    });
}

// 加载配置
async function loadConfig() {
    const result = await ipcRenderer.invoke('load-config');
    if (result.success && result.config) {
        config = result.config;
        
        // 填充表单
        if (config.projectDir) elements.projectDir.value = config.projectDir;
        if (config.github?.token) elements.githubToken.value = config.github.token;
        if (config.github?.repository) elements.repoUrl.value = config.github.repository;
        if (config.sync?.debounceSeconds) elements.debounceSeconds.value = config.sync.debounceSeconds;
        
        // 自动检测远程仓库
        if (config.projectDir) {
            detectRemoteRepo(config.projectDir);
        }
    }
}

// 选择目录
async function selectDirectory() {
    const dir = await ipcRenderer.invoke('select-directory');
    if (dir) {
        elements.projectDir.value = dir;
        
        // 检查是否是 Git 仓库
        const isRepo = await ipcRenderer.invoke('check-git-repo', dir);
        if (isRepo) {
            detectRemoteRepo(dir);
        } else {
            addLog('info', '当前目录不是 Git 仓库，请先初始化或配置远程仓库');
        }
    }
}

// 检测远程仓库
async function detectRemoteRepo(dir) {
    const repoUrl = await ipcRenderer.invoke('get-remote-url', dir);
    if (repoUrl) {
        elements.repoUrl.value = repoUrl;
        addLog('success', `已检测到远程仓库: ${repoUrl}`);
    }
}

// 保存配置
async function saveConfig() {
    const newConfig = {
        projectDir: elements.projectDir.value,
        github: {
            token: elements.githubToken.value,
            repository: elements.repoUrl.value,
            branch: 'main'
        },
        sync: {
            debounceSeconds: parseInt(elements.debounceSeconds.value) || 10
        }
    };
    
    if (!newConfig.projectDir) {
        showMessage('请选择项目目录', 'warning');
        return;
    }
    
    if (!newConfig.github.token) {
        showMessage('请填写 GitHub Token', 'warning');
        return;
    }
    
    const result = await ipcRenderer.invoke('save-config', newConfig);
    if (result.success) {
        config = newConfig;
        showMessage('配置已保存', 'success');
        addLog('success', '配置已保存');
    } else {
        showMessage('保存失败: ' + result.message, 'error');
    }
}

// 测试连接
async function testConnection() {
    if (!config || !config.github?.token) {
        showMessage('请先保存配置', 'warning');
        return;
    }
    
    addLog('info', '正在测试连接...');
    
    // 检查 Git
    const hasGit = await ipcRenderer.invoke('check-git');
    if (!hasGit) {
        showMessage('Git 未安装，请先安装 Git', 'error');
        return;
    }
    
    // 检查仓库
    if (config.projectDir) {
        const isRepo = await ipcRenderer.invoke('check-git-repo', config.projectDir);
        if (!isRepo) {
            showMessage('当前目录不是 Git 仓库', 'warning');
            return;
        }
    }
    
    showMessage('连接测试通过', 'success');
    addLog('success', '连接测试通过');
}

// 启动同步
async function startSync() {
    if (!config) {
        showMessage('请先配置设置', 'warning');
        switchPage('setup');
        return;
    }
    
    if (!config.projectDir || !config.github?.token) {
        showMessage('请完善配置信息', 'warning');
        switchPage('setup');
        return;
    }
    
    elements.startBtn.disabled = true;
    addLog('info', '正在启动同步服务...');
    
    const result = await ipcRenderer.invoke('start-sync', {
        projectDir: config.projectDir,
        token: config.github.token,
        debounceSeconds: config.sync?.debounceSeconds || 10,
        background: false
    });
    
    if (result.success) {
        syncStatus = true;
        updateSyncStatus();
        addLog('success', '同步服务已启动');
        showMessage('同步服务已启动', 'success');
    } else {
        elements.startBtn.disabled = false;
        addLog('error', '启动失败: ' + result.message);
        showMessage('启动失败: ' + result.message, 'error');
    }
}

// 停止同步
async function stopSync() {
    const result = await ipcRenderer.invoke('stop-sync');
    if (result.success) {
        syncStatus = false;
        updateSyncStatus();
        elements.startBtn.disabled = false;
        addLog('info', '同步服务已停止');
        showMessage('同步服务已停止', 'info');
    }
}

// 检查同步状态
async function checkSyncStatus() {
    const isRunning = await ipcRenderer.invoke('check-sync-status');
    if (isRunning !== syncStatus) {
        syncStatus = isRunning;
        updateSyncStatus();
    }
}

// 更新同步状态显示
function updateSyncStatus() {
    const statusDot = elements.syncStatus.querySelector('.status-dot');
    const statusText = elements.syncStatus.querySelector('.status-text');
    
    if (syncStatus) {
        statusDot.classList.add('active');
        statusText.textContent = '运行中';
        elements.startBtn.disabled = true;
        elements.stopBtn.disabled = false;
    } else {
        statusDot.classList.remove('active');
        statusText.textContent = '未启动';
        elements.startBtn.disabled = false;
        elements.stopBtn.disabled = true;
    }
}

// 更新状态页面
async function updateStatusPage() {
    if (config) {
        elements.statusDir.textContent = config.projectDir || '--';
        elements.statusRepo.textContent = config.github?.repository || '--';
        elements.statusDebounce.textContent = (config.sync?.debounceSeconds || 10) + ' 秒';
    }
    
    elements.statusSync.textContent = syncStatus ? '运行中' : '未启动';
}

// 检查 Cursor 状态
async function checkCursorStatus() {
    const isRunning = await ipcRenderer.invoke('check-cursor');
    const cursorDot = document.querySelector('.cursor-dot');
    
    if (isRunning) {
        cursorDot.classList.add('active');
        elements.cursorStatus.textContent = 'Cursor 正在运行';
    } else {
        cursorDot.classList.remove('active');
        elements.cursorStatus.textContent = 'Cursor 未运行';
    }
}

// 添加日志
function addLog(type, message) {
    const time = new Date().toLocaleTimeString('zh-CN');
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.innerHTML = `
        <span class="log-time">${time}</span>
        <span class="log-message">${escapeHtml(message)}</span>
    `;
    
    elements.logsContent.appendChild(logEntry);
    elements.logsContent.scrollTop = elements.logsContent.scrollHeight;
    
    // 限制日志数量
    const logs = elements.logsContent.querySelectorAll('.log-entry');
    if (logs.length > 100) {
        logs[0].remove();
    }
}

// 清空日志
function clearLogs() {
    elements.logsContent.innerHTML = '';
    addLog('info', '日志已清空');
}

// 显示消息
function showMessage(message, type = 'info') {
    // 简单的消息提示，可以后续改进为更好的 UI
    addLog(type, message);
}

// HTML 转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// IPC 事件监听
ipcRenderer.on('sync-log', (event, data) => {
    addLog('info', data.trim());
});

ipcRenderer.on('sync-stopped', (event, code) => {
    syncStatus = false;
    updateSyncStatus();
    elements.startBtn.disabled = false;
    addLog('info', `同步服务已停止 (退出码: ${code})`);
});

// 窗口控制（需要在 main.js 中添加）
ipcRenderer.invoke('window-minimize').catch(() => {});
ipcRenderer.invoke('window-maximize').catch(() => {});
ipcRenderer.invoke('window-close').catch(() => {});

