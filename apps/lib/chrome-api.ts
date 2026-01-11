/**
 * Tabify Chrome插件 - Chrome API服务封装
 * 
 * 本文件提供了Chrome扩展API的封装服务，实现：
 * - 标签页的获取、创建、关闭、更新操作
 * - 窗口管理功能
 * - 网站图标获取
 * - 权限检查和错误处理
 * - 批量操作优化
 * 
 * 封装Chrome Tabs API、Windows API等，提供类型安全的接口，
 * 并处理Chrome扩展环境的特殊情况。
 */

import { Tab, ChromeTabInfo } from './types';

// 条件日志：仅在开发环境输出
const isDev = process.env.NODE_ENV === "development";
const debugWarn = isDev ? console.warn : () => {};

// 默认标签页图标：当Chrome未提供favIconUrl时使用，避免主动请求/favicon.ico导致404错误
const DEFAULT_FAVICON = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><text y="20" font-size="20">🌐</text></svg>';


// ==================== Chrome API服务类 ====================

/**
 * Chrome API服务
 * 封装Chrome扩展API，提供标签页和窗口管理功能
 */
export class ChromeAPIService {
  private static instance: ChromeAPIService;
  private isInitialized = false;

  /**
   * 获取Chrome API服务单例实例
   */
  public static getInstance(): ChromeAPIService {
    if (!ChromeAPIService.instance) {
      ChromeAPIService.instance = new ChromeAPIService();
    }
    return ChromeAPIService.instance;
  }

  /**
   * 私有构造函数
   */
  private constructor() {}

  /**
   * 初始化Chrome API服务
   * 检查Chrome扩展环境和权限
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // 检查Chrome扩展环境
      if (!this.isChromeExtension()) {
        console.warn('ChromeAPIService: 非Chrome扩展环境，部分功能将不可用');
        this.isInitialized = true;
        return;
      }

      // 检查必要权限
      await this.checkPermissions();

      this.isInitialized = true;
      console.log('ChromeAPIService: 初始化完成');
    } catch (error) {
      console.error('ChromeAPIService: 初始化失败', error);
      throw new Error(`Chrome API服务初始化失败: ${error}`);
    }
  }

  // ==================== 标签页操作 ====================

  /**
   * 获取所有标签页
   * @param includeIncognito 是否包含隐私模式标签页
   * @returns Chrome标签页信息数组
   */
  public async getAllTabs(includeIncognito: boolean = false): Promise<ChromeTabInfo[]> {
    if (!this.isChromeExtension()) {
      console.warn('ChromeAPIService: 非Chrome扩展环境，返回模拟数据');
      return this.getMockTabs();
    }

    try {
      const tabs = await chrome.tabs.query({});
      const filteredTabs = includeIncognito ? tabs : tabs.filter(tab => !tab.incognito);
      
      const chromeTabInfos: ChromeTabInfo[] = filteredTabs.map(tab => ({
        chromeId: tab.id!,
        title: tab.title || '无标题',
        url: tab.url || '',
        favIconUrl: tab.favIconUrl,
        active: tab.active,
        pinned: tab.pinned,
        windowId: tab.windowId,
        index: tab.index,
      }));

      console.log(`ChromeAPIService: 获取到 ${chromeTabInfos.length} 个标签页`);
      return chromeTabInfos;
    } catch (error) {
      console.error('ChromeAPIService: 获取标签页失败', error);
      throw new Error(`获取标签页失败: ${error}`);
    }
  }

  /**
   * 获取当前活跃标签页
   * @returns 当前活跃的标签页信息
   */
  public async getCurrentTab(): Promise<ChromeTabInfo | null> {
    if (!this.isChromeExtension()) {
      console.warn('ChromeAPIService: 非Chrome扩展环境，返回null');
      return null;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        return null;
      }

      return {
        chromeId: tab.id!,
        title: tab.title || '无标题',
        url: tab.url || '',
        favIconUrl: tab.favIconUrl,
        active: tab.active,
        pinned: tab.pinned,
        windowId: tab.windowId,
        index: tab.index,
      };
    } catch (error) {
      console.error('ChromeAPIService: 获取当前标签页失败', error);
      return null;
    }
  }

  /**
   * 创建新标签页
   * @param url 要打开的URL
   * @param active 是否激活新标签页
   * @param windowId 指定窗口ID，可选
   * @returns 新创建的标签页信息
   */
  public async createTab(url: string, active: boolean = true, windowId?: number): Promise<ChromeTabInfo | null> {
    if (!this.isChromeExtension()) {
      console.warn('ChromeAPIService: 非Chrome扩展环境，使用window.open');
      window.open(url, '_blank');
      return null;
    }

    try {
      const createProperties: chrome.tabs.CreateProperties = {
        url,
        active,
      };

      if (windowId) {
        createProperties.windowId = windowId;
      }

      const tab = await chrome.tabs.create(createProperties);
      
      return {
        chromeId: tab.id!,
        title: tab.title || '加载中...',
        url: tab.url || url,
        favIconUrl: tab.favIconUrl,
        active: tab.active,
        pinned: tab.pinned,
        windowId: tab.windowId,
        index: tab.index,
      };
    } catch (error) {
      console.error('ChromeAPIService: 创建标签页失败', error);
      throw new Error(`创建标签页失败: ${error}`);
    }
  }

  /**
   * 关闭标签页
   * @param tabIds Chrome标签页ID数组
   */
  public async closeTabs(tabIds: number[]): Promise<void> {
    if (!this.isChromeExtension()) {
      console.warn('ChromeAPIService: 非Chrome扩展环境，无法关闭标签页');
      return;
    }

    try {
      await chrome.tabs.remove(tabIds);
      console.log(`ChromeAPIService: 已关闭 ${tabIds.length} 个标签页`);
    } catch (error) {
      console.error('ChromeAPIService: 关闭标签页失败', error);
      throw new Error(`关闭标签页失败: ${error}`);
    }
  }

  /**
   * 更新标签页
   * @param tabId Chrome标签页ID
   * @param updateProperties 要更新的属性
   */
  public async updateTab(tabId: number, updateProperties: chrome.tabs.UpdateProperties): Promise<ChromeTabInfo | null> {
    if (!this.isChromeExtension()) {
      console.warn('ChromeAPIService: 非Chrome扩展环境，无法更新标签页');
      return null;
    }

    try {
      const tab = await chrome.tabs.update(tabId, updateProperties);
      
      return {
        chromeId: tab.id!,
        title: tab.title || '无标题',
        url: tab.url || '',
        favIconUrl: tab.favIconUrl,
        active: tab.active,
        pinned: tab.pinned,
        windowId: tab.windowId,
        index: tab.index,
      };
    } catch (error) {
      console.error('ChromeAPIService: 更新标签页失败', error);
      throw new Error(`更新标签页失败: ${error}`);
    }
  }

  /**
   * 激活标签页
   * @param tabId Chrome标签页ID
   */
  public async activateTab(tabId: number): Promise<void> {
    if (!this.isChromeExtension()) {
      console.warn('ChromeAPIService: 非Chrome扩展环境，无法激活标签页');
      return;
    }

    try {
      await chrome.tabs.update(tabId, { active: true });
      console.log(`ChromeAPIService: 已激活标签页 ${tabId}`);
    } catch (error) {
      console.error('ChromeAPIService: 激活标签页失败', error);
      throw new Error(`激活标签页失败: ${error}`);
    }
  }

  /**
   * 移动标签页到指定位置
   * @param tabId Chrome标签页ID
   * @param moveProperties 移动属性
   */
  public async moveTab(tabId: number, moveProperties: chrome.tabs.MoveProperties): Promise<ChromeTabInfo | null> {
    if (!this.isChromeExtension()) {
      console.warn('ChromeAPIService: 非Chrome扩展环境，无法移动标签页');
      return null;
    }

    try {
      const tab = await chrome.tabs.move(tabId, moveProperties);
      const movedTab = Array.isArray(tab) ? tab[0] : tab;
      
      return {
        chromeId: movedTab.id!,
        title: movedTab.title || '无标题',
        url: movedTab.url || '',
        favIconUrl: movedTab.favIconUrl,
        active: movedTab.active,
        pinned: movedTab.pinned,
        windowId: movedTab.windowId,
        index: movedTab.index,
      };
    } catch (error) {
      console.error('ChromeAPIService: 移动标签页失败', error);
      throw new Error(`移动标签页失败: ${error}`);
    }
  }

  // ==================== 批量操作 ====================

  /**
   * 批量创建标签页
   * @param urls URL数组
   * @param active 是否激活最后一个标签页
   * @returns 创建的标签页信息数组
   */
  public async createMultipleTabs(urls: string[], active: boolean = false): Promise<ChromeTabInfo[]> {
    if (!this.isChromeExtension()) {
      console.warn('ChromeAPIService: 非Chrome扩展环境，使用window.open批量打开');
      urls.forEach(url => window.open(url, '_blank'));
      return [];
    }

    try {
      const createdTabs: ChromeTabInfo[] = [];
      
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const shouldActivate = active && i === urls.length - 1; // 只激活最后一个
        
        const tab = await this.createTab(url, shouldActivate);
        if (tab) {
          createdTabs.push(tab);
        }
        
        // 添加小延迟，避免过快创建导致浏览器卡顿
        if (i < urls.length - 1) {
          await this.delay(100);
        }
      }
      
      console.log(`ChromeAPIService: 批量创建了 ${createdTabs.length} 个标签页`);
      return createdTabs;
    } catch (error) {
      console.error('ChromeAPIService: 批量创建标签页失败', error);
      throw new Error(`批量创建标签页失败: ${error}`);
    }
  }

  /**
   * 批量关闭标签页（分批处理，避免浏览器卡顿）
   * @param tabIds Chrome标签页ID数组
   * @param batchSize 每批处理的数量
   */
  public async closeBatchTabs(tabIds: number[], batchSize: number = 10): Promise<void> {
    if (!this.isChromeExtension()) {
      console.warn('ChromeAPIService: 非Chrome扩展环境，无法批量关闭标签页');
      return;
    }

    try {
      const batches = this.chunkArray(tabIds, batchSize);
      
      for (const batch of batches) {
        await this.closeTabs(batch);
        // 添加小延迟，避免过快操作
        if (batches.indexOf(batch) < batches.length - 1) {
          await this.delay(200);
        }
      }
      
      console.log(`ChromeAPIService: 批量关闭了 ${tabIds.length} 个标签页`);
    } catch (error) {
      console.error('ChromeAPIService: 批量关闭标签页失败', error);
      throw new Error(`批量关闭标签页失败: ${error}`);
    }
  }

  // ==================== 窗口操作 ====================

  /**
   * 获取所有窗口
   * @returns 窗口信息数组
   */
  public async getAllWindows(): Promise<chrome.windows.Window[]> {
    if (!this.isChromeExtension()) {
      console.warn('ChromeAPIService: 非Chrome扩展环境，返回空数组');
      return [];
    }

    try {
      const windows = await chrome.windows.getAll({ populate: true });
      console.log(`ChromeAPIService: 获取到 ${windows.length} 个窗口`);
      return windows;
    } catch (error) {
      console.error('ChromeAPIService: 获取窗口失败', error);
      return [];
    }
  }

  /**
   * 获取当前窗口
   * @returns 当前窗口信息
   */
  public async getCurrentWindow(): Promise<chrome.windows.Window | null> {
    if (!this.isChromeExtension()) {
      console.warn('ChromeAPIService: 非Chrome扩展环境，返回null');
      return null;
    }

    try {
      const window = await chrome.windows.getCurrent({ populate: true });
      return window;
    } catch (error) {
      console.error('ChromeAPIService: 获取当前窗口失败', error);
      return null;
    }
  }

  // ==================== 工具方法 ====================

  /**
   * 获取网站图标URL
   * @param url 网站URL
   * @returns 图标URL
   */
  public getFaviconUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`;
    } catch (error) {
      debugWarn('ChromeAPIService: 无效URL，无法获取favicon', url);
      return '';
    }
  }

  /**
   * 从Chrome标签页信息转换为应用标签页格式
   * @param chromeTab Chrome标签页信息
   * @returns 应用标签页对象
   */
  public chromeTabToAppTab(chromeTab: ChromeTabInfo): Tab {
    return {
      id: `chrome_${chromeTab.chromeId}`,
      title: chromeTab.title,
      url: chromeTab.url,
      favicon: chromeTab.favIconUrl || DEFAULT_FAVICON,
      createdTime: Date.now(),
      lastAccessTime: chromeTab.active ? Date.now() : undefined,
      isActive: chromeTab.active,
      isPinned: chromeTab.pinned,
    };
  }

  /**
   * 批量转换Chrome标签页为应用标签页
   * @param chromeTabs Chrome标签页数组
   * @returns 应用标签页数组
   */
  public chromeTabsToAppTabs(chromeTabs: ChromeTabInfo[]): Tab[] {
    return chromeTabs.map(chromeTab => this.chromeTabToAppTab(chromeTab));
  }

  /**
   * 检查标签页是否存在
   * @param tabId Chrome标签页ID
   * @returns 是否存在
   */
  public async tabExists(tabId: number): Promise<boolean> {
    if (!this.isChromeExtension()) {
      return false;
    }

    try {
      await chrome.tabs.get(tabId);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取标签页截图（需要activeTab权限）
   * @param tabId Chrome标签页ID
   * @returns 截图数据URL
   */
  public async captureTab(tabId: number): Promise<string | null> {
    if (!this.isChromeExtension()) {
      console.warn('ChromeAPIService: 非Chrome扩展环境，无法截图');
      return null;
    }

    try {
      // 首先激活标签页
      await this.activateTab(tabId);
      
      // 等待一小段时间确保标签页完全加载
      await this.delay(500);
      
      // 截图
      const dataUrl = await chrome.tabs.captureVisibleTab();
      return dataUrl;
    } catch (error) {
      console.error('ChromeAPIService: 截图失败', error);
      return null;
    }
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 检查是否在Chrome扩展环境中
   */
  private isChromeExtension(): boolean {
    return typeof chrome !== 'undefined' && 
           chrome.tabs && 
           chrome.windows;
  }

  /**
   * 检查必要权限
   */
  private async checkPermissions(): Promise<void> {
    try {
      const permissions = await chrome.permissions.getAll();
      const requiredPermissions = ['tabs', 'activeTab'];
      
      const missingPermissions = requiredPermissions.filter(
        permission => !permissions.permissions?.includes(permission)
      );
      
      if (missingPermissions.length > 0) {
        console.warn('ChromeAPIService: 缺少权限', missingPermissions);
        // 可以在这里请求权限或提示用户
      }
    } catch (error) {
      console.warn('ChromeAPIService: 权限检查失败', error);
    }
  }

  /**
   * 延迟函数
   * @param ms 延迟毫秒数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 数组分块
   * @param array 要分块的数组
   * @param size 每块大小
   * @returns 分块后的数组
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * 获取模拟标签页数据（用于非Chrome扩展环境）
   */
  private getMockTabs(): ChromeTabInfo[] {
    return [
      {
        chromeId: 1,
        title: '示例标签页 1',
        url: 'https://example.com',
        favIconUrl: 'https://example.com/favicon.ico',
        active: true,
        pinned: false,
        windowId: 1,
        index: 0,
      },
      {
        chromeId: 2,
        title: '示例标签页 2',
        url: 'https://github.com',
        favIconUrl: 'https://github.com/favicon.ico',
        active: false,
        pinned: false,
        windowId: 1,
        index: 1,
      },
      {
        chromeId: 3,
        title: '示例标签页 3',
        url: 'https://stackoverflow.com',
        favIconUrl: 'https://stackoverflow.com/favicon.ico',
        active: false,
        pinned: true,
        windowId: 1,
        index: 2,
      },
    ];
  }
}

// ==================== 导出便捷函数 ====================

/**
 * 获取Chrome API服务实例
 */
export const getChromeAPIService = () => ChromeAPIService.getInstance();

/**
 * 初始化Chrome API服务
 */
export const initializeChromeAPI = async (): Promise<ChromeAPIService> => {
  const service = getChromeAPIService();
  await service.initialize();
  return service;
};

/**
 * 快速获取所有标签页并转换为应用格式
 */
export const getAllAppTabs = async (): Promise<Tab[]> => {
  const service = getChromeAPIService();
  const chromeTabs = await service.getAllTabs();
  return service.chromeTabsToAppTabs(chromeTabs);
};

/**
 * 快速收纳当前标签页
 */
export const collectCurrentTab = async (): Promise<Tab | null> => {
  const service = getChromeAPIService();
  const currentTab = await service.getCurrentTab();
  
  if (!currentTab) {
    return null;
  }
  
  // 关闭当前标签页
  await service.closeTabs([currentTab.chromeId]);
  
  // 转换为应用标签页格式
  return service.chromeTabToAppTab(currentTab);
};

/**
 * 快速收纳所有标签页
 */
export const collectAllTabs = async (): Promise<Tab[]> => {
  const service = getChromeAPIService();
  const allTabs = await service.getAllTabs();
  
  // 过滤掉固定的标签页
  const tabsToClose = allTabs.filter(tab => !tab.pinned);
  
  if (tabsToClose.length === 0) {
    return [];
  }
  
  // 批量关闭标签页
  const tabIds = tabsToClose.map(tab => tab.chromeId);
  await service.closeBatchTabs(tabIds);
  
  // 转换为应用标签页格式
  return service.chromeTabsToAppTabs(tabsToClose);
};