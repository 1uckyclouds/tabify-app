/**
 * Tabify Chrome插件 - AI智能分组增强服务
 * 
 * 本文件提供了AI智能分组功能的增强实现，包括：
 * - 与扩展桥梁的集成
 * - 批量处理和性能优化
 * - 分组策略管理
 * - 用户偏好学习
 * - 分组质量评估
 * - 实时分组建议
 */

import {
  Tab,
  Group,
  AIAnalysisResult,
  GroupingSuggestion,
  Settings,
  AIProvider,
} from './types';
import { getAIServiceManager, AIServiceManager } from './ai-service';
import { getExtensionBridge } from './extension-bridge';
import { getSyncService } from './sync-service';
import { getStorageService } from './storage';

// ==================== 分组策略类型定义 ====================

/**
 * 分组策略类型
 */
export type GroupingStrategy = 
  | 'domain-based'     // 基于域名分组
  | 'content-based'    // 基于内容分组
  | 'time-based'       // 基于时间分组
  | 'usage-based'      // 基于使用频率分组
  | 'ai-intelligent'   // AI智能分组
  | 'hybrid';          // 混合策略

/**
 * 分组配置
 */
export interface GroupingConfig {
  /** 分组策略 */
  strategy: GroupingStrategy;
  /** 最大分组数量 */
  maxGroups: number;
  /** 最小分组大小 */
  minGroupSize: number;
  /** 置信度阈值 */
  confidenceThreshold: number;
  /** 是否自动应用建议 */
  autoApply: boolean;
  /** 是否学习用户偏好 */
  learnUserPreferences: boolean;
}

/**
 * 分组质量评估结果
 */
export interface GroupingQuality {
  /** 总体质量分数 (0-1) */
  overallScore: number;
  /** 分组一致性分数 */
  consistencyScore: number;
  /** 分组完整性分数 */
  completenessScore: number;
  /** 用户满意度预测 */
  userSatisfactionPrediction: number;
  /** 改进建议 */
  improvements: string[];
}

/**
 * 用户反馈数据
 */
export interface UserFeedback {
  /** 建议ID */
  suggestionId: string;
  /** 用户操作：接受、拒绝、修改 */
  action: 'accept' | 'reject' | 'modify';
  /** 修改后的分组名称（如果有） */
  modifiedGroupName?: string;
  /** 反馈时间 */
  timestamp: number;
  /** 用户评分 (1-5) */
  rating?: number;
}

// ==================== AI智能分组增强服务 ====================

/**
 * AI智能分组增强服务类
 * 提供更智能、更个性化的分组功能
 */
export class AIGroupingService {
  private static instance: AIGroupingService;
  private aiManager: AIServiceManager;
  private config: GroupingConfig;
  private userFeedbackHistory: UserFeedback[] = [];
  private groupingHistory: AIAnalysisResult[] = [];

  /**
   * 获取服务单例实例
   */
  public static getInstance(): AIGroupingService {
    if (!AIGroupingService.instance) {
      AIGroupingService.instance = new AIGroupingService();
    }
    return AIGroupingService.instance;
  }

  /**
   * 私有构造函数
   */
  private constructor() {
    this.aiManager = getAIServiceManager();
    this.config = this.getDefaultConfig();
  }

  /**
   * 初始化服务
   */
  public async initialize(): Promise<void> {
    try {
      // 初始化AI服务管理器
      await this.aiManager.initialize();
      
      // 加载用户配置和历史数据
      await this.loadUserData();
      
      console.log('AIGroupingService: 初始化完成');
    } catch (error) {
      console.error('AIGroupingService: 初始化失败', error);
      throw error;
    }
  }

  /**
   * 智能分组标签页（增强版）
   * @param tabs 要分组的标签页
   * @param options 分组选项
   * @returns 增强的分析结果
   */
  public async intelligentGrouping(
    tabs: Tab[],
    options: Partial<GroupingConfig> = {}
  ): Promise<AIAnalysisResult & { quality: GroupingQuality }> {
    const config = { ...this.config, ...options };
    
    try {
      // 1. 预处理标签页数据
      const processedTabs = await this.preprocessTabs(tabs);
      
      // 2. 根据策略选择分组方法
      let result: AIAnalysisResult;
      
      switch (config.strategy) {
        case 'ai-intelligent':
          result = await this.aiIntelligentGrouping(processedTabs, config);
          break;
        case 'hybrid':
          result = await this.hybridGrouping(processedTabs, config);
          break;
        case 'domain-based':
          result = await this.domainBasedGrouping(processedTabs);
          break;
        case 'content-based':
          result = await this.contentBasedGrouping(processedTabs, config);
          break;
        case 'time-based':
          result = await this.timeBasedGrouping(processedTabs);
          break;
        case 'usage-based':
          result = await this.usageBasedGrouping(processedTabs);
          break;
        default:
          result = await this.aiIntelligentGrouping(processedTabs, config);
      }
      
      // 3. 应用用户偏好优化
      if (config.learnUserPreferences) {
        result = await this.applyUserPreferences(result);
      }
      
      // 4. 评估分组质量
      const quality = await this.evaluateGroupingQuality(result, processedTabs);
      
      // 5. 保存分组历史
      this.groupingHistory.push(result);
      if (this.groupingHistory.length > 50) {
        this.groupingHistory = this.groupingHistory.slice(-50);
      }
      
      // 6. 如果配置了自动应用且质量足够高，则自动应用分组
      if (config.autoApply && quality.overallScore >= config.confidenceThreshold) {
        await this.autoApplyGrouping(result);
      }
      
      return { ...result, quality };
    } catch (error) {
      console.error('AIGroupingService: 智能分组失败', error);
      throw error;
    }
  }

  /**
   * 获取实时分组建议
   * @param currentTabs 当前标签页
   * @returns 实时建议
   */
  public async getRealtimeSuggestions(currentTabs: Tab[]): Promise<GroupingSuggestion[]> {
    try {
      // 只对未分组的标签页提供建议
      const ungroupedTabs = currentTabs.filter(tab => !tab.groupId);
      
      if (ungroupedTabs.length < 2) {
        return [];
      }
      
      // 使用轻量级分析
      const result = await this.lightweightAnalysis(ungroupedTabs);
      
      // 过滤低置信度建议
      return result.suggestions.filter(s => s.confidence >= 0.7);
    } catch (error) {
      console.error('AIGroupingService: 获取实时建议失败', error);
      return [];
    }
  }

  /**
   * 记录用户反馈
   * @param feedback 用户反馈数据
   */
  public async recordUserFeedback(feedback: UserFeedback): Promise<void> {
    try {
      this.userFeedbackHistory.push(feedback);
      
      // 限制历史记录数量
      if (this.userFeedbackHistory.length > 1000) {
        this.userFeedbackHistory = this.userFeedbackHistory.slice(-1000);
      }
      
      // 保存到存储
      await this.saveUserData();
      
      // 如果是负面反馈，调整策略
      if (feedback.action === 'reject' || (feedback.rating && feedback.rating < 3)) {
        await this.adjustStrategyBasedOnFeedback(feedback);
      }
      
      console.log('AIGroupingService: 用户反馈已记录', feedback);
    } catch (error) {
      console.error('AIGroupingService: 记录用户反馈失败', error);
    }
  }

  /**
   * 更新分组配置
   * @param newConfig 新配置
   */
  public async updateConfig(newConfig: Partial<GroupingConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await this.saveUserData();
    console.log('AIGroupingService: 配置已更新', this.config);
  }

  /**
   * 获取分组统计信息
   */
  public getGroupingStats(): {
    totalGroupings: number;
    averageQuality: number;
    userSatisfaction: number;
    mostUsedStrategy: GroupingStrategy;
  } {
    const totalGroupings = this.groupingHistory.length;
    const averageQuality = totalGroupings > 0 
      ? this.groupingHistory.reduce((sum, result) => sum + (result as any).quality?.overallScore || 0, 0) / totalGroupings
      : 0;
    
    const positiveRatings = this.userFeedbackHistory.filter(f => f.rating && f.rating >= 4).length;
    const totalRatings = this.userFeedbackHistory.filter(f => f.rating).length;
    const userSatisfaction = totalRatings > 0 ? positiveRatings / totalRatings : 0;
    
    return {
      totalGroupings,
      averageQuality,
      userSatisfaction,
      mostUsedStrategy: this.config.strategy,
    };
  }

  // ==================== 私有方法 ====================

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): GroupingConfig {
    return {
      strategy: 'ai-intelligent',
      maxGroups: 8,
      minGroupSize: 2,
      confidenceThreshold: 0.8,
      autoApply: false,
      learnUserPreferences: true,
    };
  }

  /**
   * 预处理标签页数据
   */
  private async preprocessTabs(tabs: Tab[]): Promise<Tab[]> {
    // 添加额外的元数据，如域名、内容类型等
    return tabs.map(tab => ({
      ...tab,
      domain: this.extractDomain(tab.url),
      contentType: this.inferContentType(tab.url, tab.title),
    })) as Tab[];
  }

  /**
   * AI智能分组实现
   */
  private async aiIntelligentGrouping(tabs: Tab[], config: GroupingConfig): Promise<AIAnalysisResult> {
    if (!this.aiManager.isServiceAvailable()) {
      throw new Error('AI服务不可用');
    }
    
    return await this.aiManager.intelligentGrouping(tabs, Math.min(tabs.length, 20));
  }

  /**
   * 混合策略分组
   */
  private async hybridGrouping(tabs: Tab[], config: GroupingConfig): Promise<AIAnalysisResult> {
    // 结合多种策略的结果
    const domainResult = await this.domainBasedGrouping(tabs);
    const aiResult = this.aiManager.isServiceAvailable() 
      ? await this.aiIntelligentGrouping(tabs, config)
      : domainResult;
    
    // 合并和优化结果
    return this.mergeGroupingResults([domainResult, aiResult]);
  }

  /**
   * 基于域名的分组
   */
  private async domainBasedGrouping(tabs: Tab[]): Promise<AIAnalysisResult> {
    const domainGroups = new Map<string, Tab[]>();
    
    tabs.forEach(tab => {
      const domain = this.extractDomain(tab.url);
      if (!domainGroups.has(domain)) {
        domainGroups.set(domain, []);
      }
      domainGroups.get(domain)!.push(tab);
    });
    
    const suggestions: GroupingSuggestion[] = [];
    const newGroups: { name: string; description?: string }[] = [];
    
    domainGroups.forEach((domainTabs, domain) => {
      if (domainTabs.length >= 2) {
        const groupName = this.formatDomainName(domain);
        newGroups.push({
          name: groupName,
          description: `基于域名 ${domain} 的自动分组`,
        });
        
        domainTabs.forEach(tab => {
          suggestions.push({
            tabId: tab.id,
            groupType: 'new',
            groupName,
            confidence: 0.8,
            reason: `相同域名: ${domain}`,
          });
        });
      }
    });
    
    return {
      suggestions,
      newGroups,
      processingTime: 50,
      modelInfo: {
        provider: 'local' as AIProvider,
        model: 'domain-based',
        tokensUsed: 0,
      },
    };
  }

  /**
   * 基于内容的分组
   */
  private async contentBasedGrouping(tabs: Tab[], config: GroupingConfig): Promise<AIAnalysisResult> {
    // 简化的内容分析实现
    const contentGroups = new Map<string, Tab[]>();
    
    tabs.forEach(tab => {
      const contentType = this.inferContentType(tab.url, tab.title);
      if (!contentGroups.has(contentType)) {
        contentGroups.set(contentType, []);
      }
      contentGroups.get(contentType)!.push(tab);
    });
    
    const suggestions: GroupingSuggestion[] = [];
    const newGroups: { name: string; description?: string }[] = [];
    
    contentGroups.forEach((contentTabs, contentType) => {
      if (contentTabs.length >= config.minGroupSize) {
        newGroups.push({
          name: contentType,
          description: `基于内容类型的自动分组`,
        });
        
        contentTabs.forEach(tab => {
          suggestions.push({
            tabId: tab.id,
            groupType: 'new',
            groupName: contentType,
            confidence: 0.7,
            reason: `内容类型: ${contentType}`,
          });
        });
      }
    });
    
    return {
      suggestions,
      newGroups,
      processingTime: 30,
      modelInfo: {
        provider: 'local' as AIProvider,
        model: 'content-based',
        tokensUsed: 0,
      },
    };
  }

  /**
   * 基于时间的分组
   */
  private async timeBasedGrouping(tabs: Tab[]): Promise<AIAnalysisResult> {
    // 按创建时间分组（今天、昨天、本周、更早）
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    
    const timeGroups = {
      '今天': [] as Tab[],
      '昨天': [] as Tab[],
      '本周': [] as Tab[],
      '更早': [] as Tab[],
    };
    
    tabs.forEach(tab => {
      const age = now - tab.createdTime;
      if (age < oneDay) {
        timeGroups['今天'].push(tab);
      } else if (age < 2 * oneDay) {
        timeGroups['昨天'].push(tab);
      } else if (age < oneWeek) {
        timeGroups['本周'].push(tab);
      } else {
        timeGroups['更早'].push(tab);
      }
    });
    
    const suggestions: GroupingSuggestion[] = [];
    const newGroups: { name: string; description?: string }[] = [];
    
    Object.entries(timeGroups).forEach(([timePeriod, timeTabs]) => {
      if (timeTabs.length >= 2) {
        newGroups.push({
          name: timePeriod,
          description: `基于创建时间的自动分组`,
        });
        
        timeTabs.forEach(tab => {
          suggestions.push({
            tabId: tab.id,
            groupType: 'new',
            groupName: timePeriod,
            confidence: 0.6,
            reason: `创建时间: ${timePeriod}`,
          });
        });
      }
    });
    
    return {
      suggestions,
      newGroups,
      processingTime: 20,
      modelInfo: {
        provider: 'local' as AIProvider,
        model: 'time-based',
        tokensUsed: 0,
      },
    };
  }

  /**
   * 基于使用频率的分组
   */
  private async usageBasedGrouping(tabs: Tab[]): Promise<AIAnalysisResult> {
    // 根据最后访问时间判断使用频率
    const now = Date.now();
    const frequentTabs = tabs.filter(tab => 
      tab.lastAccessTime && (now - tab.lastAccessTime) < 24 * 60 * 60 * 1000
    );
    const infrequentTabs = tabs.filter(tab => 
      !tab.lastAccessTime || (now - tab.lastAccessTime) >= 24 * 60 * 60 * 1000
    );
    
    const suggestions: GroupingSuggestion[] = [];
    const newGroups: { name: string; description?: string }[] = [];
    
    if (frequentTabs.length >= 2) {
      newGroups.push({
        name: '常用标签页',
        description: '最近经常访问的标签页',
      });
      
      frequentTabs.forEach(tab => {
        suggestions.push({
          tabId: tab.id,
          groupType: 'new',
          groupName: '常用标签页',
          confidence: 0.7,
          reason: '最近经常访问',
        });
      });
    }
    
    if (infrequentTabs.length >= 2) {
      newGroups.push({
        name: '待整理',
        description: '较少访问的标签页',
      });
      
      infrequentTabs.forEach(tab => {
        suggestions.push({
          tabId: tab.id,
          groupType: 'new',
          groupName: '待整理',
          confidence: 0.5,
          reason: '较少访问',
        });
      });
    }
    
    return {
      suggestions,
      newGroups,
      processingTime: 15,
      modelInfo: {
        provider: 'local' as AIProvider,
        model: 'usage-based',
        tokensUsed: 0,
      },
    };
  }

  /**
   * 轻量级分析（用于实时建议）
   */
  private async lightweightAnalysis(tabs: Tab[]): Promise<AIAnalysisResult> {
    // 使用简单的域名分组作为轻量级分析
    return await this.domainBasedGrouping(tabs);
  }

  /**
   * 应用用户偏好优化
   */
  private async applyUserPreferences(result: AIAnalysisResult): Promise<AIAnalysisResult> {
    // 根据用户历史反馈调整建议
    const adjustedSuggestions = result.suggestions.map(suggestion => {
      const similarFeedback = this.findSimilarFeedback(suggestion);
      if (similarFeedback && similarFeedback.action === 'reject') {
        return { ...suggestion, confidence: suggestion.confidence * 0.5 };
      }
      if (similarFeedback && similarFeedback.action === 'accept') {
        return { ...suggestion, confidence: Math.min(1, suggestion.confidence * 1.2) };
      }
      return suggestion;
    });
    
    return { ...result, suggestions: adjustedSuggestions };
  }

  /**
   * 评估分组质量
   */
  private async evaluateGroupingQuality(
    result: AIAnalysisResult, 
    tabs: Tab[]
  ): Promise<GroupingQuality> {
    // 简化的质量评估算法
    const avgConfidence = result.suggestions.reduce((sum, s) => sum + s.confidence, 0) / result.suggestions.length;
    const groupSizeVariance = this.calculateGroupSizeVariance(result.suggestions);
    const coverageRatio = result.suggestions.length / tabs.length;
    
    const consistencyScore = avgConfidence;
    const completenessScore = coverageRatio;
    const overallScore = (consistencyScore + completenessScore) / 2;
    
    const improvements: string[] = [];
    if (avgConfidence < 0.7) improvements.push('提高分组置信度');
    if (coverageRatio < 0.8) improvements.push('增加标签页覆盖率');
    if (groupSizeVariance > 0.5) improvements.push('平衡分组大小');
    
    return {
      overallScore,
      consistencyScore,
      completenessScore,
      userSatisfactionPrediction: overallScore * 0.9, // 简化预测
      improvements,
    };
  }

  /**
   * 自动应用分组
   */
  private async autoApplyGrouping(result: AIAnalysisResult): Promise<void> {
    try {
      const bridge = getExtensionBridge();
      const syncService = getSyncService();
      
      // 创建新分组
      for (const newGroup of result.newGroups) {
        await bridge.createGroup({
          name: newGroup.name,
          description: newGroup.description,
          color: newGroup.color,
        });
      }
      
      // 应用分组建议
      for (const suggestion of result.suggestions) {
        if (suggestion.confidence >= this.config.confidenceThreshold) {
          await bridge.moveTabToGroup(suggestion.tabId, suggestion.groupName);
        }
      }
      
      console.log('AIGroupingService: 自动应用分组完成');
    } catch (error) {
      console.error('AIGroupingService: 自动应用分组失败', error);
    }
  }

  /**
   * 合并分组结果
   */
  private mergeGroupingResults(results: AIAnalysisResult[]): AIAnalysisResult {
    const mergedSuggestions: GroupingSuggestion[] = [];
    const mergedNewGroups: { name: string; description?: string }[] = [];
    let totalProcessingTime = 0;
    let totalTokensUsed = 0;
    
    results.forEach(result => {
      mergedSuggestions.push(...result.suggestions);
      mergedNewGroups.push(...result.newGroups);
      totalProcessingTime += result.processingTime;
      totalTokensUsed += result.modelInfo.tokensUsed;
    });
    
    // 去重和优化
    const uniqueSuggestions = this.deduplicateSuggestions(mergedSuggestions);
    const uniqueNewGroups = this.deduplicateNewGroups(mergedNewGroups);
    
    return {
      suggestions: uniqueSuggestions,
      newGroups: uniqueNewGroups,
      processingTime: totalProcessingTime,
      modelInfo: {
        provider: 'hybrid' as AIProvider,
        model: 'hybrid-strategy',
        tokensUsed: totalTokensUsed,
      },
    };
  }

  /**
   * 根据反馈调整策略
   */
  private async adjustStrategyBasedOnFeedback(feedback: UserFeedback): Promise<void> {
    // 简化的策略调整逻辑
    const recentNegativeFeedback = this.userFeedbackHistory
      .filter(f => f.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000)
      .filter(f => f.action === 'reject' || (f.rating && f.rating < 3));
    
    if (recentNegativeFeedback.length > 5) {
      // 如果最近负面反馈较多，降低置信度阈值
      this.config.confidenceThreshold = Math.max(0.5, this.config.confidenceThreshold - 0.1);
      console.log('AIGroupingService: 根据用户反馈调整置信度阈值', this.config.confidenceThreshold);
    }
  }

  /**
   * 查找相似的用户反馈
   */
  private findSimilarFeedback(suggestion: GroupingSuggestion): UserFeedback | null {
    // 简化的相似性匹配
    return this.userFeedbackHistory.find(feedback => 
      feedback.suggestionId.includes(suggestion.groupName)
    ) || null;
  }

  /**
   * 计算分组大小方差
   */
  private calculateGroupSizeVariance(suggestions: GroupingSuggestion[]): number {
    const groupSizes = new Map<string, number>();
    suggestions.forEach(s => {
      groupSizes.set(s.groupName, (groupSizes.get(s.groupName) || 0) + 1);
    });
    
    const sizes = Array.from(groupSizes.values());
    const avgSize = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
    const variance = sizes.reduce((sum, size) => sum + Math.pow(size - avgSize, 2), 0) / sizes.length;
    
    return Math.sqrt(variance) / avgSize; // 归一化方差
  }

  /**
   * 去重分组建议
   */
  private deduplicateSuggestions(suggestions: GroupingSuggestion[]): GroupingSuggestion[] {
    const seen = new Set<string>();
    return suggestions.filter(s => {
      const key = `${s.tabId}-${s.groupName}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * 去重新分组
   */
  private deduplicateNewGroups(groups: { name: string; description?: string }[]): { name: string; description?: string }[] {
    const seen = new Set<string>();
    return groups.filter(g => {
      if (seen.has(g.name)) return false;
      seen.add(g.name);
      return true;
    });
  }

  /**
   * 提取域名
   */
  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  }

  /**
   * 推断内容类型
   */
  private inferContentType(url: string, title: string): string {
    const lowerUrl = url.toLowerCase();
    const lowerTitle = title.toLowerCase();
    
    if (lowerUrl.includes('github.com') || lowerTitle.includes('github')) return '开发工具';
    if (lowerUrl.includes('stackoverflow.com') || lowerTitle.includes('stack overflow')) return '技术问答';
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('bilibili.com')) return '视频娱乐';
    if (lowerUrl.includes('news') || lowerTitle.includes('新闻')) return '新闻资讯';
    if (lowerUrl.includes('shop') || lowerUrl.includes('buy') || lowerTitle.includes('购买')) return '购物';
    if (lowerUrl.includes('doc') || lowerTitle.includes('文档')) return '文档资料';
    
    return '其他';
  }

  /**
   * 格式化域名
   */
  private formatDomainName(domain: string): string {
    return domain.replace(/^www\./, '').replace(/\.(com|org|net|cn|io)$/, '');
  }

  /**
   * 加载用户数据
   */
  private async loadUserData(): Promise<void> {
    try {
      const storageService = getStorageService();
      const data = await storageService.getItem('aiGroupingUserData');
      
      if (data) {
        this.userFeedbackHistory = data.feedbackHistory || [];
        this.config = { ...this.config, ...data.config };
      }
    } catch (error) {
      console.error('AIGroupingService: 加载用户数据失败', error);
    }
  }

  /**
   * 保存用户数据
   */
  private async saveUserData(): Promise<void> {
    try {
      const storageService = getStorageService();
      await storageService.setItem('aiGroupingUserData', {
        feedbackHistory: this.userFeedbackHistory,
        config: this.config,
        lastUpdated: Date.now(),
      });
    } catch (error) {
      console.error('AIGroupingService: 保存用户数据失败', error);
    }
  }
}

// ==================== 导出便捷函数 ====================

/**
 * 获取AI智能分组服务实例
 */
export const getAIGroupingService = () => AIGroupingService.getInstance();

/**
 * 初始化AI智能分组服务
 */
export const initializeAIGroupingService = async (): Promise<AIGroupingService> => {
  const service = getAIGroupingService();
  await service.initialize();
  return service;
};

/**
 * 快速智能分组
 */
export const quickAIGrouping = async (
  tabs: Tab[], 
  strategy: GroupingStrategy = 'ai-intelligent'
): Promise<AIAnalysisResult & { quality: GroupingQuality }> => {
  const service = getAIGroupingService();
  return await service.intelligentGrouping(tabs, { strategy });
};

/**
 * 获取分组建议
 */
export const getGroupingSuggestions = async (tabs: Tab[]): Promise<GroupingSuggestion[]> => {
  const service = getAIGroupingService();
  return await service.getRealtimeSuggestions(tabs);
};