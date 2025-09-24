/**
 * SafeDOM - 安全DOM操作工具
 * 防止React DOM操作错误，特别是removeChild错误
 */

/**
 * DOM安全操作工具类
 * 提供安全的DOM操作方法，防止常见的DOM操作错误
 */
export class SafeDOM {
  private static isInitialized = false;

  /**
   * 初始化SafeDOM工具
   * 重写原生DOM方法以添加安全检查
   */
  public static initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    try {
      // 重写Node.prototype.removeChild方法
      if (typeof Node !== 'undefined' && Node.prototype.removeChild) {
        const originalRemoveChild = Node.prototype.removeChild;
        
        Node.prototype.removeChild = function(child: Node): Node {
          try {
            // 检查父节点是否包含要移除的子节点
            if (this.contains && this.contains(child)) {
              return originalRemoveChild.call(this, child);
            } else {
              console.warn('SafeDOM: 尝试移除不存在的子节点，操作被跳过', {
                parent: this,
                child: child,
                parentNodeName: this.nodeName,
                childNodeName: child.nodeName
              });
              return child;
            }
          } catch (error) {
            console.error('SafeDOM: removeChild操作出错', error, {
              parent: this,
              child: child
            });
            return child;
          }
        };
      }

      // 重写Node.prototype.insertBefore方法
      if (typeof Node !== 'undefined' && Node.prototype.insertBefore) {
        const originalInsertBefore = Node.prototype.insertBefore;
        
        Node.prototype.insertBefore = function(newNode: Node, referenceNode: Node | null): Node {
          try {
            // 检查新节点是否有效
            if (!newNode) {
              console.warn('SafeDOM: 尝试插入无效节点');
              return newNode;
            }
            
            // 检查参考节点是否为当前节点的子节点（如果不为null）
            if (referenceNode && !this.contains(referenceNode)) {
              console.warn('SafeDOM: 参考节点不是当前节点的子节点');
              return this.appendChild(newNode);
            }
            
            return originalInsertBefore.call(this, newNode, referenceNode);
          } catch (error) {
            console.error('SafeDOM: insertBefore操作出错', error);
            // 尝试使用appendChild作为后备
            try {
              return this.appendChild(newNode);
            } catch (appendError) {
              console.error('SafeDOM: appendChild后备操作也失败', appendError);
              return newNode;
            }
          }
        };
      }

      this.isInitialized = true;
      console.log('✅ SafeDOM工具已初始化');
    } catch (error) {
      console.error('❌ SafeDOM初始化失败', error);
    }
  }

  /**
   * 安全的removeChild操作
   * @param parent 父节点
   * @param child 要移除的子节点
   * @returns 是否成功移除
   */
  public static safeRemoveChild(parent: Node, child: Node): boolean {
    try {
      if (parent && child && parent.contains && parent.contains(child)) {
        parent.removeChild(child);
        return true;
      } else {
        console.warn('SafeDOM: 无法移除子节点 - 父节点不包含该子节点', {
          parent: parent?.nodeName,
          child: child?.nodeName
        });
        return false;
      }
    } catch (error) {
      console.error('SafeDOM: removeChild操作失败', error);
      return false;
    }
  }

  /**
   * 安全的appendChild操作
   * @param parent 父节点
   * @param child 要添加的子节点
   * @returns 是否成功添加
   */
  public static safeAppendChild(parent: Node, child: Node): boolean {
    try {
      if (parent && child && !parent.contains(child)) {
        parent.appendChild(child);
        return true;
      } else if (parent && child && parent.contains(child)) {
        console.warn('SafeDOM: 子节点已存在于父节点中');
        return true;
      }
      return false;
    } catch (error) {
      console.error('SafeDOM: appendChild操作失败', error);
      return false;
    }
  }

  /**
   * 检查DOM元素是否有效
   * @param element 要检查的元素
   * @returns 元素是否有效
   */
  public static isValidElement(element: any): element is Element {
    return element && 
           typeof element === 'object' && 
           element.nodeType === 1 && 
           element.parentNode !== undefined;
  }

  /**
   * 安全的元素查询
   * @param selector CSS选择器
   * @param parent 父元素（可选）
   * @returns 找到的元素或null
   */
  public static safeQuerySelector(selector: string, parent?: Element): Element | null {
    try {
      const container = parent || document;
      return container.querySelector(selector);
    } catch (error) {
      console.error('SafeDOM: querySelector操作失败', error, { selector });
      return null;
    }
  }

  /**
   * 安全的元素查询（多个）
   * @param selector CSS选择器
   * @param parent 父元素（可选）
   * @returns 找到的元素数组
   */
  public static safeQuerySelectorAll(selector: string, parent?: Element): Element[] {
    try {
      const container = parent || document;
      return Array.from(container.querySelectorAll(selector));
    } catch (error) {
      console.error('SafeDOM: querySelectorAll操作失败', error, { selector });
      return [];
    }
  }

  /**
   * 创建React错误边界组件
   * @returns React错误边界组件类
   */
  public static createErrorBoundary(): any {
    if (typeof window === 'undefined' || !window.React) {
      console.warn('SafeDOM: React不可用，无法创建错误边界');
      return null;
    }

    const React = window.React;

    return class ErrorBoundary extends React.Component {
      constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
      }

      static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
      }

      componentDidCatch(error: Error, errorInfo: any) {
        console.error('React错误边界捕获到错误:', error, errorInfo);
        
        // 在开发环境中提供更详细的错误信息
        if (process.env.NODE_ENV === 'development') {
          console.group('🚨 React错误详情');
          console.error('错误:', error);
          console.error('错误信息:', errorInfo);
          console.error('组件堆栈:', errorInfo.componentStack);
          console.groupEnd();
        }
      }

      render() {
        if ((this.state as any).hasError) {
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

        return (this.props as any).children;
      }
    };
  }
}

// 自动初始化（仅在浏览器环境中）
if (typeof window !== 'undefined') {
  // 等待DOM加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      SafeDOM.initialize();
    });
  } else {
    SafeDOM.initialize();
  }
}

// 导出默认实例
export default SafeDOM;

// 声明全局类型（用于TypeScript）
declare global {
  interface Window {
    SafeDOM: typeof SafeDOM;
    React: any;
  }
}

// 将SafeDOM添加到全局对象
if (typeof window !== 'undefined') {
  window.SafeDOM = SafeDOM;
}