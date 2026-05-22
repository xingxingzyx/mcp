#!/usr/bin/env node

/**
 * 快速发布脚本 - 一键发布 Slidev 内容到小红书
 */

import { extractSlidevContent, convertToXiaohongshuFormat, extractImages } from './publish-helper.js';
import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query) {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log('🚀 小红书自动发布工具\n');
  
  // 获取文件路径
  const filePath = process.argv[2] || await askQuestion('请输入 Slidev Markdown 文件路径: ');
  
  if (!filePath) {
    console.error('❌ 错误：未提供文件路径');
    process.exit(1);
  }
  
  try {
    // 提取内容
    console.log(`\n📖 正在读取文件: ${filePath}`);
    const slidevData = await extractSlidevContent(filePath);
    const xhsData = convertToXiaohongshuFormat(slidevData);
    const images = extractImages(slidevData.body);
    
    console.log('✅ 内容提取成功');
    console.log(`   标题: ${xhsData.title}`);
    console.log(`   内容长度: ${xhsData.content.length} 字符`);
    console.log(`   图片数量: ${images.length}`);
    
    // 询问发布类型
    const publishType = await askQuestion('\n请选择操作 (1-直接发布 / 2-保存草稿): ');
    
    const postData = {
      title: xhsData.title,
      content: xhsData.content,
      tags: xhsData.tags.length > 0 ? xhsData.tags : ['技术分享', 'Slidev'],
      imagePaths: images,
    };
    
    if (publishType === '2') {
      // 保存草稿
      console.log('\n💾 正在保存草稿...');
      
      const draftData = {
        ...postData,
        status: 'draft',
        createdAt: new Date().toISOString(),
      };
      
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const outputDir = path.join(process.cwd(), 'xiaohongshu-drafts');
      await fs.mkdir(outputDir, { recursive: true });
      
      const filename = `draft-${Date.now()}-${xhsData.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.json`;
      const outputPath = path.join(outputDir, filename);
      
      await fs.writeFile(outputPath, JSON.stringify(draftData, null, 2), 'utf-8');
      
      console.log('✅ 草稿已保存');
      console.log(`   文件: ${outputPath}`);
    } else {
      // 直接发布（模拟）
      console.log('\n📤 正在发布到小红书...');
      
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const outputDir = path.join(process.cwd(), 'xiaohongshu-posts');
      await fs.mkdir(outputDir, { recursive: true });
      
      const filename = `${Date.now()}-${xhsData.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.json`;
      const outputPath = path.join(outputDir, filename);
      
      const publishData = {
        ...postData,
        status: 'published',
        publishTime: new Date().toISOString(),
      };
      
      await fs.writeFile(outputPath, JSON.stringify(publishData, null, 2), 'utf-8');
      
      console.log('✅ 发布成功（模拟）');
      console.log(`   文件: ${outputPath}`);
      console.log('\n⚠️  注意: 当前为模拟模式，实际发布需要集成小红书 API');
    }
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main().catch(console.error);
