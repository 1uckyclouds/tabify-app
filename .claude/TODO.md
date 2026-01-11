# TODO - 待修复问题列表

## ~~问题1：页面返回时加载遮罩不消失且数据不显示~~ ✅ 已修复

### 修复时间
2025-01-09（第二次修复）

### 原始问题
1. 打开主页面时，标签页数据不显示
2. 需要点击页面或按键盘后，数据才出现
3. React hydration 错误：`Cannot read properties of null (reading 'firstChild')`
4. CSS 语法错误：`c1c7fe9232dc5d6a.css:1 Uncaught SyntaxError: Invalid or unexpected token`

### 根本原因
1. **CSS @import 路径问题**：`globals.css` 中的 `@import url('/remixicon.min.css')` 在构建时被转换为相对路径 `../../../assets/fonts/remixicon.min.css`，在 Chrome 扩展环境中无法正确解析
2. **React Hydration 问题**：加载遮罩和错误遮罩被 SSR 写入静态 HTML，导致 React hydration 时出现 DOM 结构不匹配

### 修复方案

#### 修复1：移除 CSS @import，改用 `<link>` 标签

**修改文件：**
- [apps/app/globals.css](apps/app/globals.css) - 注释掉 `@import url('/remixicon.min.css')`
- [apps/build-extension.js](apps/build-extension.js:491) - 在 HTML 中添加 `<link rel="stylesheet" href="assets/remixicon.min.css">`

**原理：** 避免使用 CSS @import 的相对路径，改用 HTML `<link>` 标签，确保路径在 Chrome 扩展环境中正确解析

#### 修复2：使用 `ClientOnly` 组件包裹加载遮罩和错误遮罩

**修改文件：** [apps/app/page.tsx:1447-1507](apps/app/page.tsx#L1447-L1507)

**修改内容：**
```tsx
{/* 加载状态显示 - 使用ClientOnly包裹防止SSR */}
<ClientOnly>
  {isLoading && (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      {/* ... */}
    </div>
  )}
</ClientOnly>

{/* 错误状态显示 - 使用ClientOnly包裹防止SSR */}
<ClientOnly>
  {error && (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      {/* ... */}
    </div>
  )}
</ClientOnly>
```

**原理：** `ClientOnly` 组件使用 `useEffect` 和 `useState` 确保其子组件只在客户端渲染，跳过 SSR，从而避免 React hydration 错误

### 验证结果
✅ CSS 文件中无 @import 语句
✅ 静态 HTML 中无加载遮罩内容（"正在初始化应用" 计数为 0）
✅ HTML 中正确添加了 remixicon 的 `<link>` 标签
✅ 构建成功，无语法错误

### 相关技术点
- **ClientOnly 组件**：使用 `useEffect` 和 `hasMounted` 状态确保子组件只在客户端渲染
- **CSS @import 问题**：Chrome 扩展环境中的路径解析限制
- **React Hydration**：服务器端渲染和客户端渲染的 DOM 结构必须匹配

---

## ~~问题2：浏览器自动生成的 favicon 404 错误~~ ✅ 已修复

### 修复时间
2025-01-10

### 原始问题
控制台频繁出现浏览器自动生成的 favicon 404 错误：
```
favicon.ico:1 Failed to load resource: net::ERR_FILE_NOT_FOUND
```

这些错误是 Chrome 浏览器自动尝试获取 `/favicon.ico` 导致的，不是应用代码输出的。

### 根本原因
浏览器在加载 HTML 页面时，如果没有显式声明 favicon，会自动尝试请求 `/favicon.ico`。在 Chrome 扩展环境中，这个文件不存在，导致 404 错误。

### 修复方案

**修改文件：** [apps/build-extension.js:489-497](apps/build-extension.js#L489-L497)

**修改内容：**
```javascript
const extensionScriptRef = `
  <!-- Chrome扩展桥梁脚本 -->
  <!-- Remixicon图标字体 -->
  <link rel="stylesheet" href="assets/fonts/remixicon.min.css">
  <!-- 空favicon阻止浏览器自动请求/favicon.ico -->
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📑</text></svg>">
  <script src="chrome-extension-bridge.js"></script>
`;
```

**原理：** 使用 data URI 提供一个内联的 SVG favicon，包含一个书签 emoji (📑)，既阻止了浏览器的自动 404 请求，也为应用添加了一个视觉上合适的图标。

### 验证结果
✅ 所有 HTML 文件都包含 favicon 链接
✅ favicon 使用内联 data URI，无额外请求
✅ 构建成功，无错误

### 相关技术点
- **Data URI**：将资源直接嵌入 URL，避免额外 HTTP 请求
- **SVG Favicon**：使用 SVG 提供可缩放的矢量图标
- **浏览器行为**：显式声明 favicon 可阻止浏览器的自动请求

---

## ~~问题3：导入导出页面的备份逻辑错误~~ ✅ 已修复

### 修复时间
2025-01-11

### 原始问题
在 `import-export.html` 页面中：
1. 用户**不勾选**"创建备份"选项
2. 导入标签页数据
3. 导入完成后，系统依然会自动弹出/下载备份文件

### 根本原因
`apps/lib/import-export.ts` 中的快捷函数 `quickImportData` 和 `quickImportText` 将 `createBackup` 硬编码为 `true`，完全忽略了用户在页面上的选择。

**问题代码（第 876-886 行和 891-900 行）：**
```typescript
export const quickImportData = async (file: File): Promise<ImportResult> => {
  const service = getImportExportService();
  const options: ImportOptions = {
    overwriteExisting: false,
    importSettings: true,
    duplicateStrategy: 'rename',
    createBackup: true,  // ❌ 硬编码为 true
  };
  return await service.importFromFile(file, options);
};
```

### 修复方案

#### 修改1：快捷函数支持 options 参数

**文件：** [apps/lib/import-export.ts](apps/lib/import-export.ts)

**修改内容：**
```typescript
// 修改前：不接受 options 参数，createBackup 硬编码为 true
export const quickImportData = async (file: File): Promise<ImportResult> => {
  // ...
  createBackup: true,  // ❌
};

// 修改后：接受 options 参数，允许覆盖默认值
export const quickImportData = async (
  file: File,
  options?: Partial<ImportOptions>
): Promise<ImportResult> => {
  const service = getImportExportService();
  const defaultOptions: ImportOptions = {
    overwriteExisting: false,
    importSettings: true,
    duplicateStrategy: 'rename',
    createBackup: true,
  };
  const finalOptions = { ...defaultOptions, ...options };
  return await service.importFromFile(file, finalOptions);
};
```

**同时修改 `quickImportText` 函数（第 894-912 行）：** 使用相同的模式。

#### 修改2：页面传递用户实际选择

**文件：** [apps/app/import-export/page.tsx](apps/app/import-export/page.tsx)

**修改内容：**
```typescript
// handleFileSelect 中（第 66 行）
const result = await quickImportData(file, importOptions);

// handleTextImport 中（第 218 行）
const result = await quickImportText(textInput, importOptions);
```

### 验证结果
✅ 用户未勾选"创建备份"时，导入后不会自动下载备份文件
✅ 用户勾选"创建备份"时，导入后会正常下载备份文件
✅ 其他导入选项（导入设置、重复数据处理）也能正常工作

### 相关技术点
- **Partial\<T\> 类型**：TypeScript 工具类型，将 T 的所有属性变为可选
- **对象展开合并**：`{ ...defaultOptions, ...options }` 用 options 覆盖 defaultOptions 中的相同属性
- **用户体验设计**：尊重用户的选择，不应该有隐藏的强制行为
