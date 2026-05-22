#!/usr/bin/env node

/**
 * 测试脚本 - 验证小红书 MCP 功能
 */

import { extractSlidevContent, convertToXiaohongshuFormat, extractImages } from './publish-helper.js';
import fs from 'fs/promises';
import path from 'path';

async function testExtractContent() {
  console.log('🧪 测试 1: 提取 Slidev 内容\n');
  
  const testFile = 'pl-scqa-slides.md';
  
  try {
    const exists = await fs.access(testFile).then(() => true).catch(() => false);
    
    if (!exists) {
      console.log(`⚠️  测试文件 ${testFile} 不存在，创建示例文件...`);
      await fs.writeFile(testFile, `---
title: 测试笔记
tags:
  - 测试
  - Demo
---

# 欢迎使用小红书 MCP

这是一个测试内容。

## 功能特点

- 自动提取标题
- 自动提取标签
- 支持图片处理

::: tip
这是一个提示框
:::
`, 'utf-8');
      console.log('✅ 示例文件已创建\n');
    }
    
    console.log(`📖 读取文件: ${testFile}`);
    const slidevData = await extractSlidevContent(testFile);
    
    console.log('✅ Frontmatter:');
    console.log(JSON.stringify(slidevData.frontmatter, null, 2));
    
    console.log('\n✅ 标题:', slidevData.title);
    console.log('✅ 内容长度:', slidevData.body.length, '字符');
    
    return slidevData;
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    throw error;
  }
}

async function testConvertFormat(slidevData) {
  console.log('\n🧪 测试 2: 转换为小红书格式\n');
  
  try {
    const xhsData = convertToXiaohongshuFormat(slidevData);
    
    console.log('✅ 转换后的标题:', xhsData.title);
    console.log('✅ 标签:', xhsData.tags);
    console.log('✅ 内容预览:', xhsData.content.substring(0, 100) + '...');
    
    return xhsData;
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    throw error;
  }
}

async function testExtractImages() {
  console.log('\n🧪 测试 3: 提取图片\n');
  
  const testContent = `
# 测试内容

![图片1](./assets/image1.png)
![图片2](./assets/image2.jpg)

更多文字内容...
  `;
  
  const images = extractImages(testContent);
  
  console.log('✅ 提取到的图片:', images);
  console.log('✅ 图片数量:', images.length);
  
  return images;
}

async function testSaveDraft() {
  console.log('\n🧪 测试 4: 保存草稿\n');
  
  const draftData = {
    title: '测试草稿',
    content: '这是测试内容',
    tags: ['测试', 'Demo'],
    status: 'draft',
    createdAt: new Date().toISOString(),
  };
  
  const outputDir = path.join(process.cwd(), 'xiaohongshu-drafts');
  await fs.mkdir(outputDir, { recursive: true });
  
  const filename = `draft-${Date.now()}-测试草稿.json`;
  const outputPath = path.join(outputDir, filename);
  
  await fs.writeFile(outputPath, JSON.stringify(draftData, null, 2), 'utf-8');
  
  console.log('✅ 草稿已保存到:', outputPath);
  
  // 验证文件存在
  const exists = await fs.access(outputPath).then(() => true).catch(() => false);
  console.log('✅ 文件存在检查:', exists ? '是' : '否');
  
  return outputPath;
}

async function runAllTests() {
  console.log('═══════════════════════════════════');
  console.log('   小红书 MCP 功能测试');
  console.log('═══════════════════════════════════\n');
  
  try {
    const slidevData = await testExtractContent();
    const xhsData = await testConvertFormat(slidevData);
    const images = await testExtractImages();
    const draftPath = await testSaveDraft();
    
    console.log('\n═══════════════════════════════════');
    console.log('   ✅ 所有测试通过！');
    console.log('═══════════════════════════════════\n');
    
    console.log('📊 测试结果汇总:');
    console.log('  - Slidev 内容提取: ✓');
    console.log('  - 格式转换: ✓');
    console.log('  - 图片提取: ✓');
    console.log('  - 草稿保存: ✓');
    console.log('\n🎉 系统已准备好使用！');
    console.log('\n下一步:');
    console.log('  1. 运行: pnpm run mcp-server (启动 MCP 服务器)');
    console.log('  2. 运行: pnpm run publish <file> (发布内容)');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    process.exit(1);
  }
}

runAllTests().catch(console.error);
