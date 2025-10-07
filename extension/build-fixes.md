# Build目录路径修复说明

## 问题描述
当扩展代码构建到build目录后，相对路径需要调整，因为build目录成为了扩展的根目录。

## 修复内容

### background.js中的路径修复
1. **管理界面URL**：
   - 修复前：`chrome.runtime.getURL('build/manager.html')`
   - 修复后：`chrome.runtime.getURL('manager.html')`

2. **通知图标路径**：
   - 修复前：`iconUrl: 'build/icons/icon48.png'`
   - 修复后：`iconUrl: 'icons/icon48.png'`

3. **管理界面检测路径**：
   - 修复前：`chrome.runtime.getURL('build/manager.html')`
   - 修复后：`chrome.runtime.getURL('manager.html')`

## 自动修复脚本
运行以下脚本自动修复路径问题：
```bash
node scripts/fix-build-paths.js
```

## 手动修复步骤
如果需要手动修复，请在build/background.js中：
1. 将所有 `'build/manager.html'` 替换为 `'manager.html'`
2. 将所有 `'build/icons/` 替换为 `'icons/`

## 注意事项
- 源代码(extension/background.js)保持原有的`build/`路径不变
- 只有构建后的文件(extension/build/background.js)需要修复路径
- build目录被.gitignore忽略，因此每次构建后都需要重新运行修复脚本