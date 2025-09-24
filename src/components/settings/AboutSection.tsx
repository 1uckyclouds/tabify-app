'use client';

import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  Info, 
  Heart, 
  Star, 
  MessageCircle, 
  ExternalLink, 
  Github, 
  Mail, 
  Globe,
  Users,
  Calendar,
  Award,
  Zap,
  Shield,
  Download
} from 'lucide-react';
import { APP_VERSION } from '../../lib/types';

/**
 * 关于和反馈组件
 * 显示应用信息、版本、反馈渠道等
 */
export function AboutSection() {
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'general'>('general');
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // 应用信息
  const appInfo = {
    name: 'Tabify',
    version: APP_VERSION,
    description: '智能标签页管理Chrome扩展',
    author: 'Tabify Team',
    website: 'https://tabify.app',
    github: 'https://github.com/tabify/tabify',
    email: 'support@tabify.app',
    releaseDate: '2024-01-15',
    license: 'MIT License'
  };

  // 功能特性
  const features = [
    {
      icon: <Zap className="w-4 h-4" />,
      title: 'AI智能分组',
      description: '基于内容自动分组标签页'
    },
    {
      icon: <Users className="w-4 h-4" />,
      title: '批量操作',
      description: '高效管理大量标签页'
    },
    {
      icon: <Shield className="w-4 h-4" />,
      title: '数据安全',
      description: '本地存储，保护隐私'
    },
    {
      icon: <Download className="w-4 h-4" />,
      title: '数据导入导出',
      description: '支持多种格式备份'
    }
  ];

  // 反馈类型
  const feedbackTypes = [
    { value: 'bug', label: '错误报告', icon: '🐛' },
    { value: 'feature', label: '功能建议', icon: '💡' },
    { value: 'general', label: '一般反馈', icon: '💬' }
  ];

  // 提交反馈
  const submitFeedback = async () => {
    if (!feedbackText.trim()) return;

    setIsSubmittingFeedback(true);
    try {
      // 这里应该调用实际的反馈提交API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 模拟成功
      alert('感谢您的反馈！我们会认真考虑您的建议。');
      setFeedbackText('');
    } catch (error) {
      alert('提交失败，请稍后重试或通过邮件联系我们。');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // 打开外部链接
  const openExternalLink = (url: string) => {
    if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
  };

  return (
    <div className="space-y-6">
      {/* 应用信息卡片 */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* 应用标题 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">T</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {appInfo.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {appInfo.description}
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <Badge variant="secondary">
                版本 {appInfo.version}
              </Badge>
              <Badge variant="success">
                稳定版
              </Badge>
            </div>
          </div>

          {/* 应用详情 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    开发团队
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {appInfo.author}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    发布日期
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {appInfo.releaseDate}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Award className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    开源协议
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {appInfo.license}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    官方网站
                  </div>
                  <button
                    onClick={() => openExternalLink(appInfo.website)}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                  >
                    {appInfo.website}
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 快速链接 */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openExternalLink(appInfo.github)}
              className="flex items-center gap-2"
            >
              <Github className="w-4 h-4" />
              GitHub
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => openExternalLink(`mailto:${appInfo.email}`)}
              className="flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              邮件支持
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => openExternalLink(appInfo.website)}
              className="flex items-center gap-2"
            >
              <Globe className="w-4 h-4" />
              官网
            </Button>
          </div>
        </div>
      </Card>

      {/* 功能特性 */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            核心特性
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="text-blue-600 dark:text-blue-400 mt-0.5">
                  {feature.icon}
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {feature.title}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 反馈和支持 */}
      <Card className="p-6">
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-500" />
            反馈和支持
          </h3>

          {/* 反馈类型选择 */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              反馈类型
            </label>
            <div className="flex gap-2">
              {feedbackTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFeedbackType(type.value as any)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    feedbackType === type.value
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-2">{type.icon}</span>
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* 反馈内容 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              反馈内容
            </label>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="请详细描述您的问题、建议或想法..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 resize-none"
            />
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {feedbackText.length}/500 字符
            </div>
          </div>

          {/* 提交按钮 */}
          <Button
            onClick={submitFeedback}
            disabled={!feedbackText.trim() || isSubmittingFeedback}
            className="w-full"
          >
            {isSubmittingFeedback ? '提交中...' : '提交反馈'}
          </Button>

          {/* 其他联系方式 */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              您也可以通过以下方式联系我们：
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">邮箱：</span>
                <button
                  onClick={() => openExternalLink(`mailto:${appInfo.email}`)}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {appInfo.email}
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Github className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">GitHub：</span>
                <button
                  onClick={() => openExternalLink(appInfo.github)}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  提交Issue
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 致谢 */}
      <Card className="p-6">
        <div className="text-center space-y-3">
          <Heart className="w-8 h-8 text-red-500 mx-auto" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            感谢使用 Tabify
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            感谢您选择 Tabify 来管理您的标签页。我们致力于为您提供最好的浏览体验，
            您的反馈和建议是我们不断改进的动力。
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openExternalLink('https://chrome.google.com/webstore')}
              className="flex items-center gap-2"
            >
              <Star className="w-4 h-4" />
              给我们评分
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openExternalLink(appInfo.website)}
              className="flex items-center gap-2"
            >
              <Heart className="w-4 h-4" />
              推荐给朋友
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}