import { 
  type User, 
  type InsertUser, 
  type Conversation, 
  type Message, 
  type AIModel,
  type PresetPrompt,
  type InsertPresetPrompt,
  type UpdatePresetPrompt,
  type ModelSettings,
  users,
  presetPrompts,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Conversation management
  getConversations(): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  createConversation(model: AIModel, settings?: ModelSettings): Promise<Conversation>;
  updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation>;
  deleteConversation(id: string): Promise<void>;
  
  // Message management
  addMessage(conversationId: string, message: Omit<Message, "id">): Promise<Message>;
  getMessages(conversationId: string): Promise<Message[]>;
  
  // Preset prompts management
  getPresetPrompts(): Promise<PresetPrompt[]>;
  getPresetPrompt(id: string): Promise<PresetPrompt | undefined>;
  createPresetPrompt(preset: InsertPresetPrompt): Promise<PresetPrompt>;
  updatePresetPrompt(id: string, updates: UpdatePresetPrompt): Promise<PresetPrompt>;
  deletePresetPrompt(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private conversations: Map<string, Conversation>;
  private presetPrompts: Map<string, PresetPrompt>;

  constructor() {
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

  async getConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async createConversation(model: AIModel, settings?: ModelSettings): Promise<Conversation> {
    const id = randomUUID();
    const now = new Date();
    const conversation: Conversation = {
      id,
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

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation> {
    const conversation = this.conversations.get(id);
    if (!conversation) {
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

  async deleteConversation(id: string): Promise<void> {
    this.conversations.delete(id);
  }

  async addMessage(conversationId: string, message: Omit<Message, "id">): Promise<Message> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const newMessage: Message = {
      ...message,
      id: randomUUID(),
    };

    conversation.messages.push(newMessage);
    conversation.updatedAt = new Date();

    // Update title based on first user message
    if (conversation.messages.length === 1 && message.role === "user") {
      const textContent = message.content.find((c) => c.type === "text");
      if (textContent && textContent.type === "text") {
        conversation.title = textContent.text.slice(0, 50);
      }
    }

    this.conversations.set(conversationId, conversation);
    return newMessage;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    const conversation = this.conversations.get(conversationId);
    return conversation?.messages || [];
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

  // Conversation management (in-memory for now)
  private conversations: Map<string, Conversation> = new Map();

  async getConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async createConversation(model: AIModel, settings?: ModelSettings): Promise<Conversation> {
    const id = randomUUID();
    const now = new Date();
    const conversation: Conversation = {
      id,
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

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation> {
    const conversation = this.conversations.get(id);
    if (!conversation) {
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

  async deleteConversation(id: string): Promise<void> {
    this.conversations.delete(id);
  }

  async addMessage(conversationId: string, message: Omit<Message, "id">): Promise<Message> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
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

  async getMessages(conversationId: string): Promise<Message[]> {
    const conversation = this.conversations.get(conversationId);
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
    const [created] = await db.insert(presetPrompts).values(preset).returning();
    return created;
  }

  async updatePresetPrompt(id: string, updates: UpdatePresetPrompt): Promise<PresetPrompt> {
    const [updated] = await db
      .update(presetPrompts)
      .set({ ...updates, updatedAt: new Date() })
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
