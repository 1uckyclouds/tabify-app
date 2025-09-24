/**
 * Tabify Chrome插件 - 模拟测试数据
 * 
 * 本文件提供完整的模拟数据用于开发和测试，包括：
 * - 多样化的标签页数据（不同网站类型、标题长度、真实URL和favicon）
 * - 预设的分组数据（不同颜色、状态、描述）
 * - 符合实际使用场景的数据分布
 * - 数据生成和统计工具函数
 */

import { Tab, Group } from './types';

// ==================== 预设分组数据 ====================

/**
 * 模拟分组数据
 * 涵盖工作、开发、社交、学习、购物等常见使用场景
 */
export const mockGroups: Group[] = [
  {
    id: 'group-work',
    name: '工作相关',
    createdTime: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7天前
    isLocked: false,
    isExpanded: true,
    color: '#3B82F6', // 蓝色
    description: '工作项目、文档和会议相关标签页',
    sortOrder: 1
  },
  {
    id: 'group-dev',
    name: '开发工具',
    createdTime: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5天前
    isLocked: true,
    isExpanded: true,
    color: '#10B981', // 绿色
    description: '开发文档、工具和代码仓库',
    sortOrder: 2
  },
  {
    id: 'group-social',
    name: '社交媒体',
    createdTime: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3天前
    isLocked: false,
    isExpanded: false,
    color: '#F59E0B', // 橙色
    description: '社交平台和通讯工具',
    sortOrder: 3
  },
  {
    id: 'group-learning',
    name: '学习资源',
    createdTime: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2天前
    isLocked: false,
    isExpanded: true,
    color: '#8B5CF6', // 紫色
    description: '在线课程、教程和学习材料',
    sortOrder: 4
  },
  {
    id: 'group-shopping',
    name: '购物清单',
    createdTime: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1天前
    isLocked: false,
    isExpanded: false,
    color: '#EF4444', // 红色
    description: '购物网站和商品对比',
    sortOrder: 5
  }
];

// ==================== 预设标签页数据 ====================

/**
 * 模拟标签页数据
 * 包含不同类型网站、真实URL和favicon
 */
export const mockTabs: Tab[] = [
  // 工作相关标签页
  {
    id: 'tab-work-1',
    title: 'Gmail - 收件箱',
    url: 'https://mail.google.com/mail/u/0/#inbox',
    favicon: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico',
    groupId: 'group-work',
    createdTime: Date.now() - 6 * 60 * 60 * 1000, // 6小时前
    lastAccessTime: Date.now() - 30 * 60 * 1000, // 30分钟前
    isActive: false,
    isPinned: true
  },
  {
    id: 'tab-work-2',
    title: 'Slack - 团队协作平台',
    url: 'https://app.slack.com/client/T1234567/C1234567',
    favicon: 'https://a.slack-edge.com/80588/img/icons/app-256.png',
    groupId: 'group-work',
    createdTime: Date.now() - 4 * 60 * 60 * 1000,
    lastAccessTime: Date.now() - 15 * 60 * 1000,
    isActive: false,
    isPinned: false
  },
  {
    id: 'tab-work-3',
    title: 'Notion - 项目管理和笔记',
    url: 'https://www.notion.so/workspace',
    favicon: 'https://www.notion.so/images/favicon.ico',
    groupId: 'group-work',
    createdTime: Date.now() - 2 * 60 * 60 * 1000,
    lastAccessTime: Date.now() - 45 * 60 * 1000,
    isActive: true,
    isPinned: false
  },
  
  // 开发工具标签页
  {
    id: 'tab-dev-1',
    title: 'GitHub - 代码仓库',
    url: 'https://github.com/username/project',
    favicon: 'https://github.githubassets.com/favicons/favicon.svg',
    groupId: 'group-dev',
    createdTime: Date.now() - 8 * 60 * 60 * 1000,
    lastAccessTime: Date.now() - 20 * 60 * 1000,
    isActive: false,
    isPinned: true
  },
  {
    id: 'tab-dev-2',
    title: 'Stack Overflow - 编程问答社区',
    url: 'https://stackoverflow.com/questions/tagged/javascript',
    favicon: 'https://cdn.sstatic.net/Sites/stackoverflow/Img/favicon.ico',
    groupId: 'group-dev',
    createdTime: Date.now() - 3 * 60 * 60 * 1000,
    lastAccessTime: Date.now() - 10 * 60 * 1000,
    isActive: false,
    isPinned: false
  },
  {
    id: 'tab-dev-3',
    title: 'MDN Web Docs - JavaScript 参考',
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
    favicon: 'https://developer.mozilla.org/favicon-48x48.cbbd161b5b0b.png',
    groupId: 'group-dev',
    createdTime: Date.now() - 1 * 60 * 60 * 1000,
    lastAccessTime: Date.now() - 5 * 60 * 1000,
    isActive: false,
    isPinned: false
  },
  
  // 社交媒体标签页
  {
    id: 'tab-social-1',
    title: 'Twitter / X',
    url: 'https://twitter.com/home',
    favicon: 'https://abs.twimg.com/favicons/twitter.3.ico',
    groupId: 'group-social',
    createdTime: Date.now() - 5 * 60 * 60 * 1000,
    lastAccessTime: Date.now() - 60 * 60 * 1000,
    isActive: false,
    isPinned: false
  },
  {
    id: 'tab-social-2',
    title: '微信网页版',
    url: 'https://wx.qq.com/',
    favicon: 'https://res.wx.qq.com/a/wx_fed/assets/res/NTI4MWU5.ico',
    groupId: 'group-social',
    createdTime: Date.now() - 2 * 60 * 60 * 1000,
    lastAccessTime: Date.now() - 90 * 60 * 1000,
    isActive: false,
    isPinned: false
  },
  
  // 学习资源标签页
  {
    id: 'tab-learning-1',
    title: 'Coursera - 在线课程平台',
    url: 'https://www.coursera.org/learn/machine-learning',
    favicon: 'https://d3njjcbhbojbot.cloudfront.net/web/images/favicons/favicon-v2-194x194.png',
    groupId: 'group-learning',
    createdTime: Date.now() - 12 * 60 * 60 * 1000,
    lastAccessTime: Date.now() - 3 * 60 * 60 * 1000,
    isActive: false,
    isPinned: false
  },
  {
    id: 'tab-learning-2',
    title: 'YouTube - React 教程视频',
    url: 'https://www.youtube.com/watch?v=dGcsHMXbSOA',
    favicon: 'https://www.youtube.com/s/desktop/favicon.ico',
    groupId: 'group-learning',
    createdTime: Date.now() - 6 * 60 * 60 * 1000,
    lastAccessTime: Date.now() - 2 * 60 * 60 * 1000,
    isActive: false,
    isPinned: false
  },
  
  // 购物清单标签页
  {
    id: 'tab-shopping-1',
    title: '淘宝网 - 全球最大的网上交易平台',
    url: 'https://www.taobao.com/',
    favicon: 'https://www.taobao.com/favicon.ico',
    groupId: 'group-shopping',
    createdTime: Date.now() - 4 * 60 * 60 * 1000,
    lastAccessTime: Date.now() - 2 * 60 * 60 * 1000,
    isActive: false,
    isPinned: false
  },
  {
    id: 'tab-shopping-2',
    title: 'Amazon - 在线购物',
    url: 'https://www.amazon.com/dp/B08N5WRWNW',
    favicon: 'https://www.amazon.com/favicon.ico',
    groupId: 'group-shopping',
    createdTime: Date.now() - 1 * 60 * 60 * 1000,
    lastAccessTime: Date.now() - 30 * 60 * 1000,
    isActive: false,
    isPinned: false
  },
  
  // 未分组的标签页
  {
    id: 'tab-ungrouped-1',
    title: 'Google 搜索',
    url: 'https://www.google.com/search?q=chrome+extension+development',
    favicon: 'https://www.google.com/favicon.ico',
    createdTime: Date.now() - 30 * 60 * 1000,
    lastAccessTime: Date.now() - 10 * 60 * 1000,
    isActive: false,
    isPinned: false
  },
  {
    id: 'tab-ungrouped-2',
    title: 'Wikipedia - 维基百科',
    url: 'https://zh.wikipedia.org/wiki/Chrome%E6%89%A9%E5%B1%95',
    favicon: 'https://zh.wikipedia.org/static/favicon/wikipedia.ico',
    createdTime: Date.now() - 15 * 60 * 1000,
    lastAccessTime: Date.now() - 5 * 60 * 1000,
    isActive: false,
    isPinned: false
  },
  {
    id: 'tab-ungrouped-3',
    title: 'Hacker News',
    url: 'https://news.ycombinator.com/',
    favicon: 'https://news.ycombinator.com/favicon.ico',
    createdTime: getCurrentTimestamp() - 45 * 60 * 1000,
    lastAccessTime: getCurrentTimestamp() - 25 * 60 * 1000,
    isActive: false,
    isPinned: false
  }
];

// ==================== 数据统计和工具函数 ====================

/**
 * 生成唯一ID
 * @param prefix ID前缀
 * @returns 唯一标识符
 */
export function generateId(prefix: string = 'id'): string {
  // 使用固定的时间戳避免水合不匹配
  const timestamp = typeof window !== 'undefined' ? Date.now() : 1640995200000; // 2022-01-01
  const random = typeof window !== 'undefined' ? Math.random().toString(36).substr(2, 9) : 'static123';
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * 获取当前时间戳
 * @returns 当前时间戳（毫秒）
 */
export function getCurrentTimestamp(): number {
  // 在服务端使用固定时间戳，客户端使用实际时间
  return typeof window !== 'undefined' ? Date.now() : 1640995200000; // 2022-01-01
}

/**
 * 获取数据统计信息
 * @param tabs 标签页数组
 * @param groups 分组数组
 * @returns 统计信息对象
 */
export function getDataStats(tabs: Tab[] = mockTabs, groups: Group[] = mockGroups) {
  const groupedTabs = tabs.filter(tab => tab.groupId);
  const ungroupedTabs = tabs.filter(tab => !tab.groupId);
  const pinnedTabs = tabs.filter(tab => tab.isPinned);
  const activeTabs = tabs.filter(tab => tab.isActive);
  
  const groupStats = groups.map(group => ({
    groupId: group.id,
    groupName: group.name,
    tabCount: tabs.filter(tab => tab.groupId === group.id).length,
    isExpanded: group.isExpanded,
    isLocked: group.isLocked
  }));
  
  return {
    totalTabs: tabs.length,
    totalGroups: groups.length,
    groupedTabs: groupedTabs.length,
    ungroupedTabs: ungroupedTabs.length,
    pinnedTabs: pinnedTabs.length,
    activeTabs: activeTabs.length,
    groupStats,
    lastUpdated: getCurrentTimestamp()
  };
}

/**
 * 生成随机标签页数据
 * @param count 生成数量
 * @param groupId 可选的分组ID
 * @returns 标签页数组
 */
export function generateRandomTabs(count: number, groupId?: string): Tab[] {
  const sampleTitles = [
    'React 官方文档',
    'TypeScript 入门教程',
    'Tailwind CSS 组件库',
    'Node.js 最佳实践',
    'Chrome 扩展开发指南',
    'JavaScript 设计模式',
    'Vue.js 3.0 新特性',
    'CSS Grid 布局教程',
    'Webpack 配置优化',
    'Git 版本控制指南'
  ];
  
  const sampleUrls = [
    'https://reactjs.org/docs',
    'https://www.typescriptlang.org/docs',
    'https://tailwindcss.com/components',
    'https://nodejs.org/en/docs/guides',
    'https://developer.chrome.com/docs/extensions',
    'https://addyosmani.com/resources/essentialjsdesignpatterns',
    'https://v3.vuejs.org/guide',
    'https://css-tricks.com/snippets/css/complete-guide-grid',
    'https://webpack.js.org/configuration',
    'https://git-scm.com/doc'
  ];
  
  return Array.from({ length: count }, (_, index) => {
    const titleIndex = index % sampleTitles.length;
    const urlIndex = index % sampleUrls.length;
    
    return {
      id: generateId('tab'),
      title: sampleTitles[titleIndex],
      url: sampleUrls[urlIndex],
      favicon: `https://www.google.com/s2/favicons?domain=${new URL(sampleUrls[urlIndex]).hostname}`,
      groupId,
      createdTime: getCurrentTimestamp() - (index + 1) * 24 * 60 * 60 * 1000, // 按索引递减天数
      lastAccessTime: getCurrentTimestamp() - (index + 1) * 60 * 60 * 1000, // 按索引递减小时数
      isActive: index === 0, // 第一个设为活跃
      isPinned: index % 5 === 0 // 每5个固定一个
    };
  });
}

/**
 * 生成随机分组数据
 * @param count 生成数量
 * @returns 分组数组
 */
export function generateRandomGroups(count: number): Group[] {
  const sampleNames = [
    '前端开发',
    '后端技术',
    '设计资源',
    '产品管理',
    '数据分析',
    '移动开发',
    '云服务',
    '开源项目',
    '技术博客',
    '在线工具'
  ];
  
  const sampleColors = [
    '#3B82F6', // 蓝色
    '#10B981', // 绿色
    '#F59E0B', // 橙色
    '#8B5CF6', // 紫色
    '#EF4444', // 红色
    '#06B6D4', // 青色
    '#84CC16', // 柠檬绿
    '#F97316', // 橙红色
    '#8B5A2B', // 棕色
    '#6B7280'  // 灰色
  ];
  
  return Array.from({ length: count }, (_, index) => {
    const nameIndex = index % sampleNames.length;
    const colorIndex = index % sampleColors.length;
    
    return {
      id: generateId('group'),
      name: sampleNames[nameIndex],
      createdTime: getCurrentTimestamp() - Math.random() * 30 * 24 * 60 * 60 * 1000, // 随机30天内
      isLocked: Math.random() < 0.1, // 10%概率锁定
      isExpanded: Math.random() < 0.8, // 80%概率展开
      color: sampleColors[colorIndex],
      description: `${sampleNames[nameIndex]}相关的标签页集合`,
      sortOrder: index + 1
    };
  });
}

/**
 * 获取默认的完整测试数据
 * @returns 包含标签页和分组的完整数据集
 */
export function getCompleteTestData() {
  return {
    tabs: mockTabs,
    groups: mockGroups,
    stats: getDataStats(mockTabs, mockGroups)
  };
}

// ==================== 导出默认数据 ====================

/**
 * 默认导出完整的测试数据集
 */
export default {
  tabs: mockTabs,
  groups: mockGroups,
  generateId,
  getCurrentTimestamp,
  getDataStats,
  generateRandomTabs,
  generateRandomGroups,
  getCompleteTestData
};