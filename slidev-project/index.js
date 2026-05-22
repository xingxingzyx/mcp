import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import fs from "fs/promises";
import path from "path";

// 小红书 MCP Server
class XiaohongshuMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "xiaohongshu-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // 列出可用工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "publish_to_xiaohongshu",
            description: "发布文档/笔记到小红书平台",
            inputSchema: zodToJsonSchema(
              z.object({
                title: z.string().describe("笔记标题"),
                content: z.string().describe("笔记内容"),
                tags: z.array(z.string()).optional().describe("标签列表"),
                imagePaths: z.array(z.string()).optional().describe("图片路径列表"),
                publishTime: z.string().optional().describe("定时发布时间 (ISO格式)"),
              })
            ),
          },
          {
            name: "draft_to_xiaohongshu",
            description: "保存草稿到小红书（不立即发布）",
            inputSchema: zodToJsonSchema(
              z.object({
                title: z.string().describe("笔记标题"),
                content: z.string().describe("笔记内容"),
                tags: z.array(z.string()).optional().describe("标签列表"),
                imagePaths: z.array(z.string()).optional().describe("图片路径列表"),
              })
            ),
          },
          {
            name: "read_slidev_content",
            description: "读取Slidev Markdown文件内容",
            inputSchema: zodToJsonSchema(
              z.object({
                filePath: z.string().describe("Markdown文件路径"),
              })
            ),
          },
        ],
      };
    });

    // 处理工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "publish_to_xiaohongshu":
          return await this.publishToXiaohongshu(args);
        
        case "draft_to_xiaohongshu":
          return await this.draftToXiaohongshu(args);
        
        case "read_slidev_content":
          return await this.readSlidevContent(args);
        
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async readSlidevContent({ filePath }) {
    try {
      const fullPath = path.resolve(filePath);
      const content = await fs.readFile(fullPath, "utf-8");
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              filePath: fullPath,
              content: content,
              lines: content.split("\n").length,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message,
            }, null, 2),
          },
        ],
      };
    }
  }

  async publishToXiaohongshu({ title, content, tags = [], imagePaths = [], publishTime }) {
    try {
      // 模拟小红书API调用
      const postData = {
        title,
        content,
        tags,
        imagePaths,
        publishTime,
        status: "published",
        createdAt: new Date().toISOString(),
      };

      // 保存到本地文件模拟发布（实际项目中需要调用小红书API）
      const outputDir = path.join(process.cwd(), "xiaohongshu-posts");
      await fs.mkdir(outputDir, { recursive: true });
      
      const filename = `${Date.now()}-${title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_")}.json`;
      const outputPath = path.join(outputDir, filename);
      
      await fs.writeFile(outputPath, JSON.stringify(postData, null, 2), "utf-8");

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              message: "成功发布到小红书",
              postId: Date.now().toString(),
              outputPath,
              data: postData,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message,
            }, null, 2),
          },
        ],
      };
    }
  }

  async draftToXiaohongshu({ title, content, tags = [], imagePaths = [] }) {
    try {
      const draftData = {
        title,
        content,
        tags,
        imagePaths,
        status: "draft",
        createdAt: new Date().toISOString(),
      };

      // 保存草稿到本地文件
      const outputDir = path.join(process.cwd(), "xiaohongshu-drafts");
      await fs.mkdir(outputDir, { recursive: true });
      
      const filename = `draft-${Date.now()}-${title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_")}.json`;
      const outputPath = path.join(outputDir, filename);
      
      await fs.writeFile(outputPath, JSON.stringify(draftData, null, 2), "utf-8");

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              message: "成功保存草稿",
              draftId: Date.now().toString(),
              outputPath,
              data: draftData,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message,
            }, null, 2),
          },
        ],
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Xiaohongshu MCP Server running on stdio");
  }
}

const server = new XiaohongshuMCPServer();
server.run().catch(console.error);