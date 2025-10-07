/**
 * 创建Chrome扩展图标
 * 生成简单的SVG图标并保存为不同尺寸的PNG文件
 */

const fs = require('fs');
const path = require('path');

// 创建简单的SVG图标
const svgContent = `
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <!-- 背景圆形 -->
  <circle cx="64" cy="64" r="60" fill="#3B82F6" stroke="#2563EB" stroke-width="4"/>

  <!-- Tab图标设计 -->
  <g transform="translate(32, 32)">
    <!-- 主Tab -->
    <rect x="8" y="16" width="48" height="36" rx="4" fill="white" opacity="0.9"/>
    <rect x="12" y="20" width="40" height="28" rx="2" fill="#3B82F6"/>

    <!-- 子Tab -->
    <rect x="0" y="24" width="32" height="28" rx="3" fill="white" opacity="0.8"/>
    <rect x="3" y="27" width="26" height="22" rx="1" fill="#60A5FA"/>

    <!-- 小Tab -->
    <rect x="40" y="8" width="24" height="20" rx="2" fill="white" opacity="0.7"/>
    <rect x="42" y="10" width="20" height="16" rx="1" fill="#93C5FD"/>
  </g>

  <!-- 高光效果 -->
  <ellipse cx="48" cy="40" rx="12" ry="8" fill="white" opacity="0.3"/>
</svg>
`;

// 创建不同尺寸的图标文件
function createIcon(size) {
  const iconPath = path.join(__dirname, '../extension/icons', `icon${size}.png`);

  // 由于我们无法直接生成PNG，我们先创建SVG文件
  const svgPath = path.join(__dirname, '../extension/icons', `icon${size}.svg`);

  const svgWithSize = svgContent.replace('width="128" height="128"', `width="${size}" height="${size}"`);

  fs.writeFileSync(svgPath, svgWithSize.trim());
  console.log(`✅ 已创建SVG图标: icon${size}.svg`);
}

// 创建所有尺寸的图标
function createAllIcons() {
  const sizes = [16, 32, 48, 128];

  const iconsDir = path.join(__dirname, '../extension/icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  sizes.forEach(size => {
    createIcon(size);
  });

  console.log('🎨 所有图标已创建完成');
  console.log('📝 注意：当前生成的是SVG格式，实际使用时需要转换为PNG格式');
  console.log('💡 建议：使用在线工具或专业软件将SVG转换为PNG');
}

// 如果直接运行此脚本
if (require.main === module) {
  createAllIcons();
}

module.exports = { createAllIcons };