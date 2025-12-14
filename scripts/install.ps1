# ========================================
# 🔧 安装脚本 - GitHub AutoSync
# ========================================
# 【中文说明】
#   自动安装和配置 GitHub AutoSync
#   功能：检查环境 → 创建配置 → 设置脚本
#
# 【使用方法】
#   .\install.ps1
#
# 【重要提示】
#   - 首次使用建议运行此脚本
#   - 会自动检查 Git 和 PowerShell 版本
#   - 会引导创建配置文件
# ========================================

param(
    [switch]$SkipConfig = $false
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   🔧 GitHub AutoSync 安装程序" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 检查 PowerShell 版本
$psVersion = $PSVersionTable.PSVersion.Major
if ($psVersion -lt 5) {
    Write-Host "❌ 需要 PowerShell 5.0 或更高版本" -ForegroundColor Red
    Write-Host "当前版本: $psVersion" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ PowerShell 版本: $psVersion" -ForegroundColor Green

# 检查 Git
Write-Host "`n📦 检查 Git..." -ForegroundColor Yellow
try {
    $null = git --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Git 已安装" -ForegroundColor Green
    } else {
        Write-Host "❌ Git 未安装" -ForegroundColor Red
        Write-Host "请访问 https://git-scm.com/download/win 安装 Git" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Git 未安装或无法访问" -ForegroundColor Red
    Write-Host "请访问 https://git-scm.com/download/win 安装 Git" -ForegroundColor Yellow
    exit 1
}

# 创建配置文件
if (-not $SkipConfig) {
    Write-Host "`n⚙️  配置 GitHub AutoSync..." -ForegroundColor Yellow
    
    # 检查是否已有配置文件
    $configPath = Join-Path $PSScriptRoot "config.json"
    if (Test-Path $configPath) {
        Write-Host "⚠️  配置文件已存在: $configPath" -ForegroundColor Yellow
        $overwrite = Read-Host "是否覆盖? (y/N)"
        if ($overwrite -ne "y" -and $overwrite -ne "Y") {
            Write-Host "⏭️  跳过配置文件创建" -ForegroundColor Gray
        } else {
            Write-Host "📝 创建配置文件..." -ForegroundColor Cyan
        }
    } else {
        Write-Host "📝 创建配置文件..." -ForegroundColor Cyan
    }
    
    # 获取 GitHub Token
    Write-Host "`n请提供您的 GitHub Personal Access Token:" -ForegroundColor Cyan
    Write-Host "获取方式: https://github.com/settings/tokens" -ForegroundColor Gray
    Write-Host "需要权限: repo (完整仓库访问)" -ForegroundColor Gray
    $token = Read-Host "`nToken (留空跳过)"
    
    # 获取仓库地址
    $repoUrl = ""
    if ($token) {
        Write-Host "`n请输入您的 GitHub 仓库地址:" -ForegroundColor Cyan
        Write-Host "示例: https://github.com/username/repo.git" -ForegroundColor Gray
        $repoUrl = Read-Host "仓库地址 (留空跳过)"
    }
    
    # 创建配置
    $config = @{
        github = @{
            repository = $repoUrl
            branch = "main"
        }
        sync = @{
            debounceSeconds = 10
            excludePatterns = @(
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
        }
    }
    
    # 保存配置
    if ($token -or $repoUrl) {
        try {
            $config | ConvertTo-Json -Depth 10 | Set-Content $configPath -Encoding UTF8
            Write-Host "✅ 配置文件已创建: $configPath" -ForegroundColor Green
            
            # 设置环境变量
            if ($token) {
                Write-Host "`n💡 提示: 建议设置环境变量 GITHUB_TOKEN" -ForegroundColor Yellow
                Write-Host "当前会话: `$env:GITHUB_TOKEN = '$token'" -ForegroundColor Gray
                Write-Host "永久设置: [System.Environment]::SetEnvironmentVariable('GITHUB_TOKEN', '$token', 'User')" -ForegroundColor Gray
            }
        } catch {
            Write-Host "⚠️  创建配置文件失败: $_" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⏭️  跳过配置，稍后可以手动创建 config.json" -ForegroundColor Gray
    }
}

# 创建启动脚本
Write-Host "`n📝 创建便捷脚本..." -ForegroundColor Yellow

# start.ps1
$startScript = @'
# 🚀 启动 GitHub AutoSync
param(
    [string]$Token = "",
    [int]$DebounceSeconds = 10
)

$scriptPath = Join-Path $PSScriptRoot "auto-sync.ps1"

if (-not (Test-Path $scriptPath)) {
    Write-Host "❌ 找不到 auto-sync.ps1" -ForegroundColor Red
    exit 1
}

# 读取配置
$configPath = Join-Path $PSScriptRoot "config.json"
if (Test-Path $configPath) {
    try {
        $config = Get-Content $configPath -Raw -Encoding UTF8 | ConvertFrom-Json
        if (-not $Token -and $config.github.token) {
            $Token = $config.github.token
        }
        if ($config.sync.debounceSeconds) {
            $DebounceSeconds = $config.sync.debounceSeconds
        }
    } catch {
        Write-Host "⚠️  读取配置文件失败" -ForegroundColor Yellow
    }
}

# 使用环境变量
if (-not $Token) {
    $Token = $env:GITHUB_TOKEN
}

# 运行脚本
& $scriptPath -Token $Token -DebounceSeconds $DebounceSeconds
'@

$startScript | Set-Content (Join-Path $PSScriptRoot "start.ps1") -Encoding UTF8
Write-Host "✅ 已创建 start.ps1" -ForegroundColor Green

# stop.ps1
$stopScript = @'
# ⏹️ 停止 GitHub AutoSync
Write-Host "🔍 正在查找 GitHub AutoSync 服务..." -ForegroundColor Yellow

$jobs = Get-Job | Where-Object { 
    $_.Command -like "*auto-sync*" -or 
    (Receive-Job $_.Id -ErrorAction SilentlyContinue | Select-Object -First 1) -like "*自动同步*"
}

if ($jobs) {
    Write-Host "找到 $($jobs.Count) 个相关作业" -ForegroundColor Cyan
    foreach ($job in $jobs) {
        Write-Host "  停止作业 ID: $($job.Id)" -ForegroundColor Gray
        Stop-Job -Id $job.Id -ErrorAction SilentlyContinue
        Remove-Job -Id $job.Id -ErrorAction SilentlyContinue
    }
    Write-Host "✅ 所有服务已停止" -ForegroundColor Green
} else {
    Write-Host "ℹ️  未找到运行中的服务" -ForegroundColor Yellow
}
'@

$stopScript | Set-Content (Join-Path $PSScriptRoot "stop.ps1") -Encoding UTF8
Write-Host "✅ 已创建 stop.ps1" -ForegroundColor Green

# 安装完成
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   ✅ 安装完成！" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📖 使用指南:" -ForegroundColor Yellow
Write-Host "  启动: .\start.ps1" -ForegroundColor Gray
Write-Host "  停止: .\stop.ps1" -ForegroundColor Gray
Write-Host "  文档: README.md" -ForegroundColor Gray

Write-Host "`n🎉 开始使用 GitHub AutoSync 吧！" -ForegroundColor Green
