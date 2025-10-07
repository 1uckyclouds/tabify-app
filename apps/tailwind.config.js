/** @type {import('tailwindcss').Config} */
// 由于 Tailwind 配置文件需要 CommonJS 格式，我们直接在这里定义设计令牌
const designTokens = {
  colors: {
    primary: {
      50: '#f0f9ff',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8'
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827'
    },
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    '2xl': '2rem',
    '3xl': '3rem'
  },
  typography: {
    fontFamily: {
      primary: ['Segoe UI', 'system-ui', 'sans-serif'],
      mono: ['Consolas', 'Monaco', 'monospace']
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem'
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem'
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
  }
};

module.exports = {
  content: ["./{app,components,libs,pages,hooks}/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // 扩展颜色系统 - 集成设计令牌中定义的所有颜色
      colors: {
        // 主色调系统
        primary: designTokens.colors.primary,
        // 灰度色阶系统
        gray: designTokens.colors.gray,
        // 语义化颜色系统
        success: designTokens.colors.semantic.success,
        warning: designTokens.colors.semantic.warning,
        error: designTokens.colors.semantic.error,
        info: designTokens.colors.semantic.info,
      },
      
      // 扩展间距系统 - 基于4px网格的统一间距
      spacing: designTokens.spacing,
      
      // 扩展字体系统 - 统一的排版规范
      fontFamily: designTokens.typography.fontFamily,
      fontSize: designTokens.typography.fontSize,
      fontWeight: designTokens.typography.fontWeight,
      
      // 扩展边框圆角 - 统一的圆角规范
      borderRadius: designTokens.borderRadius,
      
      // 扩展阴影系统 - 创建视觉层次的阴影效果
      boxShadow: designTokens.shadows,
    },
  },
  plugins: [],
}

