'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Upload, Download, FileText, AlertCircle, CheckCircle, X, Info, Copy, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { quickExportAllData, quickImportData, quickImportText } from '../../lib/import-export';
import { ImportResult, ImportOptions } from '../../lib/types';

/**
 * 导入导出页面组件
 * 提供数据备份、恢复和OneTab兼容等功能
 */
export default function ImportExportPage() {
  // 状态管理
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [exportMessage, setExportMessage] = useState<string>('');
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    overwriteExisting: false,
    importSettings: true,
    duplicateStrategy: 'rename',
    createBackup: true
  });

  // 文本导入相关状态
  const [importMode, setImportMode] = useState<'file' | 'text'>('text');
  const [textInput, setTextInput] = useState<string>('');
  const [parsedData, setParsedData] = useState<Array<{url: string, title: string, isValid: boolean}>>([]);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [formatType, setFormatType] = useState<'unknown' | 'onetab' | 'other'>('unknown');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // 导出数据
  const handleExport = async (includeSettings: boolean = true) => {
    setIsExporting(true);
    setExportMessage('');
    
    try {
      await quickExportAllData(includeSettings);
      setExportMessage('数据导出成功！文件已下载到您的下载文件夹。');
      
      // 3秒后清除消息
      setTimeout(() => setExportMessage(''), 5000);
    } catch (error) {
      console.error('导出失败:', error);
      setExportMessage('导出失败，请重试。');
    } finally {
      setIsExporting(false);
    }
  };

  // 处理文件选择
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      // 传递用户实际选择的导入选项
      const result = await quickImportData(file, importOptions);
      setImportResult(result);
    } catch (error) {
      console.error('导入失败:', error);
      setImportResult({
        success: false,
        tabsImported: 0,
        groupsImported: 0,
        duplicatesSkipped: 0,
        errors: ['导入过程中发生错误，请检查文件格式是否正确。'],
        warnings: []
      });
    } finally {
      setIsImporting(false);
    }

    // 清空文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 触发文件选择
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // 关闭导入结果
  const handleCloseResult = () => {
    setImportResult(null);
  };

  // 解析OneTab格式的文本
  const parseOneTabText = (text: string): Array<{url: string, title: string, isValid: boolean}> => {
    if (!text.trim()) return [];

    const lines = text.split('\n').filter(line => line.trim());
    const results: Array<{url: string, title: string, isValid: boolean}> = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // 标准OneTab格式: URL | Title
      const separatorMatch = trimmedLine.match(/^(https?:\/\/[^\s|]+)\s*\|\s*(.+)$/);
      if (separatorMatch) {
        const url = separatorMatch[1].trim();
        const title = separatorMatch[2].trim();
        results.push({ url, title, isValid: true });
        return;
      }

      // 纯URL格式
      const urlMatch = trimmedLine.match(/^(https?:\/\/[^\s]+)$/);
      if (urlMatch) {
        const url = urlMatch[1].trim();
        try {
          const urlObj = new URL(url);
          const title = urlObj.hostname.replace(/^www\./, '');
          results.push({ url, title, isValid: true });
        } catch {
          results.push({ url, title: url, isValid: true });
        }
        return;
      }

      // 包含URL的混合格式
      const mixedUrlMatch = trimmedLine.match(/(https?:\/\/[^\s]+)/);
      if (mixedUrlMatch) {
        const url = mixedUrlMatch[1];
        const title = trimmedLine.replace(url, '').replace(/^\s*\|\s*|\s*\|\s*$/g, '').trim() || new URL(url).hostname.replace(/^www\./, '');
        results.push({ url, title, isValid: true });
        return;
      }

      // 如果不是有效格式，添加到结果中但标记为无效
      results.push({ url: '', title: trimmedLine, isValid: false });
    });

    return results;
  };

  // 检测文本格式类型
  const detectTextFormat = (text: string): 'unknown' | 'onetab' | 'other' => {
    if (!text.trim()) return 'unknown';

    const hasUrlPattern = /https?:\/\/[^\s]+/i.test(text);
    const hasSeparatorPattern = /\s*\|\s*/.test(text);
    const hasMultipleLines = text.split('\n').filter(line => line.trim()).length > 1;
    const validUrlCount = text.split('\n').filter(line => /https?:\/\/[^\s|]+/i.test(line)).length;

    if (hasUrlPattern && validUrlCount > 0 && (hasSeparatorPattern || hasMultipleLines)) {
      return 'onetab';
    }

    return 'other';
  };

  // 处理文本输入变化
  const handleTextInputChange = (value: string) => {
    setTextInput(value);

    if (value.trim()) {
      const parsed = parseOneTabText(value);
      const format = detectTextFormat(value);
      setParsedData(parsed);
      setFormatType(format);
      setShowPreview(true);
    } else {
      setParsedData([]);
      setFormatType('unknown');
      setShowPreview(false);
    }
  };

  // 处理粘贴操作
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setTextInput(text);
      handleTextInputChange(text);
    } catch (error) {
      console.error('粘贴失败:', error);
    }
  };

  // 清空文本输入
  const clearTextInput = () => {
    setTextInput('');
    setParsedData([]);
    setFormatType('unknown');
    setShowPreview(false);
  };

  // 从文本导入数据
  const handleTextImport = async () => {
    if (!textInput.trim()) {
      setImportResult({
        success: false,
        tabsImported: 0,
        groupsImported: 0,
        duplicatesSkipped: 0,
        errors: ['请输入要导入的数据'],
        warnings: []
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      // 传递用户实际选择的导入选项
      const result = await quickImportText(textInput, importOptions);
      setImportResult(result);
    } catch (error) {
      console.error('导入失败:', error);
      setImportResult({
        success: false,
        tabsImported: 0,
        groupsImported: 0,
        duplicatesSkipped: 0,
        errors: ['导入过程中发生错误，请检查数据格式是否正确。'],
        warnings: []
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                // 在Chrome扩展环境中直接导航到manager.html
                if (typeof window !== 'undefined') {
                  window.location.href = 'manager.html';
                }
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>返回主页</span>
            </button>
            <div className="w-px h-6 bg-gray-300"></div>
            <h1 className="text-xl font-semibold text-gray-900">数据管理</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 标签页切换 */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8 w-fit">
          <button
            onClick={() => setActiveTab('export')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'export'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            导出数据
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'import'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            导入数据
          </button>
        </div>

        {/* 导出页面 */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Download className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">导出数据</h2>
                  <p className="text-gray-600">
                    将您的标签页数据导出为JSON文件，用于备份或迁移到其他设备。
                  </p>
                </div>
              </div>

              {/* 导出选项 */}
              <div className="space-y-4 mb-6">
                <h3 className="text-md font-medium text-gray-900">导出选项</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleExport(false)}
                    disabled={isExporting}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <span className="font-medium text-gray-900">仅导出标签页数据</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      只导出标签页和分组信息，不包含个人设置
                    </p>
                  </button>
                  
                  <button
                    onClick={() => handleExport(true)}
                    disabled={isExporting}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-900">完整导出</span>
                      <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">推荐</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      导出所有数据，包括标签页、分组和个人设置
                    </p>
                  </button>
                </div>
              </div>

              {/* 导出状态消息 */}
              {exportMessage && (
                <div className={`p-4 rounded-lg flex items-start gap-3 ${
                  exportMessage.includes('成功') 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  {exportMessage.includes('成功') ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${
                      exportMessage.includes('成功') ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {exportMessage}
                    </p>
                  </div>
                </div>
              )}

              {/* 导出说明 */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">导出说明</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 导出的文件为JSON格式，包含所有标签页和分组信息</li>
                      <li>• 文件将自动下载到您的默认下载文件夹</li>
                      <li>• 建议定期导出数据作为备份</li>
                      <li>• 导出的文件可以在其他设备上导入使用</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 导入页面 */}
        {activeTab === 'import' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Upload className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">导入数据</h2>
                  <p className="text-gray-600">
                    从JSON文件导入标签页数据，支持Tabify导出的文件和OneTab格式。
                  </p>
                </div>
              </div>

              {/* 导入选项 */}
              <div className="space-y-4 mb-6">
                <h3 className="text-md font-medium text-gray-900">导入选项</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={importOptions.importSettings}
                      onChange={(e) => setImportOptions(prev => ({ ...prev, importSettings: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">导入设置</div>
                      <div className="text-xs text-gray-500">同时导入主题、AI配置等个人设置</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={importOptions.createBackup}
                      onChange={(e) => setImportOptions(prev => ({ ...prev, createBackup: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">创建备份</div>
                      <div className="text-xs text-gray-500">导入前自动备份当前数据</div>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    重复数据处理
                  </label>
                  <select
                    value={importOptions.duplicateStrategy}
                    onChange={(e) => setImportOptions(prev => ({ 
                      ...prev, 
                      duplicateStrategy: e.target.value as 'skip' | 'overwrite' | 'rename'
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="skip">跳过重复项</option>
                    <option value="overwrite">覆盖现有数据</option>
                    <option value="rename">重命名导入项</option>
                  </select>
                </div>
              </div>

              {/* 导入方式选择 */}
              <div className="mb-6">
                <div className="flex space-x-2 mb-4">
                  <button
                    onClick={() => setImportMode('text')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      importMode === 'text'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Copy className="w-4 h-4" />
                      文本粘贴
                    </div>
                  </button>
                  <button
                    onClick={() => setImportMode('file')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      importMode === 'file'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Upload className="w-4 h-4" />
                      文件上传
                    </div>
                  </button>
                </div>

                {/* 文本粘贴区域 */}
                {importMode === 'text' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">
                        粘贴OneTab导出的数据
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handlePaste}
                          className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          粘贴
                        </button>
                        {textInput && (
                          <button
                            onClick={clearTextInput}
                            className="flex items-center gap-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                          >
                            <X className="w-3 h-3" />
                            清空
                          </button>
                        )}
                      </div>
                    </div>

                    <textarea
                      ref={textAreaRef}
                      value={textInput}
                      onChange={(e) => handleTextInputChange(e.target.value)}
                      placeholder="请粘贴从OneTab导出的文本内容，格式如下：
https://example.com | 页面标题
https://github.com/user/repo | GitHub项目页面"
                      className="w-full h-48 p-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                    />

                    {/* 格式检测结果 */}
                    {formatType !== 'unknown' && (
                      <div className={`p-3 rounded-lg border ${
                        formatType === 'onetab'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-yellow-50 border-yellow-200'
                      }`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            formatType === 'onetab' ? 'bg-green-500' : 'bg-yellow-500'
                          }`} />
                          <span className={`text-sm font-medium ${
                            formatType === 'onetab' ? 'text-green-800' : 'text-yellow-800'
                          }`}>
                            {formatType === 'onetab' ? '检测到OneTab格式' : '检测到其他格式'}
                          </span>
                        </div>
                        <p className={`text-sm mt-1 ${
                          formatType === 'onetab' ? 'text-green-700' : 'text-yellow-700'
                        }`}>
                          {formatType === 'onetab'
                            ? `发现 ${parsedData.filter(item => item.isValid).length} 个有效的URL`
                            : '可以尝试导入，但可能需要调整格式'
                          }
                        </p>
                      </div>
                    )}

                    {/* 预览区域 */}
                    {showPreview && parsedData.length > 0 && (
                      <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
                          <h4 className="text-sm font-medium text-gray-900">
                            数据预览 ({parsedData.length} 条)
                          </h4>
                          <button
                            onClick={() => setShowPreview(!showPreview)}
                            className="p-1 text-gray-500 hover:text-gray-700"
                          >
                            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        {showPreview && (
                          <div className="max-h-48 overflow-y-auto">
                            <div className="divide-y divide-gray-200">
                              {parsedData.slice(0, 10).map((item, index) => (
                                <div key={index} className={`p-3 ${
                                  item.isValid ? 'bg-white' : 'bg-red-50'
                                }`}>
                                  <div className="flex items-start gap-3">
                                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                      item.isValid ? 'bg-green-500' : 'bg-red-500'
                                    }`} />
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-medium ${
                                        item.isValid ? 'text-gray-900' : 'text-red-900'
                                      }`}>
                                        {item.title}
                                      </p>
                                      {item.isValid && (
                                        <p className="text-xs text-gray-500 truncate mt-1">
                                          {item.url}
                                        </p>
                                      )}
                                      {!item.isValid && (
                                        <p className="text-xs text-red-600 mt-1">
                                          无效格式，请检查URL是否正确
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {parsedData.length > 10 && (
                              <div className="p-3 bg-gray-50 text-center">
                                <p className="text-sm text-gray-600">
                                  还有 {parsedData.length - 10} 条数据未显示
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 导入按钮 */}
                    <button
                      onClick={handleTextImport}
                      disabled={isImporting || parsedData.length === 0}
                      className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {isImporting ? '正在导入...' : '导入数据'}
                    </button>
                  </div>
                )}

                {/* 文件上传区域 */}
                {importMode === 'file' && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,.txt"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    <button
                      onClick={handleImportClick}
                      disabled={isImporting}
                      className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="text-center">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <div className="text-lg font-medium text-gray-900 mb-2">
                          {isImporting ? '正在导入...' : '选择文件导入'}
                        </div>
                        <p className="text-gray-600">
                          支持 .json 和 .txt 格式文件，点击选择或拖拽文件到此处
                        </p>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* 导入结果 */}
              {importResult && (
                <div className={`p-4 rounded-lg border ${
                  importResult.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {importResult.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      )}
                      <div>
                        <h4 className={`text-sm font-medium mb-2 ${
                          importResult.success ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {importResult.success ? '导入成功' : '导入失败'}
                        </h4>
                        
                        {importResult.success && (
                          <div className="text-sm text-green-700 space-y-1">
                            <p>• 导入标签页: {importResult.tabsImported} 个</p>
                            <p>• 导入分组: {importResult.groupsImported} 个</p>
                            {importResult.duplicatesSkipped > 0 && (
                              <p>• 跳过重复项: {importResult.duplicatesSkipped} 个</p>
                            )}
                          </div>
                        )}
                        
                        {importResult.errors.length > 0 && (
                          <div className="text-sm text-red-700 mt-2">
                            <p className="font-medium mb-1">错误信息:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {importResult.errors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {importResult.warnings.length > 0 && (
                          <div className="text-sm text-yellow-700 mt-2">
                            <p className="font-medium mb-1">警告信息:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {importResult.warnings.map((warning, index) => (
                                <li key={index}>{warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={handleCloseResult}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* 导入说明 */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">导入说明</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 支持Tabify导出的JSON格式文件</li>
                      <li>• 兼容OneTab导出的数据格式</li>
                      <li>• 导入前建议先导出当前数据作为备份</li>
                      <li>• 大量数据导入可能需要较长时间，请耐心等待</li>
                      <li>• 导入完成后会自动刷新界面显示新数据</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}