# ========================================
# 🚀 部署脚本 - 使用 Token 部署到 GitHub
# ========================================
# 【中文说明】
#   首次部署项目到 GitHub，或更新远程仓库
#   功能：初始化仓库 → 提交代码 → 推送到 GitHub
#
# 【使用方法】
#   .\deploy-with-token.ps1 -RepoUrl "https://github.com/用户名/仓库名.git" -Token "ghp_token"
#
# 【重要提示】
#   - 首次使用必须运行此脚本配置远程仓库
#   - 需要提供 GitHub Personal Access Token
# ========================================

param(
    [Parameter(Mandatory=$true)]
    [string]$RepoUrl,
    
    [Parameter(Mandatory=$true)]
    [string]$Token,
    
    [string]$CommitMessage = ""
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   🚀 GitHub 快速部署 (使用 Token)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 获取项目目录
$projectDir = $PSScriptRoot
if (-not $projectDir) {
    $projectDir = Get-Location
}
Set-Location $projectDir

# 检查 Git
try {
    $null = git --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 错误: Git 未安装" -ForegroundColor Red
        Write-Host "请先安装 Git: https://git-scm.com/download/win" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ Git 已安装" -ForegroundColor Green
} catch {
    Write-Host "❌ Git 未安装或无法访问" -ForegroundColor Red
    Write-Host "请先安装 Git: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# 初始化仓库（如果需要）
if (-not (Test-Path ".git")) {
    Write-Host "`n📦 初始化 Git 仓库..." -ForegroundColor Yellow
    git init
    git branch -M main
    Write-Host "✅ Git 仓库已初始化" -ForegroundColor Green
}

# 检查并提交更改
Write-Host "`n📋 检查工作区状态..." -ForegroundColor Yellow
Remove-Item ".git\index.lock" -ErrorAction SilentlyContinue
$statusOutput = git status --porcelain 2>&1
if ($statusOutput -and $LASTEXITCODE -eq 0) {
    Write-Host "发现未提交的更改，正在提交..." -ForegroundColor Yellow
    
    if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
        $CommitMessage = "🚀 Auto deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    }
    
    $addResult = git add . 2>&1
    if ($LASTEXITCODE -eq 0) {
        $commitResult = git commit -m $CommitMessage 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Changes committed" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Warning during commit: $commitResult" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  Warning during add: $addResult" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ Working directory clean" -ForegroundColor Green
}

# 配置远程仓库
Write-Host "`n🔍 配置远程仓库..." -ForegroundColor Yellow
$remotes = git remote -v 2>&1
if ($remotes -match "origin" -and $LASTEXITCODE -eq 0) {
    $setUrlResult = git remote set-url origin $RepoUrl 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 已更新远程仓库地址" -ForegroundColor Green
    } else {
        Write-Host "⚠️  更新远程仓库地址时出现警告: $setUrlResult" -ForegroundColor Yellow
    }
} else {
    $addResult = git remote add origin $RepoUrl 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 已添加远程仓库" -ForegroundColor Green
    } else {
        Write-Host "⚠️  添加远程仓库时出现警告: $addResult" -ForegroundColor Yellow
    }
}

# 使用 Token 推送
Write-Host "`n🚀 正在推送到 GitHub..." -ForegroundColor Yellow

# 构建带 token 的 URL
$repoUrlWithToken = $RepoUrl -replace "https://", "https://${Token}@"
$repoUrlWithToken = $repoUrlWithToken -replace "git@github.com:", "https://${Token}@github.com/"

Write-Host "正在推送到: $RepoUrl" -ForegroundColor Cyan

# 设置 credential helper（临时）
$env:GIT_TERMINAL_PROMPT = "0"
git remote set-url origin $repoUrlWithToken

# 推送
try {
    git push -u origin main 2>&1 | ForEach-Object {
        Write-Host $_ -ForegroundColor Gray
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n🎉 部署成功！" -ForegroundColor Green
        Write-Host "您的代码已推送到: $RepoUrl" -ForegroundColor Cyan
        
        # 恢复原始 URL（移除 token）
        git remote set-url origin $RepoUrl
    } else {
        Write-Host "`n❌ 推送失败" -ForegroundColor Red
        # 恢复原始 URL
        git remote set-url origin $RepoUrl
        exit 1
    }
} catch {
    Write-Host "`n❌ 推送失败: $_" -ForegroundColor Red
    # 恢复原始 URL
    git remote set-url origin $RepoUrl
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   ✅ 部署完成" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
