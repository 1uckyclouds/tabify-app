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
    const result: ImportResult = {
      success: false,
      tabsImported: 0,
      groupsImported: 0,
      duplicatesSkipped: 0,
      errors: [],
      warnings: [],
    };

    try {
      // 解析JSON数据
      const importData = JSON.parse(jsonString);
      
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

    if (!data || typeof data !== 'object') {
      errors.push('数据格式无效：不是有效的JSON对象');
      return { isValid: false, errors };
    }

    // 检查Tabify格式
    if (data.app && data.tabs && Array.isArray(data.tabs)) {
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
    // 检查OneTab格式或其他格式
    else if (typeof data === 'string') {
      // OneTab格式通常是纯文本
      return { isValid: true, errors: [] };
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
    if (data.app && data.app.name === 'Tabify') {
      return 'tabify';
    }
    
    if (typeof data === 'string' || (data.app && data.app.name === 'OneTab')) {
      return 'onetab';
    }
    
    return 'unknown';
  }

  /**
   * 转换OneTab数据格式
   * @param _oneTabData OneTab格式数据（暂未实现）
   * @returns Tabify格式数据
   */
  private convertOneTabData(_oneTabData: any): ExportData {
    // 这里实现OneTab到Tabify格式的转换逻辑
    // 具体实现取决于OneTab的实际数据格式
    
    return {
      app: {
        name: 'Tabify',
        version: APP_VERSION,
        exportTime: Date.now(),
      },
      tabs: [],
      groups: [],
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
    // OneTab格式通常是: URL | Title
    const parts = line.split(' | ');
    if (parts.length >= 2) {
      return {
        url: parts[0].trim(),
        title: parts[1].trim(),
      };
    }
    
    // 尝试其他格式
    if (line.includes('http')) {
      const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
      if (urlMatch) {
        const url = urlMatch[1];
        const title = line.replace(url, '').trim() || new URL(url).hostname;
        return { url, title };
      }
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
      return `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`;
    } catch {
      return '';
    }
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