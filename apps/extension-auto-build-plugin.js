const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * ExtensionAutoBuildPlugin - Next.js开发服务器自动扩展构建插件
 * 
 * 功能说明：
 * 1. 在开发模式下监听src目录文件变化
 * 2. 当文件变化时自动触发build-extension.js脚本
 * 3. 提供错误处理和日志输出
 * 4. 避免重复构建，提升开发体验
 */
class ExtensionAutoBuildPlugin {
  constructor(options = {}) {
    this.options = {
      // 构建脚本路径
      buildScriptPath: options.buildScriptPath || path.join(__dirname, 'build-extension.js'),
      // 是否启用详细日志
      verbose: options.verbose !== false,
      // 构建延迟时间（毫秒），避免频繁构建
      debounceDelay: options.debounceDelay || 2000,
      // 监听的文件扩展名
      watchExtensions: options.watchExtensions || ['.tsx', '.ts', '.jsx', '.js', '.css', '.json'],
      ...options
    };
    
    // 构建状态管理
    this.isBuilding = false;
    this.buildTimer = null;
    this.lastBuildTime = 0;
    
    this.log('ExtensionAutoBuildPlugin 初始化完成');
  }

  /**
   * 日志输出方法
   * @param {string} message - 日志消息
   * @param {string} level - 日志级别 (info, warn, error)
   */
  log(message, level = 'info') {
    if (!this.options.verbose && level === 'info') return;
    
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}] [ExtensionAutoBuild]`;
    
    switch (level) {
      case 'warn':
        console.warn(`\x1b[33m${prefix} ⚠️  ${message}\x1b[0m`);
        break;
      case 'error':
        console.error(`\x1b[31m${prefix} ❌ ${message}\x1b[0m`);
        break;
      default:
        console.log(`\x1b[36m${prefix} 🔧 ${message}\x1b[0m`);
    }
  }

  /**
   * 检查文件是否需要触发构建
   * @param {string} filePath - 文件路径
   * @returns {boolean} - 是否需要构建
   */
  shouldTriggerBuild(filePath) {
    // 排除构建输出目录和临时文件
    const excludePatterns = [
      /node_modules/,
      /\.next/,
      /out/,
      /\.git/,
      /build-extension\.js$/,
      /extension-auto-build-plugin\.js$/,
      /\.log$/,
      /\.tmp$/
    ];
    
    if (excludePatterns.some(pattern => pattern.test(filePath))) {
      return false;
    }
    
    // 检查文件扩展名
    const ext = path.extname(filePath);
    return this.options.watchExtensions.includes(ext);
  }

  /**
   * 检查Next.js构建状态和前置条件
   * @returns {boolean} - 是否满足构建条件
   */
  checkBuildPrerequisites() {
    // 检查Next.js输出文件是否存在
    const nextOutputPath = path.join(__dirname, 'out', 'index.html');
    if (!fs.existsSync(nextOutputPath)) {
      this.log('Next.js输出文件不存在，等待构建完成...', 'warn');
      return false;
    }

    // 检查文件是否完整（大小大于0且包含基本HTML结构）
    try {
      const content = fs.readFileSync(nextOutputPath, 'utf8');
      if (content.length < 100 || !content.includes('<html')) {
        this.log('Next.js输出文件不完整，等待构建完成...', 'warn');
        return false;
      }
    } catch (error) {
      this.log(`读取Next.js输出文件失败: ${error.message}`, 'warn');
      return false;
    }

    return true;
  }

  /**
   * 执行扩展构建
   * @param {boolean} skipPrerequisiteCheck - 是否跳过前置条件检查
   */
  async triggerExtensionBuild(skipPrerequisiteCheck = false) {
    if (this.isBuilding) {
      this.log('构建正在进行中，跳过此次触发', 'warn');
      return;
    }

    // 防抖处理
    const now = Date.now();
    if (now - this.lastBuildTime < this.options.debounceDelay) {
      this.log(`距离上次构建时间过短，延迟构建...`);
      
      if (this.buildTimer) {
        clearTimeout(this.buildTimer);
      }
      
      this.buildTimer = setTimeout(() => {
        this.triggerExtensionBuild(skipPrerequisiteCheck);
      }, this.options.debounceDelay);
      
      return;
    }

    // 检查构建前置条件
    if (!skipPrerequisiteCheck && !this.checkBuildPrerequisites()) {
      this.log('构建前置条件不满足，延迟重试...', 'warn');
      setTimeout(() => {
        this.triggerExtensionBuild(skipPrerequisiteCheck);
      }, 2000);
      return;
    }

    this.isBuilding = true;
    this.lastBuildTime = now;
    
    try {
      this.log('🚀 开始自动构建Chrome扩展...');
      
      // 检查构建脚本是否存在
      if (!fs.existsSync(this.options.buildScriptPath)) {
        throw new Error(`构建脚本不存在: ${this.options.buildScriptPath}`);
      }
      
      // 执行构建脚本
      const startTime = Date.now();
      execSync(`node "${this.options.buildScriptPath}"`, {
        cwd: path.dirname(this.options.buildScriptPath),
        stdio: this.options.verbose ? 'inherit' : 'pipe',
        timeout: 60000 // 60秒超时
      });
      
      const duration = Date.now() - startTime;
      this.log(`✅ 扩展构建完成！耗时: ${duration}ms`);
      
    } catch (error) {
      this.log(`构建失败: ${error.message}`, 'error');
      
      // 如果是超时错误，给出更友好的提示
      if (error.message.includes('timeout')) {
        this.log('构建超时，可能是因为项目较大或系统资源不足', 'warn');
      }
      
      // 提供调试信息
      if (this.options.verbose) {
        this.log(`构建脚本路径: ${this.options.buildScriptPath}`, 'error');
        this.log(`工作目录: ${path.dirname(this.options.buildScriptPath)}`, 'error');
      }
    } finally {
      this.isBuilding = false;
    }
  }

  /**
   * Webpack插件入口方法
   * @param {Object} compiler - Webpack编译器实例
   */
  apply(compiler) {
    // 只在开发模式下启用
    if (compiler.options.mode !== 'development') {
      this.log('非开发模式，跳过扩展自动构建功能');
      return;
    }

    this.log('注册构建监听器...');

    // 跟踪文件变化状态
    let hasFileChanges = false;
    let pendingBuild = false;

    // 监听文件变化（仅用于标记状态）
    compiler.hooks.watchRun.tapAsync('ExtensionAutoBuildPlugin', (compiler, callback) => {
      const changedFiles = compiler.modifiedFiles || new Set();
      const removedFiles = compiler.removedFiles || new Set();
      
      // 检查是否有需要触发构建的文件变化
      const shouldBuild = [...changedFiles, ...removedFiles].some(filePath => 
        this.shouldTriggerBuild(filePath)
      );
      
      if (shouldBuild) {
        this.log(`检测到文件变化，标记待构建状态...`);
        hasFileChanges = true;
      }
      
      callback();
    });

    // 在Next.js构建完成后触发扩展构建
    compiler.hooks.afterEmit.tapAsync('ExtensionAutoBuildPlugin', (compilation, callback) => {
      // 检查编译是否成功
      if (compilation.errors && compilation.errors.length > 0) {
        this.log('Next.js编译出现错误，跳过扩展构建', 'warn');
        hasFileChanges = false;
        callback();
        return;
      }

      // 只有在有文件变化或首次构建时才触发
      if (hasFileChanges || !pendingBuild) {
        this.log('Next.js构建完成，开始构建扩展...');
        hasFileChanges = false;
        pendingBuild = true;
        
        // 异步执行构建，不阻塞webpack
        setImmediate(() => {
          this.triggerExtensionBuild(false).finally(() => {
            pendingBuild = false;
          });
        });
      }
      
      callback();
    });

    // 备用方案：在done hook中也检查构建状态
    compiler.hooks.done.tap('ExtensionAutoBuildPlugin', (stats) => {
      if (stats.hasErrors()) {
        this.log('Next.js编译出现错误，重置构建状态', 'warn');
        hasFileChanges = false;
        pendingBuild = false;
        return;
      }

      // 如果afterEmit没有触发构建，在这里作为备用触发点
      if (hasFileChanges && !pendingBuild) {
        this.log('备用触发：Next.js构建完成，开始构建扩展...');
        hasFileChanges = false;
        pendingBuild = true;
        
        setTimeout(() => {
          this.triggerExtensionBuild(false).finally(() => {
            pendingBuild = false;
          });
        }, 1000);
      }
    });

    // 初始构建（开发服务器启动时）
    compiler.hooks.afterEnvironment.tap('ExtensionAutoBuildPlugin', () => {
      this.log('开发服务器启动，准备执行初始扩展构建...');
      // 延迟执行，确保Next.js完全启动并完成首次构建
      setTimeout(() => {
        this.log('执行初始扩展构建...');
        this.triggerExtensionBuild(true); // 跳过前置条件检查，因为可能还没有输出文件
      }, 5000);
    });
  }
}

module.exports = ExtensionAutoBuildPlugin;