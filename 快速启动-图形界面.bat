@echo off
chcp 65001 >nul
title GitHub AutoSync - 图形界面
echo.
echo ========================================
echo   GitHub AutoSync - 图形界面启动
echo ========================================
echo.

cd /d "%~dp0"

REM 检查 Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js
    echo.
    echo 请先安装 Node.js: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [信息] 已检测到 Node.js
echo.

REM 进入图形界面目录
if exist "app" (
    cd "app"
    echo [信息] 进入 app 目录
) else (
    echo [错误] 找不到 app 目录
    pause
    exit /b 1
)

REM 检查是否已安装依赖
if not exist "node_modules" (
    echo [安装] 正在安装依赖，请稍候...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
    echo.
    echo [完成] 依赖安装成功
    echo.
) else (
    echo [信息] 依赖已安装
    echo.
)

REM 启动应用
echo [启动] 正在启动图形界面...
echo.
call npm start

if %errorlevel% neq 0 (
    echo.
    echo [错误] 启动失败
    pause
)

