/**
 * Tabify Chrome插件 - 数据同步服务
 * 
 * 本文件提供统一的数据同步服务，实现：
 * - Chrome扩展与React应用之间的数据同步
 * - 实时数据变更监听和通知
 * - 冲突检测和解决机制
 * - 数据一致性保证
 * - 离线数据缓存和恢复
 * 
 * 确保无论在Chrome扩展环境还是独立Web应用中，
 * 数据都能保持一致和同步。
 */

import { Tab, Group } from './types';
import { getStorageService } from './storage';
import { getExtensionBridge, isChromeExtensionEnvironment } from './extension-bridge';

// ==================== 同步事件类型定义 ====================

/**
 * 数据同步事件类型
 */
export interface SyncEvent {
  type: 'tabs' | 'groups' | 'settings' | 'operations' | 'full';
  action: 'add' | 'update' | 'delete' | 'sync' | 'conflict';
  data: any;
  timestamp: number;
  source: 'extension' | 'manager' | 'popup' | 'system';
}

/**
 * 数据冲突信息
 */
export interface DataConflict {
  type: 'tabs' | 'groups' | 'settings';
  localData: any;
  remoteData: any;
  timestamp: number;
  resolution?: 'local' | 'remote' | 'merge';
}

/**
 * 同步状态
 */
export interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: number;
  pendingChanges: number;
  conflicts: DataConflict[];
  syncInProgress: boolean;
}

// ==================== 数据同步服务类 ====================

/**
 * 数据同步服务
 * 管理Chrome扩展与React应用之间的数据同步
 */
export class SyncService {
  private static instance: SyncService;
  private isInitialized = false;
  private syncListeners: Map<string, ((data: any) => void)[]> = new Map();
  private syncStatus: SyncStatus = {
    isOnline: false,
    lastSyncTime: 0,
    pendingChanges: 0,
    conflicts: [],
    syncInProgress: false
  };
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL = 5000; // 5秒同步间隔
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private pendingOperations: Map<string, { operation: () => Promise<void>; retryCount: number }> = new Map();

  /**
   * 获取同步服务单例实例
   */
  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  /**
   * 私有构造函数
   */
  private constructor() {}

  /**
   * 初始化同步服务
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // 检查环境并设置同步状态
      this.syncStatus.isOnline = isChromeExtensionEnvironment();
      
      if (this.syncStatus.isOnline) {
        // 在Chrome扩展环境中设置数据变更监听
        this.setupExtensionDataListener();
        console.log('SyncService: Chrome扩展环境 - 数据监听器已设置');
      } else {
        console.log('SyncService: 独立Web应用环境 - 仅本地同步');
      }

      // 启动定期同步
      this.startPeriodicSync();

      this.isInitialized = true;
      console.log('SyncService: 初始化完成');
    } catch (error) {
      console.error('SyncService: 初始化失败', error);
      throw new Error(`同步服务初始化失败: ${error}`);
    }
  }

  /**
   * 销毁同步服务
   */
  public destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.syncListeners.clear();
    this.pendingOperations.clear();
    this.isInitialized = false;
    console.log('SyncService: 已销毁');
  }

  // ==================== 数据同步方法 ====================

  /**
   * 同步标签页数据
   * @param tabs 标签页数组
   * @param source 数据源
   */
  public async syncTabs(tabs: Tab[], source: string = 'manager'): Promise<void> {
    if (this.syncStatus.syncInProgress) {
      console.warn('SyncService: 同步正在进行中，跳过此次同步');
      return;
    }

    try {
      this.syncStatus.syncInProgress = true;
      
      if (this.syncStatus.isOnline) {
        // Chrome扩展环境：通过扩展桥梁同步
        const bridge = getExtensionBridge();
        await bridge.setStorageData({ tabs });
      } else {
        // 独立Web应用：使用本地存储
        const storageService = getStorageService();
        await storageService.saveTabs(tabs);
      }

      // 触发同步事件
      this.emitSyncEvent({
        type: 'tabs',
        action: 'sync',
        data: tabs,
        timestamp: Date.now(),
        source: source as any
      });

      this.syncStatus.lastSyncTime = Date.now();
      console.log(`SyncService: 标签页数据同步完成 (${tabs.length} 个标签页)`);
    } catch (error) {
      console.error('SyncService: 标签页同步失败', error);
      await this.handleSyncError('syncTabs', () => this.syncTabs(tabs, source));
      throw error;
    } finally {
      this.syncStatus.syncInProgress = false;
    }
  }

  /**
   * 同步分组数据
   * @param groups 分组数组
   * @param source 数据源
   */
  public async syncGroups(groups: Group[], source: string = 'manager'): Promise<void> {
    if (this.syncStatus.syncInProgress) {
      console.warn('SyncService: 同步正在进行中，跳过此次同步');
      return;
    }

    try {
      this.syncStatus.syncInProgress = true;
      
      if (this.syncStatus.isOnline) {
        // Chrome扩展环境：通过扩展桥梁同步
        const bridge = getExtensionBridge();
        await bridge.setStorageData({ groups });
      } else {
        // 独立Web应用：使用本地存储
        const storageService = getStorageService();
        await storageService.saveGroups(groups);
      }

      // 触发同步事件
      this.emitSyncEvent({
        type: 'groups',
        action: 'sync',
        data: groups,
        timestamp: Date.now(),
        source: source as any
      });

      this.syncStatus.lastSyncTime = Date.now();
      console.log(`SyncService: 分组数据同步完成 (${groups.length} 个分组)`);
    } catch (error) {
      console.error('SyncService: 分组同步失败', error);
      await this.handleSyncError('syncGroups', () => this.syncGroups(groups, source));
      throw error;
    } finally {
      this.syncStatus.syncInProgress = false;
    }
  }

  /**
   * 全量数据同步
   * @param tabs 标签页数组
   * @param groups 分组数组
   * @param source 数据源
   */
  public async syncAll(tabs: Tab[], groups: Group[], source: string = 'manager'): Promise<void> {
    if (this.syncStatus.syncInProgress) {
      console.warn('SyncService: 同步正在进行中，跳过此次同步');
      return;
    }

    try {
      this.syncStatus.syncInProgress = true;
      
      if (this.syncStatus.isOnline) {
        // Chrome扩展环境：通过扩展桥梁批量同步
        const bridge = getExtensionBridge();
        await bridge.syncData(tabs, groups);
      } else {
        // 独立Web应用：使用本地存储批量保存
        const storageService = getStorageService();
        await Promise.all([
          storageService.saveTabs(tabs),
          storageService.saveGroups(groups)
        ]);
      }

      // 触发全量同步事件
      this.emitSyncEvent({
        type: 'full',
        action: 'sync',
        data: { tabs, groups },
        timestamp: Date.now(),
        source: source as any
      });

      this.syncStatus.lastSyncTime = Date.now();
      console.log(`SyncService: 全量数据同步完成 (${tabs.length} 个标签页, ${groups.length} 个分组)`);
    } catch (error) {
      console.error('SyncService: 全量同步失败', error);
      await this.handleSyncError('syncAll', () => this.syncAll(tabs, groups, source));
      throw error;
    } finally {
      this.syncStatus.syncInProgress = false;
    }
  }

  /**
   * 从远程加载数据
   * @param keys 要加载的数据键
   * @returns 加载的数据
   */
  public async loadData(keys?: string[]): Promise<any> {
    console.log('🔄 SyncService: 开始加载数据，请求键:', keys, '在线状态:', this.syncStatus.isOnline);
    
    // 详细的环境状态检查
    const extensionEnv = isChromeExtensionEnvironment();
    console.log('🔄 SyncService: 环境状态详情:', {
      syncServiceOnline: this.syncStatus.isOnline,
      extensionEnvironment: extensionEnv,
      chromeAvailable: typeof chrome !== 'undefined',
      runtimeAvailable: typeof chrome !== 'undefined' && !!chrome.runtime,
      extensionId: typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime.id : 'N/A'
    });
    
    try {
      if (this.syncStatus.isOnline) {
        // Chrome扩展环境：通过扩展桥梁加载
        console.log('✅ SyncService: 使用Chrome扩展环境，通过扩展桥梁加载数据');
        const bridge = getExtensionBridge();
        const result = await bridge.getStorageData(keys);
        console.log('✅ SyncService: 扩展桥梁数据加载完成:', {
          tabs: result?.tabs?.length || 0,
          groups: result?.groups?.length || 0,
          keys: Object.keys(result || {}),
          hasRealData: (result?.tabs?.length || 0) > 0,
          dataSource: 'Chrome扩展存储'
        });
        
        // 检查是否获取到真实数据
        if ((result?.tabs?.length || 0) === 0) {
          console.warn('⚠️ SyncService: Chrome扩展存储中没有标签页数据，可能需要先收纳一些标签页');
        }
        
        return result;
      } else {
        // 独立Web应用：使用本地存储
        console.log('📦 SyncService: 使用独立Web应用模式，直接访问本地存储');
        const storageService = getStorageService();
        if (keys) {
          const result: any = {};
          for (const key of keys) {
            switch (key) {
              case 'tabs':
                result.tabs = await storageService.loadTabs();
                console.log(`📦 SyncService: 从本地存储加载了 ${result.tabs?.length || 0} 个标签页`);
                if (result.tabs?.length > 0) {
                  console.log('📦 SyncService: 本地存储标签页示例:', result.tabs.slice(0, 2).map(t => ({ id: t.id, title: t.title, url: t.url })));
                }
                break;
              case 'groups':
                result.groups = await storageService.loadGroups();
                console.log(`📦 SyncService: 从本地存储加载了 ${result.groups?.length || 0} 个分组`);
                break;
              case 'settings':
                result.settings = await storageService.loadSettings();
                break;
              case 'operations':
                result.operations = await storageService.loadOperations();
                break;
            }
          }
          console.log('📦 SyncService: 本地存储数据加载完成:', {
            tabs: result.tabs?.length || 0,
            groups: result.groups?.length || 0,
            keys: Object.keys(result),
            hasRealData: (result.tabs?.length || 0) > 0,
            dataSource: '本地存储'
          });
          
          // 检查是否为空数据
          if ((result.tabs?.length || 0) === 0 && (result.groups?.length || 0) === 0) {
            console.warn('⚠️ SyncService: 本地存储中没有数据，这可能是首次使用或数据被清空');
          }
          
          return result;
        } else {
          const allData = await storageService.getAllData();
          console.log('📦 SyncService: 获取所有本地存储数据完成:', {
            tabs: allData.tabs?.length || 0,
            groups: allData.groups?.length || 0,
            keys: Object.keys(allData),
            hasRealData: (allData.tabs?.length || 0) > 0,
            dataSource: '本地存储(全量)'
          });
          return allData;
        }
      }
    } catch (error) {
      console.error('❌ SyncService: 数据加载失败', error);
      throw error;
    }
  }

  // ==================== 冲突检测和解决 ====================

  /**
   * 检测数据冲突
   * @param localData 本地数据
   * @param remoteData 远程数据
   * @param type 数据类型
   * @returns 冲突信息
   */
  public detectConflicts(localData: any, remoteData: any, type: 'tabs' | 'groups' | 'settings'): DataConflict | null {
    // 简单的时间戳比较冲突检测
    const localTimestamp = this.getDataTimestamp(localData, type);
    const remoteTimestamp = this.getDataTimestamp(remoteData, type);
    
    // 如果时间戳差异超过阈值，认为存在冲突
    const CONFLICT_THRESHOLD = 60000; // 1分钟
    if (Math.abs(localTimestamp - remoteTimestamp) > CONFLICT_THRESHOLD) {
      return {
        type,
        localData,
        remoteData,
        timestamp: Date.now()
      };
    }
    
    return null;
  }

  /**
   * 解决数据冲突
   * @param conflict 冲突信息
   * @param resolution 解决方案
   */
  public async resolveConflict(conflict: DataConflict, resolution: 'local' | 'remote' | 'merge'): Promise<any> {
    try {
      let resolvedData: any;
      
      switch (resolution) {
        case 'local':
          resolvedData = conflict.localData;
          break;
        case 'remote':
          resolvedData = conflict.remoteData;
          break;
        case 'merge':
          resolvedData = this.mergeData(conflict.localData, conflict.remoteData, conflict.type);
          break;
        default:
          throw new Error(`未知的冲突解决方案: ${resolution}`);
      }
      
      // 应用解决后的数据
      switch (conflict.type) {
        case 'tabs':
          await this.syncTabs(resolvedData, 'system');
          break;
        case 'groups':
          await this.syncGroups(resolvedData, 'system');
          break;
        case 'settings':
          if (this.syncStatus.isOnline) {
            const bridge = getExtensionBridge();
            await bridge.setStorageData({ settings: resolvedData });
          } else {
            const storageService = getStorageService();
            await storageService.saveSettings(resolvedData);
          }
          break;
      }
      
      // 从冲突列表中移除已解决的冲突
      this.syncStatus.conflicts = this.syncStatus.conflicts.filter(c => c !== conflict);
      
      console.log(`SyncService: 冲突已解决 (${conflict.type}, ${resolution})`);
      return resolvedData;
    } catch (error) {
      console.error('SyncService: 冲突解决失败', error);
      throw error;
    }
  }

  // ==================== 事件系统 ====================

  /**
   * 监听同步事件
   * @param event 事件名称
   * @param callback 回调函数
   */
  public on(event: string, callback: (data: any) => void): void {
    if (!this.syncListeners.has(event)) {
      this.syncListeners.set(event, []);
    }
    this.syncListeners.get(event)!.push(callback);
  }

  /**
   * 移除同步事件监听
   * @param event 事件名称
   * @param callback 回调函数
   */
  public off(event: string, callback: (data: any) => void): void {
    const listeners = this.syncListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 触发同步事件
   * @param event 事件名称
   * @param data 事件数据
   */
  public emit(event: string, data?: any): void {
    const listeners = this.syncListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`SyncService: 事件回调执行失败 (${event})`, error);
        }
      });
    }
  }

  /**
   * 通知所有监听器数据变更
   * @param event 事件名称
   * @param data 事件数据
   */
  private notifyListeners(event: string, data: any): void {
    this.emit(event, data);
  }

  /**
   * 触发同步事件
   * @param syncEvent 同步事件
   */
  public emitSyncEvent(syncEvent: SyncEvent): void {
    this.emit('sync', syncEvent);
    this.emit(`${syncEvent.type}Sync`, syncEvent);
    this.emit(`${syncEvent.action}`, syncEvent);
  }

  // ==================== 状态管理 ====================

  /**
   * 获取同步状态
   * @returns 同步状态
   */
  public getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * 检查是否有待处理的冲突
   * @returns 是否有冲突
   */
  public hasConflicts(): boolean {
    return this.syncStatus.conflicts.length > 0;
  }

  /**
   * 获取所有冲突
   * @returns 冲突数组
   */
  public getConflicts(): DataConflict[] {
    return [...this.syncStatus.conflicts];
  }

  // ==================== 私有方法 ====================

  /**
   * 设置扩展数据监听器
   */
  private setupExtensionDataListener(): void {
    if (!isChromeExtensionEnvironment()) {
      return;
    }

    const bridge = getExtensionBridge();
    
    // 监听数据变更事件
    bridge.on('dataChanged', (changeEvent: any) => {
      console.log('SyncService: 接收到数据变更事件', changeEvent);
      
      // 转发为同步事件
      this.emitSyncEvent({
        type: changeEvent.type,
        action: changeEvent.action,
        data: changeEvent.data,
        timestamp: changeEvent.timestamp,
        source: 'extension'
      });
    });
  }

  /**
   * 启动定期同步
   */
  private startPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      try {
        await this.performPeriodicSync();
      } catch (error) {
        console.error('SyncService: 定期同步失败', error);
      }
    }, this.SYNC_INTERVAL);
  }

  /**
   * 执行定期同步
   */
  private async performPeriodicSync(): Promise<void> {
    if (!this.syncStatus.isOnline || this.syncStatus.syncInProgress) {
      return;
    }

    // 检查是否有待处理的操作
    if (this.pendingOperations.size > 0) {
      console.log(`SyncService: 处理 ${this.pendingOperations.size} 个待处理操作`);
      
      for (const [id, { operation, retryCount }] of this.pendingOperations) {
        try {
          await operation();
          this.pendingOperations.delete(id);
        } catch (error) {
          if (retryCount < this.MAX_RETRY_ATTEMPTS) {
            this.pendingOperations.set(id, { operation, retryCount: retryCount + 1 });
          } else {
            console.error(`SyncService: 操作重试失败，已达到最大重试次数 (${id})`, error);
            this.pendingOperations.delete(id);
          }
        }
      }
    }
  }

  /**
   * 处理同步错误
   * @param operationId 操作ID
   * @param operation 操作函数
   */
  private async handleSyncError(operationId: string, operation: () => Promise<void>): Promise<void> {
    // 将失败的操作添加到待处理队列
    this.pendingOperations.set(operationId, { operation, retryCount: 0 });
    this.syncStatus.pendingChanges++;
    
    console.log(`SyncService: 操作已添加到重试队列 (${operationId})`);
  }

  /**
   * 获取数据时间戳
   * @param data 数据
   * @param type 数据类型
   * @returns 时间戳
   */
  private getDataTimestamp(data: any, type: string): number {
    if (Array.isArray(data)) {
      // 对于数组数据，使用最新项的时间戳
      const timestamps = data
        .map(item => item.createdTime || item.lastUpdated || item.timestamp || 0)
        .filter(t => t > 0);
      return timestamps.length > 0 ? Math.max(...timestamps) : Date.now();
    } else if (data && typeof data === 'object') {
      // 对于对象数据，使用对象的时间戳字段
      return data.lastUpdated || data.timestamp || data.createdTime || Date.now();
    }
    
    return Date.now();
  }

  /**
   * 合并数据
   * @param localData 本地数据
   * @param remoteData 远程数据
   * @param type 数据类型
   * @returns 合并后的数据
   */
  private mergeData(localData: any, remoteData: any, type: string): any {
    // 简单的合并策略：优先使用较新的数据
    if (Array.isArray(localData) && Array.isArray(remoteData)) {
      // 对于数组，合并并去重
      const merged = [...localData];
      const localIds = new Set(localData.map((item: any) => item.id));
      
      for (const remoteItem of remoteData) {
        if (!localIds.has(remoteItem.id)) {
          merged.push(remoteItem);
        } else {
          // 如果ID相同，使用较新的数据
          const localItem = localData.find((item: any) => item.id === remoteItem.id);
          const localTimestamp = this.getDataTimestamp(localItem, type);
          const remoteTimestamp = this.getDataTimestamp(remoteItem, type);
          
          if (remoteTimestamp > localTimestamp) {
            const index = merged.findIndex((item: any) => item.id === remoteItem.id);
            if (index >= 0) {
              merged[index] = remoteItem;
            }
          }
        }
      }
      
      return merged;
    } else {
      // 对于对象，使用较新的数据
      const localTimestamp = this.getDataTimestamp(localData, type);
      const remoteTimestamp = this.getDataTimestamp(remoteData, type);
      
      return remoteTimestamp > localTimestamp ? remoteData : localData;
    }
  }
}

// ==================== 导出便捷函数 ====================

/**
 * 获取同步服务实例
 */
export const getSyncService = () => SyncService.getInstance();

/**
 * 初始化同步服务
 */
export const initializeSyncService = async (): Promise<SyncService> => {
  const service = getSyncService();
  await service.initialize();
  return service;
};

/**
 * 快速同步标签页数据
 */
export const quickSyncTabs = async (tabs: Tab[], source?: string): Promise<void> => {
  const service = getSyncService();
  await service.syncTabs(tabs, source);
};

/**
 * 快速同步分组数据
 */
export const quickSyncGroups = async (groups: Group[], source?: string): Promise<void> => {
  const service = getSyncService();
  await service.syncGroups(groups, source);
};

/**
 * 快速全量同步
 */
export const quickSyncAll = async (tabs: Tab[], groups: Group[], source?: string): Promise<void> => {
  const service = getSyncService();
  await service.syncAll(tabs, groups, source);
};

/**
 * 快速加载数据
 */
export const quickLoadData = async (keys?: string[]): Promise<any> => {
  const service = getSyncService();
  return await service.loadData(keys);
};