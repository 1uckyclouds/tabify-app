/**
 * Tabify Chrome插件 - 核心数据类型定义
 * 
 * 本文件定义了整个应用中使用的核心数据结构，包括：
 * - Tab: 标签页数据结构
 * - Group: 分组数据结构
 * - Settings: 用户设置数据结构
 * - AI相关类型定义
 * - Chrome API相关类型定义
 */

// ==================== 基础数据类型 ====================

/**
 * 标签页数据结构
 * 包含标签页的所有基本信息和状态
 */
export interface Tab {
  /** 唯一标识符 */
  id: string;
  /** 标签页标题 */
  title: string;
  /** 标签页URL */
  url: string;
  /** 网站图标URL，可选 */
  favicon?: string;
  /** 所属分组ID，可选 */
  groupId?: string;
  /** 创建时间戳 */
  createdTime: number;
  /** 最后访问时间戳 */
  lastAccessTime?: number;
  /** 是否为活跃标签页 */
  isActive?: boolean;
  /** 是否已固定 */
  isPinned?: boolean;
}

/**
 * 分组数据结构
 * 用于组织和管理标签页集合
 */
export interface Group {
  /** 唯一标识符 */
  id: string;
  /** 分组名称 */
  name: string;
  /** 创建时间戳 */
  createdTime: number;
  /** 是否锁定（锁定后不能拖拽移动标签页） */
  isLocked: boolean;
  /** 是否展开显示 */
  isExpanded: boolean;
  /** 分组颜色标识，可选 */
  color?: string;
  /** 分组描述，可选 */
  description?: string;
  /** 排序权重 */
  sortOrder: number;
}

// ==================== 用户设置类型 ====================

/**
 * 主题类型枚举
 */
export type ThemeType = 'light' | 'dark' | 'pixel';

/**
 * AI服务提供商类型
 */
export type AIProvider = 'openai' | 'claude' | 'gemini' | 'local';

/**
 * 用户设置数据结构
 */
export interface Settings {
  /** 主题设置 */
  theme: ThemeType;
  /** AI服务配置 */
  ai: {
    /** 当前使用的AI服务提供商 */
    provider: AIProvider;
    /** API密钥 */
    apiKey: string;
    /** 服务端点URL */
    endpoint?: string;
    /** 模型名称 */
    model: string;
    /** 温度参数 (0-1) */
    temperature: number;
    /** 最大令牌数 */
    maxTokens: number;
  };
  /** 界面设置 */
  ui: {
    /** 是否显示favicon */
    showFavicons: boolean;
    /** 是否启用动画效果 */
    enableAnimations: boolean;
    /** 每页显示的标签页数量 */
    itemsPerPage: number;
    /** 是否启用虚拟滚动 */
    enableVirtualScroll: boolean;
  };
  /** 快捷键设置 */
  shortcuts: {
    /** 收纳当前标签页 */
    collectCurrentTab: string;
    /** 收纳所有标签页 */
    collectAllTabs: string;
    /** 打开管理界面 */
    openManager: string;
  };
}

// ==================== AI智能分组相关类型 ====================

/**
 * AI分组建议
 */
export interface GroupingSuggestion {
  /** 标签页ID */
  tabId: string;
  /** 分组类型：现有分组或新建分组 */
  groupType: 'existing' | 'new';
  /** 分组名称 */
  groupName: string;
  /** 置信度 (0-1) */
  confidence: number;
  /** 分组原因说明 */
  reason?: string;
}

/**
 * AI分析结果
 */
export interface AIAnalysisResult {
  /** 分组建议列表 */
  suggestions: GroupingSuggestion[];
  /** 建议的新分组列表 */
  newGroups: {
    name: string;
    description?: string;
    color?: string;
  }[];
  /** 分析耗时（毫秒） */
  processingTime: number;
  /** 使用的模型信息 */
  modelInfo: {
    provider: AIProvider;
    model: string;
    tokensUsed: number;
  };
}

// ==================== 拖拽操作相关类型 ====================

/**
 * 拖拽操作类型
 */
export interface DragOperation {
  /** 操作类型：移动到其他分组或分组内排序 */
  type: 'move' | 'sort';
  /** 被拖拽的标签页ID */
  tabId: string;
  /** 源分组ID */
  fromGroupId?: string;
  /** 目标分组ID */
  toGroupId?: string;
  /** 源位置索引 */
  fromIndex?: number;
  /** 目标位置索引 */
  toIndex?: number;
}

/**
 * 拖拽状态
 */
export interface DragState {
  /** 当前被拖拽的元素ID */
  activeId: string | null;
  /** 拖拽悬停的分组ID */
  dragOverGroupId: string | null;
  /** 是否正在拖拽中 */
  isDragging: boolean;
  /** 拖拽的标签页是否已离开原分组 */
  draggedTabLeftOriginalGroup: boolean;
}

// ==================== 操作反馈相关类型 ====================

/**
 * Toast提示类型
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast提示数据结构
 */
export interface Toast {
  /** 唯一标识符 */
  id: string;
  /** 提示类型 */
  type: ToastType;
  /** 提示标题 */
  title: string;
  /** 提示内容 */
  message: string;
  /** 显示时长（毫秒），0表示不自动消失 */
  duration: number;
  /** 是否显示撤销按钮 */
  showUndo?: boolean;
  /** 撤销操作回调 */
  onUndo?: () => void;
  /** 创建时间戳 */
  createdTime: number;
}

/**
 * 操作历史记录
 */
export interface Operation {
  /** 操作ID */
  id: string;
  /** 操作类型 */
  type: 'delete' | 'move' | 'create' | 'update' | 'batch';
  /** 操作描述 */
  description: string;
  /** 操作前的数据快照 */
  beforeSnapshot: {
    tabs?: Tab[];
    groups?: Group[];
  };
  /** 操作后的数据快照 */
  afterSnapshot: {
    tabs?: Tab[];
    groups?: Group[];
  };
  /** 操作时间戳 */
  timestamp: number;
  /** 是否可撤销 */
  canUndo: boolean;
}

// ==================== Chrome API相关类型 ====================

/**
 * Chrome标签页信息（从chrome.tabs.Tab扩展） */
export interface ChromeTabInfo {
  /** Chrome标签页ID */
  chromeId: number;
  /** 标签页标题 */
  title: string;
  /** 标签页URL */
  url: string;
  /** 网站图标URL */
  favIconUrl?: string;
  /** 是否为活跃标签页 */
  active: boolean;
  /** 是否已固定 */
  pinned: boolean;
  /** 窗口ID */
  windowId: number;
  /** 在窗口中的索引位置 */
  index: number;
}

/**
 * 存储服务接口
 */
export interface StorageData {
  /** 标签页数据 */
  tabs: Tab[];
  /** 分组数据 */
  groups: Group[];
  /** 用户设置 */
  settings: Settings;
  /** 操作历史 */
  operations: Operation[];
  /** 数据版本号 */
  version: string;
  /** 最后更新时间 */
  lastUpdated: number;
}

// ==================== 导入导出相关类型 ====================

/**
 * 导出数据格式
 */
export interface ExportData {
  /** 应用信息 */
  app: {
    name: string;
    version: string;
    exportTime: number;
  };
  /** 标签页数据 */
  tabs: Tab[];
  /** 分组数据 */
  groups: Group[];
  /** 用户设置（可选，用户可选择是否导出） */
  settings?: Partial<Settings>;
}

/**
 * 导入选项
 */
export interface ImportOptions {
  /** 是否覆盖现有数据 */
  overwriteExisting: boolean;
  /** 是否导入设置 */
  importSettings: boolean;
  /** 重复数据处理策略 */
  duplicateStrategy: 'skip' | 'overwrite' | 'rename';
  /** 是否创建备份 */
  createBackup: boolean;
}

/**
 * 导入结果
 */
export interface ImportResult {
  /** 是否成功 */
  success: boolean;
  /** 导入的标签页数量 */
  tabsImported: number;
  /** 导入的分组数量 */
  groupsImported: number;
  /** 跳过的重复项数量 */
  duplicatesSkipped: number;
  /** 错误信息 */
  errors: string[];
  /** 警告信息 */
  warnings: string[];
}

// ==================== 搜索过滤相关类型 ====================

/**
 * 搜索过滤器
 */
export interface SearchFilter {
  /** 搜索关键词 */
  query: string;
  /** 是否区分大小写 */
  caseSensitive: boolean;
  /** 是否使用正则表达式 */
  useRegex: boolean;
  /** 搜索范围 */
  searchIn: ('title' | 'url' | 'group')[];
  /** 分组过滤 */
  groupFilter?: string[];
  /** 日期范围过滤 */
  dateRange?: {
    start: number;
    end: number;
  };
}

/**
 * 搜索结果
 */
export interface SearchResult {
  /** 匹配的标签页 */
  tabs: Tab[];
  /** 匹配的分组 */
  groups: Group[];
  /** 搜索统计 */
  stats: {
    totalMatches: number;
    tabMatches: number;
    groupMatches: number;
    searchTime: number;
  };
  /** 高亮信息 */
  highlights: {
    tabId: string;
    field: 'title' | 'url';
    matches: {
      start: number;
      end: number;
      text: string;
    }[];
  }[];
}

// ==================== 工具函数类型 ====================

/**
 * 分页参数
 */
export interface PaginationParams {
  /** 当前页码（从1开始） */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 总数量 */
  total: number;
}

/**
 * 分页结果
 */
export interface PaginatedResult<T> {
  /** 数据列表 */
  items: T[];
  /** 分页信息 */
  pagination: PaginationParams & {
    /** 总页数 */
    totalPages: number;
    /** 是否有上一页 */
    hasPrevious: boolean;
    /** 是否有下一页 */
    hasNext: boolean;
  };
}

/**
 * 排序参数
 */
export interface SortParams {
  /** 排序字段 */
  field: keyof Tab | keyof Group;
  /** 排序方向 */
  direction: 'asc' | 'desc';
}

// ==================== 默认值常量 ====================

/**
 * 默认设置
 */
export const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  ai: {
    provider: 'openai',
    apiKey: '',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1000,
  },
  ui: {
    showFavicons: true,
    enableAnimations: true,
    itemsPerPage: 50,
    enableVirtualScroll: true,
  },
  shortcuts: {
    collectCurrentTab: 'Ctrl+Shift+T',
    collectAllTabs: 'Ctrl+Shift+M',
    openManager: 'Ctrl+Shift+O',
  },
};

/**
 * 应用版本信息
 */
export const APP_VERSION = '1.8.0';

/**
 * 存储键名常量
 */
export const STORAGE_KEYS = {
  TABS: 'tabify_tabs',
  GROUPS: 'tabify_groups',
  SETTINGS: 'tabify_settings',
  OPERATIONS: 'tabify_operations',
  VERSION: 'tabify_version',
} as const;