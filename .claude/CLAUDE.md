# Tabify 项目开发规则

## 修复后验证流程

每次完成问题修复后，必须使用Playwright验证修复效果：

### 验证步骤：
1. 使用 Playwright 访问页面，优先使用 file:/// 协议直接打开本地文件
2. 查看控制台全部信息（不过滤错误）
3. 分析控制台信息确定是否修复成功
4. 如有新问题，根据控制台信息继续修复

### 验证重点：
- 确保目标错误已解决
- 检查是否引入新的错误
- 页面功能是否正常工作

### 命令示例：
```bash
# 访问本地文件验证
mcp__Playwright__browser_navigate url="file:///F:/Desktop/tabify-cc/extension/build/settings.html"
mcp__Playwright__browser_console_messages onlyErrors=false
```

### 规则要求：
- 每次修复完成后必须验证
- 简单快速验证，避免过长时间
- 形成修复-验证的完整闭环