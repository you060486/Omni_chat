import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { insertMessageSchema, type AIModel } from "@shared/schema";
import { z } from "zod";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const upload = multer({ storage: multer.memoryStorage() });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all conversations
  app.get("/api/conversations", async (req, res) => {
    try {
      const conversations = await storage.getConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", async (req, res) => {
    try {
      const { model } = req.body as { model: AIModel };
      const conversation = await storage.createConversation(model);
      res.json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", async (req, res) => {
    try {
      await storage.deleteConversation(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Send message and get AI response (with streaming)
  app.post("/api/conversations/:id/messages", upload.array("files"), async (req, res) => {
    try {
      const conversationId = req.params.id;
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const { content, images } = JSON.parse(req.body.data || "{}");
      const files = req.files as Express.Multer.File[] || [];

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

      // Save user message
      const userMessage = await storage.addMessage(conversationId, {
        role: "user",
        content: processedContent,
        timestamp: new Date(),
      });

      // Get conversation history for context
      const messages = await storage.getMessages(conversationId);

      // Set up SSE for streaming
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let fullResponse = "";

      try {
        if (conversation.model === "gemini") {
          // Gemini model
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
          
          // Convert message history to Gemini format
          const chatHistory = messages.slice(0, -1).map((msg) => {
            const textContent = msg.content.filter((c) => c.type === "text").map((c: any) => c.text).join("\n");
            return {
              role: msg.role === "user" ? "user" : "model",
              parts: [{ text: textContent }],
            };
          });

          const chat = model.startChat({ history: chatHistory });
          
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
            "gpt-5": "gpt-4o",
            "gpt-5-mini": "gpt-4o-mini",
            "o3-mini": "gpt-4o-mini",
          };

          // Convert message history to OpenAI format
          const openaiMessages: any[] = messages.slice(0, -1).map((msg) => {
            const content: any[] = msg.content.map((c) => {
              if (c.type === "text") {
                return { type: "text", text: (c as any).text };
              } else {
                return { type: "image_url", image_url: { url: (c as any).url } };
              }
            });
            return { role: msg.role, content };
          });

          // Add current message
          const currentContent: any[] = processedContent.map((c) => {
            if (c.type === "text") {
              return { type: "text", text: (c as any).text };
            } else {
              return { type: "image_url", image_url: { url: (c as any).url } };
            }
          });
          openaiMessages.push({ role: "user", content: currentContent });

          const stream = await openai.chat.completions.create({
            model: modelMap[conversation.model] || "gpt-4o",
            messages: openaiMessages,
            stream: true,
          });

          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              fullResponse += content;
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          }
        }

        // Save assistant message
        await storage.addMessage(conversationId, {
          role: "assistant",
          content: [{ type: "text", text: fullResponse }],
          model: conversation.model,
          timestamp: new Date(),
        });

        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      } catch (error) {
        console.error("Error generating AI response:", error);
        res.write(`data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`);
        res.end();
      }
    } catch (error) {
      console.error("Error processing message:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to process message" });
      }
    }
  });

  // Generate image using Gemini Imagen
  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const model = genAI.getGenerativeModel({ model: "imagen-3.0-generate-001" });
      
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      // Extract image data from response
      const response = result.response;
      const imageData = response.candidates?.[0]?.content?.parts?.[0];
      
      if (imageData && "inlineData" in imageData) {
        const base64Image = imageData.inlineData?.data;
        const mimeType = imageData.inlineData?.mimeType || "image/png";
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

  const httpServer = createServer(app);
  return httpServer;
}
