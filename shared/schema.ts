import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, serial } from "drizzle-orm/pg-core";
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

export type PresetPromptStatus = "admin" | "approved" | "pending" | "rejected";

export const presetPrompts = pgTable("preset_prompts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  modelSettings: jsonb("model_settings").notNull().$type<ModelSettings>(),
  status: text("status").notNull().$type<PresetPromptStatus>().default("admin"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPresetPromptSchema = createInsertSchema(presetPrompts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: z.enum(["admin", "approved", "pending", "rejected"]).optional(),
});

export const updatePresetPromptSchema = insertPresetPromptSchema.partial();

export type InsertPresetPrompt = z.infer<typeof insertPresetPromptSchema>;
export type UpdatePresetPrompt = z.infer<typeof updatePresetPromptSchema>;
export type PresetPrompt = typeof presetPrompts.$inferSelect;

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  model: text("model").notNull().$type<AIModel>(),
  settings: jsonb("settings").$type<ModelSettings>(),
  messages: jsonb("messages").notNull().$type<Message[]>().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateConversationSchema = insertConversationSchema.partial().omit({
  userId: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type UpdateConversation = z.infer<typeof updateConversationSchema>;
export type ConversationDB = typeof conversations.$inferSelect;

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
