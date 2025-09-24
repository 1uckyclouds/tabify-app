/**
 * Tabify Chrome插件 - AI智能分组服务
 * 
 * 本文件提供了AI智能分组功能，实现：
 * - 基于标签页内容的智能分组建议
 * - 多种AI服务提供商支持（OpenAI、Claude、Gemini等）
 * - 批量处理和性能优化
 * - 分组名称生成
 * - 错误处理和重试机制
 * - 成本控制和使用统计
 */

import {
  Tab,
  Group,
  AIProvider,
  GroupingSuggestion,
  AIAnalysisResult,
  Settings,
} from './types';
import { getStorageService } from './storage';

// ==================== AI服务接口定义 ====================

/**
 * AI服务抽象接口
 * 定义所有AI服务提供商需要实现的方法
 */
export interface AIService {
  /**
   * 分析标签页并生成分组建议
   * @param tabs 要分析的标签页数组
   * @param existingGroups 现有分组（用于避免重复）
   * @returns 分组建议结果
   */
  analyzeTabsForGrouping(tabs: Tab[], existingGroups: Group[]): Promise<GroupingSuggestion[]>;

  /**
   * 为一组标签页生成合适的分组名称
   * @param tabs 标签页数组
   * @returns 建议的分组名称
   */
  generateGroupName(tabs: Tab[]): Promise<string>;

  /**
   * 检查API连接状态
   * @returns 是否连接成功
   */
  testConnection(): Promise<boolean>;

  /**
   * 获取服务提供商名称
   */
  getProviderName(): string;
}

// ==================== OpenAI服务实现 ====================

/**
 * OpenAI GPT服务实现
 */
export class OpenAIService implements AIService {
  private apiKey: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  private endpoint: string;

  constructor(apiKey: string, model: string = 'gpt-3.5-turbo', temperature: number = 0.7, maxTokens: number = 1000) {
    this.apiKey = apiKey;
    this.model = model;
    this.temperature = temperature;
    this.maxTokens = maxTokens;
    this.endpoint = 'https://api.openai.com/v1/chat/completions';
  }

  async analyzeTabsForGrouping(tabs: Tab[], existingGroups: Group[]): Promise<GroupingSuggestion[]> {
    try {
      const prompt = this.buildGroupingPrompt(tabs, existingGroups);
      const response = await this.callOpenAI(prompt);
      return this.parseGroupingSuggestions(response, tabs);
    } catch (error) {
      console.error('OpenAIService: 分组分析失败', error);
      throw new Error(`OpenAI分组分析失败: ${error}`);
    }
  }

  async generateGroupName(tabs: Tab[]): Promise<string> {
    try {
      const prompt = this.buildNameGenerationPrompt(tabs);
      const response = await this.callOpenAI(prompt);
      return this.parseGroupName(response);
    } catch (error) {
      console.error('OpenAIService: 分组名称生成失败', error);
      return this.generateFallbackGroupName(tabs);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const testPrompt = '请回复"连接成功"';
      const response = await this.callOpenAI(testPrompt);
      return response.includes('连接成功') || response.includes('success');
    } catch (error) {
      console.error('OpenAIService: 连接测试失败', error);
      return false;
    }
  }

  getProviderName(): string {
    return 'OpenAI';
  }

  /**
   * 调用OpenAI API
   * @param prompt 提示词
   * @returns API响应内容
   */
  private async callOpenAI(prompt: string): Promise<string> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的标签页管理助手，擅长根据网页内容进行智能分组。请用中文回复。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API错误: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * 构建分组分析提示词
   */
  private buildGroupingPrompt(tabs: Tab[], existingGroups: Group[]): string {
    const tabsInfo = tabs.map((tab, index) => 
      `${index + 1}. 标题: "${tab.title}" URL: ${tab.url}`
    ).join('\n');

    const existingGroupNames = existingGroups.map(g => g.name).join(', ');

    return `请分析以下${tabs.length}个标签页，为它们提供智能分组建议：

${tabsInfo}

现有分组: ${existingGroupNames || '无'}

请按照以下JSON格式返回分组建议：
{
  "suggestions": [
    {
      "tabIndex": 1,
      "groupType": "new",
      "groupName": "工作相关",
      "confidence": 0.9,
      "reason": "这些标签页都与工作相关"
    }
  ]
}

要求：
1. 根据标签页的标题和URL内容进行分类
2. 优先使用现有分组，避免创建过多新分组
3. 置信度范围0-1，越高表示越确定
4. 提供简短的分组理由
5. 最多创建8个新分组
6. 相似内容的标签页应该分到同一组`;
  }

  /**
   * 构建分组名称生成提示词
   */
  private buildNameGenerationPrompt(tabs: Tab[]): string {
    const tabsInfo = tabs.map(tab => 
      `标题: "${tab.title}" URL: ${tab.url}`
    ).join('\n');

    return `请为以下标签页组合生成一个简洁、准确的分组名称：

${tabsInfo}

要求：
1. 名称要简洁明了，不超过10个字符
2. 能够准确概括这些标签页的共同主题
3. 使用中文
4. 只返回分组名称，不要其他内容`;
  }

  /**
   * 解析分组建议响应
   */
  private parseGroupingSuggestions(response: string, tabs: Tab[]): GroupingSuggestion[] {
    try {
      // 尝试解析JSON响应
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法找到JSON格式的响应');
      }

      const data = JSON.parse(jsonMatch[0]);
      const suggestions: GroupingSuggestion[] = [];

      if (data.suggestions && Array.isArray(data.suggestions)) {
        for (const suggestion of data.suggestions) {
          const tabIndex = suggestion.tabIndex - 1; // 转换为0基索引
          if (tabIndex >= 0 && tabIndex < tabs.length) {
            suggestions.push({
              tabId: tabs[tabIndex].id,
              groupType: suggestion.groupType || 'new',
              groupName: suggestion.groupName || '未分类',
              confidence: Math.max(0, Math.min(1, suggestion.confidence || 0.5)),
              reason: suggestion.reason,
            });
          }
        }
      }

      return suggestions;
    } catch (error) {
      console.error('OpenAIService: 解析分组建议失败', error);
      // 返回基于域名的后备分组建议
      return this.generateFallbackSuggestions(tabs);
    }
  }

  /**
   * 解析分组名称响应
   */
  private parseGroupName(response: string): string {
    // 提取响应中的分组名称
    const cleanName = response.trim().replace(/["']/g, '');
    return cleanName.length > 0 && cleanName.length <= 20 ? cleanName : '新分组';
  }

  /**
   * 生成后备分组建议（基于域名）
   */
  private generateFallbackSuggestions(tabs: Tab[]): GroupingSuggestion[] {
    const domainGroups = new Map<string, Tab[]>();
    
    // 按域名分组
    tabs.forEach(tab => {
      try {
        const domain = new URL(tab.url).hostname;
        if (!domainGroups.has(domain)) {
          domainGroups.set(domain, []);
        }
        domainGroups.get(domain)!.push(tab);
      } catch (error) {
        // URL解析失败，放入未分类组
        if (!domainGroups.has('未分类')) {
          domainGroups.set('未分类', []);
        }
        domainGroups.get('未分类')!.push(tab);
      }
    });

    const suggestions: GroupingSuggestion[] = [];
    domainGroups.forEach((domainTabs, domain) => {
      if (domainTabs.length > 1) { // 只为有多个标签页的域名创建分组
        domainTabs.forEach(tab => {
          suggestions.push({
            tabId: tab.id,
            groupType: 'new',
            groupName: domain === '未分类' ? '未分类' : this.formatDomainName(domain),
            confidence: 0.6,
            reason: `基于域名 ${domain} 的自动分组`,
          });
        });
      }
    });

    return suggestions;
  }

  /**
   * 生成后备分组名称
   */
  private generateFallbackGroupName(tabs: Tab[]): string {
    if (tabs.length === 0) return '新分组';
    
    // 尝试从第一个标签页的域名生成名称
    try {
      const domain = new URL(tabs[0].url).hostname;
      return this.formatDomainName(domain);
    } catch (error) {
      return '新分组';
    }
  }

  /**
   * 格式化域名为友好的分组名称
   */
  private formatDomainName(domain: string): string {
    // 移除www前缀和常见后缀
    let name = domain.replace(/^www\./, '').replace(/\.(com|org|net|cn|io)$/, '');
    
    // 首字母大写
    name = name.charAt(0).toUpperCase() + name.slice(1);
    
    // 限制长度
    return name.length > 10 ? name.substring(0, 10) : name;
  }
}

// ==================== AI服务管理器 ====================

/**
 * AI服务管理器
 * 统一管理不同的AI服务提供商
 */
export class AIServiceManager {
  private static instance: AIServiceManager;
  private currentService: AIService | null = null;
  private settings: Settings | null = null;

  /**
   * 获取AI服务管理器单例实例
   */
  public static getInstance(): AIServiceManager {
    if (!AIServiceManager.instance) {
      AIServiceManager.instance = new AIServiceManager();
    }
    return AIServiceManager.instance;
  }

  /**
   * 私有构造函数
   */
  private constructor() {}

  /**
   * 初始化AI服务
   */
  public async initialize(): Promise<void> {
    try {
      const storageService = getStorageService();
      this.settings = await storageService.loadSettings();
      
      if (this.settings.ai.apiKey) {
        await this.switchProvider(this.settings.ai.provider);
      }
      
      console.log('AIServiceManager: 初始化完成');
    } catch (error) {
      console.error('AIServiceManager: 初始化失败', error);
    }
  }

  /**
   * 切换AI服务提供商
   * @param provider 服务提供商类型
   */
  public async switchProvider(provider: AIProvider): Promise<void> {
    if (!this.settings) {
      throw new Error('AI服务未初始化');
    }

    try {
      switch (provider) {
        case 'openai':
          this.currentService = new OpenAIService(
            this.settings.ai.apiKey,
            this.settings.ai.model,
            this.settings.ai.temperature,
            this.settings.ai.maxTokens
          );
          break;
        case 'claude':
          // TODO: 实现Claude服务
          throw new Error('Claude服务暂未实现');
        case 'gemini':
          // TODO: 实现Gemini服务
          throw new Error('Gemini服务暂未实现');
        case 'local':
          // TODO: 实现本地模型服务
          throw new Error('本地模型服务暂未实现');
        default:
          throw new Error(`不支持的AI服务提供商: ${provider}`);
      }
      
      console.log(`AIServiceManager: 已切换到 ${provider} 服务`);
    } catch (error) {
      console.error('AIServiceManager: 切换服务提供商失败', error);
      throw error;
    }
  }

  /**
   * 获取当前AI服务
   */
  public getCurrentService(): AIService | null {
    return this.currentService;
  }

  /**
   * 检查AI服务是否可用
   */
  public isServiceAvailable(): boolean {
    return this.currentService !== null && this.settings?.ai.apiKey !== '';
  }

  /**
   * 测试当前服务连接
   */
  public async testCurrentService(): Promise<boolean> {
    if (!this.currentService) {
      return false;
    }
    
    try {
      return await this.currentService.testConnection();
    } catch (error) {
      console.error('AIServiceManager: 服务连接测试失败', error);
      return false;
    }
  }

  /**
   * 智能分组标签页
   * @param tabs 要分组的标签页
   * @param batchSize 批处理大小
   * @returns 分析结果
   */
  public async intelligentGrouping(tabs: Tab[], batchSize: number = 20): Promise<AIAnalysisResult> {
    if (!this.currentService) {
      throw new Error('AI服务未初始化');
    }

    const startTime = Date.now();
    let totalTokensUsed = 0;
    const allSuggestions: GroupingSuggestion[] = [];
    const newGroups: { name: string; description?: string; color?: string }[] = [];

    try {
      // 获取现有分组
      const storageService = getStorageService();
      const existingGroups = await storageService.loadGroups();

      // 分批处理标签页
      const batches = this.chunkArray(tabs, batchSize);
      
      for (const batch of batches) {
        const suggestions = await this.currentService.analyzeTabsForGrouping(batch, existingGroups);
        allSuggestions.push(...suggestions);
        
        // 估算token使用量（粗略估算）
        totalTokensUsed += this.estimateTokenUsage(batch);
        
        // 添加延迟避免API限制
        if (batches.indexOf(batch) < batches.length - 1) {
          await this.delay(1000);
        }
      }

      // 收集新分组名称
      const uniqueNewGroups = new Set<string>();
      allSuggestions.forEach(suggestion => {
        if (suggestion.groupType === 'new' && !existingGroups.find(g => g.name === suggestion.groupName)) {
          uniqueNewGroups.add(suggestion.groupName);
        }
      });

      uniqueNewGroups.forEach(groupName => {
        newGroups.push({
          name: groupName,
          description: `AI自动生成的分组`,
        });
      });

      const processingTime = Date.now() - startTime;

      return {
        suggestions: allSuggestions,
        newGroups,
        processingTime,
        modelInfo: {
          provider: this.settings!.ai.provider,
          model: this.settings!.ai.model,
          tokensUsed: totalTokensUsed,
        },
      };
    } catch (error) {
      console.error('AIServiceManager: 智能分组失败', error);
      throw new Error(`智能分组失败: ${error}`);
    }
  }

  /**
   * 生成分组名称
   * @param tabs 标签页数组
   * @returns 建议的分组名称
   */
  public async generateGroupName(tabs: Tab[]): Promise<string> {
    if (!this.currentService) {
      throw new Error('AI服务未初始化');
    }

    try {
      return await this.currentService.generateGroupName(tabs);
    } catch (error) {
      console.error('AIServiceManager: 生成分组名称失败', error);
      return '新分组';
    }
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 数组分块
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 估算token使用量
   */
  private estimateTokenUsage(tabs: Tab[]): number {
    // 粗略估算：每个标签页约50个token
    return tabs.length * 50;
  }
}

// ==================== 导出便捷函数 ====================

/**
 * 获取AI服务管理器实例
 */
export const getAIServiceManager = () => AIServiceManager.getInstance();

/**
 * 初始化AI服务
 */
export const initializeAIService = async (): Promise<AIServiceManager> => {
  const manager = getAIServiceManager();
  await manager.initialize();
  return manager;
};

/**
 * 快速智能分组
 */
export const quickIntelligentGrouping = async (tabs: Tab[]): Promise<AIAnalysisResult> => {
  const manager = getAIServiceManager();
  
  if (!manager.isServiceAvailable()) {
    throw new Error('AI服务不可用，请检查API配置');
  }
  
  return await manager.intelligentGrouping(tabs);
};

/**
 * 检查AI服务状态
 */
export const checkAIServiceStatus = async (): Promise<{
  available: boolean;
  provider: string;
  connected: boolean;
}> => {
  const manager = getAIServiceManager();
  const service = manager.getCurrentService();
  
  return {
    available: manager.isServiceAvailable(),
    provider: service?.getProviderName() || 'None',
    connected: service ? await manager.testCurrentService() : false,
  };
};