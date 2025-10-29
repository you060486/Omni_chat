import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type AIModel = "gpt-5" | "gpt-5-mini" | "o3-mini" | "gemini";

export type ReasoningEffort = "low" | "medium" | "high";

export interface ModelSettings {
  systemPrompt?: string;
  temperature?: number; // 0-2
  maxTokens?: number;
  topP?: number; // 0-1
  reasoningEffort?: ReasoningEffort; // для o3-mini
}

export type MessageRole = "user" | "assistant";

export type MessageContent = {
  type: "text";
  text: string;
} | {
  type: "image";
  url: string;
  alt?: string;
};

export interface Message {
  id: string;
  role: MessageRole;
  content: MessageContent[];
  model?: AIModel;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: AIModel;
  settings?: ModelSettings;
  createdAt: Date;
  updatedAt: Date;
}

export const insertMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.array(z.union([
    z.object({
      type: z.literal("text"),
      text: z.string(),
    }),
    z.object({
      type: z.literal("image"),
      url: z.string(),
      alt: z.string().optional(),
    }),
  ])),
  model: z.enum(["gpt-5", "gpt-5-mini", "o3-mini", "gemini"]).optional(),
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
