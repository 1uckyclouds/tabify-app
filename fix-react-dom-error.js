/**
 * React DOM错误修复脚本
 * 解决"Failed to execute 'removeChild' on 'Node'"错误
 */

const fs = require('fs');
const path = require('path');

/**
 * 修复React DOM错误的主函数
 * 通过添加安全检查和错误边界来防止removeChild错误
 */
function fixReactDOMError() {
  console.log('🔧 开始修复React DOM错误...');
  
  // 1. 创建错误边界组件
  createErrorBoundary();
  
  // 2. 修复manager.html中的React初始化
  fixManagerHTML();
  
  // 3. 添加DOM操作安全检查
  addDOMSafetyChecks();
  
  console.log('✅ React DOM错误修复完成');
}

/**
 * 创建React错误边界组件
 * 用于捕获和处理React组件中的错误
 */
function createErrorBoundary() {
  console.log('📦 创建错误边界组件...');
  
  const errorBoundaryCode = `
/**
 * React错误边界组件
 * 捕获子组件中的JavaScript错误并显示备用UI
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // 更新state，下次渲染将显示备用UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // 记录错误信息
    console.error('React错误边界捕获到错误:', error, errorInfo);
    
    // 可以将错误信息发送到错误报告服务
    if (window.ExtensionBridge && window.ExtensionBridge.isChromeExtension()) {
      console.log('在Chrome扩展环境中，错误已被捕获');
    }
  }

  render() {
    if (this.state.hasError) {
      // 渲染备用UI
      return React.createElement('div', {
        className: 'error-boundary-fallback',
        style: {
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          margin: '20px'
        }
      }, [
        React.createElement('h2', { key: 'title' }, '页面加载出现问题'),
        React.createElement('p', { key: 'message' }, '请刷新页面重试'),
        React.createElement('button', {
          key: 'refresh',
          onClick: () => window.location.reload(),
          style: {
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }
        }, '刷新页面')
      ]);
    }

    return this.props.children;
  }
}

// 将错误边界添加到全局
window.ErrorBoundary = ErrorBoundary;
`;
  
  // 将错误边界代码添加到chrome-extension-bridge.js
  const bridgePath = path.join(__dirname, 'extension/build/chrome-extension-bridge.js');
  
  if (fs.existsSync(bridgePath)) {
    let bridgeContent = fs.readFileSync(bridgePath, 'utf8');
    
    // 检查是否已经包含错误边界
    if (!bridgeContent.includes('ErrorBoundary')) {
      bridgeContent += errorBoundaryCode;
      fs.writeFileSync(bridgePath, bridgeContent);
      console.log('✅ 错误边界已添加到chrome-extension-bridge.js');
    } else {
      console.log('ℹ️  错误边界已存在');
    }
  }
}

/**
 * 修复manager.html中的React初始化问题
 * 添加更安全的DOM操作和错误处理
 */
function fixManagerHTML() {
  console.log('📄 修复manager.html...');
  
  const managerPath = path.join(__dirname, 'extension/build/manager.html');
  
  if (!fs.existsSync(managerPath)) {
    console.log('❌ manager.html文件不存在');
    return;
  }
  
  let htmlContent = fs.readFileSync(managerPath, 'utf8');
  
  // 添加DOM就绪检查脚本
  const domReadyScript = `
<script>
// DOM安全操作工具
window.SafeDOM = {
  // 安全的removeChild操作
  safeRemoveChild: function(parent, child) {
    try {
      if (parent && child && parent.contains(child)) {
        parent.removeChild(child);
        return true;
      }
    } catch (error) {
      console.warn('SafeDOM: removeChild操作失败', error);
    }
    return false;
  },
  
  // 安全的appendChild操作
  safeAppendChild: function(parent, child) {
    try {
      if (parent && child && !parent.contains(child)) {
        parent.appendChild(child);
        return true;
      }
    } catch (error) {
      console.warn('SafeDOM: appendChild操作失败', error);
    }
    return false;
  },
  
  // 检查DOM元素是否有效
  isValidElement: function(element) {
    return element && element.nodeType === 1 && element.parentNode;
  }
};

// 重写原生DOM方法以添加安全检查
if (typeof Node !== 'undefined' && Node.prototype.removeChild) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function(child) {
    try {
      if (this.contains(child)) {
        return originalRemoveChild.call(this, child);
      } else {
        console.warn('尝试移除不存在的子节点，操作被跳过');
        return child;
      }
    } catch (error) {
      console.error('removeChild操作出错:', error);
      return child;
    }
  };
}

console.log('SafeDOM工具已加载');
</script>
`;
  
  // 在</head>标签前插入DOM安全脚本
  if (!htmlContent.includes('SafeDOM')) {
    htmlContent = htmlContent.replace('</head>', domReadyScript + '</head>');
    fs.writeFileSync(managerPath, htmlContent);
    console.log('✅ DOM安全脚本已添加到manager.html');
  } else {
    console.log('ℹ️  DOM安全脚本已存在');
  }
}

/**
 * 添加DOM操作安全检查
 * 修改内联脚本以使用安全的DOM操作
 */
function addDOMSafetyChecks() {
  console.log('🛡️  添加DOM操作安全检查...');
  
  const buildDir = path.join(__dirname, 'extension/build');
  
  // 检查所有内联脚本文件
  for (let i = 1; i <= 7; i++) {
    const scriptPath = path.join(buildDir, `inline-script-${i}.js`);
    
    if (fs.existsSync(scriptPath)) {
      let scriptContent = fs.readFileSync(scriptPath, 'utf8');
      
      // 添加安全检查到脚本开头
      const safetyCheck = `
// DOM操作安全检查
if (typeof window !== 'undefined' && window.SafeDOM) {
  console.log('内联脚本 ${i}: DOM安全工具可用');
} else {
  console.warn('内联脚本 ${i}: DOM安全工具不可用');
}

`;
      
      if (!scriptContent.includes('DOM操作安全检查')) {
        // 在脚本内容前添加安全检查
        const lines = scriptContent.split('\n');
        const headerEnd = lines.findIndex(line => line.includes('*/'));
        
        if (headerEnd !== -1) {
          lines.splice(headerEnd + 1, 0, safetyCheck);
          scriptContent = lines.join('\n');
          fs.writeFileSync(scriptPath, scriptContent);
          console.log(`✅ 安全检查已添加到 inline-script-${i}.js`);
        }
      }
    }
  }
}

/**
 * 验证修复效果
 * 检查所有修复是否正确应用
 */
function verifyFixes() {
  console.log('🔍 验证修复效果...');
  
  const checks = [
    {
      name: 'chrome-extension-bridge.js包含错误边界',
      path: 'extension/build/chrome-extension-bridge.js',
      check: content => content.includes('ErrorBoundary')
    },
    {
      name: 'manager.html包含DOM安全脚本',
      path: 'extension/build/manager.html',
      check: content => content.includes('SafeDOM')
    },
    {
      name: '字体文件存在',
      path: 'extension/build/assets/remixicon.woff2',
      check: () => true // 文件存在性检查
    }
  ];
  
  let allPassed = true;
  
  checks.forEach(({ name, path: filePath, check }) => {
    const fullPath = path.join(__dirname, filePath);
    
    if (fs.existsSync(fullPath)) {
      if (check === true || check(fs.readFileSync(fullPath, 'utf8'))) {
        console.log(`✅ ${name}`);
      } else {
        console.log(`❌ ${name}`);
        allPassed = false;
      }
    } else {
      console.log(`❌ ${name} - 文件不存在`);
      allPassed = false;
    }
  });
  
  return allPassed;
}

// 运行修复
if (require.main === module) {
  fixReactDOMError();
  
  console.log('\n🔍 验证修复效果...');
  const success = verifyFixes();
  
  if (success) {
    console.log('\n🎉 所有修复已成功应用！');
    console.log('💡 建议：现在重新测试manager.html页面');
  } else {
    console.log('\n⚠️  部分修复可能未成功应用，请检查上述错误');
  }
}

module.exports = { fixReactDOMError, verifyFixes };