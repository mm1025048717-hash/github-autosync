# ========================================
# 📁 项目整理脚本 - GitHub AutoSync
# ========================================
# 【中文说明】
#   自动整理项目文件，分类到不同文件夹
#   让项目结构更清晰
# ========================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   📁 GitHub AutoSync 项目整理" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$projectDir = $PSScriptRoot
Set-Location $projectDir

# 创建分类文件夹
Write-Host "📂 创建分类文件夹..." -ForegroundColor Yellow

$folders = @(
    "文档",
    "脚本",
    "图形界面",
    "配置"
)

foreach ($folder in $folders) {
    $folderPath = Join-Path $projectDir $folder
    if (-not (Test-Path $folderPath)) {
        New-Item -ItemType Directory -Path $folderPath -Force | Out-Null
        Write-Host "  ✅ 创建: $folder" -ForegroundColor Green
    } else {
        Write-Host "  ℹ️  已存在: $folder" -ForegroundColor Gray
    }
}

# 移动文档文件
Write-Host "`n📄 整理文档文件..." -ForegroundColor Yellow
$docFiles = @(
    "README-中文.md",
    "README-图形界面版.md",
    "使用指南-中文.md",
    "目录说明.md",
    "快速参考-中文.md",
    "项目说明.md",
    "整理说明.md",
    "完成总结.md",
    "如何发布.md",
    "发布指南-完整版.md",
    "LICENSE",
    "CONTRIBUTING.md",
    "PUBLISH.md"
)

$docMoved = 0
foreach ($file in $docFiles) {
    $source = Join-Path $projectDir $file
    if (Test-Path $source) {
        $dest = Join-Path $projectDir "文档\$file"
        Move-Item -Path $source -Destination $dest -Force -ErrorAction SilentlyContinue
        if (Test-Path $dest) {
            Write-Host "  ✅ 移动: $file" -ForegroundColor Green
            $docMoved++
        }
    }
}
Write-Host "  已移动 $docMoved 个文档文件" -ForegroundColor Cyan

# 移动脚本文件
Write-Host "`n🔧 整理脚本文件..." -ForegroundColor Yellow
$scriptFiles = @(
    "auto-sync.ps1",
    "start.ps1",
    "stop.ps1",
    "deploy-with-token.ps1",
    "install.ps1"
)

$scriptMoved = 0
foreach ($file in $scriptFiles) {
    $source = Join-Path $projectDir $file
    if (Test-Path $source) {
        $dest = Join-Path $projectDir "脚本\$file"
        Move-Item -Path $source -Destination $dest -Force -ErrorAction SilentlyContinue
        if (Test-Path $dest) {
            Write-Host "  ✅ 移动: $file" -ForegroundColor Green
            $scriptMoved++
        }
    }
}
Write-Host "  已移动 $scriptMoved 个脚本文件" -ForegroundColor Cyan

# 移动图形界面文件夹
Write-Host "`n🖥️  整理图形界面..." -ForegroundColor Yellow
if (Test-Path "app") {
    if (Test-Path "图形界面\app") {
        Write-Host "  ℹ️  图形界面文件夹已存在" -ForegroundColor Gray
    } else {
        Move-Item -Path "app" -Destination "图形界面\app" -Force -ErrorAction SilentlyContinue
        if (Test-Path "图形界面\app") {
            Write-Host "  ✅ 移动: app 文件夹" -ForegroundColor Green
        }
    }
}

# 移动配置文件
Write-Host "`n⚙️  整理配置文件..." -ForegroundColor Yellow
$configFiles = @(
    "config.json.example"
)

$configMoved = 0
foreach ($file in $configFiles) {
    $source = Join-Path $projectDir $file
    if (Test-Path $source) {
        $dest = Join-Path $projectDir "配置\$file"
        Move-Item -Path $source -Destination $dest -Force -ErrorAction SilentlyContinue
        if (Test-Path $dest) {
            Write-Host "  ✅ 移动: $file" -ForegroundColor Green
            $configMoved++
        }
    }
}
Write-Host "  已移动 $configMoved 个配置文件" -ForegroundColor Cyan

# 更新脚本中的路径引用
Write-Host "`n🔗 更新路径引用..." -ForegroundColor Yellow

# 更新 start.ps1
$startScript = Join-Path $projectDir "脚本\start.ps1"
if (Test-Path $startScript) {
    $content = Get-Content $startScript -Raw -Encoding UTF8
    $content = $content -replace 'Join-Path \$PSScriptRoot "auto-sync.ps1"', 'Join-Path $PSScriptRoot "auto-sync.ps1"'
    $content = $content -replace 'Join-Path \$PSScriptRoot "config.json"', 'Join-Path (Split-Path $PSScriptRoot -Parent) "配置\config.json"'
    Set-Content $startScript -Value $content -Encoding UTF8
    Write-Host "  ✅ 更新: start.ps1" -ForegroundColor Green
}

# 更新 auto-sync.ps1 中的配置文件路径
$autoSyncScript = Join-Path $projectDir "脚本\auto-sync.ps1"
if (Test-Path $autoSyncScript) {
    $content = Get-Content $autoSyncScript -Raw -Encoding UTF8
    $content = $content -replace 'Join-Path \$projectDir "config.json"', 'Join-Path (Join-Path $projectDir "..") "配置\config.json"'
    $content = $content -replace 'Join-Path \$projectDir "deploy-config.json"', 'Join-Path (Join-Path $projectDir "..") "配置\deploy-config.json"'
    Set-Content $autoSyncScript -Value $content -Encoding UTF8
    Write-Host "  ✅ 更新: auto-sync.ps1" -ForegroundColor Green
}

# 更新图形界面中的脚本路径
$mainJs = Join-Path $projectDir "图形界面\app\main.js"
if (Test-Path $mainJs) {
    $content = Get-Content $mainJs -Raw -Encoding UTF8
    $content = $content -replace 'Join-Path __dirname, "\.\.", "auto-sync.ps1"', 'Join-Path (Join-Path (Split-Path $PSScriptRoot -Parent) "..") "脚本\auto-sync.ps1"'
    $content = $content -replace 'Join-Path __dirname, "\.\.", "config.json"', 'Join-Path (Join-Path (Split-Path $PSScriptRoot -Parent) "..") "配置\config.json"'
    Set-Content $mainJs -Value $content -Encoding UTF8
    Write-Host "  ✅ 更新: app/main.js" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   ✅ 项目整理完成！" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📁 整理后的结构:" -ForegroundColor Yellow
Write-Host "  📖 文档/ - 所有文档文件" -ForegroundColor Gray
Write-Host "  🔧 脚本/ - PowerShell 脚本" -ForegroundColor Gray
Write-Host "  🖥️  图形界面/app/ - Electron 应用" -ForegroundColor Gray
Write-Host "  ⚙️  配置/ - 配置文件" -ForegroundColor Gray

Write-Host "`n💡 提示:" -ForegroundColor Yellow
Write-Host "  - 图形界面启动: 图形界面\app\启动应用.bat" -ForegroundColor Gray
Write-Host "  - 命令行启动: 脚本\start.ps1" -ForegroundColor Gray
