/**
 * CSP修复验证脚本
 * 用于验证Chrome扩展的CSP问题是否已解决
 */

const fs = require('fs');
const path = require('path');

// 配置
const BUILD_DIR = path.join(__dirname, '../../extension/build');
const MANIFEST_PATH = path.join(__dirname, '../../extension/manifest.json');
const MANAGER_HTML_PATH = path.join(BUILD_DIR, 'manager.html');
const REMIXICON_PATH = path.join(BUILD_DIR, 'assets/remixicon.min.css');

/**
 * 验证manifest.json的CSP配置
 */
function validateManifestCSP() {
  console.log('🔍 验证manifest.json的CSP配置...');
  
  try {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    const csp = manifest.content_security_policy?.extension_pages;
    
    if (!csp) {
      console.error('❌ 未找到CSP配置');
      return false;
    }
    
    // 检查是否包含必要的CSP指令
    const requiredDirectives = [
      "'unsafe-inline'",
      "'unsafe-eval'",
      "https://cdnjs.cloudflare.com"
    ];
    
    let allPresent = true;
    requiredDirectives.forEach(directive => {
      if (!csp.includes(directive)) {
        console.error(`❌ CSP缺少必要指令: ${directive}`);
        allPresent = false;
      } else {
        console.log(`✅ CSP包含指令: ${directive}`);
      }
    });
    
    return allPresent;
  } catch (error) {
    console.error('❌ 读取manifest.json失败:', error.message);
    return false;
  }
}

/**
 * 验证manager.html文件
 */
function validateManagerHTML() {
  console.log('🔍 验证manager.html文件...');
  
  try {
    const htmlContent = fs.readFileSync(MANAGER_HTML_PATH, 'utf8');
    
    // 检查是否包含Chrome扩展桥梁代码
    if (htmlContent.includes('ChromeExtensionBridge')) {
      console.log('✅ 包含Chrome扩展桥梁代码');
    } else {
      console.error('❌ 缺少Chrome扩展桥梁代码');
      return false;
    }
    
    // 检查是否包含TABIFY_CONFIG
    if (htmlContent.includes('TABIFY_CONFIG')) {
      console.log('✅ 包含TABIFY_CONFIG配置');
    } else {
      console.error('❌ 缺少TABIFY_CONFIG配置');
      return false;
    }
    
    // 检查资源路径是否正确
    if (htmlContent.includes('nextstatic/')) {
      console.log('✅ 资源路径已正确转换为nextstatic');
    } else {
      console.error('❌ 资源路径未正确转换');
      return false;
    }
    
    // 检查是否还有外部CSS引用
    if (htmlContent.includes('cdnjs.cloudflare.com')) {
      console.error('❌ 仍包含外部CSS引用');
      return false;
    } else {
      console.log('✅ 已移除外部CSS引用');
    }
    
    return true;
  } catch (error) {
    console.error('❌ 读取manager.html失败:', error.message);
    return false;
  }
}

/**
 * 验证本地CSS资源
 */
function validateLocalCSS() {
  console.log('🔍 验证本地CSS资源...');
  
  try {
    if (fs.existsSync(REMIXICON_PATH)) {
      const stats = fs.statSync(REMIXICON_PATH);
      if (stats.size > 0) {
        console.log(`✅ remixicon.min.css已本地化 (${stats.size} bytes)`);
        return true;
      } else {
        console.error('❌ remixicon.min.css文件为空');
        return false;
      }
    } else {
      console.error('❌ 未找到本地化的remixicon.min.css文件');
      return false;
    }
  } catch (error) {
    console.error('❌ 验证本地CSS资源失败:', error.message);
    return false;
  }
}

/**
 * 验证构建目录结构
 */
function validateBuildStructure() {
  console.log('🔍 验证构建目录结构...');
  
  const requiredFiles = [
    'manifest.json',
    'background.js',
    'manager.html',
    'logo.png',
    'nextstatic',
    'assets',
    'icons'
  ];
  
  let allPresent = true;
  requiredFiles.forEach(file => {
    const filePath = path.join(BUILD_DIR, file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ 存在: ${file}`);
    } else {
      console.error(`❌ 缺少: ${file}`);
      allPresent = false;
    }
  });
  
  return allPresent;
}

/**
 * 主验证函数
 */
function runValidation() {
  console.log('🚀 开始CSP修复验证...');
  console.log('='.repeat(50));
  
  const results = {
    manifestCSP: validateManifestCSP(),
    managerHTML: validateManagerHTML(),
    localCSS: validateLocalCSS(),
    buildStructure: validateBuildStructure()
  };
  
  console.log('='.repeat(50));
  console.log('📊 验证结果汇总:');
  
  let allPassed = true;
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ 通过' : '❌ 失败';
    console.log(`  ${test}: ${status}`);
    if (!passed) allPassed = false;
  });
  
  console.log('='.repeat(50));
  
  if (allPassed) {
    console.log('🎉 所有验证通过！CSP问题已成功修复。');
    console.log('📝 建议手动测试:');
    console.log('   1. 在Chrome中加载扩展: chrome://extensions/');
    console.log('   2. 右键扩展图标，点击"打开管理界面"');
    console.log('   3. 检查控制台是否无CSP错误');
    console.log('   4. 验证React应用是否正常加载');
  } else {
    console.log('⚠️ 部分验证失败，请检查上述错误并重新构建。');
  }
  
  return allPassed;
}

// 如果直接运行此脚本
if (require.main === module) {
  const success = runValidation();
  process.exit(success ? 0 : 1);
}

module.exports = { runValidation };