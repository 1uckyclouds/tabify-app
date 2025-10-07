
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface TopToolbarProps {
  onImport: () => void;
  onExport: () => void;
  onRefresh?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export default function TopToolbar({
  onImport,
  onExport,
  onRefresh,
  searchQuery = '',
  onSearchChange = () => {}
}: TopToolbarProps) {
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  const handleMenuItemClick = (action: string) => {
    setShowMenu(false);
    switch (action) {
      case 'import':
      case 'export':
        // 导入导出功能：在新的独立页面中打开
        if (typeof window !== 'undefined' && window.chrome && window.chrome.runtime) {
          // Chrome扩展环境：在新标签页中打开导入导出页面
          window.chrome.tabs.create({
            url: window.chrome.runtime.getURL('import-export.html')
          });
        } else {
          // 非扩展环境：使用Next.js路由
          router.push('/import-export');
        }
        break;
      case 'refresh':
        // 刷新数据：重新加载标签页数据
        if (onRefresh) {
          onRefresh();
        }
        break;
      case 'api-settings':
      case 'appearance':
      case 'shortcuts':
      case 'about':
        // 设置相关功能：使用Chrome扩展的options_page
        if (typeof window !== 'undefined' && window.chrome && window.chrome.runtime && window.chrome.runtime.openOptionsPage) {
          // Chrome扩展环境：打开options页面
          window.chrome.runtime.openOptionsPage();
        } else {
          // 非扩展环境：使用Next.js路由
          const tabMap = {
            'api-settings': 'ai',
            'appearance': 'theme',
            'shortcuts': 'shortcuts',
            'about': 'about'
          };
          router.push(`/settings?tab=${tabMap[action as keyof typeof tabMap]}`);
        }
        break;
      default:
        break;
    }
  };
  return (
    <div className="p-4 bg-white border-b border-gray-200 shadow-sm relative z-10">
      {/* 第一行：产品名称和标签页数量 */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="Tabify Logo"
            width={64}
            height={64}
            className="w-16 h-16 object-contain"
          />
        </div>
        <span className="text-xl text-gray-900" style={{fontFamily: 'Segoe UI Medium, sans-serif', fontWeight: 500}}>Tabify</span>
      </div>
      
      {/* 第二行：搜索框和操作按钮 */}
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <div className="w-4 h-4 flex items-center justify-center absolute left-3 top-1/2 transform -translate-y-1/2">
              <i className="ri-search-line text-gray-400 text-sm"></i>
            </div>
            <input
              type="text"
              placeholder="搜索框"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2 relative ml-4">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <i className="ri-menu-line text-gray-600 text-sm"></i>
          </button>

          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)}
              ></div>
              <div className="absolute right-0 top-10 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-40">
                {/* 上方区域：导入和导出 */}
                <button
                  onClick={() => handleMenuItemClick('import')}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <i className="ri-download-line text-gray-500"></i>
                  导入
                </button>
                <button
                  onClick={() => handleMenuItemClick('export')}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <i className="ri-upload-line text-gray-500"></i>
                  导出
                </button>
                <button
                  onClick={() => handleMenuItemClick('refresh')}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <i className="ri-refresh-line text-gray-500"></i>
                  刷新数据
                </button>
                
                {/* 分割线 */}
                <div className="border-t border-gray-100 my-1"></div>
                
                {/* 下方区域：设置相关选项 */}
                <button
                  onClick={() => handleMenuItemClick('api-settings')}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <i className="ri-settings-3-line text-gray-500"></i>
                  模型API设置
                </button>
                <button
                  onClick={() => handleMenuItemClick('appearance')}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <i className="ri-palette-line text-gray-500"></i>
                  外观
                </button>
                <button
                  onClick={() => handleMenuItemClick('shortcuts')}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <i className="ri-keyboard-line text-gray-500"></i>
                  快捷键
                </button>
                <button
                  onClick={() => handleMenuItemClick('about')}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <i className="ri-information-line text-gray-500"></i>
                  关于&反馈
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
