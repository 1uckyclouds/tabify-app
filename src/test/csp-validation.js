/**
 * CSP安全验证脚本
 * 验证Chrome扩展是否符合内容安全策略要求
 */

const fs = require('fs');
const path = require('path');

// 配置路径
const BUILD_DIR = path.join(__dirname, '../../extension/build');
const MANIFEST_PATH = path.join(BUILD_DIR, 'manifest.json');
const MANAGER_HTML_PATH = path.join(BUILD_DIR, 'manager.html');
const BRIDGE_JS_PATH = path.join(BUILD_DIR, 'chrome-extension-bridge.js');

/**
 * 验证manifest.json的CSP配置
 */
function validateManifestCSP() {
  console.log('🔍 验证manifest.json CSP配置...');
  
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error('manifest.json文件不存在');
  }
  
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const csp = manifest.content_security_policy?.extension_pages;
  
  if (!csp) {
    throw new Error('未找到CSP配置');
  }
  
  // 检查是否包含不安全的指令
  const unsafeDirectives = ['unsafe-inline', 'unsafe-eval'];
  const hasUnsafeDirectives = unsafeDirectives.some(directive => csp.includes(directive));
  
  if (hasUnsafeDirectives) {
    throw new Error(`CSP配置包含不安全的指令: ${csp}`);
  }
  
  console.log('✅ manifest.json CSP配置安全');
  return true;
}

/**
 * 验证HTML文件是否包含内联脚本
 */
function validateHTMLInlineScripts() {
  console.log('🔍 验证HTML文件内联脚本...');
  
  if (!fs.existsSync(MANAGER_HTML_PATH)) {
    throw new Error('manager.html文件不存在');
  }
  
  const htmlContent = fs.readFileSync(MANAGER_HTML_PATH, 'utf8');
  
  // 检查内联脚本
  const inlineScriptRegex = /<script[^>]*>(?:(?!<\/script>)[\s\S])*<\/script>/gi;
  const inlineScripts = htmlContent.match(inlineScriptRegex);
  
  if (inlineScripts && inlineScripts.length > 0) {
    // 过滤掉外部脚本引用
    const actualInlineScripts = inlineScripts.filter(script => {
      return !script.includes('src=') && script.trim() !== '<script></script>';
    });
    
    if (actualInlineScripts.length > 0) {
      console.warn('⚠️ 发现内联脚本:');
      actualInlineScripts.forEach((script, index) => {
        console.warn(`  ${index + 1}. ${script.substring(0, 100)}...`);
      });
      throw new Error('HTML文件包含内联脚本，违反CSP策略');
    }
  }
  
  // 检查内联样式
  const inlineStyleRegex = /\sstyle="[^"]*"/gi;
  const inlineStyles = htmlContent.match(inlineStyleRegex);
  
  if (inlineStyles && inlineStyles.length > 0) {
    console.warn('⚠️ 发现内联样式:');
    inlineStyles.slice(0, 5).forEach((style, index) => {
      console.warn(`  ${index + 1}. ${style}`);
    });
    if (inlineStyles.length > 5) {
      console.warn(`  ... 还有 ${inlineStyles.length - 5} 个内联样式`);
    }
    // 注意：内联样式可能需要特殊处理，这里只是警告
  }
  
  console.log('✅ HTML文件无违规内联脚本');
  return true;
}

/**
 * 验证外部脚本文件是否存在
 */
function validateExternalScripts() {
  console.log('🔍 验证外部脚本文件...');
  
  if (!fs.existsSync(BRIDGE_JS_PATH)) {
    throw new Error('chrome-extension-bridge.js文件不存在');
  }
  
  const bridgeContent = fs.readFileSync(BRIDGE_JS_PATH, 'utf8');
  
  // 验证桥梁脚本包含必要的功能
  const requiredFunctions = [
    'ChromeExtensionBridge',
    'sendMessage',
    'getStorageData',
    'setStorageData',
    'restoreTab'
  ];
  
  const missingFunctions = requiredFunctions.filter(func => !bridgeContent.includes(func));
  
  if (missingFunctions.length > 0) {
    throw new Error(`桥梁脚本缺少必要功能: ${missingFunctions.join(', ')}`);
  }
  
  console.log('✅ 外部脚本文件完整');
  return true;
}

/**
 * 验证web_accessible_resources配置
 */
function validateWebAccessibleResources() {
  console.log('🔍 验证web_accessible_resources配置...');
  
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const resources = manifest.web_accessible_resources?.[0]?.resources || [];
  
  const requiredResources = [
    'manager.html',
    'chrome-extension-bridge.js',
    'nextstatic/*'
  ];
  
  const missingResources = requiredResources.filter(resource => !resources.includes(resource));
  
  if (missingResources.length > 0) {
    throw new Error(`缺少必要的web_accessible_resources: ${missingResources.join(', ')}`);
  }
  
  console.log('✅ web_accessible_resources配置正确');
  return true;
}

/**
 * 主验证函数
 */
function validateCSPCompliance() {
  console.log('🚀 开始CSP安全验证...');
  
  try {
    validateManifestCSP();
    validateHTMLInlineScripts();
    validateExternalScripts();
    validateWebAccessibleResources();
    
    console.log('\n✅ 所有CSP安全验证通过！');
    console.log('📋 验证结果:');
    console.log('  ✅ manifest.json CSP配置安全');
    console.log('  ✅ HTML文件无内联脚本');
    console.log('  ✅ 外部脚本文件完整');
    console.log('  ✅ web_accessible_resources配置正确');
    console.log('\n🎉 Chrome扩展现在符合CSP安全要求，可以正常加载！');
    
    return true;
  } catch (error) {
    console.error('\n❌ CSP验证失败:', error.message);
    return false;
  }
}

// 如果直接运行此脚本，执行验证
if (require.main === module) {
  const success = validateCSPCompliance();
  process.exit(success ? 0 : 1);
}

module.exports = {
  validateCSPCompliance,
  validateManifestCSP,
  validateHTMLInlineScripts,
  validateExternalScripts,
  validateWebAccessibleResources
};