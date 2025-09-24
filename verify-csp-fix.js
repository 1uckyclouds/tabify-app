/**
 * CSP修复验证脚本
 * 用于验证manifest.json中的CSP配置是否正确移除了'unsafe-inline'指令
 */

const fs = require('fs');
const path = require('path');

// 配置路径
const EXTENSION_BUILD_PATH = path.join(__dirname, 'extension', 'build');
const MANIFEST_PATH = path.join(EXTENSION_BUILD_PATH, 'manifest.json');

console.log('🔍 开始验证CSP修复效果...');
console.log(`📁 检查路径: ${MANIFEST_PATH}`);

// 检查文件是否存在
if (!fs.existsSync(MANIFEST_PATH)) {
    console.error('❌ manifest.json文件不存在');
    process.exit(1);
}

try {
    // 读取manifest.json
    const manifestContent = fs.readFileSync(MANIFEST_PATH, 'utf8');
    const manifest = JSON.parse(manifestContent);
    
    console.log('✅ manifest.json文件读取成功');
    
    // 检查CSP配置
    if (!manifest.content_security_policy) {
        console.error('❌ 未找到content_security_policy配置');
        process.exit(1);
    }
    
    const csp = manifest.content_security_policy.extension_pages;
    console.log('📋 当前CSP配置:');
    console.log(csp);
    
    // 验证是否移除了unsafe-inline
    const hasUnsafeInline = csp.includes("'unsafe-inline'");
    const hasWasmUnsafeEval = csp.includes("'wasm-unsafe-eval'");
    
    console.log('\n🔍 CSP验证结果:');
    console.log(`- 包含 'unsafe-inline': ${hasUnsafeInline ? '❌ 是' : '✅ 否'}`);
    console.log(`- 包含 'wasm-unsafe-eval': ${hasWasmUnsafeEval ? '✅ 是' : '❌ 否'}`);
    
    if (!hasUnsafeInline && hasWasmUnsafeEval) {
        console.log('\n🎉 CSP修复验证通过!');
        console.log('✅ 已成功移除不安全的\'unsafe-inline\'指令');
        console.log('✅ 保留了必要的\'wasm-unsafe-eval\'指令');
        
        // 检查HTML文件是否存在
        const managerHtmlPath = path.join(EXTENSION_BUILD_PATH, 'manager.html');
        if (fs.existsSync(managerHtmlPath)) {
            console.log('✅ manager.html文件存在');
            
            // 简单检查HTML内容
            const htmlContent = fs.readFileSync(managerHtmlPath, 'utf8');
            const hasTitle = htmlContent.includes('<title>');
            const hasReactRoot = htmlContent.includes('__next');
            
            console.log(`✅ HTML包含标题标签: ${hasTitle ? '是' : '否'}`);
            console.log(`✅ HTML包含React根元素: ${hasReactRoot ? '是' : '否'}`);
        } else {
            console.log('⚠️  manager.html文件不存在');
        }
        
        process.exit(0);
    } else {
        console.log('\n❌ CSP修复验证失败!');
        if (hasUnsafeInline) {
            console.log('❌ 仍然包含不安全的\'unsafe-inline\'指令');
        }
        if (!hasWasmUnsafeEval) {
            console.log('❌ 缺少必要的\'wasm-unsafe-eval\'指令');
        }
        process.exit(1);
    }
    
} catch (error) {
    console.error('❌ 验证过程中发生错误:', error.message);
    process.exit(1);
}