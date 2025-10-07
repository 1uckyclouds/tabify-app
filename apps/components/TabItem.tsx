'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import DragInsertIndicator from './DragInsertIndicator';

interface TabItemProps {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onDelete?: (id: string) => void;
  onOpen?: (id: string) => void;
  groupId?: string;
  isDragDisabled?: boolean;
  activeId?: string | null;
  draggedTabLeftOriginalGroup?: boolean;
  /** 全局悬停状态管理 */
  hoveredTabId?: string | null;
  onHover?: (id: string | null) => void;
  /** 插入指示器配置 */
  insertIndicator?: {
    showBefore: boolean;
    showAfter: boolean;
    type: 'line' | 'zone';
  };
}

export default function TabItem({ 
  id, 
  title, 
  url, 
  favicon, 
  isSelected, 
  onSelect, 
  onDelete,
  onOpen,
  groupId,
  isDragDisabled = false,
  activeId = null,
  draggedTabLeftOriginalGroup = false,
  hoveredTabId = null,
  onHover,
  insertIndicator
}: TabItemProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  
  // 使用全局悬停状态而不是本地状态
  const isHovered = hoveredTabId === id;

  // 用于存储关闭菜单的定时器引用 - 必须在useEffect之前声明
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // 拖拽功能
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: id,
    disabled: isDragDisabled,
    data: {
      type: 'tab',
      tab: { id, title, url, favicon, groupId }
    }
  });

  // 判断是否有其他标签页正在被拖拽
  const isOtherDragging = activeId && activeId !== id;
  const isDragStart = activeId === id && !isDragging; // 拖拽刚开始时的状态
  
  // 调试日志
  if (activeId === id) {
    console.log('拖拽状态:', { id, activeId, isDragging, isDragStart });
  }
  
  // 当前标签页是被拖拽的标签页且已离开原分组时的样式处理
  const shouldShowAsPlaceholder = activeId === id && draggedTabLeftOriginalGroup;
  
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition: isDragging ? 'none' : transition, // 拖拽时禁用过渡动画
    opacity: isDragging ? 0 : shouldShowAsPlaceholder ? 0.4 : 1,
    pointerEvents: shouldShowAsPlaceholder ? 'none' as const : 'auto' as const,
  };

  const handleOpenTab = () => {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
    // 调用onOpen回调，通知父组件从列表中移除该标签页
    if (onOpen) {
      onOpen(id);
    }
    setShowDropdown(false);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(url);
    setShowDropdown(false);
  };

  const handleDeleteTab = () => {
    console.log('🔥 TabItem handleDeleteTab 被调用:', id);
    console.log('🔥 onDelete 函数存在:', !!onDelete);
    console.log('🔥 onDelete 函数类型:', typeof onDelete);
    
    if (onDelete) {
      console.log('🔥 正在调用 onDelete 函数...');
      onDelete(id);
      console.log('🔥 onDelete 函数调用完成');
    } else {
      console.error('🔥 onDelete 函数不存在！');
    }
    setShowDropdown(false);
  };

  const handleAddToGroup = () => {
    console.log('添加到分组:', id);
    setShowDropdown(false);
  };



  // 鼠标进入菜单整体区域
  const handleMenuAreaEnter = useCallback(() => {
    console.log('🔍 鼠标进入菜单区域:', id);
    // 清除可能存在的关闭定时器
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, [id]);

  // 鼠标离开菜单整体区域
  const handleMenuAreaLeave = useCallback(() => {
    console.log('🔍 鼠标离开菜单区域:', id);
    // 设置延迟关闭定时器
    closeTimeoutRef.current = setTimeout(() => {
      console.log('🔍 自动关闭菜单:', id);
      setShowDropdown(false);
      // 当菜单关闭时，如果鼠标不在标签页主体上，也重置悬停状态
      if (onHover) {
        onHover(null);
      }
      closeTimeoutRef.current = null;
    }, 200); // 增加延迟时间到200ms，给用户更多缓冲时间
  }, [id, onHover]);

  // 处理标题区域点击事件
  const handleTitleClick = (e: React.MouseEvent) => {
    // 阻止事件冒泡，避免触发其他点击事件
    e.stopPropagation();
    handleOpenTab();
  };

  return (
    <>
      {/* 前置插入指示器 */}
      {insertIndicator?.showBefore && (
        <DragInsertIndicator
          isVisible={true}
          position="before"
          type={insertIndicator.type}
        />
      )}
      
      <div 
        ref={setNodeRef}
        style={style}
        className={`sortable-item flex items-center gap-4 p-4 mb-0 bg-white border cursor-pointer transition-all duration-200 ${isHovered ? 'rounded-xl' : ''} ${
          isDragging 
            ? 'dragging shadow-lg' 
            : isDragStart
              ? 'drag-start shadow-md'
              : isOtherDragging 
                ? 'other-dragging opacity-50' 
                : isSelected
                  ? 'bg-blue-50 border-blue-200 shadow-md ring-1 ring-blue-100'
                  : 'border-gray-200 hover:bg-gray-50 hover:shadow-md hover:border-gray-300'
        }`.trim()}
        onMouseEnter={() => {
          if (!isOtherDragging && onHover) {
            onHover(id);
          }
        }}
        onMouseLeave={() => {
          if (onHover) {
            onHover(null);
          }
        }}
        {...attributes}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(id, e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded cursor-pointer"
        />
        
        {/* 标题区域 - 可点击打开标签页 */}
        <div 
          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer rounded-lg p-1 -m-1 transition-colors duration-200"
          onClick={handleTitleClick}
          title="点击打开标签页"
        >
          <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 rounded-md">
            {favicon ? (
              <img 
                src={favicon} 
                alt="" 
                className="w-4 h-4 object-contain rounded-sm" 
              />
            ) : (
              <i className="ri-global-line text-gray-500 text-base"></i>
            )}
          </div>
          
          <div className="text-sm font-medium text-gray-900 truncate" style={{ maxWidth: '66.67%' }}>
            {title || url}
          </div>
          
          {/* 拖拽图标 - 紧贴标题右侧 */}
          <div 
            className={`w-3 h-4 flex items-center justify-center flex-shrink-0 cursor-grab active:cursor-grabbing transition-all duration-200 ml-2 ${
              isHovered ? 'text-gray-600 opacity-100' : 'text-gray-400 opacity-0'
            }`}
            {...listeners}
            title="拖拽移动标签页"
            onClick={(e) => e.stopPropagation()} // 阻止冒泡到标题点击事件
          >
            <div className="grid grid-cols-2 gap-0.5 w-2 h-3">
              <div className="w-0.5 h-0.5 bg-current rounded-full"></div>
              <div className="w-0.5 h-0.5 bg-current rounded-full"></div>
              <div className="w-0.5 h-0.5 bg-current rounded-full"></div>
              <div className="w-0.5 h-0.5 bg-current rounded-full"></div>
              <div className="w-0.5 h-0.5 bg-current rounded-full"></div>
              <div className="w-0.5 h-0.5 bg-current rounded-full"></div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 relative">
          {/* 悬停时显示的删除按钮 */}
          {isHovered && (
            <button 
              onClick={handleDeleteTab}
              className="w-7 h-7 flex items-center justify-center hover:bg-red-100 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm"
              title="删除标签页"
            >
              <i className="ri-delete-bin-line text-red-500 text-sm"></i>
            </button>
          )}
          
          {/* 菜单整体区域容器 */}
          <div 
            className="relative"
            onMouseEnter={handleMenuAreaEnter}
            onMouseLeave={handleMenuAreaLeave}
          >
            <button 
              onClick={() => {
                console.log('🔍 点击更多按钮:', id, '当前状态:', showDropdown);
                setShowDropdown(!showDropdown);
              }}
              className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm"
            >
              <i className="ri-more-2-line text-gray-500 text-sm"></i>
            </button>

            {showDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => {
                    console.log('🔍 点击空白处关闭菜单:', id);
                    setShowDropdown(false);
                  }}
                ></div>
                {/* 扩大的不可见连接区域，确保鼠标移动路径完全覆盖 */}
                <div 
                  className="absolute right-0 top-7 w-full h-6 z-15"
                  onMouseEnter={handleMenuAreaEnter}
                  onMouseLeave={handleMenuAreaLeave}
                ></div>
                <div 
                  className="absolute right-0 top-9 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-2 min-w-40 transition-all duration-200 ease-in-out transform origin-top-right"
                  onMouseEnter={handleMenuAreaEnter}
                  onMouseLeave={handleMenuAreaLeave}
                >
                  <button
                    onClick={handleCopyUrl}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center gap-2"
                  >
                    <i className="ri-file-copy-line text-gray-500"></i>
                    复制链接
                  </button>
                  <button
                    onClick={handleAddToGroup}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center gap-2"
                  >
                    <i className="ri-folder-add-line text-gray-500"></i>
                    添加到分组
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* 后置插入指示器 */}
      {insertIndicator?.showAfter && (
        <DragInsertIndicator
          isVisible={true}
          position="after"
          type={insertIndicator.type}
        />
      )}
    </>
  );
}