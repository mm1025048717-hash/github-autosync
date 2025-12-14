# ========================================
# 🔄 GitHub AutoSync - 自动同步主程序
# ========================================
# 【中文说明】
#   这是核心脚本，负责监听文件变化并自动同步到 GitHub
#   功能：监听文件 → 自动提交 → 自动推送
#
# 【使用方法】
#   .\auto-sync.ps1 -Token "你的token"
#   或：.\start.ps1
#
# 【重要提示】
#   - 这是最重要的文件，包含所有核心功能
#   - 首次使用需要配置 GitHub Token
#   - 需要先配置远程仓库（使用 deploy-with-token.ps1）
# ========================================

param(
    [string]$Token = "",
    [int]$DebounceSeconds = 10,  # 防抖时间（秒），避免频繁提交
    [switch]$Background = $false  # 后台运行
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   🔄 GitHub 自动同步服务" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 获取项目目录
$projectDir = $PSScriptRoot
if (-not $projectDir) {
    $projectDir = Get-Location
}
Set-Location $projectDir

# 读取配置文件（支持 config.json 和 deploy-config.json）
$configPath = Join-Path $projectDir "config.json"
if (-not (Test-Path $configPath)) {
    $configPath = Join-Path $projectDir "deploy-config.json"
}
$config = $null
$repoUrl = ""
if (Test-Path $configPath) {
    try {
        $configContent = Get-Content $configPath -Raw -Encoding UTF8
        $config = $configContent | ConvertFrom-Json
        if ($config.github.repository) {
            $repoUrl = $config.github.repository
        }
        if ($config.github.token -and -not $Token) {
            $Token = $config.github.token
        }
        if ($config.sync.debounceSeconds -and $DebounceSeconds -eq 10) {
            $DebounceSeconds = $config.sync.debounceSeconds
        }
    } catch {
        Write-Host "⚠️  配置文件格式错误" -ForegroundColor Yellow
    }
}

# 如果没有提供token，尝试从环境变量读取
if (-not $Token) {
    $Token = $env:GITHUB_TOKEN
}

# 如果没有token，提示用户
if (-not $Token) {
    Write-Host "⚠️  未提供 GitHub Token" -ForegroundColor Yellow
    Write-Host "请提供您的 GitHub Personal Access Token:" -ForegroundColor Cyan
    Write-Host "方式1: 运行脚本时提供参数: .\auto-sync.ps1 -Token 'your-token'" -ForegroundColor Gray
    Write-Host "方式2: 设置环境变量: `$env:GITHUB_TOKEN = 'your-token'" -ForegroundColor Gray
    Write-Host "方式3: 现在输入 (输入后按回车):" -ForegroundColor Gray
    $Token = Read-Host -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($Token)
    $Token = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

# 检查远程仓库
$remotes = git remote -v 2>&1
if (-not $remotes -or -not ($remotes -match "origin")) {
    if ($repoUrl) {
        Write-Host "`n➕ 添加远程仓库..." -ForegroundColor Yellow
        $addResult = git remote add origin $repoUrl 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ 已添加远程仓库: $repoUrl" -ForegroundColor Green
        } else {
            Write-Host "⚠️  添加远程仓库时出现警告: $addResult" -ForegroundColor Yellow
        }
    } else {
        Write-Host "`n❌ 未配置远程仓库" -ForegroundColor Red
        Write-Host "请先运行 .\deploy-with-token.ps1 或配置 config.json" -ForegroundColor Yellow
        exit 1
    }
} else {
    $repoUrlOutput = git remote get-url origin 2>&1
    if ($LASTEXITCODE -eq 0) {
        $repoUrl = $repoUrlOutput.Trim()
        Write-Host "✅ 远程仓库: $repoUrl" -ForegroundColor Green
    } else {
        Write-Host "⚠️  无法获取远程仓库URL" -ForegroundColor Yellow
    }
}

# 配置带token的远程URL
if ($repoUrl) {
    # 如果URL已经包含token，先移除
    $cleanUrl = $repoUrl -replace "https://[^@]+@", "https://"
    $repoUrlWithToken = $cleanUrl -replace "https://", "https://${Token}@"
    $setUrlResult = git remote set-url origin $repoUrlWithToken 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  设置远程URL时出现警告: $setUrlResult" -ForegroundColor Yellow
    }
}

# 需要排除的路径模式
$excludePatterns = @(
    ".git",
    "node_modules",
    ".expo",
    "dist",
    "web-build",
    ".env",
    ".DS_Store",
    "*.log",
    "coverage",
    ".idea",
    ".vscode"
)

# 从配置文件读取排除规则
if ($config -and $config.sync.excludePatterns) {
    $excludePatterns = $config.sync.excludePatterns
}

# 检查路径是否应该被排除
function Test-ExcludePath {
    param([string]$path)
    
    if ([string]::IsNullOrEmpty($path)) {
        return $true
    }
    
    # 标准化路径分隔符
    $normalizedPath = $path.Replace("\", "/")
    
    foreach ($pattern in $excludePatterns) {
        $normalizedPattern = $pattern.Replace("\", "/")
        # 支持通配符匹配
        if ($normalizedPattern -like "*`**") {
            # 处理通配符模式（如 *.log）
            $regexPattern = $normalizedPattern -replace '\*', '.*' -replace '\.', '\.'
            if ($normalizedPath -match $regexPattern) {
                return $true
            }
        } elseif ($normalizedPath -like "*$normalizedPattern*") {
            return $true
        }
    }
    return $false
}

# 提交和推送函数
$script:lastCommitTime = Get-Date
$script:pendingChanges = $false
$script:commitTimer = $null
$script:commitTimerEventId = $null

function Invoke-CommitAndPush {
    param([string]$reason = "文件变化")
    
    Write-Host "`n📝 [$reason] 检测到文件变化，准备提交..." -ForegroundColor Yellow
    
    # 检查是否有实际变化
    $status = git status --porcelain 2>&1
    if (-not $status) {
        Write-Host "✅ 没有需要提交的更改" -ForegroundColor Green
        return
    }
    
    # 显示变化的文件
    Write-Host "变化的文件:" -ForegroundColor Cyan
    $status | ForEach-Object {
        $line = $_.Trim()
        if ($line) {
            Write-Host "  - $line" -ForegroundColor Gray
        }
    }
    
    # 添加所有更改
    git add . 2>&1 | Out-Null
    
    # 生成提交信息
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $commitMessage = "🔄 自动同步: $timestamp - $reason"
    
    # 提交
    $commitOutput = git commit -m $commitMessage 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 已提交: $commitMessage" -ForegroundColor Green
        
        # 推送
        Write-Host "🚀 正在推送到 GitHub..." -ForegroundColor Yellow
        $branchName = if ($config -and $config.github.branch) { $config.github.branch } else { "main" }
        $pushOutput = git push origin $branchName 2>&1
        $pushResult = $pushOutput | Out-String
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "🎉 推送成功！" -ForegroundColor Green
            $script:lastCommitTime = Get-Date
        } else {
            Write-Host "❌ 推送失败" -ForegroundColor Red
            if ($pushResult) {
                Write-Host "错误信息: $pushResult" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "⚠️  提交失败或没有新更改: $commitOutput" -ForegroundColor Yellow
    }
    
    $script:pendingChanges = $false
}

# 文件变化处理函数（带防抖）
function Invoke-FileChanged {
    param([string]$path, [string]$changeType)
    
    # 检查是否应该排除
    if (Test-ExcludePath $path) {
        return
    }
    
    $script:pendingChanges = $true
    
    # 清除之前的定时器
    if ($script:commitTimer) {
        $script:commitTimer.Stop()
        $script:commitTimer.Dispose()
        Unregister-Event -SourceIdentifier $script:commitTimerEventId -ErrorAction SilentlyContinue
    }
    
    # 捕获变量到局部作用域
    $filePath = $path
    $projectPath = $projectDir
    
    # 设置新的定时器（防抖）
    $script:commitTimer = New-Object System.Timers.Timer
    $script:commitTimer.Interval = $DebounceSeconds * 1000
    $script:commitTimer.AutoReset = $false
    
    $action = {
        if ($script:pendingChanges) {
            try {
                $relativePath = $filePath.Replace($projectPath, "").TrimStart("\", "/")
                if ([string]::IsNullOrEmpty($relativePath)) {
                    $relativePath = "项目文件"
                }
                Invoke-CommitAndPush "修改了 $relativePath"
            } catch {
                Write-Host "❌ 处理文件变化时出错: $_" -ForegroundColor Red
            }
        }
    }
    
    $script:commitTimerEventId = Register-ObjectEvent -InputObject $script:commitTimer -EventName Elapsed -Action $action
    $script:commitTimer.Start()
    
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 📝 检测到变化: $path" -ForegroundColor Cyan
}

# 创建文件系统监视器
Write-Host "`n👀 启动文件监听..." -ForegroundColor Yellow

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $projectDir
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

# 注册事件处理
$script:watcherEvents = @()

$script:watcherEvents += Register-ObjectEvent -InputObject $watcher -EventName "Changed" -Action {
    try {
        Invoke-FileChanged $Event.SourceEventArgs.FullPath "Changed"
    } catch {
        Write-Host "❌ 处理文件变化事件时出错: $_" -ForegroundColor Red
    }
}

$script:watcherEvents += Register-ObjectEvent -InputObject $watcher -EventName "Created" -Action {
    try {
        Invoke-FileChanged $Event.SourceEventArgs.FullPath "Created"
    } catch {
        Write-Host "❌ 处理文件创建事件时出错: $_" -ForegroundColor Red
    }
}

$script:watcherEvents += Register-ObjectEvent -InputObject $watcher -EventName "Deleted" -Action {
    try {
        Invoke-FileChanged $Event.SourceEventArgs.FullPath "Deleted"
    } catch {
        Write-Host "❌ 处理文件删除事件时出错: $_" -ForegroundColor Red
    }
}

$script:watcherEvents += Register-ObjectEvent -InputObject $watcher -EventName "Renamed" -Action {
    try {
        Invoke-FileChanged $Event.SourceEventArgs.FullPath "Renamed"
    } catch {
        Write-Host "❌ 处理文件重命名事件时出错: $_" -ForegroundColor Red
    }
}

Write-Host "✅ 文件监听已启动" -ForegroundColor Green
Write-Host "📁 监听目录: $projectDir" -ForegroundColor Cyan
Write-Host "⏱️  防抖时间: $DebounceSeconds 秒" -ForegroundColor Cyan
Write-Host "`n💡 提示:" -ForegroundColor Yellow
Write-Host "  - 文件变化后会在 $DebounceSeconds 秒后自动提交并推送" -ForegroundColor Gray
Write-Host "  - 按 Ctrl+C 停止监听" -ForegroundColor Gray
Write-Host "`n🔄 自动同步服务运行中...`n" -ForegroundColor Green

# 如果是后台模式，直接返回
if ($Background) {
    Write-Host "✅ 服务已在后台运行" -ForegroundColor Green
    return
}

# 等待用户中断
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} catch {
    Write-Host "`n⏹️  正在停止监听..." -ForegroundColor Yellow
} finally {
    # 清理资源
    Write-Host "`n🧹 正在清理资源..." -ForegroundColor Yellow
    
    # 停止并清理定时器
    if ($script:commitTimer) {
        try {
            $script:commitTimer.Stop()
            $script:commitTimer.Dispose()
        } catch {
            # 忽略清理错误
        }
    }
    
    # 取消注册事件
    if ($script:commitTimerEventId) {
        try {
            Unregister-Event -SourceIdentifier $script:commitTimerEventId -ErrorAction SilentlyContinue
        } catch {
            # 忽略清理错误
        }
    }
    
    # 清理文件监视器事件
    if ($script:watcherEvents) {
        foreach ($eventId in $script:watcherEvents) {
            try {
                Unregister-Event -SourceIdentifier $eventId -ErrorAction SilentlyContinue
            } catch {
                # 忽略清理错误
            }
        }
    }
    
    # 清理文件监视器
    if ($watcher) {
        try {
            $watcher.EnableRaisingEvents = $false
            $watcher.Dispose()
        } catch {
            # 忽略清理错误
        }
    }
    
    # 恢复原始URL（移除token）
    try {
        if ($repoUrl) {
            git remote set-url origin $repoUrl 2>&1 | Out-Null
        }
    } catch {
        # 忽略错误
    }
    
    Write-Host "✅ 已停止监听" -ForegroundColor Green
}
