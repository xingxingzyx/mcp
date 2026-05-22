import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 从Slidev Markdown文件中提取内容
 */
export async function extractSlidevContent(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    
    // 解析Slidev frontmatter
    const lines = content.split('\n');
    let frontmatter = {};
    let bodyStart = 0;
    
    if (lines[0] === '---') {
      let endIndex = 1;
      for (let i = 1; i < lines.length; i++) {
        if (lines[i] === '---') {
          endIndex = i;
          break;
        }
      }
      
      const frontmatterLines = lines.slice(1, endIndex).join('\n');
      // 简单解析YAML frontmatter
      frontmatter = parseSimpleYAML(frontmatterLines);
      bodyStart = endIndex + 1;
    }
    
    const body = lines.slice(bodyStart).join('\n').trim();
    
    return {
      frontmatter,
      body,
      fullContent: content,
      title: frontmatter.title || extractFirstHeading(body),
    };
  } catch (error) {
    console.error('Error reading slidev file:', error);
    throw error;
  }
}

/**
 * 提取第一个标题
 */
function extractFirstHeading(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1] : 'Untitled';
}

/**
 * 简单解析YAML（处理基本的键值对）
 */
function parseSimpleYAML(yaml) {
  const result = {};
  const lines = yaml.split('\n');
  
  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const [, key, value] = match;
      result[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
  }
  
  return result;
}

/**
 * 将Slidev内容转换为小红书笔记格式
 */
export function convertToXiaohongshuFormat({ title, body, frontmatter }) {
  // 移除Markdown中的frontmatter分隔符
  let content = body;
  
  // 可以将一些Slidev特定的语法转换为普通Markdown
  content = content.replace(/:::\s*(\w+)\s*/g, '\n**$1**\n');
  content = content.replace(/@\[\w+\]/g, '');
  
  return {
    title,
    content,
    tags: frontmatter.tags || [],
  };
}

/**
 * 提取图片路径
 */
export function extractImages(content) {
  const imageRegex = /!\[.*?\]\((.*?)\)/g;
  const images = [];
  let match;
  
  while ((match = imageRegex.exec(content)) !== null) {
    images.push(match[1]);
  }
  
  return images;
}

// CLI模式：如果直接运行此脚本
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.error('Usage: node publish-helper.js <markdown-file>');
    process.exit(1);
  }
  
  try {
    const slidevData = await extractSlidevContent(filePath);
    const xhsData = convertToXiaohongshuFormat(slidevData);
    const images = extractImages(slidevData.body);
    
    console.log('Extracted Content:');
    console.log('Title:', xhsData.title);
    console.log('Tags:', xhsData.tags);
    console.log('Images:', images);
    console.log('\nContent Preview:');
    console.log(xhsData.content.substring(0, 500) + '...');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}
