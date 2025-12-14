# GitHub AutoSync - Core Script
param(
    [string]$Token = "",
    [int]$DebounceSeconds = 10,
    [switch]$Background = $false,
    [string]$DeepSeekApiKey = ""
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
        if ($config.deepseek.apiKey -and -not $DeepSeekApiKey) { $DeepSeekApiKey = $config.deepseek.apiKey }
    } catch {}
} elseif (Test-Path $userConfigPath) {
    try {
        $config = Get-Content $userConfigPath -Raw | ConvertFrom-Json
        if ($config.token -and -not $Token) { $Token = $config.token }
        if ($config.deepseekApiKey -and -not $DeepSeekApiKey) { $DeepSeekApiKey = $config.deepseekApiKey }
    } catch {}
}

# 从环境变量读取 DeepSeek API Key
if (-not $DeepSeekApiKey) { $DeepSeekApiKey = $env:DEEPSEEK_API_KEY }

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
$script:lastCommitTime = $null
$script:conflictWarnings = 0

# 分析代码变更（使用 git diff）
function Analyze-Change {
    param([string]$filePath)
    
    $diff = git diff --numstat "$filePath" 2>$null
    if (-not $diff) {
        # 新文件
        $diff = git diff --numstat --cached "$filePath" 2>$null
        if ($diff) {
            $parts = $diff -split '\s+'
            return @{
                Added = [int]$parts[0]
                Deleted = 0
                IsNew = $true
            }
        }
        return $null
    }
    
    $parts = $diff -split '\s+'
    return @{
        Added = [int]$parts[0]
        Deleted = [int]$parts[1]
        IsNew = $false
    }
}

# 使用 DeepSeek API 生成 Commit Message
function Generate-CommitMessage-DeepSeek {
    param([array]$changedFiles)
    
    if (-not $DeepSeekApiKey -or $DeepSeekApiKey -eq "") {
        return $null
    }
    
    try {
        # 获取 git diff 内容（限制长度）
        $diff = git diff --cached 2>$null
        if (-not $diff) {
            $diff = git diff HEAD 2>$null
        }
        
        if (-not $diff) {
            return $null
        }
        
        # 限制 diff 长度（避免超出 API 限制）
        $diffText = $diff -join "`n"
        if ($diffText.Length -gt 4000) {
            $diffText = $diffText.Substring(0, 4000) + "..."
        }
        
        # 构建提示词
        $prompt = @"
分析以下代码变更，生成一个简洁、有意义的 Git commit message。

要求：
1. 使用约定式提交格式（feat/fix/refactor/docs/style/test/chore）
2. 简洁明了，不超过50字
3. 只返回 commit message，不要其他说明

代码变更：
$diffText
"@
        
        # 调用 DeepSeek API
        $body = @{
            model = "deepseek-chat"
            messages = @(
                @{
                    role = "system"
                    content = "你是一个专业的 Git commit message 生成助手。只返回 commit message，不要任何解释。"
                },
                @{
                    role = "user"
                    content = $prompt
                }
            )
            temperature = 0.3
            max_tokens = 100
        } | ConvertTo-Json -Depth 10
        
        $headers = @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $DeepSeekApiKey"
        }
        
        $response = Invoke-RestMethod -Uri "https://api.deepseek.com/chat/completions" -Method Post -Body $body -Headers $headers -ErrorAction Stop
        
        if ($response.choices -and $response.choices.Count -gt 0) {
            $message = $response.choices[0].message.content.Trim()
            # 清理可能的引号
            $message = $message -replace '^["'']|["'']$', ''
            Write-Host "[AI] DeepSeek generated commit message" -ForegroundColor Cyan
            return $message
        }
    } catch {
        Write-Host "[WARN] DeepSeek API failed: $($_.Exception.Message)" -ForegroundColor Yellow
        return $null
    }
    
    return $null
}

# 智能生成 Commit Message（增强版）
function Generate-CommitMessage {
    param([array]$changedFiles)
    
    # 分析文件类型和变更
    $fileTypes = @{}
    $fileCount = 0
    $hasCode = $false
    $hasConfig = $false
    $hasDoc = $false
    $totalAdded = 0
    $totalDeleted = 0
    $newFiles = 0
    $modifiedFiles = 0
    
    $fileDetails = @()
    
    foreach ($file in $changedFiles) {
        $fileCount++
        $ext = [System.IO.Path]::GetExtension($file).ToLower()
        $fileName = [System.IO.Path]::GetFileName($file)
        
        # 分析变更
        $change = Analyze-Change -filePath $file
        if ($change) {
            $totalAdded += $change.Added
            $totalDeleted += $change.Deleted
            if ($change.IsNew) {
                $newFiles++
            } else {
                $modifiedFiles++
            }
        }
        
        # 判断文件类型
        if ($ext -in @('.js', '.ts', '.py', '.java', '.cpp', '.cs', '.go', '.rs', '.php', '.rb', '.swift', '.kt')) {
            $hasCode = $true
            $fileTypes['code'] = ($fileTypes['code'] ?? 0) + 1
            $fileDetails += "代码: $fileName"
        }
        elseif ($ext -in @('.json', '.yaml', '.yml', '.toml', '.ini', '.conf', '.env')) {
            $hasConfig = $true
            $fileTypes['config'] = ($fileTypes['config'] ?? 0) + 1
            $fileDetails += "配置: $fileName"
        }
        elseif ($ext -in @('.md', '.txt', '.rst', '.adoc')) {
            $hasDoc = $true
            $fileTypes['doc'] = ($fileTypes['doc'] ?? 0) + 1
            $fileDetails += "文档: $fileName"
        }
        elseif ($ext -in @('.css', '.scss', '.less', '.sass')) {
            $fileTypes['style'] = ($fileTypes['style'] ?? 0) + 1
            $fileDetails += "样式: $fileName"
        }
        elseif ($ext -in @('.html', '.vue', '.jsx', '.tsx', '.svelte')) {
            $fileTypes['ui'] = ($fileTypes['ui'] ?? 0) + 1
            $fileDetails += "界面: $fileName"
        }
        elseif ($ext -in @('.test.', '.spec.', '.test.', '.spec.')) {
            $fileTypes['test'] = ($fileTypes['test'] ?? 0) + 1
            $fileDetails += "测试: $fileName"
        }
    }
    
    # 生成有意义的 commit message
    $msg = ""
    $scope = ""
    
    # 根据变更类型生成消息
    if ($newFiles -gt 0 -and $modifiedFiles -eq 0) {
        $msg = "feat: add $newFiles new file"
        if ($newFiles -gt 1) { $msg += "s" }
    }
    elseif ($hasCode) {
        if ($fileCount -eq 1) {
            $fileName = [System.IO.Path]::GetFileName($changedFiles[0])
            $baseName = [System.IO.Path]::GetFileNameWithoutExtension($fileName)
            if ($totalAdded - $totalDeleted -gt 50) {
                $msg = "feat: add major feature to $baseName"
            } elseif ($totalDeleted -gt $totalAdded) {
                $msg = "refactor: optimize $baseName"
            } else {
                $msg = "feat: update $baseName"
            }
        } else {
            if ($totalAdded - $totalDeleted -gt 100) {
                $msg = "feat: add major features"
            } elseif ($totalDeleted -gt $totalAdded * 2) {
                $msg = "refactor: code cleanup"
            } else {
                $msg = "feat: update $fileCount files"
            }
        }
    }
    elseif ($fileTypes.ContainsKey('test')) {
        $msg = "test: add/update tests"
    }
    elseif ($hasConfig) {
        $msg = "config: update configuration"
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
    
    # 添加统计信息
    $stats = ""
    if ($totalAdded -gt 0 -or $totalDeleted -gt 0) {
        $stats = " (+$totalAdded -$totalDeleted)"
    }
    if ($newFiles -gt 0 -and $modifiedFiles -gt 0) {
        $stats += " [$newFiles new, $modifiedFiles modified]"
    }
    
    return "$msg$stats"
}

# 智能过滤无意义提交（增强版）
function Should-SkipCommit {
    param([array]$changedFiles)
    
    if ($changedFiles.Count -eq 0) {
        return $true
    }
    
    # 1. 检查临时文件和系统文件
    $tempPatterns = @('*.tmp', '*.log', '*.cache', '.DS_Store', 'Thumbs.db', '*.swp', '*.swo', '*~', '*.bak')
    $allTemp = $true
    $meaningfulFiles = @()
    
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
            $meaningfulFiles += $file
        }
    }
    
    # 如果全是临时文件，跳过
    if ($allTemp) {
        Write-Host "[FILTER] Skipping: all files are temporary" -ForegroundColor Yellow
        return $true
    }
    
    # 2. 检查是否只是空白字符或格式变化
    $onlyWhitespace = $true
    foreach ($file in $meaningfulFiles) {
        $diff = git diff "$file" 2>$null
        if ($diff) {
            # 检查是否有非空白字符的变更
            $hasContentChange = $false
            foreach ($line in $diff) {
                if ($line -match '^[\+\-]' -and $line -notmatch '^[\+\-]\s*$') {
                    $content = $line.Substring(1).Trim()
                    if ($content.Length -gt 0 -and $content -notmatch '^\s+$') {
                        $hasContentChange = $true
                        break
                    }
                }
            }
            if ($hasContentChange) {
                $onlyWhitespace = $false
                break
            }
        }
    }
    
    if ($onlyWhitespace -and $meaningfulFiles.Count -gt 0) {
        Write-Host "[FILTER] Skipping: only whitespace changes" -ForegroundColor Yellow
        return $true
    }
    
    # 3. 检查是否只是注释变化（可选，较复杂，这里简化）
    # 4. 检查文件大小变化（如果变化很小可能是格式化）
    $totalChange = 0
    foreach ($file in $meaningfulFiles) {
        $change = Analyze-Change -filePath $file
        if ($change) {
            $totalChange += $change.Added + $change.Deleted
        }
    }
    
    # 如果变更很小（少于5行），可能是格式化，但不过滤（让用户决定）
    
    return $false
}

# 检测潜在冲突
function Check-Conflicts {
    # 检查远程是否有新提交
    $fetchOut = git fetch origin 2>&1
    $localCommit = git rev-parse HEAD 2>$null
    $remoteCommit = git rev-parse origin/main 2>$null
    
    if ($localCommit -and $remoteCommit -and $localCommit -ne $remoteCommit) {
        $ahead = (git rev-list --count HEAD ^origin/main 2>$null) -as [int]
        $behind = (git rev-list --count origin/main ^HEAD 2>$null) -as [int]
        
        if ($behind -gt 0) {
            Write-Host "[WARN] Remote has $behind new commit(s), may cause conflict" -ForegroundColor Yellow
            $script:conflictWarnings++
            return $true
        }
    }
    return $false
}

# 代码质量检测
function Check-CodeQuality {
    param([array]$changedFiles)
    
    $warnings = @()
    
    foreach ($file in $changedFiles) {
        $ext = [System.IO.Path]::GetExtension($file).ToLower()
        
        # 检查常见问题
        if ($ext -in @('.js', '.ts', '.py')) {
            $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
            if ($content) {
                # 检查是否有 console.log（调试代码）
                if ($content -match 'console\.(log|debug|warn|error)') {
                    $warnings += "$file: contains console statements"
                }
                
                # 检查是否有 TODO/FIXME
                if ($content -match '(TODO|FIXME|XXX|HACK)') {
                    $warnings += "$file: contains TODO/FIXME"
                }
                
                # 检查是否有硬编码的密码/密钥
                if ($content -match '(password\s*=\s*["\']|api[_-]?key\s*=\s*["\']|secret\s*=\s*["\'])') {
                    $warnings += "$file: possible hardcoded credentials"
                }
            }
        }
    }
    
    if ($warnings.Count -gt 0) {
        Write-Host "[QUALITY] Code quality warnings:" -ForegroundColor Yellow
        foreach ($w in $warnings) {
            Write-Host "  - $w" -ForegroundColor Yellow
        }
    }
    
    return $warnings
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
    
    # 代码质量检测
    $qualityWarnings = Check-CodeQuality -changedFiles $changedFiles
    
    # 冲突检测
    $hasConflict = Check-Conflicts
    
    Write-Host "[CHANGE] Files modified:" -ForegroundColor Cyan
    $status | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    
    git add . 2>$null
    
    # AI 生成有意义的 commit message（优先使用 DeepSeek API）
    $msg = $null
    if ($DeepSeekApiKey) {
        $msg = Generate-CommitMessage-DeepSeek -changedFiles $changedFiles
    }
    
    # 如果 DeepSeek 失败或未配置，使用本地规则
    if (-not $msg) {
        $msg = Generate-CommitMessage -changedFiles $changedFiles
    }
    
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $fullMsg = "$msg ($ts)"
    
    $commitOut = git commit -m $fullMsg 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[COMMIT] $fullMsg" -ForegroundColor Green
        
        # 如果有冲突风险，先尝试 pull
        if ($hasConflict) {
            Write-Host "[SYNC] Pulling latest changes before push..." -ForegroundColor Yellow
            $pullOut = git pull --rebase origin main 2>&1
            if ($LASTEXITCODE -ne 0) {
                Write-Host "[WARN] Pull failed, may need manual merge: $pullOut" -ForegroundColor Red
                return
            }
        }
        
        Write-Host "[PUSH] Pushing to GitHub..." -ForegroundColor Yellow
        $branch = "main"
        $pushOut = git push origin $branch 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            $script:commits++
            $script:lastCommitTime = Get-Date
            Write-Host "[PUSH] Success! Total commits: $($script:commits)" -ForegroundColor Green
            
            # 显示统计信息
            if ($qualityWarnings.Count -gt 0) {
                Write-Host "[NOTE] $($qualityWarnings.Count) quality warning(s) detected" -ForegroundColor Yellow
            }
        } else {
            Write-Host "[ERROR] Push failed: $pushOut" -ForegroundColor Red
            if ($pushOut -match 'conflict|rejected') {
                Write-Host "[HINT] Try: git pull --rebase origin main" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "[INFO] Nothing to commit" -ForegroundColor Yellow
    }
    
    $script:pendingChanges = $false
}

# 显示统计信息
function Show-Statistics {
    if ($script:commits -gt 0) {
        Write-Host "`n[STATS] Session Statistics:" -ForegroundColor Cyan
        Write-Host "  Commits: $($script:commits)" -ForegroundColor White
        if ($script:lastCommitTime) {
            $elapsed = (Get-Date) - $script:lastCommitTime
            Write-Host "  Last commit: $($elapsed.TotalMinutes.ToString('F1')) minutes ago" -ForegroundColor White
        }
        if ($script:conflictWarnings -gt 0) {
            Write-Host "  Conflict warnings: $($script:conflictWarnings)" -ForegroundColor Yellow
        }
    }
}

function Start-Watch {
    Write-Host "`n[WATCH] Monitoring: $projectDir" -ForegroundColor Cyan
    Write-Host "[WATCH] Debounce: ${DebounceSeconds}s" -ForegroundColor Cyan
    Write-Host "[WATCH] Features: AI commit messages, smart filtering, conflict detection" -ForegroundColor Cyan
    Write-Host "[WATCH] Press Ctrl+C to stop`n" -ForegroundColor Yellow
    
    # 定期显示统计
    $statsTimer = New-Object System.Timers.Timer
    $statsTimer.Interval = 300000  # 5分钟
    $statsTimer.Add_Elapsed({ Show-Statistics })
    $statsTimer.Start()
    
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
