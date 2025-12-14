# 🔄 GitHub AutoSync

> **一边聊天，一边自动同步到 GitHub！** 让代码同步变得像聊天一样简单。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows-lightgrey.svg)](https://www.microsoft.com/windows)
[![AI Powered](https://img.shields.io/badge/AI-Powered-blue.svg)](https://github.com)

## 🆕 最新更新 (v2.0)

- 🤖 **AI 智能助手** - 内置本地 AI，引导你完成配置，智能回答问题
- 🎨 **全新 UI 设计** - 苹果风格蓝白配色，卡片式布局
- 📁 **原生目录选择** - 使用系统对话框选择目录，更直观
- 💬 **智能对话** - AI 自动引导每一步操作，无需查看文档

## ✨ 项目简介

**GitHub AutoSync** 是一个智能的代码自动同步工具。当你在 Cursor、VS Code 等编辑器中编写代码时，它会自动监听文件变化，并在你继续工作的同时，悄无声息地将更改提交并推送到 GitHub。

**无需手动执行 git 命令，专注于编码，让同步变得自动化！**

## 🎯 核心特点

- 🤖 **AI 智能助手** - 内置 AI 引导，智能回答问题，生成 commit 信息
- 🚀 **零配置启动** - 一键启动，自动配置，开箱即用
- 🖥️ **图形界面版** - 精美的 Electron 应用，苹果质感蓝白设计
- 💻 **命令行版** - 轻量级 PowerShell 脚本，适合高级用户
- ⚡ **实时监听** - 自动监听项目文件变化，即时响应
- ⏱️ **智能防抖** - 避免频繁提交，默认10秒防抖，可自定义
- 🔒 **安全认证** - 使用 GitHub Personal Access Token，安全可靠
- 🎯 **Cursor 联动** - 自动检测 Cursor 编辑器，完美集成
- 📦 **智能排除** - 自动排除 `node_modules`、`.git` 等不需要的目录
- 🎨 **苹果设计** - 蓝白配色，卡片式布局，极简界面

## 🚀 快速开始

### 方式一：图形界面版（推荐新手）⭐

**最简单的方式：**

1. 双击运行根目录的 **`启动图形界面.bat`**
2. 或在 `app` 目录下双击 **`启动应用.bat`**
3. 在图形界面中配置并启动

**详细说明：** 查看 [图形界面使用指南](docs/README-图形界面版.md)

### 方式二：命令行版（推荐高级用户）

**3步快速启动：**

```powershell
# 步骤1：安装（首次使用）
.\scripts\install.ps1

# 步骤2：配置 Token
$env:GITHUB_TOKEN = "ghp_你的token"

# 步骤3：启动自动同步
.\scripts\start.ps1
```

**完成！** 现在你可以开始编码了，所有更改会自动同步到 GitHub。

## 📂 项目结构

```
GitHub-AutoSync/
│
├── README.md                    # 📖 本文件，项目主文档
├── 启动图形界面.bat            # ⭐ 一键启动图形界面（推荐）
│
├── 📖 docs/                     # 完整文档目录
│   ├── README-中文.md          # 中文完整说明
│   ├── README-图形界面版.md    # 图形界面使用指南
│   ├── 使用指南-中文.md        # 详细使用指南
│   ├── QUICKSTART.md            # 5分钟快速上手
│   ├── FAQ.md                   # 常见问题解答
│   └── ADVANCED.md              # 高级用法说明
│
├── 🔧 scripts/                  # PowerShell 脚本（命令行版）
│   ├── auto-sync.ps1           # ⭐ 核心同步脚本
│   ├── start.ps1                # 启动脚本
│   ├── stop.ps1                 # 停止脚本
│   ├── install.ps1              # 安装脚本
│   └── deploy-with-token.ps1    # 部署脚本
│
├── 🖥️ app/                      # 图形界面版（Electron）
│   ├── main.js                  # Electron 主进程
│   ├── index.html               # 界面文件
│   ├── styles.css               # 样式文件（蓝白配色）
│   ├── renderer.js              # 前端交互逻辑
│   ├── package.json             # 依赖配置
│   └── 启动应用.bat             # 从 app 目录启动
│
├── ⚙️ config/                   # 配置文件
│   └── config.json.example      # 配置文件模板
│
└── 📚 detailed-docs/            # 详细文档
    ├── QUICKSTART.md            # 快速开始
    ├── FAQ.md                   # 常见问题
    └── ADVANCED.md              # 高级用法
```

## 📋 核心文件说明

- ⭐ **`scripts/auto-sync.ps1`** - 核心自动同步脚本，负责监听和同步
- ⭐ **`启动图形界面.bat`** - 一键启动图形界面（最简单）
- 🚀 **`scripts/start.ps1`** - 命令行版启动脚本
- ⏹️ **`scripts/stop.ps1`** - 停止自动同步服务

## 🎮 常用命令

```powershell
# 启动自动同步（命令行版）
.\scripts\start.ps1

# 停止自动同步
.\scripts\stop.ps1

# 首次部署到 GitHub
.\scripts\deploy-with-token.ps1 -RepoUrl "https://github.com/用户名/仓库名.git" -Token "ghp_token"
```

## 🔑 获取 GitHub Token

1. 访问 [GitHub Token 设置页面](https://github.com/settings/tokens)
2. 点击 **"Generate new token (classic)"**
3. 填写 Token 名称（如：`AutoSync`）
4. 勾选 `repo` 权限（完整仓库访问权限）
5. 点击 **"Generate token"**
6. **复制 Token**（格式：`ghp_xxxxxxxxxxxx`）

⚠️ **重要提示**：Token 只显示一次，请妥善保存！如果丢失，需要重新生成。

## 📝 配置文件（可选）

创建 `config/config.json`（复制 `config/config.json.example`）：

```json
{
  "github": {
    "repository": "https://github.com/用户名/仓库名.git",
    "branch": "main",
    "token": "ghp_你的token"
  },
  "sync": {
    "debounceSeconds": 10
  },
  "exclude": [
    "node_modules",
    ".git",
    "*.log"
  ]
}
```

## 🎯 使用场景

1. **与 AI 聊天写代码** - 在 Cursor 中与 AI 助手聊天开发，代码自动同步到 GitHub
2. **多设备协作** - 一台设备编辑代码，其他设备自动拉取最新更改
3. **自动备份** - 每次保存文件自动提交，相当于实时备份到云端
4. **团队协作** - 团队成员可以实时看到你的代码更改
5. **版本管理** - 自动记录每次更改，方便回滚和查看历史

## 🆚 图形界面版 vs 命令行版

| 功能 | 图形界面版 | 命令行版 |
|------|----------|---------|
| 启动方式 | 双击启动 | 运行脚本 |
| 配置方式 | 可视化配置 | 编辑文件/环境变量 |
| 状态查看 | 界面实时显示 | 查看终端输出 |
| 日志查看 | 日志页面 | 终端输出 |
| 使用难度 | ⭐ 简单 | ⭐⭐ 中等 |
| 推荐用户 | 新手、普通用户 | 高级用户、开发者 |

**建议：新手使用图形界面版，高级用户可以使用命令行版**

## ❓ 常见问题

### Q: 文件变化后没有自动提交？

**A:** 可能的原因：
1. 防抖时间还没到（默认10秒，文件变化后等待10秒才提交）
2. 文件在排除列表中（如 `node_modules`、`.git` 等）
3. 服务没有运行（检查是否已启动）

### Q: 如何停止服务？

**A:** 
- **图形界面版**：点击界面上的"停止"按钮
- **命令行版（前台运行）**：按 `Ctrl+C`
- **命令行版（后台运行）**：运行 `.\scripts\stop.ps1`

### Q: 支持哪些编辑器？

**A:** 支持所有编辑器！只要文件保存在监听目录中，任何编辑器的更改都会被检测到。特别优化了与 Cursor 的集成。

### Q: 会提交所有文件吗？

**A:** 不会。工具会自动排除：
- `node_modules`、`.git`、`dist`、`build` 等常见目录
- 日志文件、临时文件
- 配置文件中的排除列表

更多问题请查看 [FAQ.md](detailed-docs/FAQ.md)

## 📚 更多文档

- 📖 **中文完整说明**：[docs/README-中文.md](docs/README-中文.md)
- 🖥️ **图形界面指南**：[docs/README-图形界面版.md](docs/README-图形界面版.md)
- 🚀 **快速开始**：[detailed-docs/QUICKSTART.md](detailed-docs/QUICKSTART.md)
- ❓ **常见问题**：[detailed-docs/FAQ.md](detailed-docs/FAQ.md)
- 🔧 **高级用法**：[detailed-docs/ADVANCED.md](detailed-docs/ADVANCED.md)
- 📝 **使用指南**：[docs/使用指南-中文.md](docs/使用指南-中文.md)

## 🔧 系统要求

- **操作系统**：Windows 10/11
- **Node.js**：16+ （图形界面版需要）
- **Git**：已安装并配置（用于版本控制）
- **PowerShell**：5.0+ （命令行版需要）

## 📝 许可证

MIT License - 详见 [LICENSE](docs/LICENSE) 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

查看 [贡献指南](docs/CONTRIBUTING.md) 了解如何参与项目。

---

**让代码同步变得像聊天一样简单！** 🎉

Made with ❤️ by GitHub AutoSync Contributors

