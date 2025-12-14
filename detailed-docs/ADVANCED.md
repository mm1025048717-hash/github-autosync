# 🔧 高级用法

## 自定义配置

### 配置文件结构

```json
{
  "github": {
    "repository": "https://github.com/username/repo.git",
    "branch": "main",
    "token": "ghp_your_token_here"
  },
  "sync": {
    "debounceSeconds": 10,
    "excludePatterns": [
      ".git",
      "node_modules",
      ".expo",
      "dist"
    ]
  }
}
```

### 环境变量

```powershell
# GitHub Token
$env:GITHUB_TOKEN = "ghp_xxx"

# 防抖时间（秒）
$env:AUTOSYNC_DEBOUNCE = "15"

# 分支名称
$env:GIT_BRANCH = "develop"
```

## 自定义排除规则

### 使用通配符

```powershell
$excludePatterns = @(
    "*.log",           # 所有 .log 文件
    "*.tmp",           # 所有临时文件
    "**/node_modules", # 所有 node_modules 目录
    "dist/**"          # dist 目录下的所有文件
)
```

### 使用正则表达式

编辑 `auto-sync.ps1`，修改 `Should-ExcludePath` 函数：

```powershell
function Should-ExcludePath {
    param([string]$path)
    
    # 使用正则表达式匹配
    if ($path -match "\.(log|tmp|bak)$") {
        return $true
    }
    
    # 其他排除逻辑...
}
```

## 自定义提交信息

### 修改提交信息格式

编辑 `auto-sync.ps1` 中的 `Commit-And-Push` 函数：

```powershell
# 默认格式
$commitMessage = "🔄 自动同步: $timestamp - $reason"

# 自定义格式
$commitMessage = "[AutoSync] $timestamp - $reason"
$commitMessage = "chore: auto sync at $timestamp"
$commitMessage = "🤖 Auto commit: $reason"
```

### 添加文件统计

```powershell
$changedFiles = (git status --porcelain | Measure-Object).Count
$commitMessage = "🔄 自动同步: $timestamp - 修改了 $changedFiles 个文件"
```

## 后台运行

### 使用 PowerShell 作业

```powershell
# 启动后台作业
$job = Start-Job -ScriptBlock {
    Set-Location "C:\path\to\project"
    & ".\auto-sync.ps1" -Token "ghp_xxx" -Background
}

# 查看状态
Get-Job -Id $job.Id

# 查看输出
Receive-Job -Id $job.Id -Keep

# 停止作业
Stop-Job -Id $job.Id
Remove-Job -Id $job.Id
```

### 使用 Windows 服务（高级）

可以创建 Windows 服务来运行自动同步，但这需要额外的配置。

## 多项目管理

### 为每个项目创建配置

```powershell
# 项目1
$env:GITHUB_TOKEN = "ghp_xxx"
Set-Location "C:\Projects\Project1"
.\auto-sync.ps1

# 项目2（新终端）
$env:GITHUB_TOKEN = "ghp_xxx"
Set-Location "C:\Projects\Project2"
.\auto-sync.ps1
```

### 使用配置文件

为每个项目创建独立的 `config.json`：

```powershell
# Project1/config.json
{
  "github": {
    "repository": "https://github.com/user/project1.git"
  }
}

# Project2/config.json
{
  "github": {
    "repository": "https://github.com/user/project2.git"
  }
}
```

## 集成到编辑器

### VS Code 任务

创建 `.vscode/tasks.json`：

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start AutoSync",
      "type": "shell",
      "command": "powershell",
      "args": [
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        "${workspaceFolder}/auto-sync.ps1"
      ],
      "isBackground": true,
      "problemMatcher": []
    }
  ]
}
```

### Cursor 集成

在 Cursor 中，可以：
1. 使用终端运行脚本
2. 创建快捷键绑定
3. 使用任务运行器

## 监控和日志

### 启用详细日志

编辑 `auto-sync.ps1`，添加日志功能：

```powershell
$logPath = Join-Path $projectDir "autosync.log"

function Write-Log {
    param([string]$message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $message" | Add-Content $logPath
    Write-Host $message
}
```

### 性能监控

```powershell
# 记录提交频率
$script:commitCount = 0
$script:lastCommitTime = Get-Date

function Commit-And-Push {
    # ... 提交逻辑 ...
    $script:commitCount++
    $script:lastCommitTime = Get-Date
}
```

## 错误处理

### 自定义错误处理

```powershell
function Commit-And-Push {
    try {
        # 提交逻辑
    } catch {
        Write-Host "❌ 错误: $_" -ForegroundColor Red
        # 发送通知
        Send-Notification "AutoSync 失败: $_"
        # 记录错误
        Write-Log "ERROR: $_"
    }
}
```

### 重试机制

```powershell
function Push-WithRetry {
    param([int]$maxRetries = 3)
    
    for ($i = 1; $i -le $maxRetries; $i++) {
        $result = git push origin main 2>&1
        if ($LASTEXITCODE -eq 0) {
            return $true
        }
        Start-Sleep -Seconds 5
    }
    return $false
}
```

## 安全最佳实践

### Token 管理

1. **使用环境变量**（推荐）
2. **定期轮换 Token**
3. **使用最小权限**（只授予 `repo` 权限）
4. **不要提交 Token 到代码仓库**

### 配置文件安全

```powershell
# 使用 .gitignore 排除配置文件
# .gitignore
config.json
*.token
```

## 性能优化

### 减少文件监听

```powershell
# 只监听特定目录
$watcher.Path = Join-Path $projectDir "src"
```

### 批量提交

```powershell
# 收集多个文件变化，一次性提交
$script:changedFiles = @()

function On-FileChanged {
    $script:changedFiles += $path
    # 延迟提交
}
```

## 扩展功能

### 添加通知

```powershell
# Windows 通知
function Send-Notification {
    param([string]$message)
    [System.Windows.Forms.MessageBox]::Show($message, "GitHub AutoSync")
}
```

### 添加统计

```powershell
# 统计提交次数
$stats = @{
    totalCommits = 0
    totalFiles = 0
    lastSync = $null
}
```

---

需要更多帮助？查看 [FAQ](FAQ.md) 或提交 Issue。
