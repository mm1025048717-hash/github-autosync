# GitHub AutoSync - Core Script
param(
    [string]$Token = "",
    [int]$DebounceSeconds = 10,
    [switch]$Background = $false
)

Write-Host "`n==============================" -ForegroundColor Cyan
Write-Host "   GitHub AutoSync Service" -ForegroundColor Cyan
Write-Host "==============================`n" -ForegroundColor Cyan

# 使用当前工作目录（由调用者设置）
$projectDir = Get-Location
Write-Host "[INFO] Working in: $projectDir" -ForegroundColor Cyan

# Config (在项目目录或用户目录中查找)
$configPath = Join-Path $projectDir "config.json"
$userConfigPath = Join-Path $env:USERPROFILE ".autosync-config.json"
if (Test-Path $configPath) {
    try {
        $config = Get-Content $configPath -Raw | ConvertFrom-Json
        if ($config.github.token -and -not $Token) { $Token = $config.github.token }
    } catch {}
} elseif (Test-Path $userConfigPath) {
    try {
        $config = Get-Content $userConfigPath -Raw | ConvertFrom-Json
        if ($config.token -and -not $Token) { $Token = $config.token }
    } catch {}
}

# Token from env
if (-not $Token) { $Token = $env:GITHUB_TOKEN }
if ($Token) {
    $env:GH_TOKEN = $Token
    Write-Host "[OK] Token configured" -ForegroundColor Green
}

# Check git
try {
    $null = git --version
    Write-Host "[OK] Git installed" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Git not found" -ForegroundColor Red
    exit 1
}

# Check remote
$remote = git remote get-url origin 2>$null
if ($remote) {
    Write-Host "[OK] Remote: $remote" -ForegroundColor Green
} else {
    Write-Host "[WARN] No remote configured" -ForegroundColor Yellow
}

# Exclusions
$excludePaths = @('.git', 'node_modules', '.next', 'dist', 'build', '__pycache__', '.pytest_cache', 'venv', '.env', '*.log', '*.tmp')

function Test-Exclude($p) {
    foreach ($ex in $excludePaths) {
        if ($p -like "*$ex*") { return $true }
    }
    return $false
}

# State
$script:pendingChanges = $false
$script:lastChange = $null
$script:commits = 0

# 智能生成 Commit Message
function Generate-CommitMessage {
    param([array]$changedFiles)
    
    # 分析文件类型和变更
    $fileTypes = @{}
    $fileCount = 0
    $hasCode = $false
    $hasConfig = $false
    $hasDoc = $false
    
    foreach ($file in $changedFiles) {
        $fileCount++
        $ext = [System.IO.Path]::GetExtension($file).ToLower()
        
        # 判断文件类型
        if ($ext -in @('.js', '.ts', '.py', '.java', '.cpp', '.cs', '.go', '.rs')) {
            $hasCode = $true
            $fileTypes['code'] = ($fileTypes['code'] ?? 0) + 1
        }
        elseif ($ext -in @('.json', '.yaml', '.yml', '.toml', '.ini', '.conf')) {
            $hasConfig = $true
            $fileTypes['config'] = ($fileTypes['config'] ?? 0) + 1
        }
        elseif ($ext -in @('.md', '.txt', '.rst')) {
            $hasDoc = $true
            $fileTypes['doc'] = ($fileTypes['doc'] ?? 0) + 1
        }
        elseif ($ext -in @('.css', '.scss', '.less')) {
            $fileTypes['style'] = ($fileTypes['style'] ?? 0) + 1
        }
        elseif ($ext -in @('.html', '.vue', '.jsx', '.tsx')) {
            $fileTypes['ui'] = ($fileTypes['ui'] ?? 0) + 1
        }
    }
    
    # 生成有意义的 commit message
    $msg = ""
    if ($hasCode) {
        if ($fileCount -eq 1) {
            $fileName = [System.IO.Path]::GetFileName($changedFiles[0])
            $msg = "feat: update $fileName"
        } else {
            $msg = "feat: update $fileCount files"
        }
    }
    elseif ($hasConfig) {
        $msg = "config: update configuration files"
    }
    elseif ($hasDoc) {
        $msg = "docs: update documentation"
    }
    elseif ($fileTypes.ContainsKey('style')) {
        $msg = "style: update styles"
    }
    elseif ($fileTypes.ContainsKey('ui')) {
        $msg = "ui: update interface"
    }
    else {
        $msg = "chore: update $fileCount files"
    }
    
    return $msg
}

# 智能过滤无意义提交
function Should-SkipCommit {
    param([array]$changedFiles)
    
    # 检查是否只是临时文件或格式化
    $tempPatterns = @('*.tmp', '*.log', '*.cache', '.DS_Store', 'Thumbs.db')
    $allTemp = $true
    
    foreach ($file in $changedFiles) {
        $isTemp = $false
        foreach ($pattern in $tempPatterns) {
            if ($file -like $pattern) {
                $isTemp = $true
                break
            }
        }
        if (-not $isTemp) {
            $allTemp = $false
            break
        }
    }
    
    # 如果全是临时文件，跳过
    if ($allTemp) {
        return $true
    }
    
    # 检查是否只是空白字符变化（需要git diff，这里简化处理）
    return $false
}

function Invoke-Sync {
    param([string]$reason = "File change")
    
    $status = git status --porcelain 2>$null
    if (-not $status) {
        Write-Host "[INFO] No changes to commit" -ForegroundColor Gray
        return
    }
    
    # 解析变更的文件列表
    $changedFiles = @()
    $status | ForEach-Object {
        $parts = $_ -split '\s+', 2
        if ($parts.Length -ge 2) {
            $changedFiles += $parts[1]
        }
    }
    
    # 智能过滤
    if (Should-SkipCommit -changedFiles $changedFiles) {
        Write-Host "[SKIP] Skipping meaningless changes" -ForegroundColor Yellow
        git reset 2>$null
        return
    }
    
    Write-Host "[CHANGE] Files modified:" -ForegroundColor Cyan
    $status | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    
    git add . 2>$null
    
    # AI 生成有意义的 commit message
    $msg = Generate-CommitMessage -changedFiles $changedFiles
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $fullMsg = "$msg ($ts)"
    
    $commitOut = git commit -m $fullMsg 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[COMMIT] $fullMsg" -ForegroundColor Green
        
        Write-Host "[PUSH] Pushing to GitHub..." -ForegroundColor Yellow
        $branch = "main"
        $pushOut = git push origin $branch 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            $script:commits++
            Write-Host "[PUSH] Success! Total commits: $($script:commits)" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] Push failed: $pushOut" -ForegroundColor Red
        }
    } else {
        Write-Host "[INFO] Nothing to commit" -ForegroundColor Yellow
    }
    
    $script:pendingChanges = $false
}

function Start-Watch {
    Write-Host "`n[WATCH] Monitoring: $projectDir" -ForegroundColor Cyan
    Write-Host "[WATCH] Debounce: ${DebounceSeconds}s" -ForegroundColor Cyan
    Write-Host "[WATCH] Press Ctrl+C to stop`n" -ForegroundColor Yellow
    
    $watcher = New-Object System.IO.FileSystemWatcher
    $watcher.Path = $projectDir
    $watcher.IncludeSubdirectories = $true
    $watcher.EnableRaisingEvents = $true
    $watcher.NotifyFilter = [System.IO.NotifyFilters]::FileName -bor [System.IO.NotifyFilters]::LastWrite -bor [System.IO.NotifyFilters]::DirectoryName
    
    $action = {
        $p = $Event.SourceEventArgs.FullPath
        $t = $Event.SourceEventArgs.ChangeType
        
        # Skip excluded
        $skip = $false
        foreach ($ex in @('.git', 'node_modules', '.next', 'dist', 'build')) {
            if ($p -like "*$ex*") { $skip = $true; break }
        }
        
        if (-not $skip) {
            $script:pendingChanges = $true
            $script:lastChange = Get-Date
            Write-Host "[DETECT] $t : $p" -ForegroundColor Magenta
        }
    }
    
    Register-ObjectEvent $watcher "Changed" -Action $action | Out-Null
    Register-ObjectEvent $watcher "Created" -Action $action | Out-Null
    Register-ObjectEvent $watcher "Deleted" -Action $action | Out-Null
    Register-ObjectEvent $watcher "Renamed" -Action $action | Out-Null
    
    try {
        while ($true) {
            Start-Sleep -Seconds 1
            
            if ($script:pendingChanges -and $script:lastChange) {
                $elapsed = (Get-Date) - $script:lastChange
                if ($elapsed.TotalSeconds -ge $DebounceSeconds) {
                    Invoke-Sync "Auto-sync"
                }
            }
        }
    } finally {
        $watcher.EnableRaisingEvents = $false
        $watcher.Dispose()
        Get-EventSubscriber | Unregister-Event
        Write-Host "`n[STOP] Watcher stopped" -ForegroundColor Green
    }
}

# Initial sync
Write-Host "[INIT] Checking for pending changes..." -ForegroundColor Cyan
Invoke-Sync "Initial sync"

# Start watching
Start-Watch
