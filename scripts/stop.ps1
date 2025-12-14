# ========================================
# ⏹️ 停止脚本 - GitHub AutoSync
# ========================================
# 【中文说明】
#   停止所有正在运行的自动同步服务
#
# 【使用方法】
#   .\stop.ps1
# ========================================
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
