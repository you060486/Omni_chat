import { Conversation, Message, AIModel } from "@shared/schema";

export async function getConversations(): Promise<Conversation[]> {
  const response = await fetch("/api/conversations");
  if (!response.ok) throw new Error("Failed to fetch conversations");
  return response.json();
}

export async function createConversation(model: AIModel): Promise<Conversation> {
  const response = await fetch("/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model }),
  });
  if (!response.ok) throw new Error("Failed to create conversation");
  return response.json();
}

export async function deleteConversation(id: string): Promise<void> {
  const response = await fetch(`/api/conversations/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete conversation");
}

export interface SendMessageOptions {
  conversationId: string;
  content: any[];
  images?: string[];
  files?: File[];
  onChunk?: (text: string) => void;
  onDone?: () => void;
  onError?: (error: Error) => void;
}

export async function sendMessage(options: SendMessageOptions): Promise<void> {
  const { conversationId, content, images, files, onChunk, onDone, onError } = options;

  const formData = new FormData();
  formData.append("data", JSON.stringify({ content, images }));

  if (files) {
    files.forEach((file) => {
      formData.append("files", file);
    });
  }

  try {
    const response = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Failed to send message");
    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = JSON.parse(line.slice(6));
          
          if (data.error) {
            onError?.(new Error(data.error));
            return;
          }
          
          if (data.done) {
            onDone?.();
            return;
          }
          
          if (data.content) {
            onChunk?.(data.content);
          }
        }
      }
    }
  } catch (error) {
    onError?.(error as Error);
  }
}

export async function generateImage(prompt: string): Promise<string> {
  const response = await fetch("/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) throw new Error("Failed to generate image");
  
  const data = await response.json();
  return data.imageUrl;
}
