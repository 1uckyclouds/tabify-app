'use client';

import React, { useState } from 'react';
import { Settings } from '../../lib/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { 
  Keyboard, 
  Search, 
  MousePointer, 
  Layers, 
  Download, 
  Upload, 
  Settings as SettingsIcon,
  Info,
  Edit3,
  RotateCcw
} from 'lucide-react';

interface ShortcutsSectionProps {
  settings: Settings;
  onUpdateShortcuts: (updates: Partial<Settings['shortcuts']>) => void;
  onSave: () => Promise<boolean>;
}

/**
 * 快捷键设置组件
 * 显示和配置应用快捷键
 */
export function ShortcutsSection({ settings, onUpdateShortcuts, onSave }: ShortcutsSectionProps) {
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null);
  const [tempShortcut, setTempShortcut] = useState('');

  // 预定义的快捷键配置
  const shortcutCategories = [
    {
      title: '基础操作',
      icon: <MousePointer className="w-4 h-4" />,
      shortcuts: [
        {
          key: 'openExtension',
          label: '打开扩展',
          description: '快速打开Tabify扩展面板',
          defaultValue: 'Ctrl+Shift+T',
          icon: <SettingsIcon className="w-4 h-4" />
        },
        {
          key: 'focusSearch',
          label: '聚焦搜索',
          description: '快速聚焦到搜索框',
          defaultValue: 'Ctrl+F',
          icon: <Search className="w-4 h-4" />
        },
        {
          key: 'selectAll',
          label: '全选标签',
          description: '选择所有可见的标签页',
          defaultValue: 'Ctrl+A',
          icon: <Layers className="w-4 h-4" />
        }
      ]
    },
    {
      title: '分组操作',
      icon: <Layers className="w-4 h-4" />,
      shortcuts: [
        {
          key: 'createGroup',
          label: '创建分组',
          description: '为选中的标签页创建新分组',
          defaultValue: 'Ctrl+G',
          icon: <Layers className="w-4 h-4" />
        },
        {
          key: 'smartGroup',
          label: 'AI智能分组',
          description: '使用AI自动分组标签页',
          defaultValue: 'Ctrl+Shift+G',
          icon: <Layers className="w-4 h-4" />
        },
        {
          key: 'groupByDomain',
          label: '按域名分组',
          description: '按网站域名自动分组',
          defaultValue: 'Ctrl+D',
          icon: <Layers className="w-4 h-4" />
        }
      ]
    },
    {
      title: '批量操作',
      icon: <Edit3 className="w-4 h-4" />,
      shortcuts: [
        {
          key: 'batchRestore',
          label: '批量恢复',
          description: '恢复选中的标签页',
          defaultValue: 'Ctrl+R',
          icon: <RotateCcw className="w-4 h-4" />
        },
        {
          key: 'batchDelete',
          label: '批量删除',
          description: '删除选中的标签页',
          defaultValue: 'Delete',
          icon: <Edit3 className="w-4 h-4" />
        }
      ]
    },
    {
      title: '数据管理',
      icon: <Download className="w-4 h-4" />,
      shortcuts: [
        {
          key: 'exportData',
          label: '导出数据',
          description: '导出标签页数据',
          defaultValue: 'Ctrl+E',
          icon: <Download className="w-4 h-4" />
        },
        {
          key: 'importData',
          label: '导入数据',
          description: '导入标签页数据',
          defaultValue: 'Ctrl+I',
          icon: <Upload className="w-4 h-4" />
        }
      ]
    }
  ];

  // 获取快捷键值
  const getShortcutValue = (key: string, defaultValue: string): string => {
    return (settings.shortcuts as any)[key] || defaultValue;
  };

  // 开始编辑快捷键
  const startEditingShortcut = (key: string, currentValue: string) => {
    setEditingShortcut(key);
    setTempShortcut(currentValue);
  };

  // 保存快捷键
  const saveShortcut = (key: string) => {
    if (tempShortcut.trim()) {
      onUpdateShortcuts({ [key]: tempShortcut.trim() });
    }
    setEditingShortcut(null);
    setTempShortcut('');
  };

  // 取消编辑
  const cancelEditing = () => {
    setEditingShortcut(null);
    setTempShortcut('');
  };

  // 重置快捷键
  const resetShortcut = (key: string, defaultValue: string) => {
    onUpdateShortcuts({ [key]: defaultValue });
  };

  // 重置所有快捷键
  const resetAllShortcuts = () => {
    const defaultShortcuts: any = {};
    shortcutCategories.forEach(category => {
      category.shortcuts.forEach(shortcut => {
        defaultShortcuts[shortcut.key] = shortcut.defaultValue;
      });
    });
    onUpdateShortcuts(defaultShortcuts);
  };

  // 检测快捷键冲突
  const hasConflict = (key: string, value: string): boolean => {
    return shortcutCategories.some(category =>
      category.shortcuts.some(shortcut =>
        shortcut.key !== key && getShortcutValue(shortcut.key, shortcut.defaultValue) === value
      )
    );
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* 标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              快捷键设置
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              查看和自定义应用快捷键，提高使用效率
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={resetAllShortcuts}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            重置全部
          </Button>
        </div>

        {/* 快捷键启用状态 */}
        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center gap-3">
            <Keyboard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <div className="font-medium text-blue-900 dark:text-blue-100">
                快捷键功能
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                {settings.shortcuts.enabled ? '已启用' : '已禁用'}
              </div>
            </div>
          </div>
          <Button
            variant={settings.shortcuts.enabled ? 'destructive' : 'default'}
            size="sm"
            onClick={() => onUpdateShortcuts({ enabled: !settings.shortcuts.enabled })}
          >
            {settings.shortcuts.enabled ? '禁用' : '启用'}
          </Button>
        </div>

        {/* 快捷键列表 */}
        {settings.shortcuts.enabled && (
          <div className="space-y-6">
            {shortcutCategories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="space-y-3">
                {/* 分类标题 */}
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                  {category.icon}
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {category.title}
                  </h4>
                </div>

                {/* 快捷键项目 */}
                <div className="space-y-2">
                  {category.shortcuts.map((shortcut) => {
                    const currentValue = getShortcutValue(shortcut.key, shortcut.defaultValue);
                    const isEditing = editingShortcut === shortcut.key;
                    const hasConflictIssue = hasConflict(shortcut.key, currentValue);

                    return (
                      <div
                        key={shortcut.key}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          hasConflictIssue 
                            ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                            : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {shortcut.icon}
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {shortcut.label}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {shortcut.description}
                            </div>
                            {hasConflictIssue && (
                              <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                                ⚠️ 快捷键冲突
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={tempShortcut}
                                onChange={(e) => setTempShortcut(e.target.value)}
                                placeholder="输入快捷键"
                                className="w-32 text-sm"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    saveShortcut(shortcut.key);
                                  } else if (e.key === 'Escape') {
                                    cancelEditing();
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                size="sm"
                                onClick={() => saveShortcut(shortcut.key)}
                              >
                                保存
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEditing}
                              >
                                取消
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Badge
                                variant={hasConflictIssue ? 'destructive' : 'secondary'}
                                className="font-mono text-xs"
                              >
                                {currentValue}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditingShortcut(shortcut.key, currentValue)}
                              >
                                编辑
                              </Button>
                              {currentValue !== shortcut.defaultValue && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => resetShortcut(shortcut.key, shortcut.defaultValue)}
                                >
                                  重置
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 使用说明 */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            使用说明
          </h4>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 text-blue-500" />
                <div>
                  <strong>快捷键格式：</strong>使用 + 连接多个按键，如 Ctrl+Shift+T
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 text-blue-500" />
                <div>
                  <strong>修饰键：</strong>Ctrl、Shift、Alt、Meta（Windows键/Cmd键）
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 text-blue-500" />
                <div>
                  <strong>功能键：</strong>F1-F12、Enter、Space、Tab、Escape等
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 text-orange-500" />
                <div>
                  <strong>注意：</strong>避免与浏览器或系统快捷键冲突
                </div>
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
            保存快捷键设置
          </Button>
        </div>
      </div>
    </Card>
  );
}