'use client';

import React from 'react';
import { Settings, ThemeType } from '../../lib/types';
import { themeUtils } from '../../hooks/useSettings';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Sun, Moon, Monitor, Palette } from 'lucide-react';

interface ThemeSectionProps {
  settings: Settings;
  onUpdateTheme: (theme: ThemeType) => void;
  onSave: () => Promise<boolean>;
}

/**
 * 主题设置组件
 * 用于配置应用外观主题
 */
export function ThemeSection({ settings, onUpdateTheme, onSave }: ThemeSectionProps) {
  // 获取主题图标
  const getThemeIcon = (theme: ThemeType) => {
    switch (theme) {
      case 'light':
        return <Sun className="w-5 h-5" />;
      case 'dark':
        return <Moon className="w-5 h-5" />;
      case 'pixel':
        return <Monitor className="w-5 h-5" />;
      default:
        return <Palette className="w-5 h-5" />;
    }
  };

  // 获取主题预览样式
  const getThemePreviewStyle = (theme: ThemeType) => {
    const baseStyle = "w-full h-20 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:scale-105";
    
    switch (theme) {
      case 'light':
        return `${baseStyle} bg-white border-gray-200 shadow-sm`;
      case 'dark':
        return `${baseStyle} bg-gray-900 border-gray-700 shadow-lg`;
      case 'pixel':
        return `${baseStyle} bg-gradient-to-br from-green-400 to-blue-500 border-gray-400 shadow-md`;
      default:
        return baseStyle;
    }
  };

  // 获取主题预览内容
  const getThemePreviewContent = (theme: ThemeType) => {
    switch (theme) {
      case 'light':
        return (
          <div className="p-3 h-full flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div className="w-16 h-2 bg-gray-300 rounded"></div>
            </div>
            <div className="space-y-1">
              <div className="w-full h-1.5 bg-gray-200 rounded"></div>
              <div className="w-3/4 h-1.5 bg-gray-200 rounded"></div>
            </div>
          </div>
        );
      case 'dark':
        return (
          <div className="p-3 h-full flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              <div className="w-16 h-2 bg-gray-600 rounded"></div>
            </div>
            <div className="space-y-1">
              <div className="w-full h-1.5 bg-gray-700 rounded"></div>
              <div className="w-3/4 h-1.5 bg-gray-700 rounded"></div>
            </div>
          </div>
        );
      case 'pixel':
        return (
          <div className="p-3 h-full flex flex-col justify-between text-white">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-300 rounded-none"></div>
              <div className="w-16 h-2 bg-white/80 rounded-none"></div>
            </div>
            <div className="space-y-1">
              <div className="w-full h-1.5 bg-white/60 rounded-none"></div>
              <div className="w-3/4 h-1.5 bg-white/60 rounded-none"></div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* 标题 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            外观主题
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            选择您喜欢的界面主题风格
          </p>
        </div>

        {/* 当前主题显示 */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          {getThemeIcon(settings.theme)}
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              当前主题: {themeUtils.getThemeDisplayName(settings.theme)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {themeUtils.getThemeDescription(settings.theme)}
            </div>
          </div>
          <Badge variant="success" className="ml-auto">
            已应用
          </Badge>
        </div>

        {/* 主题选择 */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            选择主题
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {themeUtils.getAllThemes().map((theme) => {
              const isSelected = settings.theme === theme.value;
              
              return (
                <div
                  key={theme.value}
                  className={`relative group ${
                    isSelected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' : ''
                  }`}
                  onClick={() => onUpdateTheme(theme.value)}
                >
                  {/* 主题预览 */}
                  <div className={getThemePreviewStyle(theme.value)}>
                    {getThemePreviewContent(theme.value)}
                  </div>
                  
                  {/* 主题信息 */}
                  <div className="mt-3 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      {getThemeIcon(theme.value)}
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {theme.label}
                      </span>
                      {isSelected && (
                        <Badge variant="success" size="sm">
                          当前
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {theme.description}
                    </p>
                  </div>
                  
                  {/* 选择按钮 */}
                  {!isSelected && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateTheme(theme.value);
                      }}
                    >
                      应用此主题
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 主题特性说明 */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            主题特性
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Sun className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  明亮主题
                </span>
              </div>
              <ul className="text-blue-800 dark:text-blue-200 space-y-1">
                <li>• 经典白色背景</li>
                <li>• 适合日间使用</li>
                <li>• 清晰易读</li>
                <li>• 省电模式友好</li>
              </ul>
            </div>
            
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Moon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  暗黑主题
                </span>
              </div>
              <ul className="text-gray-700 dark:text-gray-300 space-y-1">
                <li>• 深色背景护眼</li>
                <li>• 适合夜间使用</li>
                <li>• 减少蓝光刺激</li>
                <li>• 节省屏幕电量</li>
              </ul>
            </div>
            
            <div className="p-3 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Monitor className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="font-medium text-green-900 dark:text-green-100">
                  像素风格
                </span>
              </div>
              <ul className="text-green-800 dark:text-green-200 space-y-1">
                <li>• 复古像素风格</li>
                <li>• 怀旧游戏体验</li>
                <li>• 独特视觉效果</li>
                <li>• 个性化界面</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 自动主题切换 */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            自动切换
          </h4>
          
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-yellow-900 text-xs font-bold">!</span>
              </div>
              <div>
                <div className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                  即将推出
                </div>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  自动根据系统时间或系统主题设置切换明亮/暗黑主题，让您的使用体验更加智能化。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 保存按钮 */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={onSave}
            className="w-full"
          >
            保存主题设置
          </Button>
        </div>
      </div>
    </Card>
  );
}