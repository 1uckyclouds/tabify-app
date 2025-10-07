/**
 * Tabify Chrome插件 - 扩展通信桥梁
 * 
 * 本文件提供Chrome扩展与React应用之间的数据通信桥梁，实现：
 * - 统一的消息传递接口
 * - 数据同步机制
 * - 错误处理和重试逻辑
 * - 事件监听和通知
 * - 环境检测和兼容性处理
 * 
 * 这个桥梁确保React应用能够与Chrome扩展后台脚本无缝通信，
 * 同时在非扩展环境下提供降级方案。
 */

import { Tab, Group, Settings, Operation, StorageData, AIAnalysisResult, GroupingSuggestion, ImportResult } from './types';
import { getStorageService } from './storage';
import { getAIGroupingService, GroupingStrategy } from './ai-grouping-service';
import { getEnhancedImportExportService, ExportFormat, ExportConfig, EnhancedImportOptions } from './enhanced-import-export';

// ==================== 消息类型定义 ====================

/**
 * 扩展消息类型
 */
export interface ExtensionMessage {
  action: string;
  data?: any;
  requestId?: string;
}

/**
 * 扩展响应类型
 */
export interface ExtensionResponse {
  success: boolean;
  data?: any;
  error?: string;
  requestId?: string;
}

/**
 * 支持的消息动作类型
 */
export enum MessageAction {
  // 数据操作
  GET_STORAGE_DATA = 'getStorageData',
  SET_STORAGE_DATA = 'setStorageData',
  SYNC_DATA = 'syncData',
  
  // 标签页操作
  COLLECT_CURRENT_TAB = 'collectCurrentTab',
  COLLECT_ALL_TABS = 'collectAllTabs',
  RESTORE_TAB = 'restoreTab',
  RESTORE_TABS = 'restoreTabs',
  
  // 管理界面操作
  OPEN_MANAGER = 'openManager',
  CLOSE_MANAGER = 'closeManager',
  
  // 事件通知
  DATA_CHANGED = 'dataChanged',
  TAB_COLLECTED = 'tabCollected',
  TAB_RESTORED = 'tabRestored',
}

/**
 * 数据变更事件类型
 */
export interface DataChangeEvent {
  type: 'tabs' | 'groups' | 'settings' | 'operations';
  action: 'add' | 'update' | 'delete' | 'sync';
  data: any;
  timestamp: number;
}

// ==================== 扩展通信桥梁类 ====================

/**
 * Chrome扩展通信桥梁
 * 提供React应用与Chrome扩展后台脚本之间的通信接口
 */
export class ExtensionBridge {
  private static instance: ExtensionBridge;
  private isInitialized = false;
  private messageListeners: Map<string, ((data: any) => void)[]> = new Map();
  private pendingRequests: Map<string, { resolve: (value: any) => void; reject: (reason: any) => void; timeout: NodeJS.Timeout }> = new Map();
  private requestIdCounter = 0;
  private readonly REQUEST_TIMEOUT = 10000; // 10秒超时

  /**
   * 获取扩展桥梁单例实例
   */
  public static getInstance(): ExtensionBridge {
    if (!ExtensionBridge.instance) {
      ExtensionBridge.instance = new ExtensionBridge();
    }
    return ExtensionBridge.instance;
  }

  /**
   * 私有构造函数
   */
  private constructor() {}

  /**
   * 初始化扩展桥梁
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // 检查Chrome扩展环境
      if (this.isChromeExtension()) {
        // 设置消息监听器
        this.setupMessageListener();
        console.log('ExtensionBridge: Chrome扩展环境 - 消息监听器已设置');
      } else {
        console.warn('ExtensionBridge: 非Chrome扩展环境 - 使用本地存储模式');
      }

      this.isInitialized = true;
      console.log('ExtensionBridge: 初始化完成');
    } catch (error) {
      console.error('ExtensionBridge: 初始化失败', error);
      throw new Error(`扩展桥梁初始化失败: ${error}`);
    }
  }

  // ==================== 数据同步方法 ====================

  /**
   * 从扩展后台获取存储数据
   * @param keys 要获取的数据键，不传则获取所有数据
   * @returns 存储数据
   */
  public async getStorageData(keys?: string[]): Promise<any> {
    console.log('🔍 ExtensionBridge: 开始获取存储数据，请求键:', keys);
    
    // 详细的环境检测
    const chromeAvailable = typeof chrome !== 'undefined';
    const runtimeAvailable = chromeAvailable && chrome.runtime;
    const extensionIdAvailable = runtimeAvailable && chrome.runtime.id;
    const storageAvailable = chromeAvailable && chrome.storage && chrome.storage.local;
    
    console.log('🔍 ExtensionBridge: 环境检测结果:', {
      chromeAvailable,
      runtimeAvailable,
      extensionIdAvailable,
      storageAvailable,
      extensionId: extensionIdAvailable ? chrome.runtime.id : 'N/A',
      url: typeof window !== 'undefined' ? window.location.href : 'N/A'
    });
    
    // 首先尝试Chrome扩展环境
    if (this.isChromeExtension()) {
      console.log('✅ ExtensionBridge: 检测到Chrome扩展环境，尝试通过消息传递获取数据');
      try {
        // Chrome扩展环境，通过消息传递获取数据
        const result = await this.sendMessage({
          action: MessageAction.GET_STORAGE_DATA,
          data: { keys }
        });
        console.log('✅ ExtensionBridge: 成功从Chrome扩展获取数据:', {
          tabs: result?.tabs?.length || 0,
          groups: result?.groups?.length || 0,
          keys: Object.keys(result || {}),
          hasRealData: (result?.tabs?.length || 0) > 0
        });
        return result;
      } catch (error) {
        console.warn('⚠️ ExtensionBridge: Chrome扩展数据获取失败，降级到本地存储', error);
        // 在开发环境中，这是正常的，不需要抛出错误
        if (this.isDevelopmentEnvironment()) {
          console.log('🔧 ExtensionBridge: 开发环境检测到，使用本地存储作为数据源');
        }
      }
    } else {
      console.log('❌ ExtensionBridge: 非Chrome扩展环境，直接使用本地存储');
    }
    
    // 非扩展环境或扩展环境失败，使用本地存储服务
    console.log('📦 ExtensionBridge: 使用本地存储服务获取数据');
    try {
      const storageService = getStorageService();
      if (keys) {
        const result: any = {};
        for (const key of keys) {
          switch (key) {
            case 'tabs':
              result.tabs = await storageService.loadTabs();
              console.log(`📦 ExtensionBridge: 从本地存储加载了 ${result.tabs?.length || 0} 个标签页`);
              if (result.tabs?.length > 0) {
                console.log('📦 ExtensionBridge: 本地存储标签页示例:', result.tabs.slice(0, 2).map(t => ({ id: t.id, title: t.title, url: t.url })));
              }
              break;
            case 'groups':
              result.groups = await storageService.loadGroups();
              console.log(`📦 ExtensionBridge: 从本地存储加载了 ${result.groups?.length || 0} 个分组`);
              break;
            case 'settings':
              result.settings = await storageService.loadSettings();
              break;
          case 'operations':
            result.operations = await storageService.loadOperations();
            break;
          }
        }
        console.log('📦 ExtensionBridge: 本地存储数据获取完成:', {
          tabs: result.tabs?.length || 0,
          groups: result.groups?.length || 0,
          keys: Object.keys(result),
          isEmptyData: (result.tabs?.length || 0) === 0 && (result.groups?.length || 0) === 0
        });
        return result;
      } else {
        const allData = await storageService.getAllData();
        console.log('📦 ExtensionBridge: 获取所有本地存储数据:', {
          tabs: allData.tabs?.length || 0,
          groups: allData.groups?.length || 0,
          keys: Object.keys(allData),
          isEmptyData: (allData.tabs?.length || 0) === 0 && (allData.groups?.length || 0) === 0
        });
        return allData;
      }
    } catch (storageError) {
      console.error('❌ ExtensionBridge: 本地存储访问失败:', storageError);
      // 返回空数据而不是抛出错误，确保应用能继续运行
      const emptyResult = keys ? {} : { tabs: [], groups: [], settings: {}, operations: [] };
      if (keys) {
        keys.forEach(key => {
          switch (key) {
            case 'tabs':
              emptyResult.tabs = [];
              break;
            case 'groups':
              emptyResult.groups = [];
              break;
            case 'settings':
              emptyResult.settings = {};
              break;
            case 'operations':
              emptyResult.operations = [];
              break;
          }
        });
      }
      console.log('🔧 ExtensionBridge: 返回空数据以确保应用继续运行');
      return emptyResult;
    }
  }

  /**
   * 向扩展后台设置存储数据
   * @param data 要设置的数据
   */
  public async setStorageData(data: any): Promise<void> {
    // 首先尝试Chrome扩展环境
    if (this.isChromeExtension()) {
      try {
        // Chrome扩展环境，通过消息传递设置数据
        await this.sendMessage({
          action: MessageAction.SET_STORAGE_DATA,
          data: data
        });
        console.log('ExtensionBridge: 成功向Chrome扩展设置数据');
        return;
      } catch (error) {
        console.warn('ExtensionBridge: Chrome扩展数据设置失败，降级到本地存储', error);
        // 在开发环境中，这是正常的
        if (this.isDevelopmentEnvironment()) {
          console.log('🔧 ExtensionBridge: 开发环境中使用本地存储保存数据');
        }
      }
    }
    
    // 非扩展环境或扩展环境失败，使用本地存储服务
    console.log('ExtensionBridge: 使用本地存储服务设置数据');
    try {
      const storageService = getStorageService();
      if (data.tabs) await storageService.saveTabs(data.tabs);
      if (data.groups) await storageService.saveGroups(data.groups);
      if (data.settings) await storageService.saveSettings(data.settings);
      if (data.operations) await storageService.saveOperations(data.operations);
      console.log('✅ ExtensionBridge: 本地存储数据保存成功');
    } catch (storageError) {
      console.error('❌ ExtensionBridge: 本地存储数据保存失败:', storageError);
      // 在开发环境中，提供更友好的错误信息
      if (this.isDevelopmentEnvironment()) {
        console.warn('🔧 ExtensionBridge: 开发环境中数据保存失败，这可能是正常的');
      } else {
        throw new Error(`数据保存失败: ${storageError}`);
      }
    }
  }

  /**
   * 同步数据到扩展后台
   * @param tabs 标签页数据
   * @param groups 分组数据
   */
  public async syncData(tabs: Tab[], groups: Group[]): Promise<void> {
    try {
      await this.setStorageData({ tabs, groups });
      
      // 触发数据变更事件
      this.emitDataChange({
        type: 'tabs',
        action: 'sync',
        data: tabs,
        timestamp: Date.now()
      });
      
      this.emitDataChange({
        type: 'groups',
        action: 'sync',
        data: groups,
        timestamp: Date.now()
      });
      
      console.log('ExtensionBridge: 数据同步完成');
    } catch (error) {
      console.error('ExtensionBridge: 数据同步失败', error);
      
      // 在开发环境中，不抛出错误，只记录警告
      if (this.isDevelopmentEnvironment()) {
        console.warn('🔧 ExtensionBridge: 开发环境中数据同步失败，这可能是正常的');
        // 仍然触发事件，让UI知道数据已更新
        this.emitDataChange({
          type: 'tabs',
          action: 'sync',
          data: tabs,
          timestamp: Date.now()
        });
        
        this.emitDataChange({
          type: 'groups',
          action: 'sync',
          data: groups,
          timestamp: Date.now()
        });
      } else {
        throw new Error(`数据同步失败: ${error}`);
      }
    }
  }

  // ==================== 标签页操作方法 ====================

  /**
   * 收纳当前标签页
   * @returns 收纳的标签页信息
   */
  public async collectCurrentTab(): Promise<Tab | null> {
    if (!this.isChromeExtension()) {
      console.warn('ExtensionBridge: 非扩展环境，无法收纳标签页');
      return null;
    }

    try {
      const response = await this.sendMessage({
        action: MessageAction.COLLECT_CURRENT_TAB
      });
      
      if (response.success && response.data) {
        // 触发标签页收纳事件
        this.emit('tabCollected', response.data);
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error('ExtensionBridge: 收纳当前标签页失败', error);
      throw new Error(`收纳当前标签页失败: ${error}`);
    }
  }

  /**
   * 收纳所有标签页
   * @returns 收纳的标签页数组
   */
  public async collectAllTabs(): Promise<Tab[]> {
    if (!this.isChromeExtension()) {
      console.warn('ExtensionBridge: 非扩展环境，无法收纳标签页');
      return [];
    }

    try {
      const response = await this.sendMessage({
        action: MessageAction.COLLECT_ALL_TABS
      });
      
      if (response.success && response.data) {
        // 触发标签页收纳事件
        this.emit('tabsCollected', response.data);
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('ExtensionBridge: 收纳所有标签页失败', error);
      throw new Error(`收纳所有标签页失败: ${error}`);
    }
  }

  /**
   * 恢复标签页
   * @param tab 要恢复的标签页
   * @param active 是否激活标签页
   */
  public async restoreTab(tab: Tab, active: boolean = true): Promise<void> {
    if (!this.isChromeExtension()) {
      // 非扩展环境，使用window.open
      window.open(tab.url, '_blank');
      return;
    }

    try {
      await this.sendMessage({
        action: MessageAction.RESTORE_TAB,
        data: { tab, active }
      });
      
      // 触发标签页恢复事件
      this.emit('tabRestored', tab);
    } catch (error) {
      console.error('ExtensionBridge: 恢复标签页失败', error);
      throw new Error(`恢复标签页失败: ${error}`);
    }
  }

  /**
   * 批量恢复标签页
   * @param tabs 要恢复的标签页数组
   * @param activeLast 是否激活最后一个标签页
   */
  public async restoreTabs(tabs: Tab[], activeLast: boolean = true): Promise<void> {
    if (!this.isChromeExtension()) {
      // 非扩展环境，使用window.open批量打开
      tabs.forEach((tab, index) => {
        setTimeout(() => window.open(tab.url, '_blank'), index * 100);
      });
      return;
    }

    try {
      await this.sendMessage({
        action: MessageAction.RESTORE_TABS,
        data: { tabs, activeLast }
      });
      
      // 触发批量恢复事件
      this.emit('tabsRestored', tabs);
    } catch (error) {
      console.error('ExtensionBridge: 批量恢复标签页失败', error);
      throw new Error(`批量恢复标签页失败: ${error}`);
    }
  }

  // ==================== 管理界面操作 ====================

  /**
   * 打开管理界面
   */
  public async openManager(): Promise<void> {
    if (!this.isChromeExtension()) {
      console.warn('ExtensionBridge: 非扩展环境，无法打开管理界面');
      return;
    }

    try {
      await this.sendMessage({
        action: MessageAction.OPEN_MANAGER
      });
    } catch (error) {
      console.error('ExtensionBridge: 打开管理界面失败', error);
      throw new Error(`打开管理界面失败: ${error}`);
    }
  }

  // ==================== AI智能分组功能 ====================

  /**
   * AI智能分组
   * @param tabs 要分组的标签页
   * @param strategy 分组策略
   * @returns 分组分析结果
   */
  public async intelligentGrouping(
    tabs: Tab[], 
    strategy: GroupingStrategy = 'ai-intelligent'
  ): Promise<AIAnalysisResult & { quality: any }> {
    try {
      const aiService = getAIGroupingService();
      const result = await aiService.intelligentGrouping(tabs, { strategy });
      
      // 触发AI分组完成事件
      this.emit('aiGroupingCompleted', {
        result,
        timestamp: Date.now(),
        strategy,
      });
      
      return result;
    } catch (error) {
      console.error('ExtensionBridge: AI智能分组失败', error);
      throw error;
    }
  }

  /**
   * 获取分组建议
   * @param tabs 标签页数组
   * @returns 分组建议列表
   */
  public async getGroupingSuggestions(tabs: Tab[]): Promise<GroupingSuggestion[]> {
    try {
      const aiService = getAIGroupingService();
      return await aiService.getRealtimeSuggestions(tabs);
    } catch (error) {
      console.error('ExtensionBridge: 获取分组建议失败', error);
      return [];
    }
  }

  /**
   * 应用分组建议
   * @param suggestions 分组建议列表
   */
  public async applyGroupingSuggestions(suggestions: GroupingSuggestion[]): Promise<void> {
    try {
      const storageService = getStorageService();
      const existingGroups = await storageService.loadGroups();
      const tabs = await storageService.loadTabs();
      
      // 创建新分组
      const newGroupNames = new Set<string>();
      suggestions.forEach(suggestion => {
        if (suggestion.groupType === 'new' && 
            !existingGroups.find(g => g.name === suggestion.groupName)) {
          newGroupNames.add(suggestion.groupName);
        }
      });
      
      for (const groupName of newGroupNames) {
        await this.setStorageData({
          groups: [...existingGroups, {
            id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: groupName,
            description: 'AI自动生成的分组',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            tabIds: []
          }]
        });
      }
      
      // 重新加载分组以获取新创建的分组ID
      const updatedGroups = await storageService.loadGroups();
      
      // 应用标签页分组
      for (const suggestion of suggestions) {
        const targetGroup = updatedGroups.find(g => g.name === suggestion.groupName);
        if (targetGroup) {
          const tab = tabs.find(t => t.id === suggestion.tabId);
          if (tab) {
            // 更新标签页的分组信息
            const updatedTabs = tabs.map(t => 
              t.id === suggestion.tabId ? { ...t, groupId: targetGroup.id } : t
            );
            await this.setStorageData({ tabs: updatedTabs });
          }
        }
      }
      
      // 触发分组应用完成事件
      this.emit('groupingSuggestionsApplied', {
        suggestions,
        timestamp: Date.now(),
      });
      
      console.log('ExtensionBridge: 分组建议应用完成', suggestions.length);
    } catch (error) {
      console.error('ExtensionBridge: 应用分组建议失败', error);
      throw error;
    }
  }

  /**
   * 记录分组反馈
   * @param feedback 用户反馈数据
   */
  public async recordGroupingFeedback(feedback: any): Promise<void> {
    try {
      const aiService = getAIGroupingService();
      await aiService.recordUserFeedback(feedback);
      
      // 触发反馈记录事件
      this.emit('groupingFeedbackRecorded', {
        feedback,
        timestamp: Date.now(),
      });
      
      console.log('ExtensionBridge: 分组反馈已记录', feedback);
    } catch (error) {
      console.error('ExtensionBridge: 记录分组反馈失败', error);
    }
  }

  // ==================== 增强导入导出功能 ====================

  /**
   * 导出数据
   * @param config 导出配置
   * @returns 导出结果
   */
  public async exportData(config: ExportConfig): Promise<{
    success: boolean;
    filename: string;
    fileSize: number;
    duration?: number;
    errors?: string[];
  }> {
    try {
      const importExportService = getEnhancedImportExportService();
      const result = await importExportService.enhancedExport(config);
      
      // 触发导出完成事件
      this.emit('dataExported', {
        result,
        config,
        timestamp: Date.now(),
      });
      
      console.log('ExtensionBridge: 数据导出完成', result.filename);
      return result;
    } catch (error) {
      console.error('ExtensionBridge: 数据导出失败', error);
      return {
        success: false,
        filename: '',
        fileSize: 0,
        errors: [error.toString()],
      };
    }
  }

  /**
   * 导入数据
   * @param file 导入文件
   * @param options 导入选项
   * @returns 导入结果
   */
  public async importData(file: File, options: EnhancedImportOptions): Promise<ImportResult> {
    try {
      const importExportService = getEnhancedImportExportService();
      const result = await importExportService.enhancedImport(file, options);
      
      // 如果导入成功，同步数据
      if (result.success) {
        const data = await this.getStorageData(['tabs', 'groups']);
        await this.syncData(data.tabs || [], data.groups || []);
      }
      
      // 触发导入完成事件
      this.emit('dataImported', {
        result,
        options,
        timestamp: Date.now(),
      });
      
      console.log('ExtensionBridge: 数据导入完成', {
        success: result.success,
        tabsImported: result.tabsImported,
        groupsImported: result.groupsImported,
      });
      
      return result;
    } catch (error) {
      console.error('ExtensionBridge: 数据导入失败', error);
      return {
        success: false,
        tabsImported: 0,
        groupsImported: 0,
        duplicatesSkipped: 0,
        errors: [error.toString()],
        warnings: [],
      };
    }
  }

  /**
   * 创建数据备份
   * @returns 备份文件名
   */
  public async createBackup(): Promise<string> {
    try {
      const importExportService = getEnhancedImportExportService();
      
      const config: ExportConfig = {
        format: 'json',
        includeSettings: true,
        includeHistory: false,
        compress: true,
        encrypt: false,
        scope: {},
      };
      
      const result = await importExportService.enhancedExport(config);
      
      // 触发备份创建事件
      this.emit('backupCreated', {
        filename: result.filename,
        fileSize: result.fileSize,
        timestamp: Date.now(),
      });
      
      console.log('ExtensionBridge: 备份创建完成', result.filename);
      return result.filename;
    } catch (error) {
      console.error('ExtensionBridge: 创建备份失败', error);
      throw error;
    }
  }

  /**
   * 获取导入导出历史
   * @returns 历史记录列表
   */
  public getImportExportHistory(): any[] {
    try {
      const importExportService = getEnhancedImportExportService();
      return importExportService.getHistory();
    } catch (error) {
      console.error('ExtensionBridge: 获取导入导出历史失败', error);
      return [];
    }
  }

  /**
   * 启用自动备份
   * @param config 自动备份配置
   */
  public async enableAutoBackup(config: any): Promise<void> {
    try {
      const importExportService = getEnhancedImportExportService();
      await importExportService.updateAutoBackupConfig(config);
      
      // 触发自动备份配置更新事件
      this.emit('autoBackupConfigUpdated', {
        config,
        timestamp: Date.now(),
      });
      
      console.log('ExtensionBridge: 自动备份配置已更新', config);
    } catch (error) {
      console.error('ExtensionBridge: 更新自动备份配置失败', error);
      throw error;
    }
  }

  // ==================== 事件系统 ====================

  /**
   * 监听事件
   * @param event 事件名称
   * @param callback 回调函数
   */
  public on(event: string, callback: (data: any) => void): void {
    if (!this.messageListeners.has(event)) {
      this.messageListeners.set(event, []);
    }
    this.messageListeners.get(event)!.push(callback);
  }

  /**
   * 移除事件监听
   * @param event 事件名称
   * @param callback 回调函数
   */
  public off(event: string, callback: (data: any) => void): void {
    const listeners = this.messageListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   * @param event 事件名称
   * @param data 事件数据
   */
  public emit(event: string, data?: any): void {
    const listeners = this.messageListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`ExtensionBridge: 事件回调执行失败 (${event})`, error);
        }
      });
    }
  }

  /**
   * 触发数据变更事件
   * @param changeEvent 数据变更事件
   */
  public emitDataChange(changeEvent: DataChangeEvent): void {
    this.emit('dataChanged', changeEvent);
    this.emit(`${changeEvent.type}Changed`, changeEvent);
  }

  // ==================== 私有方法 ====================

  /**
   * 检查是否在开发环境中
   * @returns 是否为开发环境
   */
  private isDevelopmentEnvironment(): boolean {
    try {
      if (typeof window === 'undefined') {
        return false;
      }
      
      const currentUrl = window.location.href;
      const hostname = window.location.hostname;
      const port = window.location.port;
      
      // 检查常见的开发环境标识
      const isDev = (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0' ||
        port === '3000' ||
        port === '3001' ||
        port === '8080' ||
        currentUrl.includes('localhost') ||
        currentUrl.includes('127.0.0.1') ||
        process.env.NODE_ENV === 'development'
      );
      
      return isDev;
    } catch (error) {
      console.warn('ExtensionBridge: 开发环境检测失败', error);
      return false;
    }
  }

  /**
   * 检查是否在Chrome扩展环境中
   * 增强检测逻辑，确保真正能够访问扩展API
   */
  private isChromeExtension(): boolean {
    try {
      // 基础检测：Chrome API是否存在
      if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
        console.log('🔍 ExtensionBridge: Chrome API不存在或不完整');
        return false;
      }
      
      // 检查是否有扩展ID（在扩展内部运行时会有）
      if (!chrome.runtime.id) {
        console.warn('ExtensionBridge: Chrome API存在但无扩展ID，可能在外部页面中');
        return false;
      }
      
      console.log('🔍 ExtensionBridge: Chrome扩展环境检测通过:', {
        chromeAvailable: typeof chrome !== 'undefined',
        runtimeAvailable: !!chrome.runtime,
        extensionIdAvailable: !!chrome.runtime.id,
        extensionId: chrome.runtime.id,
        currentUrl: window.location.href
      });
      
      // 检查当前页面是否为扩展页面
      const currentUrl = window.location.href;
      if (currentUrl.startsWith('chrome-extension://')) {
        return true;
      }
      
      // 如果是localhost开发环境，需要特殊处理
      if (currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1')) {
        console.warn('ExtensionBridge: 开发环境检测到Chrome API，但运行在外部页面，将使用降级模式');
        return false;
      }
      
      return true;
    } catch (error) {
      console.warn('ExtensionBridge: Chrome扩展环境检测失败', error);
      return false;
    }
  }

  /**
   * 设置消息监听器
   */
  private setupMessageListener(): void {
    if (!chrome.runtime.onMessage) {
      return;
    }

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      try {
        console.log('📨 ExtensionBridge: 收到消息', message);
        
        // 处理来自后台脚本的消息
        if (message.action === MessageAction.DATA_CHANGED || message.action === 'dataChanged') {
          console.log('📊 ExtensionBridge: 处理数据变更事件', message.data);
          this.emitDataChange(message.data);
        } else if (message.action === MessageAction.TAB_COLLECTED || message.action === 'tabCollected') {
          console.log('📋 ExtensionBridge: 处理标签页收纳事件', message.data);
          this.emit('tabCollected', message.data);
        } else if (message.action === MessageAction.TAB_RESTORED || message.action === 'tabRestored') {
          console.log('🔄 ExtensionBridge: 处理标签页恢复事件', message.data);
          this.emit('tabRestored', message.data);
        }
        
        // 处理广播消息
        if (message.broadcast) {
          console.log('📡 ExtensionBridge: 处理广播消息', message);
          if (message.action === 'dataChanged') {
            this.emitDataChange(message.data);
          }
        }
        
        // 处理请求响应
        if (message.requestId && this.pendingRequests.has(message.requestId)) {
          const request = this.pendingRequests.get(message.requestId)!;
          clearTimeout(request.timeout);
          this.pendingRequests.delete(message.requestId);
          
          if (message.success) {
            request.resolve(message.data);
          } else {
            request.reject(new Error(message.error || '未知错误'));
          }
        }
      } catch (error) {
        console.error('ExtensionBridge: 消息处理失败', error);
      }
    });
    
    console.log('📡 ExtensionBridge: 消息监听器已设置');
  }

  /**
   * 发送消息到后台脚本
   * @param message 要发送的消息
   * @returns 响应数据
   */
  private async sendMessage(message: ExtensionMessage): Promise<any> {
    if (!this.isChromeExtension()) {
      throw new Error('非Chrome扩展环境，无法发送消息');
    }

    return new Promise((resolve, reject) => {
      const requestId = this.generateRequestId();
      message.requestId = requestId;

      // 设置超时处理
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        const errorMsg = `请求超时 (${this.REQUEST_TIMEOUT}ms): ${message.action}`;
        console.error('ExtensionBridge:', errorMsg);
        reject(new Error(errorMsg));
      }, this.REQUEST_TIMEOUT);

      // 保存请求信息
      this.pendingRequests.set(requestId, { resolve, reject, timeout });

      try {
        // 检查Chrome runtime是否仍然可用
        if (!chrome.runtime || !chrome.runtime.sendMessage) {
          clearTimeout(timeout);
          this.pendingRequests.delete(requestId);
          reject(new Error('Chrome runtime不可用'));
          return;
        }

        // 发送消息
        chrome.runtime.sendMessage(message, (response) => {
          // 检查Chrome runtime错误
          if (chrome.runtime.lastError) {
            clearTimeout(timeout);
            this.pendingRequests.delete(requestId);
            const errorMsg = `Chrome runtime错误: ${chrome.runtime.lastError.message}`;
            console.error('ExtensionBridge:', errorMsg);
            reject(new Error(errorMsg));
            return;
          }

          // 如果有直接响应，处理它
          if (response) {
            clearTimeout(timeout);
            this.pendingRequests.delete(requestId);
            
            if (response.success) {
              resolve(response.data);
            } else {
              const errorMsg = response.error || '未知错误';
              console.error('ExtensionBridge: 扩展响应错误:', errorMsg);
              reject(new Error(errorMsg));
            }
          }
          // 否则等待异步响应（通过消息监听器处理）
        });
      } catch (error) {
        clearTimeout(timeout);
        this.pendingRequests.delete(requestId);
        const errorMsg = `发送消息异常: ${error}`;
        console.error('ExtensionBridge:', errorMsg);
        reject(new Error(errorMsg));
      }
    });
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${++this.requestIdCounter}`;
  }
}

// ==================== 导出便捷函数 ====================

/**
 * 获取扩展桥梁实例
 */
export const getExtensionBridge = () => ExtensionBridge.getInstance();

/**
 * 初始化扩展桥梁
 */
export const initializeExtensionBridge = async (): Promise<ExtensionBridge> => {
  const bridge = getExtensionBridge();
  await bridge.initialize();
  return bridge;
};

/**
 * 检查是否在Chrome扩展环境中
 * 使用与ExtensionBridge相同的增强检测逻辑
 */
export const isChromeExtensionEnvironment = (): boolean => {
  try {
    // 基础检测：Chrome API是否存在
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
      console.log('ExtensionBridge: Chrome API不存在或不完整');
      return false;
    }
    
    // 检查是否有扩展ID（在扩展内部运行时会有）
    if (!chrome.runtime.id) {
      console.log('ExtensionBridge: 无扩展ID，可能在外部页面中');
      return false;
    }
    
    console.log('ExtensionBridge: 检测到Chrome扩展环境，扩展ID:', chrome.runtime.id);
    
    // 检查当前页面是否为扩展页面
    const currentUrl = window.location.href;
    if (currentUrl.startsWith('chrome-extension://')) {
      console.log('ExtensionBridge: 在扩展页面中运行');
      return true;
    }
    
    // 即使在localhost开发环境，如果有扩展ID也认为是扩展环境
    // 这允许在开发时通过扩展访问管理界面
    console.log('ExtensionBridge: 在外部页面中但有扩展ID，认为是扩展环境');
    return true;
  } catch (error) {
    console.error('ExtensionBridge: 环境检测异常:', error);
    return false;
  }
};

/**
 * 快速数据同步函数
 */
export const quickSyncData = async (tabs: Tab[], groups: Group[]): Promise<void> => {
  const bridge = getExtensionBridge();
  await bridge.syncData(tabs, groups);
};

/**
 * 快速收纳当前标签页
 */
export const quickCollectCurrentTab = async (): Promise<Tab | null> => {
  const bridge = getExtensionBridge();
  return await bridge.collectCurrentTab();
};

/**
 * 快速收纳所有标签页
 */
export const quickCollectAllTabs = async (): Promise<Tab[]> => {
  const bridge = getExtensionBridge();
  return await bridge.collectAllTabs();
};

/**
 * 快速恢复标签页
 */
export const quickRestoreTab = async (tab: Tab, active: boolean = true): Promise<void> => {
  const bridge = getExtensionBridge();
  await bridge.restoreTab(tab, active);
};

/**
 * 快速批量恢复标签页
 */
export const quickRestoreTabs = async (tabs: Tab[], activeLast: boolean = true): Promise<void> => {
  const bridge = getExtensionBridge();
  await bridge.restoreTabs(tabs, activeLast);
};