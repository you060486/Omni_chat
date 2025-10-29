import { Conversation, AIModel, Message } from "@shared/schema";

const CONVERSATIONS_KEY = "ai-chat-conversations";

export const storage = {
  getConversations(): Conversation[] {
    try {
      const data = localStorage.getItem(CONVERSATIONS_KEY);
      if (!data) return [];
      const conversations = JSON.parse(data);
      // Parse dates back to Date objects
      return conversations.map((conv: any) => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messages: conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }));
    } catch (error) {
      console.error("Error reading conversations from localStorage:", error);
      return [];
    }
  },

  saveConversations(conversations: Conversation[]): void {
    try {
      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    } catch (error) {
      console.error("Error saving conversations to localStorage:", error);
    }
  },

  createConversation(model: AIModel): Conversation {
    const conversations = this.getConversations();
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: "Новый разговор",
      messages: [],
      model,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const updated = [newConversation, ...conversations];
    this.saveConversations(updated);
    return newConversation;
  },

  deleteConversation(id: string): void {
    const conversations = this.getConversations();
    const filtered = conversations.filter((c) => c.id !== id);
    this.saveConversations(filtered);
  },

  getConversation(id: string): Conversation | undefined {
    const conversations = this.getConversations();
    return conversations.find((c) => c.id === id);
  },

  addMessage(conversationId: string, message: Message): void {
    const conversations = this.getConversations();
    const convIndex = conversations.findIndex((c) => c.id === conversationId);
    
    if (convIndex === -1) return;

    const conversation = conversations[convIndex];
    conversation.messages.push(message);
    conversation.updatedAt = new Date();

    // Update title based on first user message
    if (conversation.messages.length === 1 && message.role === "user") {
      const firstTextContent = message.content.find((c) => c.type === "text");
      if (firstTextContent && firstTextContent.type === "text") {
        conversation.title = firstTextContent.text.slice(0, 50);
      }
    }

    conversations[convIndex] = conversation;
    this.saveConversations(conversations);
  },

  updateConversation(id: string, updates: Partial<Conversation>): void {
    const conversations = this.getConversations();
    const convIndex = conversations.findIndex((c) => c.id === id);
    
    if (convIndex === -1) return;

    conversations[convIndex] = {
      ...conversations[convIndex],
      ...updates,
      updatedAt: new Date(),
    };
    
    this.saveConversations(conversations);
  },
};
