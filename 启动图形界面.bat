@echo off
chcp 65001 >nul
echo ========================================
echo   GitHub AutoSync - 图形界面启动
echo ========================================
echo.

cd /d "%~dp0"

REM 检查 Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未检测到 Node.js
    echo 请先安装 Node.js: https://nodejs.org/
    pause
    exit /b 1
)

REM 进入图形界面目录
if exist "图形界面\app" (
    cd "图形界面\app"
) else if exist "app" (
    cd "app"
) else (
    echo ❌ 找不到图形界面目录
    pause
    exit /b 1
)

REM 检查是否已安装依赖
if not exist "node_modules" (
    echo 📦 正在安装依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
)

REM 启动应用
echo 🚀 正在启动应用...
call npm start

pause

