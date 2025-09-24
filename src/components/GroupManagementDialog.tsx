'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { X, Folder, Plus, Edit3, Save, AlertCircle } from 'lucide-react';
import { Group, Tab } from '../lib/types';

interface GroupManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  group?: Group;
  selectedTabs?: Tab[];
  existingGroups: Group[];
  onCreateGroup: (groupData: { name: string; description?: string; color?: string }) => Promise<boolean>;
  onUpdateGroup: (groupId: string, updates: { name?: string; description?: string; color?: string }) => Promise<boolean>;
}

/**
 * 分组管理对话框组件
 * 支持创建新分组和编辑现有分组
 */
export function GroupManagementDialog({
  isOpen,
  onClose,
  mode,
  group,
  selectedTabs = [],
  existingGroups,
  onCreateGroup,
  onUpdateGroup
}: GroupManagementDialogProps) {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupColor, setGroupColor] = useState('blue');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');

  // 预定义的颜色选项
  const colorOptions = [
    { value: 'blue', label: '蓝色', class: 'bg-blue-500' },
    { value: 'green', label: '绿色', class: 'bg-green-500' },
    { value: 'yellow', label: '黄色', class: 'bg-yellow-500' },
    { value: 'red', label: '红色', class: 'bg-red-500' },
    { value: 'purple', label: '紫色', class: 'bg-purple-500' },
    { value: 'orange', label: '橙色', class: 'bg-orange-500' },
    { value: 'cyan', label: '青色', class: 'bg-cyan-500' },
    { value: 'teal', label: '青绿色', class: 'bg-teal-500' }
  ];

  // 初始化表单数据
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && group) {
        setGroupName(group.name);
        setGroupDescription(group.description || '');
        setGroupColor(group.color || 'blue');
      } else {
        setGroupName('');
        setGroupDescription('');
        setGroupColor('blue');
      }
      setError('');
      setNameError('');
    }
  }, [isOpen, mode, group]);

  // 验证分组名称
  const validateGroupName = (name: string): string => {
    if (!name.trim()) {
      return '分组名称不能为空';
    }
    if (name.trim().length < 2) {
      return '分组名称至少需要2个字符';
    }
    if (name.trim().length > 50) {
      return '分组名称不能超过50个字符';
    }
    
    // 检查是否与现有分组重名（编辑模式下排除当前分组）
    const isDuplicate = existingGroups.some(existingGroup => 
      existingGroup.name.toLowerCase() === name.trim().toLowerCase() &&
      (mode === 'create' || existingGroup.id !== group?.id)
    );
    
    if (isDuplicate) {
      return '分组名称已存在，请选择其他名称';
    }
    
    return '';
  };

  // 处理分组名称变更
  const handleNameChange = (value: string) => {
    setGroupName(value);
    const error = validateGroupName(value);
    setNameError(error);
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证表单
    const nameValidationError = validateGroupName(groupName);
    if (nameValidationError) {
      setNameError(nameValidationError);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const groupData = {
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        color: groupColor
      };

      let success = false;
      if (mode === 'create') {
        success = await onCreateGroup(groupData);
      } else if (mode === 'edit' && group) {
        success = await onUpdateGroup(group.id, groupData);
      }

      if (success) {
        onClose();
      } else {
        setError(mode === 'create' ? '创建分组失败，请重试' : '更新分组失败，请重试');
      }
    } catch (err) {
      console.error('分组操作失败:', err);
      setError('操作失败：' + (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理对话框关闭
  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* 对话框标题 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                {mode === 'create' ? (
                  <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Edit3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {mode === 'create' ? '创建新分组' : '编辑分组'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {mode === 'create' 
                    ? `将 ${selectedTabs.length} 个标签页添加到新分组`
                    : '修改分组信息'
                  }
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-8 h-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* 表单内容 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 分组名称 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                分组名称 <span className="text-red-500">*</span>
              </label>
              <Input
                value={groupName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="输入分组名称"
                error={!!nameError}
                disabled={isSubmitting}
                maxLength={50}
              />
              {nameError && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  {nameError}
                </div>
              )}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {groupName.length}/50 字符
              </div>
            </div>

            {/* 分组描述 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                分组描述（可选）
              </label>
              <textarea
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="输入分组描述"
                disabled={isSubmitting}
                maxLength={200}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {groupDescription.length}/200 字符
              </div>
            </div>

            {/* 分组颜色 */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                分组颜色
              </label>
              <div className="grid grid-cols-6 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setGroupColor(color.value)}
                    disabled={isSubmitting}
                    className={`relative w-full h-8 rounded-full border transition-all duration-200 ${
                      groupColor === color.value
                        ? 'border-2 border-white shadow-lg ring-2 ring-gray-400 dark:ring-gray-300 scale-110'
                        : 'border border-gray-200 dark:border-gray-600 hover:scale-105 hover:shadow-md'
                    } ${color.class} disabled:opacity-50`}
                    title={color.label}
                  >
                    {groupColor === color.value && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {/* 显示当前选中颜色的名称 */}
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                当前选择：{colorOptions.find(c => c.value === groupColor)?.label || '未知颜色'}
              </div>
            </div>

            {/* 预览信息 */}
            {mode === 'create' && selectedTabs.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  将要添加的标签页
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
                  {selectedTabs.slice(0, 5).map((tab) => (
                    <div key={tab.id} className="flex items-center gap-2 text-sm">
                      {tab.favicon && (
                        <img src={tab.favicon} alt="" className="w-4 h-4" />
                      )}
                      <span className="truncate text-gray-900 dark:text-gray-100">
                        {tab.title}
                      </span>
                    </div>
                  ))}
                  {selectedTabs.length > 5 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      还有 {selectedTabs.length - 5} 个标签页...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 错误信息 */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !!nameError || !groupName.trim()}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    {mode === 'create' ? '创建中...' : '保存中...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {mode === 'create' ? '创建分组' : '保存更改'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}