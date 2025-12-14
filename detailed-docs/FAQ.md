# ❓ 常见问题

## 基础问题

### Q: 这个工具是做什么的？

**A:** GitHub AutoSync 是一个自动同步工具，当你编辑代码时，它会自动将更改提交并推送到 GitHub，让你可以专注于编码，而不需要手动执行 git 命令。

### Q: 支持哪些操作系统？

**A:** 目前支持 Windows（PowerShell 5.0+）。Linux 和 macOS 版本正在开发中。

### Q: 需要安装什么？

**A:** 
- Windows PowerShell 5.0 或更高版本
- Git（用于版本控制）

### Q: 安全吗？

**A:** 
- ✅ Token 不会保存在代码中
- ✅ 使用环境变量存储 Token（推荐）
- ✅ 脚本运行后会自动从远程 URL 中移除 Token
- ✅ 开源代码，可自行审查

## 使用问题

### Q: 为什么文件变化后没有自动提交？

**A:** 可能的原因：
1. **文件在排除列表中** - 检查 `config.json` 中的 `excludePatterns`
2. **防抖时间还没到** - 默认等待10秒，避免频繁提交
3. **Git 工作区没有实际变化** - 文件内容可能没有改变
4. **服务没有正常运行** - 检查服务是否在运行

### Q: 如何查看实时日志？

**A:** 
```powershell
# 前台模式：日志直接显示在控制台
# 后台模式：
Get-Job
Receive-Job -Id <作业ID> -Keep
```

### Q: 可以修改防抖时间吗？

**A:** 可以！
```powershell
# 方式1: 命令行参数
.\auto-sync.ps1 -DebounceSeconds 15

# 方式2: 配置文件
# 编辑 config.json，修改 debounceSeconds
```

### Q: 如何停止服务？

**A:** 
```powershell
# 前台模式：按 Ctrl+C
# 后台模式：运行停止脚本
.\stop.ps1
```

### Q: 支持多个项目吗？

**A:** 可以！每个项目目录运行一个实例即可。建议为每个项目设置不同的配置文件。

## 配置问题

### Q: Token 应该放在哪里？

**A:** 推荐方式（按优先级）：
1. **环境变量**（最安全）
   ```powershell
   $env:GITHUB_TOKEN = "ghp_xxx"
   ```
2. **配置文件** `config.json`
3. **命令行参数**（不推荐，会显示在历史记录中）

### Q: 如何自定义排除规则？

**A:** 编辑 `config.json` 或 `auto-sync.ps1` 中的 `$excludePatterns` 数组：
```json
{
  "sync": {
    "excludePatterns": [
      ".git",
      "node_modules",
      "你的自定义目录"
    ]
  }
}
```

### Q: 可以修改提交信息格式吗？

**A:** 可以！编辑 `auto-sync.ps1` 中的 `Commit-And-Push` 函数，修改 `$commitMessage` 的生成逻辑。

## 故障排除

### Q: 提示 "Git 未安装"

**A:** 
1. 访问 https://git-scm.com/download/win 下载安装 Git
2. 安装后重启 PowerShell
3. 运行 `git --version` 验证安装

### Q: 提示 "未配置远程仓库"

**A:** 
1. 运行部署脚本：
   ```powershell
   .\deploy-with-token.ps1 -RepoUrl "https://github.com/username/repo.git" -Token "ghp_xxx"
   ```
2. 或手动配置：
   ```powershell
   git remote add origin https://github.com/username/repo.git
   ```

### Q: 推送失败

**A:** 检查：
1. Token 是否正确且有 `repo` 权限
2. 仓库地址是否正确
3. 是否有推送权限
4. 网络连接是否正常

### Q: 服务无法启动

**A:** 
1. 检查 PowerShell 版本：`$PSVersionTable.PSVersion`
2. 检查执行策略：`Get-ExecutionPolicy`
3. 如果受限，运行：`Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`

## 高级问题

### Q: 可以同时监听多个目录吗？

**A:** 目前不支持，但可以为每个目录运行一个实例。

### Q: 支持 Git 分支吗？

**A:** 支持！默认使用 `main` 分支，可以在配置文件中修改。

### Q: 可以集成到 CI/CD 吗？

**A:** 这个工具主要用于开发时的自动同步，不建议用于 CI/CD。CI/CD 应该使用 GitHub Actions 等专业工具。

### Q: 会影响 Git 历史记录吗？

**A:** 会创建提交记录，但不会影响现有的 Git 历史。所有提交都是正常的 Git 提交，可以随时查看和回退。

## 其他问题

### Q: 有图形界面吗？

**A:** 目前只有命令行界面，图形界面版本正在规划中。

### Q: 可以贡献代码吗？

**A:** 当然可以！欢迎提交 Issue 和 Pull Request。

### Q: 有使用限制吗？

**A:** 
- 遵循 GitHub API 速率限制
- 建议不要过于频繁提交（使用防抖机制）
- 遵守 GitHub 服务条款

---

还有问题？请提交 [Issue](https://github.com/your-username/github-autosync/issues)
