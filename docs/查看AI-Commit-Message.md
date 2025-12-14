# 在哪里查看 AI 生成的 Commit Message？

## 📍 显示位置

AI 生成的 commit message 会在以下两个地方显示：

### 1. **实时活动日志**（主要位置）

**位置：** 应用界面中的"实时活动"面板

**显示格式：**
```
提交: feat: add user authentication function (2024-01-15 18:30:45)
```

**如何识别 AI 生成的：**
- 如果配置了 DeepSeek API Key，会先显示：`[AI] DeepSeek generated commit message`
- 然后显示：`提交: <AI 生成的 commit message>`
- 格式通常为：`feat:`, `fix:`, `refactor:` 等约定式提交格式

**示例：**
```
[AI] DeepSeek generated commit message
提交: feat: add user authentication with JWT tokens
```

### 2. **提交历史时间轴**（可视化展示）

**位置：** 应用界面底部的"提交历史"面板

**显示内容：**
- Commit message（完整内容）
- 提交时间
- Commit hash（前 7 位）
- "恢复"按钮

**特点：**
- 时间轴形式展示
- 最近 20 条 commit
- 自动刷新（每 30 秒）

---

## 🔍 如何确认是 AI 生成的？

### 方法 1：查看活动日志
- 如果看到 `[AI] DeepSeek generated commit message`，说明使用了 AI
- 如果只看到 `提交: ...` 没有 AI 提示，说明使用了本地规则

### 方法 2：查看 commit message 格式
- **AI 生成：** 通常更专业，符合约定式提交，例如：
  - `feat: add user authentication with JWT tokens`
  - `refactor: optimize database query performance`
  - `fix: resolve memory leak in image processing`
  
- **本地规则：** 通常更简单，例如：
  - `feat: update main.js (+50 -20)`
  - `config: update configuration files`

### 方法 3：在 GitHub 上查看
1. 打开你的 GitHub 仓库
2. 查看 Commits 页面
3. AI 生成的 commit message 会更专业、更有语义

---

## ⚠️ 当前问题排查

如果看不到 commit message，可能的原因：

### 1. 脚本错误（UnexpectedToken）
**症状：** 活动日志显示 `UnexpectedToken` 错误

**解决方法：**
- 检查 PowerShell 脚本语法
- 确保脚本在正确的目录运行
- 查看完整错误信息

### 2. 没有文件变化
**症状：** 提交计数为 0，历史记录为空

**解决方法：**
- 修改并保存一个文件
- 等待 10 秒（防抖时间）
- 查看活动日志是否有变化

### 3. DeepSeek API 未配置
**症状：** 只看到本地规则生成的 commit message

**解决方法：**
- 在配置界面输入 DeepSeek API Key
- 重启同步服务

### 4. Git 未初始化
**症状：** 无法提交

**解决方法：**
- 确保项目目录已初始化 Git
- 确保已配置 GitHub Token

---

## 🎯 测试步骤

### 完整测试流程：

1. **配置 DeepSeek API Key**
   - 打开应用
   - 在"DeepSeek API Key"输入框中输入你的 API Key
   - 点击"继续"

2. **启动同步**
   - 选择项目文件夹
   - 输入 GitHub Token
   - 点击"开始同步"

3. **修改代码**
   - 打开任意代码文件
   - 添加几行代码（例如：添加一个新函数）
   - 保存文件

4. **观察活动日志**
   - 等待 10 秒
   - 应该看到：
     ```
     [AI] DeepSeek generated commit message
     提交: feat: add <function name> function
     ```

5. **查看历史记录**
   - 滚动到底部"提交历史"面板
   - 应该看到新的 commit
   - 显示完整的 commit message

6. **在 GitHub 上验证**
   - 打开 GitHub 仓库
   - 查看最新的 commit
   - 确认 commit message 是 AI 生成的

---

## 💡 提示

- **AI 生成需要时间：** DeepSeek API 调用通常需要 1-3 秒
- **网络问题：** 如果 API 调用失败，会自动降级到本地规则
- **查看完整信息：** 在 GitHub 上可以看到完整的 commit message 和 diff

---

## 🔗 相关文档

- [DeepSeek API 配置指南](README.md#配置-deepseek-api-key)
- [使用指南](README.md#快速开始)
- [故障排查](README.md#常见问题)

