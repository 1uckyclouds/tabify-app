import { test, expect, chromium } from '@playwright/test';
import path from 'path';

/**
 * 简单的扩展加载测试
 * 验证扩展是否能正确加载并且React应用能正确初始化
 */

test('简单扩展加载和React初始化测试', async () => {
  const extensionPath = path.resolve(__dirname, '../extension/build');
  
  console.log('🚀 启动Chrome浏览器并加载扩展...');
  console.log('📁 扩展路径:', extensionPath);
  
  const browser = await chromium.launch({
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
      '--disable-set