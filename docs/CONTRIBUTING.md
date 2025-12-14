ni # 🤝 贡献指南

感谢您对 GitHub AutoSync 项目的关注！我们欢迎所有形式的贡献。

## 如何贡献

### 报告问题

如果发现 bug 或有功能建议，请：

1. 检查 [Issues](https://github.com/your-username/github-autosync/issues) 是否已有相关问题
2. 如果没有，创建新 Issue
3. 提供详细的问题描述和复现步骤

### 提交代码

1. **Fork 项目**
   ```bash
   git clone https://github.com/your-username/github-autosync.git
   ```

2. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **编写代码**
   - 遵循现有代码风格
   - 添加必要的注释
   - 更新相关文档

4. **提交更改**
   ```bash
   git commit -m "feat: 添加新功能"
   ```

5. **推送并创建 Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

### 代码规范

- 使用有意义的变量和函数名
- 添加必要的注释
- 遵循 PowerShell 最佳实践
- 保持代码简洁易读

### 文档贡献

- 修正拼写错误
- 改进文档结构
- 添加使用示例
- 翻译文档

## 开发环境

### 要求

- Windows 10/11
- PowerShell 5.0+
- Git

### 本地开发

```powershell
# 克隆项目
git clone https://github.com/your-username/github-autosync.git
cd github-autosync

# 运行测试
.\test.ps1

# 运行脚本
.\auto-sync.ps1
```

## 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `style:` 代码格式
- `refactor:` 重构
- `test:` 测试
- `chore:` 构建/工具

示例：
```
feat: 添加配置文件支持
fix: 修复路径处理问题
docs: 更新快速开始指南
```

## 许可证

贡献的代码将使用 MIT 许可证。

---

再次感谢您的贡献！🎉
