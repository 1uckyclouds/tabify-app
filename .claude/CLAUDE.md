# Tabify 项目开发规则

## 构建规则

### 修改代码后必须重新构建

**重要：修改任何源码后，必须运行构建脚本重新生成扩展文件！**

#### 何时需要运行构建脚本：
- ✅ 修改了 React 组件（`app/` 或 `components/` 目录）
- ✅ 修改了样式文件（CSS、Tailwind 配置）
- ✅ 修改了构建配置（`next.config.js`、`build-extension.js`）
- ✅ 修改了静态资源（图片、字体等）
- ✅ 修复了任何代码问题

#### 构建命令：
```bash
# 完整构建流程（推荐）
npm run build:extension

# 或者分步构建
npm run build           # Next.js 构建
npm run build:extension # Chrome 扩展构建
```

#### 构建产物说明：
- ⚠️ `static-export/` 目录：Next.js 原始输出，**不要直接使用**
- ✅ `extension/build/` 目录：经过处理后的扩展文件，**这才是要使用的**

#### 验证构建成功：
```bash
# 检查文件是否生成
ls extension/build/index.html
ls extension/build/settings.html
ls extension/build/manager.html
```

### 规则要求：
- **禁止直接修改 `static-export/` 目录**：这是构建产物，下次构建会丢失
- **修改源码后必须重新构建**：否则修改不会生效
- **验证时使用 `extension/build/` 目录**：而不是 `static-export/`

---

## 修复后验证流程

每次完成问题修复后，必须使用 Chrome DevTools 验证修复效果：

### 验证步骤：
1. 运行构建脚本：`npm run build:extension`
2. 使用 Chrome DevTools 访问 `extension/build/` 目录中的页面
3. 查看控制台全部信息（不过滤错误）
4. 分析控制台信息确定是否修复成功
5. 如有新问题，根据控制台信息继续修复

### 验证重点：
- 确保目标错误已解决
- 检查是否引入新的错误
- 页面功能是否正常工作

### 命令示例：
```bash
# 1. 构建扩展
npm run build:extension

# 2. 访问本地文件验证（使用 Chrome DevTools）
mcp__chrome-devtools__navigate_page url="file:///F:/Desktop/tabify-cc/extension/build/index.html"
mcp__chrome-devtools__list_console_messages onlyErrors=false
```

### 规则要求：
- 每次修复完成后必须先构建再验证
- 简单快速验证，避免过长时间
- 形成修复-构建-验证的完整闭环
