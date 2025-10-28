import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { VoiceInput } from "@/components/VoiceInput";
import { ImageGenerator } from "@/components/ImageGenerator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Message, AIModel, Conversation } from "@shared/schema";
import { Bot } from "lucide-react";

interface ChatProps {
  conversation?: Conversation;
  selectedModel: AIModel;
}

export default function Chat({ conversation, selectedModel }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>(conversation?.messages || []);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [imageGenOpen, setImageGenOpen] = useState(false);

  const handleSendMessage = (text: string, files?: File[], images?: string[]) => {
    // todo: remove mock functionality
    const userContent: any[] = [];
    
    if (text.trim()) {
      userContent.push({ type: "text", text });
    }
    
    if (images) {
      images.forEach((url) => {
        userContent.push({ type: "image", url });
      });
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Имитация ответа AI
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: [
          {
            type: "text",
            text: "Это демонстрационный ответ. В полной версии приложения здесь будет реальный ответ от выбранной AI модели.",
          },
        ],
        model: selectedModel,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  const handleVoiceTranscript = (text: string) => {
    handleSendMessage(text);
  };

  const handleImageGenerated = (url: string) => {
    handleSendMessage("", undefined, [url]);
  };

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
          <SidebarTrigger data-testid="button-sidebar-toggle" />
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <h1 className="font-semibold">AI Chat</h1>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <ScrollArea className="flex-1">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Bot className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h2 className="mb-2 text-xl font-semibold">
                Начните новый разговор
              </h2>
              <p className="text-sm text-muted-foreground">
                Выберите модель AI и отправьте сообщение для начала
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-0 py-6">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>
        )}
      </ScrollArea>

      <ChatInput
        onSendMessage={handleSendMessage}
        onVoiceClick={() => setVoiceOpen(true)}
        onImageGenClick={() => setImageGenOpen(true)}
      />

      <VoiceInput
        open={voiceOpen}
        onOpenChange={setVoiceOpen}
        onTranscript={handleVoiceTranscript}
      />

      <ImageGenerator
        open={imageGenOpen}
        onOpenChange={setImageGenOpen}
        onImageGenerated={handleImageGenerated}
      />
    </div>
  );
}
