'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSettings } from '../../hooks/useSettings';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { AIConfigSection } from '../../components/settings/AIConfigSection';
import { ThemeSection } from '../../components/settings/ThemeSection';
import { ShortcutsSection } from '../../components/settings/ShortcutsSection';
import { AboutSection } from '../../components/settings/AboutSection';
import { 
  ArrowLeft, 
  Save, 
  RotateCcw, 
  Bot, 
  Palette, 
  Keyboard, 
  Info,
  Loader2
} from 'lucide-react';

/**
 * 设置页面内容组件
 * 包含AI模型配置、主题设置、快捷键信息和关于页面
 */
function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    settings,
    isLoading,
    error,
    saveSettings,
    updateSettings,
    updateAISettings,
    updateUISettings,
    updateShortcutSettings,
    resetSettings,
    setTheme
  } = useSettings();
  
  const [activeTab, setActiveTab] = useState<'ai' | 'theme' | 'shortcuts' | 'about'>('ai');
  const [isSaving, setIsSaving] = useState(false);

  // 根据URL参数设置活动选项卡
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['ai', 'theme', 'shortcuts', 'about'].includes(tab)) {
      setActiveTab(tab as 'ai' | 'theme' | 'shortcuts' | 'about');
    }
  }, [searchParams]);

  // 保存设置的包装函数
  const handleSaveSettings = async (): Promise<boolean> => {
    setIsSaving(true);
    try {
      const success = await saveSettings(settings);
      if (success) {
        // 可以显示成功提示
      }
      return success;
    } finally {
      setIsSaving(false);
    }
  };

  // 重置设置
  const handleResetSettings = () => {
    if (confirm('确定要重置所有设置为默认值吗？')) {
      resetSettings();
    }
  };

  // 标签页配置
  const tabs = [
    { 
      id: 'ai', 
      label: 'AI模型配置', 
      icon: <Bot className="w-4 h-4" />,
      description: '配置AI智能分组功能'
    },
    { 
      id: 'theme', 
      label: '外观主题', 
      icon: <Palette className="w-4 h-4" />,
      description: '选择界面主题风格'
    },
    { 
      id: 'shortcuts', 
      label: '快捷键', 
      icon: <Keyboard className="w-4 h-4" />,
      description: '查看和自定义快捷键'
    },
    { 
      id: 'about', 
      label: '关于&反馈', 
      icon: <Info className="w-4 h-4" />,
      description: '应用信息和反馈渠道'
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">加载设置中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">⚠️</div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }}>
            重新加载
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 顶部导航 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                返回
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  设置
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  配置Tabify的各项功能和偏好设置
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetSettings}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                重置全部
              </Button>
              <Button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    保存设置
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* 侧边栏导航 */}
          <div className="w-72 flex-shrink-0">
            <Card className="p-4 sticky top-24">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 group ${
                        isActive
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 shadow-sm'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 hover:shadow-sm'
                      }`}
                    >
                      <div className={`mt-0.5 transition-colors ${
                        isActive 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                      }`}>
                        {tab.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium truncate ${
                          isActive ? 'text-blue-900 dark:text-blue-100' : ''
                        }`}>
                          {tab.label}
                        </div>
                        <div className={`text-xs mt-0.5 truncate ${
                          isActive 
                            ? 'text-blue-700 dark:text-blue-300' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {tab.description}
                        </div>
                      </div>
                      {isActive && (
                        <Badge variant="success" size="sm">
                          当前
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </nav>
            </Card>
          </div>

          {/* 主要内容区域 */}
          <div className="flex-1 min-w-0">
            {activeTab === 'ai' && (
              <AIConfigSection
                settings={settings}
                onUpdateAI={updateAISettings}
                onSave={handleSaveSettings}
              />
            )}

            {activeTab === 'theme' && (
              <ThemeSection
                settings={settings}
                onUpdateTheme={setTheme}
                onSave={handleSaveSettings}
              />
            )}

            {activeTab === 'shortcuts' && (
              <ShortcutsSection
                settings={settings}
                onUpdateShortcuts={updateShortcutSettings}
                onSave={handleSaveSettings}
              />
            )}

            {activeTab === 'about' && (
              <AboutSection />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 设置页面
 * 使用Suspense包装以处理useSearchParams
 */
export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">加载设置中...</p>
        </div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}