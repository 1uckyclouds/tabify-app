/**
 * Tabify Chrome扩展 - Chrome服务桥接层
 * 
 * 本文件提供统一的Chrome API代理服务，实现：
 * - 环境自动检测（扩展环境 vs 本地模式）
 * - 非扩展环境统一使用 localStorage 回退
 * - 统一的数据访问接口
 * - 透明的API调用体验
 * 
 * 使用方式：
 * import ChromeService from './chrome-service';
 * const tabs = await ChromeService.getSavedTabs();
 */

import { Tab, Group, Settings, Operation } from './types';

// ==================== 消息类型定义 ====================

// 已移除PostMessage类型与枚举；非扩展环境统一走localStorage。

// ==================== Chrome服务类 ====================

/**
 * Chrome服务桥接类
 * 提供统一的Chrome API访问接口，自动处理环境检测和通信机制
 */
class ChromeService {
  private isInitialized = false;
  private isExtensionEnvironment = false;

  /**
   * 初始化Chrome服务
   * 检测环境并设置相应的通信机制
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // 检测当前环境
    this.isExtensionEnvironment = this.detectExtensionEnvironment();
    
    console.log('🚀 ChromeService: 初始化完成', {
      environment: this.isExtensionEnvironment ? 'Chrome扩展' : '本地模式',
      url: typeof window !== 'undefined' ? window.location.href : 'SSR环境',
      hasChrome: typeof chrome !== 'undefined',
      hasRuntimeId: typeof chrome !== 'undefined' && chrome.runtime && !!chrome.runtime.id
    });

    // 非扩展环境使用本地模式（localStorage）
    this.isInitialized = true;
  }

  // ==================== 公共API方法 ====================

  /**
   * 获取保存的标签页数据
   * @returns 标签页数组
   */
  public async getSavedTabs(): Promise<Tab[]> {
    console.log('📋 ChromeService: 获取保存的标签页');
    
    if (this.isExtensionEnvironment) {
      // 直接调用Chrome API
      try {
        const result = await chrome.storage.local.get('tabs');
        const tabs = result.tabs || [];
        console.log('✅ ChromeService: 从Chrome存储获取了', tabs.length, '个标签页');
        return tabs;
      } catch (error) {
        console.error('❌ ChromeService: Chrome存储访问失败', error);
        throw error;
      }
    } else {
      // 本地模式：使用localStorage
      try {
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem('tabs') : null;
        const tabs: Tab[] = raw ? JSON.parse(raw) : [];
        console.log('✅ ChromeService: 从localStorage获取了', tabs.length, '个标签页');
        return tabs;
      } catch (error) {
        console.warn('⚠️ ChromeService: localStorage读取失败，返回空', error);
        return [];
      }
    }
  }

  /**
   * 保存标签页数据
   * @param tabs 要保存的标签页数组
   */
  public async saveTabs(tabs: Tab[]): Promise<void> {
    console.log('💾 ChromeService: 保存', tabs.length, '个标签页');
    
    if (this.isExtensionEnvironment) {
      // 直接调用Chrome API
      try {
        await chrome.storage.local.set({ tabs });
        console.log('✅ ChromeService: 标签页已保存到Chrome存储');
      } catch (error) {
        console.error('❌ ChromeService: Chrome存储保存失败', error);
        throw error;
      }
    } else {
      // 本地模式：使用localStorage
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('tabs', JSON.stringify(tabs));
          console.log('✅ ChromeService: 标签页已保存到localStorage');
        }
      } catch (error) {
        console.warn('⚠️ ChromeService: 保存到localStorage失败', error);
      }
    }
  }

  /**
   * 获取保存的分组数据
   * @returns 分组数组
   */
  public async getSavedGroups(): Promise<Group[]> {
    console.log('📁 ChromeService: 获取保存的分组');
    
    if (this.isExtensionEnvironment) {
      // 直接调用Chrome API
      try {
        const result = await chrome.storage.local.get('groups');
        const groups = result.groups || [];
        console.log('✅ ChromeService: 从Chrome存储获取了', groups.length, '个分组');
        return groups;
      } catch (error) {
        console.error('❌ ChromeService: Chrome存储访问失败', error);
        throw error;
      }
    } else {
      // 本地模式：使用localStorage
      try {
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem('groups') : null;
        const groups: Group[] = raw ? JSON.parse(raw) : [];
        console.log('✅ ChromeService: 从localStorage获取了', groups.length, '个分组');
        return groups;
      } catch (error) {
        console.warn('⚠️ ChromeService: localStorage读取失败，返回空', error);
        return [];
      }
    }
  }

  /**
   * 保存分组数据
   * @param groups 要保存的分组数组
   */
  public async saveGroups(groups: Group[]): Promise<void> {
    console.log('💾 ChromeService: 保存', groups.length, '个分组');
    
    if (this.isExtensionEnvironment) {
      // 直接调用Chrome API
      try {
        await chrome.storage.local.set({ groups });
        console.log('✅ ChromeService: 分组已保存到Chrome存储');
      } catch (error) {
        console.error('❌ ChromeService: Chrome存储保存失败', error);
        throw error;
      }
    } else {
      // 本地模式：使用localStorage
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('groups', JSON.stringify(groups));
          console.log('✅ ChromeService: 分组已保存到localStorage');
        }
      } catch (error) {
        console.warn('⚠️ ChromeService: 保存分组到localStorage失败', error);
      }
    }
  }

  /**
   * 获取用户设置
   * @returns 设置对象
   */
  public async getSettings(): Promise<Settings> {
    console.log('⚙️ ChromeService: 获取用户设置');
    
    if (this.isExtensionEnvironment) {
      // 直接调用Chrome API
      try {
        const result = await chrome.storage.local.get('settings');
        const settings = result.settings || {};
        console.log('✅ ChromeService: 从Chrome存储获取了用户设置');
        return settings;
      } catch (error) {
        console.error('❌ ChromeService: Chrome存储访问失败', error);
        throw error;
      }
    } else {
      // 本地模式：使用localStorage
      try {
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem('settings') : null;
        const settings: Settings = raw ? JSON.parse(raw) : {};
        console.log('✅ ChromeService: 从localStorage获取了用户设置');
        return settings;
      } catch (error) {
        console.warn('⚠️ ChromeService: localStorage读取设置失败，返回空对象', error);
        return {} as Settings;
      }
    }
  }

  /**
   * 保存用户设置
   * @param settings 要保存的设置对象
   */
  public async saveSettings(settings: Settings): Promise<void> {
    console.log('💾 ChromeService: 保存用户设置');
    
    if (this.isExtensionEnvironment) {
      // 直接调用Chrome API
      try {
        await chrome.storage.local.set({ settings });
        console.log('✅ ChromeService: 设置已保存到Chrome存储');
      } catch (error) {
        console.error('❌ ChromeService: Chrome存储保存失败', error);
        throw error;
      }
    } else {
      // 本地模式：使用localStorage
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('settings', JSON.stringify(settings));
          console.log('✅ ChromeService: 设置已保存到localStorage');
        }
      } catch (error) {
        console.warn('⚠️ ChromeService: 保存设置到localStorage失败', error);
      }
    }
  }

  /**
   * 获取所有数据
   * @returns 包含所有数据的对象
   */
  public async getAllData(): Promise<{ tabs: Tab[]; groups: Group[]; settings: Settings }> {
    console.log('📦 ChromeService: 获取所有数据');
    
    if (this.isExtensionEnvironment) {
      // 直接调用Chrome API
      try {
        console.log('🔍 ChromeService: 准备访问Chrome存储...');
        
        // 检查Chrome API是否可用
        if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
          throw new Error('Chrome存储API不可用');
        }
        
        console.log('🔍 ChromeService: Chrome存储API可用，开始获取数据...');
        const result = await chrome.storage.local.get(['tabs', 'groups', 'settings']);
        
        const data = {
          tabs: result.tabs || [],
          groups: result.groups || [],
          settings: result.settings || {}
        };
        console.log('✅ ChromeService: 从Chrome存储获取了所有数据', {
          tabs: data.tabs.length,
          groups: data.groups.length,
          hasSettings: Object.keys(data.settings).length > 0
        });
        return data;
      } catch (error) {
        console.error('❌ ChromeService: Chrome存储访问失败', {
          error: error,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          chromeAvailable: typeof chrome !== 'undefined',
          storageAvailable: typeof chrome !== 'undefined' && !!chrome.storage,
          localStorageAvailable: typeof chrome !== 'undefined' && !!chrome.storage?.local
        });
        
        // 返回空数据而不是抛出错误，让应用能够继续运行
        console.log('🔧 ChromeService: 返回空数据以确保应用继续运行');
        return {
          tabs: [],
          groups: [],
          settings: {}
        };
      }
    } else {
      // 本地模式：使用localStorage聚合
      try {
        const rawTabs = typeof window !== 'undefined' ? window.localStorage.getItem('tabs') : null;
        const rawGroups = typeof window !== 'undefined' ? window.localStorage.getItem('groups') : null;
        const rawSettings = typeof window !== 'undefined' ? window.localStorage.getItem('settings') : null;
        const data = {
          tabs: rawTabs ? JSON.parse(rawTabs) : [],
          groups: rawGroups ? JSON.parse(rawGroups) : [],
          settings: rawSettings ? JSON.parse(rawSettings) : {}
        };
        console.log('✅ ChromeService: 从localStorage聚合所有数据', {
          tabs: data.tabs.length,
          groups: data.groups.length,
          hasSettings: Object.keys(data.settings).length > 0
        });
        return data;
      } catch (error) {
        console.warn('⚠️ ChromeService: localStorage聚合失败，返回空对象', error);
        return { tabs: [], groups: [], settings: {} };
      }
    }
  }

  /**
   * 同步数据
   * @param tabs 标签页数据
   * @param groups 分组数据
   */
  public async syncData(tabs: Tab[], groups: Group[]): Promise<void> {
    console.log('🔄 ChromeService: 同步数据', { tabs: tabs.length, groups: groups.length });
    
    if (this.isExtensionEnvironment) {
      // 直接调用Chrome API
      try {
        await chrome.storage.local.set({ tabs, groups });
        console.log('✅ ChromeService: 数据已同步到Chrome存储');
      } catch (error) {
        console.error('❌ ChromeService: Chrome存储同步失败', error);
        throw error;
      }
    } else {
      // 本地模式：使用localStorage保存
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('tabs', JSON.stringify(tabs));
          window.localStorage.setItem('groups', JSON.stringify(groups));
          console.log('✅ ChromeService: 数据已同步到localStorage');
        }
      } catch (error) {
        console.warn('⚠️ ChromeService: 同步到localStorage失败', error);
      }
    }
  }

  /**
   * 收纳当前标签页
   * @returns 收纳的标签页信息
   */
  public async collectCurrentTab(): Promise<Tab | null> {
    console.log('📥 ChromeService: 收纳当前标签页');
    
    if (this.isExtensionEnvironment) {
      // 在扩展环境中，需要通过后台脚本处理
      // 这里暂时返回null，实际实现需要与后台脚本通信
      console.warn('⚠️ ChromeService: 扩展环境中的标签页收纳需要后台脚本支持');
      return null;
    } else {
      // 本地模式：无法收纳浏览器标签页，返回空
      console.warn('⚠️ ChromeService: 本地模式下无法收纳当前标签页');
      return null;
    }
  }

  /**
   * 收纳所有标签页
   * @returns 收纳的标签页数组
   */
  public async collectAllTabs(): Promise<Tab[]> {
    console.log('📥 ChromeService: 收纳所有标签页');
    
    if (this.isExtensionEnvironment) {
      // 在扩展环境中，需要通过后台脚本处理
      console.warn('⚠️ ChromeService: 扩展环境中的标签页收纳需要后台脚本支持');
      return [];
    } else {
      // 本地模式：无法收纳所有标签页，返回空数组
      console.warn('⚠️ ChromeService: 本地模式下无法收纳所有标签页');
      return [];
    }
  }

  /**
   * 恢复标签页
   * @param tab 要恢复的标签页
   * @param active 是否激活标签页
   */
  public async restoreTab(tab: Tab, active: boolean = true): Promise<void> {
    console.log('🔄 ChromeService: 恢复标签页', tab.title);
    
    if (this.isExtensionEnvironment) {
      // 在扩展环境中，可以直接创建标签页
      try {
        await chrome.tabs.create({ url: tab.url, active });
        console.log('✅ ChromeService: 标签页已恢复');
      } catch (error) {
        console.error('❌ ChromeService: 标签页恢复失败', error);
        // 降级到window.open
        window.open(tab.url, '_blank');
      }
    } else {
      // 本地模式：直接window.open
      window.open(tab.url, '_blank');
    }
  }

  /**
   * 批量恢复标签页
   * @param tabs 要恢复的标签页数组
   * @param activeLast 是否激活最后一个标签页
   */
  public async restoreTabs(tabs: Tab[], activeLast: boolean = true): Promise<void> {
    console.log('🔄 ChromeService: 批量恢复', tabs.length, '个标签页');
    
    if (this.isExtensionEnvironment) {
      // 在扩展环境中，可以直接创建标签页
      try {
        for (let i = 0; i < tabs.length; i++) {
          const tab = tabs[i];
          const active = activeLast && i === tabs.length - 1;
          await chrome.tabs.create({ url: tab.url, active });
        }
        console.log('✅ ChromeService: 所有标签页已恢复');
      } catch (error) {
        console.error('❌ ChromeService: 批量恢复失败', error);
        // 降级到window.open
        tabs.forEach((tab, index) => {
          setTimeout(() => window.open(tab.url, '_blank'), index * 100);
        });
      }
    } else {
      // 本地模式：直接window.open队列
      tabs.forEach((tab, index) => {
        setTimeout(() => window.open(tab.url, '_blank'), index * 100);
      });
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 检测扩展环境
   * 使用可靠的方法检查是否在Chrome扩展环境中
   */
  private detectExtensionEnvironment(): boolean {
    try {
      // 基础检测：Chrome API是否存在
      if (typeof chrome === 'undefined' || !chrome.runtime) {
        console.log('🔍 ChromeService: Chrome API不存在或不完整');
        return false;
      }
      
      // 检查关键的Chrome API方法是否存在
      const hasRequiredAPIs = chrome.storage && 
                             chrome.storage.local && 
                             typeof chrome.storage.local.get === 'function' && 
                             typeof chrome.storage.local.set === 'function';
      
      if (!hasRequiredAPIs) {
        console.log('🔍 ChromeService: Chrome Storage API不完整');
        return false;
      }
      
      // 在测试环境中，chrome.runtime.id可能为null，但仍然可以使用Chrome API
      // 所以我们主要检查API的可用性而不是扩展ID
      console.log('🔍 ChromeService: 检测到Chrome扩展环境', {
        extensionId: chrome.runtime.id || 'test-environment',
        currentUrl: typeof window !== 'undefined' ? window.location.href : 'SSR环境',
        hasStorageAPI: hasRequiredAPIs
      });
      
      return true;
    } catch (error) {
      console.error('🔍 ChromeService: 环境检测异常', error);
      return false;
    }
  }

  /**
   * 设置PostMessage监听器
   * 用于接收来自父页面的响应消息
   */
  // 已移除PostMessage监听与通信方法；非扩展环境下统一走localStorage回退。

}

// ==================== 导出单例实例 ====================

/**
 * Chrome服务单例实例
 * 提供统一的Chrome API访问接口
 */
const chromeService = new ChromeService();

// 客户端自动初始化
if (typeof window !== 'undefined') {
  chromeService.initialize().catch(error => {
    console.error('ChromeService: 自动初始化失败', error);
  });
}

export default chromeService;