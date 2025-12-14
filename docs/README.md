# 🔄 GitHub AutoSync - 聊天式自动同步工具

> **一边聊天，一边自动同步到 GitHub！** 让代码同步变得像聊天一样简单。

---

## 🖥️ 图形界面版（推荐新手）⭐新增

**现在提供漂亮的图形界面版本！** 无需命令行，点击即可使用！

### 快速启动

1. 进入 `图形界面/app` 目录
2. 双击运行 **`启动应用.bat`**
3. 在界面中配置并启动

**特点：**
- 🎨 蓝白配色，苹果质感界面
- 🖱️ 可视化操作，无需命令行
- 📊 实时状态显示和日志
- 🖱️ 与 Cursor 自动联动

详细说明：查看 [文档/README-图形界面版.md](文档/README-图形界面版.md)

---

## 📖 中文用户请先看这里

**如果你是中文用户，建议先查看以下中文文档：**

- 📄 **[文档/README-中文.md](文档/README-中文.md)** - 中文版完整说明
- 📄 **[文档/使用指南-中文.md](文档/使用指南-中文.md)** - 详细中文使用指南
- 📄 **[文档/目录说明.md](文档/目录说明.md)** - 所有文件的中文说明
- 📄 **[文档/README-图形界面版.md](文档/README-图形界面版.md)** - 图形界面使用指南

**核心文件说明：**
- ⭐ **`脚本/auto-sync.ps1`** - 自动同步主程序（最重要）
- 🚀 **`脚本/start.ps1`** - 启动脚本（命令行版）
- 🖥️ **`图形界面/app/启动应用.bat`** - 图形界面启动（推荐新手）
- ⏹️ **`脚本/stop.ps1`** - 停止脚本
- 📦 **`脚本/deploy-with-token.ps1`** - 部署脚本（首次使用）

---

## 🇨🇳 快速开始（中文）

### 图形界面版（推荐）

```powershell
cd 图形界面/app
# 双击：启动应用.bat
# 或：npm install && npm start
```

### 命令行版

```powershell
cd 脚本
.\start.ps1
```

---

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform: Windows](https://img.shields.io/badge/Platform-Windows-blue.svg)](https://www.microsoft.com/windows)

## ✨ 产品简介

**GitHub AutoSync** 是一款智能的代码自动同步工具，专为开发者设计。当你在 Cursor、VS Code 或其他编辑器中编写代码时，它会自动监听文件变化，并在你继续工作的同时，悄无声息地将更改提交并推送到 GitHub。

### 🎯 核心特点

- 🚀 **零配置启动** - 一键启动，自动配置
- 👀 **智能监听** - 自动监听项目文件变化
- ⏱️ **防抖机制** - 避免频繁提交，默认10秒防抖
- 🔒 **安全认证** - 使用 GitHub Personal Access Token
- 🎨 **友好界面** - 彩色输出，实时反馈
- 📦 **自动排除** - 智能排除 `node_modules`、`.git` 等目录
- 🔄 **后台运行** - 支持后台模式，不占用终端

## 🚀 快速开始

### 方式一：图形界面版（推荐新手）⭐

1. **下载项目**
   ```bash
   git clone https://github.com/mm1025048717-hash/github-autosync.git
   cd github-autosync
   ```

2. **启动图形界面**
   ```powershell
   cd 图形界面/app
   # 双击运行：启动应用.bat
   # 或命令行：
   npm install
   npm start
   ```

3. **在界面中配置并启动**
   - 选择项目目录
   - 填写 GitHub Token
   - 点击"启动自动同步"

详细说明：查看 [文档/README-图形界面版.md](文档/README-图形界面版.md)

### 方式二：命令行版（推荐高级用户）

1. **下载项目**
   ```bash
   git clone https://github.com/mm1025048717-hash/github-autosync.git
   cd github-autosync
   ```

2. **运行安装脚本**
   ```powershell
   cd 脚本
   .\install.ps1
   ```

3. **启动自动同步**
   ```powershell
   .\start.ps1
   ```

## 📁 项目结构

```
github-autosync/
├── 📖 文档/                        # 所有文档文件
│   ├── README-中文.md
│   ├── README-图形界面版.md
│   └── ...
│
├── 🔧 脚本/                        # PowerShell 脚本
│   ├── auto-sync.ps1              # ⭐核心脚本
│   ├── start.ps1
│   ├── stop.ps1
│   └── ...
│
├── 🖥️ 图形界面/                    # Electron 应用
│   └── app/
│       ├── 启动应用.bat            # ⭐一键启动
│       └── ...
│
├── ⚙️ 配置/                        # 配置文件
│   └── config.json.example
│
└── 📚 详细文档/                    # 详细文档
    └── docs/
```

## 🔑 获取 GitHub Token

1. 访问 [GitHub Settings](https://github.com/settings/tokens)
2. 点击 **Developer settings** → **Personal access tokens** → **Tokens (classic)**
3. 点击 **Generate new token (classic)**
4. 勾选 `repo` 权限
5. 生成并复制 Token（格式：`ghp_xxxxxxxxxxxx`）

⚠️ **重要**：Token 只显示一次，请妥善保存！

## 📖 使用指南

### 图形界面版

1. 启动应用
2. 点击"配置" → 选择项目目录 → 填写 Token
3. 点击"启动自动同步"
4. 在 Cursor 中编码，代码自动同步

### 命令行版

```powershell
# 启动自动同步
cd 脚本
.\start.ps1

# 停止同步
.\stop.ps1
```

## 🎯 使用场景

1. **与 AI 聊天写代码** - 在 Cursor 中聊天，代码自动同步
2. **多设备协作** - 一台设备编辑，其他设备拉取
3. **自动备份** - 每次保存自动提交，相当于自动备份

## 🐛 常见问题

### Q: 为什么文件变化后没有自动提交？

**A:** 可能的原因：
1. 文件在排除列表中
2. 防抖时间还没到（等待中）
3. Git 工作区没有实际变化
4. 服务没有正常运行

### Q: 如何查看实时日志？

**A:** 
- **图形界面版**：在"日志"页面查看
- **命令行版**：日志直接显示在控制台

### Q: Token 安全吗？

**A:** 
- Token 不会保存在代码中
- 建议使用环境变量存储
- 脚本运行后会自动从远程 URL 中移除 Token

## 📝 更新日志

### v1.0.0 (2025-12-14)
- ✨ 初始版本发布
- 🚀 支持文件自动监听和同步
- 🔒 支持 GitHub Token 认证
- ⏱️ 支持防抖机制
- 📦 支持自动排除目录
- 🖥️ **新增图形界面版本**

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License - 详见 [文档/LICENSE](文档/LICENSE) 文件

---

**让代码同步变得像聊天一样简单！** 🎉

Made with ❤️ by GitHub AutoSync Contributors

---

**⭐ 如果这个项目对你有帮助，请给个 Star！**
