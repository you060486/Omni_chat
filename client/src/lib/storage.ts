import { Conversation, AIModel, Message, ModelSettings } from "@shared/schema";

export const storage = {
  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await fetch("/api/conversations");
      if (!response.ok) throw new Error("Failed to fetch conversations");
      const conversations = await response.json();
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
      console.error("Error fetching conversations:", error);
      return [];
    }
  },

  async createConversation(model: AIModel, settings?: ModelSettings): Promise<Conversation> {
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, settings }),
      });
      if (!response.ok) throw new Error("Failed to create conversation");
      const conversation = await response.json();
      return {
        ...conversation,
        createdAt: new Date(conversation.createdAt),
        updatedAt: new Date(conversation.updatedAt),
        messages: conversation.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      };
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }
  },

  async deleteConversation(id: string): Promise<void> {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete conversation");
    } catch (error) {
      console.error("Error deleting conversation:", error);
      throw error;
    }
  },

  async getConversation(id: string): Promise<Conversation | undefined> {
    const conversations = await this.getConversations();
    return conversations.find((c) => c.id === id);
  },

  async addMessage(conversationId: string, message: Omit<Message, "id">): Promise<void> {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      });
      if (!response.ok) throw new Error("Failed to add message");
    } catch (error) {
      console.error("Error adding message:", error);
      throw error;
    }
  },

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<void> {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update conversation");
    } catch (error) {
      console.error("Error updating conversation:", error);
      throw error;
    }
  },
};
