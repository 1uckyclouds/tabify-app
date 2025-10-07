'use client';

import { useState, useRef, useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TabItem from './TabItem';

interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdTime: number;
  isLocked: boolean;
  isExpanded: boolean;
  sortOrder: number;
}

interface TabGroupProps {
  title: string;
  tabs: Tab[];
  count: number;
  createdTime?: string;
  color?: string;
  isLocked?: boolean;
  canEdit?: boolean;
  selectedTabs: string[];
  onSelectTab: (tabId: string, selected: boolean) => void;
  onDeleteTab?: (tabId: string) => void;
  onOpenTab?: (tabId: string) => void;
  onSelectAll: (groupTabs: string[]) => void;
  onToggleGroup?: () => void;
  isExpanded?: boolean;
  onDeleteGroup?: (groupTitle: string, option: 'delete' | 'move') => void;
  onEditGroup?: (group: Group) => void;
  onToggleLock?: (groupId: string, isLocked: boolean) => void;
  groupId?: string;
  isDragDisabled?: boolean;
  activeId?: string | null;
  isHighlighted?: boolean;
  draggedTabLeftOriginalGroup?: boolean;
  /** 全局悬停状态管理 */
  hoveredTabId?: string | null;
  onTabHover?: (id: string | null) => void;
  /** 插入指示器配置 */
  insertIndicators?: Record<string, {
    showBefore: boolean;
    showAfter: boolean;
    type: 'line' | 'zone';
  }>;
}

export default function TabGroup({ 
  title, 
  tabs, 
  count, 
  createdTime, 
  color,
  isLocked = false, 
  canEdit = false,
  selectedTabs,
  onSelectTab,
  onDeleteTab,
  onOpenTab,
  onSelectAll,
  onToggleGroup,
  isExpanded = true,
  onDeleteGroup,
  onEditGroup,
  onToggleLock,
  groupId,
  isDragDisabled = false,
  activeId = null,
  isHighlighted = false,
  draggedTabLeftOriginalGroup = false,
  hoveredTabId = null,
  onTabHover,
  insertIndicators = {}
}: TabGroupProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState(title);
  const [locked, setLocked] = useState(isLocked);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteOption, setDeleteOption] = useState<'delete' | 'move' | null>(null);
  
  // 菜单自动收起的延迟关闭定时器（与 TabItem 保持一致）
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 鼠标进入菜单整体区域：清除关闭定时器
  const handleMenuAreaEnter = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);
  
  // 鼠标离开菜单整体区域：200ms 后自动关闭
  const handleMenuAreaLeave = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => {
      setShowDropdown(false);
      closeTimeoutRef.current = null;
    }, 200);
  }, []);
  
  // 格式化时间戳为友好的时间格式
  const formatCreatedTime = (timeStr?: string): string => {
    if (!timeStr) return '';
    
    // 如果是纯数字字符串（时间戳），转换为友好格式
    if (/^\d+$/.test(timeStr)) {
      const timestamp = parseInt(timeStr);
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffMinutes < 1) {
        return '刚刚';
      } else if (diffMinutes < 60) {
        return `${diffMinutes}分钟前`;
      } else if (diffHours < 24) {
        return `${diffHours}小时前`;
      } else if (diffDays < 7) {
        return `${diffDays}天前`;
      } else {
        return date.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    }
    
    // 如果已经是格式化的时间字符串，直接返回
    return timeStr;
  };
  
  // 根据颜色获取对应的图标颜色类名
  const getIconColorClass = (colorValue?: string): string => {
    if (!colorValue) return 'text-yellow-500'; // 默认黄色
    
    const colorMap: { [key: string]: string } = {
      'red': 'text-red-500',
      'blue': 'text-blue-500',
      'green': 'text-green-500',
      'yellow': 'text-yellow-500',
      'purple': 'text-purple-500',
      'pink': 'text-pink-500',
      'indigo': 'text-indigo-500',
      'orange': 'text-orange-500',
      'teal': 'text-teal-500',
      'cyan': 'text-cyan-500',
      'gray': 'text-gray-500',
      'slate': 'text-slate-500'
    };
    
    return colorMap[colorValue] || 'text-yellow-500';
  };
  
  const tabIds = tabs.map(tab => tab.id);
  const isAllSelected = tabIds.length > 0 && tabIds.every(id => selectedTabs.includes(id));

  // 拖拽区域设置
  const { setNodeRef, isOver } = useDroppable({
    id: groupId || 'ungrouped',
    data: {
      type: 'group',
      groupId: groupId || 'ungrouped',
      groupTitle: title
    }
  });
  
  const handleGroupNameEdit = () => {
    if (canEdit) {
      setIsEditing(true);
    }
  };
  
  const handleGroupNameSave = () => {
    setIsEditing(false);
  };
  
  const handleSelectAll = () => {
    // 无论是全选还是取消全选，都传递完整的tabIds数组
    // 让父组件根据当前选中状态决定如何处理
    onSelectAll(tabIds);
    setShowDropdown(false); // 关闭下拉菜单
  };
  
  const handleToggleLock = () => {
    const newLockedState = !locked;
    setLocked(newLockedState);
    setShowDropdown(false); // 关闭下拉菜单
    
    // 通知父组件更新锁定状态
    if (onToggleLock && groupId && groupId !== 'ungrouped') {
      onToggleLock(groupId, newLockedState);
    }
    
    console.log(`分组 "${groupName}" ${newLockedState ? '已锁定' : '已解锁'}`);
  };
  
  const handleEditGroup = () => {
    if (onEditGroup && groupId && groupId !== 'ungrouped') {
      // 构造分组对象
      const group: Group = {
        id: groupId,
        name: title,
        createdTime: createdTime ? new Date(createdTime).getTime() : Date.now(),
        isLocked: locked,
        isExpanded: isExpanded || true,
        sortOrder: 0,
      };
      onEditGroup(group);
    }
    setShowDropdown(false);
  };

  // 处理下拉菜单显示/隐藏
  const handleDropdownToggle = () => {
    setShowDropdown(!showDropdown);
  };

  // 处理删除分组确认
  const handleDeleteGroup = () => {
    setShowDeleteConfirm(true);
    setShowDropdown(false);
    setDeleteOption(null);
  };

  // 确认删除分组
  const confirmDeleteGroup = () => {
    if (deleteOption && onDeleteGroup) {
      onDeleteGroup(groupName, deleteOption);
    }
    setShowDeleteConfirm(false);
    setDeleteOption(null);
    console.log(`分组 "${groupName}" 已删除，选项: ${deleteOption}`);
  };

  // 取消删除分组
  const cancelDeleteGroup = () => {
    setShowDeleteConfirm(false);
    setDeleteOption(null);
  };

  // 点击外部关闭下拉菜单
  const handleClickOutside = () => {
    if (showDropdown) {
      setShowDropdown(false);
    }
  };

  return (
    <div 
      className="border border-gray-200 rounded-lg mb-4"
      onClick={handleClickOutside}
    >
      <div 
        ref={setNodeRef}
        className={`flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200 transition-colors ${
          isOver || isHighlighted ? 'group-highlight' : ''
        }`}
      >
        {onToggleGroup && (
          <button 
            onClick={onToggleGroup}
            className="w-6 h-6 flex items-center justify-center hover:bg-gray-200 rounded cursor-pointer transition-colors"
          >
            <i className={`text-gray-500 text-sm ${isExpanded ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'}`}></i>
          </button>
        )}
        
        <div className="w-4 h-4 flex items-center justify-center">
          <i className={`ri-folder-3-fill ${getIconColorClass(color)}`}></i>
        </div>
        
        <div className="flex-1 flex items-center gap-2">
          {isEditing ? (
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              onBlur={handleGroupNameSave}
              onKeyPress={(e) => e.key === 'Enter' && handleGroupNameSave()}
              className="text-sm font-medium bg-white border border-gray-300 rounded px-2 py-1"
              autoFocus
            />
          ) : (
            <span 
              className={`text-sm font-medium text-gray-900 ${canEdit ? 'cursor-pointer hover:text-blue-600' : ''}`}
              onClick={handleGroupNameEdit}
            >
              {groupName}
            </span>
          )}
          
          <span className="text-sm text-gray-500">({count}个)</span>
          
          {createdTime && (
            <span className="text-xs text-gray-500">{formatCreatedTime(createdTime)}</span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {locked && (
            <div className="w-6 h-6 flex items-center justify-center">
              <i className="ri-lock-line text-gray-500 text-sm" title="已锁定"></i>
            </div>
          )}
          {canEdit && (
            <>
              <div className="relative" onMouseEnter={handleMenuAreaEnter} onMouseLeave={handleMenuAreaLeave}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDropdownToggle();
                  }}
                  className="w-6 h-6 flex items-center justify-center hover:bg-gray-200 rounded cursor-pointer transition-colors"
                  title="更多操作"
                >
                  <i className="ri-more-2-line text-gray-500 text-sm"></i>
                </button>
                
                {/* 下拉菜单 */}
                 {showDropdown && (
                   <>
                     {/* 遮罩层：点击空白处关闭 */}
                     <div 
                       className="fixed inset-0 z-10" 
                       onClick={(e) => {
                         e.stopPropagation();
                         setShowDropdown(false);
                       }}
                     ></div>
                     {/* 不可见连接区域，避免鼠标从按钮到菜单的间隙导致意外关闭 */}
                     <div 
                       className="absolute right-0 top-8 w-full h-6 z-15" 
                       onMouseEnter={handleMenuAreaEnter}
                       onMouseLeave={handleMenuAreaLeave}
                     ></div>
                     <div 
                       className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 min-w-[140px]"
                       onClick={(e) => e.stopPropagation()}
                       onMouseEnter={handleMenuAreaEnter}
                       onMouseLeave={handleMenuAreaLeave}
                     >
                       <button
                         onClick={handleSelectAll}
                         className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                       >
                         <i className="ri-checkbox-multiple-line text-gray-400"></i>
                         {isAllSelected ? '取消全选' : '全选本组'}
                       </button>
                       {groupId !== 'ungrouped' && (
                         <button
                           onClick={handleEditGroup}
                           className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                         >
                           <i className="ri-edit-line text-gray-400"></i>
                           编辑分组
                         </button>
                       )}
                       <button
                         onClick={handleToggleLock}
                         className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                       >
                         <i className={`${locked ? 'ri-lock-unlock-line' : 'ri-lock-line'} text-gray-400`}></i>
                         {locked ? '解锁分组' : '锁定分组'}
                       </button>
                       <div className="border-t border-gray-100 my-1"></div>
                       <button
                         onClick={handleDeleteGroup}
                         className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                       >
                         <i className="ri-delete-bin-line text-red-400"></i>
                         删除分组
                       </button>
                     </div>
                   </>
                 )}
              </div>
            </>
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="">
        
          <SortableContext 
            items={tabIds} 
            strategy={verticalListSortingStrategy}
          >
            {tabs.map(tab => (
              <TabItem
                key={tab.id}
                id={tab.id}
                title={tab.title}
                url={tab.url}
                favicon={tab.favicon}
                isSelected={selectedTabs.includes(tab.id)}
                onSelect={onSelectTab}
                onDelete={onDeleteTab}
                onOpen={onOpenTab}
                groupId={groupId}
                isDragDisabled={isDragDisabled || locked}
                activeId={activeId}
                draggedTabLeftOriginalGroup={draggedTabLeftOriginalGroup}
                hoveredTabId={hoveredTabId}
                onHover={onTabHover}
                insertIndicator={insertIndicators[tab.id]}
              />
            ))}
          </SortableContext>
          
          {/* 拖拽提示区域 */}
          {isOver && tabs.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500 border-2 border-dashed border-blue-300 bg-blue-50 mx-2 mb-2 rounded-lg">
              <i className="ri-drag-drop-line text-2xl mb-2 block"></i>
              <div className="text-sm">将标签页拖拽到此处</div>
            </div>
          )}
          
          {/* 拖拽到分组标题的提示 */}
          {isOver && activeId && tabs.length > 0 && (
            <div className="px-4 py-2 text-center text-blue-600 bg-blue-50 mx-2 mb-2 rounded border border-blue-200">
              <div className="text-sm">松开鼠标将标签页移动到此分组</div>
            </div>
          )}
        </div>
      )}
      
      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">删除分组确认</h3>
            <p className="text-gray-600 mb-4">
              确定要删除分组 &quot;{groupName}&quot; 吗？请选择如何处理分组内的标签页：
            </p>
            
            <div className="space-y-3 mb-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="deleteOption"
                  value="delete"
                  checked={deleteOption === 'delete'}
                  onChange={(e) => setDeleteOption(e.target.value as 'delete')}
                  className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">删除所有标签页</div>
                  <div className="text-xs text-gray-500">永久删除分组及其包含的所有标签页</div>
                </div>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="deleteOption"
                  value="move"
                  checked={deleteOption === 'move'}
                  onChange={(e) => setDeleteOption(e.target.value as 'move')}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">移至未分组</div>
                  <div className="text-xs text-gray-500">删除分组但保留标签页，移至未分组区域</div>
                </div>
              </label>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDeleteGroup}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmDeleteGroup}
                disabled={!deleteOption}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  deleteOption
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}