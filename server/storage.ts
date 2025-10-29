import { 
  type User, 
  type InsertUser, 
  type Conversation, 
  type ConversationDB,
  type InsertConversation,
  type UpdateConversation,
  type Message, 
  type AIModel,
  type PresetPrompt,
  type InsertPresetPrompt,
  type UpdatePresetPrompt,
  type ModelSettings,
  users,
  presetPrompts,
  conversations,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db, pool } from "./db";
import { eq, desc, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import createMemoryStore from "memorystore";

const PostgresSessionStore = connectPg(session);
const MemoryStore = createMemoryStore(session);

export interface IStorage {
  sessionStore: session.Store;
  
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Conversation management
  getConversations(userId: string): Promise<Conversation[]>;
  getConversation(id: string, userId: string): Promise<Conversation | undefined>;
  createConversation(userId: string, model: AIModel, settings?: ModelSettings): Promise<Conversation>;
  updateConversation(id: string, userId: string, updates: Partial<Conversation>): Promise<Conversation>;
  deleteConversation(id: string, userId: string): Promise<void>;
  
  // Message management
  addMessage(conversationId: string, userId: string, message: Omit<Message, "id">): Promise<Message>;
  getMessages(conversationId: string, userId: string): Promise<Message[]>;
  
  // Preset prompts management
  getPresetPrompts(): Promise<PresetPrompt[]>;
  getPresetPrompt(id: string): Promise<PresetPrompt | undefined>;
  createPresetPrompt(preset: InsertPresetPrompt): Promise<PresetPrompt>;
  updatePresetPrompt(id: string, updates: UpdatePresetPrompt): Promise<PresetPrompt>;
  deletePresetPrompt(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  sessionStore: session.Store;
  private users: Map<string, User>;
  private conversations: Map<string, Conversation>;
  private presetPrompts: Map<string, PresetPrompt>;

  constructor() {
    this.sessionStore = new MemoryStore({ checkPeriod: 86400000 });
    this.users = new Map();
    this.conversations = new Map();
    this.presetPrompts = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .filter(c => (c as any).userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async getConversation(id: string, userId: string): Promise<Conversation | undefined> {
    const conv = this.conversations.get(id);
    if (conv && (conv as any).userId === userId) {
      return conv;
    }
    return undefined;
  }

  async createConversation(userId: string, model: AIModel, settings?: ModelSettings): Promise<Conversation> {
    const id = randomUUID();
    const now = new Date();
    const conversation: any = {
      id,
      userId,
      title: "Новый чат",
      messages: [],
      model,
      settings,
      createdAt: now,
      updatedAt: now,
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async updateConversation(id: string, userId: string, updates: Partial<Conversation>): Promise<Conversation> {
    const conversation = this.conversations.get(id);
    if (!conversation || (conversation as any).userId !== userId) {
      throw new Error(`Conversation ${id} not found`);
    }
    const updated = {
      ...conversation,
      ...updates,
      updatedAt: new Date(),
    };
    this.conversations.set(id, updated);
    return updated;
  }

  async deleteConversation(id: string, userId: string): Promise<void> {
    const conversation = this.conversations.get(id);
    if (conversation && (conversation as any).userId === userId) {
      this.conversations.delete(id);
    }
  }

  async addMessage(conversationId: string, userId: string, message: Omit<Message, "id">): Promise<Message> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation || (conversation as any).userId !== userId) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const newMessage: Message = {
      ...message,
      id: randomUUID(),
    };

    conversation.messages.push(newMessage);
    conversation.updatedAt = new Date();

    if (conversation.messages.length === 1 && message.role === "user") {
      const textContent = message.content.find((c) => c.type === "text");
      if (textContent && textContent.type === "text") {
        conversation.title = textContent.text.slice(0, 50);
      }
    }

    this.conversations.set(conversationId, conversation);
    return newMessage;
  }

  async getMessages(conversationId: string, userId: string): Promise<Message[]> {
    const conversation = this.conversations.get(conversationId);
    if (conversation && (conversation as any).userId === userId) {
      return conversation.messages || [];
    }
    return [];
  }

  async getPresetPrompts(): Promise<PresetPrompt[]> {
    return Array.from(this.presetPrompts.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getPresetPrompt(id: string): Promise<PresetPrompt | undefined> {
    return this.presetPrompts.get(id);
  }

  async createPresetPrompt(preset: InsertPresetPrompt): Promise<PresetPrompt> {
    const id = randomUUID();
    const now = new Date();
    const presetPrompt: PresetPrompt = {
      id,
      name: preset.name,
      description: preset.description ?? null,
      modelSettings: preset.modelSettings as ModelSettings,
      createdAt: now,
      updatedAt: now,
    };
    this.presetPrompts.set(id, presetPrompt);
    return presetPrompt;
  }

  async updatePresetPrompt(id: string, updates: UpdatePresetPrompt): Promise<PresetPrompt> {
    const preset = this.presetPrompts.get(id);
    if (!preset) {
      throw new Error(`Preset prompt ${id} not found`);
    }
    const updated: PresetPrompt = {
      ...preset,
      ...(updates.name && { name: updates.name }),
      ...(updates.description !== undefined && { description: updates.description ?? null }),
      ...(updates.modelSettings && { modelSettings: updates.modelSettings as ModelSettings }),
      updatedAt: new Date(),
    };
    this.presetPrompts.set(id, updated);
    return updated;
  }

  async deletePresetPrompt(id: string): Promise<void> {
    this.presetPrompts.delete(id);
  }
}

// DatabaseStorage implementation using Drizzle ORM
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ pool, createTableIfMissing: true });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Conversation management (PostgreSQL)
  async getConversations(userId: string): Promise<Conversation[]> {
    const dbConversations = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));
    
    return dbConversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      messages: conv.messages as Message[],
      model: conv.model as AIModel,
      settings: conv.settings as ModelSettings | undefined,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    }));
  }

  async getConversation(id: string, userId: string): Promise<Conversation | undefined> {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));
    
    if (!conv) return undefined;
    
    return {
      id: conv.id,
      title: conv.title,
      messages: conv.messages as Message[],
      model: conv.model as AIModel,
      settings: conv.settings as ModelSettings | undefined,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    };
  }

  async createConversation(userId: string, model: AIModel, settings?: ModelSettings): Promise<Conversation> {
    const [created] = await db
      .insert(conversations)
      .values({
        userId,
        title: "Новый чат",
        model,
        settings,
        messages: [],
      })
      .returning();
    
    return {
      id: created.id,
      title: created.title,
      messages: created.messages as Message[],
      model: created.model as AIModel,
      settings: created.settings as ModelSettings | undefined,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  async updateConversation(id: string, userId: string, updates: Partial<Conversation>): Promise<Conversation> {
    const [updated] = await db
      .update(conversations)
      .set({
        ...(updates.title && { title: updates.title }),
        ...(updates.messages && { messages: updates.messages }),
        ...(updates.settings !== undefined && { settings: updates.settings }),
        updatedAt: new Date(),
      })
      .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
      .returning();
    
    if (!updated) {
      throw new Error(`Conversation ${id} not found`);
    }
    
    return {
      id: updated.id,
      title: updated.title,
      messages: updated.messages as Message[],
      model: updated.model as AIModel,
      settings: updated.settings as ModelSettings | undefined,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async deleteConversation(id: string, userId: string): Promise<void> {
    await db
      .delete(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));
  }

  async addMessage(conversationId: string, userId: string, message: Omit<Message, "id">): Promise<Message> {
    const conversation = await this.getConversation(conversationId, userId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const newMessage: Message = {
      ...message,
      id: randomUUID(),
    };

    const updatedMessages = [...conversation.messages, newMessage];
    let title = conversation.title;

    if (conversation.messages.length === 0 && message.role === "user") {
      const textContent = message.content.find((c) => c.type === "text");
      if (textContent && textContent.type === "text") {
        title = textContent.text.slice(0, 50);
      }
    }

    await db
      .update(conversations)
      .set({
        messages: updatedMessages,
        title,
        updatedAt: new Date(),
      })
      .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)));

    return newMessage;
  }

  async getMessages(conversationId: string, userId: string): Promise<Message[]> {
    const conversation = await this.getConversation(conversationId, userId);
    return conversation?.messages || [];
  }

  // Preset prompts management (PostgreSQL)
  async getPresetPrompts(): Promise<PresetPrompt[]> {
    const prompts = await db.select().from(presetPrompts).orderBy(desc(presetPrompts.createdAt));
    return prompts;
  }

  async getPresetPrompt(id: string): Promise<PresetPrompt | undefined> {
    const [prompt] = await db.select().from(presetPrompts).where(eq(presetPrompts.id, id));
    return prompt || undefined;
  }

  async createPresetPrompt(preset: InsertPresetPrompt): Promise<PresetPrompt> {
    const [created] = await db.insert(presetPrompts).values({
      name: preset.name,
      description: preset.description,
      modelSettings: preset.modelSettings,
    }).returning();
    return created;
  }

  async updatePresetPrompt(id: string, updates: UpdatePresetPrompt): Promise<PresetPrompt> {
    const updateData: any = { updatedAt: new Date() };
    if (updates.name) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.modelSettings) updateData.modelSettings = updates.modelSettings;

    const [updated] = await db
      .update(presetPrompts)
      .set(updateData)
      .where(eq(presetPrompts.id, id))
      .returning();
    
    if (!updated) {
      throw new Error(`Preset prompt ${id} not found`);
    }
    
    return updated;
  }

  async deletePresetPrompt(id: string): Promise<void> {
    await db.delete(presetPrompts).where(eq(presetPrompts.id, id));
  }
}

export const storage = new DatabaseStorage();
