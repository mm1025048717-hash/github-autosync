# 🔄 GitHub AutoSync - 聊天式自动同步工具（中文版）

> **一边聊天，一边自动同步到 GitHub！** 让代码同步变得像聊天一样简单。

## ✨ 这是什么？

**GitHub AutoSync** 是一个智能的代码自动同步工具。当你在 Cursor、VS Code 等编辑器中编写代码时，它会自动监听文件变化，并在你继续工作的同时，悄无声息地将更改提交并推送到 GitHub。

### 🎯 核心特点

- 🚀 **零配置启动** - 一键启动，自动配置
- 👀 **智能监听** - 自动监听项目文件变化
- ⏱️ **防抖机制** - 避免频繁提交，默认10秒防抖
- 🔒 **安全认证** - 使用 GitHub Personal Access Token
- 🎨 **友好界面** - 彩色输出，实时反馈
- 📦 **自动排除** - 智能排除 `node_modules`、`.git` 等目录

## 🚀 快速开始（3步）

### 步骤1：安装

```powershell
.\install.ps1
```

### 步骤2：配置 Token

```powershell
$env:GITHUB_TOKEN = "ghp_你的token"
```

### 步骤3：启动

```powershell
.\start.ps1
```

**完成！** 现在你可以开始编码了。

## 📁 文件说明

### 🔧 核心脚本（重要）

- **`auto-sync.ps1`** - 自动同步主程序 ⭐最重要
- **`start.ps1`** - 启动脚本
- **`stop.ps1`** - 停止脚本
- **`deploy-with-token.ps1`** - 部署脚本（首次使用）
- **`install.ps1`** - 安装脚本

### 📖 文档文件

- **`README-中文.md`** - 本文件，中文版说明
- **`使用指南-中文.md`** - 详细使用指南
- **`目录说明.md`** - 所有文件的说明
- **`docs/QUICKSTART.md`** - 5分钟快速上手
- **`docs/FAQ.md`** - 常见问题

## 🎮 常用命令

```powershell
# 启动自动同步
.\start.ps1

# 停止自动同步
.\stop.ps1

# 首次部署到 GitHub
.\deploy-with-token.ps1 -RepoUrl "https://github.com/用户名/仓库名.git" -Token "ghp_token"
```

## 🔑 获取 GitHub Token

1. 访问 https://github.com/settings/tokens
2. 点击 **Generate new token (classic)**
3. 勾选 `repo` 权限
4. 生成并复制 Token

⚠️ **重要**：Token 只显示一次，请妥善保存！

## 📝 配置文件

创建 `config.json`（复制 `config.json.example`）：

```json
{
  "github": {
    "repository": "https://github.com/用户名/仓库名.git",
    "branch": "main",
    "token": "ghp_你的token"
  },
  "sync": {
    "debounceSeconds": 10
  }
}
```

## 🎯 使用场景

1. **与 AI 聊天写代码** - 在 Cursor 中聊天，代码自动同步
2. **多设备协作** - 一台设备编辑，其他设备拉取
3. **自动备份** - 每次保存自动提交，相当于自动备份

## ❓ 常见问题

### Q: 文件变化后没有自动提交？

**A:** 可能原因：
1. 防抖时间还没到（默认10秒）
2. 文件在排除列表中
3. 服务没有运行

### Q: 如何停止服务？

**A:** 
- 前台运行：按 `Ctrl+C`
- 后台运行：运行 `.\stop.ps1`

更多问题请查看 `docs/FAQ.md`

## 📚 更多文档

- **快速开始**：`docs/QUICKSTART.md`
- **常见问题**：`docs/FAQ.md`
- **高级用法**：`docs/ADVANCED.md`
- **目录说明**：`目录说明.md`

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

**让代码同步变得像聊天一样简单！** 🎉

Made with ❤️ by GitHub AutoSync Contributors
