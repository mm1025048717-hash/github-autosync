# 打包所有平台
Write-Host "开始打包 GitHub AutoSync..." -ForegroundColor Cyan

# 检查依赖
if (-not (Test-Path "node_modules")) {
    Write-Host "安装依赖..." -ForegroundColor Yellow
    npm install
}

# 打包 Windows
Write-Host "`n打包 Windows..." -ForegroundColor Green
npm run build -- --win

# 打包 macOS (需要在 macOS 系统上运行)
if ($IsMacOS -or $env:OS -eq "Darwin") {
    Write-Host "`n打包 macOS..." -ForegroundColor Green
    npm run build -- --mac
}

# 打包 Linux
Write-Host "`n打包 Linux..." -ForegroundColor Green
npm run build -- --linux

Write-Host "`n打包完成！文件在 dist 目录中" -ForegroundColor Green

