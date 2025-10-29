import { type User, type InsertUser, type Conversation, type Message, type AIModel } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Conversation management
  getConversations(): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  createConversation(model: AIModel): Promise<Conversation>;
  updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation>;
  deleteConversation(id: string): Promise<void>;
  
  // Message management
  addMessage(conversationId: string, message: Omit<Message, "id">): Promise<Message>;
  getMessages(conversationId: string): Promise<Message[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private conversations: Map<string, Conversation>;

  constructor() {
    this.users = new Map();
    this.conversations = new Map();
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

  async createConversation(model: AIModel): Promise<Conversation> {
    const id = randomUUID();
    const now = new Date();
    const conversation: Conversation = {
      id,
      title: "Новый чат",
      messages: [],
      model,
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
}

export const storage = new MemStorage();
