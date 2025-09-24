'use client';

import { useState, useEffect, useCallback } from 'react';
import { Settings, DEFAULT_SETTINGS, ThemeType, AIProvider } from '../lib/types';
import { getStorageService } from '../lib/storage';

/**
 * 设置管理Hook
 * 提供设置的加载、保存和更新功能
 */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载设置
  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const storageService = getStorageService();
      const loadedSettings = await storageService.loadSettings();
      
      setSettings(loadedSettings);
    } catch (err) {
      console.error('加载设置失败:', err);
      setError('加载设置失败');
      // 使用默认设置
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 保存设置
  const saveSettings = useCallback(async (newSettings: Settings) => {
    try {
      setError(null);
      
      const storageService = getStorageService();
      await storageService.saveSettings(newSettings);
      
      setSettings(newSettings);
      return true;
    } catch (err) {
      console.error('保存设置失败:', err);
      setError('保存设置失败');
      return false;
    }
  }, []);

  // 更新设置
  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  // 更新AI设置
  const updateAISettings = useCallback((updates: Partial<Settings['ai']>) => {
    setSettings(prev => ({
      ...prev,
      ai: { ...prev.ai, ...updates }
    }));
  }, []);

  // 更新UI设置
  const updateUISettings = useCallback((updates: Partial<Settings['ui']>) => {
    setSettings(prev => ({
      ...prev,
      ui: { ...prev.ui, ...updates }
    }));
  }, []);

  // 更新快捷键设置
  const updateShortcutSettings = useCallback((updates: Partial<Settings['shortcuts']>) => {
    setSettings(prev => ({
      ...prev,
      shortcuts: { ...prev.shortcuts, ...updates }
    }));
  }, []);

  // 重置设置为默认值
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  // 切换主题
  const setTheme = useCallback((theme: ThemeType) => {
    updateSettings({ theme });
  }, [updateSettings]);

  // 设置AI提供商
  const setAIProvider = useCallback((provider: AIProvider) => {
    updateAISettings({ provider });
  }, [updateAISettings]);

  // 初始化时加载设置
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // 应用主题到DOM
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      
      // 移除所有主题类
      root.classList.remove('theme-light', 'theme-dark', 'theme-pixel');
      
      // 添加当前主题类
      root.classList.add(`theme-${settings.theme}`);
      
      // 设置CSS变量（如果需要）
      switch (settings.theme) {
        case 'dark':
          root.style.setProperty('--bg-primary', '#1f2937');
          root.style.setProperty('--bg-secondary', '#374151');
          root.style.setProperty('--text-primary', '#f9fafb');
          root.style.setProperty('--text-secondary', '#d1d5db');
          break;
        case 'pixel':
          root.style.setProperty('--font-family', 'monospace');
          break;
        default: // light
          root.style.setProperty('--bg-primary', '#ffffff');
          root.style.setProperty('--bg-secondary', '#f9fafb');
          root.style.setProperty('--text-primary', '#111827');
          root.style.setProperty('--text-secondary', '#6b7280');
          break;
      }
    };

    if (!isLoading) {
      applyTheme();
    }
  }, [settings.theme, isLoading]);

  return {
    // 状态
    settings,
    isLoading,
    error,
    
    // 操作方法
    loadSettings,
    saveSettings,
    updateSettings,
    updateAISettings,
    updateUISettings,
    updateShortcutSettings,
    resetSettings,
    setTheme,
    setAIProvider,
    
    // 便捷访问器
    theme: settings.theme,
    aiSettings: settings.ai,
    uiSettings: settings.ui,
    shortcutSettings: settings.shortcuts,
  };
}

/**
 * 主题相关的工具函数
 */
export const themeUtils = {
  /**
   * 获取主题显示名称
   */
  getThemeDisplayName: (theme: ThemeType): string => {
    const names = {
      light: '明亮',
      dark: '暗黑',
      pixel: '像素风'
    };
    return names[theme] || '未知';
  },

  /**
   * 获取主题描述
   */
  getThemeDescription: (theme: ThemeType): string => {
    const descriptions = {
      light: '经典白色主题，适合日间使用',
      dark: '护眼深色主题，适合夜间使用',
      pixel: '复古像素风格，怀旧体验'
    };
    return descriptions[theme] || '';
  },

  /**
   * 获取所有可用主题
   */
  getAllThemes: (): { value: ThemeType; label: string; description: string }[] => [
    {
      value: 'light',
      label: themeUtils.getThemeDisplayName('light'),
      description: themeUtils.getThemeDescription('light')
    },
    {
      value: 'dark',
      label: themeUtils.getThemeDisplayName('dark'),
      description: themeUtils.getThemeDescription('dark')
    },
    {
      value: 'pixel',
      label: themeUtils.getThemeDisplayName('pixel'),
      description: themeUtils.getThemeDescription('pixel')
    }
  ]
};

/**
 * AI提供商相关的工具函数
 */
export const aiProviderUtils = {
  /**
   * 获取AI提供商显示名称
   */
  getProviderDisplayName: (provider: AIProvider): string => {
    const names = {
      openai: 'OpenAI',
      claude: 'Claude (Anthropic)',
      gemini: 'Gemini (Google)',
      local: '本地模型'
    };
    return names[provider] || '未知';
  },

  /**
   * 获取AI提供商描述
   */
  getProviderDescription: (provider: AIProvider): string => {
    const descriptions = {
      openai: '使用OpenAI的GPT模型进行智能分组',
      claude: '使用Anthropic的Claude模型',
      gemini: '使用Google的Gemini模型',
      local: '使用本地部署的AI模型'
    };
    return descriptions[provider] || '';
  },

  /**
   * 获取所有可用的AI提供商
   */
  getAllProviders: (): { value: AIProvider; label: string; description: string }[] => [
    {
      value: 'openai',
      label: aiProviderUtils.getProviderDisplayName('openai'),
      description: aiProviderUtils.getProviderDescription('openai')
    },
    {
      value: 'claude',
      label: aiProviderUtils.getProviderDisplayName('claude'),
      description: aiProviderUtils.getProviderDescription('claude')
    },
    {
      value: 'gemini',
      label: aiProviderUtils.getProviderDisplayName('gemini'),
      description: aiProviderUtils.getProviderDescription('gemini')
    },
    {
      value: 'local',
      label: aiProviderUtils.getProviderDisplayName('local'),
      description: aiProviderUtils.getProviderDescription('local')
    }
  ],

  /**
   * 验证API密钥格式
   */
  validateApiKey: (provider: AIProvider, apiKey: string): boolean => {
    if (!apiKey.trim()) return false;
    
    switch (provider) {
      case 'openai':
        return apiKey.startsWith('sk-') && apiKey.length > 20;
      case 'claude':
        return apiKey.startsWith('sk-ant-') && apiKey.length > 20;
      case 'gemini':
        return apiKey.length > 10; // Google API keys vary in format
      case 'local':
        return true; // Local models may not need API keys
      default:
        return false;
    }
  },

  /**
   * 获取默认模型名称
   */
  getDefaultModel: (provider: AIProvider): string => {
    const defaultModels = {
      openai: 'gpt-3.5-turbo',
      claude: 'claude-3-sonnet-20240229',
      gemini: 'gemini-pro',
      local: 'local-model'
    };
    return defaultModels[provider] || 'gpt-3.5-turbo';
  }
};