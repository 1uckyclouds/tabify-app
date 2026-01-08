/**
 * Tabify Chrome插件 - 数据导入导出服务
 * 
 * 本文件提供了数据导入导出功能，实现：
 * - 标签页数据的JSON格式导出
 * - 从JSON文件导入标签页数据
 * - OneTab格式兼容性支持
 * - 数据验证和错误处理
 * - 重复数据处理策略
 * - 备份和恢复功能
 */

import {
  Tab,
  Group,
  ExportData,
  ImportOptions,
  ImportResult,
  APP_VERSION,
} from './types';
import { getStorageService } from './storage';

// ==================== 导入导出服务类 ====================

/**
 * 数据导入导出服务
 * 处理标签页数据的导入导出操作
 */
export class ImportExportService {
  private static instance: ImportExportService;

  /**
   * 获取导入导出服务单例实例
   */
  public static getInstance(): ImportExportService {
    if (!ImportExportService.instance) {
      ImportExportService.instance = new ImportExportService();
    }
    return ImportExportService.instance;
  }

  /**
   * 私有构造函数
   */
  private constructor() {}

  // ==================== 导出功能 ====================

  /**
   * 导出所有数据为JSON格式
   * @param includeSettings 是否包含用户设置
   * @returns 导出数据对象
   */
  public async exportAllData(includeSettings: boolean = true): Promise<ExportData> {
    try {
      const storageService = getStorageService();
      
      const [tabs, groups, settings] = await Promise.all([
        storageService.loadTabs(),
        storageService.loadGroups(),
        includeSettings ? storageService.loadSettings() : Promise.resolve(null),
      ]);

      const exportData: ExportData = {
        app: {
          name: 'Tabify',
          version: APP_VERSION,
          exportTime: Date.now(),
        },
        tabs,
        groups,
      };

      if (includeSettings && settings) {
        exportData.settings = settings;
      }

      console.log(`ImportExportService: 导出数据包含 ${tabs.length} 个标签页和 ${groups.length} 个分组`);
      return exportData;
    } catch (error) {
      console.error('ImportExportService: 导出数据失败', error);
      throw new Error(`导出数据失败: ${error}`);
    }
  }

  /**
   * 导出数据并下载为文件
   * @param includeSettings 是否包含用户设置
   * @param filename 文件名（可选）
   */
  public async exportToFile(includeSettings: boolean = true, filename?: string): Promise<void> {
    try {
      const exportData = await this.exportAllData(includeSettings);
      const jsonString = JSON.stringify(exportData, null, 2);
      
      // 生成文件名
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const defaultFilename = `tabify_export_${timestamp}.json`;
      const finalFilename = filename || defaultFilename;
      
      // 创建下载链接
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // 触发下载
      const link = document.createElement('a');
      link.href = url;
      link.download = finalFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 清理URL对象
      URL.revokeObjectURL(url);
      
      console.log(`ImportExportService: 已导出文件 ${finalFilename}`);
    } catch (error) {
      console.error('ImportExportService: 导出文件失败', error);
      throw new Error(`导出文件失败: ${error}`);
    }
  }

  /**
   * 导出特定分组的数据
   * @param groupIds 要导出的分组ID数组
   * @returns 导出数据对象
   */
  public async exportGroups(groupIds: string[]): Promise<ExportData> {
    try {
      const storageService = getStorageService();
      
      const [allTabs, allGroups] = await Promise.all([
        storageService.loadTabs(),
        storageService.loadGroups(),
      ]);

      // 过滤指定的分组
      const groups = allGroups.filter(group => groupIds.includes(group.id));
      
      // 过滤属于这些分组的标签页
      const tabs = allTabs.filter(tab => tab.groupId && groupIds.includes(tab.groupId));

      const exportData: ExportData = {
        app: {
          name: 'Tabify',
          version: APP_VERSION,
          exportTime: Date.now(),
        },
        tabs,
        groups,
      };

      console.log(`ImportExportService: 导出 ${groups.length} 个分组，包含 ${tabs.length} 个标签页`);
      return exportData;
    } catch (error) {
      console.error('ImportExportService: 导出分组失败', error);
      throw new Error(`导出分组失败: ${error}`);
    }
  }

  // ==================== 导入功能 ====================

  /**
   * 从文件导入数据
   * @param file 要导入的文件
   * @param options 导入选项
   * @returns 导入结果
   */
  public async importFromFile(file: File, options: ImportOptions): Promise<ImportResult> {
    try {
      const fileContent = await this.readFileAsText(file);
      return await this.importFromJSON(fileContent, options);
    } catch (error) {
      console.error('ImportExportService: 从文件导入失败', error);
      return {
        success: false,
        tabsImported: 0,
        groupsImported: 0,
        duplicatesSkipped: 0,
        errors: [`从文件导入失败: ${error}`],
        warnings: [],
      };
    }
  }

  /**
   * 从JSON字符串导入数据
   * @param jsonString JSON字符串
   * @param options 导入选项
   * @returns 导入结果
   */
  public async importFromJSON(jsonString: string, options: ImportOptions): Promise<ImportResult> {
    return await this.importFromString(jsonString, options);
  }

  /**
   * 从字符串导入数据（支持OneTab格式）
   * @param dataString 数据字符串
   * @param options 导入选项
   * @returns 导入结果
   */
  public async importFromString(dataString: string, options: ImportOptions): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      tabsImported: 0,
      groupsImported: 0,
      duplicatesSkipped: 0,
      errors: [],
      warnings: [],
    };

    try {
      // 首先尝试作为JSON解析
      let importData: any;
      try {
        importData = JSON.parse(dataString);
      } catch {
        // 如果JSON解析失败，当作纯文本处理
        importData = dataString;
      }
      
      // 验证数据格式
      const validationResult = this.validateImportData(importData);
      if (!validationResult.isValid) {
        result.errors.push(...validationResult.errors);
        return result;
      }

      // 检测数据格式类型
      const dataFormat = this.detectDataFormat(importData);
      console.log(`ImportExportService: 检测到数据格式: ${dataFormat}`);

      // 根据格式处理数据
      let processedData: ExportData;
      switch (dataFormat) {
        case 'tabify':
          processedData = importData as ExportData;
          break;
        case 'onetab':
          processedData = this.convertOneTabData(importData);
          break;
        default:
          result.errors.push('不支持的数据格式');
          return result;
      }

      // 创建备份（如果需要）
      if (options.createBackup) {
        await this.createBackup();
        result.warnings.push('已创建数据备份');
      }

      // 执行导入
      const importResult = await this.performImport(processedData, options);
      
      result.success = true;
      result.tabsImported = importResult.tabsImported;
      result.groupsImported = importResult.groupsImported;
      result.duplicatesSkipped = importResult.duplicatesSkipped;
      result.warnings.push(...importResult.warnings);

      console.log(`ImportExportService: 导入完成 - 标签页: ${result.tabsImported}, 分组: ${result.groupsImported}`);
    } catch (error) {
      console.error('ImportExportService: JSON导入失败', error);
      result.errors.push(`JSON解析失败: ${error}`);
    }

    return result;
  }

  /**
   * 导入OneTab格式数据
   * @param oneTabData OneTab导出的数据
   * @param options 导入选项
   * @returns 导入结果
   */
  public async importOneTabData(oneTabData: string, options: ImportOptions): Promise<ImportResult> {
    try {
      // OneTab数据通常是纯文本格式，每行一个URL和标题
      const lines = oneTabData.split('\n').filter(line => line.trim());
      
      const tabs: Tab[] = [];
      const groups: Group[] = [];
      let currentGroup: Group | null = null;

      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // 检查是否是分组标题（通常以特定格式开始）
        if (this.isOneTabGroupTitle(trimmedLine)) {
          const groupName = this.extractOneTabGroupName(trimmedLine);
          currentGroup = {
            id: `onetab_group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: groupName,
            createdTime: Date.now(),
            isLocked: false,
            isExpanded: true,
            sortOrder: groups.length,
          };
          groups.push(currentGroup);
        } else {
          // 解析标签页数据
          const tabData = this.parseOneTabLine(trimmedLine);
          if (tabData) {
            const tab: Tab = {
              id: `onetab_tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              title: tabData.title,
              url: tabData.url,
              favicon: this.getFaviconUrl(tabData.url),
              groupId: currentGroup?.id,
              createdTime: Date.now(),
            };
            tabs.push(tab);
          }
        }
      }

      // 创建导入数据格式
      const importData: ExportData = {
        app: {
          name: 'OneTab',
          version: '1.0.0',
          exportTime: Date.now(),
        },
        tabs,
        groups,
      };

      return await this.performImport(importData, options);
    } catch (error) {
      console.error('ImportExportService: OneTab导入失败', error);
      return {
        success: false,
        tabsImported: 0,
        groupsImported: 0,
        duplicatesSkipped: 0,
        errors: [`OneTab导入失败: ${error}`],
        warnings: [],
      };
    }
  }

  // ==================== 备份和恢复 ====================

  /**
   * 创建数据备份
   * @returns 备份文件名
   */
  public async createBackup(): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const backupFilename = `tabify_backup_${timestamp}.json`;
      
      await this.exportToFile(true, backupFilename);
      
      console.log(`ImportExportService: 已创建备份 ${backupFilename}`);
      return backupFilename;
    } catch (error) {
      console.error('ImportExportService: 创建备份失败', error);
      throw new Error(`创建备份失败: ${error}`);
    }
  }

  /**
   * 从备份恢复数据
   * @param backupFile 备份文件
   * @returns 恢复结果
   */
  public async restoreFromBackup(backupFile: File): Promise<ImportResult> {
    const options: ImportOptions = {
      overwriteExisting: true,
      importSettings: true,
      duplicateStrategy: 'overwrite',
      createBackup: false, // 恢复时不再创建备份
    };

    return await this.importFromFile(backupFile, options);
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 读取文件内容为文本
   * @param file 文件对象
   * @returns 文件文本内容
   */
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('文件读取失败'));
        }
      };
      reader.onerror = () => reject(new Error('文件读取错误'));
      reader.readAsText(file, 'utf-8');
    });
  }

  /**
   * 验证导入数据格式
   * @param data 要验证的数据
   * @returns 验证结果
   */
  private validateImportData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data) {
      errors.push('数据为空');
      return { isValid: false, errors };
    }

    // 检查Tabify格式
    if (typeof data === 'object' && data.app && data.tabs && Array.isArray(data.tabs)) {
      // 验证标签页数据
      for (let i = 0; i < data.tabs.length; i++) {
        const tab = data.tabs[i];
        if (!tab.id || !tab.title || !tab.url) {
          errors.push(`标签页 ${i + 1} 缺少必要字段 (id, title, url)`);
        }
      }

      // 验证分组数据（如果存在）
      if (data.groups && Array.isArray(data.groups)) {
        for (let i = 0; i < data.groups.length; i++) {
          const group = data.groups[i];
          if (!group.id || !group.name) {
            errors.push(`分组 ${i + 1} 缺少必要字段 (id, name)`);
          }
        }
      }
    }
    // 检查OneTab格式或其他字符串格式
    else if (typeof data === 'string') {
      // 检查是否包含有效的URL
      const trimmedData = data.trim();
      if (!trimmedData) {
        errors.push('文本数据为空');
        return { isValid: false, errors };
      }

      const lines = trimmedData.split('\n').filter(line => line.trim());
      let validUrlCount = 0;

      for (const line of lines) {
        const urlMatch = line.match(/https?:\/\/[^\s|]+/i);
        if (urlMatch) {
          validUrlCount++;
        }
      }

      if (validUrlCount === 0) {
        errors.push('未找到有效的URL，请检查数据格式是否正确');
        return { isValid: false, errors };
      }

      console.log(`ImportExportService: 验证通过，发现 ${validUrlCount} 个有效URL`);
    } else {
      errors.push('不支持的数据格式');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * 检测数据格式类型
   * @param data 数据对象
   * @returns 数据格式类型
   */
  private detectDataFormat(data: any): 'tabify' | 'onetab' | 'unknown' {
    // 检查Tabify格式
    if (data.app && data.app.name === 'Tabify') {
      return 'tabify';
    }

    // 检查OneTab格式或类似文本格式
    if (typeof data === 'string') {
      // 检查是否包含URL和标题的特征
      const hasUrlPattern = /https?:\/\/[^\s]+/i.test(data);
      const hasSeparatorPattern = /\s*\|\s*/.test(data);
      const hasMultipleLines = data.split('\n').filter(line => line.trim()).length > 1;

      if (hasUrlPattern && (hasSeparatorPattern || hasMultipleLines)) {
        return 'onetab';
      }
    }

    // 检查是否是JSON格式的OneTab数据
    if (data.app && data.app.name === 'OneTab') {
      return 'onetab';
    }

    // 检查是否是数组格式，可能是一般的链接列表
    if (Array.isArray(data) && data.length > 0) {
      const firstItem = data[0];
      if (typeof firstItem === 'object' && (firstItem.url || firstItem.title)) {
        // 如果有url和title字段，可能是通用的书签格式
        return 'tabify'; // 当作Tabify格式处理
      }
    }

    return 'unknown';
  }

  /**
   * 转换OneTab数据格式
   * @param oneTabData OneTab格式数据
   * @returns Tabify格式数据
   */
  private convertOneTabData(oneTabData: any): ExportData {
    const tabs: Tab[] = [];
    const groups: Group[] = [];

    // 如果是字符串格式，按行解析
    if (typeof oneTabData === 'string') {
      const lines = oneTabData.split('\n').filter(line => line.trim());
      let currentGroup: Group | null = null;
      let tabCount = 0;

      for (const line of lines) {
        const trimmedLine = line.trim();

        // 检查是否是分组标题
        if (this.isOneTabGroupTitle(trimmedLine)) {
          const groupName = this.extractOneTabGroupName(trimmedLine);
          currentGroup = {
            id: `onetab_group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: groupName,
            createdTime: Date.now(),
            isLocked: false,
            isExpanded: true,
            sortOrder: groups.length,
          };
          groups.push(currentGroup);
          tabCount = 0; // 重置当前分组的标签页计数
        } else {
          // 尝试解析标签页数据
          const tabData = this.parseOneTabLine(trimmedLine);
          if (tabData) {
            const tab: Tab = {
              id: `onetab_tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              title: tabData.title,
              url: tabData.url,
              favicon: this.getFaviconUrl(tabData.url),
              groupId: currentGroup?.id,
              createdTime: Date.now(),
              collectedAt: Date.now(),
            };
            tabs.push(tab);
            tabCount++;
          }
        }
      }

      // 如果没有创建任何分组，创建一个默认分组
      if (groups.length === 0 && tabs.length > 0) {
        const defaultGroup: Group = {
          id: `onetab_default_group_${Date.now()}`,
          name: 'OneTab导入',
          createdTime: Date.now(),
          isLocked: false,
          isExpanded: true,
          sortOrder: 0,
        };
        groups.push(defaultGroup);

        // 将所有标签页分配给默认分组
        tabs.forEach(tab => {
          tab.groupId = defaultGroup.id;
        });
      }
    }

    console.log(`ImportExportService: OneTab数据转换完成 - 标签页: ${tabs.length}, 分组: ${groups.length}`);

    return {
      app: {
        name: 'Tabify',
        version: APP_VERSION,
        exportTime: Date.now(),
      },
      tabs,
      groups,
    };
  }

  /**
   * 执行实际的导入操作
   * @param importData 要导入的数据
   * @param options 导入选项
   * @returns 导入统计结果
   */
  private async performImport(
    importData: ExportData,
    options: ImportOptions
  ): Promise<{
    tabsImported: number;
    groupsImported: number;
    duplicatesSkipped: number;
    warnings: string[];
  }> {
    const storageService = getStorageService();
    const warnings: string[] = [];
    let tabsImported = 0;
    let groupsImported = 0;
    let duplicatesSkipped = 0;

    try {
      // 获取现有数据
      const [existingTabs, existingGroups] = await Promise.all([
        storageService.loadTabs(),
        storageService.loadGroups(),
      ]);

      // 处理分组导入
      const finalGroups = [...existingGroups];
      for (const importGroup of importData.groups) {
        const existingGroupIndex = existingGroups.findIndex(g => g.name === importGroup.name);
        
        if (existingGroupIndex >= 0) {
          // 处理重复分组
          switch (options.duplicateStrategy) {
            case 'skip':
              duplicatesSkipped++;
              continue;
            case 'overwrite':
              finalGroups[existingGroupIndex] = importGroup;
              groupsImported++;
              break;
            case 'rename':
              const renamedGroup = {
                ...importGroup,
                name: `${importGroup.name} (导入)`,
                id: `${importGroup.id}_imported_${Date.now()}`,
              };
              finalGroups.push(renamedGroup);
              groupsImported++;
              break;
          }
        } else {
          finalGroups.push(importGroup);
          groupsImported++;
        }
      }

      // 处理标签页导入
      const finalTabs = [...existingTabs];
      for (const importTab of importData.tabs) {
        const existingTabIndex = existingTabs.findIndex(t => t.url === importTab.url);
        
        if (existingTabIndex >= 0) {
          // 处理重复标签页
          switch (options.duplicateStrategy) {
            case 'skip':
              duplicatesSkipped++;
              continue;
            case 'overwrite':
              finalTabs[existingTabIndex] = importTab;
              tabsImported++;
              break;
            case 'rename':
              const renamedTab = {
                ...importTab,
                title: `${importTab.title} (导入)`,
                id: `${importTab.id}_imported_${Date.now()}`,
              };
              finalTabs.push(renamedTab);
              tabsImported++;
              break;
          }
        } else {
          finalTabs.push(importTab);
          tabsImported++;
        }
      }

      // 保存数据
      await Promise.all([
        storageService.saveTabs(finalTabs),
        storageService.saveGroups(finalGroups),
      ]);

      // 导入设置（如果需要）
      if (options.importSettings && importData.settings) {
        await storageService.saveSettings(importData.settings);
        warnings.push('已导入用户设置');
      }

      return {
        tabsImported,
        groupsImported,
        duplicatesSkipped,
        warnings,
      };
    } catch (error) {
      console.error('ImportExportService: 执行导入失败', error);
      throw error;
    }
  }

  /**
   * 检查是否是OneTab分组标题
   * @param line 文本行
   * @returns 是否是分组标题
   */
  private isOneTabGroupTitle(line: string): boolean {
    // OneTab分组标题的特征检测
    return line.startsWith('# ') || line.includes('saved tabs');
  }

  /**
   * 提取OneTab分组名称
   * @param line 分组标题行
   * @returns 分组名称
   */
  private extractOneTabGroupName(line: string): string {
    if (line.startsWith('# ')) {
      return line.substring(2).trim();
    }
    return line.trim();
  }

  /**
   * 解析OneTab标签页行
   * @param line 标签页文本行
   * @returns 标签页数据
   */
  private parseOneTabLine(line: string): { title: string; url: string } | null {
    const trimmedLine = line.trim();

    // 1. 标准OneTab格式: URL | Title
    const separatorMatch = trimmedLine.match(/^(https?:\/\/[^\s|]+)\s*\|\s*(.+)$/);
    if (separatorMatch) {
      const url = separatorMatch[1].trim();
      const title = separatorMatch[2].trim();
      return { url, title };
    }

    // 2. 反向格式: Title | URL (虽然少见但支持)
    const reverseMatch = trimmedLine.match(/^(.+?)\s*\|\s*(https?:\/\/[^\s]+)$/);
    if (reverseMatch) {
      const title = reverseMatch[1].trim();
      const url = reverseMatch[2].trim();
      return { url, title };
    }

    // 3. 纯URL格式，自动生成标题
    const urlMatch = trimmedLine.match(/^(https?:\/\/[^\s]+)$/);
    if (urlMatch) {
      const url = urlMatch[1].trim();
      try {
        const urlObj = new URL(url);
        // 使用域名作为标题
        const title = urlObj.hostname.replace(/^www\./, '');
        return { url, title };
      } catch {
        // 如果URL解析失败，使用URL本身作为标题
        return { url, title: url };
      }
    }

    // 4. 检查是否包含URL的混合格式
    const mixedUrlMatch = trimmedLine.match(/(https?:\/\/[^\s]+)/);
    if (mixedUrlMatch) {
      const url = mixedUrlMatch[1];
      // 从原行中移除URL，剩余部分作为标题
      const title = trimmedLine.replace(url, '').replace(/^\s*\|\s*|\s*\|\s*$/g, '').trim();
      const finalTitle = title || new URL(url).hostname.replace(/^www\./, '');
      return { url, title: finalTitle };
    }

    // 5. 检查是否是普通文本（可能只是标题，需要URL）
    if (trimmedLine.length > 0 && !trimmedLine.includes('http')) {
      // 对于纯文本，暂时跳过，但记录警告
      console.warn(`ImportExportService: 跳过无效行（缺少URL）: ${trimmedLine}`);
      return null;
    }

    return null;
  }

  /**
   * 获取网站图标URL
   * @param url 网站URL
   * @returns 图标URL
   */
  private getFaviconUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      const protocol = urlObj.protocol;

      return this.generateFaviconWithFallback(protocol, hostname);
    } catch {
      return '';
    }
  }

  /**
   * 使用渐进式fallback策略生成favicon URL
   * @param protocol 协议
   * @param hostname 主机名
   * @returns favicon URL
   */
  private generateFaviconWithFallback(protocol: string, hostname: string): string {
    // 常见的favicon路径（按优先级排序）
    const faviconPaths = [
      '/favicon.ico',
      '/favicon.png',
      '/favicon.svg',
      '/static/favicon.ico',
      '/assets/favicon.ico',
      '/img/favicon.ico',
      '/images/favicon.ico',
      '/static/img/favicon.ico',
      '/assets/images/favicon.ico'
    ];

    // 子域名回退策略
    const rootDomain = this.extractRootDomain(hostname);
    const domainVariants = hostname !== rootDomain ? [hostname, rootDomain] : [hostname];

    // 按优先级生成favicon URL
    // 返回第一个可能的URL（浏览器会自动处理404等情况）
    for (const domain of domainVariants) {
      for (const path of faviconPaths) {
        return `${protocol}//${domain}${path}`;
      }
    }

    // 最后的fallback
    return `${protocol}//${hostname}/favicon.ico`;
  }

  /**
   * 提取根域名
   * @param hostname 完整主机名
   * @returns 根域名
   */
  private extractRootDomain(hostname: string): string {
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      return parts.slice(-2).join('.');
    }
    return hostname;
  }
}

// ==================== 导出便捷函数 ====================

/**
 * 获取导入导出服务实例
 */
export const getImportExportService = () => ImportExportService.getInstance();

/**
 * 快速导出所有数据
 */
export const quickExportAllData = async (includeSettings: boolean = true): Promise<void> => {
  const service = getImportExportService();

  // 确保存储服务已初始化
  const storageService = getStorageService();
  await storageService.initialize();

  await service.exportToFile(includeSettings);
};

/**
 * 快速导入数据
 */
export const quickImportData = async (file: File): Promise<ImportResult> => {
  const service = getImportExportService();
  const options: ImportOptions = {
    overwriteExisting: false,
    importSettings: true,
    duplicateStrategy: 'rename',
    createBackup: true,
  };
  return await service.importFromFile(file, options);
};

/**
 * 快速导入文本数据（支持OneTab格式）
 */
export const quickImportText = async (text: string): Promise<ImportResult> => {
  const service = getImportExportService();
  const options: ImportOptions = {
    overwriteExisting: false,
    importSettings: true,
    duplicateStrategy: 'rename',
    createBackup: true,
  };
  return await service.importFromString(text, options);
};