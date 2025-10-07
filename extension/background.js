/**
 * Chrome扩展后台脚本
 * 处理扩展的后台逻辑和事件监听
 */

chrome.runtime.onInstalled.addListener((details) => {
  console.log('Tabify扩展已安装:', details);

  if (details.reason === 'install') {
    // 首次安装时的初始化逻辑
    console.log('首次安装Tabify扩展');
  } else if (details.reason === 'update') {
    // 更新时的逻辑
    console.log('Tabify扩展已更新到版本:', chrome.runtime.getManifest().version);
  }
});

// 处理扩展图标点击事件
chrome.action.onClicked.addListener((tab) => {
  // 打开管理页面
  chrome.action.openPopup();
});

// 监听来自content script或popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('收到消息:', message);

  // 处理不同类型的消息
  switch (message.type) {
    case 'GET_TABS':
      // 获取所有标签页
      chrome.tabs.query({}, (tabs) => {
        sendResponse({ tabs: tabs });
      });
      return true; // 保持消息通道开启

    case 'COLLECT_TAB':
      // 收集当前标签页
      if (sender.tab) {
        chrome.tabs.hide(sender.tab.id, () => {
          sendResponse({ success: true });
        });
      }
      return true;

    default:
      sendResponse({ error: '未知消息类型' });
  }
});

console.log('Tabify后台脚本已加载');