# GitHub AutoSync - Core Script
param(
    [string]$Token = "",
    [int]$DebounceSeconds = 10,
    [switch]$Background = $false
)

Write-Host "`n==============================" -ForegroundColor Cyan
Write-Host "   GitHub AutoSync Service" -ForegroundColor Cyan
Write-Host "==============================`n" -ForegroundColor Cyan

$projectDir = if ($PSScriptRoot) { $PSScriptRoot } else { Get-Location }
Set-Location $projectDir

# Config
$configPath = Join-Path $projectDir "config.json"
if (Test-Path $configPath) {
    try {
        $config = Get-Content $configPath -Raw | ConvertFrom-Json
        if ($config.github.token -and -not $Token) { $Token = $config.github.token }
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

function Invoke-Sync {
    param([string]$reason = "File change")
    
    $status = git status --porcelain 2>$null
    if (-not $status) {
        Write-Host "[INFO] No changes to commit" -ForegroundColor Gray
        return
    }
    
    Write-Host "[CHANGE] Files modified:" -ForegroundColor Cyan
    $status | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    
    git add . 2>$null
    
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $msg = "Auto-sync: $ts"
    
    $commitOut = git commit -m $msg 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[COMMIT] $msg" -ForegroundColor Green
        
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
