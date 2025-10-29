import { AIModel, Message, ModelSettings } from "@shared/schema";

export interface SendMessageOptions {
  model: AIModel;
  messages: Message[];
  content: any[];
  images?: string[];
  files?: File[];
  settings?: ModelSettings;
  onChunk?: (text: string) => void;
  onDone?: () => void;
  onError?: (error: Error) => void;
}

export async function sendMessage(options: SendMessageOptions): Promise<void> {
  const { model, messages, content, images, files, settings, onChunk, onDone, onError } = options;

  const formData = new FormData();
  formData.append("data", JSON.stringify({ model, messages, content, images, settings }));

  if (files) {
    files.forEach((file) => {
      formData.append("files", file);
    });
  }

  try {
    const response = await fetch(`/api/chat`, {
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
