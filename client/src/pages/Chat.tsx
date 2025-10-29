import { useState, useEffect, useRef } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { VoiceInput } from "@/components/VoiceInput";
import { SavePresetDialog } from "@/components/SavePresetDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Message, AIModel, Conversation } from "@shared/schema";
import { Bot, Loader2, Save } from "lucide-react";
import { sendMessage } from "@/lib/api";
import { storage } from "@/lib/storage";

interface ChatProps {
  conversation?: Conversation;
  selectedModel: AIModel;
  onConversationUpdate: () => void;
  onImageGenerated?: (url: string) => void;
}

export default function Chat({ conversation, selectedModel, onConversationUpdate, onImageGenerated }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>(conversation?.messages || []);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [savePresetOpen, setSavePresetOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const streamingTextRef = useRef<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversation) {
      setMessages(conversation.messages);
      setStreamingText("");
      streamingTextRef.current = "";
      setIsStreaming(false);
    }
  }, [conversation?.id, conversation?.messages]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages, streamingText]);

  const handleSendMessage = async (text: string, files?: File[], images?: string[]) => {
    if (!conversation) return;

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

    // Save user message to API
    await storage.addMessage(conversation.id, userMessage);
    setMessages((prev) => [...prev, userMessage]);
    onConversationUpdate();
    
    setIsStreaming(true);
    setStreamingText("");
    streamingTextRef.current = "";

    await sendMessage({
      model: selectedModel,
      messages: [...messages, userMessage],
      content: userContent,
      images,
      files,
      settings: conversation.settings,
      onChunk: (chunk) => {
        streamingTextRef.current += chunk;
        setStreamingText(streamingTextRef.current);
      },
      onDone: async () => {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: [{ type: "text", text: streamingTextRef.current }],
          model: selectedModel,
          timestamp: new Date(),
        };
        
        // Save AI message to API
        await storage.addMessage(conversation.id, aiMessage);
        setMessages((prev) => [...prev, aiMessage]);
        onConversationUpdate();
        
        setStreamingText("");
        streamingTextRef.current = "";
        setIsStreaming(false);
      },
      onError: async (error) => {
        console.error("Error sending message:", error);
        setStreamingText("");
        streamingTextRef.current = "";
        setIsStreaming(false);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: [{ type: "text", text: "Извините, произошла ошибка при обработке вашего запроса." }],
          model: selectedModel,
          timestamp: new Date(),
        };
        
        // Save error message to API
        await storage.addMessage(conversation.id, errorMessage);
        setMessages((prev) => [...prev, errorMessage]);
        onConversationUpdate();
      },
    });
  };

  const handleVoiceTranscript = (text: string) => {
    handleSendMessage(text);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
          <SidebarTrigger data-testid="button-sidebar-toggle" />
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <h1 className="font-semibold">AI Chat</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {conversation?.settings && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSavePresetOpen(true)}
              data-testid="button-save-preset"
            >
              <Save className="h-4 w-4" />
              Сохранить промпт
            </Button>
          )}
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        {messages.length === 0 && !isStreaming ? (
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
            {isStreaming && streamingText && (
              <ChatMessage
                message={{
                  id: "streaming",
                  role: "assistant",
                  content: [{ type: "text", text: streamingText }],
                  model: selectedModel,
                  timestamp: new Date(),
                }}
              />
            )}
            {isStreaming && !streamingText && (
              <div className="flex gap-4 px-6 py-6">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Думаю...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ChatInput
        onSendMessage={handleSendMessage}
        onVoiceClick={() => setVoiceOpen(true)}
        disabled={isStreaming || !conversation}
      />

      <VoiceInput
        open={voiceOpen}
        onOpenChange={setVoiceOpen}
        onTranscript={handleVoiceTranscript}
      />

      {conversation?.settings && (
        <SavePresetDialog
          open={savePresetOpen}
          onOpenChange={setSavePresetOpen}
          modelSettings={conversation.settings}
          onSuccess={onConversationUpdate}
        />
      )}
    </div>
  );
}
