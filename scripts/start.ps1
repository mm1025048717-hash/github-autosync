# ========================================
# 🚀 启动脚本 - GitHub AutoSync
# ========================================
# 【中文说明】
#   一键启动自动同步服务
#   会自动读取配置文件和环境变量
#
# 【使用方法】
#   .\start.ps1
#   或：.\start.ps1 -Token "你的token"
# ========================================
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
