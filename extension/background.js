/**
 * Tabify Chrome扩展 - 后台脚本
 * 负责处理标签页收纳、快捷键响应、右键菜单等核心功能
 */

/**
 * 检查Chrome API是否可用
 * @param {string} apiName - API名称
 * @returns {boolean} API是否可用
 */
function isApiAvailable(apiName) {
  try {
    const apiPath = apiName.split('.');
    let current = chrome;
    for (const path of apiPath) {
      if (!current || !current[path]) {
        console.warn(`Chrome API ${apiName} 不可用`);
        return false;
      }
      current = current[path];
    }
    return true;
  } catch (error) {
    console.error(`检查API ${apiName} 时出错:`, error);
    return false;
  }
}

/**
 * 安全执行Chrome API调用
 * @param {Function} apiCall - API调用函数
 * @param {string} apiName - API名称（用于日志）
 * @returns {Promise} API调用结果
 */
async function safeApiCall(apiCall, apiName) {
  try {
    return await apiCall();
  } catch (error) {
    console.error(`${apiName} API调用失败:`, error);
    throw error;
  }
}

// 扩展安装时的初始化
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Tabify扩展已安装/更新:', details.reason);

  // 初始化存储数据
  initializeStorage();

  // 创建右键菜单
  createContextMenus();
});

/**
 * 初始化本地存储数据结构
 */
async function initializeStorage() {
  try {
    const result = await chrome.storage.local.get(['tabs', 'groups', 'settings']);

    // 如果没有数据，创建默认结构
    if (!result.tabs) {
      await chrome.storage.local.set({ tabs: [] });
    }

    if (!result.groups) {
      await chrome.storage.local.set({ groups: [] });
    }

    if (!result.settings) {
      const defaultSettings = {
        theme: 'light',
        autoCollect: false,
        aiEnabled: false,
        apiKey: '',
        apiEndpoint: 'https://api.openai.com/v1/chat/completions'
      };
      await chrome.storage.local.set({ settings: defaultSettings });
    }

    console.log('存储初始化完成');
  } catch (error) {
    console.error('存储初始化失败:', error);
  }
}

/**
 * 创建右键菜单
 */
function createContextMenus() {
  if (!isApiAvailable('contextMenus')) {
    console.warn('contextMenus API不可用，跳过菜单创建');
    return;
  }

  // 清除现有菜单
  safeApiCall(() => {
    return new Promise((resolve) => {
      chrome.contextMenus.removeAll(() => {
        // 收纳当前标签页
        chrome.contextMenus.create({
          id: 'collect-current-tab',
          title: '仅收纳当前标签页',
          contexts: ['action']
        });

        // 收纳左侧所有标签页
        chrome.contextMenus.create({
          id: 'collect-left-tabs',
          title: '收纳左侧所有标签页',
          contexts: ['action']
        });

        // 收纳右侧所有标签页
        chrome.contextMenus.create({
          id: 'collect-right-tabs',
          title: '收纳右侧所有标签页',
          contexts: ['action']
        });

        // 分隔线
        chrome.contextMenus.create({
          id: 'separator1',
          type: 'separator',
          contexts: ['action']
        });

        // 打开管理界面
        chrome.contextMenus.create({
          id: 'open-manager',
          title: '打开管理界面',
          contexts: ['action']
        });

        resolve();
      });
    });
  }, 'contextMenus').catch(error => {
    console.error('创建右键菜单失败:', error);
  });
}

/**
 * 处理右键菜单点击事件
 */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  switch (info.menuItemId) {
    case 'collect-current-tab':
      await collectCurrentTab(tab);
      break;
    case 'collect-left-tabs':
      await collectLeftTabs(tab);
      break;
    case 'collect-right-tabs':
      await collectRightTabs(tab);
      break;
    case 'open-manager':
      await openManager();
      break;
  }
});

/**
 * 处理快捷键命令
 */
chrome.commands.onCommand.addListener(async (command) => {
  switch (command) {
    case 'collect-tabs':
      await collectAllTabs();
      break;
    case 'open-manager':
      await openManager();
      break;
  }
});

/**
 * 处理扩展图标点击事件
 * 用户需求：收纳当前窗口所有标签页 -> 关闭原标签页 -> 放入未分组 -> 打开管理界面
 */
chrome.action.onClicked.addListener(async (tab) => {
  console.log('扩展图标被点击，开始执行收纳当前窗口标签页和打开管理界面');

  try {
    // 收纳当前窗口的所有标签页（不是所有窗口）
    console.log('开始收纳当前窗口的所有标签页...');
    await collectCurrentWindowTabs();
    console.log('当前窗口标签页收纳完成，等待500ms后打开管理界面...');

    // 添加延迟确保标签页关闭操作完成
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('开始打开管理界面...');
    await openManager();
    console.log('管理界面打开完成');
  } catch (error) {
    console.error('扩展图标点击处理失败:', error);
    showNotification('操作失败', '收纳标签页或打开管理界面时发生错误');
  }
});

/**
 * 收纳当前标签页
 * @param {chrome.tabs.Tab} tab - 要收纳的标签页
 */
async function collectCurrentTab(tab) {
  try {
    if (!tab || !tab.url || tab.url.startsWith('chrome://')) {
      console.log('跳过系统标签页:', tab?.url);
      return;
    }

    // 获取标签页信息
    const tabData = {
      id: generateTabId(),
      title: tab.title || tab.url,
      url: tab.url,
      favicon: tab.favIconUrl || '',
      groupId: undefined,
      collectedAt: Date.now()
    };

    // 保存到存储
    await saveTabToStorage(tabData);

    // 关闭标签页
    await chrome.tabs.remove(tab.id);

    console.log('已收纳标签页:', tabData.title);

    // 通知管理界面数据已更新
    await notifyDataChanged('collect', { tabs: [tabData] });

    // 显示通知
    showNotification('标签页已收纳', `已收纳: ${tabData.title}`);

    // 自动打开管理界面
    console.log('收纳完成，自动打开管理界面...');
    await openManager();

  } catch (error) {
    console.error('收纳标签页失败:', error);
    showNotification('收纳失败', '收纳标签页时发生错误');
  }
}

/**
 * 收纳当前窗口的所有标签页（除了当前活动标签页）
 */
async function collectCurrentWindowTabs() {
  try {
    console.log('🔄 开始收纳当前窗口标签页...');

    // 获取当前窗口的所有标签页
    const tabs = await chrome.tabs.query({ currentWindow: true });

    // 过滤掉当前活动标签页
    const tabsToCollect = tabs.filter(tab => !tab.active);

    if (tabsToCollect.length === 0) {
      console.log('当前窗口没有可收纳的标签页');
      showNotification('提示', '当前窗口没有可收纳的标签页');
      return;
    }

    console.log(`📋 准备收纳 ${tabsToCollect.length} 个标签页:`, tabsToCollect.map(t => t.title));

    // 保存标签页到存储
    await saveTabsToStorage(tabsToCollect);

    // 关闭标签页
    const tabIds = tabsToCollect.map(tab => tab.id);
    await chrome.tabs.remove(tabIds);

    console.log(`✅ 已收纳当前窗口的 ${tabsToCollect.length} 个标签页`);

    // 显示通知
    showNotification(
      '收纳完成',
      `已收纳当前窗口的 ${tabsToCollect.length} 个标签页`
    );

    // 通知数据变更
    console.log('📢 通知数据变更...');
    notifyDataChanged('collect', { tabs: tabsToCollect });

    // 自动打开管理界面
    console.log('🚀 自动打开管理界面...');
    await openManager();

    console.log('🎉 收纳流程完成');
  } catch (error) {
    console.error('❌ 收纳当前窗口标签页失败:', error);
    showNotification('错误', '收纳标签页失败');
  }
}

/**
 * 收纳所有标签页（保留原函数以兼容其他调用）
 */
async function collectAllTabs() {
  // 重定向到收纳当前窗口标签页
  return await collectCurrentWindowTabs();
}

/**
 * 收纳左侧所有标签页
 * @param {chrome.tabs.Tab} currentTab - 当前标签页
 */
async function collectLeftTabs(currentTab) {
  try {
    // 获取当前窗口的所有标签页
    const tabs = await chrome.tabs.query({ currentWindow: true });

    // 按index排序，确保顺序正确
    tabs.sort((a, b) => a.index - b.index);

    const collectedTabs = [];
    const tabsToClose = [];

    // 找到当前标签页的位置
    const currentIndex = tabs.findIndex(tab => tab.id === currentTab.id);

    if (currentIndex === -1) {
      showNotification('收纳失败', '无法找到当前标签页');
      return;
    }

    // 收纳左侧的所有标签页（index < currentIndex）
    for (let i = 0; i < currentIndex; i++) {
      const tab = tabs[i];

      // 跳过系统页面
      if (tab.url.startsWith('chrome://') ||
          tab.url.startsWith('chrome-extension://') ||
          tab.url.includes('manager.html')) {
        continue;
      }

      // 准备标签页数据
      const tabData = {
        id: generateTabId(),
        title: tab.title || tab.url,
        url: tab.url,
        favicon: tab.favIconUrl || '',
        groupId: undefined,
        collectedAt: Date.now()
      };

      collectedTabs.push(tabData);
      tabsToClose.push(tab.id);
    }

    if (collectedTabs.length === 0) {
      showNotification('无标签页可收纳', '当前标签页左侧没有可收纳的标签页');
      return;
    }

    // 批量保存到存储
    await saveTabsToStorage(collectedTabs);

    // 批量关闭标签页
    if (tabsToClose.length > 0) {
      await chrome.tabs.remove(tabsToClose);
    }

    console.log(`已收纳左侧 ${collectedTabs.length} 个标签页`);

    // 通知管理界面数据已更新
    await notifyDataChanged('collect', { tabs: collectedTabs });

    // 显示通知
    showNotification(
      '左侧标签页收纳完成',
      `已收纳左侧 ${collectedTabs.length} 个标签页`
    );

    // 自动打开管理界面
    console.log('收纳完成，自动打开管理界面...');
    await openManager();

  } catch (error) {
    console.error('收纳左侧标签页失败:', error);
    showNotification('收纳失败', '收纳左侧标签页时发生错误');
  }
}

/**
 * 收纳右侧所有标签页
 * @param {chrome.tabs.Tab} currentTab - 当前标签页
 */
async function collectRightTabs(currentTab) {
  try {
    // 获取当前窗口的所有标签页
    const tabs = await chrome.tabs.query({ currentWindow: true });

    // 按index排序，确保顺序正确
    tabs.sort((a, b) => a.index - b.index);

    const collectedTabs = [];
    const tabsToClose = [];

    // 找到当前标签页的位置
    const currentIndex = tabs.findIndex(tab => tab.id === currentTab.id);

    if (currentIndex === -1) {
      showNotification('收纳失败', '无法找到当前标签页');
      return;
    }

    // 收纳右侧的所有标签页（index > currentIndex）
    for (let i = currentIndex + 1; i < tabs.length; i++) {
      const tab = tabs[i];

      // 跳过系统页面
      if (tab.url.startsWith('chrome://') ||
          tab.url.startsWith('chrome-extension://') ||
          tab.url.includes('manager.html')) {
        continue;
      }

      // 准备标签页数据
      const tabData = {
        id: generateTabId(),
        title: tab.title || tab.url,
        url: tab.url,
        favicon: tab.favIconUrl || '',
        groupId: undefined,
        collectedAt: Date.now()
      };

      collectedTabs.push(tabData);
      tabsToClose.push(tab.id);
    }

    if (collectedTabs.length === 0) {
      showNotification('无标签页可收纳', '当前标签页右侧没有可收纳的标签页');
      return;
    }

    // 批量保存到存储
    await saveTabsToStorage(collectedTabs);

    // 批量关闭标签页
    if (tabsToClose.length > 0) {
      await chrome.tabs.remove(tabsToClose);
    }

    console.log(`已收纳右侧 ${collectedTabs.length} 个标签页`);

    // 通知管理界面数据已更新
    await notifyDataChanged('collect', { tabs: collectedTabs });

    // 显示通知
    showNotification(
      '右侧标签页收纳完成',
      `已收纳右侧 ${collectedTabs.length} 个标签页`
    );

    // 自动打开管理界面
    console.log('收纳完成，自动打开管理界面...');
    await openManager();

  } catch (error) {
    console.error('收纳右侧标签页失败:', error);
    showNotification('收纳失败', '收纳右侧标签页时发生错误');
  }
}

/**
 * 检测是否为开发环境
 * @returns {boolean} 是否为开发环境
 */
function isDevelopmentEnvironment() {
  // 检测方法1: 扩展ID是否为开发环境的临时ID（通常以字母开头）
  const extensionId = chrome.runtime.id;
  const isDevId = /^[a-z]/.test(extensionId);

  // 检测方法2: 检查manifest中是否有开发环境标识
  const manifest = chrome.runtime.getManifest();
  const isDevVersion = manifest.version.includes('dev') || manifest.version === '1.0.0';

  console.log('环境检测 - 扩展ID:', extensionId, '是否开发ID:', isDevId);
  console.log('环境检测 - 版本:', manifest.version, '是否开发版本:', isDevVersion);

  return isDevId || isDevVersion;
}

/**
 * 打开标签页管理界面
 * 直接使用构建好的React应用HTML文件，不再使用iframe方案
 */
async function openManager() {
  console.log('🚀 openManager函数被调用');

  if (!isApiAvailable('tabs') || !isApiAvailable('runtime')) {
    console.error('❌ tabs或runtime API不可用，无法打开管理界面');
    return;
  }

  try {
    console.log('✅ API检查通过，开始打开管理界面');

    // 直接打开构建好的manager.html（包含完整的React应用）
    console.log('📂 直接加载React应用HTML文件');
    await openDirectManager();

    console.log('🎉 openManager函数执行完成');
  } catch (error) {
    console.error('❌ 打开管理界面失败:', error);
    // 显示错误通知
    showNotification('打开管理界面失败', error.message || '未知错误');
  }
}

/**
 * 直接打开React应用管理界面
 * 简化的实现，直接加载构建好的manager.html
 */
async function openDirectManager() {
  console.log('📂 openDirectManager函数开始执行');

  const managerUrl = chrome.runtime.getURL('build/manager.html');
  console.log('🔗 管理界面URL:', managerUrl);

  console.log('🔍 查询现有管理界面标签页...');
  const existingTabs = await safeApiCall(() => {
    return chrome.tabs.query({
      url: managerUrl
    });
  }, 'tabs.query');

  console.log('📊 现有管理界面标签页数量:', existingTabs.length);

  if (existingTabs.length > 0) {
    // 如果已经有管理界面标签页，激活第一个
    const existingTab = existingTabs[0];
    console.log('🎯 激活现有管理界面标签页:', existingTab.id, existingTab.url);

    await safeApiCall(() => {
      return chrome.tabs.update(existingTab.id, { active: true });
    }, 'tabs.update');

    await safeApiCall(() => {
      return chrome.windows.update(existingTab.windowId, { focused: true });
    }, 'windows.update');

    console.log('✅ 已激活现有管理界面');
  } else {
    // 创建新的管理界面标签页
    console.log('🆕 创建新的管理界面标签页');

    const newTab = await safeApiCall(() => {
      return chrome.tabs.create({
        url: managerUrl,
        active: true
      });
    }, 'tabs.create');

    console.log('✅ 新管理界面标签页已创建:', newTab.id, newTab.url);
    showNotification('管理界面已打开', '标签页管理器已启动');
  }

  console.log('🎉 openDirectManager函数执行完成');
}

/**
 * 保存单个标签页到存储
 * @param {Object} tabData - 标签页数据
 */
async function saveTabToStorage(tabData) {
  try {
    const result = await chrome.storage.local.get(['tabs']);
    const tabs = result.tabs || [];

    tabs.unshift(tabData); // 添加到开头

    await chrome.storage.local.set({ tabs });
  } catch (error) {
    console.error('保存标签页失败:', error);
    throw error;
  }
}

/**
 * 批量保存标签页到存储
 * @param {Array} tabsData - 标签页数据数组
 */
async function saveTabsToStorage(tabsData) {
  try {
    const result = await chrome.storage.local.get(['tabs']);
    const existingTabs = result.tabs || [];

    // 将新标签页添加到开头
    const updatedTabs = [...tabsData.map(tab => ({
      id: generateTabId(),
      title: tab.title || tab.url,
      url: tab.url,
      favicon: tab.favIconUrl || '',
      groupId: undefined,
      collectedAt: Date.now()
    })), ...existingTabs];

    await chrome.storage.local.set({ tabs: updatedTabs });
  } catch (error) {
    console.error('批量保存标签页失败:', error);
    throw error;
  }
}

/**
 * 生成唯一的标签页ID
 * @returns {string} 唯一ID
 */
function generateTabId() {
  return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 显示系统通知
 * @param {string} title - 通知标题
 * @param {string} message - 通知内容
 */
function showNotification(title, message) {
  if (!isApiAvailable('notifications')) {
    console.warn('notifications API不可用，使用控制台输出替代:', title, message);
    return;
  }

  safeApiCall(() => {
    return chrome.notifications.create({
      type: 'basic',
      iconUrl: 'build/icons/icon48.png',
      title: title,
      message: message
    });
  }, 'notifications').catch(error => {
    console.error('显示通知失败:', error);
    console.log('通知内容:', title, message);
  });
}

/**
 * 恢复单个标签页
 * @param {Object} tab - 标签页数据
 * @param {boolean} active - 是否激活标签页
 */
async function restoreTab(tab, active = true) {
  try {
    const newTab = await chrome.tabs.create({
      url: tab.url,
      active: active
    });

    console.log('已恢复标签页:', tab.title);

    // 显示通知
    showNotification('标签页已恢复', `已恢复: ${tab.title}`);

    return newTab;
  } catch (error) {
    console.error('恢复标签页失败:', error);
    throw error;
  }
}

/**
 * 批量恢复标签页
 * @param {Array} tabs - 标签页数组
 * @param {boolean} activeLast - 是否激活最后一个标签页
 */
async function restoreTabs(tabs, activeLast = true) {
  try {
    const restoredTabs = [];

    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      const shouldActivate = activeLast && i === tabs.length - 1;

      const newTab = await chrome.tabs.create({
        url: tab.url,
        active: shouldActivate
      });

      restoredTabs.push(newTab);

      // 添加小延迟，避免过快创建导致浏览器卡顿
      if (i < tabs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`已批量恢复 ${restoredTabs.length} 个标签页`);

    // 显示通知
    showNotification(
      '批量恢复完成',
      `已恢复 ${restoredTabs.length} 个标签页`
    );

    return restoredTabs;
  } catch (error) {
    console.error('批量恢复标签页失败:', error);
    throw error;
  }
}

/**
 * 处理来自React应用和popup的消息
 * 支持扩展桥梁的所有消息类型
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 处理异步消息的辅助函数
  const handleAsync = async (asyncFunction) => {
    try {
      const result = await asyncFunction();
      sendResponse({
        success: true,
        data: result,
        requestId: request.requestId
      });
    } catch (error) {
      console.error(`消息处理失败 (${request.action}):`, error);
      sendResponse({
        success: false,
        error: error.message,
        requestId: request.requestId
      });
    }
  };

  switch (request.action) {
    // 标签页收纳操作
    case 'collectCurrentTab':
      handleAsync(async () => {
        await collectCurrentTab(request.tab || request.data?.tab);
        return null;
      });
      return true;

    case 'collectAllTabs':
      handleAsync(async () => {
        await collectAllTabs();
        return null;
      });
      return true;

    // 标签页恢复操作
    case 'restoreTab':
      handleAsync(async () => {
        const { tab, active = true } = request.data || {};
        return await restoreTab(tab, active);
      });
      return true;

    case 'restoreTabs':
      handleAsync(async () => {
        const { tabs, activeLast = true } = request.data || {};
        return await restoreTabs(tabs, activeLast);
      });
      return true;

    // 管理界面操作
    case 'openManager':
      handleAsync(async () => {
        await openManager();
        return null;
      });
      return true;

    // 数据存储操作
    case 'getStorageData':
      handleAsync(async () => {
        const keys = request.keys || request.data?.keys;
        const result = await chrome.storage.local.get(keys || null);
        return result;
      });
      return true;

    case 'setStorageData':
      handleAsync(async () => {
        const data = request.data;
        await chrome.storage.local.set(data);

        // 通知所有管理界面标签页数据已更新
        notifyDataChanged('sync', data);

        return null;
      });
      return true;

    // 数据同步操作
    case 'syncData':
      handleAsync(async () => {
        const { tabs, groups } = request.data || {};
        const dataToSync = {};

        if (tabs) dataToSync.tabs = tabs;
        if (groups) dataToSync.groups = groups;

        await chrome.storage.local.set(dataToSync);

        // 通知数据变更
        notifyDataChanged('sync', dataToSync);

        return null;
      });
      return true;

    // 兼容旧版本消息格式
    default:
      console.warn('未知的消息动作:', request.action);
      sendResponse({
        success: false,
        error: '未知的消息动作',
        requestId: request.requestId
      });
      return false;
  }
});

/**
 * 通知所有管理界面标签页和popup数据已更新
 * @param {string} action - 操作类型
 * @param {Object} data - 更新的数据
 */
async function notifyDataChanged(action, data) {
  try {
    console.log(`🔔 开始通知数据变更: ${action}`, data);

    // 创建数据变更事件
    const changeEvent = {
      action: 'dataChanged',
      data: {
        type: 'sync',
        action: action,
        data: data,
        timestamp: Date.now()
      }
    };

    // 1. 通知所有管理界面标签页（包括localhost开发环境和扩展页面）
    const allTabs = await chrome.tabs.query({});
    let notifiedTabs = 0;

    for (const tab of allTabs) {
      // 检查是否是管理界面标签页
      const isManagerTab =
        tab.url.includes('localhost:3000') || // 开发环境
        tab.url.includes(chrome.runtime.getURL('build/manager.html')) || // 扩展页面
        tab.url.includes('tabify') || // 可能的生产环境
        (tab.title && tab.title.includes('Tabify')); // 根据标题判断

      if (isManagerTab) {
        try {
          console.log(`📤 向管理界面标签页发送消息: ${tab.url}`);
          await chrome.tabs.sendMessage(tab.id, changeEvent);
          notifiedTabs++;
        } catch (error) {
          // 忽略发送失败的情况（标签页可能已关闭或无法接收消息）
          console.warn(`⚠️ 向管理界面发送消息失败 (${tab.url}):`, error.message);
        }
      }
    }

    // 2. 通知popup（如果打开的话）
    try {
      console.log('📤 向popup发送消息');
      chrome.runtime.sendMessage(changeEvent).catch(() => {
        // popup可能未打开，忽略错误
        console.log('📝 popup未打开，跳过通知');
      });
    } catch (error) {
      // 忽略popup通知失败
      console.warn('⚠️ popup通知失败:', error.message);
    }

    // 3. 通过广播方式发送消息（确保React应用能收到）
    try {
      console.log('📡 广播数据变更事件');
      // 向所有监听的页面广播消息
      chrome.runtime.sendMessage({
        ...changeEvent,
        broadcast: true
      }).catch(() => {
        // 可能没有监听器，忽略错误
        console.log('📝 没有广播监听器');
      });
    } catch (error) {
      console.warn('⚠️ 广播消息失败:', error.message);
    }

    console.log(`✅ 数据变更通知完成: ${action}, 通知了 ${notifiedTabs} 个管理界面标签页`);
  } catch (error) {
    console.error('❌ 通知数据变更失败:', error);
  }
}

console.log('Tabify后台脚本已加载');