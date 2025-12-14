# 🚀 快速开始指南

## 5分钟快速上手

### 步骤1: 下载项目

```bash
git clone https://github.com/your-username/github-autosync.git
cd github-autosync
```

### 步骤2: 运行安装脚本

```powershell
.\install.ps1
```

安装脚本会：
- ✅ 检查系统要求
- ✅ 创建配置文件
- ✅ 设置便捷脚本

### 步骤3: 获取 GitHub Token

1. 访问 https://github.com/settings/tokens
2. 点击 **Generate new token (classic)**
3. 勾选 `repo` 权限
4. 生成并复制 Token

### 步骤4: 配置项目

```powershell
# 设置环境变量（推荐）
$env:GITHUB_TOKEN = "ghp_your_token_here"

# 或者编辑 config.json
# 复制 config.json.example 为 config.json 并填入信息
Copy-Item config.json.example config.json
```

### 步骤5: 配置 Git 仓库

```powershell
# 如果还没有 Git 仓库
git init
git remote add origin https://github.com/username/repo.git

# 或者使用部署脚本
.\deploy-with-token.ps1 -RepoUrl "https://github.com/username/repo.git" -Token "ghp_xxx"
```

### 步骤6: 启动自动同步

```powershell
# 方式1: 使用便捷脚本
.\start.ps1

# 方式2: 直接运行
.\auto-sync.ps1 -Token "ghp_xxx"
```

### 步骤7: 开始编码！

现在你可以：
- ✅ 在 Cursor、VS Code 中编辑代码
- ✅ 保存文件后自动同步到 GitHub
- ✅ 继续聊天，代码自动提交

## 🎉 完成！

现在你的代码会自动同步到 GitHub 了！

## 📝 下一步

- 查看 [FAQ](FAQ.md) 了解常见问题
- 查看 [高级用法](ADVANCED.md) 了解更多功能
- 查看 [README](../README.md) 了解完整文档
