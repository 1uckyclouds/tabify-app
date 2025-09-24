/**
 * Tabify Chrome插件 - Chrome Storage API服务封装
 * 
 * 本文件提供了Chrome Storage API的封装服务，实现：
 * - 标签页数据的持久化存储
 * - 分组数据的管理
 * - 用户设置的保存和读取
 * - 操作历史的记录
 * - 数据版本管理和迁移
 * 
 * 使用Chrome Storage API确保数据在浏览器重启后仍然保持，
 * 并支持跨设备同步（如果用户启用了Chrome同步）。
 */

import {
  Tab,
  Group,
  Settings,
  Operation,
  StorageData,
  DEFAULT_SETTINGS,
  STORAGE_KEYS,
  APP_VERSION,
} from './types';

// 导入模拟数据
import { mockTabs, mockGroups, getCompleteTestData } from './mockData';

// ==================== 存储服务类 ====================

/**
 * Chrome存储服务
 * 封装Chrome Storage API，提供类型安全的数据存储操作
 */
export class ChromeStorageService {
  private static instance: ChromeStorageService;
  private isInitialized = false;

  /**
   * 获取存储服务单例实例
   * 使用单例模式确保全局只有一个存储服务实例
   */
  public static getInstance(): ChromeStorageService {
    if (!ChromeStorageService.instance) {
      ChromeStorageService.instance = new ChromeStorageService();
    }
    return ChromeStorageService.instance;
  }

  /**
   * 私有构造函数，防止外部直接实例化
   */
  private constructor() {}

  /**
   * 初始化存储服务
   * 检查Chrome扩展环境，设置默认数据
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // 检查Chrome扩展环境
      if (!this.isChromeExtension()) {
        console.warn('ChromeStorageService: 非Chrome扩展环境，使用localStorage作为后备存储');
      }

      // 检查数据版本，执行必要的迁移
      await this.checkAndMigrateData();

      // 设置默认数据（如果不存在）
      await this.ensureDefaultData();
      
      console.log('ChromeStorageService: 已完成初始化，不会自动加载模拟数据');

      this.isInitialized = true;
      console.log('ChromeStorageService: 初始化完成');
    } catch (error) {
      console.error('ChromeStorageService: 初始化失败', error);
      throw new Error(`存储服务初始化失败: ${error}`);
    }
  }

  // ==================== 标签页数据操作 ====================

  /**
   * 保存标签页数据
   * @param tabs 标签页数组
   */
  public async saveTabs(tabs: Tab[]): Promise<void> {
    try {
      await this.setStorageData(STORAGE_KEYS.TABS, tabs);
      console.log(`ChromeStorageService: 已保存 ${tabs.length} 个标签页`);
    } catch (error) {
      console.error('ChromeStorageService: 保存标签页失败', error);
      throw new Error(`保存标签页失败: ${error}`);
    }
  }

  /**
   * 加载标签页数据
   * @returns 标签页数组
   */
  public async loadTabs(): Promise<Tab[]> {
    try {
      const tabs = await this.getStorageData<Tab[]>(STORAGE_KEYS.TABS);
      console.log(`ChromeStorageService: 已加载 ${tabs?.length || 0} 个标签页`);
      return tabs || [];
    } catch (error) {
      console.error('ChromeStorageService: 加载标签页失败', error);
      return [];
    }
  }

  /**
   * 添加单个标签页
   * @param tab 标签页对象
   */
  public async addTab(tab: Tab): Promise<void> {
    try {
      const tabs = await this.loadTabs();
      const existingIndex = tabs.findIndex(t => t.id === tab.id);
      
      if (existingIndex >= 0) {
        // 更新现有标签页
        tabs[existingIndex] = tab;
      } else {
        // 添加新标签页
        tabs.push(tab);
      }
      
      await this.saveTabs(tabs);
    } catch (error) {
      console.error('ChromeStorageService: 添加标签页失败', error);
      throw new Error(`添加标签页失败: ${error}`);
    }
  }

  /**
   * 删除标签页
   * @param tabIds 要删除的标签页ID数组
   */
  public async deleteTabs(tabIds: string[]): Promise<void> {
    try {
      const tabs = await this.loadTabs();
      const filteredTabs = tabs.filter(tab => !tabIds.includes(tab.id));
      await this.saveTabs(filteredTabs);
      console.log(`ChromeStorageService: 已删除 ${tabIds.length} 个标签页`);
    } catch (error) {
      console.error('ChromeStorageService: 删除标签页失败', error);
      throw new Error(`删除标签页失败: ${error}`);
    }
  }

  /**
   * 更新标签页
   * @param tabId 标签页ID
   * @param updates 要更新的字段
   */
  public async updateTab(tabId: string, updates: Partial<Tab>): Promise<void> {
    try {
      const tabs = await this.loadTabs();
      const tabIndex = tabs.findIndex(tab => tab.id === tabId);
      
      if (tabIndex >= 0) {
        tabs[tabIndex] = { ...tabs[tabIndex], ...updates };
        await this.saveTabs(tabs);
      } else {
        throw new Error(`标签页不存在: ${tabId}`);
      }
    } catch (error) {
      console.error('ChromeStorageService: 更新标签页失败', error);
      throw new Error(`更新标签页失败: ${error}`);
    }
  }

  // ==================== 分组数据操作 ====================

  /**
   * 保存分组数据
   * @param groups 分组数组
   */
  public async saveGroups(groups: Group[]): Promise<void> {
    try {
      await this.setStorageData(STORAGE_KEYS.GROUPS, groups);
      console.log(`ChromeStorageService: 已保存 ${groups.length} 个分组`);
    } catch (error) {
      console.error('ChromeStorageService: 保存分组失败', error);
      throw new Error(`保存分组失败: ${error}`);
    }
  }

  /**
   * 加载分组数据
   * @returns 分组数组
   */
  public async loadGroups(): Promise<Group[]> {
    try {
      const groups = await this.getStorageData<Group[]>(STORAGE_KEYS.GROUPS);
      console.log(`ChromeStorageService: 已加载 ${groups?.length || 0} 个分组`);
      return groups || [];
    } catch (error) {
      console.error('ChromeStorageService: 加载分组失败', error);
      return [];
    }
  }

  /**
   * 添加分组
   * @param group 分组对象
   */
  public async addGroup(group: Group): Promise<void> {
    try {
      const groups = await this.loadGroups();
      const existingIndex = groups.findIndex(g => g.id === group.id);
      
      if (existingIndex >= 0) {
        groups[existingIndex] = group;
      } else {
        groups.push(group);
      }
      
      await this.saveGroups(groups);
    } catch (error) {
      console.error('ChromeStorageService: 添加分组失败', error);
      throw new Error(`添加分组失败: ${error}`);
    }
  }

  /**
   * 删除分组
   * @param groupId 分组ID
   */
  public async deleteGroup(groupId: string): Promise<void> {
    try {
      const groups = await this.loadGroups();
      const filteredGroups = groups.filter(group => group.id !== groupId);
      await this.saveGroups(filteredGroups);
      
      // 同时更新相关标签页，移除分组关联
      const tabs = await this.loadTabs();
      const updatedTabs = tabs.map(tab => 
        tab.groupId === groupId ? { ...tab, groupId: undefined } : tab
      );
      await this.saveTabs(updatedTabs);
      
      console.log(`ChromeStorageService: 已删除分组 ${groupId}`);
    } catch (error) {
      console.error('ChromeStorageService: 删除分组失败', error);
      throw new Error(`删除分组失败: ${error}`);
    }
  }

  /**
   * 更新分组
   * @param groupId 分组ID
   * @param updates 要更新的字段
   */
  public async updateGroup(groupId: string, updates: Partial<Group>): Promise<void> {
    try {
      const groups = await this.loadGroups();
      const groupIndex = groups.findIndex(group => group.id === groupId);
      
      if (groupIndex >= 0) {
        groups[groupIndex] = { ...groups[groupIndex], ...updates };
        await this.saveGroups(groups);
      } else {
        throw new Error(`分组不存在: ${groupId}`);
      }
    } catch (error) {
      console.error('ChromeStorageService: 更新分组失败', error);
      throw new Error(`更新分组失败: ${error}`);
    }
  }

  // ==================== 设置数据操作 ====================

  /**
   * 保存用户设置
   * @param settings 设置对象
   */
  public async saveSettings(settings: Settings): Promise<void> {
    try {
      await this.setStorageData(STORAGE_KEYS.SETTINGS, settings);
      console.log('ChromeStorageService: 已保存用户设置');
    } catch (error) {
      console.error('ChromeStorageService: 保存设置失败', error);
      throw new Error(`保存设置失败: ${error}`);
    }
  }

  /**
   * 加载用户设置
   * @returns 设置对象
   */
  public async loadSettings(): Promise<Settings> {
    try {
      const settings = await this.getStorageData<Settings>(STORAGE_KEYS.SETTINGS);
      console.log('ChromeStorageService: 已加载用户设置');
      return settings || DEFAULT_SETTINGS;
    } catch (error) {
      console.error('ChromeStorageService: 加载设置失败', error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * 更新部分设置
   * @param updates 要更新的设置字段
   */
  public async updateSettings(updates: Partial<Settings>): Promise<void> {
    try {
      const currentSettings = await this.loadSettings();
      const newSettings = this.deepMerge(currentSettings, updates);
      await this.saveSettings(newSettings);
    } catch (error) {
      console.error('ChromeStorageService: 更新设置失败', error);
      throw new Error(`更新设置失败: ${error}`);
    }
  }

  // ==================== 操作历史管理 ====================

  /**
   * 保存操作历史
   * @param operations 操作历史数组
   */
  public async saveOperations(operations: Operation[]): Promise<void> {
    try {
      // 只保留最近的100个操作记录，避免存储空间过大
      const limitedOperations = operations.slice(-100);
      await this.setStorageData(STORAGE_KEYS.OPERATIONS, limitedOperations);
      console.log(`ChromeStorageService: 已保存 ${limitedOperations.length} 个操作记录`);
    } catch (error) {
      console.error('ChromeStorageService: 保存操作历史失败', error);
      throw new Error(`保存操作历史失败: ${error}`);
    }
  }

  /**
   * 加载操作历史
   * @returns 操作历史数组
   */
  public async loadOperations(): Promise<Operation[]> {
    try {
      const operations = await this.getStorageData<Operation[]>(STORAGE_KEYS.OPERATIONS);
      console.log(`ChromeStorageService: 已加载 ${operations?.length || 0} 个操作记录`);
      return operations || [];
    } catch (error) {
      console.error('ChromeStorageService: 加载操作历史失败', error);
      return [];
    }
  }

  /**
   * 添加操作记录
   * @param operation 操作记录
   */
  public async addOperation(operation: Operation): Promise<void> {
    try {
      const operations = await this.loadOperations();
      operations.push(operation);
      await this.saveOperations(operations);
    } catch (error) {
      console.error('ChromeStorageService: 添加操作记录失败', error);
      throw new Error(`添加操作记录失败: ${error}`);
    }
  }

  // ==================== 批量数据操作 ====================

  /**
   * 获取所有存储数据
   * @returns 完整的存储数据对象
   */
  public async getAllData(): Promise<StorageData> {
    try {
      const [tabs, groups, settings, operations, version] = await Promise.all([
        this.loadTabs(),
        this.loadGroups(),
        this.loadSettings(),
        this.loadOperations(),
        this.getStorageData<string>(STORAGE_KEYS.VERSION),
      ]);

      return {
        tabs,
        groups,
        settings,
        operations,
        version: version || APP_VERSION,
        lastUpdated: Date.now(),
      };
    } catch (error) {
      console.error('ChromeStorageService: 获取所有数据失败', error);
      throw new Error(`获取所有数据失败: ${error}`);
    }
  }

  /**
   * 设置所有存储数据
   * @param data 完整的存储数据对象
   */
  public async setAllData(data: Partial<StorageData>): Promise<void> {
    try {
      const promises: Promise<void>[] = [];

      if (data.tabs) promises.push(this.saveTabs(data.tabs));
      if (data.groups) promises.push(this.saveGroups(data.groups));
      if (data.settings) promises.push(this.saveSettings(data.settings));
      if (data.operations) promises.push(this.saveOperations(data.operations));
      if (data.version) promises.push(this.setStorageData(STORAGE_KEYS.VERSION, data.version));

      await Promise.all(promises);
      console.log('ChromeStorageService: 已设置所有数据');
    } catch (error) {
      console.error('ChromeStorageService: 设置所有数据失败', error);
      throw new Error(`设置所有数据失败: ${error}`);
    }
  }

  /**
   * 清空所有数据
   */
  public async clearAllData(): Promise<void> {
    try {
      if (this.isChromeExtension()) {
        await chrome.storage.local.clear();
      } else {
        // 后备存储清理
        Object.values(STORAGE_KEYS).forEach(key => {
          localStorage.removeItem(key);
        });
      }
      console.log('ChromeStorageService: 已清空所有数据');
    } catch (error) {
      console.error('ChromeStorageService: 清空数据失败', error);
      throw new Error(`清空数据失败: ${error}`);
    }
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 检查是否在Chrome扩展环境中
   */
  private isChromeExtension(): boolean {
    return typeof chrome !== 'undefined' && 
           chrome.storage && 
           chrome.storage.local;
  }

  /**
   * 通用存储数据获取方法
   * @param key 存储键名
   * @returns 存储的数据
   */
  private async getStorageData<T>(key: string): Promise<T | null> {
    try {
      if (this.isChromeExtension()) {
        const result = await chrome.storage.local.get(key);
        return result[key] || null;
      } else {
        // 后备存储：使用localStorage
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      }
    } catch (error) {
      console.error(`ChromeStorageService: 获取数据失败 (${key})`, error);
      return null;
    }
  }

  /**
   * 通用存储数据设置方法
   * @param key 存储键名
   * @param value 要存储的数据
   */
  private async setStorageData<T>(key: string, value: T): Promise<void> {
    try {
      if (this.isChromeExtension()) {
        await chrome.storage.local.set({ [key]: value });
      } else {
        // 后备存储：使用localStorage
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error(`ChromeStorageService: 设置数据失败 (${key})`, error);
      throw error;
    }
  }

  /**
   * 检查并迁移数据版本
   */
  private async checkAndMigrateData(): Promise<void> {
    try {
      const currentVersion = await this.getStorageData<string>(STORAGE_KEYS.VERSION);
      
      if (!currentVersion) {
        // 首次安装，设置当前版本
        await this.setStorageData(STORAGE_KEYS.VERSION, APP_VERSION);
        console.log('ChromeStorageService: 首次安装，设置版本号');
        return;
      }

      if (currentVersion !== APP_VERSION) {
        console.log(`ChromeStorageService: 检测到版本更新 ${currentVersion} -> ${APP_VERSION}`);
        // 这里可以添加数据迁移逻辑
        await this.migrateData(currentVersion, APP_VERSION);
        await this.setStorageData(STORAGE_KEYS.VERSION, APP_VERSION);
      }
    } catch (error) {
      console.error('ChromeStorageService: 数据版本检查失败', error);
    }
  }

  /**
   * 数据迁移处理
   * @param fromVersion 源版本
   * @param toVersion 目标版本
   */
  private async migrateData(fromVersion: string, toVersion: string): Promise<void> {
    console.log(`ChromeStorageService: 执行数据迁移 ${fromVersion} -> ${toVersion}`);
    
    // 根据版本号执行相应的迁移逻辑
    // 这里可以添加具体的迁移代码
    
    // 示例：如果从1.7.x迁移到1.8.x
    if (fromVersion.startsWith('1.7') && toVersion.startsWith('1.8')) {
      // 执行1.7到1.8的迁移逻辑
      console.log('ChromeStorageService: 执行1.7到1.8的数据迁移');
    }
  }

  /**
   * 确保默认数据存在
   */
  private async ensureDefaultData(): Promise<void> {
    try {
      // 确保设置数据存在
      const settings = await this.getStorageData<Settings>(STORAGE_KEYS.SETTINGS);
      if (!settings) {
        await this.saveSettings(DEFAULT_SETTINGS);
        console.log('ChromeStorageService: 已设置默认用户设置');
      }

      // 确保其他默认数据存在
      const tabs = await this.getStorageData<Tab[]>(STORAGE_KEYS.TABS);
      if (!tabs) {
        await this.saveTabs([]);
      }

      const groups = await this.getStorageData<Group[]>(STORAGE_KEYS.GROUPS);
      if (!groups) {
        await this.saveGroups([]);
      }

      const operations = await this.getStorageData<Operation[]>(STORAGE_KEYS.OPERATIONS);
      if (!operations) {
        await this.saveOperations([]);
      }
    } catch (error) {
      console.error('ChromeStorageService: 设置默认数据失败', error);
    }
  }

  /**
   * 检查是否为开发模式
   * 通过检查环境变量、URL或其他标识来判断
   */
  private isDevelopmentMode(): boolean {
    // 检查是否在开发环境中（localhost或开发端口）
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const port = window.location.port;
      
      // 检查是否为本地开发环境
      if (hostname === 'localhost' || hostname === '127.0.0.1' || 
          port === '3000' || port === '5173' || port === '8080') {
        return true;
      }
    }
    
    // 检查Node.js环境变量
    if (typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV === 'development';
    }
    
    // 检查是否有开发模式标识
    if (typeof window !== 'undefined') {
      return window.location.search.includes('dev=true') || 
             window.location.search.includes('mock=true');
    }
    
    return false;
  }

  /**
   * 加载模拟数据（仅在开发模式下）
   * 如果存储中没有数据，则加载预设的模拟测试数据
   */
  private async loadMockDataIfNeeded(): Promise<void> {
    try {
      // 检查是否通过URL参数强制加载模拟数据
      const forceLoadMock = typeof window !== 'undefined' && 
                           window.location.search.includes('mock=true');
      
      if (forceLoadMock) {
        console.log('ChromeStorageService: 检测到URL参数mock=true，强制加载模拟数据...');
        await this.resetToMockData();
        return;
      }
      
      // 检查是否已有数据
      const existingTabs = await this.getStorageData<Tab[]>(STORAGE_KEYS.TABS);
      const existingGroups = await this.getStorageData<Group[]>(STORAGE_KEYS.GROUPS);
      
      // 如果没有数据或数据很少，加载模拟数据
      const shouldLoadMockData = (!existingTabs || existingTabs.length === 0) && 
                                (!existingGroups || existingGroups.length === 0);
      
      if (shouldLoadMockData) {
        console.log('ChromeStorageService: 加载模拟测试数据...');
        
        // 加载模拟数据
        await this.saveTabs(mockTabs);
        await this.saveGroups(mockGroups);
        
        // 设置默认设置
        const settings = await this.getStorageData<Settings>(STORAGE_KEYS.SETTINGS);
        if (!settings) {
          await this.saveSettings(DEFAULT_SETTINGS);
        }
        
        // 初始化空的操作历史
        await this.saveOperations([]);
        
        console.log(`ChromeStorageService: 已加载 ${mockTabs.length} 个模拟标签页和 ${mockGroups.length} 个模拟分组`);
      } else {
        console.log('ChromeStorageService: 检测到现有数据，跳过模拟数据加载');
        // 确保默认数据存在
        await this.ensureDefaultData();
      }
    } catch (error) {
      console.error('ChromeStorageService: 加载模拟数据失败', error);
      // 如果模拟数据加载失败，回退到默认数据
      await this.ensureDefaultData();
    }
  }

  /**
   * 重置为模拟数据（开发工具函数）
   * 强制重新加载模拟数据，用于开发和测试
   */
  public async resetToMockData(): Promise<void> {
    if (!this.isDevelopmentMode()) {
      console.warn('ChromeStorageService: resetToMockData 仅在开发模式下可用');
      return;
    }
    
    try {
      console.log('ChromeStorageService: 重置为模拟数据...');
      
      // 清空现有数据
      await this.saveTabs([]);
      await this.saveGroups([]);
      await this.saveOperations([]);
      
      // 加载模拟数据
      await this.saveTabs(mockTabs);
      await this.saveGroups(mockGroups);
      
      console.log(`ChromeStorageService: 已重置为模拟数据 - ${mockTabs.length} 个标签页，${mockGroups.length} 个分组`);
    } catch (error) {
      console.error('ChromeStorageService: 重置模拟数据失败', error);
      throw new Error(`重置模拟数据失败: ${error}`);
    }
  }

  /**
   * 深度合并对象
   * @param target 目标对象
   * @param source 源对象
   * @returns 合并后的对象
   */
  private deepMerge<T>(target: T, source: Partial<T>): T {
    const result = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const sourceValue = source[key];
        const targetValue = result[key];
        
        if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue) &&
            targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
          result[key] = this.deepMerge(targetValue, sourceValue);
        } else {
          result[key] = sourceValue as T[Extract<keyof T, string>];
        }
      }
    }
    
    return result;
  }
}

// ==================== 导出便捷函数 ====================

/**
 * 获取存储服务实例
 * 便捷函数，用于快速获取存储服务
 */
export const getStorageService = () => ChromeStorageService.getInstance();

/**
 * 初始化存储服务
 * 便捷函数，用于应用启动时初始化存储
 */
export const initializeStorage = async (): Promise<ChromeStorageService> => {
  const service = getStorageService();
  await service.initialize();
  return service;
};