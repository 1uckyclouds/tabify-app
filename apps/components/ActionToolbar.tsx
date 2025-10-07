'use client';

import React, { useState, useEffect, useRef } from 'react';

interface ActionToolbarProps {
  selectedCount: number;
  isAllSelected: boolean;
  onSelectAll: () => void;
  onBatchRestore: () => void;
  onBatchDelete: () => void;
  onAddToGroup: () => void;
  onSmartGroup: () => void;
  onDomainGroup: () => void;
  onCreateGroup: () => void;
}

export default function ActionToolbar({
  selectedCount,
  isAllSelected,
  onSelectAll,
  onBatchRestore,
  onBatchDelete,
  onAddToGroup,
  onSmartGroup,
  onDomainGroup,
  onCreateGroup
}: ActionToolbarProps) {
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 延迟关闭下拉菜单的处理函数
  const handleMouseEnter = () => {
    // 清除之前的延迟关闭定时器
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    // 只有在有选中项时才显示菜单
    if (selectedCount > 0) {
      setShowGroupMenu(true);
    }
  };

  const handleMouseLeave = () => {
    // 设置延迟关闭定时器，150ms后关闭菜单
    hoverTimerRef.current = setTimeout(() => {
      setShowGroupMenu(false);
      hoverTimerRef.current = null;
    }, 150);
  };

  // 点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowGroupMenu(false);
        // 清除延迟关闭定时器
        if (hoverTimerRef.current) {
          clearTimeout(hoverTimerRef.current);
          hoverTimerRef.current = null;
        }
      }
    }

    if (showGroupMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showGroupMenu]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);
  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isAllSelected}
          onChange={(e) => {
            // 如果当前是全选状态，点击复选框应该取消全选
            // 如果当前不是全选状态，点击复选框应该全选
            onSelectAll();
          }}
          className="w-4 h-4 text-blue-600 rounded cursor-pointer"
        />
        <span className="text-sm text-gray-700">全选所有</span>
      </div>
      
      <div className="flex items-center gap-2">
        {/* 恢复按钮 */}
        <button 
          onClick={onBatchRestore}
          disabled={selectedCount === 0}
          className={`px-4 py-2 text-sm border rounded-md transition-all duration-200 whitespace-nowrap font-medium flex items-center gap-2 ${
            selectedCount === 0 
              ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed' 
              : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm active:scale-95'
          }`}
        >
          <i className="ri-refresh-line text-sm"></i>
          恢复
        </button>
        
        {/* 删除按钮 */}
        <button 
          onClick={onBatchDelete}
          disabled={selectedCount === 0}
          className={`px-4 py-2 text-sm rounded-lg transition-colors duration-200 whitespace-nowrap font-medium flex items-center gap-2 ${
            selectedCount === 0 
              ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed border' 
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          <i className="ri-delete-bin-line text-sm"></i>
          删除
        </button>
        
        {/* 创建新分组按钮 */}
        <button 
          onClick={onCreateGroup}
          className="px-4 py-2 text-sm border rounded-md transition-all duration-200 whitespace-nowrap font-medium flex items-center gap-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm active:scale-95"
        >
          <i className="ri-add-line text-sm"></i>
          创建新分组
        </button>
        
        <div className="w-px h-6 bg-gray-300"></div>
        
        {/* 分组操作下拉菜单 */}
        <div 
          className="relative" 
          ref={menuRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button 
            onClick={() => selectedCount > 0 && setShowGroupMenu(!showGroupMenu)}
            className={`px-4 py-2 text-sm border rounded-md transition-all duration-200 whitespace-nowrap font-medium flex items-center gap-2 ${
              selectedCount === 0 
                ? 'border-gray-200 text-gray-400 bg-gray-50' 
                : 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 hover:shadow-sm active:scale-95'
            }`}
          >
            <i className="ri-stack-line text-sm"></i>
            分组操作
            <i className={`ri-arrow-down-s-line text-sm transition-transform ${
              showGroupMenu ? 'rotate-180' : ''
            }`}></i>
          </button>
          
          {/* 下拉菜单 */}
          {showGroupMenu && (
            <div 
              className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[140px]"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                onClick={() => {
                  if (selectedCount > 0) {
                    onAddToGroup();
                    setShowGroupMenu(false);
                  }
                }}
                disabled={selectedCount === 0}
                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                  selectedCount === 0 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <i className="ri-folder-user-line text-gray-400"></i>
                手动分组
              </button>
              <button
                onClick={() => {
                  if (selectedCount > 0) {
                    onSmartGroup();
                    setShowGroupMenu(false);
                  }
                }}
                disabled={selectedCount === 0}
                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                  selectedCount === 0 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <i className="ri-flashlight-line text-gray-400"></i>
                智能分组
              </button>
              <button
                onClick={() => {
                  if (selectedCount > 0) {
                    onDomainGroup();
                    setShowGroupMenu(false);
                  }
                }}
                disabled={selectedCount === 0}
                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                  selectedCount === 0 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <i className="ri-global-line text-gray-400"></i>
                域名分组
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="text-sm text-gray-600">
        {selectedCount > 0 ? `已选择 ${selectedCount} 个标签页` : '选择标签页进行批量操作'}
      </div>
    </div>
  );
}