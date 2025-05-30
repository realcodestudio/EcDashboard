import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const iconDir = path.join(__dirname, 'src-tauri', 'icons');
const svgFile = path.join(iconDir, 'icon.svg');

// 确保图标目录存在
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// 生成PNG图标
execSync(`svgexport ${svgFile} ${path.join(iconDir, '32x32.png')} 32:32`);
execSync(`svgexport ${svgFile} ${path.join(iconDir, '128x128.png')} 128:128`);
execSync(`svgexport ${svgFile} ${path.join(iconDir, '128x128@2x.png')} 256:256`);

// 生成ICO文件（Windows）
execSync(`svgexport ${svgFile} ${path.join(iconDir, 'icon.ico')} 256:256`);

// 生成ICNS文件（macOS）
execSync(`svgexport ${svgFile} ${path.join(iconDir, 'icon.icns')} 1024:1024`);

console.log('图标生成完成！'); 