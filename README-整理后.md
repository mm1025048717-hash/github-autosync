# 📁 GitHub AutoSync - 整理后的项目结构

## ✅ 整理完成

项目文件已按功能分类整理，使用中文文件夹名，结构清晰明了。

## 📂 目录结构

```
GitHub-AutoSync/
│
├── README.md                    # 主文档
├── 快速启动-图形界面.bat        # ⭐一键启动图形界面
│
├── 📖 文档/                      # 所有文档
│   ├── README-中文.md
│   ├── README-图形界面版.md
│   ├── 使用指南-中文.md
│   └── ...
│
├── 🔧 脚本/                      # PowerShell 脚本
│   ├── auto-sync.ps1            # ⭐核心脚本
│   ├── start.ps1
│   ├── stop.ps1
│   └── ...
│
├── 🖥️ app/                       # 图形界面（Electron）
│   ├── main.js
│   ├── index.html
│   ├── styles.css
│   ├── renderer.js
│   ├── package.json
│   └── 启动应用.bat
│
├── ⚙️ 配置/                      # 配置文件
│   └── config.json.example
│
└── 📚 详细文档/                  # 详细文档
    └── docs/
```

## 🚀 快速启动

### 图形界面版

**最简单的方式：**
```
双击：快速启动-图形界面.bat
```

**或进入目录：**
```powershell
cd app
双击：启动应用.bat
```

### 命令行版

```powershell
cd 脚本
.\start.ps1
```

## 📋 文件说明

### 核心文件

- **`脚本/auto-sync.ps1`** - 自动同步主程序 ⭐最重要
- **`快速启动-图形界面.bat`** - 一键启动图形界面 ⭐推荐
- **`app/启动应用.bat`** - 图形界面目录内启动

### 文档文件

- **`文档/README-中文.md`** - 中文完整说明
- **`文档/使用指南-中文.md`** - 详细使用指南
- **`文档/目录说明.md`** - 文件结构说明

---

**现在项目结构清晰，所有文件都有中文标记！** 🎉

