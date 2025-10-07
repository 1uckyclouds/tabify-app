# Tabify - 智能标签页管理器

一个高效的Chrome浏览器标签页管理扩展，提供一键收纳、智能分组、批量操作等功能，显著提升浏览效率和体验。

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn
- Chrome浏览器 88+

### 安装和运行

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 构建Chrome扩展
npm run build:extension

# 4. 运行测试
npm run test
```

### 安装Chrome扩展

1. 构建扩展：`npm run build:extension`
2. 打开Chrome浏览器
3. 访问 `chrome://extensions/`
4. 开启"开发者模式"
5. 点击"加载已解压的扩展程序"
6. 选择项目根目录下的 `extension` 文件夹

## 📁 项目结构

```
tabify-chrome-extension/
├── 📦 apps/                    # 应用程序
│   ├── web/                   # Next.js Web应用
│   └── extension/             # Chrome扩展源码
├── 📚 docs/                   # 文档
├── 🔧 scripts/                # 构建和开发脚本
├── 🧪 tools/                  # 开发工具和配置
├── 🏗️ extension/             # Chrome扩展构建产物
└── 📊 test-results/           # 测试结果
```

## 🎯 核心功能

- **一键收纳**：快速收纳当前窗口的所有标签页
- **智能分组**：自动按域名或手动创建标签页分组
- **批量操作**：支持批量关闭、移动、复制标签页
- **拖拽排序**：直观的拖拽界面，轻松重新组织标签页
- **实时同步**：标签页状态实时更新，数据自动保存

## 🛠️ 技术栈

- **前端**：Next.js 15.3.2 + React 19 + TypeScript
- **样式**：Tailwind CSS
- **扩展**：Chrome Manifest V3
- **测试**：Playwright
- **构建**：自定义扩展构建脚本

## 📖 文档

详细文档请查看 [docs/](./docs/) 目录：

- [开发指南](./docs/development/)
- [用户指南](./docs/guide/)
- [API文档](./docs/api/)
- [历史报告](./docs/reports/)

## 🧪 测试

```bash
# 运行所有测试
npm run test

# 显示浏览器界面测试
npm run test:headed

# 调试模式测试
npm run test:debug

# 查看测试报告
npm run view-report
```

## 📝 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

## 🤝 贡献

欢迎提交Issue和Pull Request！

---

**Tabify** - 让标签页管理变得简单高效！ 🎯