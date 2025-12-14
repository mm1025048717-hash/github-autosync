# 🔄 GitHub AutoSync

Automatically sync your code to GitHub while coding in Cursor. No manual commits needed!

## ✨ Features

- 🚀 **Auto-sync**: Automatically commits and pushes changes to GitHub
- 🖥️ **GUI Version**: Beautiful Electron app with Apple-like design
- 💻 **CLI Version**: Lightweight PowerShell scripts
- ⚡ **Real-time**: Monitors file changes and syncs instantly
- 🔒 **Secure**: Uses GitHub Personal Access Tokens
- 🎯 **Cursor Integration**: Detects Cursor editor automatically

## 🚀 Quick Start

### GUI Version (Recommended) ⭐

**Easiest way:**
```
Double-click: start-gui.bat
```

**Or navigate to directory:**
```powershell
cd app
Double-click: start-app.bat
```

### CLI Version

```powershell
cd scripts
.\start.ps1
```

## 📂 Project Structure

```
GitHub-AutoSync/
│
├── README.md                    # Main documentation
├── start-gui.bat               # ⭐ Launch GUI (root)
│
├── 📖 docs/                     # All documentation
│   ├── README-zh.md            # Chinese documentation
│   ├── README-gui-zh.md        # GUI guide (Chinese)
│   └── ...
│
├── 🔧 scripts/                  # PowerShell scripts
│   ├── auto-sync.ps1           # ⭐ Core sync script
│   ├── start.ps1                # Start script
│   ├── stop.ps1                 # Stop script
│   └── ...
│
├── 🖥️ app/                      # GUI (Electron)
│   ├── main.js                  # Electron main process
│   ├── index.html               # UI file
│   ├── styles.css               # Styles (blue/white theme)
│   └── start-app.bat            # Launch from app dir
│
├── ⚙️ config/                   # Configuration
│   └── config.json.example      # Config template
│
└── 📚 detailed-docs/            # Detailed documentation
    └── docs/
        ├── QUICKSTART.md
        ├── FAQ.md
        └── ADVANCED.md
```

## 📋 Core Files

- ⭐ **`scripts/auto-sync.ps1`** - Core sync script
- ⭐ **`start-gui.bat`** - Launch GUI (root)
- 🚀 **`scripts/start.ps1`** - CLI start
- ⏹️ **`scripts/stop.ps1`** - Stop service

## 📖 Documentation

- **English**: This README
- **Chinese**: `docs/README-zh.md`
- **GUI Guide**: `docs/README-gui-zh.md`
- **Usage Guide**: `docs/usage-guide-zh.md`

## 🎯 Usage

1. **Configure**: Set your GitHub token and repository URL
2. **Start**: Launch GUI or run CLI script
3. **Code**: Edit files in Cursor
4. **Auto-sync**: Changes automatically sync to GitHub

## 📝 License

MIT License - see LICENSE file for details

---

**Made with ❤️ for developers who want seamless GitHub sync**

