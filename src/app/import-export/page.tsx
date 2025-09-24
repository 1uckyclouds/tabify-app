'use client';

import { useState, useRef } from 'react';
import { ArrowLeft, Upload, Download, FileText, AlertCircle, CheckCircle, X, Info } from 'lucide-react';
import Link from 'next/link';
import { quickExportAllData, quickImportData } from '../../lib/import-export';
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const result = await quickImportData(file);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>返回主页</span>
            </Link>
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
                    className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg hover:border-blue-300 hover:bg-blue-100 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
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

              {/* 文件选择 */}
              <div className="mb-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
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
                      支持 .json 格式文件，点击选择或拖拽文件到此处
                    </p>
                  </div>
                </button>
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

            {/* OneTab兼容性说明 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">OneTab兼容性</h3>
                  <p className="text-gray-600">
                    Tabify支持导入OneTab的数据，让您轻松迁移现有的标签页管理数据。
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-md font-medium text-gray-900">如何从OneTab导入数据：</h4>
                <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                  <li>在OneTab中点击"Export / import URLs"</li>
                  <li>复制导出的文本内容</li>
                  <li>将内容保存为.txt或.json文件</li>
                  <li>在上方选择该文件进行导入</li>
                </ol>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                  <p className="text-sm text-yellow-800">
                    <strong>注意：</strong>OneTab导入的数据将自动转换为Tabify格式，部分高级功能（如分组信息）可能无法完全保留。
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}