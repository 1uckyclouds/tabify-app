/**
 * 设计令牌系统 (Design Tokens)
 * 
 * 这个文件定义了整个应用的视觉设计规范，包括颜色、间距、排版、边框半径和阴影等。
 * 通过统一的设计令牌，确保整个应用的视觉一致性和可维护性。
 * 
 * 使用方式：
 * 1. 在 Tailwind 配置中引入这些令牌
 * 2. 在组件中使用对应的 Tailwind 类名
 * 3. 需要自定义样式时，直接引用这些令牌值
 */

export const designTokens = {
  /**
   * 颜色系统 (Color System)
   * 
   * 定义了主色调、灰度色阶和语义化颜色
   * - primary: 主品牌色（蓝色系）
   * - gray: 灰度色阶，用于文本、边框、背景等
   * - semantic: 语义化颜色，用于状态提示
   */
  colors: {
    // 主色调 - 蓝色系
    primary: {
      50: '#f0f9ff',   // 最浅的蓝色，用于背景
      500: '#3b82f6',  // 标准蓝色，用于按钮、链接
      600: '#2563eb',  // 深蓝色，用于悬停状态
      700: '#1d4ed8'   // 最深蓝色，用于激活状态
    },
    
    // 灰度色阶
    gray: {
      50: '#f9fafb',   // 最浅灰，用于页面背景
      100: '#f3f4f6',  // 浅灰，用于卡片背景
      200: '#e5e7eb',  // 边框灰
      300: '#d1d5db',  // 分割线灰
      400: '#9ca3af',  // 占位符文本
      500: '#6b7280',  // 次要文本
      600: '#4b5563',  // 主要文本（浅色背景）
      700: '#374151',  // 标题文本
      800: '#1f2937',  // 深色文本
      900: '#111827'   // 最深文本
    },
    
    // 语义化颜色
    semantic: {
      success: '#10b981',  // 成功状态 - 绿色
      warning: '#f59e0b',  // 警告状态 - 橙色
      error: '#ef4444',    // 错误状态 - 红色
      info: '#3b82f6'      // 信息状态 - 蓝色
    }
  },

  /**
   * 间距系统 (Spacing System)
   * 
   * 基于 4px 网格系统的间距规范
   * 用于 margin、padding、gap 等属性
   */
  spacing: {
    xs: '0.25rem',   // 4px - 最小间距
    sm: '0.5rem',    // 8px - 小间距
    md: '0.75rem',   // 12px - 中等间距
    lg: '1rem',      // 16px - 标准间距
    xl: '1.5rem',    // 24px - 大间距
    '2xl': '2rem',   // 32px - 更大间距
    '3xl': '3rem'    // 48px - 最大间距
  },

  /**
   * 排版系统 (Typography System)
   * 
   * 定义字体族、字号和字重
   * 确保文本的可读性和层次感
   */
  typography: {
    // 字体族
    fontFamily: {
      primary: ['Segoe UI', 'system-ui', 'sans-serif'],  // 主字体
      mono: ['Consolas', 'Monaco', 'monospace']           // 等宽字体
    },
    
    // 字号系统
    fontSize: {
      xs: '0.75rem',    // 12px - 小标签
      sm: '0.875rem',   // 14px - 次要文本
      base: '1rem',     // 16px - 正文
      lg: '1.125rem',   // 18px - 大正文
      xl: '1.25rem',    // 20px - 小标题
      '2xl': '1.5rem'   // 24px - 大标题
    },
    
    // 字重系统
    fontWeight: {
      normal: 400,    // 正常字重
      medium: 500,    // 中等字重
      semibold: 600,  // 半粗体
      bold: 700       // 粗体
    }
  },

  /**
   * 边框半径系统 (Border Radius System)
   * 
   * 定义统一的圆角规范
   * 用于按钮、卡片、输入框等组件
   */
  borderRadius: {
    sm: '0.25rem',   // 4px - 小圆角
    md: '0.375rem',  // 6px - 中等圆角
    lg: '0.5rem',    // 8px - 大圆角
    xl: '0.75rem'    // 12px - 更大圆角
  },

  /**
   * 阴影系统 (Shadow System)
   * 
   * 定义不同层级的阴影效果
   * 用于创建视觉层次和深度感
   */
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',      // 轻微阴影
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',    // 中等阴影
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)'   // 较深阴影
  }
};

/**
 * 设计令牌的使用示例：
 * 
 * 1. 在 CSS-in-JS 中使用：
 *    const styles = {
 *      color: designTokens.colors.primary[600],
 *      padding: designTokens.spacing.lg
 *    };
 * 
 * 2. 在 Tailwind 类名中使用（配置后）：
 *    <div className="bg-primary-50 text-gray-700 p-lg rounded-md shadow-sm">
 * 
 * 3. 在自定义 CSS 中使用：
 *    .custom-button {
 *      background-color: var(--color-primary-600);
 *      border-radius: var(--border-radius-md);
 *    }
 */

// 导出类型定义，用于 TypeScript 类型检查
export type DesignTokens = typeof designTokens;
export type ColorTokens = typeof designTokens.colors;
export type SpacingTokens = typeof designTokens.spacing;
export type TypographyTokens = typeof designTokens.typography;
export type BorderRadiusTokens = typeof designTokens.borderRadius;
export type ShadowTokens = typeof designTokens.shadows;