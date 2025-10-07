# Tabify - 智能标签页管理器

一个高效的Chrome浏览器标签页管理扩展，提供一键收纳、智能分组、批量操作等功能，显著提升浏览效率和体验。

## 🚀 功能特性

### 核心功能
- **一键收纳**：快速收纳当前窗口的所有标签页
- **智能分组**：自动按域名或手动创建标签页分组
- **批量操作**：支持批量关闭、移动、复制标签页
- **拖拽排序**：直观的拖拽界面，轻松重新组织标签页
- **实时同步**：标签页状态实时更新，数据自动保存

### 高级特性
- **iframe集成**：支持在网页中嵌入管理界面
- **快捷键支持**：
  - `Ctrl+Shift+T` (Mac: `Cmd+Shift+T`) - 一键收纳标签页
  - `Ctrl+Shift+M` (Mac: `Cmd+Shift+M`) - 打开管理界面
- **跨窗口管理**：统一管理多个浏览器窗口的标签页
- **数据持久化**：使用Chrome存储API安全保存数据

## 🛠️ 技术栈

### 前端技术
- **Next.js 15.3.2** - React全栈框架
- **React 19** - 用户界面库
- **TypeScript** - 类型安全的JavaScript
- **Tailwind CSS** - 实用优先的CSS框架
- **@dnd-kit** - 现代拖拽功能库

### Chrome扩展技术
- **Manifest V3** - 最新的Chrome扩展规范
- **Service Worker** - 后台脚本处理
- **Chrome APIs** - 标签页、存储、通知等API
- **Content Security Policy** - 安全策略配置

### 开发工具
- **ESLint** - 代码质量检查
- **PostCSS** - CSS后处理器
- **Cross-env** - 跨平台环境变量

## 📦 项目结构

```
TabifyAI_SOLO/
├── 主界面/                    # Next.js Web应用
│   ├── app/                   # Next.js App Router页面
│   ├── components/            # React组件
│   ├── lib/                   # 工具库和服务
│   ├── hooks/                 # 自定义React Hooks
│   ├── styles/                # 样式文件
│   └── package.json           # 依赖配置
├── extension/                 # Chrome扩展文件
│   ├── manifest.json          # 扩展配置文件
│   ├── background.js          # 后台脚本
│   ├── manager.html           # 管理界面HTML
│   ├── icons/                 # 扩展图标
│   └── build/                 # 构建输出目录
└── README.md                  # 项目说明文档
```

## 🚀 快速开始

### 环境要求
- Node.js 18+ 
- npm 或 yarn
- Chrome浏览器 88+

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/your-username/tabify-chrome-extension.git
   cd tabify-chrome-extension
   ```

2. **安装依赖**
   ```bash
   cd 主界面
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```
   访问 http://localhost:3000 查看Web界面

4. **构建Chrome扩展**
   ```bash
   npm run build:extension
   ```

5. **安装Chrome扩展**
   - 打开Chrome浏览器
   - 访问 `chrome://extensions/`
   - 开启"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择项目根目录下的 `extension` 文件夹

## 🔧 开发指南

### 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 构建Chrome扩展
npm run build:extension

# 代码检查
npm run lint
```

### 开发环境配置

1. **环境变量**
   - 开发环境会自动使用 `NODE_ENV=development`
   - 服务器绑定到 `0.0.0.0:3000` 支持外部访问

2. **热重载**
   - Web应用支持热重载
   - Chrome扩展需要手动重新加载

3. **调试**
   - 使用Chrome DevTools调试Web应用
   - 使用Chrome扩展开发者工具调试扩展

### 核心架构

#### ChromeService桥接层
- 统一的Chrome API访问接口
- 支持扩展环境和Web环境的无缝切换
- PostMessage通信机制
- 自动环境检测和初始化

#### 数据流管理
- Chrome Storage API数据持久化
- 实时标签页状态同步
- 跨组件状态管理
- 错误处理和重试机制

#### iframe集成方案
- 支持在任意网页中嵌入管理界面
- 安全的跨域通信
- 响应式设计适配不同尺寸

## 🧪 测试

项目包含完整的测试指南和自动化测试：

- **功能测试**：验证核心功能正常工作
- **集成测试**：测试Chrome扩展与Web应用的集成
- **iframe测试**：验证嵌入式界面功能
- **性能测试**：确保良好的用户体验

## 📝 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交Issue和Pull Request！

1. Fork本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📞 支持

如果您在使用过程中遇到问题，请：

1. 查看[常见问题](docs/FAQ.md)
2. 搜索现有的[Issues](https://github.com/your-username/tabify-chrome-extension/issues)
3. 创建新的Issue描述问题

---

**Tabify** - 让标签页管理变得简单高效！ 🎯