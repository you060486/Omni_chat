import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { tavily } from "@tavily/core";
import { createRequire } from "module";
import { setupAuth } from "./auth";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 25 * 1024 * 1024, // 25MB - для поддержки base64 изображений в истории
  }
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const tavilyClient = tavily({ 
  apiKey: process.env.TAVILY_API_KEY || ""
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Chat endpoint - send message and get AI response (with streaming)
  app.post("/api/chat", upload.array("files"), async (req, res) => {
    try {
      const { model, messages: messageHistory, content, images, settings } = JSON.parse(req.body.data || "{}");
      const files = req.files as Express.Multer.File[] || [];
      
      // Extract settings
      const {
        systemPrompt,
        temperature = 1,
        maxTokens,
        topP = 1,
        reasoningEffort = "medium"
      } = settings || {};

      // Process uploaded files
      const processedContent = [...(content || [])];
      
      // Add images from base64
      if (images && images.length > 0) {
        for (const imageData of images) {
          processedContent.push({
            type: "image",
            url: imageData,
          });
        }
      }

      // Process file uploads (PDF, text files)
      for (const file of files) {
        if (file.mimetype === "application/pdf") {
          const pdfData = await pdfParse(file.buffer);
          processedContent.push({
            type: "text",
            text: `[Содержимое файла ${file.originalname}]:\n${pdfData.text}`,
          });
        } else if (file.mimetype.startsWith("text/")) {
          const textContent = file.buffer.toString("utf-8");
          processedContent.push({
            type: "text",
            text: `[Содержимое файла ${file.originalname}]:\n${textContent}`,
          });
        } else if (file.mimetype.startsWith("image/")) {
          const base64 = file.buffer.toString("base64");
          const dataUrl = `data:${file.mimetype};base64,${base64}`;
          processedContent.push({
            type: "image",
            url: dataUrl,
          });
        }
      }

      // Use message history from client
      const messages = messageHistory || [];

      // Set up SSE for streaming
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let fullResponse = "";

      try {
        if (model === "gemini") {
          // Gemini model with settings
          const modelConfig: any = { model: "gemini-2.5-pro" };
          
          // Add system instruction if provided
          if (systemPrompt) {
            modelConfig.systemInstruction = systemPrompt;
          }
          
          const geminiModel = genAI.getGenerativeModel(modelConfig);
          
          // Convert message history to Gemini format  
          const chatHistory = messages.map((msg: any) => {
            const textContent = msg.content.filter((c: any) => c.type === "text").map((c: any) => c.text).join("\n");
            return {
              role: msg.role === "user" ? "user" : "model",
              parts: [{ text: textContent }],
            };
          });

          // Prepare generation config
          const generationConfig: any = {};
          if (temperature !== 1) generationConfig.temperature = temperature;
          if (maxTokens) generationConfig.maxOutputTokens = maxTokens;
          if (topP !== 1) generationConfig.topP = topP;

          const chat = geminiModel.startChat({ 
            history: chatHistory,
            generationConfig: Object.keys(generationConfig).length > 0 ? generationConfig : undefined
          });
          
          // Prepare current message
          const parts: any[] = [];
          for (const content of processedContent) {
            if (content.type === "text") {
              parts.push({ text: (content as any).text });
            } else if (content.type === "image") {
              // Convert data URL to inline data for Gemini
              const base64Data = (content as any).url.split(",")[1];
              const mimeType = (content as any).url.split(";")[0].split(":")[1];
              parts.push({
                inlineData: {
                  data: base64Data,
                  mimeType: mimeType,
                },
              });
            }
          }

          const result = await chat.sendMessageStream(parts);
          
          for await (const chunk of result.stream) {
            const text = chunk.text();
            fullResponse += text;
            res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
          }
        } else {
          // OpenAI models (gpt-5, gpt-5-mini, o3-mini)
          const modelMap: Record<string, string> = {
            "gpt-5": "gpt-5-2025-08-07",
            "gpt-5-mini": "gpt-5-mini-2025-08-07",
            "o3-mini": "o3-mini-2025-01-31",
          };

          // Convert message history to OpenAI format
          const openaiMessages: any[] = [];
          
          // Add system message if provided
          if (systemPrompt) {
            openaiMessages.push({ role: "system", content: systemPrompt });
          }
          
          // Add message history
          openaiMessages.push(...messages.map((msg: any) => {
            const content: any[] = msg.content.map((c: any) => {
              if (c.type === "text") {
                return { type: "text", text: c.text };
              } else {
                return { type: "image_url", image_url: { url: c.url } };
              }
            });
            return { role: msg.role, content };
          }));

          // Add current message
          const currentContent: any[] = processedContent.map((c: any) => {
            if (c.type === "text") {
              return { type: "text", text: c.text };
            } else {
              return { type: "image_url", image_url: { url: c.url } };
            }
          });
          openaiMessages.push({ role: "user", content: currentContent });

          // Define web search tool
          const tools = [{
            type: "function" as const,
            function: {
              name: "web_search",
              description: "Search the web for current information, news, facts, or any information not in your knowledge base. Use this when you need up-to-date or specific information.",
              parameters: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "The search query to find relevant information"
                  }
                },
                required: ["query"]
              }
            }
          }];

          // Prepare API parameters
          const apiParams: any = {
            model: modelMap[model] || "gpt-5-2025-08-07",
            messages: openaiMessages,
            tools: tools,
            stream: true,
          };
          
          // Add optional parameters
          if (temperature !== 1) apiParams.temperature = temperature;
          if (maxTokens) apiParams.max_tokens = maxTokens;
          if (topP !== 1) apiParams.top_p = topP;
          
          // Add reasoning_effort for o3-mini
          if (model === "o3-mini" && reasoningEffort) {
            apiParams.reasoning_effort = reasoningEffort;
          }
          
          const stream = await openai.chat.completions.create(apiParams);

          let toolCalls: any[] = [];
          let currentToolCall: any = null;

          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta;
            
            // Handle tool calls
            if (delta?.tool_calls) {
              for (const toolCall of delta.tool_calls) {
                if (toolCall.index !== undefined) {
                  if (!toolCalls[toolCall.index]) {
                    toolCalls[toolCall.index] = {
                      id: toolCall.id || "",
                      type: "function",
                      function: { name: "", arguments: "" }
                    };
                  }
                  
                  if (toolCall.id) {
                    toolCalls[toolCall.index].id = toolCall.id;
                  }
                  
                  if (toolCall.function?.name) {
                    toolCalls[toolCall.index].function.name = toolCall.function.name;
                  }
                  
                  if (toolCall.function?.arguments) {
                    toolCalls[toolCall.index].function.arguments += toolCall.function.arguments;
                  }
                }
              }
            }
            
            // Handle regular content
            const content = delta?.content || "";
            if (content) {
              fullResponse += content;
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          }

          // Execute tool calls if any
          if (toolCalls.length > 0) {
            for (const toolCall of toolCalls) {
              if (toolCall.function.name === "web_search") {
                const args = JSON.parse(toolCall.function.arguments);
                
                // Notify user about search
                res.write(`data: ${JSON.stringify({ content: `\n\n🔍 Поиск в интернете: "${args.query}"\n\n` })}\n\n`);
                
                // Execute search
                const searchResult = await tavilyClient.search(args.query, {
                  searchDepth: "advanced",
                  maxResults: 5,
                  includeAnswer: true,
                });

                // Add tool response to messages
                openaiMessages.push({
                  role: "assistant",
                  content: null,
                  tool_calls: [toolCall]
                });

                openaiMessages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: JSON.stringify({
                    answer: searchResult.answer,
                    results: searchResult.results?.map((r: any) => ({
                      title: r.title,
                      url: r.url,
                      content: r.content
                    }))
                  })
                });

                // Continue conversation with search results
                const followUpStream = await openai.chat.completions.create({
                  model: modelMap[model] || "gpt-5-2025-08-07",
                  messages: openaiMessages,
                  stream: true,
                });

                for await (const chunk of followUpStream) {
                  const content = chunk.choices[0]?.delta?.content || "";
                  if (content) {
                    fullResponse += content;
                    res.write(`data: ${JSON.stringify({ content })}\n\n`);
                  }
                }
              }
            }
          }
        }

        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      } catch (error) {
        console.error("Error generating AI response:", error);
        // Only send error if connection is still open and no response was sent yet
        if (!res.writableEnded && !fullResponse) {
          res.write(`data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`);
          res.end();
        } else if (!res.writableEnded) {
          // If some response was already sent, just close gracefully
          res.end();
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to process message" });
      }
    }
  });

  // Generate image using Gemini 2.5 Flash Image (Nano Banana)
  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
      
      const result = await model.generateContent(prompt);
      const response = result.response;

      // Extract image data from response
      const parts = response.candidates?.[0]?.content?.parts;
      const imageData = parts?.find((part: any) => part.inlineData);
      
      if (imageData && imageData.inlineData) {
        const base64Image = imageData.inlineData.data;
        const mimeType = imageData.inlineData.mimeType || "image/png";
        const dataUrl = `data:${mimeType};base64,${base64Image}`;
        
        res.json({ imageUrl: dataUrl });
      } else {
        throw new Error("No image data in response");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });

  // Preset prompts API
  const verifyAdminPassword = (password: string) => {
    return password === process.env.ADMIN_PASSWORD;
  };

  // Get all preset prompts
  app.get("/api/presets", async (req, res) => {
    try {
      const { storage } = await import("./storage.js");
      const presets = await storage.getPresetPrompts();
      res.json(presets);
    } catch (error) {
      console.error("Error fetching presets:", error);
      res.status(500).json({ error: "Failed to fetch presets" });
    }
  });

  // Get single preset prompt
  app.get("/api/presets/:id", async (req, res) => {
    try {
      const { storage } = await import("./storage.js");
      const preset = await storage.getPresetPrompt(req.params.id);
      
      if (!preset) {
        return res.status(404).json({ error: "Preset not found" });
      }
      
      res.json(preset);
    } catch (error) {
      console.error("Error fetching preset:", error);
      res.status(500).json({ error: "Failed to fetch preset" });
    }
  });

  // Create preset prompt (admin only)
  app.post("/api/presets", async (req, res) => {
    try {
      const { password, ...presetData } = req.body;
      
      if (!verifyAdminPassword(password)) {
        return res.status(401).json({ error: "Неверный пароль администратора" });
      }

      const { storage } = await import("./storage.js");
      const { insertPresetPromptSchema } = await import("@shared/schema");
      
      const validatedData = insertPresetPromptSchema.parse(presetData);
      const preset = await storage.createPresetPrompt(validatedData);
      
      res.json(preset);
    } catch (error) {
      console.error("Error creating preset:", error);
      res.status(500).json({ error: "Failed to create preset" });
    }
  });

  // Update preset prompt (admin only)
  app.put("/api/presets/:id", async (req, res) => {
    try {
      const { password, ...updates } = req.body;
      
      if (!verifyAdminPassword(password)) {
        return res.status(401).json({ error: "Неверный пароль администратора" });
      }

      const { storage } = await import("./storage.js");
      const { updatePresetPromptSchema } = await import("@shared/schema");
      
      const validatedUpdates = updatePresetPromptSchema.parse(updates);
      const preset = await storage.updatePresetPrompt(req.params.id, validatedUpdates);
      
      res.json(preset);
    } catch (error) {
      console.error("Error updating preset:", error);
      res.status(500).json({ error: "Failed to update preset" });
    }
  });

  // Delete preset prompt (admin only)
  app.delete("/api/presets/:id", async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!verifyAdminPassword(password)) {
        return res.status(401).json({ error: "Неверный пароль администратора" });
      }

      const { storage } = await import("./storage.js");
      await storage.deletePresetPrompt(req.params.id);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting preset:", error);
      res.status(500).json({ error: "Failed to delete preset" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
