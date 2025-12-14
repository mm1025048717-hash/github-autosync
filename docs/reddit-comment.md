# GitHub AutoSync - AI-Powered Git Automation Tool

## What it does
- 🤖 **AI-generated commit messages** using DeepSeek API
- 💾 **Real-time backup** - Every save automatically commits to GitHub
- 🔄 **Multi-device sync** - Code syncs across all your devices
- 📅 **Visual timeline** - See all your commits in a beautiful timeline
- ⏪ **One-click rollback** - Restore any previous version instantly
- 🧠 **Smart filtering** - Skips meaningless commits (temp files, formatting only)

## Why I built this
As a developer, I was tired of:
- Writing commit messages manually
- Losing code when my laptop crashed
- Switching between devices and losing context
- Forgetting to commit important changes

So I built this tool that runs in the background and handles everything automatically.

## Tech Stack
- **Electron** - Cross-platform desktop app
- **DeepSeek API** - AI commit message generation
- **PowerShell/Node.js** - File watching & Git automation
- **Apple-inspired UI** - Clean, minimal design

## Features
✅ **Zero configuration** - Just select your project folder
✅ **Works offline** - Falls back to rule-based commit messages if API is unavailable
✅ **Multi-platform** - Windows, macOS, Linux
✅ **Open source** - MIT License

## Try it
🔗 **GitHub:** https://github.com/mm1025048717-hash/github-autosync

## How it works
1. Select your project folder
2. Configure GitHub token (and optional DeepSeek API key)
3. Start sync - it watches for file changes
4. When you save a file, it automatically:
   - Analyzes changes with AI
   - Generates a meaningful commit message
   - Commits and pushes to GitHub
   - Updates the visual timeline

**Feedback welcome!** What features would you like to see next?

