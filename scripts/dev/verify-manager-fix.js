/**
 * 验证Chrome扩展manager.html文件修复状态
 * 检查文件存在性和静态资源完整性
 */

const fs = require('fs');
const path = require('path');

// 配置路径
const EXTENSION_DIR = path.join(__dirname, 'extension');
const MANAGER_HTML = path.join(EXTENSION_DIR, 'manager.html');
const STATIC_DIR = path.join(EXTENSION_DIR, 'nextstatic', 'static');

/**
 * 检查文件是否存在
 * @param {string} filePath - 文件路径
 * @returns {boolean} 文件是否存在
 */
function checkFileExists(filePath) {
    try {
        return fs.existsSync(filePath);
    } catch (error) {
        console.error(`检查文件失败: ${filePath}`, error.message);
        return false;
    }
}

/**
 * 从HTML内容中提取静态资源引用
 * @param {string} htmlContent - HTML内容
 * @returns {Array} 静态资源路径数组
 */
function extract