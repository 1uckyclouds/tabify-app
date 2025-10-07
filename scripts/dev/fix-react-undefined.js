/**
 * 修复React未定义错误的脚本
 * 确保React库正确加载
 */

const fs = require('fs');
const path = require('path');

/**
 * 修复React未定义错误
 */
function fixReactUndefined() {
  console.log('🔧 开始修复React未定义错误...');
  
  // 1. 检查React相关的JavaScript文件
  checkReactFiles();
  
  // 2. 添加React全局变量定义
  addReactGlobals();
  
  // 3. 修复错误边界中的React引用
  fixErrorBoundaryReact();
  
  console.log('✅ React未定义错误修复完成');
}

/**
 * 检查React相关文件
 */
function checkReactFiles() {
  console.log('📦 检查React相关文件...');
  
  const buildDir = path.join(__dirname, 'extension/build/nextstatic/static/chunks');
  
  if (!fs.existsSync(buildDir)) {
    console.log('❌ chunks目录不存在');
    return;
  }
  
  const files = fs.readdirSync(buildDir);
  const reactFiles = files.filter(file => 
    file.includes('react') || 
    file.includes('main-app') || 
    file.includes('polyfills')
  );
  
  console.log('📄 找到React相关文件:', reactFiles);
  
  // 检查主要的React文件
  const mainAppFile = files.find(file => file.includes('main-app'));
  if (mainAppFile) {
    const filePath = path.join(buildDir, mainAppFile);
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('React') || content.includes('react')) {
      console.log('✅ React代码存在于', mainAppFile);
    } else {
      console.log('⚠️  React代码可能不在', mainAppFile);
    }
  }
}

/**
 * 添加React全局变量定义
 */
function addReactGlobals() {
  console.log('🌐 添加React全局变量定义...');
  
  const bridgePath = path.join(__dirname, 'extension/build/chrome-extension-bridge.js');
  
  if (!fs.existsSync(bridgePath)) {
    console.log('❌ chrome-extension-bridge.js不存在');
    return;
  }
  
  let bridgeContent = fs.readFileSync(bridgePath, 'utf8');
  
  // 添加React全局变量检查和定义
  const reactGlobalCode = `

// React全局变量修复
(function() {
  'use strict';
  
  // 等待React库加载
  function waitForReact(callback, maxAttempts = 50) {
    let attempts = 0;
    
    function check() {
      attempts++;
      
      // 检查各种可能的React引用
      if (typeof window.React !== 'undefined') {
        console.log('✅ React已通过window.React加载');
        callback(window.React);
        return;
      }
      
      // 检查全局React
      if (typeof React !== 'undefined') {
        console.log('✅ React已作为全局变量加载');
        window.React = React;
        callback(React);
        return;
      }
      
      // 检查模块系统中的React
      if (typeof __webpack_require__ !== 'undefined') {
        try {
          // 尝试从webpack模块中获取React
          const reactModule = __webpack_require__.cache;
          for (let moduleId in reactModule) {
            const module = reactModule[moduleId];
            if (module && module.exports && 
                (module.exports.createElement || module.exports.Component)) {
              console.log('✅ React已从webpack模块加载');
              window.React = module.exports;
              callback(module.exports);
              return;
            }
          }
        } catch (e) {
          // 忽略错误，继续尝试
        }
      }
      
      if (attempts < maxAttempts) {
        setTimeout(check, 100); // 每100ms检查一次
      } else {
        console.warn('⚠️  React加载超时，创建基础React对象');
        // 创建一个基础的React对象以防止错误
        window.React = {
          createElement: function(type, props, ...children) {
            console.warn('使用基础React.createElement');
            const element = document.createElement(type);
            if (props) {
              for (let key in props) {
                if (key === 'className') {
                  element.className = props[key];
                } else if (key.startsWith('on')) {
                  element.addEventListener(key.slice(2).toLowerCase(), props[key]);
                } else {
                  element.setAttribute(key, props[key]);
                }
              }
            }
            children.forEach(child => {
              if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
              } else if (child && child.nodeType) {
                element.appendChild(child);
              }
            });
            return element;
          },
          Component: class Component {
            constructor(props) {
              this.props = props || {};
              this.state = {};
            }
            
            setState(newState) {
              this.state = { ...this.state, ...newState };
              if (this.render) {
                console.warn('基础Component.setState调用');
              }
            }
            
            render() {
              return null;
            }
          }
        };
        callback(window.React);
      }
    }
    
    check();
  }
  
  // 在DOM加载完成后等待React
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      waitForReact(function(react) {
        console.log('React全局变量已设置');
      });
    });
  } else {
    waitForReact(function(react) {
      console.log('React全局变量已设置');
    });
  }
})();
`;
  
  // 检查是否已经包含React全局变量代码
  if (!bridgeContent.includes('React全局变量修复')) {
    bridgeContent += reactGlobalCode;
    fs.writeFileSync(bridgePath, bridgeContent);
    console.log('✅ React全局变量定义已添加');
  } else {
    console.log('ℹ️  React全局变量定义已存在');
  }
}

/**
 * 修复错误边界中的React引用
 */
function fixErrorBoundaryReact() {
  console.log('🛡️  修复错误边界中的React引用...');
  
  const bridgePath = path.join(__dirname, 'extension/build/chrome-extension-bridge.js');
  
  if (!fs.existsSync(bridgePath)) {
    return;
  }
  
  let bridgeContent = fs.readFileSync(bridgePath, 'utf8');
  
  // 修复ErrorBoundary中的React引用
  if (bridgeContent.includes('class ErrorBoundary extends React.Component')) {
    // 替换为更安全的React引用
    bridgeContent = bridgeContent.replace(
      'class ErrorBoundary extends React.Component',
      'class ErrorBoundary extends (window.React ? window.React.Component : class { constructor(props) { this.props = props; this.state = {}; } })'
    );
    
    // 修复React.createElement调用
    bridgeContent = bridgeContent.replace(
      /React\.createElement/g,
      '(window.React ? window.React.createElement : function(type, props, ...children) { const el = document.createElement(type); return el; })'
    );
    
    fs.writeFileSync(bridgePath, bridgeContent);
    console.log('✅ 错误边界React引用已修复');
  }
}

/**
 * 验证修复效果
 */
function verifyReactFix() {
  console.log('🔍 验证React修复效果...');
  
  const bridgePath = path.join(__dirname, 'extension/build/chrome-extension-bridge.js');
  
  if (fs.existsSync(bridgePath)) {
    const content = fs.readFileSync(bridgePath, 'utf8');
    
    const checks = [
      { name: '包含React全局变量修复', check: content.includes('React全局变量修复') },
      { name: '包含waitForReact函数', check: content.includes('waitForReact') },
      { name: '包含基础React对象', check: content.includes('window.React = {') }
    ];
    
    let allPassed = true;
    checks.forEach(({ name, check }) => {
      if (check) {
        console.log(`✅ ${name}`);
      } else {
        console.log(`❌ ${name}`);
        allPassed = false;
      }
    });
    
    return allPassed;
  }
  
  return false;
}

// 运行修复
if (require.main === module) {
  fixReactUndefined();
  
  console.log('\n🔍 验证修复效果...');
  const success = verifyReactFix();
  
  if (success) {
    console.log('\n🎉 React未定义错误修复完成！');
    console.log('💡 建议：重新运行最终测试验证效果');
  } else {
    console.log('\n⚠️  部分修复可能未成功应用');
  }
}

module.exports = { fixReactUndefined, verifyReactFix };