'use client';

import { useEffect, useState } from 'react';

interface DevToolsProps {
  onResetMockData: () => Promise<void>;
  onAddToast: (message: string, type: 'success' | 'error', category?: string) => void;
}

export default function DevTools({ onResetMockData, onAddToast }: DevToolsProps) {
  const [isDevEnvironment, setIsDevEnvironment] = useState(false);

  useEffect(() => {
    // 只在客户端检查是否为开发环境
    const checkDevEnvironment = () => {
      if (typeof window !== 'undefined') {
        const isLocalhost = window.location.hostname === 'localhost';
        const isPort3000 = window.location.port === '3000';
        setIsDevEnvironment(isLocalhost || isPort3000);
      }
    };

    checkDevEnvironment();
  }, []);

  if (!isDevEnvironment) {
    return null;
  }

  const handleUrlParamLoad = () => {
    if (typeof window !== 'undefined') {
      window.location.href = window.location.origin + '?mock=true';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border p-4 max-w-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-700">开发工具</span>
        </div>
        <div className="space-y-2">
          <button
            onClick={async () => {
              try {
                await onResetMockData();
                onAddToast('模拟数据已重置', 'success', '开发工具');
              } catch (error) {
                console.error('重置模拟数据失败:', error);
                onAddToast('重置模拟数据失败', 'error');
              }
            }}
            className="w-full px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <i className="ri-refresh-line"></i>
            加载模拟数据
          </button>
          <button
            onClick={handleUrlParamLoad}
            className="w-full px-3 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            <i className="ri-link"></i>
            URL参数加载
          </button>
          <div className="text-xs text-gray-500 mt-2">
            <p>• 点击"加载模拟数据"直接重置</p>
            <p>• 点击"URL参数加载"通过链接加载</p>
          </div>
        </div>
      </div>
    </div>
  );
}