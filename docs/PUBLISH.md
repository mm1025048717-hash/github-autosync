# 📦 发布指南

## 如何将 GitHub AutoSync 发布到 GitHub

### 步骤1: 创建 GitHub 仓库

1. 登录 GitHub
2. 点击右上角 "+" → "New repository"
3. 填写信息：
   - Repository name: `github-autosync`
   - Description: `🔄 聊天式自动同步工具 - 一边聊天，一边自动同步到 GitHub`
   - 选择 Public
   - **不要**勾选 "Initialize this repository with a README"
4. 点击 "Create repository"

### 步骤2: 初始化本地仓库

```powershell
# 进入项目目录
cd C:\Users\10250\OneDrive\Desktop\GitHub-AutoSync

# 初始化 Git
git init
git branch -M main

# 添加所有文件
git add .

# 提交
git commit -m "🎉 初始版本发布"
```

### 步骤3: 连接到远程仓库

```powershell
# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/your-username/github-autosync.git

# 或者使用 SSH
# git remote add origin git@github.com:your-username/github-autosync.git
```

### 步骤4: 推送到 GitHub

```powershell
# 使用 Token 推送
.\deploy-with-token.ps1 -RepoUrl "https://github.com/your-username/github-autosync.git" -Token "ghp_your_token_here"

# 或者手动推送
git push -u origin main
```

### 步骤5: 添加仓库描述和标签

在 GitHub 仓库页面：
1. 点击 "Settings" → "General"
2. 添加 Topics（标签）：
   - `github`
   - `autosync`
   - `powershell`
   - `git`
   - `automation`
   - `developer-tools`

### 步骤6: 创建 Release

1. 点击 "Releases" → "Create a new release"
2. 填写信息：
   - Tag: `v1.0.0`
   - Title: `v1.0.0 - 初始版本`
   - Description: 复制 README.md 中的内容
3. 点击 "Publish release"

## 📝 更新仓库信息

### README.md 中的链接

记得更新 README.md 中的链接：
- 将 `your-username` 替换为你的 GitHub 用户名
- 将 `github-autosync` 替换为你的仓库名

### 添加徽章（可选）

在 README.md 顶部添加：

```markdown
![GitHub stars](https://img.shields.io/github/stars/your-username/github-autosync)
![GitHub forks](https://img.shields.io/github/forks/your-username/github-autosync)
![GitHub issues](https://img.shields.io/github/issues/your-username/github-autosync)
```

## 🎯 推广建议

1. **在 README 中添加演示 GIF**
2. **在社交媒体分享**
3. **提交到 Awesome Lists**
4. **在相关社区分享**（如 Reddit、Hacker News）

## ✅ 发布检查清单

- [ ] 所有文件已提交
- [ ] README.md 已更新
- [ ] LICENSE 文件已添加
- [ ] .gitignore 已配置
- [ ] 代码已测试
- [ ] 文档完整
- [ ] 已推送到 GitHub
- [ ] 已创建 Release
- [ ] 仓库描述和标签已添加

---

**发布成功后，所有人就可以使用你的工具了！** 🎉
