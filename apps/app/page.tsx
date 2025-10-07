'use client';

import { useState, useMemo, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, closestCenter, DragOverlay, useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { DragInsertProvider } from '../components/DragInsertIndicator';
import TopToolbar from '../components/TopToolbar';
import ActionToolbar from '../components/ActionToolbar';
import TabGroup from '../components/TabGroup';
import TabItem from '../components/TabItem';
import StatusBar from '../components/StatusBar';
import { ToastManager } from '../components/OperationToast';
import { GroupManagementDialog } from '../components/GroupManagementDialog';
import ClientOnly from '../components/ClientOnly';
import DevTools from '../components/DevTools';
import '../styles/drag.css';

// 导入服务和类型
import { Tab, Group, Toast, Operation } from '../lib/types';
import { initializeStorage, getStorageService } from '../lib/storage';
import { initializeChromeAPI, getChromeAPIService, collectCurrentTab, collectAllTabs } from '../lib/chrome-api';
import { getImportExportService, quickExportAllData, quickImportData } from '../lib/import-export';
import { initializeAIService, getAIServiceManager, quickIntelligentGrouping } from '../lib/ai-service';
import { initializeExtensionBridge, getExtensionBridge, isChromeExtensionEnvironment } from '../lib/extension-bridge';
import { initializeSyncService, getSyncService } from '../lib/sync-service';
import ChromeService from '../lib/chrome-service';
import SafeDOM from '../lib/safe-dom';

export default function Home() {
  // 基础状态
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTabs, setSelectedTabs] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // 拖拽状态
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);
  const [draggedTabLeftOriginalGroup, setDraggedTabLeftOriginalGroup] = useState<boolean>(false);
  
  // 插入指示器状态
  const [insertIndicators, setInsertIndicators] = useState<Record<string, {
    showBefore: boolean;
    showAfter: boolean;
    type: 'line' | 'zone';
  }>>({});
  
  // 分组管理对话框状态
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  // 操作提示状态管理
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // 撤销操作状态
  const [lastOperation, setLastOperation] = useState<Operation | null>(null);
  
  // 全局悬停状态管理
  const [hoveredTabId, setHoveredTabId] = useState<string | null>(null);
  
  // 处理标签页悬停状态
  const handleTabHover = (tabId: string | null) => {
    setHoveredTabId(tabId);
  };
  
  // 配置拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // 降低拖拽激活距离
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 数据状态
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  // 调试与初始化状态
  const [showInitDebug, setShowInitDebug] = useState(false);
  const [initStartTime, setInitStartTime] = useState<number | null>(null);
  const [envInfo, setEnvInfo] = useState({
    isExtensionEnv: false,
    chromeAvailable: false,
    runtimeAvailable: false,
    storageAvailable: false
  });
  const [initSteps, setInitSteps] = useState<{ [k: string]: string }>({
    client: 'pending',
    chromeService: 'pending',
    extensionBridge: 'pending',
    storage: 'pending',
    chromeAPI: 'pending',
    ai: 'pending',
    sync: 'pending',
    dataLoad: 'pending'
  });

  // 客户端检测
  useEffect(() => {
    console.log('🚀 React应用开始初始化 - 客户端检测useEffect触发');
    setIsClient(true);
    
    // 初始化SafeDOM工具（防止React DOM错误）
    try {
      SafeDOM.initialize();
      console.log('🛡️ SafeDOM工具已初始化，DOM操作将更加安全');
    } catch (error) {
      console.error('❌ SafeDOM初始化失败:', error);
    }
    
    // 设置页面标题
    if (typeof document !== 'undefined') {
      document.title = 'Tabify - 标签页管理器';
      console.log('📄 页面标题已设置为:', document.title);
      
      // 验证标题设置是否成功
      setTimeout(() => {
        console.log('🔍 验证页面标题:', document.title);
      }, 100);
    }
    
    // 立即隐藏静态HTML中的加载遮罩
    const staticLoadingOverlay = document.querySelector('.fixed.inset-0.bg-white.bg-opacity-90');
    if (staticLoadingOverlay) {
      console.log('🎯 找到静态加载遮罩，准备隐藏');
      staticLoadingOverlay.remove();
      console.log('✅ 静态加载遮罩已移除');
    } else {
      console.log('ℹ️ 未找到静态加载遮罩（可能已被移除）');
    }
    
    console.log('✅ 客户端检测useEffect完成');
  }, []);

  // 初始化应用数据
  useEffect(() => {
    if (!isClient) {
      console.log('⏳ 等待客户端初始化完成...');
      return;
    }
    
    console.log('🚀 开始应用数据初始化useEffect');
    
    const initializeApp = async () => {
      try {
        console.log('🔧 设置加载状态和清除错误');
        setIsLoading(true);
        setError(null);
        setInitStartTime(Date.now());

        // 检查是否在Chrome扩展环境中
        const isExtensionEnv = isChromeExtensionEnvironment();
        console.log('🌍 运行环境检测:', isExtensionEnv ? 'Chrome扩展' : '独立Web应用');

        // 初始化ChromeService（新的统一桥接服务）
        await ChromeService.initialize();
        console.log('ChromeService初始化完成');

        // 初始化扩展桥梁（如果在扩展环境中）
        if (isExtensionEnv) {
          await initializeExtensionBridge();
          console.log('扩展桥梁初始化完成');
        }

        // 初始化存储服务
        await initializeStorage();
        console.log('存储服务初始化完成');

        // 初始化Chrome API服务
        await initializeChromeAPI();
        console.log('Chrome API服务初始化完成');

        // 初始化AI服务
        await initializeAIService();
        console.log('AI服务初始化完成');

        // 初始化同步服务
        await initializeSyncService();
        console.log('同步服务初始化完成');

        // 设置同步事件监听
        setupSyncListeners();

        // 加载数据（不阻塞应用初始化）
        console.log('🔄 开始加载数据...');
        try {
          const dataLoaded = await loadData();
          if (dataLoaded) {
            console.log('✅ 数据加载成功，应用初始化完成');
          } else {
            console.log('⚠️ 数据加载失败，但应用初始化完成，用户仍可使用基本功能');
          }
        } catch (dataError) {
          console.error('❌ 数据加载过程中出现未捕获的错误:', dataError);
          console.log('🔧 设置默认空数据状态，确保应用能够正常显示');
          setTabs([]);
          setGroups([]);
          addToast('数据加载失败，应用将以空数据状态运行', 'warning');
        }
        
        console.log('🔧 清除加载状态，应用即将显示');
        setIsLoading(false);
        console.log('🎉 应用初始化完成，页面即将显示');
        
        // 验证React应用状态
        setTimeout(() => {
          console.log('🔍 React应用状态验证:', {
            isClient,
            isLoading: false,
            hasError: !!error,
            pageTitle: typeof document !== 'undefined' ? document.title : 'SSR环境',
            bodyContent: typeof document !== 'undefined' ? document.body.textContent?.length : 0
          });
        }, 500);

        // 在开发模式下，将重置函数暴露到全局作用域（仅客户端）
        if (isClient && 
            (window.location.hostname === 'localhost' || window.location.port === '3000')) {
          (window as any).resetMockData = async () => {
            try {
              const storageService = getStorageService();
              await storageService.resetToMockData();
              await loadData(); //
              addToast('模拟数据已重置', 'success', '开发工具');
              console.log('✅ 模拟数据已重置，页面数据已刷新');
            } catch (error) {
              console.error('❌ 重置模拟数据失败:', error);
              addToast('重置模拟数据失败', 'error');
            }
          };
          console.log('🔧 开发模式：可在控制台使用 resetMockData() 重置测试数据');
        }
      } catch (error) {
        console.error('❌ 应用初始化过程中出现错误:', error);
        setShowInitDebug(true);
        let errorMessage = '应用初始化失败';
        if (error instanceof Error) {
          errorMessage = `应用初始化失败: ${error.message}`;
          console.error('错误详情:', error.stack);
        } else {
          errorMessage = `应用初始化失败: ${String(error)}`;
        }
        setError(errorMessage);
        setIsLoading(false); // 确保加载状态被清除
        console.log('🔧 尽管初始化失败，页面仍将显示以便用户查看错误信息');
        addToast('应用初始化失败，请刷新页面重试', 'error');
      }
    };
    initializeApp();
  }, [isClient]);

  // 初始化超时保护：15秒仍在加载则展开调试面板
  useEffect(() => {
    if (!isClient) return;
    if (!isLoading) return;
    const start = initStartTime ?? Date.now();
    if (!initStartTime) setInitStartTime(start);
    const timer = setTimeout(() => {
      if (isLoading) {
        console.warn('⏳ 初始化超过15秒，展开调试面板');
        setShowInitDebug(true);
        setInitSteps(prev => ({ ...prev, dataLoad: prev.dataLoad === 'pending' ? 'timeout' : prev.dataLoad }));
        setIsLoading(false);
        addToast('初始化超时，已打开调试面板', 'warning');
      }
    }, 15000);
    return () => clearTimeout(timer);
  }, [isClient, isLoading, initStartTime]);

  // 设置同步事件监听器
  const setupSyncListeners = () => {
    const syncService = getSyncService();
    
    // 监听数据同步事件
    syncService.on('sync', (syncEvent: any) => {
      console.log('收到同步事件:', syncEvent);
      
      // 根据同步事件类型更新UI状态
      if (syncEvent.source !== 'manager') {
        // 如果数据来源不是当前管理界面，则重新加载数据
        loadData().catch(error => {
          console.error('同步后重新加载数据失败:', error);
        });
      }
    });
    
    // 监听冲突事件
    syncService.on('conflict', (conflict: any) => {
      console.warn('检测到数据冲突:', conflict);
      addToast('检测到数据冲突，请检查同步状态', 'warning');
    });
    
    // 监听扩展桥梁的数据变更事件
    if (isChromeExtensionEnvironment()) {
      const extensionBridge = getExtensionBridge();
      
      // 监听数据变更事件
      extensionBridge.on('dataChanged', (changeEvent: any) => {
        console.log('收到扩展桥梁数据变更事件:', changeEvent);
        
        // 重新加载数据以显示最新的标签页
        loadData().catch(error => {
          console.error('数据变更后重新加载数据失败:', error);
        });
      });
      
      // 监听标签页收纳事件
      extensionBridge.on('tabCollected', (tabData: any) => {
        console.log('收到标签页收纳事件:', tabData);
        
        // 重新加载数据
        loadData().catch(error => {
          console.error('标签页收纳后重新加载数据失败:', error);
        });
      });
      
      // 监听标签页恢复事件
      extensionBridge.on('tabRestored', (tabData: any) => {
        console.log('收到标签页恢复事件:', tabData);
        
        // 重新加载数据
        loadData().catch(error => {
          console.error('标签页恢复后重新加载数据失败:', error);
        });
      });
      
      console.log('扩展桥梁事件监听器已设置');
    }
    
    console.log('同步事件监听器已设置');
  };

  // 加载数据函数（带重试机制）
  const loadData = async (retryCount = 0) => {
    const maxRetries = 3;
    const retryDelay = 1000; // 1秒
    
    try {
      // 使用ChromeService加载数据
      console.log('🔄 开始通过ChromeService加载数据...');
      const data = await ChromeService.getAllData();
      const loadedTabs: Tab[] = data.tabs || [];
      const loadedGroups: Group[] = data.groups || [];

      setTabs(loadedTabs);
      setGroups(loadedGroups);

      // 设置默认展开状态
      const defaultExpanded: Record<string, boolean> = { ungrouped: true };
      loadedGroups.forEach(group => {
        defaultExpanded[group.id] = group.isExpanded ?? true; // 默认展开
      });
      setExpandedGroups(defaultExpanded);

      console.log(`✅ 通过ChromeService加载了 ${loadedTabs.length} 个标签页和 ${loadedGroups.length} 个分组`);
      
      // 如果加载到了真实数据，显示成功提示
      if (loadedTabs.length > 0) {
        console.log('📋 加载的标签页示例:', loadedTabs.slice(0, 2).map(t => ({ title: t.title, url: t.url })));
      }
      
      // 如果之前有错误，现在成功了，清除错误状态
      if (error) {
        setError(null);
        // 移除Toast通知，避免重复提示
      }
      
      return true; // 加载成功
    } catch (loadError) {
      console.error(`❌ 数据加载失败 (尝试 ${retryCount + 1}/${maxRetries + 1}):`, loadError);
      
      if (retryCount < maxRetries) {
        // 重试加载
        console.log(`⏳ ${retryDelay}ms 后重试数据加载...`);
        setTimeout(() => {
          loadData(retryCount + 1);
        }, retryDelay * (retryCount + 1)); // 递增延迟
        return false; // 重试中
      } else {
        // 所有重试都失败了
        const errorMessage = `数据加载失败: ${loadError}`;
        console.warn('⚠️ 数据加载失败，但应用将继续运行:', errorMessage);
        
        // 在开发环境中，提供更友好的错误处理
        const isDev = window.location.hostname === 'localhost' || window.location.port === '3000';
        if (isDev) {
          console.log('🔧 开发环境中数据加载失败，这是正常的（Chrome扩展API不可用）');
          addToast('开发环境：使用本地存储数据', 'info');
        } else {
          addToast('数据加载失败，请检查Chrome扩展连接', 'warning');
        }
        
        // 设置空数据状态，让用户知道数据加载失败但应用仍可使用
        setTabs([]);
        setGroups([]);
        
        console.log('📝 已设置为空数据状态，用户仍可使用应用的其他功能');
        
        // 不抛出错误，让应用继续运行
        return false; // 加载失败但不阻止应用运行
      }
    }
  };

  // 保存数据函数
  const saveData = async () => {
    try {
      // 使用ChromeService保存数据
      console.log('💾 开始通过ChromeService保存数据...', { tabs: tabs.length, groups: groups.length });
      await ChromeService.syncData(tabs, groups);
      console.log('✅ 通过ChromeService保存数据成功');
    } catch (error) {
      console.error('❌ ChromeService数据保存失败:', error);
      
      // 在开发环境中，提供更友好的错误处理
      const isDev = window.location.hostname === 'localhost' || window.location.port === '3000';
      if (isDev) {
        console.warn('🔧 开发环境中数据保存失败，这是正常的（Chrome扩展API不可用）');
        // 在开发环境中不显示错误提示，避免干扰用户体验
      } else {
        addToast('数据保存失败，请检查扩展连接', 'warning');
      }
    }
  };

  // 当数据变化时自动保存
  useEffect(() => {
    if (!isLoading && tabs.length >= 0 && groups.length >= 0) {
      saveData();
    }
  }, [tabs, groups, isLoading]);

  // 过滤标签页
  const filteredTabs = useMemo(() => {
    if (!searchQuery) return tabs;
    return tabs.filter(tab => 
      tab.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tab.url.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, tabs]);

  // 获取未分组标签页
  const ungroupedTabs = filteredTabs.filter(tab => !tab.groupId);

  // 获取已分组标签页
  const getGroupTabs = (groupId: string) => 
    filteredTabs.filter(tab => tab.groupId === groupId);

  // 检查是否全选
  const isAllSelected = filteredTabs.length > 0 && filteredTabs.every(tab => selectedTabs.includes(tab.id));

  // 检查是否有选中的未分组标签页
  const hasUngroupedSelected = ungroupedTabs.some(tab => selectedTabs.includes(tab.id));

  const handleSelectTab = (tabId: string, selected: boolean) => {
    if (selected) {
      setSelectedTabs(prev => [...prev, tabId]);
    } else {
      setSelectedTabs(prev => prev.filter(id => id !== tabId));
    }
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedTabs([]);
    } else {
      setSelectedTabs(filteredTabs.map(tab => tab.id));
    }
  };

  const handleGroupSelectAll = (tabIds: string[]) => {
    const currentlySelected = tabIds.filter(id => selectedTabs.includes(id));
    if (currentlySelected.length === tabIds.length) {
      // 取消选择这组的所有标签页
      setSelectedTabs(prev => prev.filter(id => !tabIds.includes(id)));
    } else {
      // 选择这组的所有标签页
      setSelectedTabs(prev => [...new Set([...prev, ...tabIds])]);
    }
  };

  const handleToggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newExpanded = {
        ...prev,
        [groupId]: !prev[groupId]
      };
      
      // 同步更新分组的展开状态到数据库
      if (groupId !== 'ungrouped') {
        setGroups(prevGroups => 
          prevGroups.map(group => 
            group.id === groupId 
              ? { ...group, isExpanded: newExpanded[groupId] }
              : group
          )
        );
      }
      
      return newExpanded;
    });
  };

  // 导入标签页数据
  const handleImport = async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const result = await quickImportData(file);
          if (result.success) {
            addToast(
              `成功导入 ${result.tabsImported} 个标签页和 ${result.groupsImported} 个分组`,
              'success',
              '导入成功'
            );
            await loadData(); // 重新加载数据
          } else {
            addToast(
              result.errors.join(', '),
              'error',
              '导入失败'
            );
          }
        }
      };
      input.click();
    } catch (error) {
      console.error('导入失败:', error);
      addToast('导入操作失败', 'error');
    }
  };

  // 导出标签页数据
  const handleExport = async () => {
    try {
      await quickExportAllData(true);
      addToast('数据导出成功', 'success');
    } catch (error) {
      console.error('导出失败:', error);
      addToast('导出操作失败', 'error');
    }
  };

  // 打开设置（暂时使用控制台输出）
  const handleSettings = () => {
    console.log('打开设置');
    addToast('设置功能开发中', 'info');
  };

  // 刷新数据
  const handleRefresh = async () => {
    try {
      console.log('🔄 用户手动刷新数据');
      addToast('正在刷新数据...', 'info');
      await loadData();
      // 移除成功提示Toast以减少用户打扰
    } catch (error) {
      console.error('❌ 手动刷新数据失败:', error);
      addToast('数据刷新失败', 'error');
    }
  };

  // 批量恢复标签页
  const handleBatchRestore = async () => {
    try {
      const chromeAPIService = getChromeAPIService();
      const selectedTabsData = tabs.filter(tab => selectedTabs.includes(tab.id));
      
      if (selectedTabsData.length === 0) {
        addToast('请先选择要恢复的标签页', 'error');
        return;
      }

      // 批量创建标签页
      const urls = selectedTabsData.map(tab => tab.url);
      await chromeAPIService.createMultipleTabs(urls, true);
      
      // 从存储中删除已恢复的标签页
      const newTabs = tabs.filter(tab => !selectedTabs.includes(tab.id));
      setTabs(newTabs);
      setSelectedTabs([]);
      
      // 批量恢复成功 - 已移除通知以减少打扰
    } catch (error) {
      console.error('批量恢复失败:', error);
      addToast('批量恢复失败', 'error');
    }
  };

  // 删除单个标签页
  const handleDeleteTab = async (tabId: string) => {
    console.log('🚀 page.tsx handleDeleteTab 被调用:', tabId);
    try {
      const tabToDelete = tabs.find(tab => tab.id === tabId);
      console.log('🚀 找到要删除的标签页:', tabToDelete);
      if (!tabToDelete) {
        console.error('🚀 标签页不存在:', tabId);
        addToast('标签页不存在', 'error');
        return;
      }

      // 保存操作前的状态用于撤销
      const now = typeof window !== 'undefined' ? Date.now() : 1640995200000;
      setLastOperation({
        id: `delete_${now}`,
        type: 'single',
        description: `删除标签页 "${tabToDelete.title}"`,
        beforeSnapshot: { tabs: [...tabs], groups: [...groups] },
        afterSnapshot: { tabs: tabs.filter(tab => tab.id !== tabId), groups: [...groups] },
        timestamp: now,
        canUndo: true,
      });

      // 删除标签页
      setTabs(prevTabs => prevTabs.filter(tab => tab.id !== tabId));
      
      // 从选中列表中移除
      setSelectedTabs(prev => prev.filter(id => id !== tabId));
      
      addToast(
        `已删除标签页 "${tabToDelete.title}"`,
        'success',
        '删除完成',
        undoLastOperation
      );
      
      console.log(`删除了标签页:`, tabToDelete.title);
    } catch (error) {
      console.error('删除标签页失败:', error);
      addToast('删除标签页失败', 'error');
    }
  };

  // 打开标签页并从列表中移除
  const handleOpenTab = async (tabId: string) => {
    try {
      const tabToOpen = tabs.find(tab => tab.id === tabId);
      if (!tabToOpen) {
        addToast('标签页不存在', 'error');
        return;
      }

      // 从列表中移除该标签页
      setTabs(prevTabs => prevTabs.filter(tab => tab.id !== tabId));
      
      // 从选中列表中移除
      setSelectedTabs(prev => prev.filter(id => id !== tabId));
      
      console.log(`已打开并移除标签页: ${tabToOpen.title}`);
    } catch (error) {
      console.error('处理打开标签页失败:', error);
      addToast('处理打开标签页失败', 'error');
    }
  };

  // 批量删除标签页
  const handleBatchDelete = async () => {
    try {
      if (selectedTabs.length === 0) {
        addToast('请先选择要删除的标签页', 'error');
        return;
      }

      // 保存操作前的状态用于撤销
      const deletedTabs = tabs.filter(tab => selectedTabs.includes(tab.id));
      const now = typeof window !== 'undefined' ? Date.now() : 1640995200000;
      setLastOperation({
        id: `batch_delete_${now}`,
        type: 'batch',
        description: `批量删除 ${deletedTabs.length} 个标签页`,
        beforeSnapshot: { tabs: [...tabs], groups: [...groups] },
        afterSnapshot: { tabs: tabs.filter(tab => !selectedTabs.includes(tab.id)), groups: [...groups] },
        timestamp: now,
        canUndo: true,
      });

      // 删除选中的标签页
      const newTabs = tabs.filter(tab => !selectedTabs.includes(tab.id));
      setTabs(newTabs);
      setSelectedTabs([]);
      
      // 批量删除成功 - 已移除通知以减少打扰
    } catch (error) {
      console.error('批量删除失败:', error);
      addToast('批量删除失败', 'error');
    }
  };

  // 处理添加到分组
  const handleAddToGroup = () => {
    if (selectedTabs.length === 0) {
      addToast('请先选择要分组的标签页', 'error');
      return;
    }
    setEditingGroup(null);
    setShowGroupDialog(true);
  };
  
  // 处理创建新分组
  const handleCreateGroup = () => {
    setEditingGroup(null);
    setShowGroupDialog(true);
  };
  
  // 处理编辑分组
  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setShowGroupDialog(true);
  };
  
  // 处理分组锁定状态切换
  const handleToggleLock = (groupId: string, isLocked: boolean) => {
    setGroups(prevGroups => 
      prevGroups.map(group => 
        group.id === groupId 
          ? { ...group, isLocked }
          : group
      )
    );
    
    const groupName = groups.find(g => g.id === groupId)?.name || '未知分组';
    addToast(
      `分组"${groupName}"已${isLocked ? '锁定' : '解锁'}`,
      'success',
      '分组状态更新'
    );
  };
  
  // 处理创建分组
  const handleCreateGroupSubmit = async (groupData: {
    name: string;
    description?: string;
    color?: string;
  }): Promise<boolean> => {
    try {
      // 创建新分组
      const now = typeof window !== 'undefined' ? Date.now() : 1640995200000;
      const random = typeof window !== 'undefined' ? Math.random().toString(36).substr(2, 9) : 'static123';
      const newGroup: Group = {
        id: `group_${now}_${random}`,
        name: groupData.name,
        description: groupData.description,
        color: groupData.color,
        createdTime: now,
        isLocked: false,
        isExpanded: true,
        sortOrder: groups.length,
      };
      
      // 设置新分组的展开状态
      setExpandedGroups(prev => ({
        ...prev,
        [newGroup.id]: true
      }));
      
      setGroups(prevGroups => [...prevGroups, newGroup]);
      
      // 如果有选中的标签页，将它们添加到新分组
      if (selectedTabs.length > 0) {
        setTabs(prevTabs => 
          prevTabs.map(tab => 
            selectedTabs.includes(tab.id)
              ? { ...tab, groupId: newGroup.id }
              : tab
          )
        );
        setSelectedTabs([]);
        // 创建分组并添加标签页成功 - 已移除通知以减少打扰
      } else {
        addToast(`已创建分组"${groupData.name}"`, 'success');
      }
      
      return true;
    } catch (error) {
      console.error('创建分组失败:', error);
      addToast('创建分组失败', 'error');
      return false;
    }
  };
  
  // 处理更新分组
  const handleUpdateGroupSubmit = async (groupId: string, updates: {
    name?: string;
    description?: string;
    color?: string;
  }): Promise<boolean> => {
    try {
      setGroups(prevGroups => 
        prevGroups.map(group => 
          group.id === groupId 
            ? { ...group, ...updates }
            : group
        )
      );
      addToast(`分组"${updates.name}"已更新`, 'success');
      return true;
    } catch (error) {
      console.error('更新分组失败:', error);
      addToast('更新分组失败', 'error');
      return false;
    }
  };

  // 智能分组
  const handleSmartGroup = async () => {
    try {
      if (selectedTabs.length === 0) {
        addToast('请先选择要分组的标签页', 'error');
        return;
      }

      const selectedTabsData = tabs.filter(tab => selectedTabs.includes(tab.id));
      const aiManager = getAIServiceManager();
      
      if (!aiManager.isServiceAvailable()) {
        addToast('AI服务不可用，请检查API配置', 'error');
        return;
      }

      addToast('正在进行智能分组分析...', 'info');
      
      const result = await quickIntelligentGrouping(selectedTabsData);
      
      // 处理分组建议（这里简化处理，实际应该有用户确认界面）
      console.log('智能分组结果:', result);
      addToast(
        `AI分析完成，生成了 ${result.suggestions.length} 个分组建议`,
        'success',
        '智能分组完成'
      );
    } catch (error) {
      console.error('智能分组失败:', error);
      addToast('智能分组失败', 'error');
    }
  };

  // 拖拽开始处理函数
  // 操作提示辅助函数
  const addToast = (message: string, type: 'success' | 'error' | 'warning' | 'info', title?: string, onUndo?: () => void) => {
    const now = typeof window !== 'undefined' ? Date.now() : 1640995200000;
    const toast: Toast = {
      id: `toast-${now}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title: title || '',
      message,
      duration: type === 'error' ? 0 : type === 'success' ? 3000 : type === 'info' ? 2000 : 5000, // 错误提示不自动消失，成功3秒，信息2秒
      showUndo: !!onUndo,
      onUndo,
      createdTime: now,
    };
    setToasts(prev => [...prev, toast]);
  };
  
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  // 撤销操作函数
  const undoLastOperation = () => {
    if (!lastOperation || !lastOperation.canUndo) return;
    
    try {
      // 恢复操作前的数据状态
      if (lastOperation.beforeSnapshot.tabs) {
        setTabs(lastOperation.beforeSnapshot.tabs);
      }
      if (lastOperation.beforeSnapshot.groups) {
        setGroups(lastOperation.beforeSnapshot.groups);
      }
      
      setLastOperation(null);
      addToast('操作已撤销', 'success');
      
      console.log(`已撤销操作: ${lastOperation.description}`);
    } catch (error) {
      console.error('撤销操作失败:', error);
      addToast('撤销操作失败', 'error');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setDraggedTabLeftOriginalGroup(false);
    setInsertIndicators({}); // 清除所有插入指示器
  };

  // 拖拽结束处理函数
  const handleDragEnd = (event: DragEndEvent) => {
    console.log('🎯 handleDragEnd 被调用:', event);
    setActiveId(null);
    setDraggedTabLeftOriginalGroup(false);
    setInsertIndicators({}); // 清除所有插入指示器
    const { active, over } = event;
    
    console.log('🎯 拖拽事件详情:', { 
      activeId: active.id, 
      overId: over?.id, 
      activeData: active.data.current,
      overData: over?.data.current 
    });
    
    if (!over || active.id === over.id) {
      console.log('🎯 拖拽取消或相同位置:', { hasOver: !!over, sameId: active.id === over?.id });
      return;
    }
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    // 获取被拖拽的标签页
    const activeTab = tabs.find(tab => tab.id === activeId);
    if (!activeTab) {
      console.log('🎯 未找到被拖拽的标签页:', activeId);
      return;
    }
    
    console.log('🎯 拖拽结束:', { activeId, overId, activeTab });
    
    // 检查目标是否为分组拖拽区域
    const overData = over.data.current;
    if (overData?.type === 'group') {
      const targetGroupId = overData.groupId === 'ungrouped' ? undefined : overData.groupId;
      
      // 检查目标分组是否被锁定
      if (overData.groupId !== 'ungrouped') {
        const targetGroup = groups.find(g => g.id === overData.groupId);
        if (targetGroup?.isLocked) {
          addToast(
            '无法添加到锁定分组',
            'error',
            '操作失败'
          );
          return;
        }
      }
      
      // 只有当目标分组与当前分组不同时才执行移动
      if (activeTab.groupId !== targetGroupId) {
        // 保存操作前的状态用于撤销
        const now = typeof window !== 'undefined' ? Date.now() : 1640995200000;
        setLastOperation({
          id: `move_${now}`,
          type: 'move',
          description: `移动标签页"${activeTab.title}"`,
          beforeSnapshot: { tabs: [...tabs], groups: [...groups] },
          afterSnapshot: { tabs: [], groups: [] }, // 将在操作完成后更新
          timestamp: now,
          canUndo: true,
        });
        
        setTabs(prevTabs => {
        const newTabs = prevTabs.map(tab => 
          tab.id === activeId 
            ? { ...tab, groupId: targetGroupId }
            : tab
        );
        
        const targetGroupName = overData.groupId === 'ungrouped' ? '未分组' : overData.groupTitle;
        const fromGroupName = activeTab.groupId ? groups.find(g => g.id === activeTab.groupId)?.name || '未知分组' : '未分组';
        
        console.log(`标签页移动完成: "${fromGroupName}" -> "${targetGroupName}"`);
        
        return newTabs;
      });
      
      // 重要：强制刷新目标分组状态
      setTimeout(() => {
        // 清除拖拽悬停状态
        setDragOverGroupId(null);
        
        // 强制触发重新渲染以确保分组状态更新
        setFilteredTabs(prev => [...prev]);
        
        console.log('🎯 目标分组状态已刷新');
      }, 0);
      
      const targetGroupName = overData.groupId === 'ungrouped' ? '未分组' : overData.groupTitle;
      const fromGroupName = activeTab.groupId ? groups.find(g => g.id === activeTab.groupId)?.name || '未知分组' : '未分组';
      
      addToast(
        `已从"${fromGroupName}"移动到"${targetGroupName}"`,
        'success',
        '标签页移动成功',
        undoLastOperation
      );
    }
    // 确保拖拽状态完全清除
    setDragOverGroupId(null);
    return;
    }
    
    // 处理标签页之间的拖拽（包括同分组内排序和跨分组插入）
    const activeIndex = tabs.findIndex(tab => tab.id === activeId);
    const overIndex = tabs.findIndex(tab => tab.id === overId);
    
    console.log('🎯 查找标签页索引:', { activeIndex, overIndex, tabsLength: tabs.length });
    
    if (activeIndex !== -1 && overIndex !== -1) {
      const activeTabData = tabs[activeIndex];
      const overTab = tabs[overIndex];
      
      console.log('🎯 标签页数据:', { 
        activeTabData: { id: activeTabData.id, title: activeTabData.title, groupId: activeTabData.groupId },
        overTab: { id: overTab.id, title: overTab.title, groupId: overTab.groupId }
      });
      
      // 同一分组内的排序
      if (activeTabData.groupId === overTab.groupId) {
        console.log('🎯 同分组内排序开始:', { groupId: activeTabData.groupId, activeIndex, overIndex });
        // 检查分组是否被锁定
        if (activeTabData.groupId) {
          const group = groups.find(g => g.id === activeTabData.groupId);
          if (group?.isLocked) {
            addToast(
              '无法在锁定分组内调整位置',
              'error',
              '操作失败'
            );
            return;
          }
        }
        
        // 获取分组名称
        const groupName = activeTabData.groupId ? groups.find(g => g.id === activeTabData.groupId)?.name || '未知分组' : '未分组';
        
        // 保存操作前的状态用于撤销
        const now = typeof window !== 'undefined' ? Date.now() : 1640995200000;
        setLastOperation({
          id: `sort_${now}`,
          type: 'update',
          description: `在"${groupName}"中调整标签页位置`,
          beforeSnapshot: { tabs: [...tabs], groups: [...groups] },
          afterSnapshot: { tabs: [], groups: [] }, // 将在操作完成后更新
          timestamp: now,
          canUndo: true,
        });
        
        setTabs(prevTabs => {
          console.log('🎯 执行arrayMove前:', { 
            activeIndex, 
            overIndex, 
            prevTabsLength: prevTabs.length,
            activeTab: prevTabs[activeIndex]?.title,
            targetTab: prevTabs[overIndex]?.title
          });
          
          const newTabs = arrayMove(prevTabs, activeIndex, overIndex);
          
          console.log('🎯 执行arrayMove后:', { 
            newTabsLength: newTabs.length,
            newActiveTab: newTabs[overIndex]?.title,
            newTargetTab: newTabs[activeIndex]?.title,
            firstFewTabs: newTabs.slice(0, 3).map(t => ({ id: t.id, title: t.title }))
          });
          
          return newTabs;
        });
        
        addToast(
          `在"${groupName}"中调整了标签页位置`,
          'success',
          '标签页排序成功',
          undoLastOperation
        );
      } else {
        // 跨分组拖拽：将标签页移动到目标分组并插入到指定位置
        const targetGroupId = overTab.groupId;
        
        // 检查目标分组是否被锁定
        if (targetGroupId) {
          const targetGroup = groups.find(g => g.id === targetGroupId);
          if (targetGroup?.isLocked) {
            addToast(
              '无法添加到锁定分组',
              'error',
              '操作失败'
            );
            return;
          }
        }
        
        // 保存操作前的状态用于撤销
        const now = typeof window !== 'undefined' ? Date.now() : 1640995200000;
        setLastOperation({
          id: `cross_move_${now}`,
          type: 'move',
          description: `跨分组移动标签页"${activeTabData.title}"`,
          beforeSnapshot: { tabs: [...tabs], groups: [...groups] },
          afterSnapshot: { tabs: [], groups: [] }, // 将在操作完成后更新
          timestamp: now,
          canUndo: true,
        });
        
        // 更新标签页的分组并重新排序
        setTabs(prevTabs => {
          // 先更新被拖拽标签页的分组
          const updatedTabs = prevTabs.map(tab => 
            tab.id === activeId 
              ? { ...tab, groupId: targetGroupId }
              : tab
          );
          
          // 重新计算索引（因为分组已更改）
          const newActiveIndex = updatedTabs.findIndex(tab => tab.id === activeId);
          const newOverIndex = updatedTabs.findIndex(tab => tab.id === overId);
          
          console.log('跨分组移动:', { newActiveIndex, newOverIndex, targetGroupId });
          
          // 执行排序
          return arrayMove(updatedTabs, newActiveIndex, newOverIndex);
        });
        
        // 重要：强制刷新目标分组状态
        setTimeout(() => {
          // 清除拖拽悬停状态
          setDragOverGroupId(null);
          
          // 强制触发重新渲染以确保分组状态更新
          setFilteredTabs(prev => [...prev]);
          
          console.log('🎯 跨分组移动后状态已刷新');
        }, 0);
        
        const targetGroupName = targetGroupId ? groups.find(g => g.id === targetGroupId)?.name || '未知分组' : '未分组';
        const fromGroupName = activeTabData.groupId ? groups.find(g => g.id === activeTabData.groupId)?.name || '未知分组' : '未分组';
        
        addToast(
          `已从"${fromGroupName}"移动到"${targetGroupName}"`,
          'success',
          '标签页移动成功',
          undoLastOperation
        );
      }
    }
  };
  
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setDragOverGroupId(null);
      setDraggedTabLeftOriginalGroup(false);
      setInsertIndicators({});
      return;
    }
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    // 获取被拖拽的标签页
    const activeTab = tabs.find(tab => tab.id === activeId);
    if (!activeTab) return;
    
    // 检查是否悬停在分组上
    const overData = over.data.current;
    if (overData?.type === 'group') {
      setDragOverGroupId(overData.groupId);
      
      const targetGroupId = overData.groupId === 'ungrouped' ? undefined : overData.groupId;
      
      // 检查拖拽的标签页是否离开了原分组
      if (activeTab.groupId !== targetGroupId) {
        setDraggedTabLeftOriginalGroup(true);
        console.log(`准备将标签页移动到: ${overData.groupTitle}`);
      } else {
        setDraggedTabLeftOriginalGroup(false);
      }
      
      // 清除插入指示器（分组拖拽时不需要精确插入位置）
      setInsertIndicators({});
    } else {
      setDragOverGroupId(null);
      
      // 检查是否拖拽到其他标签页上
      const overTab = tabs.find(tab => tab.id === overId);
      if (overTab) {
        // 计算插入指示器位置
        const newIndicators: Record<string, { showBefore: boolean; showAfter: boolean; type: 'line' | 'zone' }> = {};
        
        // 获取当前标签页在各自分组中的位置
        const getTabsInGroup = (groupId?: string) => {
          return tabs.filter(tab => tab.groupId === groupId);
        };
        
        const activeGroupTabs = getTabsInGroup(activeTab.groupId);
        const overGroupTabs = getTabsInGroup(overTab.groupId);
        
        const activeIndexInGroup = activeGroupTabs.findIndex(tab => tab.id === activeId);
        const overIndexInGroup = overGroupTabs.findIndex(tab => tab.id === overId);
        
        if (overIndexInGroup !== -1) {
          // 判断是同分组内排序还是跨分组拖拽
          const isSameGroup = activeTab.groupId === overTab.groupId;
          const insertType: 'line' | 'zone' = 'line'; // 统一使用线型指示器
          
          if (isSameGroup) {
            // 同分组内排序：根据在分组内的相对位置决定插入方向
            if (activeIndexInGroup !== -1) {
              if (activeIndexInGroup < overIndexInGroup) {
                // 向下拖拽，在目标元素后面插入
                newIndicators[overId] = {
                  showBefore: false,
                  showAfter: true,
                  type: insertType
                };
              } else if (activeIndexInGroup > overIndexInGroup) {
                // 向上拖拽，在目标元素前面插入
                newIndicators[overId] = {
                  showBefore: true,
                  showAfter: false,
                  type: insertType
                };
              }
            }
          } else {
            // 跨分组拖拽：默认插入到目标位置后面，但可以根据鼠标位置优化
            // 这里可以添加更精确的鼠标位置检测逻辑
            newIndicators[overId] = {
              showBefore: false,
              showAfter: true,
              type: insertType
            };
          }
        }
        
        setInsertIndicators(newIndicators);
        
        // 设置跨分组状态
        if (activeTab.groupId !== overTab.groupId) {
          setDraggedTabLeftOriginalGroup(true);
        } else {
          setDraggedTabLeftOriginalGroup(false);
        }
      } else {
        // 如果没有悬停在任何有效目标上，重置状态
        setDraggedTabLeftOriginalGroup(false);
        setInsertIndicators({});
      }
    }
  };

  // 处理删除分组
  const handleDeleteGroup = (groupTitle: string, option: 'delete' | 'move') => {
    // 找到对应的分组
    const group = groups.find(g => g.name === groupTitle);
    if (group) {
      const groupTabs = filteredTabs.filter(tab => tab.groupId === group.id);
      const groupTabIds = groupTabs.map(tab => tab.id);
      
      if (option === 'delete') {
        // 删除分组内的所有标签页
        setTabs(prevTabs => prevTabs.filter(tab => tab.groupId !== group.id));
        
        // 从选中列表中移除这些标签页
        setSelectedTabs(prev => prev.filter(id => !groupTabIds.includes(id)));
        
        console.log(`分组 "${groupTitle}" 及其 ${groupTabIds.length} 个标签页已删除`);
      } else if (option === 'move') {
        // 将分组内的标签页移动到未分组状态
        setTabs(prevTabs => 
          prevTabs.map(tab => 
            tab.groupId === group.id 
              ? { ...tab, groupId: undefined }
              : tab
          )
        );
        
        console.log(`分组 "${groupTitle}" 已删除，${groupTabs.length} 个标签页已移至未分组`);
      }
      
      // 从分组列表中移除该分组
      setGroups(prevGroups => prevGroups.filter(g => g.id !== group.id));
    }
  };

  // 按域名分组功能
  const handleDomainGroup = async () => {
    try {
      if (selectedTabs.length === 0) {
        addToast('请先选择要分组的标签页', 'error');
        return;
      }

      const selectedTabsData = tabs.filter(tab => selectedTabs.includes(tab.id));
      const domainGroups = new Map<string, Tab[]>();
      
      // 按域名分组
      selectedTabsData.forEach(tab => {
        try {
          const domain = new URL(tab.url).hostname;
          const cleanDomain = domain.replace(/^www\./, ''); // 移除www前缀
          
          if (!domainGroups.has(cleanDomain)) {
            domainGroups.set(cleanDomain, []);
          }
          domainGroups.get(cleanDomain)!.push(tab);
        } catch (error) {
          // URL解析失败，放入"其他"分组
          if (!domainGroups.has('其他')) {
            domainGroups.set('其他', []);
          }
          domainGroups.get('其他')!.push(tab);
        }
      });

      // 保存操作前的状态用于撤销
      const now = typeof window !== 'undefined' ? Date.now() : 1640995200000;
      setLastOperation({
        id: `domain_group_${now}`,
        type: 'batch',
        description: `按域名分组 ${selectedTabsData.length} 个标签页`,
        beforeSnapshot: { tabs: [...tabs], groups: [...groups] },
        afterSnapshot: { tabs: [], groups: [] }, // 将在操作完成后更新
        timestamp: now,
        canUndo: true,
      });

      const newGroups: Group[] = [];
      const updatedTabs = [...tabs];
      let groupsCreated = 0;

      // 为每个域名创建分组（只为有多个标签页的域名创建分组）
      for (const [domain, domainTabs] of domainGroups) {
        if (domainTabs.length > 1) {
          // 检查是否已存在同名分组
          let groupName = domain === '其他' ? '其他网站' : formatDomainName(domain);
          let existingGroup = groups.find(g => g.name === groupName);
          
          if (!existingGroup) {
            // 创建新分组
            const now = typeof window !== 'undefined' ? Date.now() : 1640995200000;
            const random = typeof window !== 'undefined' ? Math.random().toString(36).substr(2, 9) : 'static123';
            const newGroup: Group = {
              id: `domain_group_${now}_${random}`,
              name: groupName,
              createdTime: now,
              isLocked: false,
              isExpanded: true,
              sortOrder: groups.length + newGroups.length,
            };
            newGroups.push(newGroup);
            existingGroup = newGroup;
            groupsCreated++;
          }

          // 将标签页分配到分组
          domainTabs.forEach(tab => {
            const tabIndex = updatedTabs.findIndex(t => t.id === tab.id);
            if (tabIndex >= 0) {
              updatedTabs[tabIndex] = { ...updatedTabs[tabIndex], groupId: existingGroup!.id };
            }
          });
        }
      }

      // 更新状态
      setGroups(prevGroups => [...prevGroups, ...newGroups]);
      setTabs(updatedTabs);
      setSelectedTabs([]);
      
      // 设置新分组的展开状态
      if (newGroups.length > 0) {
        setExpandedGroups(prev => {
          const newExpanded = { ...prev };
          newGroups.forEach(group => {
            newExpanded[group.id] = true;
          });
          return newExpanded;
        });
      }

      // 更新撤销操作的after状态
      if (lastOperation) {
        setLastOperation(prev => prev ? {
          ...prev,
          afterSnapshot: { tabs: updatedTabs, groups: [...groups, ...newGroups] }
        } : null);
      }

      addToast(
        `成功创建 ${groupsCreated} 个域名分组，分组了 ${selectedTabsData.length} 个标签页`,
        'success',
        '按域名分组完成',
        undoLastOperation
      );

      console.log(`按域名分组完成: 创建了 ${groupsCreated} 个分组`);
    } catch (error) {
      console.error('按域名分组失败:', error);
      addToast('按域名分组失败', 'error');
    }
  };

  // 格式化域名为友好的分组名称
  const formatDomainName = (domain: string): string => {
    // 移除常见后缀
    let name = domain.replace(/\.(com|org|net|cn|io|co)$/, '');
    
    // 处理特殊域名
    const domainMap: Record<string, string> = {
      'github': 'GitHub',
      'stackoverflow': 'Stack Overflow',
      'youtube': 'YouTube',
      'google': 'Google',
      'baidu': '百度',
      'zhihu': '知乎',
      'bilibili': 'B站',
      'taobao': '淘宝',
      'jd': '京东',
    };
    
    if (domainMap[name]) {
      return domainMap[name];
    }
    
    // 首字母大写
    name = name.charAt(0).toUpperCase() + name.slice(1);
    
    // 限制长度
    return name.length > 12 ? name.substring(0, 12) : name;
  };

  return (
    <DragInsertProvider>
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
      <div className="min-h-screen bg-white" suppressHydrationWarning>
      {/* 加载状态显示 */}
      {isLoading && (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">正在初始化应用...</p>
            {showInitDebug && (
              <div className="mt-6 text-left max-w-lg mx-auto">
                <div className="text-sm text-gray-700">
                  <div className="mb-2">环境: {envInfo.isExtensionEnv ? '扩展' : '独立Web'}</div>
                  <div>Chrome API: {envInfo.chromeAvailable ? '可用' : '不可用'}</div>
                  <div>runtime: {envInfo.runtimeAvailable ? '可用' : '不可用'}，storage: {envInfo.storageAvailable ? '可用' : '不可用'}</div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>客户端: {initSteps.client}</div>
                  <div>ChromeService: {initSteps.chromeService}</div>
                  <div>扩展桥梁: {initSteps.extensionBridge}</div>
                  <div>存储: {initSteps.storage}</div>
                  <div>ChromeAPI: {initSteps.chromeAPI}</div>
                  <div>AI服务: {initSteps.ai}</div>
                  <div>同步: {initSteps.sync}</div>
                  <div>数据加载: {initSteps.dataLoad}</div>
                </div>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button onClick={manualInit} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">重试初始化</button>
                  <button onClick={() => { setShowInitDebug(false); setIsLoading(false); setTabs([]); setGroups([]); setExpandedGroups({ ungrouped: true }); addToast('已跳过初始化，使用空数据模式','warning'); }} className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-800">跳过初始化</button>
                  <button onClick={() => { const info = JSON.stringify({ envInfo, initSteps, initStartTime }, null, 2); if (navigator.clipboard) { navigator.clipboard.writeText(info).then(() => addToast('调试信息已复制','success')).catch(() => addToast('复制失败','error')); } else { const ta = document.createElement('textarea'); ta.value = info; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); addToast('调试信息已复制','success'); } }} className="px-3 py-2 bg-slate-500 text-white rounded hover:bg-slate-600">复制调试信息</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 错误状态显示 */}
      {error && (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-error-warning-line text-red-500 text-2xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">应用初始化失败</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              重新加载
            </button>
          </div>
        </div>
      )}
      
      <TopToolbar
        onImport={handleImport}
        onExport={handleExport}
        onRefresh={handleRefresh}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <ActionToolbar
        selectedCount={selectedTabs.length}
        isAllSelected={isAllSelected}
        onSelectAll={handleSelectAll}
        onBatchRestore={handleBatchRestore}
        onBatchDelete={handleBatchDelete}
        onAddToGroup={handleAddToGroup}
        onSmartGroup={handleSmartGroup}
        onDomainGroup={handleDomainGroup}
        onCreateGroup={handleCreateGroup}
      />

      <div className="p-4 pb-20">
        {/* 未分组区域 */}
        <TabGroup
          title="未分组"
          tabs={ungroupedTabs}
          count={ungroupedTabs.length}
          selectedTabs={selectedTabs}
          onSelectTab={handleSelectTab}
          onDeleteTab={handleDeleteTab}
          onOpenTab={handleOpenTab}
          onSelectAll={handleGroupSelectAll}
          onToggleGroup={() => handleToggleGroup('ungrouped')}
          isExpanded={expandedGroups.ungrouped}
          groupId="ungrouped"
          isDragDisabled={false}
          activeId={activeId}
          isHighlighted={dragOverGroupId === 'ungrouped'}
          draggedTabLeftOriginalGroup={draggedTabLeftOriginalGroup}
          hoveredTabId={hoveredTabId}
          onTabHover={handleTabHover}
          insertIndicators={insertIndicators}
        />

        {/* 已分组区域 */}
        {groups.map(group => {
          const groupTabs = getGroupTabs(group.id);
          return (
            <TabGroup
              key={group.id}
              title={group.name}
              tabs={groupTabs}
              count={groupTabs.length}
              createdTime={group.createdTime}
              color={group.color}
              isLocked={group.isLocked}
              canEdit={true}
              selectedTabs={selectedTabs}
              onSelectTab={handleSelectTab}
              onDeleteTab={handleDeleteTab}
              onOpenTab={handleOpenTab}
              onSelectAll={handleGroupSelectAll}
              onToggleGroup={() => handleToggleGroup(group.id)}
              isExpanded={expandedGroups[group.id]}
              onDeleteGroup={handleDeleteGroup}
              onEditGroup={handleEditGroup}
              onToggleLock={handleToggleLock}
              groupId={group.id}
              isDragDisabled={false}
              activeId={activeId}
              isHighlighted={dragOverGroupId === group.id}
              draggedTabLeftOriginalGroup={draggedTabLeftOriginalGroup}
              hoveredTabId={hoveredTabId}
              onTabHover={handleTabHover}
              insertIndicators={insertIndicators}
            />
          );
        })}

        {filteredTabs.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <i className="ri-search-line text-gray-300 text-4xl"></i>
            </div>
            <p className="text-gray-500">未找到匹配的标签页</p>
          </div>
        )}
        
        {/* 开发模式工具 - 仅在开发环境显示 */}
        <ClientOnly>
          <DevTools
            onResetMockData={async () => {
              const storageService = getStorageService();
              await storageService.resetToMockData();
              await loadData();
            }}
            onAddToast={addToast}
          />
        </ClientOnly>
        

      </div>

      <StatusBar selectedCount={selectedTabs.length} />
      
      {/* Toast 提示 - 只在客户端渲染 */}
        <ClientOnly>
          <ToastManager
            toasts={toasts}
            onRemoveToast={removeToast}
          />
        </ClientOnly>
      
      {/* 分组管理对话框 */}
      {showGroupDialog && (
        <GroupManagementDialog
          isOpen={showGroupDialog}
          onClose={() => {
            setShowGroupDialog(false);
            setEditingGroup(null);
          }}
          mode={editingGroup ? 'edit' : 'create'}
          group={editingGroup || undefined}
          selectedTabs={selectedTabs.map(id => tabs.find(tab => tab.id === id)).filter(Boolean) as Tab[]}
          existingGroups={groups}
          onCreateGroup={handleCreateGroupSubmit}
          onUpdateGroup={handleUpdateGroupSubmit}
        />
      )}
      </div>
      
      {/* 拖拽覆盖层 - 允许拖拽虚影在整个页面范围内移动 */}
      <DragOverlay>
        {activeId ? (
          (() => {
            const draggedTab = tabs.find(tab => tab.id === activeId);
            if (draggedTab) {
              return (
                <TabItem
                  id={draggedTab.id}
                  title={draggedTab.title}
                  url={draggedTab.url}
                  favicon={draggedTab.favicon}
                  isSelected={false}
                  onSelect={() => {}}
                  groupId={draggedTab.groupId}
                  isDragDisabled={false}
                  activeId={activeId}
                  draggedTabLeftOriginalGroup={draggedTabLeftOriginalGroup}
                />
              );
            }
            return null;
          })()
        ) : null}
      </DragOverlay>
      </DndContext>
    </DragInsertProvider>
  );
}

const manualInit = async () => {
  try {
    console.log('🔁 手动重试初始化');
    setShowInitDebug(false);
    setIsLoading(true);
    setError(null);
    setInitSteps(prev => ({
      ...prev,
      chromeService: 'pending',
      extensionBridge: 'pending',
      storage: 'pending',
      chromeAPI: 'pending',
      ai: 'pending',
      sync: 'pending',
      dataLoad: 'pending'
    }));

    const isExtensionEnv = isChromeExtensionEnvironment();
    await ChromeService.initialize();
    setInitSteps(prev => ({ ...prev, chromeService: 'ok' }));
    if (isExtensionEnv) {
      await initializeExtensionBridge();
      setInitSteps(prev => ({ ...prev, extensionBridge: 'ok' }));
    } else {
      setInitSteps(prev => ({ ...prev, extensionBridge: 'skip' }));
    }
    await initializeStorage();
    setInitSteps(prev => ({ ...prev, storage: 'ok' }));
    await initializeChromeAPI();
    setInitSteps(prev => ({ ...prev, chromeAPI: 'ok' }));
    await initializeAIService();
    setInitSteps(prev => ({ ...prev, ai: 'ok' }));
    await initializeSyncService();
    setInitSteps(prev => ({ ...prev, sync: 'ok' }));
    setupSyncListeners();
    const dataLoaded = await loadData();
    setInitSteps(prev => ({ ...prev, dataLoad: dataLoaded ? 'ok' : 'fail' }));
    setIsLoading(false);
  } catch (e) {
    console.error('手动初始化失败:', e);
    setError(e instanceof Error ? e.message : String(e));
    setIsLoading(false);
    setShowInitDebug(true);
  }
};
