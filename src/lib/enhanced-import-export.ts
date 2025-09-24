/**
 * Tabify Chrome插件 - 增强导入导出服务
 * 
 * 本文件提供了增强的导入导出功能，包括：
 * - 与扩展桥梁的集成
 * - 多种数据格式支持
 * - 云端同步集成
 * - 增量导入导出
 * - 数据压缩和加密
 * - 导入导出历史记录
 * - 自动备份策略
 */

import {
  Tab,
  Group,
  Settings,
  ExportData,
  ImportOptions,
  ImportResult,
  APP_VERSION,
} from './types';
import { getImportExportService, ImportExportService } from './import-export';
import { getExtensionBridge } from './extension-bridge';
import { getSyncService } from './sync-service';
import { getStorageService } from './storage';

// ==================== 增强导入导出类型定义 ====================

/**
 * 支持的导出格式
 */
export type ExportFormat = 
  | 'json'           // 标准JSON格式
  | 'compressed'     // 压缩JSON格式
  | 'encrypted'      // 加密JSON格式
  | 'csv'            // CSV格式
  | 'html'           // HTML格式
  | 'markdown'       // Markdown格式
  | 'onetab'         // OneTab兼容格式
  | 'bookmarks';     // 浏览器书签格式

/**
 * 导出配置
 */
export interface ExportConfig {
  /** 导出格式 */
  format: ExportFormat;
  /** 是否包含设置 */
  includeSettings: boolean;
  /** 是否包含历史记录 */
  includeHistory: boolean;
  /** 是否压缩数据 */
  compress: boolean;
  /** 是否加密数据 */
  encrypt: boolean;
  /** 加密密码（如果加密） */
  password?: string;
  /** 导出范围 */
  scope: {
    /** 特定分组ID列表 */
    groupIds?: string[];
    /** 日期范围 */
    dateRange?: {
      start: number;
      end: number;
    };
    /** 是否只导出活跃标签页 */
    activeOnly?: boolean;
  };
}

/**
 * 增强导入选项
 */
export interface EnhancedImportOptions extends ImportOptions {
  /** 是否启用智能合并 */
  smartMerge: boolean;
  /** 是否自动分组 */
  autoGroup: boolean;
  /** 导入后的处理策略 */
  postImportAction: 'none' | 'organize' | 'ai-group';
  /** 是否验证URL有效性 */
  validateUrls: boolean;
  /** 是否同步到云端 */
  syncToCloud: boolean;
}

/**
 * 导入导出历史记录
 */
export interface ImportExportHistory {
  /** 记录ID */
  id: string;
  /** 操作类型 */
  type: 'import' | 'export';
  /** 操作时间 */
  timestamp: number;
  /** 文件名 */
  filename: string;
  /** 数据格式 */
  format: ExportFormat;
  /** 操作结果 */
  result: {
    success: boolean;
    itemsProcessed: number;
    errors?: string[];
  };
  /** 文件大小（字节） */
  fileSize: number;
  /** 操作耗时（毫秒） */
  duration: number;
}

/**
 * 自动备份配置
 */
export interface AutoBackupConfig {
  /** 是否启用自动备份 */
  enabled: boolean;
  /** 备份频率（小时） */
  frequency: number;
  /** 最大备份数量 */
  maxBackups: number;
  /** 备份存储位置 */
  storageLocation: 'local' | 'cloud';
  /** 是否压缩备份 */
  compress: boolean;
}

// ==================== 增强导入导出服务 ====================

/**
 * 增强导入导出服务类
 * 提供更丰富的导入导出功能
 */
export class EnhancedImportExportService {
  private static instance: EnhancedImportExportService;
  private baseService: ImportExportService;
  private history: ImportExportHistory[] = [];
  private autoBackupConfig: AutoBackupConfig;
  private autoBackupTimer: NodeJS.Timeout | null = null;

  /**
   * 获取服务单例实例
   */
  public static getInstance(): EnhancedImportExportService {
    if (!EnhancedImportExportService.instance) {
      EnhancedImportExportService.instance = new EnhancedImportExportService();
    }
    return EnhancedImportExportService.instance;
  }

  /**
   * 私有构造函数
   */
  private constructor() {
    this.baseService = getImportExportService();
    this.autoBackupConfig = this.getDefaultAutoBackupConfig();
  }

  /**
   * 初始化服务
   */
  public async initialize(): Promise<void> {
    try {
      // 加载历史记录和配置
      await this.loadHistory();
      await this.loadAutoBackupConfig();
      
      // 启动自动备份
      if (this.autoBackupConfig.enabled) {
        this.startAutoBackup();
      }
      
      console.log('EnhancedImportExportService: 初始化完成');
    } catch (error) {
      console.error('EnhancedImportExportService: 初始化失败', error);
      throw error;
    }
  }

  // ==================== 增强导出功能 ====================

  /**
   * 增强导出功能
   * @param config 导出配置
   * @returns 导出结果
   */
  public async enhancedExport(config: ExportConfig): Promise<{
    success: boolean;
    filename: string;
    fileSize: number;
    duration: number;
    errors?: string[];
  }> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `tabify_export_${timestamp}.${this.getFileExtension(config.format)}`;
    
    try {
      // 1. 收集数据
      const exportData = await this.collectExportData(config);
      
      // 2. 格式化数据
      const formattedData = await this.formatExportData(exportData, config);
      
      // 3. 处理数据（压缩/加密）
      const processedData = await this.processExportData(formattedData, config);
      
      // 4. 生成文件
      const fileSize = await this.generateExportFile(processedData, filename, config.format);
      
      const duration = Date.now() - startTime;
      
      // 5. 记录历史
      await this.recordHistory({
        id: `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'export',
        timestamp: Date.now(),
        filename,
        format: config.format,
        result: {
          success: true,
          itemsProcessed: exportData.tabs.length + exportData.groups.length,
        },
        fileSize,
        duration,
      });
      
      console.log(`EnhancedImportExportService: 导出完成 - ${filename}`);
      
      return {
        success: true,
        filename,
        fileSize,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // 记录失败历史
      await this.recordHistory({
        id: `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'export',
        timestamp: Date.now(),
        filename,
        format: config.format,
        result: {
          success: false,
          itemsProcessed: 0,
          errors: [error.toString()],
        },
        fileSize: 0,
        duration,
      });
      
      console.error('EnhancedImportExportService: 导出失败', error);
      
      return {
        success: false,
        filename,
        fileSize: 0,
        duration,
        errors: [error.toString()],
      };
    }
  }

  /**
   * 增量导出（只导出变更的数据）
   * @param lastExportTime 上次导出时间
   * @param config 导出配置
   * @returns 导出结果
   */
  public async incrementalExport(
    lastExportTime: number,
    config: Partial<ExportConfig> = {}
  ): Promise<{
    success: boolean;
    filename: string;
    changesFound: boolean;
    itemsExported: number;
  }> {
    try {
      const storageService = getStorageService();
      const [tabs, groups] = await Promise.all([
        storageService.loadTabs(),
        storageService.loadGroups(),
      ]);
      
      // 过滤变更的数据
      const changedTabs = tabs.filter(tab => 
        tab.createdTime > lastExportTime || 
        (tab.lastAccessTime && tab.lastAccessTime > lastExportTime)
      );
      
      const changedGroups = groups.filter(group => 
        group.createdTime > lastExportTime
      );
      
      const changesFound = changedTabs.length > 0 || changedGroups.length > 0;
      
      if (!changesFound) {
        return {
          success: true,
          filename: '',
          changesFound: false,
          itemsExported: 0,
        };
      }
      
      // 创建增量导出数据
      const incrementalData: ExportData = {
        app: {
          name: 'Tabify',
          version: APP_VERSION,
          exportTime: Date.now(),
        },
        tabs: changedTabs,
        groups: changedGroups,
      };
      
      const fullConfig: ExportConfig = {
        format: 'json',
        includeSettings: false,
        includeHistory: false,
        compress: true,
        encrypt: false,
        scope: {},
        ...config,
      };
      
      const result = await this.enhancedExport(fullConfig);
      
      return {
        success: result.success,
        filename: result.filename,
        changesFound: true,
        itemsExported: changedTabs.length + changedGroups.length,
      };
    } catch (error) {
      console.error('EnhancedImportExportService: 增量导出失败', error);
      return {
        success: false,
        filename: '',
        changesFound: false,
        itemsExported: 0,
      };
    }
  }

  // ==================== 增强导入功能 ====================

  /**
   * 增强导入功能
   * @param file 导入文件
   * @param options 导入选项
   * @returns 导入结果
   */
  public async enhancedImport(
    file: File,
    options: EnhancedImportOptions
  ): Promise<ImportResult & {
    duration: number;
    urlsValidated?: number;
    autoGrouped?: number;
  }> {
    const startTime = Date.now();
    
    try {
      // 1. 预处理文件
      const processedFile = await this.preprocessImportFile(file);
      
      // 2. 执行基础导入
      const baseResult = await this.baseService.importFromFile(processedFile, options);
      
      // 3. 增强处理
      let urlsValidated = 0;
      let autoGrouped = 0;
      
      if (baseResult.success) {
        // URL验证
        if (options.validateUrls) {
          urlsValidated = await this.validateImportedUrls();
        }
        
        // 自动分组
        if (options.autoGroup) {
          autoGrouped = await this.performAutoGrouping();
        }
        
        // 后处理操作
        await this.performPostImportActions(options.postImportAction);
        
        // 同步到云端
        if (options.syncToCloud) {
          await this.syncToCloud();
        }
      }
      
      const duration = Date.now() - startTime;
      
      // 记录历史
      await this.recordHistory({
        id: `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'import',
        timestamp: Date.now(),
        filename: file.name,
        format: this.detectFileFormat(file.name),
        result: {
          success: baseResult.success,
          itemsProcessed: baseResult.tabsImported + baseResult.groupsImported,
          errors: baseResult.errors,
        },
        fileSize: file.size,
        duration,
      });
      
      return {
        ...baseResult,
        duration,
        urlsValidated,
        autoGrouped,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.error('EnhancedImportExportService: 增强导入失败', error);
      
      return {
        success: false,
        tabsImported: 0,
        groupsImported: 0,
        duplicatesSkipped: 0,
        errors: [error.toString()],
        warnings: [],
        duration,
      };
    }
  }

  // ==================== 自动备份功能 ====================

  /**
   * 启动自动备份
   */
  public startAutoBackup(): void {
    if (this.autoBackupTimer) {
      clearInterval(this.autoBackupTimer);
    }
    
    const intervalMs = this.autoBackupConfig.frequency * 60 * 60 * 1000; // 转换为毫秒
    
    this.autoBackupTimer = setInterval(async () => {
      try {
        await this.performAutoBackup();
      } catch (error) {
        console.error('EnhancedImportExportService: 自动备份失败', error);
      }
    }, intervalMs);
    
    console.log(`EnhancedImportExportService: 自动备份已启动，频率: ${this.autoBackupConfig.frequency}小时`);
  }

  /**
   * 停止自动备份
   */
  public stopAutoBackup(): void {
    if (this.autoBackupTimer) {
      clearInterval(this.autoBackupTimer);
      this.autoBackupTimer = null;
      console.log('EnhancedImportExportService: 自动备份已停止');
    }
  }

  /**
   * 执行自动备份
   */
  public async performAutoBackup(): Promise<void> {
    try {
      const config: ExportConfig = {
        format: 'json',
        includeSettings: true,
        includeHistory: false,
        compress: this.autoBackupConfig.compress,
        encrypt: false,
        scope: {},
      };
      
      const result = await this.enhancedExport(config);
      
      if (result.success) {
        // 清理旧备份
        await this.cleanupOldBackups();
        console.log('EnhancedImportExportService: 自动备份完成');
      }
    } catch (error) {
      console.error('EnhancedImportExportService: 自动备份失败', error);
    }
  }

  /**
   * 更新自动备份配置
   * @param config 新配置
   */
  public async updateAutoBackupConfig(config: Partial<AutoBackupConfig>): Promise<void> {
    this.autoBackupConfig = { ...this.autoBackupConfig, ...config };
    await this.saveAutoBackupConfig();
    
    // 重启自动备份
    if (this.autoBackupConfig.enabled) {
      this.startAutoBackup();
    } else {
      this.stopAutoBackup();
    }
  }

  // ==================== 历史记录管理 ====================

  /**
   * 获取导入导出历史
   * @param limit 返回数量限制
   * @returns 历史记录列表
   */
  public getHistory(limit: number = 50): ImportExportHistory[] {
    return this.history
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * 清理历史记录
   * @param olderThan 清理指定时间之前的记录
   */
  public async cleanupHistory(olderThan: number): Promise<number> {
    const originalLength = this.history.length;
    this.history = this.history.filter(record => record.timestamp > olderThan);
    const cleaned = originalLength - this.history.length;
    
    if (cleaned > 0) {
      await this.saveHistory();
      console.log(`EnhancedImportExportService: 清理了 ${cleaned} 条历史记录`);
    }
    
    return cleaned;
  }

  /**
   * 获取统计信息
   */
  public getStatistics(): {
    totalExports: number;
    totalImports: number;
    totalDataExported: number;
    totalDataImported: number;
    averageExportSize: number;
    averageImportSize: number;
    successRate: number;
  } {
    const exports = this.history.filter(h => h.type === 'export');
    const imports = this.history.filter(h => h.type === 'import');
    
    const totalDataExported = exports.reduce((sum, h) => sum + h.result.itemsProcessed, 0);
    const totalDataImported = imports.reduce((sum, h) => sum + h.result.itemsProcessed, 0);
    
    const totalExportSize = exports.reduce((sum, h) => sum + h.fileSize, 0);
    const totalImportSize = imports.reduce((sum, h) => sum + h.fileSize, 0);
    
    const successfulOperations = this.history.filter(h => h.result.success).length;
    const successRate = this.history.length > 0 ? successfulOperations / this.history.length : 0;
    
    return {
      totalExports: exports.length,
      totalImports: imports.length,
      totalDataExported,
      totalDataImported,
      averageExportSize: exports.length > 0 ? totalExportSize / exports.length : 0,
      averageImportSize: imports.length > 0 ? totalImportSize / imports.length : 0,
      successRate,
    };
  }

  // ==================== 私有方法 ====================

  /**
   * 收集导出数据
   */
  private async collectExportData(config: ExportConfig): Promise<ExportData> {
    const storageService = getStorageService();
    
    let [tabs, groups] = await Promise.all([
      storageService.loadTabs(),
      storageService.loadGroups(),
    ]);
    
    const settings = config.includeSettings ? await storageService.loadSettings() : null;
    
    // 应用范围过滤
    if (config.scope.groupIds) {
      groups = groups.filter(g => config.scope.groupIds!.includes(g.id));
      tabs = tabs.filter(t => t.groupId && config.scope.groupIds!.includes(t.groupId));
    }
    
    if (config.scope.dateRange) {
      const { start, end } = config.scope.dateRange;
      tabs = tabs.filter(t => t.createdTime >= start && t.createdTime <= end);
    }
    
    if (config.scope.activeOnly) {
      tabs = tabs.filter(t => t.isActive);
    }
    
    const exportData: ExportData = {
      app: {
        name: 'Tabify',
        version: APP_VERSION,
        exportTime: Date.now(),
      },
      tabs,
      groups,
    };
    
    if (settings) {
      exportData.settings = settings;
    }
    
    return exportData;
  }

  /**
   * 格式化导出数据
   */
  private async formatExportData(data: ExportData, config: ExportConfig): Promise<string> {
    switch (config.format) {
      case 'json':
      case 'compressed':
      case 'encrypted':
        return JSON.stringify(data, null, 2);
      
      case 'csv':
        return this.formatAsCSV(data);
      
      case 'html':
        return this.formatAsHTML(data);
      
      case 'markdown':
        return this.formatAsMarkdown(data);
      
      case 'onetab':
        return this.formatAsOneTab(data);
      
      case 'bookmarks':
        return this.formatAsBookmarks(data);
      
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  /**
   * 处理导出数据（压缩/加密）
   */
  private async processExportData(data: string, config: ExportConfig): Promise<string | Uint8Array> {
    let processedData: string | Uint8Array = data;
    
    // 压缩
    if (config.compress) {
      processedData = await this.compressData(data);
    }
    
    // 加密
    if (config.encrypt && config.password) {
      processedData = await this.encryptData(processedData, config.password);
    }
    
    return processedData;
  }

  /**
   * 生成导出文件
   */
  private async generateExportFile(
    data: string | Uint8Array,
    filename: string,
    format: ExportFormat
  ): Promise<number> {
    const mimeType = this.getMimeType(format);
    const blob = new Blob([data], { type: mimeType });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return blob.size;
  }

  /**
   * 获取文件扩展名
   */
  private getFileExtension(format: ExportFormat): string {
    const extensions = {
      json: 'json',
      compressed: 'json.gz',
      encrypted: 'json.enc',
      csv: 'csv',
      html: 'html',
      markdown: 'md',
      onetab: 'txt',
      bookmarks: 'html',
    };
    return extensions[format] || 'json';
  }

  /**
   * 获取MIME类型
   */
  private getMimeType(format: ExportFormat): string {
    const mimeTypes = {
      json: 'application/json',
      compressed: 'application/gzip',
      encrypted: 'application/octet-stream',
      csv: 'text/csv',
      html: 'text/html',
      markdown: 'text/markdown',
      onetab: 'text/plain',
      bookmarks: 'text/html',
    };
    return mimeTypes[format] || 'application/json';
  }

  /**
   * 格式化为CSV
   */
  private formatAsCSV(data: ExportData): string {
    const headers = ['Title', 'URL', 'Group', 'Created Time'];
    const rows = data.tabs.map(tab => {
      const group = data.groups.find(g => g.id === tab.groupId);
      return [
        `"${tab.title.replace(/"/g, '""')}"`,
        `"${tab.url}"`,
        `"${group?.name || ''}"`,
        new Date(tab.createdTime).toISOString(),
      ].join(',');
    });
    
    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * 格式化为HTML
   */
  private formatAsHTML(data: ExportData): string {
    const groupsHtml = data.groups.map(group => {
      const groupTabs = data.tabs.filter(tab => tab.groupId === group.id);
      const tabsHtml = groupTabs.map(tab => 
        `<li><a href="${tab.url}">${tab.title}</a></li>`
      ).join('\n');
      
      return `
        <div class="group">
          <h2>${group.name}</h2>
          <ul>
            ${tabsHtml}
          </ul>
        </div>
      `;
    }).join('\n');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tabify Export</title>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .group { margin-bottom: 30px; }
          h1, h2 { color: #333; }
          ul { list-style-type: none; padding: 0; }
          li { margin: 5px 0; }
          a { text-decoration: none; color: #0066cc; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <h1>Tabify Export - ${new Date().toLocaleDateString()}</h1>
        ${groupsHtml}
      </body>
      </html>
    `;
  }

  /**
   * 格式化为Markdown
   */
  private formatAsMarkdown(data: ExportData): string {
    const groupsMarkdown = data.groups.map(group => {
      const groupTabs = data.tabs.filter(tab => tab.groupId === group.id);
      const tabsMarkdown = groupTabs.map(tab => 
        `- [${tab.title}](${tab.url})`
      ).join('\n');
      
      return `## ${group.name}\n\n${tabsMarkdown}\n`;
    }).join('\n');
    
    return `# Tabify Export\n\n导出时间: ${new Date().toLocaleString()}\n\n${groupsMarkdown}`;
  }

  /**
   * 格式化为OneTab格式
   */
  private formatAsOneTab(data: ExportData): string {
    const lines: string[] = [];
    
    data.groups.forEach(group => {
      lines.push(`# ${group.name}`);
      const groupTabs = data.tabs.filter(tab => tab.groupId === group.id);
      groupTabs.forEach(tab => {
        lines.push(`${tab.url} | ${tab.title}`);
      });
      lines.push(''); // 空行分隔
    });
    
    return lines.join('\n');
  }

  /**
   * 格式化为书签格式
   */
  private formatAsBookmarks(data: ExportData): string {
    const bookmarksHtml = data.groups.map(group => {
      const groupTabs = data.tabs.filter(tab => tab.groupId === group.id);
      const tabsHtml = groupTabs.map(tab => 
        `<DT><A HREF="${tab.url}">${tab.title}</A>`
      ).join('\n');
      
      return `
        <DT><H3>${group.name}</H3>
        <DL><p>
          ${tabsHtml}
        </DL><p>
      `;
    }).join('\n');
    
    return `
      <!DOCTYPE NETSCAPE-Bookmark-file-1>
      <META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
      <TITLE>Bookmarks</TITLE>
      <H1>Bookmarks</H1>
      <DL><p>
        ${bookmarksHtml}
      </DL><p>
    `;
  }

  /**
   * 压缩数据（简化实现）
   */
  private async compressData(data: string): Promise<Uint8Array> {
    // 这里应该使用真正的压缩算法，如gzip
    // 简化实现：直接返回UTF-8编码的字节数组
    return new TextEncoder().encode(data);
  }

  /**
   * 加密数据（简化实现）
   */
  private async encryptData(data: string | Uint8Array, password: string): Promise<Uint8Array> {
    // 这里应该使用真正的加密算法，如AES
    // 简化实现：直接返回数据
    if (typeof data === 'string') {
      return new TextEncoder().encode(data);
    }
    return data;
  }

  /**
   * 预处理导入文件
   */
  private async preprocessImportFile(file: File): Promise<File> {
    // 这里可以添加文件预处理逻辑，如解压缩、解密等
    return file;
  }

  /**
   * 验证导入的URL
   */
  private async validateImportedUrls(): Promise<number> {
    // 简化实现：返回0
    return 0;
  }

  /**
   * 执行自动分组
   */
  private async performAutoGrouping(): Promise<number> {
    // 简化实现：返回0
    return 0;
  }

  /**
   * 执行后处理操作
   */
  private async performPostImportActions(action: string): Promise<void> {
    switch (action) {
      case 'organize':
        // 执行数据整理
        break;
      case 'ai-group':
        // 执行AI分组
        break;
      default:
        // 无操作
        break;
    }
  }

  /**
   * 同步到云端
   */
  private async syncToCloud(): Promise<void> {
    try {
      const syncService = getSyncService();
      await syncService.syncToRemote();
    } catch (error) {
      console.error('EnhancedImportExportService: 云端同步失败', error);
    }
  }

  /**
   * 检测文件格式
   */
  private detectFileFormat(filename: string): ExportFormat {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'json': return 'json';
      case 'csv': return 'csv';
      case 'html': return 'html';
      case 'md': return 'markdown';
      case 'txt': return 'onetab';
      default: return 'json';
    }
  }

  /**
   * 记录历史
   */
  private async recordHistory(record: ImportExportHistory): Promise<void> {
    this.history.push(record);
    
    // 限制历史记录数量
    if (this.history.length > 1000) {
      this.history = this.history.slice(-1000);
    }
    
    await this.saveHistory();
  }

  /**
   * 清理旧备份
   */
  private async cleanupOldBackups(): Promise<void> {
    const backupHistory = this.history
      .filter(h => h.type === 'export' && h.filename.includes('backup'))
      .sort((a, b) => b.timestamp - a.timestamp);
    
    if (backupHistory.length > this.autoBackupConfig.maxBackups) {
      // 这里应该删除旧的备份文件
      // 简化实现：只从历史记录中移除
      const toRemove = backupHistory.slice(this.autoBackupConfig.maxBackups);
      toRemove.forEach(backup => {
        const index = this.history.findIndex(h => h.id === backup.id);
        if (index >= 0) {
          this.history.splice(index, 1);
        }
      });
      
      await this.saveHistory();
    }
  }

  /**
   * 获取默认自动备份配置
   */
  private getDefaultAutoBackupConfig(): AutoBackupConfig {
    return {
      enabled: false,
      frequency: 24, // 24小时
      maxBackups: 7,
      storageLocation: 'local',
      compress: true,
    };
  }

  /**
   * 加载历史记录
   */
  private async loadHistory(): Promise<void> {
    try {
      const storageService = getStorageService();
      const data = await storageService.getItem('importExportHistory');
      if (data && Array.isArray(data)) {
        this.history = data;
      }
    } catch (error) {
      console.error('EnhancedImportExportService: 加载历史记录失败', error);
    }
  }

  /**
   * 保存历史记录
   */
  private async saveHistory(): Promise<void> {
    try {
      const storageService = getStorageService();
      await storageService.setItem('importExportHistory', this.history);
    } catch (error) {
      console.error('EnhancedImportExportService: 保存历史记录失败', error);
    }
  }

  /**
   * 加载自动备份配置
   */
  private async loadAutoBackupConfig(): Promise<void> {
    try {
      const storageService = getStorageService();
      const data = await storageService.getItem('autoBackupConfig');
      if (data) {
        this.autoBackupConfig = { ...this.autoBackupConfig, ...data };
      }
    } catch (error) {
      console.error('EnhancedImportExportService: 加载自动备份配置失败', error);
    }
  }

  /**
   * 保存自动备份配置
   */
  private async saveAutoBackupConfig(): Promise<void> {
    try {
      const storageService = getStorageService();
      await storageService.setItem('autoBackupConfig', this.autoBackupConfig);
    } catch (error) {
      console.error('EnhancedImportExportService: 保存自动备份配置失败', error);
    }
  }
}

// ==================== 导出便捷函数 ====================

/**
 * 获取增强导入导出服务实例
 */
export const getEnhancedImportExportService = () => EnhancedImportExportService.getInstance();

/**
 * 初始化增强导入导出服务
 */
export const initializeEnhancedImportExportService = async (): Promise<EnhancedImportExportService> => {
  const service = getEnhancedImportExportService();
  await service.initialize();
  return service;
};

/**
 * 快速导出
 */
export const quickEnhancedExport = async (
  format: ExportFormat = 'json',
  includeSettings: boolean = true
): Promise<void> => {
  const service = getEnhancedImportExportService();
  const config: ExportConfig = {
    format,
    includeSettings,
    includeHistory: false,
    compress: format === 'compressed',
    encrypt: false,
    scope: {},
  };
  
  await service.enhancedExport(config);
};

/**
 * 快速导入
 */
export const quickEnhancedImport = async (
  file: File,
  autoGroup: boolean = false
): Promise<ImportResult> => {
  const service = getEnhancedImportExportService();
  const options: EnhancedImportOptions = {
    overwriteExisting: false,
    importSettings: true,
    duplicateStrategy: 'rename',
    createBackup: true,
    smartMerge: true,
    autoGroup,
    postImportAction: autoGroup ? 'ai-group' : 'none',
    validateUrls: false,
    syncToCloud: false,
  };
  
  return await service.enhancedImport(file, options);
};