'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import DragInsertIndicator from './DragInsertIndicator';

interface TabItemProps {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  groupId?: string;
  isDragDisabled?: boolean;
  activeId?: string | null;
  draggedTabLeftOriginalGroup?: boolean;
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
  groupId,
  isDragDisabled = false,
  activeId = null,
  draggedTabLeftOriginalGroup = false,
  insertIndicator
}: TabItemProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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
    setShowDropdown(false);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(url);
    setShowDropdown(false);
  };

  const handleDeleteTab = () => {
    console.log('删除标签页:', id);
    setShowDropdown(false);
  };

  const handleAddToGroup = () => {
    console.log('添加到分组:', id);
    setShowDropdown(false);
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
        onMouseEnter={() => !isOtherDragging && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...attributes}
      >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={(e) => onSelect(id, e.target.checked)}
        className="w-4 h-4 text-blue-600 rounded cursor-pointer"
      />
      
      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 bg-gray-100 rounded-md">
        {favicon ? (
          <img src={favicon} alt="" className="w-4 h-4 object-contain" />
        ) : (
          <i className="ri-global-line text-gray-500 text-base"></i>
        )}
      </div>
      
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <div className="text-sm font-medium text-gray-900 truncate">
          {title || url}
        </div>
        
        {/* 拖拽图标 - 紧贴标题右侧 */}
        <div 
          className={`w-3 h-4 flex items-center justify-center flex-shrink-0 cursor-grab active:cursor-grabbing transition-all duration-200 ${
            isHovered ? 'text-gray-600 opacity-100' : 'text-gray-400 opacity-0'
          }`}
          {...listeners}
          title="拖拽移动标签页"
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
        
        <button 
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm"
        >
          <i className="ri-more-2-line text-gray-500 text-sm"></i>
        </button>

        {showDropdown && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowDropdown(false)}
            ></div>
            <div className="absolute right-0 top-9 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-2 min-w-40">
              <button
                onClick={handleOpenTab}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <i className="ri-external-link-line text-gray-500"></i>
                打开标签页
              </button>
              <button
                onClick={handleCopyUrl}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <i className="ri-file-copy-line text-gray-500"></i>
                复制链接
              </button>
              <button
                onClick={handleAddToGroup}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <i className="ri-folder-add-line text-gray-500"></i>
                添加到分组
              </button>
            </div>
          </>
        )}
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