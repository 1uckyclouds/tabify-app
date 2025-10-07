'use client';

import React from 'react';

interface DragInsertIndicatorProps {
  /** 是否显示插入指示器 */
  isVisible: boolean;
  /** 插入位置类型 */
  position: 'before' | 'after' | 'inside';
  /** 自定义样式类名 */
  className?: string;
  /** 指示器类型 */
  type?: 'line' | 'zone';
}

/**
 * 统一的拖拽插入指示器组件
 * 用于在拖拽过程中显示标签页的插入位置
 * 支持组内排序和跨分组拖拽的一致视觉效果
 */
export default function DragInsertIndicator({
  isVisible,
  position,
  className = '',
  type = 'line'
}: DragInsertIndicatorProps) {
  if (!isVisible) {
    return null;
  }

  // 线型指示器 - 用于精确的插入位置
  if (type === 'line') {
    return (
      <div 
        className={`drag-insert-line ${
          isVisible ? 'active' : ''
        } ${className}`}
        data-position={position}
      >
        {/* 插入点指示器 */}
        <div className="insert-point" />
      </div>
    );
  }

  // 区域型指示器 - 用于分组区域提示
  if (type === 'zone') {
    return (
      <div 
        className={`drag-insert-zone ${
          isVisible ? 'active' : ''
        } ${className}`}
        data-position={position}
      >
        <div className="insert-zone-content">
          <i className="ri-drag-drop-line text-xl" />
          <span className="text-sm font-medium">
            {position === 'inside' ? '松开鼠标插入到此分组' : '在此位置插入'}
          </span>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * 插入指示器钩子
 * 提供插入指示器的状态管理逻辑
 */
export function useDragInsertIndicator() {
  const [insertPosition, setInsertPosition] = React.useState<{
    targetId: string | null;
    position: 'before' | 'after' | 'inside';
    type: 'line' | 'zone';
  }>({ targetId: null, position: 'before', type: 'line' });

  /**
   * 计算插入位置
   * @param activeId 被拖拽元素ID
   * @param overId 悬停目标ID
   * @param overData 悬停目标数据
   * @param mouseY 鼠标Y坐标
   * @param targetRect 目标元素边界
   */
  const calculateInsertPosition = React.useCallback((
    activeId: string,
    overId: string,
    overData: any,
    mouseY?: number,
    targetRect?: DOMRect
  ) => {
    // 如果是分组区域
    if (overData?.type === 'group') {
      setInsertPosition({
        targetId: overId,
        position: 'inside',
        type: 'zone'
      });
      return;
    }

    // 如果是标签页元素
    if (targetRect && mouseY !== undefined) {
      const centerY = targetRect.top + targetRect.height / 2;
      const position = mouseY < centerY ? 'before' : 'after';
      
      setInsertPosition({
        targetId: overId,
        position,
        type: 'line'
      });
    } else {
      // 默认插入到后面
      setInsertPosition({
        targetId: overId,
        position: 'after',
        type: 'line'
      });
    }
  }, []);

  /**
   * 清除插入指示
   */
  const clearInsertPosition = React.useCallback(() => {
    setInsertPosition({ targetId: null, position: 'before', type: 'line' });
  }, []);

  return {
    insertPosition,
    calculateInsertPosition,
    clearInsertPosition
  };
}

/**
 * 插入指示器上下文
 * 用于在组件树中共享插入指示状态
 */
const DragInsertContext = React.createContext<{
  insertPosition: { targetId: string | null; position: 'before' | 'after' | 'inside'; type: 'line' | 'zone' };
  calculateInsertPosition: (activeId: string, overId: string, overData: any, mouseY?: number, targetRect?: DOMRect) => void;
  clearInsertPosition: () => void;
} | null>(null);

/**
 * 插入指示器提供者组件
 */
export function DragInsertProvider({ children }: { children: React.ReactNode }) {
  const insertIndicator = useDragInsertIndicator();
  
  return (
    <DragInsertContext.Provider value={insertIndicator}>
      {children}
    </DragInsertContext.Provider>
  );
}

/**
 * 使用插入指示器上下文的钩子
 */
export function useDragInsertContext() {
  const context = React.useContext(DragInsertContext);
  if (!context) {
    throw new Error('useDragInsertContext must be used within DragInsertProvider');
  }
  return context;
}