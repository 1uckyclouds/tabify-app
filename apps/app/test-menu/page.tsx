'use client';

import { useState } from 'react';
import TabGroup from '@/components/TabGroup';
import { Tab, TabGroup as TabGroupType } from '@/lib/types';

// 丰富的模拟数据
const mockTabs: Tab[] = [
  {
    id: '1',
    title: 'GitHub - React项目',
    url: 'https://github.com/facebook/react',
    favicon: 'https://github.com/favicon.ico',
    groupId: 'dev-tools',
    isActive: false
  },
  {
    id: '2', 
    title: 'Stack Overflow - JavaScript问题',
    url: 'https://stackoverflow.com/questions/tagged/javascript',
    favicon: 'https://stackoverflow.com/favicon.ico',
    groupId: 'dev-tools',
    isActive: true
  },
  {
    id: '3',
    title: 'MDN Web Docs - CSS Grid',
    url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout',
    favicon: 'https://developer.mozilla.org/favicon.ico',
    groupId: 'dev-tools',
    isActive: false
  },
  {
    id: '4',
    title: 'YouTube - 编程教程',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    favicon: 'https://www.youtube.com/favicon.ico',
    groupId: 'learning',
    isActive: false
  },
  {
    id: '5',
    title: 'Coursera - Web开发课程',
    url: 'https://www.coursera.org/learn/web-development',
    favicon: 'https://www.coursera.org/favicon.ico',
    groupId: 'learning',
    isActive: false
  },
  {
    id: '6',
    title: 'Gmail - 收件箱',
    url: 'https://mail.google.com/mail/u/0/#inbox',
    favicon: 'https://mail.google.com/favicon.ico',
    groupId: 'productivity',
    isActive: false
  },
  {
    id: '7',
    title: 'Notion - 项目管理',
    url: 'https://www.notion.so/workspace',
    favicon: 'https://www.notion.so/favicon.ico',
    groupId: 'productivity',
    isActive: false
  },
  {
    id: '8',
    title: 'Figma - UI设计',
    url: 'https://www.figma.com/files/recent',
    favicon: 'https://www.figma.com/favicon.ico',
    groupId: 'design',
    isActive: false
  },
  {
    id: '9',
    title: 'Dribbble - 设计灵感',
    url: 'https://dribbble.com/',
    favicon: 'https://dribbble.com/favicon.ico',
    groupId: 'design',
    isActive: false
  },
  {
    id: '10',
    title: 'Netflix - 在线观看',
    url: 'https://www.netflix.com/browse',
    favicon: 'https://www.netflix.com/favicon.ico',
    groupId: null,
    isActive: false
  }
];

const mockGroups: TabGroupType[] = [
  {
    id: 'dev-tools',
    name: '开发工具',
    color: '#3b82f6',
    tabIds: ['1', '2', '3']
  },
  {
    id: 'learning',
    name: '学习资源',
    color: '#10b981',
    tabIds: ['4', '5']
  },
  {
    id: 'productivity',
    name: '生产力工具',
    color: '#f59e0b',
    tabIds: ['6', '7']
  },
  {
    id: 'design',
    name: '设计工具',
    color: '#ef4444',
    tabIds: ['8', '9']
  }
];

export default function TestMenuPage() {
  const [tabs, setTabs] = useState<Tab[]>(mockTabs);
  const [groups, setGroups] = useState<TabGroupType[]>(mockGroups);
  const [hoveredTabId, setHoveredTabId] = useState<string | null>(null);
  const [selectedTabs, setSelectedTabs] = useState<string[]>([]);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const handleTabHover = (tabId: string | null) => {
    setHoveredTabId(tabId);
    setDebugInfo(`悬停标签页: ${tabId || '无'}`);
  };

  const handleDeleteTab = (tabId: string) => {
    setTabs(prev => prev.filter(tab => tab.id !== tabId));
    setDebugInfo(`删除标签页: ${tabId}`);
  };

  const handleOpenTab = (tabId: string) => {
    setDebugInfo(`打开标签页: ${tabId}`);
  };

  const handleCopyUrl = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      navigator.clipboard.writeText(tab.url);
      setDebugInfo(`复制URL: ${tab.url}`);
    }
  };

  const handleAddToGroup = (tabId: string, groupId: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId ? { ...tab, groupId } : tab
    ));
    setDebugInfo(`添加到分组: 标签页${tabId} -> 分组${groupId}`);
  };

  const handleSelectTab = (tabId: string, selected: boolean) => {
    setSelectedTabs(prev => 
      selected 
        ? [...prev, tabId]
        : prev.filter(id => id !== tabId)
    );
    setDebugInfo(`${selected ? '选中' : '取消选中'}标签页: ${tabId}`);
  };

  const handleSelectAll = (tabIds: string[]) => {
    const allSelected = tabIds.every(id => selectedTabs.includes(id));
    if (allSelected) {
      setSelectedTabs(prev => prev.filter(id => !tabIds.includes(id)));
      setDebugInfo('取消全选');
    } else {
      setSelectedTabs(prev => [...new Set([...prev, ...tabIds])]);
      setDebugInfo('全选标签页');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题和说明 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            更多菜单测试环境
          </h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              测试说明
            </h2>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>• 点击标签页右侧的三个点按钮打开更多菜单</li>
              <li>• 将鼠标移出菜单区域，观察是否在200ms后自动收起</li>
              <li>• 测试鼠标在按钮和菜单之间移动时菜单是否保持打开</li>
              <li>• 点击空白处或菜单项应立即收起菜单</li>
              <li>• 观察下方的调试信息了解当前状态</li>
            </ul>
          </div>
        </div>

        {/* 调试信息面板 */}
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            调试信息
          </h3>
          <div className="text-sm text-gray-600">
            <div>当前悬停标签页: {hoveredTabId || '无'}</div>
            <div>最近操作: {debugInfo || '无'}</div>
            <div>标签页总数: {tabs.length}</div>
            <div>分组总数: {groups.length}</div>
          </div>
        </div>

        {/* 标签页组件 */}
        <div className="space-y-6">
          {groups.map(group => {
            const groupTabs = tabs.filter(tab => tab.groupId === group.id);
            if (groupTabs.length === 0) return null;
            
            return (
              <div key={group.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-lg font-semibold mb-3" style={{ color: group.color }}>
                  {group.name} ({groupTabs.length}个标签页)
                </h3>
                <TabGroup
                  tabs={groupTabs}
                  title={group.name}
                  color={group.color}
                  selectedTabs={selectedTabs}
                  onSelect={handleSelectTab}
                  onSelectAll={handleSelectAll}
                  hoveredTabId={hoveredTabId}
                  onTabHover={handleTabHover}
                  onDeleteTab={handleDeleteTab}
                  onOpenTab={handleOpenTab}
                  onCopyUrl={handleCopyUrl}
                  onAddToGroup={handleAddToGroup}
                  groups={groups}
                  groupId={group.id}
                />
              </div>
            );
          })}
          
          {/* 未分组的标签页 */}
          {(() => {
            const ungroupedTabs = tabs.filter(tab => !tab.groupId);
            if (ungroupedTabs.length === 0) return null;
            
            return (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">
                  未分组标签页 ({ungroupedTabs.length}个)
                </h3>
                <TabGroup
                  tabs={ungroupedTabs}
                  title="未分组"
                  selectedTabs={selectedTabs}
                  onSelect={handleSelectTab}
                  onSelectAll={handleSelectAll}
                  hoveredTabId={hoveredTabId}
                  onTabHover={handleTabHover}
                  onDeleteTab={handleDeleteTab}
                  onOpenTab={handleOpenTab}
                  onCopyUrl={handleCopyUrl}
                  onAddToGroup={handleAddToGroup}
                  groups={groups}
                />
              </div>
            );
          })()
          }
        </div>

        {/* 功能测试区域 */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            功能验证清单
          </h3>
          <div className="text-yellow-800 text-sm space-y-1">
            <div>□ 更多菜单能正常打开</div>
            <div>□ 鼠标移出菜单区域后自动收起（200ms延迟）</div>
            <div>□ 鼠标在按钮和菜单间移动时菜单保持打开</div>
            <div>□ 点击空白处立即收起菜单</div>
            <div>□ 点击菜单项后立即收起菜单</div>
            <div>□ 同时只有一个菜单处于打开状态</div>
            <div>□ 调试信息正确显示当前状态</div>
          </div>
        </div>
      </div>
    </div>
  );
}