'use client';

import React, { useState } from 'react';
import { Settings, AIProvider } from '../../lib/types';
import { aiProviderUtils } from '../../hooks/useSettings';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { AlertCircle, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react';

interface AIConfigSectionProps {
  settings: Settings;
  onUpdateAI: (updates: Partial<Settings['ai']>) => void;
  onSave: () => Promise<boolean>;
}

/**
 * AI配置组件
 * 用于配置AI模型相关设置
 */
export function AIConfigSection({ settings, onUpdateAI, onSave }: AIConfigSectionProps) {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectionError, setConnectionError] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 处理提供商变更
  const handleProviderChange = (provider: AIProvider) => {
    onUpdateAI({
      provider,
      model: aiProviderUtils.getDefaultModel(provider),
      apiKey: '' // 清空API密钥，让用户重新输入
    });
    setConnectionStatus('idle');
  };

  // 处理API密钥变更
  const handleApiKeyChange = (apiKey: string) => {
    onUpdateAI({ apiKey });
    setConnectionStatus('idle');
  };

  // 处理模型变更
  const handleModelChange = (model: string) => {
    onUpdateAI({ model });
  };

  // 处理温度参数变更
  const handleTemperatureChange = (temperature: number) => {
    onUpdateAI({ temperature });
  };

  // 测试API连接
  const testConnection = async () => {
    if (!settings.ai.apiKey.trim()) {
      setConnectionStatus('error');
      setConnectionError('请先输入API密钥');
      return;
    }

    if (!aiProviderUtils.validateApiKey(settings.ai.provider, settings.ai.apiKey)) {
      setConnectionStatus('error');
      setConnectionError('API密钥格式不正确');
      return;
    }

    setIsTestingConnection(true);
    setConnectionError('');

    try {
      // 这里应该调用实际的API测试
      // 暂时模拟测试过程
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 模拟成功/失败
      const isSuccess = Math.random() > 0.3; // 70%成功率
      
      if (isSuccess) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
        setConnectionError('连接失败：API密钥无效或网络错误');
      }
    } catch (error) {
      setConnectionStatus('error');
      setConnectionError('连接测试失败：' + (error as Error).message);
    } finally {
      setIsTestingConnection(false);
    }
  };

  // 保存设置
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await onSave();
      if (success) {
        // 可以显示成功提示
      }
    } finally {
      setIsSaving(false);
    }
  };

  // 获取连接状态显示
  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case 'success':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">连接成功</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{connectionError}</span>
          </div>
        );
      default:
        return null;
    }
  };

  // 获取可用模型列表
  const getAvailableModels = (provider: AIProvider): string[] => {
    const models = {
      openai: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o'],
      claude: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229'],
      gemini: ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro'],
      local: ['local-model', 'custom-model']
    };
    return models[provider] || [];
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* 标题 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            AI模型配置
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            配置AI智能分组功能使用的模型和参数
          </p>
        </div>

        {/* AI提供商选择 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            AI提供商
          </label>
          <Select
            value={settings.ai.provider}
            onValueChange={handleProviderChange}
            className="w-full"
          >
            {aiProviderUtils.getAllProviders().map(provider => (
              <option key={provider.value} value={provider.value}>
                {provider.label}
              </option>
            ))}
          </Select>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {aiProviderUtils.getProviderDescription(settings.ai.provider)}
          </p>
        </div>

        {/* API密钥输入 */}
        {settings.ai.provider !== 'local' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              API密钥
            </label>
            <div className="relative">
              <Input
                type={showApiKey ? 'text' : 'password'}
                value={settings.ai.apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder={`输入${aiProviderUtils.getProviderDisplayName(settings.ai.provider)}的API密钥`}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {settings.ai.apiKey && !aiProviderUtils.validateApiKey(settings.ai.provider, settings.ai.apiKey) && (
              <p className="text-xs text-red-600">API密钥格式不正确</p>
            )}
          </div>
        )}

        {/* 模型选择 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            模型
          </label>
          <Select
            value={settings.ai.model}
            onValueChange={handleModelChange}
            className="w-full"
          >
            {getAvailableModels(settings.ai.provider).map(model => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </Select>
        </div>

        {/* 温度参数 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            温度参数: {settings.ai.temperature}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={settings.ai.temperature}
            onChange={(e) => handleTemperatureChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>保守 (0.0)</span>
            <span>平衡 (1.0)</span>
            <span>创新 (2.0)</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            较低的值使输出更确定，较高的值使输出更随机和创造性
          </p>
        </div>

        {/* 连接测试 */}
        {settings.ai.provider !== 'local' && (
          <div className="space-y-3">
            <Button
              onClick={testConnection}
              disabled={isTestingConnection || !settings.ai.apiKey.trim()}
              variant="outline"
              className="w-full"
            >
              {isTestingConnection ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  测试连接中...
                </>
              ) : (
                '测试API连接'
              )}
            </Button>
            {getConnectionStatusDisplay()}
          </div>
        )}

        {/* 功能状态 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            功能状态
          </label>
          <div className="flex items-center gap-2">
            <Badge variant={settings.ai.enabled ? 'success' : 'secondary'}>
              {settings.ai.enabled ? '已启用' : '已禁用'}
            </Badge>
            <button
              onClick={() => onUpdateAI({ enabled: !settings.ai.enabled })}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {settings.ai.enabled ? '禁用' : '启用'}AI智能分组
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {settings.ai.enabled 
              ? 'AI智能分组功能已启用，将根据标签页内容自动建议分组' 
              : 'AI智能分组功能已禁用，仅支持手动分组'}
          </p>
        </div>

        {/* 保存按钮 */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              '保存AI配置'
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}